// Send the push half of the outbox.
//
// Point a database webhook at this for INSERTs on `public.notification_deliveries`
// where channel = 'push', or call it on the same schedule as
// notification-dispatch. Uses Expo's push service, which needs no credentials —
// the device token is the authorisation.

import { adminClient, json } from '../_shared/supabase.ts';

const EXPO_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const admin = adminClient();

  const { data: claimed, error } = await admin.rpc('claim_notification_delivery', {
    p_limit: 50,
  });
  if (error) return json({ error: error.message }, 500);

  const deliveries = ((claimed ?? []) as { id: string; notification_id: string; channel: string }[])
    .filter((d) => d.channel === 'push');

  let sent = 0;

  for (const delivery of deliveries) {
    const { data: notification } = await admin
      .from('notifications')
      .select('profile_id, kind, payload')
      .eq('id', delivery.notification_id)
      .maybeSingle();

    if (!notification) {
      await admin
        .from('notification_deliveries')
        .update({ delivered_at: new Date().toISOString(), error: 'notification gone' })
        .eq('id', delivery.id);
      continue;
    }

    const { data: tokens } = await admin
      .from('push_tokens')
      .select('token')
      .eq('profile_id', notification.profile_id);

    if (!tokens?.length) {
      await admin
        .from('notification_deliveries')
        .update({ delivered_at: new Date().toISOString(), error: 'no device registered' })
        .eq('id', delivery.id);
      continue;
    }

    try {
      // The title and body are deliberately generic. A lock-screen preview is
      // readable by whoever is holding the phone, and the notification is a
      // prompt to open the app rather than a copy of what was said.
      const response = await fetch(EXPO_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tokens.map((t) => ({
            to: t.token,
            title: 'New activity',
            body: 'Open the app to see what happened.',
            data: { kind: notification.kind, payload: notification.payload },
          }))
        ),
      });
      if (!response.ok) throw new Error(`push service returned ${response.status}`);

      await admin
        .from('notification_deliveries')
        .update({ delivered_at: new Date().toISOString(), error: null })
        .eq('id', delivery.id);
      sent++;
    } catch (e) {
      await admin
        .from('notification_deliveries')
        .update({ claimed_at: null, error: (e as Error).message })
        .eq('id', delivery.id);
    }
  }

  return json({ claimed: deliveries.length, sent });
});
