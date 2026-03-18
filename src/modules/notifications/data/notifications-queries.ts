import { notifications as mockNotifications } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AppNotification, NotificationKind } from "../domain/types";

function normalizeKind(value: unknown): NotificationKind {
  return value === "invitation" ||
    value === "expense" ||
    value === "message" ||
    value === "itinerary" ||
    value === "settlement"
    ? value
    : "system";
}

function normalizeNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tripId: typeof row.trip_id === "string" ? row.trip_id : undefined,
    actorId: typeof row.actor_id === "string" ? row.actor_id : undefined,
    kind: normalizeKind(row.kind),
    title: typeof row.title === "string" ? row.title : "Notificacion",
    body: typeof row.body === "string" ? row.body : "",
    isRead: Boolean(row.is_read),
    readAt: typeof row.read_at === "string" ? row.read_at : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : undefined
  };
}

function toNotificationError(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  if (message.includes("NOTIFICATION_NOT_FOUND")) {
    return "La notificacion ya no esta disponible.";
  }

  return message;
}

export const notificationsQueries = {
  async listNotifications(userId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return mockNotifications
        .filter((item) => item.userId === userId)
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    const { data, error } = await insforge.database
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(toNotificationError(error.message, "No se pudieron cargar las notificaciones."));
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeNotification);
  },

  async markAsRead(notificationId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const notification = mockNotifications.find((item) => item.id === notificationId);

      if (notification) {
        notification.isRead = true;
        notification.readAt = notification.readAt ?? new Date().toISOString();
        notification.updatedAt = new Date().toISOString();
      }

      return notification ?? null;
    }

    const { data, error } = await insforge.database.rpc("mark_notification_as_read", {
      target_notification_id: notificationId
    });

    if (error) {
      throw new Error(toNotificationError(error.message, "No se pudo marcar la notificacion como leida."));
    }

    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : (data as Record<string, unknown> | null);
    return row ? normalizeNotification(row) : null;
  },

  async markAllAsRead() {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const now = new Date().toISOString();

      for (const notification of mockNotifications) {
        notification.isRead = true;
        notification.readAt = notification.readAt ?? now;
        notification.updatedAt = now;
      }

      return mockNotifications.length;
    }

    const { data, error } = await insforge.database.rpc("mark_all_notifications_as_read");

    if (error) {
      throw new Error(toNotificationError(error.message, "No se pudieron marcar todas las notificaciones."));
    }

    if (Array.isArray(data)) {
      return Number(data[0] ?? 0);
    }

    return Number(data ?? 0);
  }
};
