'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessPath, getMyProfile, homeFor, type Profile } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * A second, client-side copy of the routing check.
 *
 * The middleware already does this, and the database already refuses the rows.
 * This exists for the case neither covers: a client-side navigation inside the
 * app, which never touches the middleware. Without it, a promoter clicking a
 * stale link from a notification renders a seller shell that fetches nothing
 * and looks broken, rather than landing back on their own dashboard.
 *
 * It grants nothing and protects nothing. Everything it hides is also empty.
 */
export function RoleGuard({
  path,
  children,
}: {
  path: string;
  children: (profile: Profile) => React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking');

  useEffect(() => {
    let cancelled = false;
    getMyProfile(getSupabaseBrowserClient())
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          router.replace('/onboarding');
          return;
        }
        setProfile(p);
        const allowed = canAccessPath(path, { role: p.role, isAdmin: p.is_admin });
        setState(allowed ? 'ok' : 'denied');
        if (!allowed) router.replace(homeFor(p.role));
      })
      .catch(() => {
        if (!cancelled) router.replace('/auth/sign-in');
      });
    return () => {
      cancelled = true;
    };
  }, [path, router]);

  if (state !== 'ok' || !profile) {
    return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;
  }
  return <>{children(profile)}</>;
}
