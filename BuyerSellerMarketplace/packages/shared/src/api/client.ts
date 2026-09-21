import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/** The typed Supabase client every call in `api/` takes as its first argument. */
export type MarketplaceClient = SupabaseClient<Database>;

/**
 * Unwrap a Supabase result that is expected to have data.
 *
 * `.single()` returns `{ data: null, error }` on failure, and callers that
 * forget to check get `null` where they typed a row. Funnelling every write
 * through this turns that into a thrown error with the database's own message,
 * which is the one worth showing.
 */
export function assertOk<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error('Expected data, got none');
  return data;
}

/** The signed-in user's id, or a thrown error. Every write needs one. */
export async function requireUserId(client: MarketplaceClient): Promise<string> {
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}
