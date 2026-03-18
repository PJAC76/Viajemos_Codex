import { tripInvitations, tripMembers, trips } from "../../../mocks/db";

export const tripsQueries = {
  listTrips() {
    return trips;
  },

  getTrip(tripId: string) {
    return trips.find((trip) => trip.id === tripId) ?? null;
  },

  getMembers(tripId: string) {
    return tripMembers.filter((member) => member.tripId === tripId);
  },

  getInvitations(tripId: string) {
    return tripInvitations.filter((invitation) => invitation.tripId === tripId);
  }
};
