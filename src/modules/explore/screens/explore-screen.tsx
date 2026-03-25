import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { TripCoverImage } from "../../../components/trips/trip-cover-image";
import { StatCard } from "../../../components/trips/stat-card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatCurrency, formatDateRange } from "../../../lib/utils";
import { useUserSettings } from "../../settings/data/use-user-settings";
import { useExploreData } from "../data/use-explore-data";
import { exploreQueries } from "../data/explore-queries";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(date));
}

export function ExploreScreen() {
  const { settings } = useUserSettings();
  const { snapshot, loading, error, reload } = useExploreData();
  const [search, setSearch] = useState("");
  const [tripFilter, setTripFilter] = useState<string | "all">("all");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    if (settings?.preferredTripId && snapshot.availableTrips.some((trip) => trip.id === settings.preferredTripId)) {
      setTripFilter(settings.preferredTripId);
      return;
    }

    setTripFilter("all");
  }, [settings?.preferredTripId, snapshot]);

  const filteredResults = useMemo(
    () => (snapshot ? exploreQueries.filterSearchResults(snapshot.searchResults, deferredSearch, tripFilter).slice(0, 12) : []),
    [deferredSearch, snapshot, tripFilter]
  );

  const activeTrip = useMemo(
    () =>
      snapshot?.quickTrips.find((trip) => trip.id === tripFilter)
      ?? snapshot?.availableTrips.find((trip) => trip.id === tripFilter)
      ?? snapshot?.quickTrips[0]
      ?? snapshot?.availableTrips[0]
      ?? null,
    [snapshot, tripFilter]
  );

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando exploracion...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar la vista Explorar" description={error} onRetry={() => void reload()} />;
  }

  if (!snapshot || snapshot.activeTripsCount === 0) {
    return (
      <EmptyState
        title="Aun no tienes viajes para explorar"
        description="Crea tu primer viaje privado para empezar a descubrir reservas, gastos y documentos desde esta vista global."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Explorar"
        description="Hub global para descubrir lo mas importante de tus viajes y lanzar busquedas contextuales sin perder el foco."
      />

      <Card className="overflow-hidden">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(43,124,238,0.22),_transparent_36%),linear-gradient(135deg,_#eff6ff,_#ffffff_50%,_#ecfeff)] p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(43,124,238,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a,_#111827_55%,_#082f49)] md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Radar del ecosistema</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Busca lugares, reservas, gastos y documentos en segundos
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Esta vista concentra senales utiles del viaje sin mezclar permisos: descubres rapido y saltas al modulo correcto para actuar.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por viaje, sitio, localizador, gasto o documento..."
              />
              <select
                value={tripFilter}
                onChange={(event) => setTripFilter(event.target.value as string | "all")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">Todos mis viajes</option>
                {snapshot.availableTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              {activeTrip ? (
                <>
                  <Link to={`/trips/${activeTrip.id}/summary`}>
                    <Button>Resumen del viaje</Button>
                  </Link>
                  <Link to={`/trips/${activeTrip.id}/expenses`}>
                    <Button variant="secondary">Abrir gastos</Button>
                  </Link>
                  <Link to={`/trips/${activeTrip.id}/map`}>
                    <Button variant="secondary">
                      Mapa en {snapshot.preferredMapMode === "walking" ? "a pie" : snapshot.preferredMapMode === "transit" ? "transporte" : "coche"}
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.quickTrips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}/summary`}>
                <Card className="h-full overflow-hidden border-white/60 bg-white/80 p-0 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="aspect-[16/10] bg-slate-200">
                    <TripCoverImage src={trip.coverImage} alt={trip.title} searchQuery={`${trip.title}, ${trip.destination}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{trip.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{trip.destination}</p>
                    <p className="text-xs text-slate-400">{formatDateRange(trip.startDate, trip.endDate)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Viajes activos" value={String(snapshot.activeTripsCount)} icon="luggage" />
        <StatCard label="Sitios favoritos" value={String(snapshot.favoritePlacesCount)} icon="favorite" />
        <StatCard label="Reservas proximas" value={String(snapshot.upcomingReservationsCount)} icon="event_available" />
        <StatCard label="Notificaciones sin leer" value={String(snapshot.unreadNotificationsCount)} icon="notifications_active" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <SectionHeader
            title={deferredSearch.trim().length > 0 ? "Resultados de busqueda" : "Accesos listos para abrir"}
            description={
              deferredSearch.trim().length > 0
                ? `Mostrando coincidencias en ${tripFilter === "all" ? "todos tus viajes" : "el viaje seleccionado"}.`
                : "Sin escribir nada ya tienes una muestra de lo mas reciente y mas util del ecosistema."
            }
          />
          <div className="mt-5 space-y-4">
            {filteredResults.length === 0 ? (
              <EmptyState
                title="No hemos encontrado coincidencias"
                description="Prueba con otro termino o cambia el filtro de viaje para ampliar la busqueda."
              />
            ) : (
              filteredResults.map((result) => (
                <Link key={result.id} to={result.href}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-primary/40 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-primary/30 dark:hover:bg-primary/5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{result.badge}</Badge>
                          {result.tripTitle ? (
                            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {result.tripTitle}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">{result.icon}</span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{result.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{result.subtitle}</p>
                          </div>
                        </div>
                        {result.description ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{result.description}</p>
                        ) : null}
                      </div>
                      {result.dateLabel ? <p className="text-xs text-slate-400">{formatDate(result.dateLabel)}</p> : null}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <SectionHeader title="Reservas proximas" />
            <div className="mt-5 space-y-4">
              {snapshot.upcomingReservations.length === 0 ? (
                <EmptyState
                  title="Sin reservas cercanas"
                  description="Cuando el grupo cierre hoteles, restaurantes o actividades, apareceran aqui."
                />
              ) : (
                snapshot.upcomingReservations.map((reservation) => (
                  <Link key={reservation.id} to={`/trips/${reservation.tripId}/reservations`}>
                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{reservation.title}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{reservation.tripTitle}</p>
                        </div>
                        <Badge>{reservation.status === "confirmed" ? "Confirmada" : reservation.status === "cancelled" ? "Cancelada" : "Pendiente"}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(reservation.startAt)}
                        {typeof reservation.amount === "number" ? ` · ${formatCurrency(reservation.amount)}` : ""}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Ultimos gastos" />
            <div className="mt-5 space-y-4">
              {snapshot.recentExpenses.length === 0 ? (
                <EmptyState title="Todavia no hay gastos" description="Los gastos nuevos del grupo apareceran aqui para acceder rapido." />
              ) : (
                snapshot.recentExpenses.map((expense) => (
                  <Link key={expense.id} to={`/trips/${expense.tripId}/expenses`}>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{expense.concept}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{expense.tripTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Documentos recientes" />
            <div className="mt-5 space-y-4">
              {snapshot.recentDocuments.length === 0 ? (
                <EmptyState
                  title="Todavia no hay documentos"
                  description="En cuanto subais seguros, billetes o adjuntos, podras abrirlos desde aqui."
                />
              ) : (
                snapshot.recentDocuments.map((document) => (
                  <Link key={document.id} to={`/trips/${document.tripId}/documents`}>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <span className="material-symbols-outlined text-primary">
                        {document.documentType === "image" ? "image" : document.documentType === "pdf" ? "picture_as_pdf" : "folder"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white">{document.title}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{document.fileName}</p>
                      </div>
                      <p className="text-xs text-slate-400">{formatDate(document.updatedAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
