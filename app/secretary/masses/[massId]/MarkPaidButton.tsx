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
      className="block text-xs text-stone-500 hover:text-green-700 underline disabled:opacity-50"
    >
      {loading ? "Saving…" : "Mark cash paid"}
    </button>
  );
}
