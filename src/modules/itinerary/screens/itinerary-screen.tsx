import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatDateLabel } from "../../../lib/utils";
import { usePlacesCatalog } from "../../places/data/use-places-data";
import type { Place } from "../../places/domain/types";
import { useTripOverview, useTripPermission } from "../../trips/data/use-trips-data";
import { useSession } from "../../../app/providers/session-provider";
import { useRouteSnapshot } from "../../maps/data/use-route-snapshot";
import { useItinerary } from "../data/use-itinerary-data";
import type { ItineraryItem, ItineraryItemType, ItineraryItemUpsertInput } from "../domain/types";

const emptyItemForm: ItineraryItemUpsertInput = {
  dayId: "",
  type: "manual",
  title: "",
  startTime: "",
  endTime: "",
  address: "",
  notes: "",
  placeId: "",
  icon: "place"
};

function formatDayShort(date: string) {
  return formatDateLabel(date, { day: "numeric", month: "short" });
}

function buildItemForm(dayId: string, place?: Place): ItineraryItemUpsertInput {
  return {
    dayId,
    type: place ? "linked_place" : "manual",
    title: place?.name ?? "",
    startTime: "",
    endTime: "",
    address: place?.address ?? "",
    notes: place?.notes ?? "",
    placeId: place?.id ?? "",
    icon:
      place?.type === "hotel"
        ? "hotel"
        : place?.type === "restaurant"
          ? "restaurant"
          : place
            ? "place"
            : "place"
  };
}

function canManageItem(item: ItineraryItem, currentUserId?: string, isAdmin?: boolean) {
  return Boolean(isAdmin || (currentUserId && item.createdBy === currentUserId));
}

function normalizeItineraryActionError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("jwt expired") || normalized.includes("sesion ha caducado") || normalized.includes("token expired")) {
    return "Tu sesion ha caducado. Vuelve a iniciar sesion y repite la operacion.";
  }

  return errorMessage;
}

