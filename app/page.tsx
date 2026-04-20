import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const parishes = await prisma.parish.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { masses: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 py-8">
        <h1 className="text-3xl font-semibold text-stone-800 tracking-tight">
          Request a Mass Intention
        </h1>
        <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
          Select a parish below to view upcoming Masses and request an intention.
          Each intention is $10 and can be paid by cash or online.
        </p>
      </div>

      {parishes.length === 0 ? (
        <p className="text-center text-stone-400 py-16">No parishes found. Please check back later.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {parishes.map((parish) => (
            <Link
              key={parish.id}
              href={`/parishes/${parish.id}`}
              className="bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-400 hover:shadow-md transition-all group"
            >
              <h2 className="font-semibold text-stone-800 text-lg group-hover:text-stone-900">
                {parish.name}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {parish.address}, {parish.city}, {parish.state}
              </p>
              {parish.phone && (
                <p className="text-stone-400 text-sm mt-1">{parish.phone}</p>
              )}
              <p className="text-stone-400 text-xs mt-3">
                {parish._count.masses} upcoming Mass
                {parish._count.masses !== 1 ? "es" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
