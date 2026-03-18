import { tripInvitations, tripMembers, trips } from "../../../mocks/db";
import { AdminOnlyAction } from "../../../app/components/route-guards";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function MembersScreen() {
  const trip = trips[0];
  const members = tripMembers.filter((member) => member.tripId === trip.id);
  const invitations = tripInvitations.filter((invitation) => invitation.tripId === trip.id);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Aventureros"
        description="Roles admin/member, invitaciones privadas y gestion de acceso por viaje."
        action={
          <AdminOnlyAction tripId={trip.id} fallback={<Button variant="secondary" disabled>Solo admin</Button>}>
            <Button>Invitar miembro</Button>
          </AdminOnlyAction>
        }
      />
      <Card className="p-5">
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img src={member.avatarUrl} alt={member.displayName} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{member.displayName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                </div>
              </div>
              <Badge>{member.role}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <SectionHeader title="Invitaciones pendientes" />
        <div className="mt-4 space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">{invitation.email}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{invitation.shareUrl}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
