export interface ExpenseCategory {
  id: string;
  label: string;
  icon: string;
  position?: number;
}

export interface ExpenseReceipt {
  id: string;
  tripId: string;
  expenseId: string;
  bucketName: string;
  storageKey: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  fileHash?: string;
  uploadedBy: string;
  uploadedAt?: string;
  fileUrl?: string;
}

export interface ExpenseSplit {
  id: string;
  tripId: string;
  expenseId: string;
  userId: string;
  amount: number;
  status: "pending" | "settled";
}

export interface Expense {
  id: string;
  tripId: string;
  concept: string;
  categoryId: string;
  categoryLabel?: string;
  amount: number;
  paidBy: string;
  paidByName: string;
  date: string;
  splitBetween: string[];
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  splits?: ExpenseSplit[];
  receipt?: ExpenseReceipt | null;
}

export interface ExpenseUpsertInput {
  concept: string;
  categoryId: string;
  amount: number;
  paidBy: string;
  date: string;
  splitBetween: string[];
  description?: string;
}

export type SettlementStatus = "pending" | "settled";

export interface Settlement {
  id?: string;
  tripId?: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  status: SettlementStatus;
  reason: string;
  currency?: "EUR";
  createdAt?: string;
  updatedAt?: string;
  settledAt?: string;
  settledBy?: string;
}
