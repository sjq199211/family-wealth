import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "family_wealth_session";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hasCookie = !!req.cookies.get(COOKIE_NAME)?.value;
  if (path === "/gate") {
    if (hasCookie) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }
  if (!path.startsWith("/api/") && !hasCookie) {
    return NextResponse.redirect(new URL("/gate", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
