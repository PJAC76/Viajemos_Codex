import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { TripMessage, TripMessageUpsertInput } from "../domain/types";
import { messagesQueries } from "./messages-queries";

export function useMessages(tripId?: string, userNames: Record<string, string> = {}) {
  const { user } = useSession();
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);
  const insforge = getInsforgeClient();

  async function reload() {
    if (!tripId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessages(await messagesQueries.listMessages(tripId, userNames));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los mensajes del viaje.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, JSON.stringify(userNames)]);

  useEffect(() => {
    if (!insforge || !tripId) {
      return;
    }

    const channelName = `trip-chat:${tripId}`;
    let cancelled = false;

    const handleMessageCreated = (payload: { meta?: { channel?: string } }) => {
      if (payload.meta?.channel !== channelName || cancelled) {
        return;
      }

      void reload();
    };

    void insforge.realtime.connect().then(async () => {
      if (cancelled) {
        return;
      }

      await insforge.realtime.subscribe(channelName);
      insforge.realtime.on("message_created", handleMessageCreated);
    }).catch(() => {
      // Realtime is best-effort; the chat still works through manual reloads.
    });

    return () => {
      cancelled = true;
      insforge.realtime.off("message_created", handleMessageCreated);
      insforge.realtime.unsubscribe(channelName);
    };
  }, [insforge, tripId, JSON.stringify(userNames)]);

  async function createMessage(input: TripMessageUpsertInput) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa y un viaje para enviar mensajes.");
    }

    const nextMessage = await messagesQueries.createMessage(
      tripId,
      user.id,
      user.displayName ?? user.email ?? "Miembro",
      input
    );

    setMessages((currentMessages) =>
      [...currentMessages, nextMessage].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    );

    return nextMessage;
  }

  async function deleteMessage(messageId: string) {
    await messagesQueries.deleteMessage(messageId);
    setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));
  }

  const groupedCounts = useMemo(
    () => ({
      total: messages.length,
      mine: user ? messages.filter((message) => message.authorId === user.id).length : 0
    }),
    [messages, user]
  );

  return {
    messages,
    groupedCounts,
    loading,
    error,
    reload,
    createMessage,
    deleteMessage
  };
}
