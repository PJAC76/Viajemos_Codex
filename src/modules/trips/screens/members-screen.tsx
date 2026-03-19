import { useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useTripOverview, useTripPermission } from "../data/use-trips-data";

export function MembersScreen() {
  const { tripId } = useParams();
  const {
    trip,
    members,
    invitations,
    loading,
    error,
    createInvitation,
    revokeInvitation,
    removeMember,
    updateMemberRole
  } = useTripOverview(tripId);
  const { isAdmin, isGlobalAdmin } = useTripPermission(tripId);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeAdmins = members.filter((member) => member.status === "active" && member.role === "admin").length;

  function normalizeMemberActionError(errorMessage: string) {
    if (errorMessage.includes("LAST_ADMIN_REQUIRED")) {
      return "Cada viaje debe conservar al menos un admin activo. Asigna otro admin antes de quitar este rol.";
    }

    if (errorMessage.includes("GLOBAL_ADMIN_REQUIRED")) {
      return "Solo el creador global puede cambiar quien es admin en un viaje.";
    }

    if (errorMessage.toLowerCase().includes("jwt expired") || errorMessage.toLowerCase().includes("sesion ha caducado")) {
      return "Tu sesion ha caducado. Vuelve a iniciar sesion y repite la invitacion.";
    }

    return errorMessage;
  }

  async function handleCreateInvitation() {
    try {
      setSubmitting(true);
      setActionError(null);
      const invitation = await createInvitation(inviteEmail);
      setInviteEmail("");
      setShowInviteForm(false);
      if (invitation.shareUrl) {
        await handleCopyLink(invitation.id, invitation.shareUrl);
      }
    } catch (creationError) {
      setActionError(
        normalizeMemberActionError(
          creationError instanceof Error ? creationError.message : "No se pudo crear la invitacion."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink(invitationId: string, shareUrl?: string) {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(invitationId);
      window.setTimeout(() => setCopiedId((currentId) => (currentId === invitationId ? null : currentId)), 2000);
    } catch {
      setActionError("No hemos podido copiar el enlace. Puedes copiarlo manualmente desde la tarjeta.");
    }
  }

  function handleShareWhatsapp(email: string, shareUrl?: string) {
    if (!shareUrl) {
      return;
    }

    const message = `Te he invitado a Viajemos para organizar nuestro viaje. Entra aqui con ${email}: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

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
          isAdmin ? (
            <Button onClick={() => setShowInviteForm((current) => !current)}>{showInviteForm ? "Cancelar" : "Invitar"}</Button>
          ) : (
            <Button variant="secondary" disabled>
              Solo admin
            </Button>
          )
        }
      />
      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}
      {isAdmin && showInviteForm ? (
        <Card className="p-5">
          <SectionHeader
            title="Invitar por email"
            description="Se crea una invitacion privada con enlace compartible y acceso protegido por email."
          />
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="amiga@correo.com"
            />
            <Button onClick={() => void handleCreateInvitation()} disabled={submitting || !inviteEmail.trim()}>
              {submitting ? "Enviando..." : "Crear invitacion"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Al crearla copiaremos el enlace automaticamente y despues podras reenviarlo manualmente por WhatsApp.
          </p>
        </Card>
      ) : null}
      <Card className="p-5">
        {isGlobalAdmin ? (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Como creador global puedes entrar en todos los viajes y decidir que miembros tienen rol de admin.
          </p>
        ) : null}
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
                  {isGlobalAdmin ? (
                    <Button
                      variant="secondary"
                      disabled={member.role === "admin" && activeAdmins <= 1}
                      onClick={() => {
                        setActionError(null);
                        void updateMemberRole(member.id, member.role === "admin" ? "member" : "admin").catch((roleError) => {
                          setActionError(
                            normalizeMemberActionError(
                              roleError instanceof Error
                                ? roleError.message
                                : "No se pudo actualizar el rol de este miembro."
                            )
                          );
                        });
                      }}
                    >
                      {member.role === "admin" ? "Quitar admin" : "Dar admin"}
                    </Button>
                  ) : null}
                  {isAdmin && member.role !== "admin" ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActionError(null);
                        void removeMember(member.id).catch((removalError) => {
                          setActionError(
                            normalizeMemberActionError(
                              removalError instanceof Error
                                ? removalError.message
                                : "No se pudo expulsar a este miembro."
                            )
                          );
                        });
                      }}
                    >
                      Expulsar
                    </Button>
                  ) : null}
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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{invitation.email}</p>
                    <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">
                      {invitation.shareUrl ?? invitation.token}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{invitation.status}</Badge>
                    <Button variant="secondary" onClick={() => void handleCopyLink(invitation.id, invitation.shareUrl)}>
                      {copiedId === invitation.id ? "Copiado" : "Copiar enlace"}
                    </Button>
                    <Button variant="secondary" onClick={() => handleShareWhatsapp(invitation.email, invitation.shareUrl)}>
                      WhatsApp
                    </Button>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActionError(null);
                          void revokeInvitation(invitation.id).catch((revokeError) => {
                            setActionError(
                              revokeError instanceof Error ? revokeError.message : "No se pudo revocar la invitacion."
                            );
                          });
                        }}
                      >
                        Revocar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
