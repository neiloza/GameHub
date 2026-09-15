import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_KIND_CATEGORY,
  categoryFor,
  describeNotification,
  isCategoryEnabled,
  isKnownNotificationKind,
  unreadCount,
} from './notifications';
import { NOTIFICATION_KINDS } from '../constants';

const base = { id: 'n1', payload: {}, created_at: '2026-06-01T00:00:00Z' };

describe('the category table', () => {
  it('covers every kind, so nothing is un-unsubscribable', () => {
    for (const kind of NOTIFICATION_KINDS) {
      expect(NOTIFICATION_KIND_CATEGORY[kind]).toBeDefined();
    }
    expect(Object.keys(NOTIFICATION_KIND_CATEGORY).sort()).toEqual([...NOTIFICATION_KINDS].sort());
  });

  it('files an unknown kind under account, never marketing', () => {
    // Getting this backwards means marketing somebody who opted out.
    expect(categoryFor('something_added_next_year')).toBe('account');
    expect(isKnownNotificationKind('something_added_next_year')).toBe(false);
  });
});

describe('describeNotification', () => {
  it('has readable copy and a destination for every kind', () => {
    for (const kind of NOTIFICATION_KINDS) {
      const d = describeNotification({ ...base, kind });
      expect(d.title.length).toBeGreaterThan(0);
      // `system_announcement` carries its own body in the payload; the rest
      // must have something to say on their own.
      if (kind !== 'system_announcement') expect(d.body.length).toBeGreaterThan(0);
    }
  });

  it('names the listing when the payload carries it and degrades when it does not', () => {
    const named = describeNotification({
      ...base,
      kind: 'enquiry_received',
      payload: { listing_name: 'Walnut Desk Lamp', listing_id: 'l1', conversation_id: 'c1' },
    });
    expect(named.body).toContain('Walnut Desk Lamp');
    expect(named.href).toBe('/listings/l1/enquiries/c1');

    const bare = describeNotification({ ...base, kind: 'enquiry_received' });
    expect(bare.body).not.toContain('undefined');
    expect(bare.href).toBe('/listings');
  });

  it('sends each side of a conversation to its own route', () => {
    const toBuyer = describeNotification({
      ...base,
      kind: 'message_received',
      payload: { conversation_id: 'c1', recipient_side: 'buyer' },
    });
    expect(toBuyer.href).toBe('/messages/c1');

    const toSeller = describeNotification({
      ...base,
      kind: 'message_received',
      payload: { conversation_id: 'c1', recipient_side: 'seller', listing_id: 'l1' },
    });
    expect(toSeller.href).toBe('/listings/l1/enquiries/c1');
  });

  it('renders a row written by an older build rather than crashing', () => {
    const d = describeNotification({ ...base, kind: 'a_kind_from_last_year', payload: null });
    expect(d.title).toBe('Notification');
    expect(d.href).toBeNull();
  });

  it('formats money from integer cents', () => {
    const d = describeNotification({
      ...base,
      kind: 'payout_sent',
      payload: { amount_cents: 12_345 },
    });
    expect(d.body).toContain('$123.45');
  });
});

describe('isCategoryEnabled', () => {
  it('defaults everything except marketing to on when there is no row yet', () => {
    expect(isCategoryEnabled(null, 'message_received', 'email')).toBe(true);
    expect(isCategoryEnabled(null, 'enquiry_received', 'email')).toBe(true);
    expect(isCategoryEnabled(null, 'membership_started', 'email')).toBe(true);
    expect(isCategoryEnabled(null, 'system_announcement', 'email')).toBe(false);
  });

  it('honours an explicit opt-out', () => {
    const prefs = { email_messages: false, email_activity: true };
    expect(isCategoryEnabled(prefs, 'message_received', 'email')).toBe(false);
    expect(isCategoryEnabled(prefs, 'enquiry_received', 'email')).toBe(true);
  });

  it('pushes only the two categories that are worth a phone buzzing', () => {
    expect(isCategoryEnabled(null, 'message_received', 'push')).toBe(true);
    expect(isCategoryEnabled(null, 'enquiry_received', 'push')).toBe(true);
    expect(isCategoryEnabled(null, 'membership_started', 'push')).toBe(false);
    expect(isCategoryEnabled(null, 'system_announcement', 'push')).toBe(false);
  });
});

describe('unreadCount', () => {
  it('counts rows with no read_at', () => {
    expect(
      unreadCount([
        { ...base, kind: 'enquiry_received' },
        { ...base, kind: 'enquiry_received', read_at: '2026-06-02T00:00:00Z' },
      ])
    ).toBe(1);
  });
});
