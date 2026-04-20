import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}
function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function SecretaryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const parishes = await prisma.parish.findMany({
    where: isSuperAdmin ? undefined : { id: session.user.parishId ?? "__none__" },
    orderBy: { name: "asc" },
    include: {
      masses: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        include: { _count: { select: { intentions: true } } },
        take: 60,
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">
            Secretary Dashboard
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Welcome back, {session.user.name}
            {session.user.parishName && (
              <span className="text-stone-400"> · {session.user.parishName}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/secretary/reports" className="btn-secondary text-sm">
            📊 Reports
          </Link>
          {isSuperAdmin && (
            <Link href="/admin" className="btn-secondary text-sm">
              Manage Users
            </Link>
          )}
        </div>
      </div>

      {parishes.map((parish) => (
        <div key={parish.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs">
              ✝
            </div>
            <h2 className="font-serif text-lg font-semibold text-stone-700">{parish.name}</h2>
          </div>

          {parish.masses.length === 0 ? (
            <p className="text-stone-400 text-sm pl-10">No upcoming Masses.</p>
          ) : (
            <div className="space-y-2 pl-10">
              {parish.masses.map((mass) => {
                const slots = mass.maxIntentions - mass._count.intentions;
                const pct = mass._count.intentions / mass.maxIntentions;
                return (
                  <Link
                    key={mass.id}
                    href={`/secretary/masses/${mass.id}`}
                    className="card px-5 py-4 flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all group"
                  >
                    <div>
                      <p className="font-medium text-stone-800 text-sm group-hover:text-amber-800 transition-colors">
                        {formatDate(mass.scheduledAt)} — {formatTime(mass.scheduledAt)}
                      </p>
                      {mass.description && (
                        <p className="text-xs text-stone-400 mt-0.5">{mass.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {/* Progress bar */}
                      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 1 ? "bg-red-400" : pct >= 0.5 ? "bg-amber-400" : "bg-green-400"
                          }`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-stone-700 tabular-nums w-10 text-right">
                        {mass._count.intentions}/{mass.maxIntentions}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
