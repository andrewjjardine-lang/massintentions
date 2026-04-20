import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MarkPaidButton from "./MarkPaidButton";

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

export default async function SecretaryMassPage({
  params,
}: {
  params: Promise<{ massId: string }>;
}) {
  const { massId } = await params;

  const mass = await prisma.mass.findUnique({
    where: { id: massId },
    include: {
      parish: true,
      intentions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!mass) notFound();

  const spotsUsed = mass.intentions.length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/secretary" className="text-sm text-stone-500 hover:text-stone-700">
          ← Secretary Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-stone-800 mt-2">
          {mass.parish.name}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {formatDate(mass.scheduledAt)} at {formatTime(mass.scheduledAt)}
          {mass.description ? ` — ${mass.description}` : ""}
        </p>
        <p className="text-sm text-stone-400 mt-1">
          {spotsUsed} of {mass.maxIntentions} intentions received
        </p>
      </div>

      {/* Bulletin-ready list */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-700">Intention List</h2>
          <button
            onClick={() => window.print()}
            className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-md px-3 py-1"
          >
            Print / Export
          </button>
        </div>

        {mass.intentions.length === 0 ? (
          <p className="text-stone-400 text-sm py-4 text-center">
            No intentions have been submitted yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {mass.intentions.map((intention, i) => (
              <li
                key={intention.id}
                className="flex items-start gap-4 border-b border-stone-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-stone-400 text-sm w-5 shrink-0 pt-0.5">{i + 1}.</span>
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium text-stone-800 text-sm">
                    {intention.honoreeName}
                    <span className="ml-2 text-xs text-stone-400 font-normal">
                      {intention.intentionType === "DECEASED"
                        ? "(For the Deceased)"
                        : "(For the Living)"}
                    </span>
                  </p>
                  {intention.specialNote && (
                    <p className="text-xs text-stone-500 italic">{intention.specialNote}</p>
                  )}
                  <p className="text-xs text-stone-400">
                    Requested by {intention.requesterName} — {intention.requesterEmail}
                    {intention.requesterPhone ? ` · ${intention.requesterPhone}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      intention.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-700"
                        : intention.paymentStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {intention.paymentMethod === "CASH" ? "Cash — " : "Online — "}
                    {intention.paymentStatus}
                  </span>
                  {intention.paymentMethod === "CASH" &&
                    intention.paymentStatus === "PENDING" && (
                      <MarkPaidButton intentionId={intention.id} />
                    )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Reminder for empty slots */}
      {spotsUsed < mass.maxIntentions && (
        <p className="text-xs text-stone-400 text-center">
          {mass.maxIntentions - spotsUsed} more intention
          {mass.maxIntentions - spotsUsed !== 1 ? "s" : ""} can be accepted for this Mass.
        </p>
      )}
    </div>
  );
}
