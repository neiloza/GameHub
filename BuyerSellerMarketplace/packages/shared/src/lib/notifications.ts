/**
 * Notification presentation — pure, so the bell, the history page, and any
 * future channel all describe an event the same way.
 *
 * Copy lives here rather than in the components because two surfaces render the
 * same row (the dropdown and `/notifications`) and a third reads the category
 * (the settings page). Splitting the wording across them is how they drift.
 *
 * Nothing here decides *whether* a member is emailed or pushed — that is the
 * database's job, in `claim_notification_delivery()`. `isCategoryEnabled` exists
 * so the UI can explain the current setting, not to gate a send.
 */

import { NOTIFICATION_KINDS } from '../constants';
import type { NotificationCategory, NotificationKind } from '../constants';

/**
 * Every kind, mapped to the preference group that governs it.
 *
 * Exhaustive over `NOTIFICATION_KINDS` — the test beside this file checks that,
 * because a kind missing from this table is a notification nobody can turn off.
 * It must agree with `notification_category()` in the database, which is what
 * actually decides whether a delivery row is written.
 */
export const NOTIFICATION_KIND_CATEGORY: Record<NotificationKind, NotificationCategory> = {
  enquiry_received: 'activity',
  message_received: 'messages',
  application_reviewed: 'account',
  application_info_requested: 'account',
  membership_started: 'account',
  membership_trouble: 'account',
  referral_qualified: 'account',
  payout_sent: 'account',
  listing_suspended: 'account',
  identity_verified: 'account',
  system_announcement: 'marketing',
};

export type NotificationPreferenceLike = {
  email_activity?: boolean | null;
  email_messages?: boolean | null;
  email_account?: boolean | null;
  email_marketing?: boolean | null;
  push_activity?: boolean | null;
  push_messages?: boolean | null;
};

export type NotificationLike = {
  id: string;
  kind: string;
  payload: unknown;
  read_at?: string | null;
  created_at: string;
};

export type DescribedNotification = {
  title: string;
  body: string;
  /** Where clicking it should land, or null when there is nowhere useful to go. */
  href: string | null;
};

/** Narrow the free-text `kind` column to one we have copy for. */
export function isKnownNotificationKind(kind: string): kind is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(kind);
}

/**
 * An unknown kind falls back to `account` rather than `marketing`.
 *
 * Getting this backwards is the difference between a member missing a notice
 * about their own account and a member being marketed to after opting out. The
 * safe default is the category nobody unsubscribes from for legal reasons.
 */
export function categoryFor(kind: string): NotificationCategory {
  return isKnownNotificationKind(kind) ? NOTIFICATION_KIND_CATEGORY[kind] : 'account';
}

function field(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = (payload as Record<string, unknown>)[key];
  if (value == null) return null;
  return typeof value === 'string' ? value : String(value);
}

/**
 * Turn a stored notification into something a person can read and click.
 *
 * The payload is deliberately read defensively: these rows are written by
 * database triggers over a long time, and a row written by last year's trigger
 * must still render. A missing name degrades to a generic sentence rather than
 * rendering "undefined".
 */
