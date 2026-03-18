import { documents, expenses, notifications, places, reservations, trips } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { Trip } from "../../trips/domain/types";
import { tripsQueries } from "../../trips/data/trips-queries";
import { settingsQueries } from "../../settings/data/settings-queries";
import { defaultUserSettings } from "../../settings/domain/types";
import type {
  ExploreDocumentItem,
  ExploreExpenseItem,
  ExploreReservationItem,
  ExploreSearchResult,
  ExploreSnapshot
} from "../domain/types";

function normalizeDocumentType(value: unknown): ExploreDocumentItem["documentType"] {
  return value === "pdf" || value === "image" ? value : "file";
}

function buildTripMap(userTrips: Trip[]) {
  return new Map(userTrips.map((trip) => [trip.id, trip]));
}

function buildSearchText(parts: Array<string | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}

function sortByDateDesc(left?: string, right?: string) {
  return (right ?? "").localeCompare(left ?? "");
}

function sortByDateAsc(left?: string, right?: string) {
  return (left ?? "").localeCompare(right ?? "");
}

function buildReservationItem(row: Record<string, unknown>, trip: Trip): ExploreReservationItem {
  return {
    id: String(row.id),
    tripId: trip.id,
    tripTitle: trip.title,
    title: typeof row.title === "string" ? row.title : "Reserva",
    status: row.status === "confirmed" || row.status === "cancelled" ? row.status : "pending",
    startAt: typeof row.start_at === "string" ? row.start_at : "",
    amount: typeof row.amount === "number" ? row.amount : undefined
  };
}

function buildExpenseItem(row: Record<string, unknown>, trip: Trip): ExploreExpenseItem {
  const expenseDate = typeof row.expense_date === "string" ? `${row.expense_date}T00:00:00.000Z` : "";

  return {
    id: String(row.id),
    tripId: trip.id,
    tripTitle: trip.title,
    concept: typeof row.concept === "string" ? row.concept : "Gasto",
    amount: typeof row.amount === "number" ? row.amount : 0,
    date: expenseDate || (typeof row.created_at === "string" ? row.created_at : "")
  };
}

function buildDocumentItem(row: Record<string, unknown>, trip: Trip): ExploreDocumentItem {
  return {
    id: String(row.id),
    tripId: trip.id,
    tripTitle: trip.title,
    title: typeof row.title === "string" ? row.title : "Documento",
    fileName: typeof row.file_name === "string" ? row.file_name : "archivo",
    documentType: normalizeDocumentType(row.document_type),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : typeof row.created_at === "string"
          ? row.created_at
          : ""
  };
}

function buildSearchResults(params: {
  userTrips: Trip[];
  placeRows: Array<Record<string, unknown>>;
  reservationRows: Array<Record<string, unknown>>;
  expenseRows: Array<Record<string, unknown>>;
  documentRows: Array<Record<string, unknown>>;
}) {
  const tripMap = buildTripMap(params.userTrips);
  const results: ExploreSearchResult[] = [];

  for (const trip of params.userTrips) {
    results.push({
      id: `trip-${trip.id}`,
      tripId: trip.id,
      tripTitle: trip.title,
      tripDestination: trip.destination,
      kind: "trip",
      title: trip.title,
      subtitle: trip.destination,
      description: trip.description,
      href: `/trips/${trip.id}/summary`,
      badge: "Viaje",
      icon: "travel_explore",
      dateLabel: trip.startDate,
      searchText: buildSearchText([trip.title, trip.destination, trip.description])
    });
  }

  for (const row of params.placeRows) {
    const trip = tripMap.get(String(row.trip_id));

    if (!trip) {
      continue;
    }

    const type = row.type === "hotel" ? "Hotel" : row.type === "restaurant" ? "Restaurante" : "Lugar";
    results.push({
      id: `place-${row.id}`,
      tripId: trip.id,
      tripTitle: trip.title,
      tripDestination: trip.destination,
      kind: "place",
      title: typeof row.name === "string" ? row.name : "Lugar",
      subtitle: typeof row.address === "string" ? row.address : trip.destination,
      description: typeof row.notes === "string" ? row.notes : undefined,
      href: `/trips/${trip.id}/places`,
      badge: type,
      icon: row.type === "hotel" ? "hotel" : row.type === "restaurant" ? "restaurant" : "place_item",
      searchText: buildSearchText([String(row.name ?? ""), String(row.address ?? ""), String(row.notes ?? ""), trip.title, trip.destination])
    });
  }

  for (const row of params.reservationRows) {
    const trip = tripMap.get(String(row.trip_id));

    if (!trip) {
      continue;
    }

    results.push({
      id: `reservation-${row.id}`,
      tripId: trip.id,
      tripTitle: trip.title,
      tripDestination: trip.destination,
      kind: "reservation",
      title: typeof row.title === "string" ? row.title : "Reserva",
      subtitle: typeof row.confirmation_code === "string" ? `Localizador ${row.confirmation_code}` : trip.destination,
      description: typeof row.notes === "string" ? row.notes : undefined,
      href: `/trips/${trip.id}/reservations`,
      badge: "Reserva",
      icon: "event_available",
      dateLabel: typeof row.start_at === "string" ? row.start_at : undefined,
      searchText: buildSearchText([
        String(row.title ?? ""),
        String(row.confirmation_code ?? ""),
        String(row.notes ?? ""),
        trip.title,
        trip.destination
      ])
    });
  }

  for (const row of params.expenseRows) {
    const trip = tripMap.get(String(row.trip_id));

    if (!trip) {
      continue;
    }

    results.push({
      id: `expense-${row.id}`,
      tripId: trip.id,
      tripTitle: trip.title,
      tripDestination: trip.destination,
      kind: "expense",
      title: typeof row.concept === "string" ? row.concept : "Gasto",
      subtitle:
        typeof row.amount === "number"
          ? `${row.amount.toFixed(2)} EUR`
          : "Movimiento economico",
      description: typeof row.description === "string" ? row.description : undefined,
      href: `/trips/${trip.id}/expenses`,
      badge: "Gasto",
      icon: "receipt_long",
      dateLabel: typeof row.expense_date === "string" ? row.expense_date : undefined,
      searchText: buildSearchText([
        String(row.concept ?? ""),
        String(row.description ?? ""),
        String(row.amount ?? ""),
        trip.title,
        trip.destination
      ])
    });
  }

  for (const row of params.documentRows) {
    const trip = tripMap.get(String(row.trip_id));

    if (!trip) {
      continue;
    }

    results.push({
      id: `document-${row.id}`,
      tripId: trip.id,
      tripTitle: trip.title,
      tripDestination: trip.destination,
      kind: "document",
      title: typeof row.title === "string" ? row.title : "Documento",
      subtitle: typeof row.file_name === "string" ? row.file_name : "Adjunto del viaje",
      description: typeof row.description === "string" ? row.description : undefined,
      href: `/trips/${trip.id}/documents`,
      badge: "Documento",
      icon: row.document_type === "image" ? "image" : row.document_type === "pdf" ? "picture_as_pdf" : "folder",
      dateLabel:
        typeof row.updated_at === "string"
          ? row.updated_at
          : typeof row.created_at === "string"
            ? row.created_at
            : undefined,
      searchText: buildSearchText([
        String(row.title ?? ""),
        String(row.file_name ?? ""),
        String(row.description ?? ""),
        trip.title,
        trip.destination
      ])
    });
  }

  return results;
}

