export type PlaceType = "hotel" | "restaurant" | "place";

export interface Place {
  id: string;
  tripId: string;
  type: PlaceType;
  name: string;
  address: string;
  rating: number;
  image: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  favorite: boolean;
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
