import type { PropsWithChildren, ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { tripsQueries } from "../../modules/trips/data/trips-queries";
import { tripAccessService } from "../../services/trip-access-service";
import { useSession } from "../providers/session-provider";

export function AppRouteGuard({ children }: PropsWithChildren) {
  const { loading, user } = useSession();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando sesion...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

export function TripAccessGuard({ children }: PropsWithChildren) {
  const { tripId = "" } = useParams();
  const { user } = useSession();
  const trip = tripsQueries.getTrip(tripId);

  if (!trip || !user || !tripAccessService.userHasTripAccess(user.id, tripId)) {
    return <Navigate to="/trips" replace />;
  }

  return <>{children}</>;
}

export function AdminOnlyAction({
  tripId,
  children,
  fallback
}: {
  tripId: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useSession();

  if (user && tripAccessService.isTripAdmin(user.id, tripId)) {
    return <>{children}</>;
  }

  return <>{fallback ?? null}</>;
}
