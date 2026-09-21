'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMyProfile, navLinksFor, type NavLink, type Profile } from '@marketplace/shared';
import { NotificationBell } from '@/components/NotificationBell';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The header.
 *
 * The link list comes from `navLinksFor()` in the shared package rather than
 * from conditionals here, so the navigation and the middleware can never
 * disagree about what a role may reach — the test beside that module asserts
 * every link it emits is one `canAccessPath` also allows.
 */
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    getMyProfile(supabase)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Signing in or out anywhere in the app updates the header without a
    // reload, and without every page having to remember to refresh it.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getMyProfile(supabase)
        .then((p) => !cancelled && setProfile(p))
        .catch(() => !cancelled && setProfile(null));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close the mobile menu on navigation — otherwise it stays open over the
  // page the member just asked for.
  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const links: NavLink[] = profile
    ? navLinksFor({ role: profile.role, isAdmin: profile.is_admin })
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
          Marketplace
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname.startsWith(link.href)
                  ? 'bg-surface text-brand-dark'
                  : 'text-slate-600 hover:bg-surface hover:text-brand-dark'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-surface"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {profile && <NotificationBell profileId={profile.id} />}

          {loading ? null : profile ? (
            <>
              <Link
                href="/settings"
                className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-surface md:block"
              >
                {profile.display_name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-surface md:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Join
              </Link>
            </>
          )}

          {profile && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="rounded-lg border border-slate-300 p-2 md:hidden"
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <span aria-hidden>{open ? '✕' : '☰'}</span>
            </button>
          )}
        </div>
      </div>

      {open && profile && (
        <nav id="mobile-nav" className="border-t border-slate-200 bg-white md:hidden" aria-label="Main">
          <div className="mx-auto grid w-full max-w-5xl gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            {profile.is_admin && (
              <Link href="/admin" className="rounded-lg px-3 py-3 text-sm font-semibold text-brand">
                Admin
              </Link>
            )}
            <Link href="/settings" className="rounded-lg px-3 py-3 text-sm text-slate-700">
              Account settings
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700"
            >
              Sign out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
