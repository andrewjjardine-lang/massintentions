import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IntentionForm from "./IntentionForm";

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

export default async function MassPage({
  params,
}: {
  params: Promise<{ massId: string }>;
}) {
  const { massId } = await params;

  const mass = await prisma.mass.findUnique({
    where: { id: massId },
    include: {
      parish: true,
      _count: { select: { intentions: true } },
    },
  });

  if (!mass) notFound();

  const spotsAvailable = mass.maxIntentions - mass._count.intentions;
  const isFull = spotsAvailable <= 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link
          href={`/parishes/${mass.parishId}`}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← {mass.parish.name}
        </Link>
        <h1 className="text-2xl font-semibold text-stone-800 mt-2">
          Request a Mass Intention
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {formatDate(mass.scheduledAt)} at {formatTime(mass.scheduledAt)}
          {mass.description ? ` — ${mass.description}` : ""}
        </p>
        <p className="text-sm mt-1">
          {isFull ? (
            <span className="text-red-500">This Mass is fully booked.</span>
          ) : (
            <span className="text-stone-500">
              {spotsAvailable} of {mass.maxIntentions} spots remaining
            </span>
          )}
        </p>
      </div>

      {isFull ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-stone-500">All intention spots for this Mass are taken.</p>
          <Link
            href={`/parishes/${mass.parishId}`}
            className="inline-block bg-stone-800 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-stone-700 transition-colors"
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
        />
      )}
    </div>
  );
}
