'use client';

import { useEffect, useState } from 'react';
import {
  listBillingEvents,
  listMemberships,
  reconcileMemberships,
  type BillingEvent,
  type Membership,
  type ReconciliationIssue,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Where "I paid and the app disagrees" gets settled.
 *
 * Two tables. The reconciliation list is every way this database and the
 * payment processor currently disagree; the event log is what actually arrived
 * from the processor and whether we acted on it. A row with an error and no
 * processed time is a webhook that failed, and it is the first thing to look at.
 */
export default function AdminBillingPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [issues, setIssues] = useState<ReconciliationIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([listMemberships(supabase), listBillingEvents(supabase)])
      .then(([m, e]) => {
        setMemberships(m);
        setEvents(e);
        setIssues(reconcileMemberships(m));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      <section>
        <h2 className="font-bold text-brand-dark">Needs a human</h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing disagrees. {memberships.length} memberships on file.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {issues.map((i, idx) => (
              <li
                key={`${i.profile_id}-${i.kind}-${idx}`}
                className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"
              >
                <p className="font-semibold text-amber-900">{i.kind.replace(/_/g, ' ')}</p>
                <p className="mt-0.5 text-amber-900">{i.detail}</p>
                <p className="mt-1 font-mono text-xs text-amber-800">{i.profile_id}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-brand-dark">What the processor sent us</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every delivery is recorded before it is acted on, so a replayed webhook cannot pay twice.
        </p>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nothing yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {events.map((e) => (
              <li
                key={e.id}
                className={`rounded-xl border p-4 text-sm ${
                  e.error ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-brand-dark">{e.kind}</p>
                  <span className="text-xs text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">{e.event_id}</p>
                {e.error ? (
                  <p className="mt-1 text-red-700">{e.error}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    {e.processed_at
                      ? `Acted on ${new Date(e.processed_at).toLocaleString()}`
                      : 'Recorded, not yet acted on'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
