export interface TripMessage {
  id: string;
  tripId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TripMessageUpsertInput {
  body: string;
}
