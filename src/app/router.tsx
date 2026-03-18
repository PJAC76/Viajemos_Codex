import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppRouteGuard, TripAccessGuard } from "./components/route-guards";
import { AppShell } from "./layouts/app-shell";
import { useSession } from "./providers/session-provider";
import { RecoverScreen } from "../modules/auth/screens/recover-screen";
import { LoginScreen } from "../modules/auth/screens/login-screen";
import { RegisterScreen } from "../modules/auth/screens/register-screen";
import { DocumentsScreen } from "../modules/documents/screens/documents-screen";
import { ExploreScreen } from "../modules/explore/screens/explore-screen";
import { FavoritesScreen } from "../modules/favorites/screens/favorites-screen";
import { ItineraryScreen } from "../modules/itinerary/screens/itinerary-screen";
import { MapScreen } from "../modules/maps/screens/map-screen";
import { MessagesScreen } from "../modules/messages/screens/messages-screen";
import { NotificationsScreen } from "../modules/notifications/screens/notifications-screen";
import { PlacesScreen } from "../modules/places/screens/places-screen";
import { ProfileScreen } from "../modules/profile/screens/profile-screen";
import { ReservationsScreen } from "../modules/reservations/screens/reservations-screen";
import { SettingsScreen } from "../modules/settings/screens/settings-screen";
import { DashboardScreen } from "../modules/trips/screens/dashboard-screen";
import { MembersScreen } from "../modules/trips/screens/members-screen";
import { TripsScreen } from "../modules/trips/screens/trips-screen";
import { ExpensesScreen } from "../modules/expenses/screens/expenses-screen";
import { SettlementsScreen } from "../modules/expenses/screens/settlements-screen";

function RootRedirect() {
  const { user, loading } = useSession();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando...</div>;
  }

  return <Navigate to={user ? "/trips" : "/auth/login"} replace />;
}

function ProtectedLayout() {
  return (
    <AppRouteGuard>
      <AppShell />
    </AppRouteGuard>
  );
}

function ProtectedTripLayout() {
  return (
    <TripAccessGuard>
      <Outlet />
    </TripAccessGuard>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/app" element={<Navigate to="/trips" replace />} />

        <Route path="/auth/login" element={<LoginScreen />} />
        <Route path="/auth/register" element={<RegisterScreen />} />
        <Route path="/auth/recover" element={<RecoverScreen />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/trips" element={<TripsScreen />} />
          <Route path="/explore" element={<ExploreScreen />} />
          <Route path="/favorites" element={<FavoritesScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />

          <Route path="/trips/:tripId" element={<ProtectedTripLayout />}>
            <Route index element={<Navigate to="summary" replace />} />
            <Route path="summary" element={<DashboardScreen />} />
            <Route path="members" element={<MembersScreen />} />
            <Route path="places" element={<PlacesScreen />} />
            <Route path="reservations" element={<ReservationsScreen />} />
            <Route path="itinerary" element={<ItineraryScreen />} />
            <Route path="map" element={<MapScreen />} />
            <Route path="expenses" element={<ExpensesScreen />} />
            <Route path="settlements" element={<SettlementsScreen />} />
            <Route path="documents" element={<DocumentsScreen />} />
            <Route path="messages" element={<MessagesScreen />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
