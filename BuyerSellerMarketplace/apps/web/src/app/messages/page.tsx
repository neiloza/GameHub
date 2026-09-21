'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  formatCents,
  getConversations,
  getMyProfile,
  type ConversationSummary,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Every thread this account is part of, both sides of it.
 *
 * A seller who also buys has their enquiries and their customers' questions in
 * one inbox, labelled by which is which — splitting them across two routes
 * would mean checking two places for the same kind of thing.
 */
export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getConversations(supabase), getMyProfile(supabase)])
      .then(([rows, profile]) => {
        setConversations(rows);
        setMe(profile?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Messages</h1>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">One moment…</p>
      ) : conversations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-brand-dark">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-600">
            A thread starts when you ask a seller about something. Nobody can message you first.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {conversations.map((c) => {
            const selling = c.seller_id === me;
            // A seller reads their own threads inside the listing they are
            // about, where the rest of that item's questions are.
            const href = selling
              ? `/listings/${c.listing_id}/enquiries/${c.id}`
              : `/messages/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
                >
                  <div>
                    <p className="font-semibold text-brand-dark">
                      {c.listings?.name ?? 'A listing'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selling ? 'Somebody asked you about this' : 'You asked about this'} ·{' '}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {c.listings?.price_cents != null && (
                    <span className="text-sm font-bold text-ink">
                      {formatCents(c.listings.price_cents, c.listings.currency ?? 'USD')}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
