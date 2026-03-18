import type { AuthUser } from "../modules/auth/domain/types";
import type { Expense, ExpenseCategory, Settlement } from "../modules/expenses/domain/types";
import type { ItineraryDay, ItineraryItem, RouteSnapshot } from "../modules/itinerary/domain/types";
import type { TripDocument } from "../modules/documents/domain/types";
import type { TripMessage } from "../modules/messages/domain/types";
import type { AppNotification } from "../modules/notifications/domain/types";
import type { Place, Reservation } from "../modules/places/domain/types";
import type { UserSettings } from "../modules/settings/domain/types";
import type { Trip, TripInvitation, TripMember } from "../modules/trips/domain/types";

export const mockUser: AuthUser = {
  id: "user-alex",
  email: "alex@viajemos.app",
  displayName: "Alex Garcia",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  provider: "demo"
};

export const trips: Trip[] = [
  {
    id: "trip-tokyo",
    title: "Aventura en Tokio",
    destination: "Tokio, Japon",
    description: "Diez dias para mezclar barrios iconicos, gastronomia y cultura.",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=80",
    startDate: "2026-10-15",
    endDate: "2026-10-25",
    currency: "EUR",
    status: "active",
    settlementStatus: "open",
    createdBy: mockUser.id
  }
];

export const tripMembers: TripMember[] = [
  {
    id: "member-1",
    tripId: "trip-tokyo",
    userId: mockUser.id,
    displayName: "Alex Garcia",
    email: mockUser.email,
    avatarUrl: mockUser.avatarUrl ?? "",
    role: "admin",
    status: "active"
  },
  {
    id: "member-2",
    tripId: "trip-tokyo",
    userId: "user-elena",
    displayName: "Elena Martinez",
    email: "elena@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    role: "member",
    status: "active"
  },
  {
    id: "member-3",
    tripId: "trip-tokyo",
    userId: "user-javier",
    displayName: "Javier Ruiz",
    email: "javier@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    role: "member",
    status: "active"
  },
  {
    id: "member-4",
    tripId: "trip-tokyo",
    userId: "user-lucia",
    displayName: "Lucia Torres",
    email: "lucia@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    role: "member",
    status: "active"
  }
];

export const tripInvitations: TripInvitation[] = [
  {
    id: "invite-1",
    tripId: "trip-tokyo",
    email: "carlos@example.com",
    status: "pending",
    invitedBy: mockUser.id,
    shareUrl: "https://viajemos.app/invite/tokyo-demo-token"
  }
];

export const places: Place[] = [
  {
    id: "place-hotel",
    tripId: "trip-tokyo",
    type: "hotel",
    name: "Shibuya Sky Hotel",
    address: "1-2-3 Shibuya, Tokyo",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
    phone: "+81 03 1234 5678",
    website: "https://example.com/hotel",
    notes: "Check-in con vista a Shibuya Crossing.",
    createdBy: mockUser.id,
    favorite: true,
    favoriteCount: 2
  },
  {
    id: "place-restaurant",
    tripId: "trip-tokyo",
    type: "restaurant",
    name: "Sukiyabashi Jiro",
    address: "Ginza, Tokyo",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
    phone: "+81 03 9876 5432",
    website: "https://example.com/jiro",
    notes: "Cena especial del viaje.",
    createdBy: "user-elena",
    favorite: true,
    favoriteCount: 3
  },
  {
    id: "place-sensoji",
    tripId: "trip-tokyo",
    type: "place",
    name: "Templo Senso-ji",
    address: "Asakusa, Taito City",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80",
    notes: "Primera parada cultural.",
    createdBy: "user-javier",
    favorite: false,
    favoriteCount: 0
  }
];

export const reservations: Reservation[] = [
  {
    id: "reservation-hotel",
    tripId: "trip-tokyo",
    placeId: "place-hotel",
    kind: "hotel",
    title: "Shibuya Sky Hotel",
    confirmationCode: "TOK-88210",
    startAt: "2026-10-15T15:00:00.000Z",
    endAt: "2026-10-25T11:00:00.000Z",
    status: "confirmed",
    partySize: 4,
    roomOrTableCount: 2,
    amount: 1840,
    currency: "EUR",
    cancellationPolicy: "Cancelacion gratuita hasta 72 horas antes de la llegada.",
    phone: "+81 03 1234 5678",
    email: "booking@shibuyaskyhotel.jp",
    bookingUrl: "https://example.com/hotel-booking",
    notes: "Dos habitaciones dobles.",
    createdBy: mockUser.id
  },
  {
    id: "reservation-dinner",
    tripId: "trip-tokyo",
    placeId: "place-restaurant",
    kind: "restaurant",
    title: "Sukiyabashi Jiro",
    confirmationCode: "DIN-4432",
    startAt: "2026-10-18T19:30:00.000Z",
    status: "confirmed",
    partySize: 4,
    roomOrTableCount: 1,
    amount: 320,
    currency: "EUR",
    cancellationPolicy: "Cancelacion hasta 24 horas antes.",
    phone: "+81 03 9876 5432",
    email: "reservas@jiro.jp",
    bookingUrl: "https://example.com/jiro-booking",
    notes: "Menu degustacion.",
    createdBy: mockUser.id
  }
];

