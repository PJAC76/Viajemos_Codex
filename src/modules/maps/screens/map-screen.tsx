import { routeSnapshots } from "../../../mocks/db";
import { SectionHeader } from "../../../components/trips/section-header";
import { Card } from "../../../components/ui/card";
import { hasGoogleMapsEnv } from "../../../lib/env";

export function MapScreen() {
  const route = routeSnapshots[0];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mapa y ruta optimizada"
        description="Contenedor desacoplado del itinerario: si falla Maps, el plan diario sigue operativo."
      />
      <Card className="overflow-hidden">
        <div className="aspect-[16/8] bg-[radial-gradient(circle_at_top_left,_rgba(43,124,238,0.35),_transparent_35%),linear-gradient(135deg,_#dbeafe,_#f8fafc_48%,_#e2e8f0)]" />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              {hasGoogleMapsEnv ? "Google Maps listo" : "Modo mock activo"}
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">Ruta guardada del Dia 1</h3>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Total estimado: {route.totalDistanceKm} km · {route.totalDurationMinutes} min.
            </p>
          </div>
          <div className="space-y-3">
            {route.segments.map((segment) => (
              <div key={`${segment.from}-${segment.to}`} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{segment.from}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">hasta {segment.to}</p>
                <p className="mt-2 text-sm font-medium text-primary">{segment.distanceKm} km · {segment.durationMinutes} min</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
