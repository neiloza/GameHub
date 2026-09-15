'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getConversations,
  getPendingMatches,
  getProfile,
  respondToMatch,
  type ConversationSummary,
  type Match,
  type Profile,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The seller's side of mutual consent.
 *
 * Two lists, deliberately separate: interests waiting on a decision, and the
 * conversations that decisions have already opened. Merging them would put a
 * pair of accept/decline buttons next to a thread that is already running.
 */
export default function ListingBuyersPage() {
  const { id } = useParams<{ id: string }>();
  const [pending, setPending] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [buyers, setBuyers] = useState<Record<string, Profile>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getPendingMatches(supabase, id), getConversations(supabase)])
      .then(async ([matches, convos]) => {
        setPending(matches);
        setConversations(convos.filter((c) => c.listing_id === id));

        // One read per distinct buyer rather than one per row.
        const ids = [...new Set(matches.map((m) => m.buyer_id))];
        const profiles = await Promise.all(ids.map((pid) => getProfile(supabase, pid)));
        setBuyers(
          Object.fromEntries(profiles.filter((p): p is Profile => p !== null).map((p) => [p.id, p]))
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function respond(match: Match, accept: boolean) {
    setBusyId(match.id);
    try {
      await respondToMatch(getSupabaseBrowserClient(), match.id, accept);
      setPending((prev) => prev.filter((m) => m.id !== match.id));
      if (accept) {
        setConversations(
          (await getConversations(getSupabaseBrowserClient())).filter((c) => c.listing_id === id)
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  return (
    <div className="py-8">
      <Link href={`/listings/${id}`} className="text-sm font-medium text-brand">
        ← Back to the listing
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Interested buyers</h1>

      <section className="mt-8">
        <h2 className="font-bold text-brand-dark">Waiting on you</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing waiting.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {pending.map((match) => {
              const buyer = buyers[match.buyer_id];
              return (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <p className="font-semibold text-brand-dark">
                      {buyer?.display_name ?? 'A buyer'}
                      {buyer?.verified && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                          Verified
                        </span>
                      )}
                    </p>
                    {buyer?.location && (
                      <p className="text-xs text-slate-500">{buyer.location}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === match.id}
                      onClick={() => respond(match, false)}
                      className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface disabled:opacity-50"
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      disabled={busyId === match.id}
                      onClick={() => respond(match, true)}
                      className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                      Open a conversation
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-brand-dark">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/listings/${id}/buyers/${c.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand"
                >
                  <p className="font-semibold text-brand-dark">Conversation</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Opened {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
