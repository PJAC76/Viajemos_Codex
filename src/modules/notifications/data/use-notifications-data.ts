import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { AppNotification } from "../domain/types";
import { notificationsQueries } from "./notifications-queries";

export function useNotifications() {
  const { user } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const insforge = getInsforgeClient();

  async function reload() {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotifications(await notificationsQueries.listNotifications(user.id));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  useEffect(() => {
    if (!insforge || !user?.id) {
      return;
    }

    const channelName = `user-notifications:${user.id}`;
    let cancelled = false;

    const handleNotificationCreated = (payload: { meta?: { channel?: string } }) => {
      if (cancelled || payload.meta?.channel !== channelName) {
        return;
      }

      void reload();
    };

    void insforge.realtime.connect().then(async () => {
      if (cancelled) {
        return;
      }

      await insforge.realtime.subscribe(channelName);
      insforge.realtime.on("notification_created", handleNotificationCreated);
    }).catch(() => {
      // Best-effort realtime: the feed still works with manual reloads.
    });

    return () => {
      cancelled = true;
      insforge.realtime.off("notification_created", handleNotificationCreated);
      insforge.realtime.unsubscribe(channelName);
    };
  }, [insforge, user?.id]);

  async function markAsRead(notificationId: string) {
    await notificationsQueries.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
              readAt: notification.readAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    await notificationsQueries.markAllAsRead();
    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? now,
        updatedAt: now
      }))
    );
  }

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload,
    markAsRead,
    markAllAsRead
  };
}
