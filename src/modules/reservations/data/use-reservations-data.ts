import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { Reservation, ReservationUpsertInput } from "../../places/domain/types";
import { reservationsQueries } from "./reservations-queries";

export function useReservations(tripId?: string) {
  const { user } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReservations(await reservationsQueries.listReservations(tripId));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId]);

  async function createReservation(input: ReservationUpsertInput) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa y un viaje para registrar una reserva.");
    }

    const reservation = await reservationsQueries.createReservation(tripId, user.id, input);
    setReservations((currentReservations) =>
      [...currentReservations, reservation].sort((left, right) => left.startAt.localeCompare(right.startAt))
    );
    return reservation;
  }

  async function updateReservation(reservationId: string, input: ReservationUpsertInput) {
    const reservation = await reservationsQueries.updateReservation(reservationId, input);

    if (!reservation) {
      return null;
    }

    setReservations((currentReservations) =>
      currentReservations
        .map((item) => (item.id === reservationId ? reservation : item))
        .sort((left, right) => left.startAt.localeCompare(right.startAt))
    );

    return reservation;
  }

  async function deleteReservation(reservationId: string) {
    await reservationsQueries.deleteReservation(reservationId);
    setReservations((currentReservations) => currentReservations.filter((item) => item.id !== reservationId));
  }

  return {
    reservations,
    loading,
    error,
    reload,
    createReservation,
    updateReservation,
    deleteReservation
  };
}
