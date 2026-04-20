"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  massId: string;
  parishName: string;
  massDate: string;
  massTime: string;
  massDescription: string | null;
}

export default function IntentionForm({
  massId,
  parishName,
  massDate,
  massTime,
  massDescription,
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

      const intentionId = data.id;

      if (form.paymentMethod === "PLLENTY") {
        const payRes = await fetch("/api/payment/pllenty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentionId }),
        });
        const payData = await payRes.json();

        if (payData.checkoutUrl) {
          window.location.href = payData.checkoutUrl;
          return;
        }
      }

      router.push(`/confirmation/${intentionId}`);
    } catch {
      setError("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mass summary */}
      <div className="bg-stone-100 rounded-xl px-5 py-4 text-sm text-stone-600 space-y-1">
        <p className="font-medium text-stone-800">{parishName}</p>
        <p>
          {massDate} at {massTime}
          {massDescription ? ` — ${massDescription}` : ""}
        </p>
        <p className="font-semibold text-stone-800 mt-2">$10.00 per intention</p>
      </div>

      {/* Honoree */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-700">
          Mass Intention — Who is this Mass offered for?
        </legend>
        <input
          type="text"
          required
          placeholder="Full name"
          value={form.honoreeName}
          onChange={(e) => set("honoreeName", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <div className="flex gap-4">
          {(["LIVING", "DECEASED"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
              <input
                type="radio"
                name="intentionType"
                value={type}
                checked={form.intentionType === type}
                onChange={() => set("intentionType", type)}
                className="accent-stone-700"
              />
              {type === "LIVING" ? "For the living" : "For the deceased"}
            </label>
          ))}
        </div>
        <input
          type="text"
          placeholder="Special note (optional)"
          value={form.specialNote}
          onChange={(e) => set("specialNote", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </fieldset>

      {/* Requester */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-700">Your Contact Information</legend>
        <input
          type="text"
          required
          placeholder="Your full name"
          value={form.requesterName}
          onChange={(e) => set("requesterName", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.requesterEmail}
          onChange={(e) => set("requesterEmail", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={form.requesterPhone}
          onChange={(e) => set("requesterPhone", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </fieldset>

      {/* Payment method */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-stone-700">Payment Method</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "PLLENTY", label: "Pay Online", sub: "via Pllenty" },
              { value: "CASH", label: "Pay by Cash", sub: "at the parish office" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                form.paymentMethod === opt.value
                  ? "border-stone-700 bg-stone-50"
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
              <span className="text-xs text-stone-500">{opt.sub}</span>
            </label>
          ))}
        </div>
        {form.paymentMethod === "CASH" && (
          <p className="text-xs text-stone-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Please bring $10 cash to the parish office to complete your request.
            Your intention will be held for 3 business days pending payment.
          </p>
        )}
      </fieldset>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? "Submitting…"
          : form.paymentMethod === "PLLENTY"
            ? "Submit & Pay Online"
            : "Submit Request"}
      </button>
    </form>
  );
}
