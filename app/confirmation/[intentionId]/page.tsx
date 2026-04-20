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

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ intentionId: string }>;
}) {
  const { intentionId } = await params;

  const intention = await prisma.massIntention.findUnique({
    where: { id: intentionId },
    include: { mass: { include: { parish: true } } },
  });

  if (!intention) notFound();

  const isPaid = intention.paymentStatus === "PAID";
  const isCash = intention.paymentMethod === "CASH";

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="text-5xl">{isCash ? "📋" : "✅"}</div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-800">
          {isCash ? "Request Submitted" : "Intention Confirmed"}
        </h1>
        <p className="text-stone-500">
          {isCash
            ? "Your Mass intention has been submitted. Please bring $10 cash to the parish office."
            : "Your Mass intention and payment have been received. Thank you."}
        </p>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl px-6 py-5 text-left space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">Parish</span>
          <span className="font-medium text-stone-800">{intention.mass.parish.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Mass</span>
          <span className="font-medium text-stone-800">
            {formatDate(intention.mass.scheduledAt)} at{" "}
            {formatTime(intention.mass.scheduledAt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Intention offered for</span>
          <span className="font-medium text-stone-800">{intention.honoreeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Type</span>
          <span className="font-medium text-stone-800">
            {intention.intentionType === "DECEASED" ? "For the Deceased" : "For the Living"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Payment</span>
          <span
            className={`font-medium ${
              isPaid ? "text-green-700" : isCash ? "text-amber-700" : "text-red-600"
            }`}
          >
            {isPaid ? "Paid ($10.00)" : isCash ? "Cash due at office" : "Pending"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Reference</span>
          <span className="text-stone-400 font-mono text-xs">{intention.id}</span>
        </div>
      </div>

      <p className="text-xs text-stone-400">
        A confirmation has been recorded. The parish secretary will receive your intention
        and include it in the Mass readings and parish bulletin.
      </p>

      <Link
        href="/"
        className="inline-block bg-stone-800 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-stone-700 transition-colors"
      >
        Submit Another Intention
      </Link>
    </div>
  );
}