export function ItineraryScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { trip, loading: tripLoading } = useTripOverview(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const { places } = usePlacesCatalog(tripId);
  const { days, itemsByDay, loading, error, createItem, updateItem, deleteItem, moveItem } = useItinerary(
    tripId,
    trip?.startDate,
    trip?.endDate
  );
  const [activeDayId, setActiveDayId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ItineraryItemUpsertInput>(emptyItemForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDayId && days.length > 0) {
      setActiveDayId(days[0].id);
    }
  }, [days, activeDayId]);

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0] ?? null;
  const activeItems = activeDay ? itemsByDay.get(activeDay.id) ?? [] : [];
  const linkedPlaces = useMemo(() => places.filter((place) => place.type !== "place" || place.address), [places]);
  const { snapshot: routeSnapshot, loading: routeLoading } = useRouteSnapshot(tripId, activeDay?.id);

  function resetForm() {
    setShowForm(false);
    setEditingItemId(null);
    setForm(activeDay ? buildItemForm(activeDay.id) : emptyItemForm);
    setSubmitting(false);
  }

  function startCreateFlow() {
    if (!activeDay) {
      return;
    }

    setActionError(null);
    setEditingItemId(null);
    setForm(buildItemForm(activeDay.id));
    setShowForm(true);
  }

  function startEditFlow(item: ItineraryItem) {
    setActionError(null);
    setEditingItemId(item.id);
    setForm({
      dayId: item.dayId,
      type: item.type,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime ?? "",
      address: item.address,
      notes: item.notes,
      placeId: item.placeId ?? "",
      icon: item.icon ?? "place"
    });
    setShowForm(true);
  }

  function handlePlaceSelection(placeId: string) {
    const selectedPlace = linkedPlaces.find((place) => place.id === placeId);

    if (!selectedPlace) {
      setForm((current) => ({
        ...current,
        type: "manual",
        placeId: "",
        icon: "place"
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      ...buildItemForm(current.dayId || activeDay?.id || "", selectedPlace),
      startTime: current.startTime,
      endTime: current.endTime
    }));
  }

  async function handleSaveItem() {
    try {
      setSubmitting(true);
      setActionError(null);

      const payload: ItineraryItemUpsertInput = {
        ...form,
        dayId: form.dayId || activeDay?.id || "",
        endTime: form.endTime || undefined,
        placeId: form.placeId || undefined,
        icon: form.icon || undefined
      };

      if (editingItemId) {
        await updateItem(editingItemId, payload);
      } else {
        await createItem(payload);
      }

      resetForm();
    } catch (itemError) {
      setActionError(
        normalizeItineraryActionError(itemError instanceof Error ? itemError.message : "No se pudo guardar el evento.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      setActionError(null);
      await deleteItem(itemId);
    } catch (itemError) {
      setActionError(
        normalizeItineraryActionError(itemError instanceof Error ? itemError.message : "No se pudo borrar el evento.")
      );
    }
  }

  async function handleMoveItem(itemId: string, direction: "up" | "down") {
    if (!activeDay) {
      return;
    }

    try {
      setActionError(null);
      await moveItem(activeDay.id, itemId, direction);
    } catch (moveError) {
      setActionError(
        normalizeItineraryActionError(
          moveError instanceof Error ? moveError.message : "No se pudo reordenar el evento."
        )
      );
    }
  }

  if (loading || tripLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando itinerario...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar el itinerario" description={normalizeItineraryActionError(error)} />;
  }

  if (!trip) {
    return <EmptyState title="Viaje no disponible" description="No hemos encontrado los datos base del viaje." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Itinerario diario"
        description="Eventos manuales o vinculados a lugares guardados, organizados por dia y listos para el modulo de mapa."
        action={<Button onClick={startCreateFlow}>Anadir parada</Button>}
      />

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            onClick={() => {
              setActiveDayId(day.id);
              if (!editingItemId && !showForm) {
                setForm(buildItemForm(day.id));
              }
            }}
            className={`min-w-[112px] rounded-2xl px-4 py-3 text-center ${
              day.id === activeDay?.id ? "bg-primary text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <p className="text-sm font-bold">{day.label}</p>
            <p className="text-xs opacity-80">{formatDayShort(day.date)}</p>
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Mapa del dia</p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeDay
                ? `Abre la vista de mapa para ${activeDay.label} y calcula la ruta optimizada entre las paradas del dia.`
                : "Selecciona un dia del itinerario para abrir su mapa."}
            </p>
          </div>
          {tripId && activeDay ? (
            <Link to={`/trips/${tripId}/map`}>
              <Button>Ir a mapa y rutas</Button>
            </Link>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paradas del dia</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{activeItems.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Distancia estimada</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {routeLoading ? "Calculando..." : routeSnapshot ? `${routeSnapshot.totalDistanceKm.toFixed(1)} km` : "Pendiente"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tiempo estimado</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {routeLoading ? "Calculando..." : routeSnapshot ? `${routeSnapshot.totalDurationMinutes} min` : "Pendiente"}
            </p>
          </div>
        </div>
      </Card>

      {showForm && activeDay ? (
        <Card className="p-6">
          <SectionHeader
            title={editingItemId ? "Editar evento" : `Nueva parada para ${activeDay.label}`}
            description="Los miembros editan solo sus propios eventos; el admin puede reorganizar y gestionar todo el dia."
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
                {(["manual", "linked_place"] as ItineraryItemType[]).map((type) => (
                  <Button
                    key={type}
                    variant={form.type === type ? "primary" : "secondary"}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        type,
                        placeId: type === "manual" ? "" : current.placeId
                      }))
                    }
                  >
                    {type === "manual" ? "Manual" : "Lugar guardado"}
                  </Button>
                ))}
              </div>
            </div>
            {form.type === "linked_place" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Lugar vinculado</p>
                <select
                  value={form.placeId ?? ""}
                  onChange={(event) => handlePlaceSelection(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Selecciona un lugar</option>
                  {linkedPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Titulo</p>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Hora inicio</p>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Hora fin</p>
              <Input
                type="time"
                value={form.endTime ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Direccion</p>
              <Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notas</p>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void handleSaveItem()} disabled={submitting || !form.title.trim() || !form.startTime}>
              {submitting ? "Guardando..." : editingItemId ? "Actualizar evento" : "Guardar evento"}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          {activeDay ? (
            activeItems.length === 0 ? (
              <EmptyState
                title={`Sin eventos para ${activeDay.label}`}
                description="Anade la primera parada del dia y el itinerario quedara listo para conectarse al mapa."
              />
            ) : (
              <div className="space-y-6">
                {activeItems.map((item, index) => {
                  const editable = canManageItem(item, user?.id, isAdmin);
                  const isFirst = index === 0;
                  const isLast = index === activeItems.length - 1;

                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary/15">
                          <span className="material-symbols-outlined text-[18px]">{item.icon ?? "place"}</span>
                        </div>
                        {!isLast ? <div className="my-2 h-full w-px bg-slate-200 dark:bg-slate-700" /> : null}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.address}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{item.startTime}{item.endTime ? ` - ${item.endTime}` : ""}</Badge>
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {item.type === "linked_place" ? "Lugar guardado" : "Manual"}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.notes || "Sin notas."}</p>
                        {editable || isAdmin ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {editable ? (
                              <Button variant="secondary" onClick={() => startEditFlow(item)}>
                                Editar
                              </Button>
                            ) : null}
                            {editable ? (
                              <Button variant="ghost" onClick={() => void handleDeleteItem(item.id)}>
                                Borrar
                              </Button>
                            ) : null}
                            {isAdmin ? (
                              <Button variant="secondary" disabled={isFirst} onClick={() => void handleMoveItem(item.id, "up")}>
                                Subir
                              </Button>
                            ) : null}
                            {isAdmin ? (
                              <Button variant="secondary" disabled={isLast} onClick={() => void handleMoveItem(item.id, "down")}>
                                Bajar
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState title="Sin dias disponibles" description="En cuanto el viaje tenga fechas, se generaran aqui los dias del itinerario." />
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-sky-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-800" />
          <div className="space-y-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumen del dia</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeDay ? `${activeItems.length} eventos en ${activeDay.label}.` : "Selecciona un dia para ver su resumen."}
            </p>
            {activeItems.length > 0 ? (
              <div className="space-y-3">
                {activeItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.startTime}{item.endTime ? ` - ${item.endTime}` : ""}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
