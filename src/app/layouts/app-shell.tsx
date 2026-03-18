import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { tripMembers, trips } from "../../mocks/db";
import { cn } from "../../lib/utils";
import { useSession } from "../providers/session-provider";

const primaryLinks = [
  { to: "/trips", label: "Mis viajes", icon: "travel_explore" },
  { to: "/explore", label: "Explorar", icon: "explore" },
  { to: "/favorites", label: "Favoritos", icon: "favorite" },
  { to: "/notifications", label: "Notificaciones", icon: "notifications" },
  { to: "/profile", label: "Perfil", icon: "person" },
  { to: "/settings", label: "Configuracion", icon: "settings" }
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

export function AppShell() {
  const { user, signOut } = useSession();
  const { tripId } = useParams();
  const location = useLocation();
  const activeTrip = trips.find((trip) => trip.id === tripId);
  const members = tripId ? tripMembers.filter((member) => member.tripId === tripId) : [];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 p-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 xl:flex xl:flex-col">
          <Link to="/trips" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <span className="material-symbols-outlined">travel_explore</span>
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Viajemos</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">PWA de viajes privados</p>
            </div>
          </Link>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
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
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Viajemos MVP</p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeTrip ? activeTrip.title : "Planificacion modular"}
                </h1>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                {members.slice(0, 4).map((member) => (
                  <img
                    key={member.id}
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-slate-900"
                  />
                ))}
              </div>
            </div>
            {activeTrip ? (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 md:px-8">
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

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>

          <nav className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/90 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 xl:hidden">
            <div className="grid grid-cols-4 gap-1">
              {primaryLinks.slice(0, 4).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-bold",
                      isActive ? "text-primary" : "text-slate-400"
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
