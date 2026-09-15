'use client';

import { useEffect, useState } from 'react';
import {
  listReports,
  resolveReport,
  suspendListing,
  type Report,
  type ReportStatus,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const OUTCOMES: ReportStatus[] = ['reviewing', 'actioned', 'dismissed'];

export default function AdminReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReports(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  async function resolve(report: Report, status: ReportStatus) {
    setError(null);
    try {
      const updated = await resolveReport(getSupabaseBrowserClient(), report.id, status);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function suspend(report: Report) {
    if (!report.subject_listing_id) return;
    setError(null);
    try {
      await suspendListing(getSupabaseBrowserClient(), report.subject_listing_id, true);
      await resolve(report, 'actioned');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing reported.</p>
      ) : (
        <ul className="grid gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-dark">{r.reason.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.subject_listing_id
                      ? `About listing ${r.subject_listing_id}`
                      : `About account ${r.subject_profile_id}`}
                    {' · '}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {r.status}
                </span>
              </div>

              {r.detail && (
                <p className="mt-3 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-slate-700">
                  {r.detail}
                </p>
              )}

              {r.status !== 'actioned' && r.status !== 'dismissed' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => void resolve(r, o)}
                      className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
                    >
                      Mark {o}
                    </button>
                  ))}
                  {r.subject_listing_id && (
                    <button
                      type="button"
                      onClick={() => void suspend(r)}
                      className="h-11 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Suspend the listing
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-slate-500">
        The reported party is never told a report exists, or who filed it. That is the absence of a
        policy rather than a rule written anywhere — nothing grants them a read.
      </p>
    </>
  );
}
