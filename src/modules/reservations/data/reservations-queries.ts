import { reservations } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { Reservation, ReservationUpsertInput } from "../../places/domain/types";

function normalizeReservationKind(value: unknown): Reservation["kind"] {
  return value === "hotel" || value === "restaurant" || value === "activity" ? value : "activity";
}

function normalizeReservationStatus(value: unknown): Reservation["status"] {
  return value === "confirmed" || value === "pending" || value === "cancelled" ? value : "pending";
}

function normalizeReservation(row: Record<string, unknown>): Reservation {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    placeId: typeof row.place_id === "string" ? row.place_id : undefined,
    kind: normalizeReservationKind(row.kind),
    title: typeof row.title === "string" ? row.title : "Reserva",
    confirmationCode: typeof row.confirmation_code === "string" ? row.confirmation_code : "",
    startAt: typeof row.start_at === "string" ? row.start_at : "",
    endAt: typeof row.end_at === "string" ? row.end_at : undefined,
    status: normalizeReservationStatus(row.status),
    partySize: typeof row.party_size === "number" ? row.party_size : 1,
    roomOrTableCount: typeof row.room_or_table_count === "number" ? row.room_or_table_count : undefined,
    amount: typeof row.amount === "number" ? row.amount : undefined,
    currency: "EUR",
    cancellationPolicy: typeof row.cancellation_policy === "string" ? row.cancellation_policy : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    bookingUrl: typeof row.booking_url === "string" ? row.booking_url : undefined,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    createdBy: typeof row.created_by === "string" ? row.created_by : ""
  };
}

export const reservationsQueries = {
  async listReservations(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return reservations.filter((reservation) => reservation.tripId === tripId);
    }

    const { data, error } = await insforge.database
      .from("reservations")
      .select("*")
      .eq("trip_id", tripId)
      .order("start_at", { ascending: true });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar las reservas.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeReservation);
  },

  async createReservation(tripId: string, userId: string, input: ReservationUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const reservation: Reservation = {
        id: `reservation-${crypto.randomUUID()}`,
        tripId,
        createdBy: userId,
        currency: "EUR",
        ...input
      };

      reservations.push(reservation);
      return reservation;
    }

    const { data, error } = await insforge.database
      .from("reservations")
      .insert([
        {
          trip_id: tripId,
          place_id: input.placeId || null,
          kind: input.kind,
          title: input.title.trim(),
          confirmation_code: input.confirmationCode.trim(),
          start_at: input.startAt,
          end_at: input.endAt || null,
          status: input.status,
          party_size: input.partySize,
          room_or_table_count: typeof input.roomOrTableCount === "number" ? input.roomOrTableCount : null,
          amount: typeof input.amount === "number" ? input.amount : null,
          currency: "EUR",
          cancellation_policy: input.cancellationPolicy?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          booking_url: input.bookingUrl?.trim() || null,
          notes: input.notes?.trim() || null,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo crear la reserva.");
    }

    return normalizeReservation(data as Record<string, unknown>);
  },

  async updateReservation(reservationId: string, input: ReservationUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const reservation = reservations.find((item) => item.id === reservationId);

      if (!reservation) {
        return null;
      }

      Object.assign(reservation, {
        ...input,
        currency: "EUR"
      });
      return reservation;
    }

    const { data, error } = await insforge.database
      .from("reservations")
      .update({
        place_id: input.placeId || null,
        kind: input.kind,
        title: input.title.trim(),
        confirmation_code: input.confirmationCode.trim(),
        start_at: input.startAt,
        end_at: input.endAt || null,
        status: input.status,
        party_size: input.partySize,
        room_or_table_count: typeof input.roomOrTableCount === "number" ? input.roomOrTableCount : null,
        amount: typeof input.amount === "number" ? input.amount : null,
        cancellation_policy: input.cancellationPolicy?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        booking_url: input.bookingUrl?.trim() || null,
        notes: input.notes?.trim() || null
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar la reserva.");
    }

    return normalizeReservation(data as Record<string, unknown>);
  },

  async deleteReservation(reservationId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const index = reservations.findIndex((item) => item.id === reservationId);

      if (index >= 0) {
        reservations.splice(index, 1);
      }

      return;
    }

    const { error } = await insforge.database.from("reservations").delete().eq("id", reservationId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar la reserva.");
    }
  }
};
