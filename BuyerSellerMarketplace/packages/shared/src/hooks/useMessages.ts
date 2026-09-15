'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketplaceClient } from '../api/client';
import { getMessages, markConversationRead, sendMessage, subscribeToMessages } from '../api/chat';
import type { Message } from '../types/database';

export type UseMessagesResult = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  /** Optimistic send: the message appears immediately, reconciled on ack. */
  send: (body: string) => Promise<void>;
};

/**
 * Optimistic rows get a prefixed id.
 *
 * Real ids are uuids, which never contain a colon, so `OPTIMISTIC` can never
 * collide with one and is a reliable test for "not yet saved" without a second
 * field. The counter is module-level so two conversations open at once cannot
 * mint the same placeholder.
 */
const OPTIMISTIC = 'optimistic:';
let optimisticSeq = 0;

export function useMessages(
  client: MarketplaceClient,
  conversationId: string | null,
  currentUserId: string | null
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The client is stable in practice but is not referentially stable across
  // renders, and putting it in the dependency array would tear down and rebuild
  // the realtime subscription on every render.
  const clientRef = useRef(client);
  clientRef.current = client;

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    getMessages(clientRef.current, conversationId)
      .then((initial) => {
        if (cancelled) return;
        setMessages(initial);
        setError(null);
        // Best-effort: failing to mark read must not break the thread.
        void markConversationRead(clientRef.current, conversationId).catch(() => {});
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const channel = subscribeToMessages(clientRef.current, conversationId, (incoming) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        // The realtime echo of our own send arrives while the optimistic row is
        // still on screen. Replace it rather than showing the message twice.
        const optimisticIdx = prev.findIndex(
          (m) =>
            m.id.startsWith(OPTIMISTIC) &&
            m.sender_id === incoming.sender_id &&
            m.body === incoming.body
        );
        if (optimisticIdx >= 0) {
          const next = [...prev];
          next[optimisticIdx] = incoming;
          return next;
        }
        return [...prev, incoming];
      });
    });

    return () => {
      cancelled = true;
      void clientRef.current.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (body: string) => {
      if (!conversationId || !currentUserId) throw new Error('No conversation');
      const optimistic = {
        id: `${OPTIMISTIC}${optimisticSeq++}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
        created_at: new Date().toISOString(),
      } as Message;

      setMessages((prev) => [...prev, optimistic]);
      try {
        const saved = await sendMessage(clientRef.current, conversationId, body);
        setMessages((prev) =>
          // The subscription may have already swapped it in.
          prev.some((m) => m.id === saved.id)
            ? prev.filter((m) => m.id !== optimistic.id)
            : prev.map((m) => (m.id === optimistic.id ? saved : m))
        );
      } catch (e) {
        // Roll the optimistic row back so the member is not left believing a
        // message was sent that never was.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        throw e;
      }
    },
    [conversationId, currentUserId]
  );

  return { messages, loading, error, send };
}
