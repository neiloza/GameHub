'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMyProfile, showsFeedbackButton, type Role } from '@marketplace/shared';
import { FeedbackForm } from '@/components/FeedbackForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The floating "tell us" affordance.
 *
 * Whether it appears at all is `showsFeedbackButton()` in the shared package:
 * it needs both a surface the member can speak from and a route where a
 * floating button is an invitation rather than an interruption. Advertisers and
 * promoters get nothing, because the insert policy would refuse their row.
 */
export function FeedbackButton() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProfile(getSupabaseBrowserClient())
      .then((p) => !cancelled && setRole(p?.role ?? null))
      .catch(() => !cancelled && setRole(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!showsFeedbackButton(role, pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-dark"
      >
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send feedback"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Tell us what happened</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-surface"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <FeedbackForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
