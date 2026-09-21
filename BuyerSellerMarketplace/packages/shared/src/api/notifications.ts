import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MarketplaceClient } from './client';
import { assertOk, requireUserId } from './client';
import { notificationPreferencesSchema, pushTokenSchema } from '../schemas';
import type { NotificationPreferencesInput, PushTokenInput } from '../schemas';
import type { Notification, NotificationPreferences } from '../types/database';

export async function getNotifications(
  client: MarketplaceClient,
  limit = 50
): Promise<Notification[]> {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadCount(client: MarketplaceClient): Promise<number> {
  const { count, error } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markRead(client: MarketplaceClient, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids);
  if (error) throw new Error(error.message);
}

export async function markAllRead(client: MarketplaceClient): Promise<void> {
  const profile_id = await requireUserId(client);
  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', profile_id)
    .is('read_at', null);
  if (error) throw new Error(error.message);
}

/** Live updates for the bell. Returns the channel; remove it on unmount. */
export function subscribeToNotifications(
  client: MarketplaceClient,
  profileId: string,
  onNotification: (n: Notification) => void
): RealtimeChannel {
  return client
    .channel(`notifications:${profileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      },
      (payload) => onNotification(payload.new as Notification)
    )
    .subscribe();
}

export async function getNotificationPreferences(
  client: MarketplaceClient
): Promise<NotificationPreferences | null> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', auth.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateNotificationPreferences(
  client: MarketplaceClient,
  input: NotificationPreferencesInput
): Promise<NotificationPreferences> {
  const parsed = notificationPreferencesSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { data, error } = await client
    .from('notification_preferences')
    .upsert({ profile_id, ...parsed })
    .select()
    .single();
  return assertOk(data, error);
}

/**
 * Register a device for push.
 *
 * Upserted on the token rather than on the profile: one person can have a
 * phone, a tablet and a desktop browser, and a token can move between accounts
 * when a device is handed over. Conflict on the token means the newest owner
 * wins, which is the behaviour that stops a notification going to whoever had
 * the handset last.
 */
export async function registerPushToken(
  client: MarketplaceClient,
  input: PushTokenInput
): Promise<void> {
  const parsed = pushTokenSchema.parse(input);
  const profile_id = await requireUserId(client);
  const { error } = await client
    .from('push_tokens')
    .upsert({ profile_id, ...parsed }, { onConflict: 'token' });
  if (error) throw new Error(error.message);
}

export async function unregisterPushToken(
  client: MarketplaceClient,
  token: string
): Promise<void> {
  const { error } = await client.from('push_tokens').delete().eq('token', token);
  if (error) throw new Error(error.message);
}
