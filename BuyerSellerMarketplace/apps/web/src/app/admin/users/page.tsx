'use client';

import { useState } from 'react';
import {
  ROLES,
  ROLE_LABELS,
  searchAccounts,
  setAccountStatus,
  setRole,
  type Profile,
  type Role,
} from '@marketplace/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setRows(await searchAccounts(getSupabaseBrowserClient(), query));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(profile: Profile, role: Role) {
    setError(null);
    try {
      await setRole(getSupabaseBrowserClient(), profile.id, role);
      setRows((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role } : p)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleSuspended(profile: Profile) {
    const status = profile.account_status === 'active' ? 'suspended' : 'active';
    setError(null);
    try {
      await setAccountStatus(getSupabaseBrowserClient(), profile.id, status);
      setRows((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, account_status: status } : p))
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <form onSubmit={search} className="flex gap-2">
        <label className="sr-only" htmlFor="q">
          Search accounts
        </label>
        <input
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, or an account id"
          className="h-11 flex-1 rounded-lg border border-slate-300 px-3"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-xs text-slate-500">
        Changing a role here is one of only two sanctioned paths past the profile guard — the other
        is approving an application. Both write an audit row.
      </p>

      <ul className="mt-6 grid gap-3">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-semibold text-brand-dark">
                {p.display_name}
                {p.is_admin && (
                  <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white">
                    Admin
                  </span>
                )}
                {p.verified && (
                  <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    Verified
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">{p.id}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`role-${p.id}`}>
                Role
              </label>
              <select
                id={`role-${p.id}`}
                value={p.role}
                onChange={(e) => void changeRole(p, e.target.value as Role)}
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void toggleSuspended(p)}
                className={`h-11 rounded-lg border px-4 text-sm font-medium ${
                  p.account_status === 'suspended'
                    ? 'border-accent text-accent'
                    : 'border-red-200 text-red-700 hover:bg-red-50'
                }`}
              >
                {p.account_status === 'suspended' ? 'Restore' : 'Suspend'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
