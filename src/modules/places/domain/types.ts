export type PlaceType = "hotel" | "restaurant" | "place";

export interface Place {
  id: string;
  tripId: string;
  type: PlaceType;
  name: string;
  address: string;
  rating?: number;
  image?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  createdBy: string;
  favorite: boolean;
  favoriteCount: number;
}

export interface PlaceUpsertInput {
  type: PlaceType;
  name: string;
  address: string;
  rating?: number;
  image?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  tripId: string;
  placeId?: string;
  kind: "hotel" | "restaurant" | "activity";
  title: string;
  confirmationCode: string;
  startAt: string;
  endAt?: string;
  status: "confirmed" | "pending" | "cancelled";
  partySize: number;
  roomOrTableCount?: number;
  amount?: number;
  currency: "EUR";
  cancellationPolicy?: string;
  phone?: string;
  email?: string;
  bookingUrl?: string;
  notes?: string;
  createdBy: string;
}

export interface ReservationUpsertInput {
  placeId?: string;
  kind: "hotel" | "restaurant" | "activity";
  title: string;
  confirmationCode: string;
  startAt: string;
  endAt?: string;
  status: "confirmed" | "pending" | "cancelled";
  partySize: number;
  roomOrTableCount?: number;
  amount?: number;
  cancellationPolicy?: string;
  phone?: string;
  email?: string;
  bookingUrl?: string;
  notes?: string;
}
