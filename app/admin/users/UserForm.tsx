"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Parish {
  id: string;
  name: string;
}

interface Existing {
  id: string;
  name: string;
  email: string;
  role: string;
  parishId: string | null;
}

interface Props {
  parishes: Parish[];
  isSuperAdmin: boolean;
  existing?: Existing;
}

export default function UserForm({ parishes, isSuperAdmin, existing }: Props) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name ?? "",
    email: existing?.email ?? "",
    password: "",
    role: existing?.role ?? "SECRETARY",
    parishId: existing?.parishId ?? (parishes[0]?.id ?? ""),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/admin/users/${existing!.id}` : "/api/admin/users";
    const method = isEdit ? "PATCH" : "POST";

    const body: Record<string, string | null> = {
      name: form.name,
      email: form.email,
      role: form.role,
      parishId: form.role === "SUPER_ADMIN" ? null : form.parishId,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  const showParish = form.role !== "SUPER_ADMIN";

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Full name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="field"
          placeholder="Sister Mary Agnes"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Email address</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className="field"
          placeholder="secretary@parish.org"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">
          Password{isEdit && <span className="text-stone-400 font-normal"> (leave blank to keep unchanged)</span>}
        </label>
        <input
          type="password"
          required={!isEdit}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          className="field"
          placeholder={isEdit ? "••••••••" : "Minimum 8 characters"}
          minLength={8}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Role</label>
        <select
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          className="field"
          disabled={!isSuperAdmin && form.role === "SUPER_ADMIN"}
        >
          {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin — access to all parishes</option>}
          <option value="PARISH_ADMIN">Parish Admin — manage their parish&apos;s users</option>
          <option value="SECRETARY">Secretary — view and manage intentions</option>
        </select>
      </div>

      {showParish && (
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Assigned Parish</label>
          <select
            value={form.parishId}
            onChange={(e) => set("parishId", e.target.value)}
            className="field"
            required
          >
            <option value="">— Select a parish —</option>
            {parishes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
        </button>
        <a href="/admin" className="btn-secondary">Cancel</a>
      </div>
    </form>
  );
}
