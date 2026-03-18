import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
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
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (!user || !tripId) {
        if (active) {
          setHasAccess(false);
          setCheckingAccess(false);
        }
        return;
      }

      try {
        setCheckingAccess(true);
        const access = await tripAccessService.userHasTripAccess(user.id, tripId);

        if (active) {
          setHasAccess(access);
        }
      } catch {
        if (active) {
          setHasAccess(false);
        }
      } finally {
        if (active) {
          setCheckingAccess(false);
        }
      }
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, [tripId, user]);

  if (checkingAccess) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando viaje...</div>;
  }

  if (!user || !hasAccess) {
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
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(Boolean(user && tripId));

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!user) {
        if (active) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const isAdmin = await tripAccessService.isTripAdmin(user.id, tripId);

        if (active) {
          setAllowed(isAdmin);
        }
      } catch {
        if (active) {
          setAllowed(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkAdmin();

    return () => {
      active = false;
    };
  }, [tripId, user]);

  if (loading) {
    return <>{fallback ?? null}</>;
  }

  if (allowed) {
    return <>{children}</>;
  }

  return <>{fallback ?? null}</>;
}
