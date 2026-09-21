'use client';

import { useEffect, useState } from 'react';
import { getMyFeedback, type FeatureFeedback } from '@marketplace/shared';
import { FeedbackForm } from '@/components/FeedbackForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function FeedbackPage() {
  const [rows, setRows] = useState<FeatureFeedback[]>([]);

  useEffect(() => {
    getMyFeedback(getSupabaseBrowserClient())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Tell us what happened</h1>
      <FeedbackForm />

      {rows.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold text-brand-dark">What you have sent</h2>
          <ul className="mt-4 grid gap-3">
            {rows.map((f) => (
              <li key={f.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-brand-dark">{f.title}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {f.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
                {f.response && (
                  <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-slate-700">
                    <span className="font-semibold">Our answer: </span>
                    {f.response}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
