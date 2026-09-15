'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { describeNotification, getMyProfile, useNotifications } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function NotificationsPage() {
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile(getSupabaseBrowserClient())
      .then((p) => setProfileId(p?.id ?? null))
      .catch(() => setProfileId(null));
  }, []);

  const { notifications, unread, loading, markRead, markAllRead } = useNotifications(
    getSupabaseBrowserClient(),
    profileId
  );

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Notifications</h1>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-surface"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">One moment…</p>
      ) : notifications.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Nothing yet.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {notifications.map((n) => {
            const d = describeNotification(n);
            const content = (
              <>
                <p className="font-semibold text-brand-dark">{d.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{d.body}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString()}</time>
                </p>
              </>
            );
            return (
              <li
                key={n.id}
                className={`rounded-xl border p-5 ${
                  n.read_at ? 'border-slate-200 bg-white' : 'border-brand/30 bg-surface'
                }`}
              >
                {d.href ? (
                  <Link href={d.href} onClick={() => void markRead(n.id)} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
