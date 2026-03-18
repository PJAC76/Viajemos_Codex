import { expenseCategories, expenses } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import { storageService } from "../../../services/storage-service";
import type {
  Expense,
  ExpenseCategory,
  ExpenseReceipt,
  ExpenseSplit,
  ExpenseUpsertInput
} from "../domain/types";

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function normalizeExpenseCategory(row: Record<string, unknown>): ExpenseCategory {
  return {
    id: String(row.id),
    label: typeof row.label === "string" ? row.label : "Categoria",
    icon: typeof row.icon === "string" ? row.icon : "receipt_long",
    position: typeof row.position === "number" ? row.position : 1
  };
}

function normalizeExpenseSplit(row: Record<string, unknown>): ExpenseSplit {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    expenseId: String(row.expense_id),
    userId: String(row.user_id),
    amount: Number(toNumber(row.amount).toFixed(2)),
    status: row.status === "settled" ? "settled" : "pending"
  };
}

function normalizeExpenseReceipt(row: Record<string, unknown>): ExpenseReceipt {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    expenseId: String(row.expense_id),
    bucketName: typeof row.bucket_name === "string" ? row.bucket_name : "attachments-private",
    storageKey: typeof row.storage_key === "string" ? row.storage_key : "",
    fileName: typeof row.file_name === "string" ? row.file_name : "ticket",
    mimeType: typeof row.mime_type === "string" ? row.mime_type : undefined,
    fileSize: toNumber(row.file_size),
    uploadedBy: typeof row.uploaded_by === "string" ? row.uploaded_by : "",
    uploadedAt: typeof row.created_at === "string" ? row.created_at : undefined,
    fileUrl: typeof row.file_url === "string" ? row.file_url : undefined
  };
}

function normalizeExpense(
  row: Record<string, unknown>,
  categoriesMap: Map<string, ExpenseCategory>,
  receiptsByExpenseId: Map<string, ExpenseReceipt>,
  splitsByExpenseId: Map<string, ExpenseSplit[]>,
  userNames: Record<string, string>
): Expense {
  const expenseId = String(row.id);
  const paidBy = String(row.paid_by);
  const splits = splitsByExpenseId.get(expenseId) ?? [];
  const categoryId = typeof row.category_id === "string" ? row.category_id : "cat-other";

  return {
    id: expenseId,
    tripId: String(row.trip_id),
    concept: typeof row.concept === "string" ? row.concept : "Gasto",
    categoryId,
    categoryLabel: categoriesMap.get(categoryId)?.label,
    amount: Number(toNumber(row.amount).toFixed(2)),
    paidBy,
    paidByName: userNames[paidBy] ?? paidBy,
    date: typeof row.expense_date === "string" ? `${row.expense_date}T00:00:00.000Z` : "",
    splitBetween: splits.map((split) => split.userId),
    description: typeof row.description === "string" ? row.description : undefined,
    createdBy: typeof row.created_by === "string" ? row.created_by : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    splits,
    receipt: receiptsByExpenseId.get(expenseId) ?? null
  };
}

async function getExpenseRows(tripId: string) {
  const insforge = getInsforgeClient();

  if (!insforge) {
    return null;
  }

  const [expensesResult, splitsResult, receiptsResult, categoriesResult] = await Promise.all([
    insforge.database.from("expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false }),
    insforge.database.from("expense_splits").select("*").eq("trip_id", tripId),
    insforge.database.from("expense_receipts").select("*").eq("trip_id", tripId),
    insforge.database.from("expense_categories").select("*").order("position", { ascending: true })
  ]);

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message ?? "No se pudieron cargar los gastos.");
  }

  if (splitsResult.error) {
    throw new Error(splitsResult.error.message ?? "No se pudieron cargar los repartos de gastos.");
  }

  if (receiptsResult.error) {
    throw new Error(receiptsResult.error.message ?? "No se pudieron cargar los tickets del viaje.");
  }

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message ?? "No se pudieron cargar las categorias de gasto.");
  }

  return {
    expenseRows: (expensesResult.data as Array<Record<string, unknown>> | null) ?? [],
    splitRows: (splitsResult.data as Array<Record<string, unknown>> | null) ?? [],
    receiptRows: (receiptsResult.data as Array<Record<string, unknown>> | null) ?? [],
    categoryRows: (categoriesResult.data as Array<Record<string, unknown>> | null) ?? []
  };
}

async function upsertExpenseReceipt(tripId: string, expenseId: string, userId: string, receiptFile?: File | null) {
  const insforge = getInsforgeClient();

  if (!receiptFile || !insforge) {
    return;
  }

  const existingReceiptResult = await insforge.database
    .from("expense_receipts")
    .select("*")
    .eq("expense_id", expenseId)
    .maybeSingle();

  if (existingReceiptResult.error) {
    throw new Error(existingReceiptResult.error.message ?? "No se pudo revisar el ticket actual del gasto.");
  }

  const existingReceipt = existingReceiptResult.data as Record<string, unknown> | null;

  if (existingReceipt && typeof existingReceipt.storage_key === "string") {
    await storageService.deleteTripFile(existingReceipt.storage_key);
  }

  const uploadedFile = await storageService.uploadTripFile(
    tripId,
    `expenses/${expenseId}/${Date.now()}-${sanitizeFileName(receiptFile.name)}`,
    receiptFile
  );

  const payload = {
    trip_id: tripId,
    expense_id: expenseId,
    bucket_name: uploadedFile.bucketName,
    storage_key: uploadedFile.path,
    file_name: receiptFile.name,
    mime_type: receiptFile.type || uploadedFile.mimeType || null,
    file_size: typeof uploadedFile.size === "number" ? uploadedFile.size : receiptFile.size,
    file_url: uploadedFile.publicUrl || null,
    uploaded_by: userId
  };

  if (existingReceipt) {
    const { error } = await insforge.database
      .from("expense_receipts")
      .update(payload)
      .eq("expense_id", expenseId);

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el ticket del gasto.");
    }

    return;
  }

  const { error } = await insforge.database.from("expense_receipts").insert([payload]);

  if (error) {
    throw new Error(error.message ?? "No se pudo guardar el ticket del gasto.");
  }
}

