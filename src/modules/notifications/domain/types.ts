export type NotificationKind = "invitation" | "expense" | "message" | "itinerary" | "settlement" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  tripId?: string;
  actorId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}
