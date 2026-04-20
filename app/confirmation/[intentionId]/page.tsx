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

  const isCash = intention.paymentMethod === "CASH";
  const isPaid = intention.paymentStatus === "PAID";

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-amber-50 border-2 border-amber-300 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm">
        {isCash ? "📋" : "✅"}
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">
          {isCash ? "Request Received" : "Intention Confirmed"}
        </h1>
        <p className="text-stone-500 text-[15px] leading-relaxed">
          {isCash
            ? "Your Mass intention has been submitted. Please bring $10 cash to the parish office within 3 business days to confirm your booking."
            : "Your Mass intention and payment have been received. The parish secretary will include your intention in the Mass."}
        </p>
      </div>

      {/* Details card */}
      <div className="card text-left divide-y divide-stone-100">
        {[
          { label: "Parish", value: intention.mass.parish.name },
          {
            label: "Mass",
            value: `${formatDate(intention.mass.scheduledAt)} at ${formatTime(intention.mass.scheduledAt)}`,
          },
          { label: "Intention offered for", value: intention.honoreeName },
          {
            label: "Type",
            value: intention.intentionType === "DECEASED" ? "For the Deceased (R.I.P.)" : "For the Living",
          },
          {
            label: "Payment",
            value: isPaid ? "Paid — $10.00" : isCash ? "Cash due at parish office" : "Pending",
            highlight: isPaid ? "green" : isCash ? "amber" : undefined,
          },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-start px-5 py-3.5 gap-4">
            <span className="text-stone-500 text-sm shrink-0">{row.label}</span>
            <span
              className={`font-medium text-sm text-right ${
                row.highlight === "green"
                  ? "text-green-700"
                  : row.highlight === "amber"
                    ? "text-amber-700"
                    : "text-stone-800"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-5 py-3.5">
          <span className="text-stone-400 text-xs">Reference</span>
          <span className="text-stone-300 font-mono text-xs">{intention.id}</span>
        </div>
      </div>

      <p className="text-xs text-stone-400 leading-relaxed">
        The parish secretary has been notified. Your intention will be read aloud
        during Mass and may be included in the parish bulletin.
      </p>

      <Link href="/" className="btn-primary inline-block">
        Submit Another Intention
      </Link>
    </div>
  );
}
