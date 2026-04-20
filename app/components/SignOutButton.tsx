"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs text-stone-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
    >
      Sign out
    </button>
  );
}