export function describeNotification(n: NotificationLike): DescribedNotification {
  const p = n.payload;
  const listingName = field(p, 'listing_name');
  const listingId = field(p, 'listing_id');
  const conversationId = field(p, 'conversation_id');

  switch (n.kind) {
    case 'enquiry_received': {
      const buyer = field(p, 'buyer_name');
      return {
        title: 'Somebody asked about a listing',
        body: listingName
          ? `${buyer ?? 'A shopper'} has a question about ${listingName}.`
          : `${buyer ?? 'A shopper'} has a question about one of your listings.`,
        href:
          listingId && conversationId
            ? `/listings/${listingId}/enquiries/${conversationId}`
            : '/listings',
      };
    }

    case 'message_received': {
      const sender = field(p, 'sender_name');
      // The two sides read the same thread at different routes — a shopper at
      // /messages/:id, a seller inside the listing it is about. The payload
      // carries the recipient's side for exactly this, because the trigger
      // knows which of the two it just wrote to and the client does not.
      const side = field(p, 'recipient_side');
      const href =
        conversationId == null
          ? null
          : side === 'buyer'
            ? `/messages/${conversationId}`
            : listingId
              ? `/listings/${listingId}/enquiries/${conversationId}`
              : '/listings';
      return {
        title: 'New message',
        body: sender ? `${sender} sent you a message.` : 'You have a new message.',
        href,
      };
    }

    case 'application_reviewed': {
      const outcome = field(p, 'status');
      const role = field(p, 'role');
      return {
        title: outcome === 'approved' ? 'Application approved' : 'Application reviewed',
        body:
          outcome === 'approved'
            ? `Your ${role ?? 'role'} application was approved — your new tools are live.`
            : `Your ${role ?? 'role'} application was reviewed. Open it for the details.`,
        href: '/apply',
      };
    }

    case 'application_info_requested':
      return {
        title: 'More information needed',
        body: 'An administrator asked a question about your application.',
        href: '/apply',
      };

    case 'membership_started':
      return {
        title: 'Membership active',
        body: 'Your membership is live. Everything it unlocks is available now.',
        href: '/membership',
      };

    case 'membership_trouble':
      return {
        title: 'There is a problem with your payment',
        body: 'We could not take the last payment. Update your card to keep your membership.',
        href: '/membership',
      };

    case 'referral_qualified': {
      const amount = field(p, 'fee_cents');
      return {
        title: 'A referral qualified',
        body: amount
          ? `One of your referrals converted. ${formatCentsExact(Number(amount))} added to your balance.`
          : 'One of your referrals converted.',
        href: '/promoter',
      };
    }

    case 'payout_sent': {
      const amount = field(p, 'amount_cents');
      return {
        title: 'Payout sent',
        body: amount
          ? `${formatCentsExact(Number(amount))} is on its way to you.`
          : 'Your payout is on its way.',
        href: '/promoter',
      };
    }

    case 'listing_suspended':
      return {
        title: 'A listing was suspended',
        body: listingName
          ? `${listingName} was suspended by an administrator.`
          : 'One of your listings was suspended by an administrator.',
        href: listingId ? `/listings/${listingId}` : '/listings',
      };

    case 'identity_verified':
      return {
        title: 'Identity verified',
        body: 'Your identity check passed. The verified badge is on your profile.',
        href: '/settings',
      };

    case 'system_announcement':
      return {
        title: field(p, 'title') ?? 'Announcement',
        body: field(p, 'body') ?? '',
        href: field(p, 'href'),
      };

    default:
      // A kind this build has no copy for. Render something truthful rather
      // than nothing — an old row is still a real event that happened.
      return {
        title: 'Notification',
        body: 'Something happened on your account.',
        href: null,
      };
  }
}

/** Money for display, from integer cents. Never do arithmetic on the way here. */
export function formatCentsExact(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/**
 * Is the member currently opted in to this channel for this kind?
 *
 * Presentation only. The database decides what is actually sent; this lets the
 * settings page explain the consequence of a switch in the member's own words.
 */
export function isCategoryEnabled(
  prefs: NotificationPreferenceLike | null | undefined,
  kind: string,
  channel: 'email' | 'push'
): boolean {
  const category = categoryFor(kind);
  // No row yet means the table's own column defaults apply. Substituting them
  // here rather than returning early is what keeps the two channels honest:
  // an early "on for everything but marketing" would push account notices,
  // which the switch below deliberately never does.
  prefs = prefs ?? {};

  if (channel === 'push') {
    switch (category) {
      case 'messages':
        return prefs.push_messages ?? true;
      case 'activity':
        return prefs.push_activity ?? true;
      // Account and marketing notices are not pushed at all.
      default:
        return false;
    }
  }

  switch (category) {
    case 'activity':
      return prefs.email_activity ?? true;
    case 'messages':
      return prefs.email_messages ?? true;
    case 'account':
      return prefs.email_account ?? true;
    case 'marketing':
      return prefs.email_marketing ?? false;
  }
}

/** Unread count for the bell. */
export function unreadCount(notifications: NotificationLike[]): number {
  return notifications.filter((n) => !n.read_at).length;
}