export const itineraryDays: ItineraryDay[] = [
  { id: "day-1", tripId: "trip-tokyo", date: "2026-10-15", label: "Dia 1", position: 1 },
  { id: "day-2", tripId: "trip-tokyo", date: "2026-10-16", label: "Dia 2", position: 2 },
  { id: "day-3", tripId: "trip-tokyo", date: "2026-10-17", label: "Dia 3", position: 3 }
];

export const itineraryItems: ItineraryItem[] = [
  {
    id: "item-1",
    tripId: "trip-tokyo",
    dayId: "day-1",
    type: "linked_place",
    title: "Llegada al hotel",
    startTime: "08:30",
    address: "Shibuya Sky Hotel",
    notes: "Check-in y dejar maletas.",
    placeId: "place-hotel",
    order: 1,
    createdBy: mockUser.id,
    transitLabel: "15 min en tren hacia la siguiente parada",
    icon: "hotel"
  },
  {
    id: "item-2",
    tripId: "trip-tokyo",
    dayId: "day-1",
    type: "linked_place",
    title: "Templo Senso-ji",
    startTime: "10:00",
    address: "Asakusa, Taito City",
    notes: "Foto grupal y paseo por Nakamise.",
    placeId: "place-sensoji",
    order: 2,
    createdBy: "user-elena",
    transitLabel: "20 min a pie hacia la comida",
    icon: "temple_buddhist"
  },
  {
    id: "item-3",
    tripId: "trip-tokyo",
    dayId: "day-1",
    type: "manual",
    title: "Cena en Sukiyabashi Jiro",
    startTime: "19:30",
    address: "Ginza, Tokyo",
    notes: "Reserva premium del grupo.",
    order: 3,
    createdBy: "user-javier",
    transitLabel: "Fin del dia",
    icon: "restaurant"
  }
];

export const routeSnapshots: RouteSnapshot[] = [
  {
    id: "route-1",
    tripId: "trip-tokyo",
    dayId: "day-1",
    totalDistanceKm: 18.2,
    totalDurationMinutes: 72,
    travelMode: "driving",
    segments: [
      { from: "Shibuya Sky Hotel", to: "Templo Senso-ji", distanceKm: 9.4, durationMinutes: 32 },
      { from: "Templo Senso-ji", to: "Sukiyabashi Jiro", distanceKm: 8.8, durationMinutes: 40 }
    ]
  }
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "cat-stay", label: "Alojamiento", icon: "hotel", position: 1 },
  { id: "cat-food", label: "Comida", icon: "restaurant", position: 2 },
  { id: "cat-transport", label: "Transporte", icon: "train", position: 3 },
  { id: "cat-activity", label: "Actividades", icon: "local_activity", position: 4 },
  { id: "cat-shopping", label: "Compras", icon: "shopping_bag", position: 5 },
  { id: "cat-other", label: "Otros", icon: "receipt_long", position: 6 }
];

export const expenses: Expense[] = [
  {
    id: "exp-1",
    tripId: "trip-tokyo",
    concept: "Cena Sukiyabashi Jiro",
    categoryId: "cat-food",
    amount: 320,
    paidBy: mockUser.id,
    paidByName: "Alex Garcia",
    date: "2026-10-18T19:30:00.000Z",
    splitBetween: ["user-alex", "user-elena", "user-javier", "user-lucia"],
    description: "Menu degustacion para 4 personas.",
    createdBy: mockUser.id,
    splits: [
      { id: "split-1", tripId: "trip-tokyo", expenseId: "exp-1", userId: "user-alex", amount: 80, status: "pending" },
      { id: "split-2", tripId: "trip-tokyo", expenseId: "exp-1", userId: "user-elena", amount: 80, status: "pending" },
      { id: "split-3", tripId: "trip-tokyo", expenseId: "exp-1", userId: "user-javier", amount: 80, status: "pending" },
      { id: "split-4", tripId: "trip-tokyo", expenseId: "exp-1", userId: "user-lucia", amount: 80, status: "pending" }
    ]
  },
  {
    id: "exp-2",
    tripId: "trip-tokyo",
    concept: "Taxi aeropuerto",
    categoryId: "cat-transport",
    amount: 84,
    paidBy: "user-elena",
    paidByName: "Elena Martinez",
    date: "2026-10-15T09:10:00.000Z",
    splitBetween: ["user-alex", "user-elena", "user-javier", "user-lucia"],
    description: "Traslado Narita - hotel.",
    createdBy: "user-elena",
    splits: [
      { id: "split-5", tripId: "trip-tokyo", expenseId: "exp-2", userId: "user-alex", amount: 21, status: "pending" },
      { id: "split-6", tripId: "trip-tokyo", expenseId: "exp-2", userId: "user-elena", amount: 21, status: "pending" },
      { id: "split-7", tripId: "trip-tokyo", expenseId: "exp-2", userId: "user-javier", amount: 21, status: "pending" },
      { id: "split-8", tripId: "trip-tokyo", expenseId: "exp-2", userId: "user-lucia", amount: 21, status: "pending" }
    ]
  }
];

