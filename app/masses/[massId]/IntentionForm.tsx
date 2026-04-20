"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  massId: string;
  parishName: string;
  massDate: string;
  massTime: string;
  massDescription: string | null;
  spotsLeft: number;
  maxIntentions: number;
}

export default function IntentionForm({
  massId,
  parishName,
  massDate,
  massTime,
  massDescription,
  spotsLeft,
  maxIntentions,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    honoreeName: "",
    intentionType: "LIVING" as "LIVING" | "DECEASED",
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    specialNote: "",
    paymentMethod: "PLLENTY" as "CASH" | "PLLENTY",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ massId, ...form }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (form.paymentMethod === "PLLENTY") {
        const payRes = await fetch("/api/payment/pllenty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentionId: data.id }),
        });
        const payData = await payRes.json();
        if (payData.checkoutUrl) {
          window.location.href = payData.checkoutUrl;
          return;
        }
      }

      router.push(`/confirmation/${data.id}`);
    } catch {
      setError("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  const spotsUsed = maxIntentions - spotsLeft;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mass summary card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="font-serif font-medium text-stone-800 text-lg">{parishName}</p>
        <p className="text-stone-600 text-sm mt-0.5">
          {massDate} at {massTime}
          {massDescription ? ` — ${massDescription}` : ""}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex gap-1.5">
            {Array.from({ length: maxIntentions }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < spotsUsed ? "bg-amber-600" : "bg-stone-300"}`}
              />
            ))}
          </div>
          <span className="text-xs text-stone-500">
            {spotsLeft} of {maxIntentions} spots available
          </span>
          <span className="ml-auto font-semibold text-stone-800 text-sm">$10.00</span>
        </div>
      </div>

      {/* Honoree section */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-stone-800">Intention</h2>
          <p className="text-xs text-stone-500 mt-0.5">Who is this Mass offered for?</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">
            Name of the person
          </label>
          <input
            type="text"
            required
            placeholder="Full name"
            value={form.honoreeName}
            onChange={(e) => set("honoreeName", e.target.value)}
            className="field"
          />
        </div>

        <div className="flex gap-4">
          {(["LIVING", "DECEASED"] as const).map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer"
            >
              <input
                type="radio"
                name="intentionType"
                value={type}
                checked={form.intentionType === type}
                onChange={() => set("intentionType", type)}
                className="accent-amber-700"
              />
              {type === "LIVING" ? "For the living" : "For the deceased (R.I.P.)"}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">
            Special note <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Birthday, Anniversary, Recently deceased…"
            value={form.specialNote}
            onChange={(e) => set("specialNote", e.target.value)}
            className="field"
          />
        </div>
      </div>

      {/* Requester section */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-stone-800">Your Information</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            So the parish can confirm your request
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Your full name</label>
            <input
              type="text"
              required
              placeholder="Jane Smith"
              value={form.requesterName}
              onChange={(e) => set("requesterName", e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Email address</label>
            <input
              type="email"
              required
              placeholder="jane@example.com"
              value={form.requesterEmail}
              onChange={(e) => set("requesterEmail", e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">
            Phone number <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="(555) 000-0000"
            value={form.requesterPhone}
            onChange={(e) => set("requesterPhone", e.target.value)}
            className="field sm:w-1/2"
          />
        </div>
      </div>

      {/* Payment section */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-stone-800">Payment</h2>
          <p className="text-xs text-stone-500 mt-0.5">Choose how you&apos;ll pay $10</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "PLLENTY", label: "Pay Online", sub: "Secure payment via Pllenty" },
              { value: "CASH", label: "Pay by Cash", sub: "Bring $10 to the parish office" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col border rounded-xl px-4 py-3.5 cursor-pointer transition-all ${
                form.paymentMethod === opt.value
                  ? "border-amber-600 bg-amber-50 ring-1 ring-amber-300"
                  : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={opt.value}
                checked={form.paymentMethod === opt.value}
                onChange={() => set("paymentMethod", opt.value)}
                className="sr-only"
              />
              <span className="font-medium text-sm text-stone-800">{opt.label}</span>
              <span className="text-xs text-stone-500 mt-0.5">{opt.sub}</span>
            </label>
          ))}
        </div>

        {form.paymentMethod === "CASH" && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
            <span className="mt-0.5">ℹ️</span>
            <span>
              Your request will be held for <strong>3 business days</strong> pending cash
              payment at the parish office.
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
        {submitting
          ? "Submitting…"
          : form.paymentMethod === "PLLENTY"
            ? "Submit & Pay Online →"
            : "Submit Request →"}
      </button>
    </form>
  );
}
