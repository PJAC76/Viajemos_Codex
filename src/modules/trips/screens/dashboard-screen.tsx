import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { itineraryItems } from "../../../mocks/db";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { MemberStack } from "../../../components/trips/member-stack";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { TripHero } from "../../../components/trips/trip-hero";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useTripOverview, useTripPermission } from "../data/use-trips-data";

export function DashboardScreen() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trip, members, loading, error, updateTrip, deleteTrip } = useTripOverview(tripId);
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
  const upcoming = itineraryItems.filter((item) => item.tripId === tripId).slice(0, 3);

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

  async function handleDeleteTrip() {
    try {
      setSubmitting(true);
      setFormError(null);
      await deleteTrip();
      navigate("/trips");
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar el viaje.");
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
        <StatCard label="Moneda" value={trip.currency} icon="payments" hint="MVP limitado a EUR" />
      </div>

      {editing ? (
        <Card className="p-6">
          <SectionHeader title="Editar viaje" description="Esta ficha ya guarda cambios en la tabla real trips de InsForge." />
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
            <Button variant="danger" onClick={() => void handleDeleteTrip()} disabled={submitting}>
              Borrar viaje
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="space-y-5">
          <SectionHeader
            title="Proximas paradas"
            description="La estructura ya esta conectada a trips reales; el itinerario seguira usando mocks hasta el modulo M6."
            action={isAdmin ? <Button onClick={() => setEditing((current) => !current)}>{editing ? "Cerrar" : "Editar viaje"}</Button> : null}
          />
          {upcoming.length === 0 ? (
            <EmptyState title="Aun no hay paradas" description="Cuando conectemos el modulo de itinerario, aqui veras las proximas actividades del viaje." />
          ) : (
            <div className="space-y-4">
              {upcoming.map((item) => (
                <Card key={item.id} className="overflow-hidden p-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="h-28 w-full rounded-xl bg-slate-100 md:w-32" />
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
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-sky-100 to-slate-100 dark:from-primary/10 dark:via-slate-900 dark:to-slate-800" />
            <div className="p-5">
              <SectionHeader title="Mapa del viaje" description="Contenedor listo para integrar Google Maps." />
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Ruta diaria optimizada</span>
                <span>{upcoming.length > 0 ? "18.2 km · 72 min" : "Pendiente de calcular"}</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
