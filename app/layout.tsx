import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/auth";
import SignOutButton from "@/app/components/SignOutButton";

export const metadata: Metadata = {
  title: "Mass Intentions",
  description: "Submit and manage parish Mass intention requests",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        {/* Top banner */}
        <div className="bg-amber-800 text-amber-100 text-center text-xs py-1.5 tracking-wide">
          ✝ &nbsp; Offered with faith, received with grace
        </div>

        {/* Header */}
        <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-amber-800 rounded-full flex items-center justify-center text-white text-base shadow-sm group-hover:bg-amber-700 transition-colors">
                ✝
              </div>
              <div>
                <span className="font-serif font-semibold text-stone-800 text-lg leading-none block">
                  Mass Intentions
                </span>
                <span className="text-stone-400 text-xs leading-none">Request a Holy Mass</span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Request
              </Link>
              {session ? (
                <>
                  <Link
                    href="/secretary"
                    className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                  {(session.user.role === "SUPER_ADMIN" || session.user.role === "PARISH_ADMIN") && (
                    <Link
                      href="/admin"
                      className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-2 ml-1 pl-3 border-l border-stone-200">
                    <span className="text-stone-500 text-xs hidden sm:block">{session.user.name}</span>
                    <SignOutButton />
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
                >
                  Parish Login
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-stone-200 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
            <span className="font-serif italic">
              "For them shall I offer the Holy Sacrifice"
            </span>
            <span>Mass Intentions © {new Date().getFullYear()}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
