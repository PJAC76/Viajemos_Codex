import type { AuthUser } from "../modules/auth/domain/types";
import type { Expense, ExpenseCategory } from "../modules/expenses/domain/types";
import type { ItineraryDay, ItineraryItem, RouteSnapshot } from "../modules/itinerary/domain/types";
import type { Place, Reservation } from "../modules/places/domain/types";
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
    notes: "Dos habitaciones dobles."
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
    notes: "Menu degustacion."
  }
];

export const itineraryDays: ItineraryDay[] = [
  { id: "day-1", tripId: "trip-tokyo", date: "2026-10-15", label: "Dia 1" },
  { id: "day-2", tripId: "trip-tokyo", date: "2026-10-16", label: "Dia 2" },
  { id: "day-3", tripId: "trip-tokyo", date: "2026-10-17", label: "Dia 3" }
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
    segments: [
      { from: "Shibuya Sky Hotel", to: "Templo Senso-ji", distanceKm: 9.4, durationMinutes: 32 },
      { from: "Templo Senso-ji", to: "Sukiyabashi Jiro", distanceKm: 8.8, durationMinutes: 40 }
    ]
  }
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "cat-food", label: "Comida", icon: "restaurant" },
  { id: "cat-stay", label: "Alojamiento", icon: "hotel" },
  { id: "cat-transport", label: "Transporte", icon: "train" }
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
    description: "Menu degustacion para 4 personas."
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
    description: "Traslado Narita - hotel."
  }
];

export const documents = [
  {
    id: "doc-1",
    tripId: "trip-tokyo",
    title: "Seguro de viaje",
    type: "pdf",
    updatedAt: "2026-09-20T09:00:00.000Z"
  },
  {
    id: "doc-2",
    tripId: "trip-tokyo",
    title: "Tarjetas de embarque",
    type: "image",
    updatedAt: "2026-10-14T19:30:00.000Z"
  }
];

export const messages = [
  {
    id: "msg-1",
    tripId: "trip-tokyo",
    authorId: "user-elena",
    authorName: "Elena Martinez",
    body: "He reservado el restaurante del sabado por la noche.",
    createdAt: "2026-10-14T18:30:00.000Z"
  },
  {
    id: "msg-2",
    tripId: "trip-tokyo",
    authorId: mockUser.id,
    authorName: "Alex Garcia",
    body: "Perfecto. Yo cierro el hotel y comparto el localizador.",
    createdAt: "2026-10-14T18:35:00.000Z"
  }
];

export const notifications = [
  {
    id: "notification-1",
    userId: mockUser.id,
    title: "Invitacion pendiente",
    body: "Carlos aun no ha aceptado la invitacion del viaje.",
    createdAt: "2026-10-14T08:10:00.000Z"
  },
  {
    id: "notification-2",
    userId: mockUser.id,
    title: "Nuevo gasto registrado",
    body: "Elena ha anadido Taxi aeropuerto por 84,00 EUR.",
    createdAt: "2026-10-15T09:30:00.000Z"
  }
];