function filterSearchResults(results: ExploreSearchResult[], query: string, tripFilter: string | "all") {
  const normalizedQuery = query.trim().toLowerCase();

  return results.filter((result) => {
    const matchesTrip = tripFilter === "all" || result.tripId === tripFilter;
    const matchesQuery = normalizedQuery.length === 0 || result.searchText.includes(normalizedQuery);
    return matchesTrip && matchesQuery;
  });
}

function buildSnapshotFromRows(params: {
  userTrips: Trip[];
  placeRows: Array<Record<string, unknown>>;
  favoriteRows: Array<Record<string, unknown>>;
  reservationRows: Array<Record<string, unknown>>;
  expenseRows: Array<Record<string, unknown>>;
  documentRows: Array<Record<string, unknown>>;
  unreadNotificationsCount: number;
  preferredMapMode: ExploreSnapshot["preferredMapMode"];
}) {
  const tripMap = buildTripMap(params.userTrips);
  const today = new Date().toISOString();
  const upcomingReservations = params.reservationRows
    .map((row) => {
      const trip = tripMap.get(String(row.trip_id));
      return trip ? buildReservationItem(row, trip) : null;
    })
    .filter((item): item is ExploreReservationItem => Boolean(item))
    .filter((item) => item.startAt >= today)
    .sort((left, right) => sortByDateAsc(left.startAt, right.startAt))
    .slice(0, 4);

  const recentExpenses = params.expenseRows
    .map((row) => {
      const trip = tripMap.get(String(row.trip_id));
      return trip ? buildExpenseItem(row, trip) : null;
    })
    .filter((item): item is ExploreExpenseItem => Boolean(item))
    .sort((left, right) => sortByDateDesc(left.date, right.date))
    .slice(0, 4);

  const recentDocuments = params.documentRows
    .map((row) => {
      const trip = tripMap.get(String(row.trip_id));
      return trip ? buildDocumentItem(row, trip) : null;
    })
    .filter((item): item is ExploreDocumentItem => Boolean(item))
    .sort((left, right) => sortByDateDesc(left.updatedAt, right.updatedAt))
    .slice(0, 4);

  return {
    activeTripsCount: params.userTrips.length,
    favoritePlacesCount: new Set(params.favoriteRows.map((row) => String(row.place_id))).size,
    upcomingReservationsCount: upcomingReservations.length,
    unreadNotificationsCount: params.unreadNotificationsCount,
    preferredMapMode: params.preferredMapMode,
    availableTrips: params.userTrips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      destination: trip.destination
    })),
    quickTrips: params.userTrips.slice(0, 3).map((trip) => ({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      coverImage: trip.coverImage,
      startDate: trip.startDate,
      endDate: trip.endDate
    })),
    upcomingReservations,
    recentExpenses,
    recentDocuments,
    searchResults: buildSearchResults(params)
  } satisfies ExploreSnapshot;
}

