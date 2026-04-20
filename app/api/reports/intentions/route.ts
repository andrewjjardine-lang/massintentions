import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const parishId = params.get("parishId");
  const format = params.get("format") ?? "json"; // "json" | "xlsx"

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // inclusive of end date

  // Determine which parishes this user can see
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const effectiveParishId = isSuperAdmin
    ? (parishId ?? undefined)
    : (session.user.parishId ?? "__none__");

  const masses = await prisma.mass.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      ...(effectiveParishId ? { parishId: effectiveParishId } : {}),
    },
    orderBy: [{ parishId: "asc" }, { scheduledAt: "asc" }],
    include: {
      parish: true,
      intentions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (format === "json") {
    return NextResponse.json(masses);
  }

  // Build Excel workbook
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryRows: (string | number)[][] = [
    ["Mass Intentions Report"],
    [`Period: ${fmtDate(start)} – ${fmtDate(end)}`],
    [],
    ["Parish", "Mass Date", "Mass Time", "Description", "Total Intentions", "Paid", "Unpaid", "Spots Remaining"],
  ];

  for (const mass of masses) {
    const paid = mass.intentions.filter((i) => i.paymentStatus === "PAID").length;
    summaryRows.push([
      mass.parish.name,
      fmtDate(mass.scheduledAt),
      fmtTime(mass.scheduledAt),
      mass.description ?? "",
      mass.intentions.length,
      paid,
      mass.intentions.length - paid,
      mass.maxIntentions - mass.intentions.length,
    ]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [
    { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 22 },
    { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ── Sheet 2: Full Intention List ──────────────────────────────────────────
  const intentionRows: (string | number)[][] = [
    ["Mass Intentions — Full List"],
    [`Period: ${fmtDate(start)} – ${fmtDate(end)}`],
    [],
    [
      "#",
      "Parish",
      "Mass Date",
      "Mass Time",
      "Mass Description",
      "Honoree Name",
      "Intention Type",
      "Special Note",
      "Requested By",
      "Email",
      "Phone",
      "Payment Method",
      "Payment Status",
      "Amount",
      "Submitted On",
    ],
  ];

  let row = 1;
  for (const mass of masses) {
    for (const intention of mass.intentions) {
      intentionRows.push([
        row++,
        mass.parish.name,
        fmtDate(mass.scheduledAt),
        fmtTime(mass.scheduledAt),
        mass.description ?? "",
        intention.honoreeName,
        intention.intentionType === "DECEASED" ? "For the Deceased" : "For the Living",
        intention.specialNote ?? "",
        intention.requesterName,
        intention.requesterEmail,
        intention.requesterPhone ?? "",
        intention.paymentMethod,
        intention.paymentStatus,
        `$${(intention.amountCents / 100).toFixed(2)}`,
        fmtDate(intention.createdAt),
      ]);
    }
  }

  const intentionSheet = XLSX.utils.aoa_to_sheet(intentionRows);
  intentionSheet["!cols"] = [
    { wch: 5 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 22 },
    { wch: 28 }, { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 28 },
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, intentionSheet, "All Intentions");

  // ── Sheet 3: Bulletin-ready (honoree names only per Mass) ─────────────────
  const bulletinRows: (string | number)[][] = [
    ["Mass Intentions — Bulletin List"],
    [`Period: ${fmtDate(start)} – ${fmtDate(end)}`],
    [],
  ];

  for (const mass of masses) {
    if (mass.intentions.length === 0) continue;
    bulletinRows.push([`${mass.parish.name} — ${fmtDate(mass.scheduledAt)} ${fmtTime(mass.scheduledAt)}${mass.description ? ` (${mass.description})` : ""}`]);
    for (const intention of mass.intentions) {
      bulletinRows.push([
        "",
        intention.intentionType === "DECEASED" ? "†" : "✦",
        intention.honoreeName,
        intention.specialNote ?? "",
      ]);
    }
    bulletinRows.push([]);
  }

  const bulletinSheet = XLSX.utils.aoa_to_sheet(bulletinRows);
  bulletinSheet["!cols"] = [{ wch: 50 }, { wch: 4 }, { wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, bulletinSheet, "Bulletin List");

  // Send as file download
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `mass-intentions-${startDate}-to-${endDate}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
