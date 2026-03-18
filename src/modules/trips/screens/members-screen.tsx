import { useParams } from "react-router-dom";
import { AdminOnlyAction } from "../../../app/components/route-guards";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useTripOverview } from "../data/use-trips-data";

export function MembersScreen() {
  const { tripId } = useParams();
  const { trip, members, invitations, loading, error } = useTripOverview(tripId);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando aventureros...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar los miembros" description={error} />;
  }

  if (!trip) {
    return <EmptyState title="Viaje no disponible" description="No se encontro el viaje o ya no tienes acceso a sus miembros." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Aventureros"
        description="Roles admin/member, invitaciones privadas y gestion de acceso por viaje."
        action={
          <AdminOnlyAction tripId={trip.id} fallback={<Button variant="secondary" disabled>Solo admin</Button>}>
            <Button disabled>Invitacion en M3</Button>
          </AdminOnlyAction>
        }
      />
      <Card className="p-5">
        <div className="space-y-4">
          {members.length === 0 ? (
            <EmptyState title="Sin miembros" description="Todavia no hay participantes activos en este viaje." />
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.displayName} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{member.displayName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {member.email || (member.status === "active" ? "Miembro del viaje" : "Pendiente de aceptar")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{member.role}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{member.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      <Card className="p-5">
        <SectionHeader title="Invitaciones pendientes" description="Lectura real desde trip_invitations, preparada para el flujo completo del modulo M3." />
        <div className="mt-4 space-y-3">
          {invitations.length === 0 ? (
            <EmptyState title="Sin invitaciones" description="Todavia no hay invitaciones activas para este viaje." />
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{invitation.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{invitation.shareUrl ?? invitation.token}</p>
                  </div>
                  <Badge>{invitation.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
