import { describe, expect, it } from "vitest";
import { buildSettlements } from "./settlements";
import type { Expense } from "./types";

describe("buildSettlements", () => {
  it("produces net balances from shared expenses", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        tripId: "trip",
        concept: "Dinner",
        categoryId: "food",
        amount: 120,
        paidBy: "alex",
        paidByName: "Alex",
        date: "2026-10-10T20:00:00.000Z",
        splitBetween: ["alex", "elena", "javier"]
      }
    ];

    const settlements = buildSettlements(expenses, {
      alex: "Alex",
      elena: "Elena",
      javier: "Javier"
    });

    expect(settlements).toHaveLength(2);
    expect(settlements[0].toName).toBe("Alex");
    expect(settlements[0].amount).toBe(40);
  });
});