export const expensesQueries = {
  async listCategories() {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return expenseCategories.slice().sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
    }

    const { data, error } = await insforge.database.from("expense_categories").select("*").order("position", { ascending: true });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar las categorias de gasto.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeExpenseCategory);
  },

  async listExpenses(tripId: string, userNames: Record<string, string> = {}) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return expenses.filter((expense) => expense.tripId === tripId);
    }

    const rows = await getExpenseRows(tripId);

    if (!rows) {
      return [];
    }

    const categoriesMap = new Map(rows.categoryRows.map((row) => {
      const category = normalizeExpenseCategory(row);
      return [category.id, category] as const;
    }));
    const receiptsByExpenseId = new Map(
      rows.receiptRows.map((row) => {
        const receipt = normalizeExpenseReceipt(row);
        return [receipt.expenseId, receipt] as const;
      })
    );
    const splitsByExpenseId = new Map<string, ExpenseSplit[]>();

    for (const row of rows.splitRows) {
      const split = normalizeExpenseSplit(row);
      splitsByExpenseId.set(split.expenseId, [...(splitsByExpenseId.get(split.expenseId) ?? []), split]);
    }

    return rows.expenseRows.map((row) =>
      normalizeExpense(row, categoriesMap, receiptsByExpenseId, splitsByExpenseId, userNames)
    );
  },

  async createExpense(tripId: string, userId: string, input: ExpenseUpsertInput, receiptFile?: File | null) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const nextExpense: Expense = {
        id: `expense-${crypto.randomUUID()}`,
        tripId,
        concept: input.concept,
        categoryId: input.categoryId,
        amount: input.amount,
        paidBy: input.paidBy,
        paidByName: input.paidBy,
        date: `${input.date}T00:00:00.000Z`,
        splitBetween: input.splitBetween,
        description: input.description,
        createdBy: userId
      };
      expenses.unshift(nextExpense);
      return nextExpense;
    }

    const { data, error } = await insforge.database.rpc("create_expense_with_splits", {
      target_trip_id: tripId,
      expense_concept: input.concept,
      expense_category_id: input.categoryId,
      expense_amount: input.amount,
      expense_paid_by: input.paidBy,
      expense_date: input.date,
      expense_description: input.description ?? null,
      split_user_ids: input.splitBetween
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo guardar el gasto.");
    }

    const expenseId = Array.isArray(data) ? (data[0] as string | undefined) : (data as string | null);

    if (!expenseId) {
      throw new Error("El gasto se guardo, pero no pudimos recuperar su identificador.");
    }

    await upsertExpenseReceipt(tripId, expenseId, userId, receiptFile);

    return expenseId;
  },

  async updateExpense(expenseId: string, tripId: string, userId: string, input: ExpenseUpsertInput, receiptFile?: File | null) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const currentExpense = expenses.find((expense) => expense.id === expenseId);

      if (!currentExpense) {
        return null;
      }

      Object.assign(currentExpense, {
        concept: input.concept,
        categoryId: input.categoryId,
        amount: input.amount,
        paidBy: input.paidBy,
        paidByName: input.paidBy,
        date: `${input.date}T00:00:00.000Z`,
        splitBetween: input.splitBetween,
        description: input.description
      });

      return currentExpense;
    }

    const { data, error } = await insforge.database.rpc("update_expense_with_splits", {
      target_expense_id: expenseId,
      expense_concept: input.concept,
      expense_category_id: input.categoryId,
      expense_amount: input.amount,
      expense_paid_by: input.paidBy,
      expense_date: input.date,
      expense_description: input.description ?? null,
      split_user_ids: input.splitBetween
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el gasto.");
    }

    const updatedExpenseId = Array.isArray(data) ? (data[0] as string | undefined) : (data as string | null);

    if (!updatedExpenseId) {
      throw new Error("El gasto se actualizo, pero no pudimos refrescarlo.");
    }

    await upsertExpenseReceipt(tripId, updatedExpenseId, userId, receiptFile);

    return updatedExpenseId;
  },

  async deleteExpense(expenseId: string, tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const index = expenses.findIndex((expense) => expense.id === expenseId);

      if (index >= 0) {
        expenses.splice(index, 1);
      }

      return;
    }

    const receiptResult = await insforge.database
      .from("expense_receipts")
      .select("storage_key")
      .eq("expense_id", expenseId)
      .maybeSingle();

    if (receiptResult.error) {
      throw new Error(receiptResult.error.message ?? "No se pudo revisar el ticket del gasto.");
    }

    const storageKey =
      receiptResult.data && typeof (receiptResult.data as Record<string, unknown>).storage_key === "string"
        ? String((receiptResult.data as Record<string, unknown>).storage_key)
        : undefined;

    if (storageKey) {
      await storageService.deleteTripFile(storageKey);
    }

    const { error } = await insforge.database.from("expenses").delete().eq("id", expenseId).eq("trip_id", tripId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el gasto.");
    }
  }
};
