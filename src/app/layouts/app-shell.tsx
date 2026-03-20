import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useUserSettings } from "../../modules/settings/data/use-user-settings";
import { useTripOverview } from "../../modules/trips/data/use-trips-data";
import { useSession } from "../providers/session-provider";

const primaryLinks = [
  { to: "/trips", label: "Mis viajes", icon: "travel_explore" },
  { to: "/explore", label: "Explorar", icon: "explore" },
  { to: "/favorites", label: "Favoritos", icon: "favorite" },
  { to: "/notifications", label: "Notificaciones", icon: "notifications" },
  { to: "/profile", label: "Perfil", icon: "person" },
  { to: "/settings", label: "Configuracion", icon: "settings" }
];

const mobileLinks = [
  { to: "/trips", label: "Inicio", icon: "home" },
  { to: "/explore", label: "Explorar", icon: "explore" },
  { to: "/favorites", label: "Guardado", icon: "favorite" },
  { to: "/notifications", label: "Alertas", icon: "notifications" },
  { to: "/profile", label: "Perfil", icon: "person" }
];

const tripLinks = [
  { slug: "summary", label: "Resumen" },
  { slug: "members", label: "Aventureros" },
  { slug: "places", label: "Sitios" },
  { slug: "reservations", label: "Reservas" },
  { slug: "itinerary", label: "Itinerario" },
  { slug: "map", label: "Mapa" },
  { slug: "expenses", label: "Gastos" },
  { slug: "settlements", label: "Saldos" },
  { slug: "documents", label: "Documentos" },
  { slug: "messages", label: "Mensajes" }
];

function getPrimaryTitle(pathname: string) {
  const matchedLink = primaryLinks.find((link) => pathname === link.to || pathname.startsWith(`${link.to}/`));
  return matchedLink?.label ?? "Tribu Trip";
}

export function AppShell() {
  const { user, signOut } = useSession();
  const { settings } = useUserSettings();
  const { tripId } = useParams();
  const location = useLocation();
  const { trip: activeTrip, members } = useTripOverview(tripId);
  const compactMode = settings?.compactMode ?? false;
  const activeTripLink = tripLinks.find((link) => location.pathname.endsWith(`/${link.slug}`));
  const mobileTitle = activeTrip ? activeTrip.title : getPrimaryTitle(location.pathname);
  const mobileSubtitle = activeTrip ? activeTripLink?.label ?? "Viaje privado" : "Tribu Trip";

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 xl:flex xl:flex-col",
            compactMode ? "p-4" : "p-6"
          )}
        >
          <Link to="/trips" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <span className="material-symbols-outlined">travel_explore</span>
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Tribu Trip</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">By Pedro Araujo</p>
            </div>
          </Link>

          <div className={cn("mt-8 rounded-2xl bg-slate-50 dark:bg-slate-900", compactMode ? "p-3" : "p-4")}>
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.displayName} className="h-12 w-12 rounded-full object-cover" /> : null}
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{user?.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                  )
                }
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => void signOut()}
            className="mt-auto rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar sesion
          </button>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
            <div className="xl:hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex w-10 shrink-0 items-center">
                  {activeTrip ? (
                    <Link
                      to="/trips"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                  ) : (
                    <Link
                      to="/trips"
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft"
                    >
                      <span className="material-symbols-outlined">travel_explore</span>
                    </Link>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">{mobileTitle}</p>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{mobileSubtitle}</p>
                </div>

                <div className="flex w-10 shrink-0 justify-end">
                  <Link
                    to={activeTrip ? `/trips/${activeTrip.id}/members` : "/settings"}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="material-symbols-outlined">{activeTrip ? "groups" : "settings"}</span>
                  </Link>
                </div>
              </div>

              {activeTrip ? (
                <div className={cn("no-scrollbar flex gap-2 overflow-x-auto px-4", compactMode ? "pb-3" : "pb-4")}>
                  {tripLinks.map((link) => {
                    const to = `/trips/${activeTrip.id}/${link.slug}`;
                    const active = location.pathname === to;

                    return (
                      <NavLink
                        key={link.slug}
                        to={to}
                        className={cn(
                          "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-colors",
                          active
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                      >
                        {link.label}
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className={cn("hidden items-center justify-between gap-4 px-4 md:px-8 xl:flex", compactMode ? "py-3" : "py-4")}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Tribu Trip</p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeTrip ? activeTrip.title : "Planificacion modular"}
                </h1>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                {members.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary/15 text-sm font-bold text-primary dark:border-slate-900"
                    title={member.displayName}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{member.displayName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeTrip ? (
              <div className={cn("no-scrollbar hidden gap-2 overflow-x-auto px-4 md:px-8 xl:flex", compactMode ? "pb-3" : "pb-4")}>
                {tripLinks.map((link) => {
                  const to = `/trips/${activeTrip.id}/${link.slug}`;
                  const active = location.pathname === to;

                  return (
                    <NavLink
                      key={link.slug}
                      to={to}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                        active
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </header>

          <main
            className={cn(
              "flex-1 w-full px-4 pb-24 pt-5 md:px-6 md:pt-6 xl:max-w-none xl:px-8 xl:pb-8",
              compactMode ? "xl:py-6" : "xl:py-8"
            )}
          >
            <div className="mx-auto w-full max-w-[480px] xl:max-w-none">
              <Outlet />
            </div>
          </main>

          <nav className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-4 pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 xl:hidden">
            <div className="grid grid-cols-5 gap-1">
              {mobileLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center rounded-xl py-2 text-[10px] font-bold tracking-wide",
                      isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
                    )
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
