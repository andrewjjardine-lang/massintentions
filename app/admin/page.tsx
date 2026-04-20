import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DeleteUserButton from "./DeleteUserButton";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PARISH_ADMIN: "Parish Admin",
  SECRETARY: "Secretary",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  PARISH_ADMIN: "bg-amber-100 text-amber-700",
  SECRETARY: "bg-stone-100 text-stone-600",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PARISH_ADMIN") {
    redirect("/secretary");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const users = await prisma.user.findMany({
    where: isSuperAdmin ? undefined : { parishId: session.user.parishId ?? "__none__" },
    orderBy: [{ parishId: "asc" }, { name: "asc" }],
    include: { parish: { select: { name: true } } },
  });

  const parishes = await prisma.parish.findMany({
    where: isSuperAdmin ? undefined : { id: session.user.parishId ?? "__none__" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">User Management</h1>
          <p className="text-stone-500 text-sm mt-1">
            {isSuperAdmin
              ? "Manage secretaries and admins across all parishes"
              : `Manage secretaries for ${session.user.parishName}`}
          </p>
        </div>
        <Link href="/admin/users/new" className="btn-primary">
          + Add User
        </Link>
      </div>

      {/* Users by parish */}
      {parishes.map((parish) => {
        const parishUsers = users.filter((u) => u.parishId === parish.id);
        return (
          <div key={parish.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs">✝</div>
              <h2 className="font-serif text-lg font-semibold text-stone-700">{parish.name}</h2>
            </div>

            {parishUsers.length === 0 ? (
              <p className="text-stone-400 text-sm pl-10">No users assigned to this parish yet.</p>
            ) : (
              <div className="card divide-y divide-stone-100 ml-10">
                {parishUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-medium text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">{user.name}</p>
                      <p className="text-stone-400 text-xs">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 rounded-md px-2.5 py-1 hover:bg-stone-50 transition-colors"
                      >
                        Edit
                      </Link>
                      {user.id !== session.user.id && (
                        <DeleteUserButton userId={user.id} userName={user.name} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Super admins (no parish) */}
      {isSuperAdmin && (() => {
        const globalAdmins = users.filter((u) => !u.parishId);
        if (globalAdmins.length === 0) return null;
        return (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-stone-700">Global Admins</h2>
            <div className="card divide-y divide-stone-100">
              {globalAdmins.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm">{user.name}</p>
                    <p className="text-stone-400 text-xs">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  {user.id !== session.user.id && (
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
