'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketplaceClient } from '../api/client';
import {
  getNotifications,
  markAllRead as markAllReadApi,
  markRead as markReadApi,
  subscribeToNotifications,
} from '../api/notifications';
import { unreadCount } from '../lib/notifications';
import type { Notification } from '../types/database';

export type UseNotificationsResult = {
  notifications: Notification[];
  unread: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const byNewest = (rows: Notification[]) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

/**
 * The notification center's data.
 *
 * A failure here resolves to an empty list rather than blocking the page: the
 * bell is an accelerator, and every notification is also reachable from the
 * page it is about. A member seeing no badge is a worse outcome than a member
 * seeing an error where the badge should be — but only slightly, and a broken
 * header is much worse than either.
 */
export function useNotifications(
  client: MarketplaceClient,
  profileId: string | null | undefined
): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef(client);
  clientRef.current = client;

  const refresh = useCallback(async () => {
    try {
      setNotifications(byNewest(await getNotifications(clientRef.current)));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profileId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    void refresh();

    const channel = subscribeToNotifications(clientRef.current, profileId, (incoming) => {
      setNotifications((prev) =>
        // The realtime echo can arrive after a refresh already inserted it.
        prev.some((n) => n.id === incoming.id) ? prev : byNewest([incoming, ...prev])
      );
    });

    return () => {
      void clientRef.current.removeChannel(channel);
    };
  }, [profileId, refresh]);

  const markRead = useCallback(async (id: string) => {
    const at = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: at } : n)));
    await markReadApi(clientRef.current, [id]);
  }, []);

  const markAllRead = useCallback(async () => {
    const at = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: at })));
    await markAllReadApi(clientRef.current);
  }, []);

  return {
    notifications,
    unread: unreadCount(notifications),
    loading,
    markRead,
    markAllRead,
    refresh,
  };
}
