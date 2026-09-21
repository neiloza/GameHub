'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_IMPACTS,
  feedbackSurfaceFor,
  getMyProfile,
  submitFeedback,
  type FeedbackCategory,
  type FeedbackImpact,
  type Role,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Something is broken',
  idea: 'I have an idea',
  confusing: 'This is confusing',
  praise: 'This worked well',
  other: 'Something else',
};

const IMPACT_LABELS: Record<FeedbackImpact, string> = {
  blocking: 'I cannot finish what I came to do',
  annoying: 'I worked around it',
  minor: 'Just noting it',
};

export function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [impact, setImpact] = useState<FeedbackImpact>('annoying');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getMyProfile(getSupabaseBrowserClient())
      .then((p) => setRole(p?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const surface = feedbackSurfaceFor(role, pathname);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!surface) return;
    setBusy(true);
    setError(null);
    try {
      await submitFeedback(getSupabaseBrowserClient(), {
        surface,
        category,
        impact,
        title,
        body,
        // Captured rather than asked for: "which page were you on" is a
        // question nobody should have to answer about their own bug report.
        pathname,
      });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-surface p-4 text-sm">
        <p className="font-semibold text-brand-dark">Got it — thank you.</p>
        <p className="mt-1 text-slate-600">
          You can see what happened to this under your account settings.
        </p>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 font-medium"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-slate-700">What kind of thing is it?</legend>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`min-h-[40px] rounded-lg border px-3 text-sm ${
                category === c
                  ? 'border-brand bg-surface font-semibold text-brand-dark'
                  : 'border-slate-300'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        One line
        <input
          required
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="The save button does nothing"
          className="h-11 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        What happened
        <textarea
          required
          rows={4}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        How much did it get in the way?
        <select
          value={impact}
          onChange={(e) => setImpact(e.target.value as FeedbackImpact)}
          className="h-11 rounded-lg border border-slate-300 px-3"
        >
          {FEEDBACK_IMPACTS.map((i) => (
            <option key={i} value={i}>
              {IMPACT_LABELS[i]}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || !surface}
        className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Send'}
      </button>

      <p className="text-xs text-slate-500">
        We record the page you were on ({pathname}) so we can reproduce it.
      </p>
    </form>
  );
}
