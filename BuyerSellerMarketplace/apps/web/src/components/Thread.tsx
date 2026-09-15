'use client';

import { useEffect, useRef, useState } from 'react';
import { getMyProfile, useMessages, type Profile } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * One conversation, both sides.
 *
 * The seller reads it at `/listings/:id/enquiries/:conversationId` and the
 * shopper at `/messages/:id`, but the thread itself is identical, so it lives
 * here once. `useMessages` owns the realtime subscription, the optimistic send
 * and the read receipt.
 */
export function Thread({ conversationId }: { conversationId: string }) {
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, loading, error, send } = useMessages(
    supabase,
    conversationId,
    profile?.id ?? null
  );

  useEffect(() => {
    getMyProfile(supabase)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [supabase]);

  // Follow the conversation down as it grows. `block: 'nearest'` so this never
  // scrolls the page itself when the thread is already in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    // Cleared before the await: the message is already on screen optimistically,
    // and leaving the text in the box makes it look unsent.
    setDraft('');
    setSendError(null);
    try {
      await send(body);
    } catch (e) {
      // The optimistic row has been rolled back by the hook, so put the text
      // back where the member can try again rather than losing it.
      setDraft(body);
      setSendError((e as Error).message);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;
  if (error) return <p className="py-16 text-center text-sm text-red-600">{error}</p>;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <ul className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <li className="py-8 text-center text-sm text-slate-500">
            Nothing said yet. You go first.
          </li>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <li key={m.id} className={mine ? 'self-end text-right' : 'self-start'}>
              <div
                className={`inline-block max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${
                  mine ? 'bg-brand text-white' : 'bg-surface text-slate-800'
                }`}
              >
                {m.body}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                <time dateTime={m.created_at}>
                  {new Date(m.created_at).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </p>
            </li>
          );
        })}
        <div ref={endRef} />
      </ul>

      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-4">
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <input
          id="message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
          placeholder="Write a message"
          className="h-11 flex-1 rounded-lg border border-slate-300 px-3 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {sendError && <p className="px-4 pb-4 text-sm text-red-600">{sendError}</p>}
    </div>
  );
}
