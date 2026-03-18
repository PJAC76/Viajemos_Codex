import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../../../app/providers/session-provider";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { useTripMembers, useTripPermission } from "../../trips/data/use-trips-data";
import { useMessages } from "../data/use-messages-data";

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeStyle: "short",
    dateStyle: "short"
  }).format(new Date(date));
}

export function MessagesScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { members, loading: membersLoading } = useTripMembers(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const userNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const { messages, groupedCounts, loading, error, reload, createMessage, deleteMessage } = useMessages(tripId, userNames);

  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSendMessage() {
    const nextBody = body.trim();

    if (!nextBody) {
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      await createMessage({ body: nextBody });
      setBody("");
    } catch (messageError) {
      setActionError(messageError instanceof Error ? messageError.message : "No se pudo enviar el mensaje.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      setBusyMessageId(messageId);
      setActionError(null);
      await deleteMessage(messageId);
    } catch (messageError) {
      setActionError(messageError instanceof Error ? messageError.message : "No se pudo borrar el mensaje.");
    } finally {
      setBusyMessageId(null);
    }
  }

  if (loading || membersLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando mensajes...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar el chat del viaje" description={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Mensajes"
        description="Canal del viaje sincronizado en realtime para coordinar cambios, reservas y decisiones del grupo."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Mensajes totales" value={String(groupedCounts.total)} icon="chat" />
        <StatCard label="Tus mensajes" value={String(groupedCounts.mine)} icon="edit_square" />
        <StatCard label="Participantes activos" value={String(members.filter((member) => member.status === "active").length)} icon="group" />
      </div>

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="p-5">
          <SectionHeader title="Chat del viaje" description="Los nuevos mensajes aparecen en vivo para todos los miembros conectados." />
          <div className="mt-5 space-y-4">
            {messages.length === 0 ? (
              <EmptyState
                title="Aun no hay mensajes"
                description="Escribe el primer mensaje del viaje para empezar la coordinacion del grupo."
              />
            ) : (
              messages.map((message) => {
                const isMine = user?.id === message.authorId;
                const canDelete = Boolean(user && (isMine || isAdmin));

                return (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${
                      isMine
                        ? "border-primary/20 bg-primary/5"
                        : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{message.authorName}</p>
                          {isMine ? <Badge>Tu mensaje</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(message.createdAt)}</p>
                      </div>
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          onClick={() => void handleDeleteMessage(message.id)}
                          disabled={busyMessageId === message.id}
                        >
                          {busyMessageId === message.id ? "Borrando..." : "Borrar"}
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{message.body}</p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Escribir mensaje" description="Comparte cambios importantes, dudas o decisiones del grupo." />
            <div className="mt-4 space-y-3">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Escribe aqui el mensaje para el grupo..."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Realtime activo cuando el navegador esta conectado al viaje.</p>
                <Button onClick={() => void handleSendMessage()} disabled={submitting || body.trim().length === 0}>
                  {submitting ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Buenas practicas" />
            <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <p>Usa el chat para coordinar reservas, cambios de plan y recordatorios importantes.</p>
              <p>Los mensajes quedan visibles para todos los miembros del viaje.</p>
              <p>El admin puede moderar el canal borrando mensajes si hace falta.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
