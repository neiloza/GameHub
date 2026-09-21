'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  APPLIED_ROLES,
  listApplications,
  listFeedback,
  listReports,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState({ applications: 0, reports: 0, feedback: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([
      Promise.all(APPLIED_ROLES.map((k) => listApplications(supabase, k, 'pending'))),
      listReports(supabase, 'open'),
      listFeedback(supabase, 'new'),
    ])
      .then(([apps, reports, feedback]) =>
        setCounts({
          applications: apps.flat().length,
          reports: reports.length,
          feedback: feedback.length,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const tiles = [
    { href: '/admin/applications', label: 'Applications waiting', value: counts.applications },
    { href: '/admin/reports', label: 'Reports open', value: counts.reports },
    { href: '/admin/feedback', label: 'Feedback untriaged', value: counts.feedback },
  ];

  return (
    <>
      <p className="text-sm text-slate-600">What is waiting for a person.</p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">One moment…</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-brand"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t.label}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-brand-dark">{t.value}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Every privileged action here writes an audit row in the same transaction as the change it
        records. The <Link href="/admin/audit" className="font-medium text-brand">audit log</Link> is
        the account of who did what.
      </p>
    </>
  );
}
