import { expenseCategories, expenses } from "../../../mocks/db";

export const expensesQueries = {
  listExpenses(tripId: string) {
    return expenses.filter((expense) => expense.tripId === tripId);
  },

  listCategories() {
    return expenseCategories;
  }
};
