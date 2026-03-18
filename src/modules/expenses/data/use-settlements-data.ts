import { useEffect, useMemo, useState } from "react";
import type { Trip } from "../../trips/domain/types";
import { tripsQueries } from "../../trips/data/trips-queries";
import type { Settlement } from "../domain/types";
import { settlementsQueries } from "./settlements-queries";

export function useSettlements(tripId?: string, userNames: Record<string, string> = {}) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setTrip(null);
      setSettlements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextTrip, nextSettlements] = await Promise.all([
        tripsQueries.getTrip(tripId),
        settlementsQueries.listSettlements(tripId, userNames)
      ]);
      setTrip(nextTrip);
      setSettlements(nextSettlements);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudo cargar la liquidacion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, JSON.stringify(userNames)]);

  async function markAsSettled(settlementId: string) {
    await settlementsQueries.markSettlementAsSettled(settlementId);
    await reload();
  }

  async function closeTripSettlements() {
    if (!tripId) {
      throw new Error("No se encontro el viaje.");
    }

    const nextTrip = await settlementsQueries.closeTripSettlements(tripId);
    setTrip(nextTrip);
    await reload();
    return nextTrip;
  }

  const pendingSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "pending"),
    [settlements]
  );
  const settledSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "settled"),
    [settlements]
  );
  const pendingTotal = useMemo(
    () => pendingSettlements.reduce((sum, settlement) => sum + settlement.amount, 0),
    [pendingSettlements]
  );
  const settledTotal = useMemo(
    () => settledSettlements.reduce((sum, settlement) => sum + settlement.amount, 0),
    [settledSettlements]
  );

  return {
    trip,
    settlements,
    pendingSettlements,
    settledSettlements,
    pendingTotal,
    settledTotal,
    loading,
    error,
    reload,
    markAsSettled,
    closeTripSettlements
  };
}
