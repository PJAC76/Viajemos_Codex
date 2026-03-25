import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../states/empty-state";
import { hasGoogleMapsEnv } from "../../lib/env";
import { mapsRouteService } from "../../services/maps-route-service";
import type { ItineraryItem, RouteSnapshotDraft, RouteTravelMode } from "../../modules/itinerary/domain/types";

interface DayRoutePreviewProps {
  items: ItineraryItem[];
  travelMode?: RouteTravelMode;
  heightClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRouteCalculated?: (route: RouteSnapshotDraft) => void;
  recalculateToken?: number;
}

export function DayRoutePreview({
  items,
  travelMode = "driving",
  heightClassName = "h-72",
  emptyTitle = "Aun no hay ruta disponible",
  emptyDescription = "Anade al menos dos paradas con direccion valida para ver el mapa del dia.",
  onRouteCalculated,
  recalculateToken = 0
}: DayRoutePreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<string | null>(null);
  const [previewRoute, setPreviewRoute] = useState<RouteSnapshotDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canRenderRoute = mapsRouteService.canCalculateRoute(items);
  const routeSignature = useMemo(
    () => `${travelMode}:${recalculateToken}:${items.map((item) => `${item.id}:${item.order}:${item.address}`).join("|")}`,
    [items, recalculateToken, travelMode]
  );

  useEffect(() => {
    setPreviewRoute(null);
    setMessage(null);
    signatureRef.current = null;
  }, [routeSignature]);

  useEffect(() => {
    if (!hasGoogleMapsEnv || !canRenderRoute || !mapRef.current) {
      return;
    }

    if (signatureRef.current === routeSignature) {
      return;
    }

    let active = true;
    signatureRef.current = routeSignature;
    setLoading(true);
    setMessage(null);

    void mapsRouteService
      .calculateAndRenderDayRoute({
        container: mapRef.current,
        items,
        travelMode
      })
      .then((route) => {
        if (!active) {
          return;
        }

        setPreviewRoute(route);
        onRouteCalculated?.(route);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        signatureRef.current = null;
        setPreviewRoute(null);
        setMessage(error instanceof Error ? error.message : "No se pudo mostrar el mapa del dia.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canRenderRoute, items, onRouteCalculated, routeSignature, travelMode]);

  if (!canRenderRoute) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  if (!hasGoogleMapsEnv) {
    return (
      <EmptyState
        title="Google Maps no configurado"
        description="La ruta se puede abrir igualmente en Google Maps cuando la clave este disponible."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className={`w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 ${heightClassName}`} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paradas</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{items.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Distancia</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {previewRoute ? `${previewRoute.totalDistanceKm} km` : loading ? "..." : "--"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tiempo</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {previewRoute ? `${previewRoute.totalDurationMinutes} min` : loading ? "..." : "--"}
          </p>
        </div>
      </div>
      {message ? <p className="text-sm font-medium text-amber-600">{message}</p> : null}
    </div>
  );
}
