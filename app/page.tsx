import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const parishes = await prisma.parish.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { masses: true } } },
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 py-10 border-b border-stone-200">
        <p className="text-amber-700 text-sm font-medium tracking-widest uppercase">
          Request a Holy Mass
        </p>
        <h1 className="font-serif text-4xl font-semibold text-stone-800 leading-tight">
          Offer a Mass Intention
        </h1>
        <p className="text-stone-500 max-w-xl mx-auto leading-relaxed text-[15px]">
          A Mass intention is a special prayer offered during Holy Mass for the living
          or the deceased. Select your parish below to choose an upcoming Mass and
          submit your intention.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-stone-400 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            $10 per intention
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            Up to 6 per Mass
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            Cash or online payment
          </span>
        </div>
      </div>

      {/* Parishes */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-stone-700">Select a Parish</h2>
        {parishes.length === 0 ? (
          <p className="text-stone-400 py-12 text-center">
            No parishes are currently available. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {parishes.map((parish) => (
              <Link
                key={parish.id}
                href={`/parishes/${parish.id}`}
                className="card p-6 hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-semibold text-stone-800 text-lg group-hover:text-amber-800 transition-colors">
                      {parish.name}
                    </h3>
                    <p className="text-stone-500 text-sm mt-1">
                      {parish.address}, {parish.city}, {parish.state}
                    </p>
                    {parish.phone && (
                      <p className="text-stone-400 text-sm mt-0.5">{parish.phone}</p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-xs font-medium shrink-0 ml-3">
                    ✝
                  </div>
                </div>
                <p className="text-xs text-stone-400 mt-4 pt-4 border-t border-stone-100">
                  {parish._count.masses} upcoming Mass
                  {parish._count.masses !== 1 ? "es" : ""} available
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
        <h2 className="font-serif text-lg font-semibold text-stone-700 mb-5">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: "1", title: "Choose a Mass", body: "Browse upcoming Masses at your parish and select one that still has open intention spots." },
            { n: "2", title: "Submit Your Intention", body: "Enter the name of the person you wish to offer the Mass for — living or deceased." },
            { n: "3", title: "Pay & Confirm", body: "Pay $10 by cash at the parish office or securely online. The parish secretary will read your intention at Mass." },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="font-medium text-stone-800 text-sm">{step.title}</p>
                <p className="text-stone-500 text-sm mt-1 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
