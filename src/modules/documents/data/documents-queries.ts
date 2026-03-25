import { documents as mockDocuments, expenses as mockExpenses, reservations as mockReservations } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import { storageService } from "../../../services/storage-service";
import type { TripDocument, TripDocumentUpsertInput } from "../domain/types";

function detectDocumentType(fileName: string, mimeType?: string) {
  const normalizedMimeType = mimeType?.toLowerCase() ?? "";
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedMimeType.includes("pdf") || normalizedFileName.endsWith(".pdf")) {
    return "pdf" as const;
  }

  if (normalizedMimeType.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((extension) => normalizedFileName.endsWith(extension))) {
    return "image" as const;
  }

  return "file" as const;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function normalizeDocument(
  row: Record<string, unknown>,
  userNames: Record<string, string>,
  expenseLabels: Record<string, string>,
  reservationLabels: Record<string, string>
): TripDocument {
  const createdBy = typeof row.created_by === "string" ? row.created_by : "";
  const expenseId = typeof row.expense_id === "string" ? row.expense_id : undefined;
  const reservationId = typeof row.reservation_id === "string" ? row.reservation_id : undefined;
  const fileName = typeof row.file_name === "string" ? row.file_name : "archivo";
  const mimeType = typeof row.mime_type === "string" ? row.mime_type : undefined;

  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    title: typeof row.title === "string" ? row.title : "Documento",
    description: typeof row.description === "string" ? row.description : undefined,
    type: row.document_type === "pdf" || row.document_type === "image" ? row.document_type : detectDocumentType(fileName, mimeType),
    fileName,
    storageKey: typeof row.storage_key === "string" ? row.storage_key : "",
    bucketName: typeof row.bucket_name === "string" ? row.bucket_name : "attachments-private",
    mimeType,
    fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
    fileUrl: typeof row.file_url === "string" ? row.file_url : undefined,
    expenseId,
    expenseLabel: expenseId ? expenseLabels[expenseId] : undefined,
    reservationId,
    reservationLabel: reservationId ? reservationLabels[reservationId] : undefined,
    createdBy,
    createdByName: userNames[createdBy] ?? createdBy,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

async function getRelatedLabels(tripId: string) {
  const insforge = getInsforgeClient();

  if (!insforge) {
    return {
      expenseLabels: Object.fromEntries(mockExpenses.filter((expense) => expense.tripId === tripId).map((expense) => [expense.id, expense.concept])),
      reservationLabels: Object.fromEntries(
        mockReservations.filter((reservation) => reservation.tripId === tripId).map((reservation) => [reservation.id, reservation.title])
      )
    };
  }

  const [expenseResult, reservationResult] = await Promise.all([
    insforge.database.from("expenses").select("id, concept").eq("trip_id", tripId),
    insforge.database.from("reservations").select("id, title").eq("trip_id", tripId)
  ]);

  if (expenseResult.error) {
    throw new Error(expenseResult.error.message ?? "No se pudieron cargar los gastos relacionados.");
  }

  if (reservationResult.error) {
    throw new Error(reservationResult.error.message ?? "No se pudieron cargar las reservas relacionadas.");
  }

  return {
    expenseLabels: Object.fromEntries(
      (((expenseResult.data as Array<Record<string, unknown>> | null) ?? []).map((row) => [String(row.id), String(row.concept)]))
    ),
    reservationLabels: Object.fromEntries(
      (((reservationResult.data as Array<Record<string, unknown>> | null) ?? []).map((row) => [String(row.id), String(row.title)]))
    )
  };
}

export const documentsQueries = {
  async listDocuments(tripId: string, userNames: Record<string, string> = {}) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return mockDocuments
        .filter((document) => document.tripId === tripId)
        .slice()
        .sort((left, right) => (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? ""));
    }

    const [{ expenseLabels, reservationLabels }, documentsResult] = await Promise.all([
      getRelatedLabels(tripId),
      insforge.database.from("documents").select("*").eq("trip_id", tripId).order("updated_at", { ascending: false })
    ]);

    if (documentsResult.error) {
      throw new Error(documentsResult.error.message ?? "No se pudieron cargar los documentos del viaje.");
    }

    return ((documentsResult.data as Array<Record<string, unknown>> | null) ?? []).map((row) =>
      normalizeDocument(row, userNames, expenseLabels, reservationLabels)
    );
  },

  async createDocument(tripId: string, userId: string, userName: string, input: TripDocumentUpsertInput, file: File) {
    const insforge = getInsforgeClient();
    const documentType = detectDocumentType(file.name, file.type);

    if (!insforge) {
      const nextDocument: TripDocument = {
        id: `document-${crypto.randomUUID()}`,
        tripId,
        title: input.title,
        description: input.description,
        type: documentType,
        fileName: file.name,
        storageKey: `trips/${tripId}/documents/${file.name}`,
        bucketName: "attachments-private",
        mimeType: file.type,
        fileSize: file.size,
        expenseId: input.expenseId,
        expenseLabel: input.expenseId ? mockExpenses.find((expense) => expense.id === input.expenseId)?.concept : undefined,
        reservationId: input.reservationId,
        reservationLabel: input.reservationId ? mockReservations.find((reservation) => reservation.id === input.reservationId)?.title : undefined,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDocuments.unshift(nextDocument);
      return nextDocument;
    }

    const uploadedFile = await storageService.uploadTripFile(
      tripId,
      `documents/${Date.now()}-${sanitizeFileName(file.name)}`,
      file
    );

    const { data, error } = await insforge.database.from("documents").insert([
      {
        trip_id: tripId,
        expense_id: input.expenseId || null,
        reservation_id: input.reservationId || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        document_type: documentType,
        bucket_name: uploadedFile.bucketName,
        storage_key: uploadedFile.path,
        file_name: file.name,
        mime_type: file.type || uploadedFile.mimeType || null,
        file_size: typeof uploadedFile.size === "number" ? uploadedFile.size : file.size,
        file_url: uploadedFile.publicUrl || null,
        created_by: userId
      }
    ])
    .select()
    .single();

    if (error) {
      await storageService.deleteTripFile(uploadedFile.path);
      throw new Error(error.message ?? "No se pudo guardar el documento del viaje.");
    }

    const { expenseLabels, reservationLabels } = await getRelatedLabels(tripId);
    return normalizeDocument(data as Record<string, unknown>, { [userId]: userName }, expenseLabels, reservationLabels);
  },

  async deleteDocument(documentId: string, storageKey?: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const index = mockDocuments.findIndex((document) => document.id === documentId);

      if (index >= 0) {
        mockDocuments.splice(index, 1);
      }

      return;
    }

    const { error } = await insforge.database.from("documents").delete().eq("id", documentId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el documento del viaje.");
    }

    if (storageKey) {
      await storageService.deleteTripFile(storageKey);
    }
  },

  async getDocumentPreview(document: TripDocument) {
    return storageService.getTripFilePreview(document.storageKey);
  },

  async downloadDocument(document: TripDocument) {
    await storageService.downloadTripFileAs(document.storageKey, document.fileName, document.fileUrl);
  }
};
