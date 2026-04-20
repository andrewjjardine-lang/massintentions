import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const massId = req.nextUrl.searchParams.get("massId");
  const parishId = req.nextUrl.searchParams.get("parishId");

  const intentions = await prisma.massIntention.findMany({
    where: {
      ...(massId ? { massId } : {}),
      ...(parishId ? { mass: { parishId } } : {}),
    },
    include: {
      mass: {
        include: { parish: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(intentions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    massId,
    honoreeName,
    requesterName,
    requesterEmail,
    requesterPhone,
    intentionType,
    specialNote,
    paymentMethod,
  } = body;

  if (!massId || !honoreeName || !requesterName || !requesterEmail || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check availability
  const mass = await prisma.mass.findUnique({
    where: { id: massId },
    include: { _count: { select: { intentions: true } } },
  });

  if (!mass) {
    return NextResponse.json({ error: "Mass not found" }, { status: 404 });
  }

  if (mass._count.intentions >= mass.maxIntentions) {
    return NextResponse.json({ error: "This Mass is fully booked" }, { status: 409 });
  }

  const intention = await prisma.massIntention.create({
    data: {
      massId,
      honoreeName: honoreeName.trim(),
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim().toLowerCase(),
      requesterPhone: requesterPhone?.trim() ?? null,
      intentionType: intentionType ?? "LIVING",
      specialNote: specialNote?.trim() ?? null,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus:
        paymentMethod === "CASH" ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      amountCents: 1000,
    },
    include: {
      mass: { include: { parish: true } },
    },
  });

  return NextResponse.json(intention, { status: 201 });
}
