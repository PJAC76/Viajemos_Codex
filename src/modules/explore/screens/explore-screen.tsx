import { ComingSoonState } from "../../../components/states/coming-soon";
import { SectionHeader } from "../../../components/trips/section-header";
import { Card } from "../../../components/ui/card";

export function ExploreScreen() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Explorar" description="Pantalla pensada para descubrimiento interno con el mismo lenguaje visual del ecosistema." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-64 bg-gradient-to-br from-primary/20 to-white p-6 dark:from-primary/10 dark:to-slate-900" />
        <Card className="h-64 bg-gradient-to-br from-amber-100 to-white p-6 dark:from-amber-900/30 dark:to-slate-900" />
        <Card className="h-64 bg-gradient-to-br from-emerald-100 to-white p-6 dark:from-emerald-900/30 dark:to-slate-900" />
      </div>
      <ComingSoonState
        title="Descubrimiento del viaje"
        description="Aqui conectaremos recomendaciones, busqueda contextual y accesos rapidos sin mezclar responsabilidades con otros modulos."
      />
    </div>
  );
}
