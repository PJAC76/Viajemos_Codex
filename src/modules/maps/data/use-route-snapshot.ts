import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { RouteSnapshot, RouteSnapshotDraft } from "../../itinerary/domain/types";
import { routeSnapshotsQueries } from "./route-snapshots-queries";

export function useRouteSnapshot(tripId?: string, dayId?: string) {
  const { user } = useSession();
  const [snapshot, setSnapshot] = useState<RouteSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(tripId && dayId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId || !dayId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSnapshot(await routeSnapshotsQueries.getDaySnapshot(tripId, dayId));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudo cargar la ruta guardada.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, dayId]);

  async function saveSnapshot(nextSnapshot: RouteSnapshotDraft) {
    if (!user) {
      throw new Error("Necesitas una sesion activa para guardar la ruta.");
    }

    const savedSnapshot = await routeSnapshotsQueries.saveDaySnapshot(nextSnapshot, user.id);
    setSnapshot(savedSnapshot);
    setError(null);
    return savedSnapshot;
  }

  return {
    snapshot,
    loading,
    error,
    reload,
    saveSnapshot
  };
}
