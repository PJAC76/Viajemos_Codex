import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useNotifications } from "../data/use-notifications-data";

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function kindLabel(kind: string) {
  switch (kind) {
    case "invitation":
      return "Invitacion";
    case "expense":
      return "Gasto";
    case "message":
      return "Mensaje";
    case "itinerary":
      return "Itinerario";
    case "settlement":
      return "Liquidacion";
    default:
      return "Sistema";
  }
}

export function NotificationsScreen() {
  const { notifications, unreadCount, loading, error, reload, markAsRead, markAllAsRead } = useNotifications();

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
    } catch {
      // Error feedback is handled by the hook state on next reload if needed.
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
    } catch {
      // Error feedback is handled by the hook state on next reload if needed.
    }
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando notificaciones...</div>;
  }

  if (error) {
    return (
      <ErrorState
        title="No hemos podido cargar tus notificaciones"
        description={error}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Notificaciones"
        description="Feed privado por usuario para invitaciones, gastos, cambios del itinerario y movimientos de liquidacion."
        action={
          <Button variant="secondary" onClick={() => void handleMarkAllAsRead()} disabled={unreadCount === 0}>
            Marcar todas como leidas
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Totales" value={String(notifications.length)} icon="notifications" />
        <StatCard label="Sin leer" value={String(unreadCount)} icon="mark_email_unread" />
        <StatCard label="Leidas" value={String(notifications.length - unreadCount)} icon="done_all" />
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Tu centro de notificaciones esta limpio"
          description="Cuando haya invitaciones, gastos, mensajes o cambios relevantes del viaje, apareceran aqui."
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-5 ${notification.isRead ? "" : "border-primary/30 bg-primary/5"}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{kindLabel(notification.kind)}</Badge>
                    {!notification.isRead ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Nueva
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{notification.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{notification.body}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {formatDateTime(notification.createdAt)}
                    {notification.tripId ? " · Relacionada con uno de tus viajes" : ""}
                  </p>
                </div>
                {!notification.isRead ? (
                  <Button variant="ghost" onClick={() => void handleMarkAsRead(notification.id)}>
                    Marcar leida
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
