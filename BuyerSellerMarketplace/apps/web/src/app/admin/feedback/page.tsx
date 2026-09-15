'use client';

import { useEffect, useState } from 'react';
import {
  FEEDBACK_STATUSES,
  listFeedback,
  respondToFeedback,
  type FeatureFeedback,
  type FeedbackStatus,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeatureFeedback[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { status: FeedbackStatus; response: string }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listFeedback(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  async function respond(row: FeatureFeedback) {
    const draft = drafts[row.id] ?? { status: 'triaged' as FeedbackStatus, response: '' };
    setError(null);
    try {
      const updated = await respondToFeedback(getSupabaseBrowserClient(), row.id, {
        status: draft.status,
        response: draft.response || null,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing sent yet.</p>
      ) : (
        <ul className="grid gap-4">
          {rows.map((f) => {
            const draft = drafts[f.id] ?? {
              status: f.status,
              response: f.response ?? '',
            };
            return (
              <li key={f.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-dark">{f.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {f.surface} · {f.category} · {f.impact}
                      {f.pathname ? ` · ${f.pathname}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {f.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-slate-700">
                  {f.body}
                </p>

                <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDrafts((d) => ({ ...d, [f.id]: { ...draft, status: s } }))}
                        aria-pressed={draft.status === s}
                        className={`h-10 rounded-lg border px-3 text-sm ${
                          draft.status === s
                            ? 'border-brand bg-surface font-semibold text-brand-dark'
                            : 'border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <label className="grid gap-1 text-sm font-medium text-slate-700">
                    Answer <span className="font-normal text-slate-400">(they read this)</span>
                    <textarea
                      rows={2}
                      value={draft.response}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [f.id]: { ...draft, response: e.target.value } }))
                      }
                      className="rounded-lg border border-slate-300 p-3"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void respond(f)}
                    className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
