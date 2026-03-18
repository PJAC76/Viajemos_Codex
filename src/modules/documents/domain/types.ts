export type DocumentType = "pdf" | "image" | "file";

export interface TripDocument {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  type: DocumentType;
  fileName: string;
  storageKey: string;
  bucketName: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  expenseId?: string;
  expenseLabel?: string;
  reservationId?: string;
  reservationLabel?: string;
  createdBy: string;
  createdByName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripDocumentUpsertInput {
  title: string;
  description?: string;
  expenseId?: string;
  reservationId?: string;
}
