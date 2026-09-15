'use client';

import { useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesInput,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const DEFAULTS: NotificationPreferencesInput = {
  email_activity: true,
  email_messages: true,
  email_account: true,
  email_marketing: false,
  push_activity: true,
  push_messages: true,
};

const LABELS: Record<keyof NotificationPreferencesInput, string> = {
  email_activity: 'Email me about interest and matches',
  email_messages: 'Email me about new messages',
  email_account: 'Email me about my account, membership and applications',
  email_marketing: 'Email me about new features and announcements',
  push_activity: 'Push me about interest and matches',
  push_messages: 'Push me about new messages',
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferencesInput>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getNotificationPreferences(getSupabaseBrowserClient())
      .then((row) => {
        if (!row) return;
        setPrefs({
          email_activity: row.email_activity,
          email_messages: row.email_messages,
          email_account: row.email_account,
          email_marketing: row.email_marketing,
          push_activity: row.push_activity,
          push_messages: row.push_messages,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await updateNotificationPreferences(getSupabaseBrowserClient(), prefs);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">One moment…</p>;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Notifications</h1>
      <p className="mt-1 text-sm text-slate-600">
        These decide what leaves the building. Everything still lands in your notification centre —
        it is the record of what happened, and hiding it would leave you unable to find out you
        matched.
      </p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6">
        {(Object.keys(LABELS) as (keyof NotificationPreferencesInput)[]).map((key) => (
          <label key={key} className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
              className="mt-0.5 h-5 w-5 rounded border-slate-300"
            />
            {LABELS[key]}
          </label>
        ))}

        {saved && <p className="text-sm text-accent">Saved.</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
