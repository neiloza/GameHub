'use client';

import { useEffect, useState } from 'react';
import { getAuditLog, type AdminAuditLog } from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">One moment…</p>;

  return (
    <>
      <p className="text-sm text-slate-600">
        Written in the same transaction as the change it records, and by the security-definer
        functions that make those changes — there is no insert policy, because a log anybody can
        write to is not a log.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nothing yet.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-brand-dark">{r.action}</p>
                <span className="text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {r.subject_table}
                {r.subject_id ? ` · ${r.subject_id}` : ''} · by {r.actor_id}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-2 text-xs text-slate-600">
                {JSON.stringify(r.detail, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
