import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatCurrency } from "../../../lib/utils";
import { usePlacesCatalog } from "../../places/data/use-places-data";
import type { Reservation, ReservationUpsertInput } from "../../places/domain/types";
import { useTripPermission } from "../../trips/data/use-trips-data";
import { useReservations } from "../data/use-reservations-data";

const emptyReservationForm: ReservationUpsertInput = {
  placeId: "",
  kind: "hotel",
  title: "",
  confirmationCode: "",
  startAt: "",
  endAt: "",
  status: "pending",
  partySize: 1,
  roomOrTableCount: undefined,
  amount: undefined,
  cancellationPolicy: "",
  phone: "",
  email: "",
  bookingUrl: "",
  notes: ""
};

function formatReservationDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ReservationsScreen() {
  const { tripId } = useParams();
  const { isAdmin } = useTripPermission(tripId);
  const { places } = usePlacesCatalog(tripId);
  const { reservations, loading, error, createReservation, updateReservation, deleteReservation } = useReservations(tripId);
  const [showForm, setShowForm] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [form, setForm] = useState<ReservationUpsertInput>(emptyReservationForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const placeOptions = useMemo(
    () =>
      places
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name, "es"))
        .map((place) => ({
          id: place.id,
          label: `${place.name} (${place.type === "hotel" ? "Hotel" : place.type === "restaurant" ? "Restaurante" : "Lugar"})`
        })),
    [places]
  );

  function resetForm() {
    setShowForm(false);
    setEditingReservationId(null);
    setForm(emptyReservationForm);
    setSubmitting(false);
  }

  function startCreateFlow() {
    setActionError(null);
    setEditingReservationId(null);
    setForm(emptyReservationForm);
    setShowForm(true);
  }

  function startEditFlow(reservation: Reservation) {
    setActionError(null);
    setEditingReservationId(reservation.id);
    setForm({
      placeId: reservation.placeId ?? "",
      kind: reservation.kind,
      title: reservation.title,
      confirmationCode: reservation.confirmationCode,
      startAt: reservation.startAt.slice(0, 16),
      endAt: reservation.endAt ? reservation.endAt.slice(0, 16) : "",
      status: reservation.status,
      partySize: reservation.partySize,
      roomOrTableCount: reservation.roomOrTableCount,
      amount: reservation.amount,
      cancellationPolicy: reservation.cancellationPolicy ?? "",
      phone: reservation.phone ?? "",
      email: reservation.email ?? "",
      bookingUrl: reservation.bookingUrl ?? "",
      notes: reservation.notes ?? ""
    });
    setShowForm(true);
  }

  async function handleSaveReservation() {
    try {
      setSubmitting(true);
      setActionError(null);

      const payload: ReservationUpsertInput = {
        ...form,
        placeId: form.placeId || undefined,
        endAt: form.endAt || undefined,
        cancellationPolicy: form.cancellationPolicy || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        bookingUrl: form.bookingUrl || undefined,
        notes: form.notes || undefined
      };

      if (editingReservationId) {
        await updateReservation(editingReservationId, payload);
      } else {
        await createReservation(payload);
      }

      resetForm();
    } catch (reservationError) {
      setActionError(reservationError instanceof Error ? reservationError.message : "No se pudo guardar la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReservation(reservationId: string) {
    try {
      setActionError(null);
      await deleteReservation(reservationId);
    } catch (reservationError) {
      setActionError(reservationError instanceof Error ? reservationError.message : "No se pudo borrar la reserva.");
    }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando reservas...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar las reservas" description={error} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Reservas"
        description="Lectura compartida para todos los miembros y edicion reservada al admin del viaje."
        action={
          isAdmin ? (
            <Button onClick={startCreateFlow}>{showForm ? "Nueva reserva" : "Registrar reserva"}</Button>
          ) : (
            <Button variant="secondary" disabled>
              Solo admin
            </Button>
          )
        }
      />

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      {isAdmin && showForm ? (
        <Card className="p-6">
          <SectionHeader
            title={editingReservationId ? "Editar reserva" : "Nueva reserva"}
            description="Las reservas pueden vincularse a un sitio del viaje, pero tambien registrarse de forma manual."
            action={
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            }
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(["hotel", "restaurant", "activity"] as Reservation["kind"][]).map((kind) => (
                  <Button
                    key={kind}
                    variant={form.kind === kind ? "primary" : "secondary"}
                    onClick={() => setForm((current) => ({ ...current, kind }))}
                  >
                    {kind === "hotel" ? "Hotel" : kind === "restaurant" ? "Restaurante" : "Actividad"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sitio vinculado</p>
              <select
                value={form.placeId ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, placeId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Sin vincular</option>
                {placeOptions.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Titulo</p>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Localizador</p>
              <Input
                value={form.confirmationCode}
                onChange={(event) => setForm((current) => ({ ...current, confirmationCode: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inicio</p>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fin</p>
              <Input
                type="datetime-local"
                value={form.endAt ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Estado</p>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "cancelled"] as Reservation["status"][]).map((status) => (
                  <Button
                    key={status}
                    variant={form.status === status ? "primary" : "secondary"}
                    onClick={() => setForm((current) => ({ ...current, status }))}
                  >
                    {status === "pending" ? "Pendiente" : status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Personas</p>
              <Input
                type="number"
                min="1"
                value={form.partySize}
                onChange={(event) =>
                  setForm((current) => ({ ...current, partySize: Math.max(1, Number(event.target.value || 1)) }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Habitaciones / mesas</p>
              <Input
                type="number"
                min="1"
                value={form.roomOrTableCount ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    roomOrTableCount: event.target.value ? Number(event.target.value) : undefined
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Importe</p>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value ? Number(event.target.value) : undefined
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Politica de cancelacion</p>
              <Input
                value={form.cancellationPolicy ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cancellationPolicy: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Telefono</p>
              <Input value={form.phone ?? ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</p>
              <Input value={form.email ?? ""} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Enlace de reserva</p>
              <Input
                value={form.bookingUrl ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, bookingUrl: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notas</p>
              <textarea
                value={form.notes ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => void handleSaveReservation()}
              disabled={submitting || !form.title.trim() || !form.confirmationCode.trim() || !form.startAt}
            >
              {submitting ? "Guardando..." : editingReservationId ? "Actualizar reserva" : "Guardar reserva"}
            </Button>
          </div>
        </Card>
      ) : null}

      {reservations.length === 0 ? (
        <EmptyState
          title="Aun no hay reservas registradas"
          description="Centraliza aqui hoteles, restaurantes y reservas clave del viaje para que todo el grupo pueda consultarlas."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{reservation.kind}</Badge>
                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {reservation.status}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{reservation.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Localizador: {reservation.confirmationCode}
                  </p>
                </div>
                {typeof reservation.amount === "number" ? <Badge>{formatCurrency(reservation.amount)}</Badge> : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <p>Inicio: {formatReservationDate(reservation.startAt)}</p>
                {reservation.endAt ? <p>Fin: {formatReservationDate(reservation.endAt)}</p> : null}
                <p>{reservation.partySize} personas</p>
                {typeof reservation.roomOrTableCount === "number" ? (
                  <p>{reservation.roomOrTableCount} habitaciones / mesas</p>
                ) : null}
                {reservation.cancellationPolicy ? <p>{reservation.cancellationPolicy}</p> : null}
                <p>{reservation.phone || reservation.email || "Sin contacto registrado"}</p>
                <p>{reservation.bookingUrl || "Sin enlace guardado"}</p>
                <p>{reservation.notes || "Sin notas"}</p>
              </div>

              {isAdmin ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => startEditFlow(reservation)}>
                    Editar
                  </Button>
                  <Button variant="ghost" onClick={() => void handleDeleteReservation(reservation.id)}>
                    Borrar
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
