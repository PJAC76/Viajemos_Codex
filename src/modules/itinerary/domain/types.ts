export type ItineraryItemType = "linked_place" | "manual";
export type RouteTravelMode = "driving" | "walking" | "transit";

export interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  label: string;
  position: number;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  dayId: string;
  type: ItineraryItemType;
  title: string;
  startTime: string;
  endTime?: string;
  address: string;
  notes: string;
  placeId?: string;
  order: number;
  createdBy: string;
  transitLabel?: string;
  icon?: string;
}

export interface ItineraryItemUpsertInput {
  dayId: string;
  type: ItineraryItemType;
  title: string;
  startTime: string;
  endTime?: string;
  address: string;
  notes: string;
  placeId?: string;
  icon?: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteSnapshotDraft {
  tripId: string;
  dayId: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  travelMode: RouteTravelMode;
  segments: RouteSegment[];
}

export interface RouteSnapshot extends RouteSnapshotDraft {
  id: string;
  createdBy?: string;
  updatedAt?: string;
}
