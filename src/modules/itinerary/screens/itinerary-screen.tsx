import { itineraryDays, itineraryItems } from "../../../mocks/db";
import { SectionHeader } from "../../../components/trips/section-header";
import { Timeline } from "../../../components/trips/timeline";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function ItineraryScreen() {
  const activeDay = itineraryDays[0];
  const items = itineraryItems.filter((item) => item.dayId === activeDay.id);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Itinerario diario"
        description="Eventos manuales o vinculados, ordenados por dia y listos para recalculo de ruta."
        action={<Button>Editar itinerario</Button>}
      />
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {itineraryDays.map((day, index) => (
          <div
            key={day.id}
            className={`min-w-[112px] rounded-2xl px-4 py-3 text-center ${index === 0 ? "bg-primary text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
          >
            <p className="text-sm font-bold">{day.label}</p>
            <p className="text-xs opacity-80">{new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(day.date))}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <Timeline items={items} />
        </Card>
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-sky-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-800" />
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumen del dia</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">3 eventos, 18.2 km totales, 72 minutos estimados de traslado.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
