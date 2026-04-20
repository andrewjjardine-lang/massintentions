"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkPaidButton({ intentionId }: { intentionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/intentions/${intentionId}/mark-paid`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={markPaid}
      disabled={loading}
      className="block text-xs text-stone-500 hover:text-green-700 border border-stone-200 hover:border-green-300 rounded px-2 py-0.5 hover:bg-green-50 transition-colors disabled:opacity-50"
    >
      {loading ? "Saving…" : "Mark cash paid"}
    </button>
  );
}
