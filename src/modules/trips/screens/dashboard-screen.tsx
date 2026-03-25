import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DayRoutePreview } from "../../../components/maps/day-route-preview";
import { UpcomingStopPhoto } from "../../../components/maps/upcoming-stop-photo";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { MemberStack } from "../../../components/trips/member-stack";
import { TripCoverImage } from "../../../components/trips/trip-cover-image";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { TripHero } from "../../../components/trips/trip-hero";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatCurrency } from "../../../lib/utils";
import { mapsRouteService } from "../../../services/maps-route-service";
import { useExpenses } from "../../expenses/data/use-expenses-data";
import { useItinerary } from "../../itinerary/data/use-itinerary-data";
import { useTripOverview, useTripPermission } from "../data/use-trips-data";

export function DashboardScreen() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, members, loading, error, updateTrip } = useTripOverview(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const memberNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const { totalAmount, expenses, loading: expensesLoading } = useExpenses(tripId, memberNames);
  const { days, itemsByDay, loading: itineraryLoading } = useItinerary(tripId, trip?.startDate, trip?.endDate);

  const upcoming = useMemo(
    () =>
      days
        .flatMap((day) => itemsByDay.get(day.id) ?? [])
        .sort((left, right) => {
          if (left.dayId === right.dayId) {
            return left.order - right.order;
          }

          return left.startTime.localeCompare(right.startTime);
        })
        .slice(0, 3),
    [days, itemsByDay]
  );

  const previewDay = useMemo(
    () => days.find((day) => mapsRouteService.canCalculateRoute(itemsByDay.get(day.id) ?? [])) ?? days[0] ?? null,
    [days, itemsByDay]
  );

  const previewItems = useMemo(() => (previewDay ? itemsByDay.get(previewDay.id) ?? [] : []), [itemsByDay, previewDay]);
  const previewMapsUrl = useMemo(() => mapsRouteService.buildGoogleMapsDirectionsUrl(previewItems, "driving"), [previewItems]);

  useEffect(() => {
    if (!trip) {
      return;
    }

    setTitle(trip.title);
    setDestination(trip.destination);
    setDescription(trip.description);
    setCoverImage(trip.coverImage);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
  }, [trip]);

  async function handleSaveTrip() {
    try {
      setSubmitting(true);
      setFormError(null);
      await updateTrip({
        title,
        destination,
        description,
        coverImage,
        startDate,
        endDate
      });
      setEditing(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "No se pudo actualizar el viaje.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando resumen...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido abrir este viaje" description={error} />;
  }

  if (!trip) {
    return <EmptyState title="Viaje no encontrado" description="Es posible que ya no tengas acceso o que el viaje se haya eliminado." />;
  }

  return (
    <div className="space-y-8">
      <TripHero
        title={trip.title}
        startDate={trip.startDate}
        endDate={trip.endDate}
        coverImage={trip.coverImage}
        destination={trip.destination}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Estado" value={trip.status === "active" ? "Activo" : trip.status === "draft" ? "Borrador" : "Cerrado"} icon="schedule" />
        <StatCard label="Miembros activos" value={String(members.filter((member) => member.status === "active").length)} icon="groups" />
        <StatCard
          label="Gasto total"
          value={expensesLoading ? "Cargando..." : formatCurrency(totalAmount)}
          icon="payments"
          hint={expenses.length > 0 ? `${expenses.length} gastos registrados` : "Aun no hay gastos registrados"}
        />
      </div>

      {editing ? (
        <Card className="p-6">
          <SectionHeader title="Editar viaje" description="Esta ficha guarda cambios reales en el viaje y actualiza el itinerario asociado." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Titulo</p>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Destino</p>
              <Input value={destination} onChange={(event) => setDestination(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fecha inicio</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fecha fin</p>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Portada</p>
              <Input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usa una URL directa de imagen. Si pegas la URL de una web, se mostrara una portada por defecto.
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <TripCoverImage src={coverImage} alt={title || "Vista previa de portada"} className="h-44 w-full object-cover" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descripcion</p>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          {formError ? <p className="mt-4 text-sm font-medium text-rose-600">{formError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => void handleSaveTrip()}
              disabled={submitting || !title.trim() || !destination.trim() || !startDate || !endDate}
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="space-y-5">
          <SectionHeader
            title="Proximas paradas"
            description="Vista real del itinerario del viaje, ordenada por dia y hora."
            action={isAdmin ? <Button onClick={() => setEditing((current) => !current)}>{editing ? "Cerrar" : "Editar viaje"}</Button> : null}
          />
          {upcoming.length === 0 ? (
            <EmptyState title="Aun no hay paradas" description="Anade eventos al itinerario para ver aqui las proximas actividades del viaje." />
          ) : (
            <div className="space-y-4">
              {upcoming.map((item) => (
                <Card key={item.id} className="overflow-hidden p-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <UpcomingStopPhoto title={item.title} address={item.address} />
                    <div className="flex-1">
                      <Badge>{item.startTime}</Badge>
                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.address}</p>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.notes}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Aventureros" action={<Button variant="secondary" onClick={() => navigate(`/trips/${trip.id}/members`)}>Ver grupo</Button>} />
            <div className="mt-5 flex items-center justify-between">
              <MemberStack tripId={trip.id} />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{members.length} miembros</p>
            </div>
          </Card>
          <Card className="overflow-hidden p-5">
            <SectionHeader title="Mapa del viaje" description="Vista previa real de la ruta del dia con mejor contexto del resumen." />
            {itineraryLoading ? (
              <div className="mt-4 flex min-h-52 items-center justify-center text-sm text-slate-500">Cargando ruta del viaje...</div>
            ) : previewDay ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>{`Vista previa de ${previewDay.label}`}</span>
                  <Button variant="secondary" onClick={() => navigate(`/trips/${trip.id}/map`)}>
                    Abrir mapa
                  </Button>
                </div>
                <DayRoutePreview
                  items={previewItems}
                  heightClassName="h-56"
                  emptyTitle="Aun no hay ruta calculable"
                  emptyDescription="Anade al menos dos paradas con direccion valida en el itinerario para ver el mapa aqui."
                />
                {previewMapsUrl ? (
                  <a href={previewMapsUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-primary">
                    Abrir esta ruta en Google Maps
                  </a>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="Aun no hay dias en el itinerario"
                description="Cuando el viaje tenga dias y paradas, aqui veras la ruta activa en el resumen."
              />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
