import { getInsforgeClient } from "../lib/insforge/client";

export const storageService = {
  async uploadTripFile(tripId: string, fileName: string, file?: Blob) {
    const insforge = getInsforgeClient();
    const path = `trips/${tripId}/${fileName}`;

    if (insforge && file) {
      const { data, error } = await insforge.storage.from("attachments-private").upload(path, file);

      if (error) {
        throw new Error(error.message ?? "No se pudo subir el archivo a InsForge Storage.");
      }

      return {
        tripId,
        fileName,
        path: data?.key ?? path,
        bucketName: data?.bucket ?? "attachments-private",
        mimeType: data?.mimeType ?? undefined,
        size: data?.size ?? undefined,
        uploadedAt: data?.uploadedAt ?? undefined,
        publicUrl: data?.url ?? ""
      };
    }

    return {
      tripId,
      fileName,
      path,
      bucketName: "attachments-private",
      mimeType: undefined,
      size: undefined,
      uploadedAt: undefined,
      publicUrl: ""
    };
  },

  async deleteTripFile(path?: string) {
    const insforge = getInsforgeClient();

    if (!insforge || !path) {
      return;
    }

    const { error } = await insforge.storage.from("attachments-private").remove(path);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el archivo de InsForge Storage.");
    }
  },

  async downloadTripFile(path?: string) {
    const insforge = getInsforgeClient();

    if (!insforge || !path) {
      return null;
    }

    const { data, error } = await insforge.storage.from("attachments-private").download(path);

    if (error) {
      throw new Error(error.message ?? "No se pudo descargar el archivo de InsForge Storage.");
    }

    return data ?? null;
  }
};
