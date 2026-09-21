'use client';

import Link from 'next/link';
import { useState } from 'react';
import { describeNotification, useNotifications } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function NotificationBell({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const { notifications, unread, markRead, markAllRead } = useNotifications(
    getSupabaseBrowserClient(),
    profileId
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative rounded-lg p-2 hover:bg-surface"
      >
        <span aria-hidden className="text-lg">
          🔔
        </span>
        <span className="sr-only">
          Notifications{unread > 0 ? ` (${unread} unread)` : ''}
        </span>
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-brand px-1 text-[11px] font-bold leading-[18px] text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <p className="text-sm font-semibold text-brand-dark">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-brand"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">Nothing yet.</li>
            )}
            {notifications.slice(0, 12).map((n) => {
              const d = describeNotification(n);
              const body = (
                <>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{d.body}</p>
                </>
              );
              return (
                <li key={n.id} className={n.read_at ? '' : 'bg-surface'}>
                  {d.href ? (
                    <Link
                      href={d.href}
                      onClick={() => void markRead(n.id)}
                      className="block px-4 py-3 hover:bg-slate-50"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <Link
            href="/notifications"
            className="block border-t border-slate-200 px-4 py-2 text-center text-xs font-medium text-brand"
          >
            See everything
          </Link>
        </div>
      )}
    </div>
  );
}
