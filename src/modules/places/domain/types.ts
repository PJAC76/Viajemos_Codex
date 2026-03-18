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
  status: "confirmed" | "pending";
  partySize: number;
  notes?: string;
}
