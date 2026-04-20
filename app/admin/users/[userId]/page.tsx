import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import UserForm from "../UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PARISH_ADMIN") {
    redirect("/secretary");
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  // Parish admins can only edit users in their own parish
  if (
    session.user.role === "PARISH_ADMIN" &&
    user.parishId !== session.user.parishId
  ) {
    redirect("/admin");
  }

  const parishes = await prisma.parish.findMany({
    where:
      session.user.role === "SUPER_ADMIN"
        ? undefined
        : { id: session.user.parishId ?? "__none__" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <a href="/admin" className="text-sm text-amber-700 hover:text-amber-900 transition-colors">
          ← User Management
        </a>
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mt-2">Edit User</h1>
      </div>
      <UserForm
        parishes={parishes}
        isSuperAdmin={session.user.role === "SUPER_ADMIN"}
        existing={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          parishId: user.parishId,
        }}
      />
    </div>
  );
}
