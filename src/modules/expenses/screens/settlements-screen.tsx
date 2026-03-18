import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { formatCurrency } from "../../../lib/utils";
import { useTripMembers, useTripPermission } from "../../trips/data/use-trips-data";
import { useExpenses } from "../data/use-expenses-data";
import { buildSettlements } from "../domain/settlements";

export function SettlementsScreen() {
  const { tripId } = useParams();
  const { members, loading: membersLoading } = useTripMembers(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const userNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const { expenses, loading, error, totalAmount, reload } = useExpenses(tripId, userNames);
  const settlements = useMemo(() => buildSettlements(expenses, userNames), [expenses, userNames]);

  if (loading || membersLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando liquidacion...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido calcular la liquidacion" description={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Liquidacion"
        description="Ya calculamos saldos reales desde gastos y splits. El marcado como saldado y el cierre final llegan en M9."
        action={
          <Button variant="secondary" disabled>
            {isAdmin ? "Cierre disponible en M9" : "Solo admin en M9"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Gastos registrados</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{expenses.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Importe total</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Movimientos netos</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{settlements.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="space-y-4">
          {settlements.length === 0 ? (
            <EmptyState
              title="Aun no hay saldos pendientes"
              description="Cuando registres gastos compartidos, aqui veremos quien debe a quien y cuanto."
            />
          ) : (
            settlements.map((settlement) => (
              <div
                key={`${settlement.fromUserId}-${settlement.toUserId}`}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center dark:border-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {settlement.fromName} debe a {settlement.toName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{settlement.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-extrabold text-primary">{formatCurrency(settlement.amount)}</p>
                  <Button variant="secondary" disabled>
                    Disponible en M9
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
