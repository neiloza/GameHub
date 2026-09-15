'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMyEnquiry, getMyProfile, startEnquiry, type Profile } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * "Ask the seller" — the only way a conversation ever starts.
 *
 * Three states, and all three matter: a signed-out visitor gets a prompt to
 * sign in that remembers where they were; a shopper with an existing thread
 * gets a link to it rather than a second form; everybody else gets the form.
 * Without the middle case a shopper asking a follow-up would think they had
 * started something new, and then not find the seller's reply.
 */
export function EnquiryForm({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    getMyProfile(supabase)
      .then(async (p) => {
        if (cancelled) return;
        setProfile(p);
        if (p) {
          const thread = await getMyEnquiry(supabase, listingId).catch(() => null);
          if (!cancelled) setExisting(thread?.id ?? null);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const conversationId = await startEnquiry(getSupabaseBrowserClient(), {
        listing_id: listingId,
        body,
      });
      router.push(`/messages/${conversationId}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!checked) return null;

  if (!profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="font-semibold text-brand-dark">Questions about this?</p>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to ask the seller. Browsing needs no account; messaging does.
        </p>
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(`/shop/${listingId}`)}`}
          className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Their own listing. Offering somebody a form to message themselves is a
  // dead end the database would refuse anyway.
  if (sellerId && profile.id === sellerId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          This is your listing.{' '}
          <Link href={`/listings/${listingId}/enquiries`} className="font-medium text-brand">
            See who has asked about it
          </Link>
          .
        </p>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="font-semibold text-brand-dark">You have already asked about this</p>
        <p className="mt-1 text-sm text-slate-600">
          Your thread with this seller is where their reply will be.
        </p>
        <Link
          href={`/messages/${existing}`}
          className="mt-4 inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-surface"
        >
          Open the conversation
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6">
      <label htmlFor="enquiry" className="font-semibold text-brand-dark">
        Ask the seller
      </label>
      <textarea
        id="enquiry"
        required
        rows={4}
        maxLength={4000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Is this still available? Do you ship to…?"
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !body.trim()}
        className="mt-3 h-11 w-full rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Send'}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        This opens a thread about this listing. Sellers cannot message you first.
      </p>
    </form>
  );
}
