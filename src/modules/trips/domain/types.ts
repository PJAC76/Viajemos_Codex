export type TripRole = "admin" | "member";
export type TripStatus = "draft" | "active" | "closed";

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  currency: "EUR";
  status: TripStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role: TripRole;
  status: "active" | "invited";
  joinedAt?: string;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedBy: string;
  shareUrl?: string;
  token?: string;
  createdAt?: string;
}

export interface TripInvitationPreview {
  id: string;
  tripId: string;
  tripTitle: string;
  destination: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedBy: string;
  invitedByName: string;
  shareUrl?: string;
  viewerEmail?: string;
  viewerMatchesEmail: boolean;
}

export interface TripUpsertInput {
  title: string;
  destination: string;
  description: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
}
