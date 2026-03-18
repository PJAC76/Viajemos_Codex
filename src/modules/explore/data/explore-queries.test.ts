import { describe, expect, it } from "vitest";
import { exploreQueries } from "./explore-queries";

describe("exploreQueries.filterSearchResults", () => {
  const results = [
    {
      id: "trip-1",
      kind: "trip" as const,
      title: "Aventura en Tokio",
      subtitle: "Tokio, Japon",
      href: "/trips/trip-tokyo/summary",
      badge: "Viaje",
      icon: "travel_explore",
      tripId: "trip-tokyo",
      searchText: "aventura tokio japon"
    },
    {
      id: "expense-1",
      kind: "expense" as const,
      title: "Taxi aeropuerto",
      subtitle: "84.00 EUR",
      href: "/trips/trip-tokyo/expenses",
      badge: "Gasto",
      icon: "receipt_long",
      tripId: "trip-tokyo",
      searchText: "taxi aeropuerto 84 tokio"
    },
    {
      id: "document-1",
      kind: "document" as const,
      title: "Seguro de viaje",
      subtitle: "seguro-viaje.pdf",
      href: "/trips/trip-porto/documents",
      badge: "Documento",
      icon: "picture_as_pdf",
      tripId: "trip-porto",
      searchText: "seguro viaje porto pdf"
    }
  ];

  it("filters search results by query ignoring case", () => {
    const filtered = exploreQueries.filterSearchResults(results, "TAXI", "all");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("expense-1");
  });

  it("filters search results by trip when requested", () => {
    const filtered = exploreQueries.filterSearchResults(results, "", "trip-porto");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("document-1");
  });
});
