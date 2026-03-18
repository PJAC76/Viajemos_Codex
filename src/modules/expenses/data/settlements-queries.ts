import { expenses, settlements as mockSettlements, trips } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import { tripsQueries } from "../../trips/data/trips-queries";
import { buildSettlements } from "../domain/settlements";
import type { Settlement } from "../domain/types";

function normalizeSettlement(row: Record<string, unknown>, userNames: Record<string, string>): Settlement {
  const fromUserId = String(row.from_user_id);
  const toUserId = String(row.to_user_id);

  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    fromUserId,
    fromName: userNames[fromUserId] ?? fromUserId,
    toUserId,
    toName: userNames[toUserId] ?? toUserId,
    amount: Number(Number(row.amount ?? 0).toFixed(2)),
    currency: "EUR",
    status: row.status === "settled" ? "settled" : "pending",
    reason: typeof row.reason === "string" && row.reason.length > 0 ? row.reason : "Balance neto del viaje",
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    settledAt: typeof row.settled_at === "string" ? row.settled_at : undefined,
    settledBy: typeof row.settled_by === "string" ? row.settled_by : undefined
  };
}

function buildMockPendingSettlementId(settlement: Settlement) {
  return `pending:${settlement.tripId ?? "trip"}:${settlement.fromUserId}:${settlement.toUserId}:${settlement.amount.toFixed(2)}`;
}

function toSettlementError(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  if (message.includes("SETTLEMENTS_PENDING")) {
    return "Todavia quedan deudas pendientes. Marca o salda todos los movimientos antes de cerrar la liquidacion.";
  }

  if (message.includes("SETTLEMENTS_ALREADY_CLOSED")) {
    return "La liquidacion del viaje ya esta cerrada.";
  }

  if (message.includes("SETTLEMENT_SETTLE_FORBIDDEN")) {
    return "Solo las personas implicadas en el pago o el admin pueden marcar esta deuda como saldada.";
  }

  return message;
}

function sortSettlements(items: Settlement[]) {
  return items.slice().sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pending" ? -1 : 1;
    }

    if (right.amount !== left.amount) {
      return right.amount - left.amount;
    }

    return `${left.fromName}-${left.toName}`.localeCompare(`${right.fromName}-${right.toName}`, "es");
  });
}

export const settlementsQueries = {
  async listSettlements(tripId: string, userNames: Record<string, string> = {}) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const settledHistory = mockSettlements.filter((settlement) => settlement.tripId === tripId && settlement.status === "settled");
      const pendingSettlements = buildSettlements(expenses.filter((expense) => expense.tripId === tripId), userNames, settledHistory).map(
        (settlement) => ({
          ...settlement,
          id: buildMockPendingSettlementId(settlement)
        })
      );

      return sortSettlements([...pendingSettlements, ...settledHistory]);
    }

    const { data, error } = await insforge.database.rpc("sync_trip_settlements", {
      target_trip_id: tripId
    });

    if (error) {
      throw new Error(toSettlementError(error.message, "No se pudo recalcular la liquidacion del viaje."));
    }

    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    return sortSettlements(rows.map((row) => normalizeSettlement(row, userNames)));
  },

  async markSettlementAsSettled(settlementId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const settlement = mockSettlements.find((item) => item.id === settlementId);

      if (settlement) {
        settlement.status = "settled";
        settlement.settledAt = new Date().toISOString();
        return settlement;
      }

      if (settlementId.startsWith("pending:")) {
        const [, tripId, fromUserId, toUserId, amountValue] = settlementId.split(":");
        const nextSettlement: Settlement = {
          id: `settlement-${crypto.randomUUID()}`,
          tripId,
          fromUserId,
          fromName: fromUserId,
          toUserId,
          toName: toUserId,
          amount: Number(amountValue),
          status: "settled",
          reason: "Pago registrado manualmente",
          currency: "EUR",
          settledAt: new Date().toISOString()
        };
        mockSettlements.unshift(nextSettlement);
        return nextSettlement;
      }

      return null;
    }

    const { data, error } = await insforge.database.rpc("mark_settlement_as_settled", {
      target_settlement_id: settlementId
    });

    if (error) {
      throw new Error(toSettlementError(error.message, "No se pudo marcar la liquidacion como saldada."));
    }

    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : (data as Record<string, unknown> | null);
    return row ?? null;
  },

  async closeTripSettlements(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const trip = trips.find((item) => item.id === tripId);

      if (!trip) {
        throw new Error("No se encontro el viaje.");
      }

      trip.settlementStatus = "closed";
      trip.settlementClosedAt = new Date().toISOString();
      return trip;
    }

    const { data, error } = await insforge.database.rpc("close_trip_settlements", {
      target_trip_id: tripId
    });

    if (error) {
      throw new Error(toSettlementError(error.message, "No se pudo cerrar la liquidacion del viaje."));
    }

    const tripRow = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : (data as Record<string, unknown> | null);

    if (!tripRow) {
      return tripsQueries.getTrip(tripId);
    }

    return tripsQueries.getTrip(String(tripRow.id ?? tripId));
  }
};
