import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { TripCoverImage } from "../../../components/trips/trip-cover-image";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { formatDateRange } from "../../../lib/utils";
import { tripsQueries } from "../data/trips-queries";
import { useTripInvitationPreview } from "../data/use-trips-data";

function normalizeInvitationError(message: string) {
  if (message.includes("INVITATION_EMAIL_MISMATCH")) {
    return "Esta invitacion esta vinculada a otro email. Inicia sesion con la cuenta invitada para unirte.";
  }

  if (message.includes("AUTH_REQUIRED")) {
    return "Necesitas iniciar sesion antes de aceptar la invitacion.";
  }

  if (message.includes("INVITATION_NOT_AVAILABLE")) {
    return "Esta invitacion ya fue usada, revocada o ha dejado de estar disponible.";
  }

  if (message.includes("INVITATION_NOT_FOUND")) {
    return "No hemos encontrado esta invitacion. Pide al admin que te comparta un enlace nuevo.";
  }

  return message;
}

export function AcceptInvitationScreen() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const { invitation, loading, error, reload } = useTripInvitationPreview(token);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAcceptInvitation() {
    try {
      setSubmitting(true);
      setActionError(null);
      const result = await tripsQueries.acceptInvitation(token);
      await reload();
      navigate(`/trips/${result.tripId}/summary`, { replace: true });
    } catch (acceptError) {
      setActionError(
        normalizeInvitationError(
          acceptError instanceof Error ? acceptError.message : "No se pudo aceptar la invitacion."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || sessionLoading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando invitacion...</div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <ErrorState title="No hemos podido abrir la invitacion" description={error} />
      </AuthLayout>
    );
  }

  if (!invitation) {
    return (
      <AuthLayout>
        <EmptyState
          title="Invitacion no disponible"
          description="Puede que el enlace haya caducado o que el admin lo haya revocado."
        />
      </AuthLayout>
    );
  }

  const loginTarget = `/auth/login?invite=${encodeURIComponent(token)}`;
  const registerTarget = `/auth/register?invite=${encodeURIComponent(token)}`;
  const canAccept = Boolean(user && invitation.status === "pending" && invitation.viewerMatchesEmail);
  const canOpenTrip = Boolean(user && invitation.viewerMatchesEmail && invitation.status === "accepted");

  return (
    <AuthLayout>
      <Card className="w-full max-w-2xl overflow-hidden">
        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900">
          <TripCoverImage src={invitation.coverImage} alt={invitation.tripTitle} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/15 text-white">Invitacion privada</Badge>
              <Badge className="bg-white/15 text-white">{invitation.status}</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold">{invitation.tripTitle}</h1>
            <p className="mt-2 text-sm text-white/80">
              {invitation.destination} - {formatDateRange(invitation.startDate, invitation.endDate)}
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invitada a</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{invitation.email}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {invitation.invitedByName} te ha invitado a unirte al viaje. Para proteger la privacidad del grupo, el
              acceso solo se activa con la misma cuenta de email invitada.
            </p>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Inicia sesion o crea tu cuenta con <strong>{invitation.email}</strong> para aceptar la invitacion.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={loginTarget}>
                  <Button>Iniciar sesion</Button>
                </Link>
                <Link to={registerTarget}>
                  <Button variant="secondary">Crear cuenta</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {user && !invitation.viewerMatchesEmail ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Has iniciado sesion como <strong>{user.email}</strong>, pero la invitacion pertenece a{" "}
              <strong>{invitation.email}</strong>. Cierra sesion y entra con la cuenta correcta para continuar.
            </div>
          ) : null}

          {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

          <div className="flex flex-wrap gap-3">
            {canAccept ? (
              <Button onClick={() => void handleAcceptInvitation()} disabled={submitting}>
                {submitting ? "Uniendote al viaje..." : "Aceptar invitacion"}
              </Button>
            ) : null}
            {canOpenTrip ? (
              <Button onClick={() => navigate(`/trips/${invitation.tripId}/summary`)}>Entrar al viaje</Button>
            ) : null}
            <Button variant="secondary" onClick={() => void reload()}>
              Volver a comprobar
            </Button>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}
