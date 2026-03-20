import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { hasGoogleMapsEnv } from "../../../lib/env";
import { mapsRouteService } from "../../../services/maps-route-service";
import { useItinerary } from "../../itinerary/data/use-itinerary-data";
import { useUserSettings } from "../../settings/data/use-user-settings";
import type { RouteSnapshot, RouteTravelMode } from "../../itinerary/domain/types";
import { useTripOverview } from "../../trips/data/use-trips-data";
import { useRouteSnapshot } from "../data/use-route-snapshot";

export function MapScreen() {
  const { tripId } = useParams();
  const { settings } = useUserSettings();
  const { trip, loading: tripLoading, error: tripError } = useTripOverview(tripId);
  const { days, itemsByDay, loading: itineraryLoading, error: itineraryError } = useItinerary(
    tripId,
    trip?.startDate,
    trip?.endDate
  );
  const [activeDayId, setActiveDayId] = useState<string | undefined>(undefined);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("driving");
  const [route, setRoute] = useState<RouteSnapshot | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const lastRenderedSignatureRef = useRef<string | null>(null);

  const activeDay = useMemo(() => days.find((day) => day.id === activeDayId) ?? days[0] ?? null, [activeDayId, days]);
  const activeDayItems = useMemo(() => {
    if (!activeDay) {
      return [];
    }

    return itemsByDay.get(activeDay.id) ?? [];
  }, [activeDay, itemsByDay]);

  const {
    snapshot,
    loading: snapshotLoading,
    error: snapshotError,
    saveSnapshot
  } = useRouteSnapshot(tripId, activeDay?.id);

  const routeSignature = useMemo(
    () =>
      `${activeDay?.id ?? "day"}:${travelMode}:${activeDayItems.map((item) => `${item.id}:${item.order}:${item.address}`).join("|")}`,
    [activeDay?.id, activeDayItems, travelMode]
  );
  const externalMapsUrl = useMemo(
    () => mapsRouteService.buildGoogleMapsDirectionsUrl(activeDayItems, travelMode),
    [activeDayItems, travelMode]
  );

  useEffect(() => {
    if (settings?.defaultMapMode) {
      setTravelMode(settings.defaultMapMode);
    }
  }, [settings?.defaultMapMode]);

  useEffect(() => {
    if (!days.length) {
      setActiveDayId(undefined);
      return;
    }

    if (activeDayId && days.some((day) => day.id === activeDayId)) {
      return;
    }

    const firstDayWithStops = days.find((day) => (itemsByDay.get(day.id) ?? []).length > 0);
    setActiveDayId(firstDayWithStops?.id ?? days[0].id);
  }, [activeDayId, days, itemsByDay]);

  useEffect(() => {
    setRoute(null);
    setMapMessage(null);
  }, [activeDay?.id]);

  useEffect(() => {
    setRoute(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!hasGoogleMapsEnv || !activeDay || !mapContainerRef.current) {
      return;
    }

    if (!mapsRouteService.canCalculateRoute(activeDayItems)) {
      lastRenderedSignatureRef.current = null;
      return;
    }

    if (lastRenderedSignatureRef.current === routeSignature) {
      return;
    }

    void handleCalculateRoute(false);
  }, [activeDay, activeDayItems, routeSignature]);

  async function handleCalculateRoute(force: boolean) {
    if (!tripId || !activeDay || !mapContainerRef.current) {
      return;
    }

    if (!hasGoogleMapsEnv) {
      setMapMessage("Configura Google Maps para recalcular la ruta sobre el mapa embebido.");
      return;
    }

    if (!mapsRouteService.canCalculateRoute(activeDayItems)) {
      setMapMessage("Necesitas al menos dos paradas con direccion para calcular una ruta.");
      return;
    }

    if (!force && lastRenderedSignatureRef.current === routeSignature) {
      return;
    }

    try {
      setCalculating(true);
      setSaving(true);
      setMapMessage(null);
      lastRenderedSignatureRef.current = routeSignature;

      const calculatedRoute = await mapsRouteService.calculateAndRenderDayRoute({
        container: mapContainerRef.current,
        items: activeDayItems,
        travelMode
      });

      const savedRoute = await saveSnapshot({
        ...calculatedRoute,
        tripId,
        dayId: activeDay.id,
        travelMode
      });

      setRoute(savedRoute);
    } catch (error) {
      if (force) {
        lastRenderedSignatureRef.current = null;
      }

      setMapMessage(error instanceof Error ? error.message : "No se pudo calcular la ruta del dia.");
    } finally {
      setCalculating(false);
      setSaving(false);
    }
  }

  const isLoading = tripLoading || itineraryLoading;
  const hasStopsToRoute = mapsRouteService.canCalculateRoute(activeDayItems);
  const travelModeLabels: Array<{ id: RouteTravelMode; label: string; icon: string }> = [
    { id: "driving", label: "Coche", icon: "directions_car" },
    { id: "walking", label: "A pie", icon: "directions_walk" },
    { id: "transit", label: "Transporte", icon: "train" }
  ];

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando mapa del viaje...</div>;
  }

  if (tripError || itineraryError) {
    return (
      <ErrorState
        title="No hemos podido abrir el mapa del viaje"
        description={tripError ?? itineraryError ?? "Revisa la conexion e intentalo de nuevo."}
      />
    );
  }

  if (!trip) {
    return (
      <EmptyState
        title="Viaje no disponible"
        description="Necesitamos un viaje activo para calcular rutas y mostrar el mapa diario."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mapa y ruta optimizada"
        description="El calculo usa el orden del itinerario. Si Google Maps falla o no esta configurado, el plan diario sigue operativo."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleCalculateRoute(true)}
              disabled={!activeDay || !hasStopsToRoute || !hasGoogleMapsEnv || calculating || saving}
            >
              {calculating || saving ? "Calculando..." : "Recalcular ruta"}
            </Button>
            {externalMapsUrl ? (
              <a href={externalMapsUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">Abrir en Google Maps</Button>
              </a>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {days.map((day) => {
          const isActive = day.id === activeDay?.id;
          const stopCount = (itemsByDay.get(day.id) ?? []).length;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDayId(day.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {day.label}
              <span className="ml-2 text-xs opacity-80">{stopCount} paradas</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  {hasGoogleMapsEnv ? "Google Maps activo" : "Mapa en modo resumen"}
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {activeDay ? `${activeDay.label} - ${activeDay.date}` : "Selecciona un dia"}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {hasGoogleMapsEnv
                    ? "Mostramos la ruta sobre el mapa y guardamos el snapshot calculado."
                    : "Sin clave de Google Maps seguiremos mostrando la ultima ruta guardada del dia."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {travelModeLabels.map((mode) => (
                  <Button
                    key={mode.id}
                    variant={travelMode === mode.id ? "primary" : "secondary"}
                    onClick={() => {
                      setTravelMode(mode.id);
                      lastRenderedSignatureRef.current = null;
                    }}
                  >
                    <span className="material-symbols-outlined text-base">{mode.icon}</span>
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {!activeDay ? (
            <div className="p-6">
              <EmptyState
                title="Aun no hay dias listos"
                description="El itinerario necesita al menos un dia generado para poder pintar la ruta."
              />
            </div>
          ) : (
            <div className="relative">
              {hasGoogleMapsEnv ? (
                <div ref={mapContainerRef} className="h-[420px] w-full bg-slate-100 dark:bg-slate-900" />
              ) : (
                <div className="flex h-[420px] items-end bg-[radial-gradient(circle_at_top_left,_rgba(43,124,238,0.35),_transparent_35%),linear-gradient(135deg,_#dbeafe,_#f8fafc_48%,_#e2e8f0)] p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(43,124,238,0.15),_transparent_35%),linear-gradient(135deg,_#0f172a,_#111827_48%,_#020617)]">
                  <div className="max-w-md rounded-2xl bg-white/90 p-5 shadow-soft backdrop-blur dark:bg-slate-950/80">
                    <p className="text-sm font-semibold text-primary">Vista preparada para Google Maps</p>
                    <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Seguimos operativos aunque el mapa no este activo</h4>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Cuando configures la clave de Google Maps, aqui veremos los pines, la polilinea y el resumen calculado en tiempo real.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 border-t border-slate-200 p-5 md:grid-cols-3 dark:border-slate-800">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paradas del dia</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{activeDayItems.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Distancia total</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {route ? `${route.totalDistanceKm} km` : "--"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tiempo total</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {route ? `${route.totalDurationMinutes} min` : "--"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Estado del calculo" description="Guardamos un snapshot por dia para no depender del mapa en cada visita." />
            <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <span>Google Maps</span>
                <span className="font-semibold text-slate-900 dark:text-white">{hasGoogleMapsEnv ? "Configurado" : "Pendiente"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <span>Ruta guardada</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {snapshotLoading ? "Cargando..." : route ? "Disponible" : "Sin snapshot"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <span>Modo de viaje</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">{travelMode}</span>
              </div>
            </div>
            {mapMessage ? <p className="mt-4 text-sm font-medium text-amber-600">{mapMessage}</p> : null}
            {snapshotError ? <p className="mt-2 text-sm font-medium text-rose-600">{snapshotError}</p> : null}
            {externalMapsUrl ? (
              <a
                href={externalMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-primary"
              >
                Abrir esta ruta directamente en Google Maps
              </a>
            ) : null}
          </Card>

          <Card className="p-5">
            <SectionHeader title="Tramos del dia" description="Cada tramo se guarda con distancia y tiempo para consulta rapida." />
            <div className="mt-5 space-y-3">
              {!activeDay ? (
                <EmptyState title="Selecciona un dia" description="Necesitamos un dia activo para listar sus tramos." />
              ) : !hasStopsToRoute ? (
                <EmptyState
                  title="Faltan paradas para la ruta"
                  description="Anade al menos dos eventos con direccion valida en el itinerario para calcular el trayecto del dia."
                />
              ) : route ? (
                route.segments.map((segment) => (
                  <div key={`${segment.from}-${segment.to}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{segment.from}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">hasta {segment.to}</p>
                      </div>
                      <div className="text-right text-sm font-semibold text-primary">
                        <p>{segment.distanceKm} km</p>
                        <p>{segment.durationMinutes} min</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aun no hay ruta guardada"
                  description="Calcula la ruta del dia para ver el desglose por tramos y dejarlo disponible para el resto del grupo."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
