import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessPath, homeFor, requiresAuth, ruleFor, type Role } from '@marketplace/shared';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Session refresh, and the routing half of access control.
 *
 * This is presentation, not security. The database is the real boundary: RLS
 * decides which rows come back whatever URL somebody types. Redirecting here
 * means a promoter who follows a stale seller link lands on their own dashboard
 * instead of an empty shell that looks broken.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const rule = ruleFor(path);

  // A public route — the landing page, the auth screens, the legal pages.
  // Nothing to check, and no reason to pay for a Supabase round trip.
  if (!rule) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && requiresAuth(path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (!user) return response;

  // Only pay for the profile read on a surface that actually restricts by role.
  // Settings, notifications and the directory are open to every signed-in
  // member and need no lookup.
  if (!rule.roles && !rule.admin) return response;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  // No profile row yet — the account exists but has not finished setup. Send
  // them to finish it rather than to a surface that would render empty.
  if (!profile) {
    if (path.startsWith('/onboarding')) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  const viewer = { role: profile.role as Role, isAdmin: profile.is_admin };

  if (!canAccessPath(path, viewer)) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(viewer.role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
