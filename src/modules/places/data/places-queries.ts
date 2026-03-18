import { places, reservations } from "../../../mocks/db";

export const placesQueries = {
  listPlaces(tripId: string) {
    return places.filter((place) => place.tripId === tripId);
  },

  listFavorites(tripId: string) {
    return places.filter((place) => place.tripId === tripId && place.favorite);
  },

  listReservations(tripId: string) {
    return reservations.filter((reservation) => reservation.tripId === tripId);
  }
};
