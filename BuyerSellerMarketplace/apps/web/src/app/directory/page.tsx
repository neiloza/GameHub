'use client';

import { useEffect, useState } from 'react';
import { listDirectory, type Advertiser } from '@marketplace/shared';
import { SponsorSlot } from '@/components/SponsorSlot';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * The directory of listed advertisers.
 *
 * Being listed is an administrator's decision, not something a placement buys —
 * paying to advertise and being vouched for are deliberately different things,
 * and the `listed` column is trigger-guarded so an advertiser cannot set it.
 */
export default function DirectoryPage() {
  const [rows, setRows] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDirectory(getSupabaseBrowserClient())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Directory</h1>
      <p className="mt-1 text-sm text-slate-600">
        Businesses we have listed. They cannot contact you — you reach out to them.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">One moment…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">Nobody listed yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((a) => (
            <li key={a.profile_id} className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold text-brand-dark">{a.company_name}</h2>
              <p className="mt-1 text-sm text-slate-600">{a.blurb}</p>
              <a
                href={a.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-block text-sm font-medium text-brand"
              >
                Visit →
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <SponsorSlot placement="directory" />
      </div>
    </div>
  );
}
