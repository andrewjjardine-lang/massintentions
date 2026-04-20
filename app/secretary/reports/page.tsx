import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportForm from "./ReportForm";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const parishes = isSuperAdmin
    ? await prisma.parish.findMany({ orderBy: { name: "asc" } })
    : session.user.parishId
      ? await prisma.parish.findMany({ where: { id: session.user.parishId } })
      : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/secretary" className="text-sm text-amber-700 hover:text-amber-900 transition-colors">
          ← Secretary Dashboard
        </a>
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mt-2">
          Intention Reports
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Generate a report of Mass intentions for any date range and export to Excel.
        </p>
      </div>

      <ReportForm parishes={parishes} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
