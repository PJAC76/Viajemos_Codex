import type { TripRole } from "../modules/trips/domain/types";
import { tripsQueries } from "../modules/trips/data/trips-queries";

export const tripAccessService = {
  async userHasTripAccess(userId: string, tripId: string) {
    return (await tripsQueries.getViewerRole(tripId, userId)) !== null;
  },

  async getUserTripRole(userId: string, tripId: string): Promise<TripRole | null> {
    return tripsQueries.getViewerRole(tripId, userId);
  },

  async isGlobalAdmin() {
    return tripsQueries.isGlobalAdmin();
  },

  async isTripAdmin(userId: string, tripId: string) {
    return (await this.getUserTripRole(userId, tripId)) === "admin";
  }
};
