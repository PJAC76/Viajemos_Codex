import { describe, expect, it } from "vitest";
import { routeSnapshots } from "../../../mocks/db";
import { routeSnapshotsQueries } from "./route-snapshots-queries";

describe("routeSnapshotsQueries", () => {
  it("updates an existing snapshot in mock mode", async () => {
    const originalSnapshot = routeSnapshots.find((snapshot) => snapshot.dayId === "day-1");

    if (!originalSnapshot) {
      throw new Error("Expected mock route snapshot to exist.");
    }

    const originalDistance = originalSnapshot.totalDistanceKm;

    const savedSnapshot = await routeSnapshotsQueries.saveDaySnapshot(
      {
        tripId: "trip-tokyo",
        dayId: "day-1",
        totalDistanceKm: 21.4,
        totalDurationMinutes: 88,
        travelMode: "walking",
        segments: [
          {
            from: "A",
            to: "B",
            distanceKm: 21.4,
            durationMinutes: 88
          }
        ]
      },
      "user-alex"
    );

    expect(savedSnapshot.totalDistanceKm).toBe(21.4);
    expect(savedSnapshot.travelMode).toBe("walking");
    expect(savedSnapshot.segments).toHaveLength(1);
    expect(routeSnapshots.find((snapshot) => snapshot.dayId === "day-1")?.totalDistanceKm).toBe(21.4);

    originalSnapshot.totalDistanceKm = originalDistance;
    originalSnapshot.totalDurationMinutes = 72;
    originalSnapshot.travelMode = "driving";
    originalSnapshot.segments = [
      { from: "Shibuya Sky Hotel", to: "Templo Senso-ji", distanceKm: 9.4, durationMinutes: 32 },
      { from: "Templo Senso-ji", to: "Sukiyabashi Jiro", distanceKm: 8.8, durationMinutes: 40 }
    ];
  });
});
