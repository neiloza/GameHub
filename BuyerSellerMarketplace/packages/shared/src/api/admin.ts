import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import type { AccountStatus, ReportStatus, Role } from '../constants';
import type { AdminAuditLog, Profile, Report } from '../types/database';

/**
 * The administrator console.
 *
 * Every call here is admin-only, and none of them says so: the check lives in
 * RLS and in the security-definer functions, so a signed-in member calling
 * these directly gets nothing back rather than getting a client-side guard they
 * could step around. `canAccessPath('/admin', …)` exists only so an
 * administrator sees the console and a member does not see a broken link.
 *
 * Every privileged action writes an audit row, in the same transaction as the
 * change. That is the point of doing them in the database: an action that
 * succeeded but was not logged, or logged but did not happen, is worse than
 * either outcome on its own.
 */

export async function searchAccounts(
  client: MarketplaceClient,
  query: string,
  limit = 50
): Promise<Profile[]> {
  const { data, error } = await client.rpc('admin_search_accounts', {
    p_query: query,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

/**
 * Change somebody's role.
 *
 * The one sanctioned way past `protect_profile_privileged_columns`. Normally a
 * role arrives by approving an application; this exists for the cases an
 * application cannot express — correcting a mistake, granting `both`, moving an
 * account between sides at its owner's request.
 */
export async function setRole(
  client: MarketplaceClient,
  profileId: string,
  role: Role
): Promise<void> {
  const { error } = await client.rpc('admin_set_role', {
    p_profile_id: profileId,
    p_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function setAccountStatus(
  client: MarketplaceClient,
  profileId: string,
  status: AccountStatus
): Promise<void> {
  const { error } = await client.rpc('admin_set_account_status', {
    p_profile_id: profileId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}

/**
 * Suspend a listing.
 *
 * A plain update: the trigger on `listings` already refuses `suspended` from
 * anybody but an administrator, so there is nothing a function would add beyond
 * the audit row, which the trigger writes.
 */
export async function suspendListing(
  client: MarketplaceClient,
  listingId: string,
  suspended: boolean
): Promise<void> {
  const { error } = await client
    .from('listings')
    .update({ status: suspended ? 'suspended' : 'draft' })
    .eq('id', listingId);
  if (error) throw new Error(error.message);
}

export async function listReports(
  client: MarketplaceClient,
  status?: ReportStatus
): Promise<Report[]> {
  let q = client.from('reports').select('*');
  if (status) q = q.eq('status', status);
  // Oldest first: this is a queue somebody works through, not a feed.
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function resolveReport(
  client: MarketplaceClient,
  reportId: string,
  status: ReportStatus
): Promise<Report> {
  const resolved_by = await requireUserId(client);
  const { data, error } = await client
    .from('reports')
    .update({ status, resolved_by, resolved_at: new Date().toISOString() })
    .eq('id', reportId)
    .select()
    .single();
  return assertOk(data, error);
}

export async function getAuditLog(
  client: MarketplaceClient,
  limit = 200
): Promise<AdminAuditLog[]> {
  const { data, error } = await client
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
