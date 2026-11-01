import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Pages anyone can open without signing in. */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

/**
 * Public pages a signed-in user is sent away from. /reset-password is not one of them: the emailed
 * recovery link signs the user in, and they still need to stay on that page to choose the new password.
 */
const SIGNED_OUT_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

const matchesPath = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Refreshes the auth session cookie and redirects signed-out users to /login. */
export async function updateSession(request: NextRequest) {
  // Before Supabase is connected (Stage 1), let every page render.
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;
  const isPublic = matchesPath(pathname, PUBLIC_PATHS);

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (signedIn && matchesPath(pathname, SIGNED_OUT_ONLY_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/today-view";
    return NextResponse.redirect(url);
  }

  return response;
}