async function listRowsForTripIds(userId: string, tripIds: string[]) {
  const insforge = getInsforgeClient();

  if (!insforge) {
    return {
      placeRows: places.filter((place) => tripIds.includes(place.tripId)).map((place) => ({
        id: place.id,
        trip_id: place.tripId,
        type: place.type,
        name: place.name,
        address: place.address,
        notes: place.notes
      })),
      favoriteRows: places
        .filter((place) => tripIds.includes(place.tripId) && place.favorite)
        .map((place) => ({ place_id: place.id })),
      reservationRows: reservations.filter((reservation) => tripIds.includes(reservation.tripId)).map((reservation) => ({
        id: reservation.id,
        trip_id: reservation.tripId,
        title: reservation.title,
        confirmation_code: reservation.confirmationCode,
        start_at: reservation.startAt,
        status: reservation.status,
        amount: reservation.amount,
        notes: reservation.notes
      })),
      expenseRows: expenses.filter((expense) => tripIds.includes(expense.tripId)).map((expense) => ({
        id: expense.id,
        trip_id: expense.tripId,
        concept: expense.concept,
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.date.slice(0, 10),
        created_at: expense.createdAt
      })),
      documentRows: documents.filter((document) => tripIds.includes(document.tripId)).map((document) => ({
        id: document.id,
        trip_id: document.tripId,
        title: document.title,
        description: document.description,
        file_name: document.fileName,
        document_type: document.type,
        updated_at: document.updatedAt,
        created_at: document.createdAt
      })),
      unreadNotificationsCount: notifications.filter((notification) => notification.userId === userId && !notification.isRead).length
    };
  }

  const [placesResult, favoritesResult, reservationsResult, expensesResult, documentsResult, notificationsResult] = await Promise.all([
    insforge.database.from("places").select("id, trip_id, type, name, address, notes").in("trip_id", tripIds),
    insforge.database.from("place_favorites").select("place_id").in("trip_id", tripIds),
    insforge.database
      .from("reservations")
      .select("id, trip_id, title, confirmation_code, start_at, status, amount, notes")
      .in("trip_id", tripIds),
    insforge.database
      .from("expenses")
      .select("id, trip_id, concept, amount, description, expense_date, created_at")
      .in("trip_id", tripIds),
    insforge.database
      .from("documents")
      .select("id, trip_id, title, description, file_name, document_type, updated_at, created_at")
      .in("trip_id", tripIds),
    insforge.database.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false)
  ]);

  if (placesResult.error) {
    throw new Error(placesResult.error.message ?? "No se pudieron cargar los lugares para explorar.");
  }

  if (favoritesResult.error) {
    throw new Error(favoritesResult.error.message ?? "No se pudieron cargar los favoritos para explorar.");
  }

  if (reservationsResult.error) {
    throw new Error(reservationsResult.error.message ?? "No se pudieron cargar las reservas para explorar.");
  }

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message ?? "No se pudieron cargar los gastos para explorar.");
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message ?? "No se pudieron cargar los documentos para explorar.");
  }

  if (notificationsResult.error) {
    throw new Error(notificationsResult.error.message ?? "No se pudieron cargar las notificaciones para explorar.");
  }

  return {
    placeRows: (placesResult.data as Array<Record<string, unknown>> | null) ?? [],
    favoriteRows: (favoritesResult.data as Array<Record<string, unknown>> | null) ?? [],
    reservationRows: (reservationsResult.data as Array<Record<string, unknown>> | null) ?? [],
    expenseRows: (expensesResult.data as Array<Record<string, unknown>> | null) ?? [],
    documentRows: (documentsResult.data as Array<Record<string, unknown>> | null) ?? [],
    unreadNotificationsCount: notificationsResult.count ?? 0
  };
}

export const exploreQueries = {
  async getExploreSnapshot(userId: string) {
    const userTrips = await tripsQueries.listTrips(userId);
    const currentSettings = (await settingsQueries.getCurrentSettings(userId)) ?? {
      userId,
      ...defaultUserSettings
    };

    if (userTrips.length === 0) {
      return {
        activeTripsCount: 0,
        favoritePlacesCount: 0,
        upcomingReservationsCount: 0,
        unreadNotificationsCount: 0,
        preferredMapMode: currentSettings.defaultMapMode,
        availableTrips: [],
        quickTrips: [],
        upcomingReservations: [],
        recentExpenses: [],
        recentDocuments: [],
        searchResults: []
      } satisfies ExploreSnapshot;
    }

    const tripIds = userTrips.map((trip) => trip.id);
    const rows = await listRowsForTripIds(userId, tripIds);
    return buildSnapshotFromRows({
      userTrips,
      placeRows: rows.placeRows,
      favoriteRows: rows.favoriteRows,
      reservationRows: rows.reservationRows,
      expenseRows: rows.expenseRows,
      documentRows: rows.documentRows,
      unreadNotificationsCount: rows.unreadNotificationsCount,
      preferredMapMode: currentSettings.defaultMapMode
    });
  },

  filterSearchResults
};
