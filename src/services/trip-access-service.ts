import type { TripRole } from "../modules/trips/domain/types";
import { tripsQueries } from "../modules/trips/data/trips-queries";

export const tripAccessService = {
  async userHasTripAccess(userId: string, tripId: string) {
    const members = await tripsQueries.getMembers(tripId);
    return members.some((member) => member.userId === userId);
  },

  async getUserTripRole(userId: string, tripId: string): Promise<TripRole | null> {
    const members = await tripsQueries.getMembers(tripId);
    const member = members.find((item) => item.userId === userId);
    return member?.role ?? null;
  },

  async isTripAdmin(userId: string, tripId: string) {
    return (await this.getUserTripRole(userId, tripId)) === "admin";
  }
};
