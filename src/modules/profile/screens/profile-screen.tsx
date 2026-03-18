import { useSession } from "../../../app/providers/session-provider";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function ProfileScreen() {
  const { user } = useSession();

  return (
    <div className="space-y-8">
      <SectionHeader title="Perfil" description="Datos basicos del usuario y punto de entrada para avatar y proveedor de login." />
      <Card className="max-w-2xl p-6">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.displayName} className="h-20 w-20 rounded-full object-cover" /> : null}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user?.displayName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <Input defaultValue={user?.displayName} />
          <Input defaultValue={user?.email} />
          <Button>Guardar cambios</Button>
        </div>
      </Card>
    </div>
  );
}
