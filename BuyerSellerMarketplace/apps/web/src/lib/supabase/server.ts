import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, MarketplaceClient } from '@marketplace/shared';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function getSupabaseServerClient(): Promise<MarketplaceClient> {
  const cookieStore = await cookies();

  // @supabase/ssr's factory carries an older SupabaseClient generic arity;
  // the runtime object is identical, so realign the type here.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes sessions, so there is nothing lost here.
          }
        },
      },
    }
  ) as unknown as MarketplaceClient;
}
