import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { MemberStack } from "../../../components/trips/member-stack";
import { SectionHeader } from "../../../components/trips/section-header";
import { TripCoverImage } from "../../../components/trips/trip-cover-image";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatDateRange } from "../../../lib/utils";
import { useTripsList } from "../data/use-trips-data";

export function TripsScreen() {
  const navigate = useNavigate();
  const { createTrip, error, loading, trips, reload } = useTripsList();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (trips.length === 0) {
      setShowCreateForm(true);
    }
  }, [trips.length]);

  if (!loading && trips.length === 1) {
    return <Navigate to={`/trips/${trips[0].id}/summary`} replace />;
  }

  async function handleCreateTrip() {
    try {
      setSubmitting(true);
      setFormError(null);
      const nextTrip = await createTrip({
        title,
        destination,
        description,
        coverImage,
        startDate,
        endDate
      });
      navigate(`/trips/${nextTrip.id}/summary`);
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : "No se pudo crear el viaje.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando viajes...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar tus viajes" description={error} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mis viajes"
        description="Base de viajes privados con acceso por invitacion y layout consistente entre desktop y mobile."
        action={<Button onClick={() => setShowCreateForm((current) => !current)}>{showCreateForm ? "Ocultar" : "Crear viaje"}</Button>}
      />
      {showCreateForm ? (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Titulo</p>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Escapada a Menorca" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Destino</p>
              <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Menorca, Espana" />
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
              <Input
                value={coverImage}
                onChange={(event) => setCoverImage(event.target.value)}
                placeholder="URL directa de imagen para la portada"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usa una URL directa de imagen. Si pegas la URL de una web, se mostrara una portada por defecto.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descripcion</p>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Cuenta al grupo que tipo de viaje vais a organizar."
              />
            </div>
          </div>
          {formError ? <p className="mt-4 text-sm font-medium text-rose-600">{formError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => void handleCreateTrip()}
              disabled={submitting || !title.trim() || !destination.trim() || !startDate || !endDate}
            >
              {submitting ? "Creando viaje..." : "Guardar viaje"}
            </Button>
            <Button variant="secondary" onClick={() => void reload()}>
              Recargar
            </Button>
          </div>
        </Card>
      ) : null}
      {trips.length === 0 ? (
        <EmptyState
          title="Todavia no tienes viajes"
          description="Crea el primer viaje real en InsForge y se registrara automaticamente tu acceso como admin."
        />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {trips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden">
            <TripCoverImage src={trip.coverImage} alt={trip.title} className="h-56 w-full object-cover" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{trip.title}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {formatDateRange(trip.startDate, trip.endDate)} - {trip.destination}
                  </p>
                </div>
                <MemberStack tripId={trip.id} />
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{trip.description}</p>
              <div className="mt-6">
                <Link to={`/trips/${trip.id}/summary`}>
                  <Button>Entrar al viaje</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
