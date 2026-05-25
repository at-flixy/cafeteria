import { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

function homeFor(role?: string) {
  if (role === Role.CASHIER) return "/cashier";
  if (role === Role.MANAGER || role === Role.ADMIN) return "/manager";
  return "/";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isPublic = pathname === "/login" || pathname === "/register";

  if (isPublic && token) {
    return NextResponse.redirect(new URL(homeFor(String(token.role)), request.url));
  }

  const protectedClient = pathname === "/" || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders") || pathname.startsWith("/notifications");
  if (!token && (protectedClient || pathname.startsWith("/manager") || pathname.startsWith("/cashier"))) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  if (pathname.startsWith("/manager") && token?.role !== Role.MANAGER && token?.role !== Role.ADMIN) {
    return NextResponse.redirect(new URL(homeFor(String(token?.role)), request.url));
  }

  if (pathname.startsWith("/cashier") && token?.role !== Role.CASHIER) {
    return NextResponse.redirect(new URL(homeFor(String(token?.role)), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|dishes).*)"],
};
