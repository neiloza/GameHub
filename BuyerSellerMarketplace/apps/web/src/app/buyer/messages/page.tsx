'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConversations, type ConversationSummary } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function BuyerMessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations(getSupabaseBrowserClient())
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Messages</h1>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">One moment…</p>
      ) : conversations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-brand-dark">No conversations yet</p>
          <p className="mt-1 text-sm text-slate-600">
            A conversation opens when a seller accepts your interest. Until then there is nothing
            here, and nobody can message you uninvited.
          </p>
          <Link
            href="/buyer/discover"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white"
          >
            Open discovery
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/buyer/messages/${c.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
              >
                <p className="font-semibold text-brand-dark">{c.listings?.name ?? 'A listing'}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Opened {new Date(c.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
