import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { Expense, ExpenseCategory, ExpenseUpsertInput } from "../domain/types";
import { expensesQueries } from "./expenses-queries";

export function useExpenses(tripId?: string, userNames: Record<string, string> = {}) {
  const { user } = useSession();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setCategories([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextCategories, nextExpenses] = await Promise.all([
        expensesQueries.listCategories(),
        expensesQueries.listExpenses(tripId, userNames)
      ]);
      setCategories(nextCategories);
      setExpenses(nextExpenses);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudieron cargar los gastos del viaje.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, JSON.stringify(userNames)]);

  async function createExpense(input: ExpenseUpsertInput, receiptFile?: File | null) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa dentro del viaje para registrar un gasto.");
    }

    const expenseId = await expensesQueries.createExpense(tripId, user.id, input, receiptFile);
    await reload();
    return expenses.find((expense) => expense.id === expenseId) ?? expenseId;
  }

  async function updateExpense(expenseId: string, input: ExpenseUpsertInput, receiptFile?: File | null) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa dentro del viaje para editar un gasto.");
    }

    await expensesQueries.updateExpense(expenseId, tripId, user.id, input, receiptFile);
    await reload();
  }

  async function deleteExpense(expenseId: string) {
    if (!tripId) {
      throw new Error("Necesitamos un viaje activo para borrar el gasto.");
    }

    await expensesQueries.deleteExpense(expenseId, tripId);
    setExpenses((currentExpenses) => currentExpenses.filter((expense) => expense.id !== expenseId));
  }

  const totalAmount = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

  return {
    categories,
    expenses,
    totalAmount,
    loading,
    error,
    reload,
    createExpense,
    updateExpense,
    deleteExpense
  };
}
