import { expenses } from "../../../mocks/db";
import { ExpenseTable } from "../../../components/trips/expense-table";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { formatCurrency } from "../../../lib/utils";

export function ExpensesScreen() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Gastos del viaje"
        description="Alta rapida, reparto por defecto entre todos y base lista para tickets y filtros."
        action={<Button>Añadir gasto</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total gastado" value={formatCurrency(total)} icon="payments" />
        <StatCard label="Tu saldo actual" value="+125,50 €" icon="account_balance_wallet" hint="A tu favor" />
        <StatCard label="Participantes" value="4" icon="group" hint="Sincronizacion preparada para realtime" />
      </div>
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <SectionHeader title="Ajustando cuentas" />
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Elena te debe 26,00 €</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Taxi aeropuerto</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Javier debe a Alex 80,00 €</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cena compartida</p>
            </div>
          </div>
        </Card>
        <ExpenseTable expenses={expenses} />
      </div>
    </div>
  );
}
