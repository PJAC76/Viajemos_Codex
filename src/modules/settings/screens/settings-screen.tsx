import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useTripsList } from "../../trips/data/use-trips-data";
import { useUserSettings } from "../data/use-user-settings";
import { defaultUserSettings, type UserSettingsUpdateInput } from "../domain/types";

export function SettingsScreen() {
  const { trips, loading: tripsLoading } = useTripsList();
  const { settings, loading, error, reload, updateSettings } = useUserSettings();
  const [form, setForm] = useState<UserSettingsUpdateInput>(defaultUserSettings);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setForm({
      startScreen: settings.startScreen,
      preferredTripId: settings.preferredTripId,
      defaultMapMode: settings.defaultMapMode,
      compactMode: settings.compactMode,
      emailNotifications: settings.emailNotifications,
      expenseNotifications: settings.expenseNotifications,
      itineraryNotifications: settings.itineraryNotifications,
      messageNotifications: settings.messageNotifications
    });
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const preferredTripOptions = useMemo(
    () => trips.slice().sort((left, right) => left.startDate.localeCompare(right.startDate)),
    [trips]
  );

  async function handleSave() {
    try {
      setSaving(true);
      setActionError(null);
      setSuccessMessage(null);
      await updateSettings(form);
      setSuccessMessage("Ajustes guardados correctamente.");
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "No se pudieron guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(defaultUserSettings);
    setActionError(null);
    setSuccessMessage(null);
  }

  if (loading || tripsLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando ajustes...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido abrir tus ajustes" description={error} onRetry={() => void reload()} />;
  }

  if (!settings) {
    return (
      <EmptyState
        title="Necesitas iniciar sesion"
        description="Los ajustes son privados por usuario y se guardan en tu espacio personal de InsForge."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Configuracion"
        description="Preferencias privadas del usuario para navegacion, experiencia y alertas dentro de Viajemos."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleReset} disabled={saving}>
              Restaurar recomendados
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar ajustes"}
            </Button>
          </div>
        }
      />

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}
      {successMessage ? <p className="text-sm font-medium text-emerald-600">{successMessage}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <SectionHeader title="Navegacion" description="Decide como entra la app y cual es tu viaje de referencia al explorar." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pantalla inicial</span>
                <select
                  value={form.startScreen}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startScreen: event.target.value as UserSettingsUpdateInput["startScreen"]
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="trips">Mis viajes</option>
                  <option value="explore">Explorar</option>
                  <option value="notifications">Notificaciones</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Viaje preferido</span>
                <select
                  value={form.preferredTripId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preferredTripId: event.target.value || undefined
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Todos mis viajes</option>
                  {preferredTripOptions.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Experiencia" description="Ajustes que afectan a la densidad visual y al comportamiento del mapa." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Modo de ruta por defecto</span>
                <select
                  value={form.defaultMapMode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultMapMode: event.target.value as UserSettingsUpdateInput["defaultMapMode"]
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="driving">Coche</option>
                  <option value="walking">A pie</option>
                  <option value="transit">Transporte publico</option>
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Modo compacto</p>
                <label className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.compactMode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        compactMode: event.target.checked
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  Reducir paddings y densidad visual del shell
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Alertas" description="Control fino sobre que cambios quieres seguir de cerca en cada viaje." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { key: "emailNotifications", label: "Resumen por email" },
                { key: "expenseNotifications", label: "Gastos y liquidaciones" },
                { key: "itineraryNotifications", label: "Cambios de itinerario" },
                { key: "messageNotifications", label: "Mensajes del grupo" }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={form[item.key as keyof UserSettingsUpdateInput] as boolean}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [item.key]: event.target.checked
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 via-sky-100 to-white p-6 dark:from-primary/10 dark:via-slate-900 dark:to-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">PWA</p>
              <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">App instalable</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {isStandalone
                  ? "Estas usando Viajemos como app instalada."
                  : "Puedes instalar Viajemos desde el navegador para tener acceso rapido en movil y escritorio."}
              </p>
            </div>
            <div className="space-y-3 p-6 text-sm text-slate-500 dark:text-slate-400">
              <p>1. Abre el menu del navegador.</p>
              <p>2. Elige “Instalar app” o “Anadir a pantalla de inicio”.</p>
              <p>3. Mantendras el mismo flujo de viajes, gastos y mapa en modo app.</p>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Integraciones" description="Resumen rapido del stack activo en esta version del MVP." />
            <div className="mt-5 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <p>Backend principal: InsForge con base de datos, auth, storage y realtime.</p>
              <p>Mapas y rutas: Google Maps mediante adaptadores desacoplados.</p>
              <p>Moneda del MVP: EUR para todos los viajes y liquidaciones.</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <p className="max-w-3xl text-right text-xs leading-6 text-slate-500 dark:text-slate-400">
          Esta aplicacion ha sido disenada por Pedro Araujo para el uso y disfrute de las familias Araujo Martinez y
          Llavador Ros, cualquier otro uso fuera de estas familias o para nuestros viajes sera considerado un delito de
          propiedad intelectual.
        </p>
      </div>
    </div>
  );
}
