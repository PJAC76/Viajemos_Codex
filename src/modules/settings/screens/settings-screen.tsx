import { SectionHeader } from "../../../components/trips/section-header";
import { Card } from "../../../components/ui/card";

export function SettingsScreen() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Configuracion" description="Preferencias del usuario, PWA e integraciones del cliente." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instalacion PWA</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manifest, iconos y service worker base ya preparados.</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Integraciones</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Supabase y Google Maps quedan conectados por adaptadores desacoplados.</p>
        </Card>
      </div>
    </div>
  );
}
