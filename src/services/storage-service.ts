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
        publicUrl: data?.url ?? ""
      };
    }

    return {
      tripId,
      fileName,
      path,
      publicUrl: ""
    };
  }
};
