import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { TripDocument, TripDocumentUpsertInput } from "../domain/types";
import { documentsQueries } from "./documents-queries";

export function useDocuments(tripId?: string, userNames: Record<string, string> = {}) {
  const { user } = useSession();
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDocuments(await documentsQueries.listDocuments(tripId, userNames));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los documentos del viaje.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, JSON.stringify(userNames)]);

  async function createDocument(input: TripDocumentUpsertInput, file: File) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa y un viaje para subir documentos.");
    }

    const nextDocument = await documentsQueries.createDocument(
      tripId,
      user.id,
      user.displayName ?? user.email ?? "Miembro",
      input,
      file
    );

    setDocuments((currentDocuments) =>
      [nextDocument, ...currentDocuments].sort((left, right) =>
        (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? "")
      )
    );

    return nextDocument;
  }

  async function deleteDocument(documentId: string, storageKey?: string) {
    await documentsQueries.deleteDocument(documentId, storageKey);
    setDocuments((currentDocuments) => currentDocuments.filter((document) => document.id !== documentId));
  }

  async function openDocument(document: TripDocument) {
    await documentsQueries.openDocument(document);
  }

  const groupedCounts = useMemo(
    () => ({
      total: documents.length,
      pdf: documents.filter((document) => document.type === "pdf").length,
      images: documents.filter((document) => document.type === "image").length
    }),
    [documents]
  );

  return {
    documents,
    groupedCounts,
    loading,
    error,
    reload,
    createDocument,
    deleteDocument,
    openDocument
  };
}
