export type ItineraryItemType = "linked_place" | "manual";

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

export interface RouteSnapshot {
  id: string;
  tripId: string;
  dayId: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  segments: Array<{
    from: string;
    to: string;
    distanceKm: number;
    durationMinutes: number;
  }>;
}
