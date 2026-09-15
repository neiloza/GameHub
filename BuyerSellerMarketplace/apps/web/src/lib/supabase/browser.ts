'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database, MarketplaceClient } from '@marketplace/shared';

let client: MarketplaceClient | undefined;

export function getSupabaseBrowserClient(): MarketplaceClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      // These are inlined at build time. If they are missing, auth silently
      // fails on the deployed site with no clue why — so name the real cause
      // rather than letting the first query fail somewhere unrelated.
      throw new Error(
        'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and ' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.'
      );
    }
    // @supabase/ssr's factory carries an older SupabaseClient generic arity;
    // the runtime object is identical, so realign the type here.
    client = createBrowserClient<Database>(url, anonKey) as unknown as MarketplaceClient;
  }
  return client;
}
