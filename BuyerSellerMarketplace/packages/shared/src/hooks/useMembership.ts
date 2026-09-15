'use client';

import { useEffect, useRef, useState } from 'react';
import type { MarketplaceClient } from '../api/client';
import { getMyMembership } from '../api/billing';
import { membershipFor, type MembershipEntitlements } from '../lib/membership';
import type { Membership } from '../types/database';

export type UseMembershipResult = {
  membership: Membership | null;
  entitlements: MembershipEntitlements;
  loading: boolean;
};

/**
 * The caller's membership and what it entitles them to.
 *
 * `entitlements` is derived rather than stored, so there is exactly one answer
 * to "may they do this" and it is the one in `lib/membership.ts`. A failed read
 * resolves to no membership, which is the safe direction: the worst case is a
 * paying member briefly seeing an upgrade prompt, not a non-member getting
 * paid tooling.
 */
export function useMembership(
  client: MarketplaceClient,
  profileId: string | null | undefined
): UseMembershipResult {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef(client);
  clientRef.current = client;

  useEffect(() => {
    if (!profileId) {
      setMembership(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMyMembership(clientRef.current)
      .then((row) => {
        if (!cancelled) setMembership(row);
      })
      .catch(() => {
        if (!cancelled) setMembership(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return { membership, entitlements: membershipFor(membership), loading };
}
