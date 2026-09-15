'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getMyProfile,
  getMyVerification,
  ONBOARDING_ROLES,
  replayOnboarding,
  startVerification,
  updateMyProfile,
  type IdentityVerification,
  type Profile,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    Promise.all([getMyProfile(supabase), getMyVerification(supabase)])
      .then(([p, v]) => {
        setProfile(p);
        setVerification(v);
        if (p) {
          setDisplayName(p.display_name);
          setLocation(p.location ?? '');
          setBio(p.bio ?? '');
          setWebsite(p.website ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setProfile(
        await updateMyProfile(getSupabaseBrowserClient(), {
          display_name: displayName,
          location: location || null,
          bio: bio || null,
          website: website || null,
          avatar_url: profile?.avatar_url ?? null,
          links: profile?.links ?? {},
        })
      );
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      window.location.href = await startVerification(getSupabaseBrowserClient(), '/settings');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;
  if (!profile) return <p className="py-16 text-center text-sm text-slate-500">Not signed in.</p>;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Account settings</h1>

      <form onSubmit={save} className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-6">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Display name
          <input
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 rounded-lg border border-slate-300 px-3"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Location
            <input
              maxLength={120}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Website
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="example.com"
              className="h-11 rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          About you
          <textarea
            rows={4}
            maxLength={2000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-lg border border-slate-300 p-3"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Identity</h2>
        {profile.verified ? (
          <p className="mt-2 text-sm text-accent">
            ✓ Verified. The badge appears beside your name to other members.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              A one-off check at our provider. No document, image or number is stored here — we keep
              the outcome and nothing else.
              {verification?.status === 'pending' && ' Yours is being reviewed.'}
              {verification?.status === 'failed' &&
                ` The last attempt did not pass${verification.failure_reason ? `: ${verification.failure_reason}` : ''}.`}
            </p>
            <button
              type="button"
              onClick={verify}
              disabled={busy}
              className="mt-4 h-11 rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-surface disabled:opacity-50"
            >
              {verification?.status === 'failed' ? 'Try again' : 'Verify my identity'}
            </button>
          </>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Notifications</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose what reaches your inbox and your phone. The notification centre always has
          everything, whatever you turn off here.
        </p>
        <Link
          href="/settings/notifications"
          className="mt-4 inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-medium hover:bg-surface"
        >
          Open
        </Link>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-brand-dark">Show me around again</h2>
        <p className="mt-1 text-sm text-slate-600">Replays the first-run walkthrough for a role.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ONBOARDING_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => void replayOnboarding(getSupabaseBrowserClient(), role)}
              className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
            >
              {role}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
