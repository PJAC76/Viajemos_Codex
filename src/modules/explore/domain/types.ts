import type { DefaultMapMode } from "../../settings/domain/types";

export type ExploreResultKind = "trip" | "place" | "reservation" | "expense" | "document";

export interface ExploreSearchResult {
  id: string;
  tripId?: string;
  tripTitle?: string;
  tripDestination?: string;
  kind: ExploreResultKind;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  badge: string;
  icon: string;
  dateLabel?: string;
  searchText: string;
}

export interface ExploreReservationItem {
  id: string;
  tripId: string;
  tripTitle: string;
  title: string;
  status: "confirmed" | "pending" | "cancelled";
  startAt: string;
  amount?: number;
}

export interface ExploreExpenseItem {
  id: string;
  tripId: string;
  tripTitle: string;
  concept: string;
  amount: number;
  date: string;
}

export interface ExploreDocumentItem {
  id: string;
  tripId: string;
  tripTitle: string;
  title: string;
  fileName: string;
  documentType: "pdf" | "image" | "file";
  updatedAt: string;
}

export interface ExploreSnapshot {
  activeTripsCount: number;
  favoritePlacesCount: number;
  upcomingReservationsCount: number;
  unreadNotificationsCount: number;
  preferredMapMode: DefaultMapMode;
  availableTrips: Array<{
    id: string;
    title: string;
    destination: string;
  }>;
  quickTrips: Array<{
    id: string;
    title: string;
    destination: string;
    coverImage: string;
    startDate: string;
    endDate: string;
  }>;
  upcomingReservations: ExploreReservationItem[];
  recentExpenses: ExploreExpenseItem[];
  recentDocuments: ExploreDocumentItem[];
  searchResults: ExploreSearchResult[];
}
