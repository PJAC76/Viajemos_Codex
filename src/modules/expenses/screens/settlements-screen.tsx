import { tripMembers } from "../../../mocks/db";
import { expensesQueries } from "../../../modules/expenses/data/expenses-queries";
import { buildSettlements } from "../../../modules/expenses/domain/settlements";
import { SectionHeader } from "../../../components/trips/section-header";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function SettlementsScreen() {
  const expenseItems = expensesQueries.listExpenses("trip-tokyo");
  const userNames = Object.fromEntries(tripMembers.map((member) => [member.userId, member.displayName]));
  const settlements = buildSettlements(expenseItems, userNames);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Liquidacion"
        description="Calculo neto de quien debe a quien y preparacion para cierre final por parte del admin."
        action={<Button>Cerrar liquidacion</Button>}
      />
      <Card className="p-5">
        <div className="space-y-4">
          {settlements.map((settlement) => (
            <div key={`${settlement.fromUserId}-${settlement.toUserId}`} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {settlement.fromName} debe a {settlement.toName}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{settlement.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-extrabold text-primary">{settlement.amount.toFixed(2)} €</p>
                <Button variant="secondary">Marcar saldada</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
