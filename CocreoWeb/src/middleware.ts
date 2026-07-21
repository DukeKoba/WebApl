import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_PATHS = ["/admin/insurid"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Admin guard (password cookie) ──────────────────────────────────
  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith("/admin/insurid/login")
  ) {
    const session = request.cookies.get("ins_admin")?.value;
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected || session !== expected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/insurid/login";
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 2. Supabase session refresh for INSURID reader paths ───────────────
  if (
    pathname.startsWith("/insurid") ||
    pathname.startsWith("/api/insurid/newsletter")
  ) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Skip session refresh when Supabase is not configured
    if (!supabaseUrl || supabaseUrl.includes("xxxxxxxxxxxx")) {
      return NextResponse.next();
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh session (keeps JWT alive)
    await supabase.auth.getUser();
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/insurid/:path*",
    "/api/insurid/newsletter",
  ],
};
