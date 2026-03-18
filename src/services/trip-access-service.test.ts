import { describe, expect, it, vi } from "vitest";
import { tripAccessService } from "./trip-access-service";
import { tripsQueries } from "../modules/trips/data/trips-queries";

vi.mock("../modules/trips/data/trips-queries", () => ({
  tripsQueries: {
    getViewerRole: vi.fn(),
    isGlobalAdmin: vi.fn()
  }
}));

describe("tripAccessService", () => {
  it("treats admin viewers as trip admins", async () => {
    vi.mocked(tripsQueries.getViewerRole).mockResolvedValueOnce("admin");

    await expect(tripAccessService.isTripAdmin("user-1", "trip-1")).resolves.toBe(true);
  });

  it("denies trip admin access to members", async () => {
    vi.mocked(tripsQueries.getViewerRole).mockResolvedValueOnce("member");

    await expect(tripAccessService.isTripAdmin("user-2", "trip-1")).resolves.toBe(false);
  });

  it("reports trip access only when a role exists", async () => {
    vi.mocked(tripsQueries.getViewerRole).mockResolvedValueOnce(null);

    await expect(tripAccessService.userHasTripAccess("user-3", "trip-2")).resolves.toBe(false);
  });
});
