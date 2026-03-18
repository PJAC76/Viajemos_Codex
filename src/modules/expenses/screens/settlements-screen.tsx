import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../../../app/providers/session-provider";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { formatCurrency } from "../../../lib/utils";
import { useTripMembers, useTripPermission } from "../../trips/data/use-trips-data";
import { useExpenses } from "../data/use-expenses-data";
import { useSettlements } from "../data/use-settlements-data";
import type { Settlement } from "../domain/types";

function formatDateTime(date?: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function canResolveSettlement(settlement: Settlement, currentUserId?: string, isAdmin = false) {
  if (!currentUserId) {
    return false;
  }

  return isAdmin || settlement.fromUserId === currentUserId || settlement.toUserId === currentUserId;
}

export function SettlementsScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { members, loading: membersLoading } = useTripMembers(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const userNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const { expenses, loading: expensesLoading, error: expensesError, totalAmount, reload: reloadExpenses } = useExpenses(tripId, userNames);
  const {
    trip,
    pendingSettlements,
    settledSettlements,
    pendingTotal,
    settledTotal,
    loading,
    error,
    reload,
    markAsSettled,
    closeTripSettlements
  } = useSettlements(tripId, userNames);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleMarkAsSettled(settlementId: string) {
    try {
      setBusyKey(settlementId);
      setActionError(null);
      await markAsSettled(settlementId);
    } catch (settlementError) {
      setActionError(settlementError instanceof Error ? settlementError.message : "No se pudo marcar la deuda como saldada.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCloseTripSettlements() {
    try {
      setBusyKey("close-trip-settlements");
      setActionError(null);
      await closeTripSettlements();
    } catch (settlementError) {
      setActionError(settlementError instanceof Error ? settlementError.message : "No se pudo cerrar la liquidacion del viaje.");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading || membersLoading || expensesLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando liquidacion...</div>;
  }

  if (error || expensesError) {
    return (
      <ErrorState
        title="No hemos podido cargar la liquidacion"
        description={error ?? expensesError ?? "Se produjo un problema inesperado."}
        onRetry={() => {
          void reload();
          void reloadExpenses();
        }}
      />
    );
  }

  const isClosed = trip?.settlementStatus === "closed";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Liquidacion"
        description="Saldos persistidos desde gastos reales, con marcado manual de pagos y cierre final por parte del admin."
        action={
          <Button
            variant="secondary"
            disabled={!isAdmin || isClosed || pendingSettlements.length > 0 || busyKey === "close-trip-settlements"}
            onClick={() => void handleCloseTripSettlements()}
          >
            {isClosed ? "Liquidacion cerrada" : busyKey === "close-trip-settlements" ? "Cerrando..." : "Cerrar liquidacion"}
          </Button>
        }
      />

      {isClosed ? (
        <Card className="border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Liquidacion final cerrada</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {trip?.settlementClosedAt
                  ? `Se cerro el ${formatDateTime(trip.settlementClosedAt)} y ya no se pueden anadir ni editar gastos.`
                  : "El viaje ya no admite mas cambios economicos."}
              </p>
            </div>
            <Badge className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              Cerrada
            </Badge>
          </div>
        </Card>
      ) : null}

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Gastos registrados</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{expenses.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Importe total</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pendiente</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{formatCurrency(pendingTotal)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pendingSettlements.length} movimientos activos</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ya saldado</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{formatCurrency(settledTotal)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{settledSettlements.length} pagos registrados</p>
        </Card>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="p-5">
          <SectionHeader
            title="Saldos pendientes"
            description="Cada deuda queda calculada con el balance neto del viaje y se actualiza al marcar pagos."
          />
          <div className="mt-4 space-y-4">
            {pendingSettlements.length === 0 ? (
              <EmptyState
                title={isClosed ? "No hay pagos pendientes" : "Todo el grupo esta cuadrado"}
                description={
                  isClosed
                    ? "La liquidacion quedo cerrada sin deudas pendientes."
                    : "Cuando registres gastos compartidos o quede deuda pendiente, aqui lo veremos."
                }
              />
            ) : (
              pendingSettlements.map((settlement) => {
                const canSettle = canResolveSettlement(settlement, user?.id, isAdmin);

                return (
                  <div
                    key={settlement.id ?? `${settlement.fromUserId}-${settlement.toUserId}`}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-800"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {settlement.fromName} debe a {settlement.toName}
                        </p>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          Pendiente
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{settlement.reason}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-extrabold text-primary">{formatCurrency(settlement.amount)}</p>
                      <Button
                        variant="secondary"
                        disabled={!settlement.id || !canSettle || isClosed || busyKey === settlement.id}
                        onClick={() => settlement.id && void handleMarkAsSettled(settlement.id)}
                      >
                        {busyKey === settlement.id ? "Guardando..." : "Marcar saldada"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader
              title="Historial"
              description="Registro de pagos ya compensados para mantener trazabilidad durante todo el viaje."
            />
            <div className="mt-4 space-y-3">
              {settledSettlements.length === 0 ? (
                <EmptyState
                  title="Sin pagos saldados todavia"
                  description="Cuando alguien compense una deuda, quedara registrado aqui con fecha de cierre."
                />
              ) : (
                settledSettlements.map((settlement) => (
                  <div
                    key={settlement.id ?? `${settlement.fromUserId}-${settlement.toUserId}-history`}
                    className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {settlement.fromName} pago a {settlement.toName}
                      </p>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Saldada
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{settlement.reason}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-extrabold text-emerald-600">{formatCurrency(settlement.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {settlement.settledAt ? `Registrada el ${formatDateTime(settlement.settledAt)}` : "Registrada manualmente"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Reglas del cierre" />
            <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <p>Solo el admin del viaje puede cerrar la liquidacion final.</p>
              <p>Mientras quede una deuda pendiente, el cierre final permanece bloqueado.</p>
              <p>Una vez cerrada la liquidacion, el viaje deja de admitir nuevos gastos o cambios economicos.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
