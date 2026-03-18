import type { Expense, Settlement } from "./types";

export function buildSettlements(expenses: Expense[], userNames: Record<string, string>): Settlement[] {
  const balances = new Map<string, number>();

  for (const expense of expenses) {
    balances.set(expense.paidBy, (balances.get(expense.paidBy) ?? 0) + expense.amount);

    if (expense.splits && expense.splits.length > 0) {
      for (const split of expense.splits) {
        balances.set(split.userId, (balances.get(split.userId) ?? 0) - split.amount);
      }
      continue;
    }

    if (expense.splitBetween.length === 0) {
      continue;
    }

    const splitAmount = expense.amount / expense.splitBetween.length;

    for (const participantId of expense.splitBetween) {
      balances.set(participantId, (balances.get(participantId) ?? 0) - splitAmount);
    }
  }

  const creditors = [...balances.entries()]
    .filter(([, balance]) => balance > 0.01)
    .map(([userId, balance]) => ({ userId, balance }));
  const debtors = [...balances.entries()]
    .filter(([, balance]) => balance < -0.01)
    .map(([userId, balance]) => ({ userId, balance: Math.abs(balance) }));

  const settlements: Settlement[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Number(Math.min(creditor.balance, debtor.balance).toFixed(2));

    settlements.push({
      fromUserId: debtor.userId,
      fromName: userNames[debtor.userId] ?? debtor.userId,
      toUserId: creditor.userId,
      toName: userNames[creditor.userId] ?? creditor.userId,
      amount,
      status: "pending",
      reason: "Balance neto del viaje"
    });

    creditor.balance -= amount;
    debtor.balance -= amount;

    if (creditor.balance <= 0.01) {
      creditorIndex += 1;
    }

    if (debtor.balance <= 0.01) {
      debtorIndex += 1;
    }
  }

  return settlements;
}
