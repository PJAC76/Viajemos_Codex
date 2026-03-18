import { notificationsService } from "../../../services/notifications-service";
import { useSession } from "../../../app/providers/session-provider";
import { SectionHeader } from "../../../components/trips/section-header";
import { Card } from "../../../components/ui/card";

export function NotificationsScreen() {
  const { user } = useSession();
  const items = user ? notificationsService.listForUser(user.id) : [];

  return (
    <div className="space-y-8">
      <SectionHeader title="Notificaciones" description="Feed privado por usuario para invitaciones, gastos y cambios del itinerario." />
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
