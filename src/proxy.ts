import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAdminRoute && (!isLoggedIn || req.auth?.user?.role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
