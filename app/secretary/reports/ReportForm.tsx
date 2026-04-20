"use client";

import { useState, useCallback } from "react";

interface Parish { id: string; name: string; }

interface Intention {
  id: string;
  honoreeName: string;
  intentionType: string;
  specialNote: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  paymentMethod: string;
  paymentStatus: string;
  amountCents: number;
  createdAt: string;
}

interface Mass {
  id: string;
  scheduledAt: string;
  description: string | null;
  maxIntentions: number;
  parish: { name: string };
  intentions: Intention[];
}

interface Props {
  parishes: Parish[];
  isSuperAdmin: boolean;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Default to current month
function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function ReportForm({ parishes, isSuperAdmin }: Props) {
  const dates = defaultDates();
  const [startDate, setStartDate] = useState(dates.start);
  const [endDate, setEndDate] = useState(dates.end);
  const [parishId, setParishId] = useState(parishes[0]?.id ?? "");
  const [results, setResults] = useState<Mass[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildQuery(format: string) {
    const q = new URLSearchParams({ startDate, endDate, format });
    if (isSuperAdmin && parishId) q.set("parishId", parishId);
    return `/api/reports/intentions?${q}`;
  }

  const runPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildQuery("json"));
      if (!res.ok) throw new Error((await res.json()).error);
      setResults(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, parishId]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(buildQuery("xlsx"));
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mass-intentions-${startDate}-to-${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totalIntentions = results?.reduce((s, m) => s + m.intentions.length, 0) ?? 0;
  const totalPaid = results?.reduce(
    (s, m) => s + m.intentions.filter((i) => i.paymentStatus === "PAID").length, 0
  ) ?? 0;
  const totalRevenue = results?.reduce(
    (s, m) => s + m.intentions.filter((i) => i.paymentStatus === "PAID")
      .reduce((ms, i) => ms + i.amountCents, 0), 0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Filters card */}
      <div className="card p-6 space-y-5">
        <h2 className="font-serif text-base font-semibold text-stone-800">Report Filters</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">From date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">To date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="field"
            />
          </div>
        </div>

        {isSuperAdmin && parishes.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Parish</label>
            <select
              value={parishId}
              onChange={(e) => setParishId(e.target.value)}
              className="field sm:w-1/2"
            >
              <option value="">All parishes</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quick date range shortcuts */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "This month", ...thisMonth() },
            { label: "Last month", ...lastMonth() },
            { label: "This week", ...thisWeek() },
            { label: "Next 30 days", ...next30() },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => { setStartDate(s.start); setEndDate(s.end); }}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-full text-stone-600 hover:bg-stone-100 hover:border-stone-400 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={runPreview}
            disabled={loading || !startDate || !endDate}
            className="btn-primary"
          >
            {loading ? "Loading…" : "Preview Report"}
          </button>
          {results !== null && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2"
            >
              {exporting ? "Exporting…" : (
                <>
                  <span>⬇</span>
                  Export to Excel
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Masses in period", value: results.length },
              { label: "Total intentions", value: totalIntentions },
              { label: "Revenue collected", value: `$${(totalRevenue / 100).toFixed(2)}`, sub: `${totalPaid} paid` },
            ].map((s) => (
              <div key={s.label} className="card px-4 py-3 text-center">
                <p className="text-2xl font-bold text-stone-800">{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                {s.sub && <p className="text-xs text-green-600 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>

          {results.length === 0 ? (
            <div className="card p-10 text-center text-stone-400">
              <p className="text-3xl mb-2">📋</p>
              <p>No Masses found in this date range.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((mass) => (
                <div key={mass.id} className="card overflow-hidden">
                  {/* Mass header */}
                  <div className="bg-stone-50 border-b border-stone-100 px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">
                        {mass.parish.name}
                        <span className="text-stone-400 font-normal mx-2">·</span>
                        {fmtDate(mass.scheduledAt)} at {fmtTime(mass.scheduledAt)}
                        {mass.description && (
                          <span className="text-stone-400 font-normal ml-2">— {mass.description}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-stone-500 shrink-0">
                      {mass.intentions.length}/{mass.maxIntentions} intentions
                    </span>
                  </div>

                  {mass.intentions.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-stone-400 italic">No intentions for this Mass.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-stone-100 text-left text-stone-400 uppercase tracking-wider text-[10px]">
                          <th className="px-5 py-2 font-medium">Honoree</th>
                          <th className="px-3 py-2 font-medium">Type</th>
                          <th className="px-3 py-2 font-medium hidden sm:table-cell">Requested by</th>
                          <th className="px-3 py-2 font-medium text-right">Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mass.intentions.map((intention) => (
                          <tr key={intention.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                            <td className="px-5 py-2.5">
                              <p className="font-medium text-stone-800">{intention.honoreeName}</p>
                              {intention.specialNote && (
                                <p className="text-stone-400 italic">{intention.specialNote}</p>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-stone-500">
                              {intention.intentionType === "DECEASED" ? "† Deceased" : "Living"}
                            </td>
                            <td className="px-3 py-2.5 text-stone-500 hidden sm:table-cell">
                              {intention.requesterName}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${
                                intention.paymentStatus === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {intention.paymentMethod === "CASH" ? "Cash" : "Online"} · {intention.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Date shortcut helpers
function thisMonth() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}
function lastMonth() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
  };
}
function thisWeek() {
  const now = new Date();
  const day = now.getDay();
  const sun = new Date(now); sun.setDate(now.getDate() - day);
  const sat = new Date(now); sat.setDate(now.getDate() + (6 - day));
  return {
    start: sun.toISOString().slice(0, 10),
    end: sat.toISOString().slice(0, 10),
  };
}
function next30() {
  const now = new Date();
  const end = new Date(now); end.setDate(now.getDate() + 30);
  return {
    start: now.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
