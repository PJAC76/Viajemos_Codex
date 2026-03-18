import { messages as mockMessages } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { TripMessage, TripMessageUpsertInput } from "../domain/types";

function normalizeMessage(row: Record<string, unknown>, userNames: Record<string, string>): TripMessage {
  const authorId = typeof row.author_id === "string" ? row.author_id : "";

  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    authorId,
    authorName: userNames[authorId] ?? authorId,
    body: typeof row.body === "string" ? row.body : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

export const messagesQueries = {
  async listMessages(tripId: string, userNames: Record<string, string> = {}) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return mockMessages
        .filter((message) => message.tripId === tripId)
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    }

    const { data, error } = await insforge.database
      .from("messages")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar los mensajes del viaje.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => normalizeMessage(row, userNames));
  },

  async createMessage(tripId: string, authorId: string, authorName: string, input: TripMessageUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const nextMessage: TripMessage = {
        id: `message-${crypto.randomUUID()}`,
        tripId,
        authorId,
        authorName,
        body: input.body.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockMessages.push(nextMessage);
      return nextMessage;
    }

    const { data, error } = await insforge.database
      .from("messages")
      .insert([
        {
          trip_id: tripId,
          author_id: authorId,
          body: input.body.trim()
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo enviar el mensaje.");
    }

    return normalizeMessage(data as Record<string, unknown>, { [authorId]: authorName });
  },

  async deleteMessage(messageId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const index = mockMessages.findIndex((message) => message.id === messageId);

      if (index >= 0) {
        mockMessages.splice(index, 1);
      }

      return;
    }

    const { error } = await insforge.database.from("messages").delete().eq("id", messageId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el mensaje.");
    }
  }
};
