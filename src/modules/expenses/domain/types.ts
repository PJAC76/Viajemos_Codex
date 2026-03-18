export interface ExpenseCategory {
  id: string;
  label: string;
  icon: string;
}

export interface Expense {
  id: string;
  tripId: string;
  concept: string;
  categoryId: string;
  amount: number;
  paidBy: string;
  paidByName: string;
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
