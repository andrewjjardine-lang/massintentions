import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import MarkPaidButton from "./MarkPaidButton";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function SecretaryMassPage({
  params,
}: {
  params: Promise<{ massId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { massId } = await params;

  const mass = await prisma.mass.findUnique({
    where: { id: massId },
    include: { parish: true, intentions: { orderBy: { createdAt: "asc" } } },
  });

  if (!mass) notFound();

  // Restrict to assigned parish unless super admin
  if (
    session.user.role !== "SUPER_ADMIN" &&
    mass.parishId !== session.user.parishId
  ) {
    redirect("/secretary");
  }

  const paid = mass.intentions.filter((i) => i.paymentStatus === "PAID").length;
  const pending = mass.intentions.filter((i) => i.paymentStatus === "PENDING").length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb + title */}
      <div>
        <Link href="/secretary" className="text-sm text-amber-700 hover:text-amber-900 transition-colors">
          ← Secretary Dashboard
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mt-2">
          {mass.parish.name}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {formatDate(mass.scheduledAt)} at {formatTime(mass.scheduledAt)}
          {mass.description ? ` — ${mass.description}` : ""}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Intentions", value: mass.intentions.length, sub: `of ${mass.maxIntentions}` },
          { label: "Confirmed Paid", value: paid, sub: "intentions", color: "text-green-700" },
          { label: "Awaiting Payment", value: pending, sub: "intentions", color: pending > 0 ? "text-amber-700" : "text-stone-500" },
        ].map((stat) => (
          <div key={stat.label} className="card px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${stat.color ?? "text-stone-800"}`}>{stat.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Intentions list */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-serif font-semibold text-stone-700">
            Intention List
            <span className="text-stone-400 font-normal text-sm ml-2 font-sans">
              (for bulletin / Mass readings)
            </span>
          </h2>
          <button
            onClick={() => {/* print handled client-side */}}
            className="btn-secondary text-xs print:hidden"
            id="print-btn"
          >
            🖨 Print
          </button>
        </div>

        {mass.intentions.length === 0 ? (
          <div className="px-5 py-12 text-center text-stone-400">
            <p className="text-3xl mb-2">🕊️</p>
            <p>No intentions have been submitted yet.</p>
          </div>
        ) : (
          <ol className="divide-y divide-stone-100">
            {mass.intentions.map((intention, i) => (
              <li key={intention.id} className="flex gap-4 px-5 py-4">
                <span className="text-stone-400 text-sm w-5 shrink-0 pt-0.5 tabular-nums">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm">
                    {intention.honoreeName}
                    <span className="ml-2 text-xs text-stone-400 font-normal">
                      {intention.intentionType === "DECEASED" ? "† Deceased" : "Living"}
                    </span>
                  </p>
                  {intention.specialNote && (
                    <p className="text-xs text-stone-500 italic mt-0.5">{intention.specialNote}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-1">
                    Requested by {intention.requesterName}
                    {" · "}
                    <a href={`mailto:${intention.requesterEmail}`} className="hover:text-stone-600">
                      {intention.requesterEmail}
                    </a>
                    {intention.requesterPhone && ` · ${intention.requesterPhone}`}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1.5">
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                      intention.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-700"
                        : intention.paymentStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {intention.paymentMethod === "CASH" ? "Cash" : "Online"} ·{" "}
                    {intention.paymentStatus}
                  </span>
                  {intention.paymentMethod === "CASH" && intention.paymentStatus === "PENDING" && (
                    <MarkPaidButton intentionId={intention.id} />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {mass.intentions.length < mass.maxIntentions && (
        <p className="text-center text-sm text-stone-400">
          {mass.maxIntentions - mass.intentions.length} more intention
          {mass.maxIntentions - mass.intentions.length !== 1 ? "s" : ""} can still be accepted.
        </p>
      )}

      <PrintScript />
    </div>
  );
}

function PrintScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.getElementById('print-btn')?.addEventListener('click', () => window.print())`,
      }}
    />
  );
}
