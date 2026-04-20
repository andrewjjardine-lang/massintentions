import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SecretaryPage() {
  const parishes = await prisma.parish.findMany({
    orderBy: { name: "asc" },
    include: {
      masses: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        include: {
          _count: { select: { intentions: true } },
        },
        take: 60,
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Parish Secretary</h1>
        <p className="text-stone-500 text-sm mt-1">
          View and manage Mass intentions for upcoming Masses.
        </p>
      </div>

      {parishes.map((parish) => (
        <div key={parish.id} className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2">
            {parish.name}
          </h2>

          {parish.masses.length === 0 ? (
            <p className="text-stone-400 text-sm">No upcoming Masses.</p>
          ) : (
            <div className="space-y-2">
              {parish.masses.map((mass) => {
                const slots = mass.maxIntentions - mass._count.intentions;
                return (
                  <Link
                    key={mass.id}
                    href={`/secretary/masses/${mass.id}`}
                    className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-5 py-3.5 hover:border-stone-400 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <p className="font-medium text-stone-800 text-sm group-hover:text-stone-900">
                        {formatDate(mass.scheduledAt)} — {formatTime(mass.scheduledAt)}
                      </p>
                      {mass.description && (
                        <p className="text-xs text-stone-400 mt-0.5">{mass.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-800">
                        {mass._count.intentions}/{mass.maxIntentions}
                      </p>
                      <p className="text-xs text-stone-400">
                        {slots > 0 ? `${slots} open` : "Full"}
                      </p>
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
