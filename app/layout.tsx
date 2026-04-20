import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mass Intentions",
  description: "Submit and manage Mass intention requests",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <header className="bg-white border-b border-stone-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-xl text-stone-600">✝</span>
              <span className="font-semibold text-lg text-stone-800 tracking-tight">
                Mass Intentions
              </span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link
                href="/"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                Request Intention
              </Link>
              <Link
                href="/secretary"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                Parish Secretary
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 mt-16 py-6 text-center text-xs text-stone-400">
          Mass Intentions © {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
