'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  APPLICATION_STATUS_LABELS,
  APPLIED_ROLES,
  ROLE_LABELS,
  getApplicationMessages,
  getMyApplication,
  sendApplicationMessage,
  type AnyApplication,
  type ApplicationKind,
  type ApplicationMessage,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Where an applicant watches their application, and answers a question about it.
 *
 * The thread is the reason `info_requested` exists as a status: without it,
 * "not quite enough detail" and "no" are the same outcome and the applicant has
 * to start again from scratch.
 */
export default function ApplyPage() {
  const [applications, setApplications] = useState<Partial<Record<ApplicationKind, AnyApplication>>>(
    {}
  );
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all(APPLIED_ROLES.map((kind) => getMyApplication(supabase, kind)))
      .then(async (rows) => {
        const found: Partial<Record<ApplicationKind, AnyApplication>> = {};
        APPLIED_ROLES.forEach((kind, i) => {
          if (rows[i]) found[kind] = rows[i]!;
        });
        setApplications(found);

        const open = APPLIED_ROLES.find((k) => found[k]);
        if (open && found[open]) {
          setMessages(await getApplicationMessages(supabase, open, found[open]!.id));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const openKind = APPLIED_ROLES.find((k) => applications[k]);
  const application = openKind ? applications[openKind] : undefined;

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!openKind || !application || !draft.trim()) return;
    setBusy(true);
    try {
      const sent = await sendApplicationMessage(
        getSupabaseBrowserClient(),
        openKind,
        application.id,
        draft.trim()
      );
      setMessages((prev) => [...prev, sent]);
      setDraft('');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  if (!application || !openKind) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Apply for a role</h1>
        <p className="mt-1 text-sm text-slate-600">
          Seller is the one role you can simply have. Everything else is reviewed by a person.
        </p>
        <ul className="mt-6 grid gap-3">
          {APPLIED_ROLES.map((role) => (
            <li key={role}>
              <Link
                href={`/apply/${role}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
              >
                <p className="font-semibold text-brand-dark">{ROLE_LABELS[role]}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
        Your {ROLE_LABELS[openKind].toLowerCase()} application
      </h1>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-brand-dark">
          {APPLICATION_STATUS_LABELS[application.status]}
        </p>
        {application.review_note && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-slate-700">
            {application.review_note}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Submitted {new Date(application.created_at).toLocaleDateString()}
        </p>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Messages</h2>
        <ul className="mt-4 grid gap-3">
          {messages.length === 0 && (
            <li className="text-sm text-slate-500">
              Nothing yet. If a reviewer needs something, it appears here.
            </li>
          )}
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg bg-surface p-3">
              <p className="whitespace-pre-line text-sm text-slate-800">{m.body}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>

        {application.status !== 'approved' && application.status !== 'rejected' && (
          <form onSubmit={reply} className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="reply">
              Reply
            </label>
            <input
              id="reply"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={4000}
              placeholder="Answer the reviewer"
              className="h-11 flex-1 rounded-lg border border-slate-300 px-3"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
