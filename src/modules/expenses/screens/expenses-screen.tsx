import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/states/empty-state";
import { ErrorState } from "../../../components/states/error-state";
import { ExpenseTable } from "../../../components/trips/expense-table";
import { SectionHeader } from "../../../components/trips/section-header";
import { StatCard } from "../../../components/trips/stat-card";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { formatCurrency } from "../../../lib/utils";
import { useSession } from "../../../app/providers/session-provider";
import { useTripMembers, useTripPermission } from "../../trips/data/use-trips-data";
import { useExpenses } from "../data/use-expenses-data";
import { buildSettlements } from "../domain/settlements";
import type { Expense, ExpenseUpsertInput } from "../domain/types";

function formatExpenseDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(date));
}

function downloadExpensesCsv(expenses: Expense[]) {
  const rows = [
    ["Concepto", "Categoria", "Pagado por", "Fecha", "Importe", "Participantes", "Descripcion"].join(";"),
    ...expenses.map((expense) =>
      [
        expense.concept,
        expense.categoryLabel ?? expense.categoryId,
        expense.paidByName,
        formatExpenseDate(expense.date),
        expense.amount.toFixed(2),
        expense.splitBetween.length,
        expense.description ?? ""
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(";")
    )
  ].join("\n");

  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gastos-viajemos-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExpensesScreen() {
  const { tripId } = useParams();
  const { user } = useSession();
  const { members, loading: membersLoading } = useTripMembers(tripId);
  const { isAdmin } = useTripPermission(tripId);
  const userNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member.displayName])),
    [members]
  );
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active"),
    [members]
  );
  const { categories, expenses, totalAmount, loading, error, createExpense, updateExpense, deleteExpense, reload } = useExpenses(
    tripId,
    userNames
  );
  const settlements = useMemo(() => buildSettlements(expenses, userNames), [expenses, userNames]);
  const myBalance = useMemo(() => {
    if (!user) {
      return 0;
    }

    return settlements.reduce((balance, settlement) => {
      if (settlement.toUserId === user.id) {
        return balance + settlement.amount;
      }

      if (settlement.fromUserId === user.id) {
        return balance - settlement.amount;
      }

      return balance;
    }, 0);
  }, [settlements, user]);

  const [showForm, setShowForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseUpsertInput>({
    concept: "",
    categoryId: "cat-food",
    amount: 0,
    paidBy: "",
    date: new Date().toISOString().slice(0, 10),
    splitBetween: [],
    description: ""
  });

  useEffect(() => {
    if (!showForm && activeMembers.length > 0) {
      setForm((current) => ({
        ...current,
        paidBy: current.paidBy || user?.id || activeMembers[0].userId,
        splitBetween: current.splitBetween.length > 0 ? current.splitBetween : activeMembers.map((member) => member.userId)
      }));
    }
  }, [activeMembers, showForm, user?.id]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory = categoryFilter === "all" || expense.categoryId === categoryFilter;
      const matchesSearch =
        search.trim().length === 0 ||
        expense.concept.toLowerCase().includes(search.toLowerCase()) ||
        expense.paidByName.toLowerCase().includes(search.toLowerCase()) ||
        (expense.description ?? "").toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, expenses, search]);

  const latestReceipts = useMemo(
    () => filteredExpenses.filter((expense) => expense.receipt).slice(0, 4),
    [filteredExpenses]
  );

  function resetForm() {
    setEditingExpenseId(null);
    setShowForm(false);
    setReceiptFile(null);
    setSubmitting(false);
    setForm({
      concept: "",
      categoryId: categories[0]?.id ?? "cat-food",
      amount: 0,
      paidBy: user?.id ?? activeMembers[0]?.userId ?? "",
      date: new Date().toISOString().slice(0, 10),
      splitBetween: activeMembers.map((member) => member.userId),
      description: ""
    });
  }

  function startCreateFlow() {
    setActionError(null);
    setEditingExpenseId(null);
    setReceiptFile(null);
    setShowForm(true);
    setForm({
      concept: "",
      categoryId: categories[0]?.id ?? "cat-food",
      amount: 0,
      paidBy: user?.id ?? activeMembers[0]?.userId ?? "",
      date: new Date().toISOString().slice(0, 10),
      splitBetween: activeMembers.map((member) => member.userId),
      description: ""
    });
  }

  function startEditFlow(expense: Expense) {
    setActionError(null);
    setEditingExpenseId(expense.id);
    setReceiptFile(null);
    setShowForm(true);
    setForm({
      concept: expense.concept,
      categoryId: expense.categoryId,
      amount: expense.amount,
      paidBy: expense.paidBy,
      date: expense.date.slice(0, 10),
      splitBetween: expense.splitBetween,
      description: expense.description ?? ""
    });
  }

  function toggleSplitMember(userId: string) {
    setForm((current) => {
      const nextSplitBetween = current.splitBetween.includes(userId)
        ? current.splitBetween.filter((memberId) => memberId !== userId)
        : [...current.splitBetween, userId];

      return {
        ...current,
        splitBetween: nextSplitBetween
      };
    });
  }

  async function handleSaveExpense() {
    try {
      setSubmitting(true);
      setActionError(null);

      const payload: ExpenseUpsertInput = {
        ...form,
        concept: form.concept.trim(),
        description: form.description?.trim() || undefined,
        splitBetween: form.splitBetween
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload, receiptFile);
      } else {
        await createExpense(payload, receiptFile);
      }

      resetForm();
      await reload();
    } catch (expenseError) {
      setActionError(expenseError instanceof Error ? expenseError.message : "No se pudo guardar el gasto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    try {
      setActionError(null);
      await deleteExpense(expenseId);
    } catch (expenseError) {
      setActionError(expenseError instanceof Error ? expenseError.message : "No se pudo borrar el gasto.");
    }
  }

  if (loading || membersLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Cargando gastos...</div>;
  }

  if (error) {
    return <ErrorState title="No hemos podido cargar los gastos" description={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Gastos del viaje"
        description="Alta real con reparto entre participantes, ticket adjunto y exportacion basica para el MVP."
        action={<Button onClick={startCreateFlow}>{showForm ? "Nuevo gasto" : "Anadir gasto"}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total gastado" value={formatCurrency(totalAmount)} icon="payments" />
        <StatCard
          label="Tu saldo actual"
          value={`${myBalance >= 0 ? "+" : ""}${formatCurrency(myBalance)}`}
          icon="account_balance_wallet"
          hint={myBalance >= 0 ? "A tu favor" : "Pendiente"}
        />
        <StatCard
          label="Participantes"
          value={String(activeMembers.length)}
          icon="group"
          hint="Reparto personalizable por seleccion"
        />
      </div>

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      {showForm ? (
        <Card className="p-6">
          <SectionHeader
            title={editingExpenseId ? "Editar gasto" : "Nuevo gasto"}
            description="Por defecto repartimos entre todos los miembros activos, pero puedes excluir participantes."
            action={
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            }
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Concepto</p>
              <Input value={form.concept} onChange={(event) => setForm((current) => ({ ...current, concept: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Categoria</p>
              <select
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Importe</p>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: Number(event.target.value || 0)
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pagado por</p>
              <select
                value={form.paidBy}
                onChange={(event) => setForm((current) => ({ ...current, paidBy: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {activeMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fecha</p>
              <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ticket</p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {receiptFile ? receiptFile.name : editingExpenseId ? "Puedes adjuntar un ticket nuevo para reemplazar el actual." : "JPG, PNG o PDF."}
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Repartir entre</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeMembers.map((member) => {
                  const checked = form.splitBetween.includes(member.userId);

                  return (
                    <label
                      key={member.userId}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                        checked
                          ? "border-primary bg-primary/5 text-slate-900 dark:text-white"
                          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <span>{member.displayName}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSplitMember(member.userId)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descripcion</p>
              <textarea
                value={form.description ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => void handleSaveExpense()}
              disabled={
                submitting ||
                !form.concept.trim() ||
                !form.categoryId ||
                !form.paidBy ||
                !form.date ||
                form.amount <= 0 ||
                form.splitBetween.length === 0
              }
            >
              {submitting ? "Guardando..." : editingExpenseId ? "Actualizar gasto" : "Guardar gasto"}
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Filtros y exportacion" />
            <div className="mt-4 grid gap-3">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por concepto, pagador o descripcion" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => downloadExpensesCsv(filteredExpenses)} disabled={filteredExpenses.length === 0}>
                Exportar CSV
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Tickets recientes" description="Adjuntos guardados en Storage privado del viaje." />
            <div className="mt-4 space-y-3">
              {latestReceipts.length === 0 ? (
                <EmptyState title="Aun no hay tickets" description="Adjunta un ticket al crear o editar un gasto para tenerlo centralizado." />
              ) : (
                latestReceipts.map((expense) => (
                  <div key={expense.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white">{expense.concept}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{expense.receipt?.fileName}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {expense.receipt?.uploadedAt ? formatExpenseDate(expense.receipt.uploadedAt) : "Ticket adjuntado"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="Aun no hay gastos para mostrar"
              description="Registra el primer gasto del viaje o ajusta los filtros para ver resultados."
            />
          ) : (
            <>
              <ExpenseTable expenses={filteredExpenses} />
              <Card className="p-5">
                <SectionHeader title="Acciones rapidas" description="Edicion disponible para quien creo el gasto y para el admin del viaje." />
                <div className="mt-4 space-y-3">
                  {filteredExpenses.slice(0, 4).map((expense) => {
                    const canEdit = Boolean(user && (isAdmin || expense.createdBy === user.id));

                    return (
                      <div key={expense.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{expense.concept}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {expense.categoryLabel ?? expense.categoryId} · {formatCurrency(expense.amount)} · {expense.paidByName}
                          </p>
                        </div>
                        {canEdit ? (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => startEditFlow(expense)}>
                              Editar
                            </Button>
                            <Button variant="ghost" onClick={() => void handleDeleteExpense(expense.id)}>
                              Borrar
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
