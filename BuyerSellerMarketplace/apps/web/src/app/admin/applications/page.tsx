'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLIED_ROLES,
  ROLE_LABELS,
  addApplicationNote,
  applicationReviewSchema,
  getApplicationNotes,
  listApplications,
  reviewApplication,
  type AnyApplication,
  type ApplicationKind,
  type ApplicationNote,
  type ApplicationStatus,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The review queue.
 *
 * Oldest first, because it is a queue somebody works through rather than a feed
 * they scroll. `review_application()` does the deciding: it is the only path in
 * the system allowed past the role guard, so approving here is what actually
 * grants the role.
 */
export default function AdminApplicationsPage() {
  const [kind, setKind] = useState<ApplicationKind>('seller');
  const [rows, setRows] = useState<AnyApplication[]>([]);
  const [notes, setNotes] = useState<Record<string, ApplicationNote[]>>({});
  const [decision, setDecision] = useState<Record<string, { status: ApplicationStatus; note: string }>>(
    {}
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const applications = await listApplications(supabase, kind);
    setRows(applications);
    const entries = await Promise.all(
      applications.map(
        async (a) => [a.id, await getApplicationNotes(supabase, kind, a.id)] as const
      )
    );
    setNotes(Object.fromEntries(entries));
  }, [kind]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function decide(application: AnyApplication) {
    const input = decision[application.id] ?? { status: 'approved' as ApplicationStatus, note: '' };
    const parsed = applicationReviewSchema.safeParse({
      status: input.status,
      note: input.note || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the decision.');
      return;
    }

    setBusyId(application.id);
    setError(null);
    try {
      await reviewApplication(getSupabaseBrowserClient(), kind, application.id, parsed.data);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function note(application: AnyApplication, body: string) {
    if (!body.trim()) return;
    const saved = await addApplicationNote(
      getSupabaseBrowserClient(),
      kind,
      application.id,
      body.trim()
    );
    setNotes((prev) => ({ ...prev, [application.id]: [...(prev[application.id] ?? []), saved] }));
  }

  return (
    <>
      <div className="flex gap-2">
        {APPLIED_ROLES.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`h-11 rounded-lg px-4 text-sm font-medium ${
              kind === k ? 'bg-ink text-white' : 'border border-slate-300 hover:bg-surface'
            }`}
          >
            {ROLE_LABELS[k]}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">One moment…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nothing in this queue.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {rows.map((a) => {
            const current = decision[a.id] ?? { status: 'approved' as ApplicationStatus, note: '' };
            const decided = a.status === 'approved' || a.status === 'rejected';
            return (
              <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-dark">{a.contact_name}</p>
                    <p className="text-sm text-slate-600">{a.contact_email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {APPLICATION_STATUS_LABELS[a.status]}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-slate-700">
                  {a.motivation}
                </p>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-brand">
                    Reviewer notes ({notes[a.id]?.length ?? 0})
                  </summary>
                  <p className="mt-2 text-xs text-slate-500">
                    Never visible to the applicant — a different table from the thread they can read.
                  </p>
                  <ul className="mt-2 grid gap-2">
                    {(notes[a.id] ?? []).map((n) => (
                      <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        {n.body}
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('note') as HTMLInputElement;
                      void note(a, input.value).then(() => {
                        input.value = '';
                      });
                    }}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      name="note"
                      placeholder="Add a note"
                      className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
                    />
                    <button
                      type="submit"
                      className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium"
                    >
                      Add
                    </button>
                  </form>
                </details>

                {!decided && (
                  <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
                    <div className="flex flex-wrap gap-2">
                      {APPLICATION_STATUSES.filter((s) => s !== 'pending').map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setDecision((d) => ({ ...d, [a.id]: { ...current, status: s } }))
                          }
                          aria-pressed={current.status === s}
                          className={`h-11 rounded-lg border px-4 text-sm ${
                            current.status === s
                              ? 'border-brand bg-surface font-semibold text-brand-dark'
                              : 'border-slate-300'
                          }`}
                        >
                          {APPLICATION_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>

                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Note to the applicant
                      <textarea
                        rows={2}
                        value={current.note}
                        onChange={(e) =>
                          setDecision((d) => ({
                            ...d,
                            [a.id]: { ...current, note: e.target.value },
                          }))
                        }
                        placeholder="Required for anything other than approval — they read this"
                        className="rounded-lg border border-slate-300 p-3"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => decide(a)}
                      className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === a.id ? 'Saving…' : 'Record decision'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
