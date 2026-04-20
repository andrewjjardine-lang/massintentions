import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IntentionForm from "./IntentionForm";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function MassPage({
  params,
}: {
  params: Promise<{ massId: string }>;
}) {
  const { massId } = await params;

  const mass = await prisma.mass.findUnique({
    where: { id: massId },
    include: { parish: true, _count: { select: { intentions: true } } },
  });

  if (!mass) notFound();

  const spotsLeft = mass.maxIntentions - mass._count.intentions;
  const isFull = spotsLeft <= 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link
          href={`/parishes/${mass.parishId}`}
          className="text-sm text-amber-700 hover:text-amber-900 transition-colors"
        >
          ← {mass.parish.name}
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mt-2">
          Request a Mass Intention
        </h1>
      </div>

      {isFull ? (
        <div className="card p-8 text-center space-y-4">
          <p className="text-4xl">🕊️</p>
          <p className="font-serif text-lg text-stone-700">This Mass is fully booked</p>
          <p className="text-stone-500 text-sm">All 6 intention spots for this Mass have been filled.</p>
          <Link
            href={`/parishes/${mass.parishId}`}
            className="btn-primary inline-block"
          >
            Choose Another Mass
          </Link>
        </div>
      ) : (
        <IntentionForm
          massId={mass.id}
          parishName={mass.parish.name}
          massDate={formatDate(mass.scheduledAt)}
          massTime={formatTime(mass.scheduledAt)}
          massDescription={mass.description}
          spotsLeft={spotsLeft}
          maxIntentions={mass.maxIntentions}
        />
      )}
    </div>
  );
}
