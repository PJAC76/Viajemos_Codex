export const storageService = {
  async uploadTripFile(tripId: string, fileName: string) {
    return {
      tripId,
      fileName,
      path: `trips/${tripId}/${fileName}`,
      publicUrl: ""
    };
  }
};
