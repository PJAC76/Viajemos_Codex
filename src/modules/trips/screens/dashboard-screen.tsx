import { itineraryItems, trips } from "../../../mocks/db";
import { MemberStack } from "../../../components/trips/member-stack";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { TripHero } from "../../../components/trips/trip-hero";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function DashboardScreen() {
  const trip = trips[0];
  const upcoming = itineraryItems.slice(0, 3);

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
        <StatCard label="Dias restantes" value="4" icon="schedule" />
        <StatCard label="Paradas visitadas" value="12 / 20" icon="location_on" hint="60% del plan completado" />
        <StatCard label="Presupuesto gastado" value="65%" icon="payments" hint="Dentro del limite previsto" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="space-y-5">
          <SectionHeader
            title="Proximas paradas"
            description="Vista base del dashboard inspirada en Stitch, preparada para datos reales."
            action={<Button>Añadir parada</Button>}
          />
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
        </section>

        <section className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Aventureros" action={<Button variant="secondary">Invitar</Button>} />
            <div className="mt-5 flex items-center justify-between">
              <MemberStack tripId={trip.id} />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">4 miembros</p>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-sky-100 to-slate-100 dark:from-primary/10 dark:via-slate-900 dark:to-slate-800" />
            <div className="p-5">
              <SectionHeader title="Mapa del viaje" description="Contenedor listo para integrar Google Maps." />
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Ruta diaria optimizada</span>
                <span>18.2 km · 72 min</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
