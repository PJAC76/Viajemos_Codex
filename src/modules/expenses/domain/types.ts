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

export interface Settlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  status: "pending" | "settled";
  reason: string;
}
