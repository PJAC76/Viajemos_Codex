import { useEffect, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import { EmptyState } from "../../../components/states/empty-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function ProfileScreen() {
  const { authMessage, updateProfile, user } = useSession();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user?.avatarUrl, user?.displayName]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      await updateProfile({
        displayName,
        avatarUrl
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <EmptyState
        title="No hay sesion activa"
        description="Inicia sesion para cargar y editar tu perfil real desde InsForge."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Perfil" description="Datos basicos del usuario y punto de entrada para avatar y proveedor de login." />
      <Card className="max-w-2xl p-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-extrabold text-primary">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user.displayName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{user.provider}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Nombre visible</p>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</p>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Avatar URL</p>
            <Input
              placeholder="https://..."
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          <Button onClick={() => void handleSave()} disabled={saving || !displayName.trim()}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
