import { tripMembers } from "../mocks/db";
import type { TripRole } from "../modules/trips/domain/types";

export const tripAccessService = {
  userHasTripAccess(userId: string, tripId: string) {
    return tripMembers.some((member) => member.tripId === tripId && member.userId === userId);
  },

  getUserTripRole(userId: string, tripId: string): TripRole | null {
    const member = tripMembers.find((item) => item.tripId === tripId && item.userId === userId);
    return member?.role ?? null;
  },

  isTripAdmin(userId: string, tripId: string) {
    return this.getUserTripRole(userId, tripId) === "admin";
  }
};
