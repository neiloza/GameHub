// Drain the notification outbox.
//
// Claims a batch of pending deliveries and hands each to whatever provider is
// configured. With none configured this returns cleanly having done nothing —
// which is deliberate: the platform works without it, members simply see the
// in-app notification center instead of also getting mail.
//
// Run it on a schedule (Supabase cron, or any external scheduler hitting this
// URL with the service-role key). Two copies running at once are safe:
// `claim_notification_delivery()` uses `for update skip locked`, so each claims
// a disjoint batch.
//
// Env: EMAIL_WEBHOOK_URL (optional) — anything that accepts a JSON POST.

import { adminClient, json } from '../_shared/supabase.ts';

type Delivery = {
  id: string;
  notification_id: string;
  channel: string;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const admin = adminClient();

  const { data: claimed, error } = await admin.rpc('claim_notification_delivery', {
    p_limit: 50,
  });
  if (error) return json({ error: error.message }, 500);

  const deliveries = (claimed ?? []) as Delivery[];
  const endpoint = Deno.env.get('EMAIL_WEBHOOK_URL');

  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    if (delivery.channel !== 'email' || !endpoint) {
      // Nothing configured for this channel. Mark it delivered rather than
      // leaving it to be retried for ever: the in-app record already landed,
      // and an outbox that never empties hides the rows that did fail.
      await admin
        .from('notification_deliveries')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', delivery.id);
      continue;
    }

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

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: notification.profile_id,
          kind: notification.kind,
          payload: notification.payload,
        }),
      });
      if (!response.ok) throw new Error(`provider returned ${response.status}`);

      await admin
        .from('notification_deliveries')
        .update({ delivered_at: new Date().toISOString(), error: null })
        .eq('id', delivery.id);
      sent++;
    } catch (e) {
      // Release the claim so the next run picks it up. `attempts` was already
      // incremented by the claim, and the claim function stops at five — a
      // provider that has refused the same message five times is not going to
      // accept it on the sixth.
      await admin
        .from('notification_deliveries')
        .update({ claimed_at: null, error: (e as Error).message })
        .eq('id', delivery.id);
      failed++;
    }
  }

  return json({ claimed: deliveries.length, sent, failed });
});
