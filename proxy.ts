import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/secretary") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require SUPER_ADMIN or PARISH_ADMIN
  if (
    pathname.startsWith("/admin") &&
    token.role !== "SUPER_ADMIN" &&
    token.role !== "PARISH_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/secretary", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/secretary/:path*", "/admin/:path*"],
};
