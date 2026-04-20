import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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

export default async function ParishPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;

  const parish = await prisma.parish.findUnique({
    where: { id: parishId },
  });

  if (!parish) notFound();

  const masses = await prisma.mass.findMany({
    where: { parishId, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { intentions: true } } },
    take: 30,
  });

  // Group masses by date
  const grouped: Record<string, typeof masses> = {};
  for (const mass of masses) {
    const dateKey = formatDate(mass.scheduledAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(mass);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
          ← All Parishes
        </Link>
        <h1 className="text-2xl font-semibold text-stone-800 mt-2">{parish.name}</h1>
        <p className="text-stone-500 text-sm mt-1">
          {parish.address}, {parish.city}, {parish.state}
        </p>
      </div>

      {masses.length === 0 ? (
        <p className="text-stone-400 py-12 text-center">
          No upcoming Masses available at this time.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dateMasses]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                {date}
              </h2>
              <div className="space-y-2">
                {dateMasses.map((mass) => {
                  const spots = mass.maxIntentions - mass._count.intentions;
                  const isFull = spots <= 0;
                  return (
                    <div
                      key={mass.id}
                      className="bg-white border border-stone-200 rounded-lg px-5 py-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-stone-800">
                          {formatTime(mass.scheduledAt)}{" "}
                          {mass.description && (
                            <span className="text-stone-500 font-normal">
                              — {mass.description}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {isFull
                            ? "Fully booked"
                            : `${spots} of ${mass.maxIntentions} spots available`}
                        </p>
                      </div>
                      {isFull ? (
                        <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                          Full
                        </span>
                      ) : (
                        <Link
                          href={`/masses/${mass.id}`}
                          className="text-sm bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
                        >
                          Request
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
