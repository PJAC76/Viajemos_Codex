import { formatCurrency } from "../../lib/utils";
import type { Expense } from "../../modules/expenses/domain/types";
import { Card } from "../ui/card";

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {["Concepto", "Pagado por", "Fecha", "Importe"].map((heading) => (
                <th key={heading} className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{expense.concept}</td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>{expense.paidByName}</p>
                  <p className="mt-1 text-xs text-slate-400">{expense.categoryLabel ?? expense.categoryId}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(expense.date))}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {expenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{expense.concept}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pagado por {expense.paidByName}</p>
                  <p className="mt-1 text-xs text-slate-400">{expense.categoryLabel ?? expense.categoryId}</p>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
              </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
