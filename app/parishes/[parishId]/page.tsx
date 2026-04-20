import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function ParishPage({
  params,
}: {
  params: Promise<{ parishId: string }>;
}) {
  const { parishId } = await params;
  const parish = await prisma.parish.findUnique({ where: { id: parishId } });
  if (!parish) notFound();

  const masses = await prisma.mass.findMany({
    where: { parishId, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    include: { _count: { select: { intentions: true } } },
    take: 30,
  });

  const grouped: Record<string, typeof masses> = {};
  for (const mass of masses) {
    const key = formatDate(mass.scheduledAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(mass);
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back + heading */}
      <div>
        <Link href="/" className="text-sm text-amber-700 hover:text-amber-900 transition-colors">
          ← All Parishes
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-stone-800 mt-3">
          {parish.name}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {parish.address}, {parish.city}, {parish.state}
          {parish.phone && <span> &middot; {parish.phone}</span>}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-900">
        Select an upcoming Mass below to submit your intention. Each intention costs{" "}
        <strong>$10</strong> and each Mass accepts up to 6 intentions.
      </div>

      {masses.length === 0 ? (
        <p className="text-stone-400 py-12 text-center">
          No upcoming Masses available at this time. Please check back soon.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dateMasses]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-stone-200" />
                {date}
                <span className="flex-1 h-px bg-stone-200" />
              </h2>
              <div className="space-y-2">
                {dateMasses.map((mass) => {
                  const spots = mass.maxIntentions - mass._count.intentions;
                  const isFull = spots <= 0;
                  return (
                    <div
                      key={mass.id}
                      className={`card px-5 py-4 flex items-center justify-between ${isFull ? "opacity-60" : ""}`}
                    >
                      <div>
                        <p className="font-medium text-stone-800">
                          {formatTime(mass.scheduledAt)}
                          {mass.description && (
                            <span className="text-stone-500 font-normal ml-2 text-sm">
                              {mass.description}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {Array.from({ length: mass.maxIntentions }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < mass._count.intentions
                                  ? "bg-amber-600"
                                  : "bg-stone-200"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-stone-400 ml-1">
                            {isFull ? "Fully booked" : `${spots} spot${spots !== 1 ? "s" : ""} remaining`}
                          </span>
                        </div>
                      </div>
                      {isFull ? (
                        <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full">
                          Full
                        </span>
                      ) : (
                        <Link
                          href={`/masses/${mass.id}`}
                          className="btn-primary"
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
