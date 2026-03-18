import { routeSnapshots } from "../mocks/db";

export const mapsRouteService = {
  async getDayRoute(tripId: string, dayId: string) {
    return routeSnapshots.find((route) => route.tripId === tripId && route.dayId === dayId) ?? null;
  }
};