export const settlements: Settlement[] = [
  {
    id: "settlement-history-1",
    tripId: "trip-tokyo",
    fromUserId: "user-elena",
    fromName: "Elena Martinez",
    toUserId: "user-alex",
    toName: "Alex Garcia",
    amount: 21,
    status: "settled",
    reason: "Taxi aeropuerto ya compensado",
    currency: "EUR",
    settledAt: "2026-10-16T10:00:00.000Z",
    settledBy: "user-elena"
  }
];

export const documents: TripDocument[] = [
  {
    id: "doc-1",
    tripId: "trip-tokyo",
    title: "Seguro de viaje",
    type: "pdf",
    fileName: "seguro-viaje.pdf",
    storageKey: "trips/trip-tokyo/documents/seguro-viaje.pdf",
    bucketName: "attachments-private",
    mimeType: "application/pdf",
    fileSize: 128400,
    createdBy: "user-alex",
    createdByName: "Alex Garcia",
    updatedAt: "2026-09-20T09:00:00.000Z"
  },
  {
    id: "doc-2",
    tripId: "trip-tokyo",
    title: "Tarjetas de embarque",
    type: "image",
    fileName: "embarque-tokyo.png",
    storageKey: "trips/trip-tokyo/documents/embarque-tokyo.png",
    bucketName: "attachments-private",
    mimeType: "image/png",
    fileSize: 86500,
    reservationId: "reservation-hotel",
    reservationLabel: "Shibuya Sky Hotel",
    createdBy: "user-elena",
    createdByName: "Elena Martinez",
    updatedAt: "2026-10-14T19:30:00.000Z"
  }
];

export const messages: TripMessage[] = [
  {
    id: "msg-1",
    tripId: "trip-tokyo",
    authorId: "user-elena",
    authorName: "Elena Martinez",
    body: "He reservado el restaurante del sabado por la noche.",
    createdAt: "2026-10-14T18:30:00.000Z",
    updatedAt: "2026-10-14T18:30:00.000Z"
  },
  {
    id: "msg-2",
    tripId: "trip-tokyo",
    authorId: mockUser.id,
    authorName: "Alex Garcia",
    body: "Perfecto. Yo cierro el hotel y comparto el localizador.",
    createdAt: "2026-10-14T18:35:00.000Z",
    updatedAt: "2026-10-14T18:35:00.000Z"
  }
];

export const notifications: AppNotification[] = [
  {
    id: "notification-1",
    userId: mockUser.id,
    tripId: "trip-tokyo",
    kind: "invitation",
    title: "Invitacion pendiente",
    body: "Carlos aun no ha aceptado la invitacion del viaje.",
    isRead: false,
    createdAt: "2026-10-14T08:10:00.000Z",
    updatedAt: "2026-10-14T08:10:00.000Z"
  },
  {
    id: "notification-2",
    userId: mockUser.id,
    tripId: "trip-tokyo",
    actorId: "user-elena",
    kind: "expense",
    title: "Nuevo gasto registrado",
    body: "Elena ha anadido Taxi aeropuerto por 84,00 EUR.",
    isRead: true,
    readAt: "2026-10-15T10:00:00.000Z",
    createdAt: "2026-10-15T09:30:00.000Z",
    updatedAt: "2026-10-15T10:00:00.000Z"
  }
];

export const userSettings: Record<string, UserSettings> = {
  [mockUser.id]: {
    userId: mockUser.id,
    startScreen: "trips",
    preferredTripId: "trip-tokyo",
    defaultMapMode: "driving",
    compactMode: false,
    emailNotifications: true,
    expenseNotifications: true,
    itineraryNotifications: true,
    messageNotifications: true
  }
};
