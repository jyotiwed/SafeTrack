// src/layouts/DashboardLayout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LogOut,
  Home,
  AlertTriangle,
  MapPin,
  Map,
  CheckSquare,
  BarChart2,
  Book,
  BookUser,
  Phone,
  Siren,
  User,
} from "lucide-react";

import Logo from "../modules/auth/components/Logo";
import { fetchProfile, logoutRequest } from "../modules/auth/api/authApi";
import NotificationsBell from "../modules/Notifications/NotificationsBell";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/app/incidents/nearby", label: "Nearby", icon: MapPin },
  { to: "/app/incidents/map", label: "Map", icon: Map },
  { to: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/app/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/app/guidelines", label: "Guidelines", icon: Book },
  { to: "/app/personalized-guidelines", label: "Personalized", icon: BookUser },
  { to: "/app/emergency-contacts", label: "Contacts", icon: Phone },
  { to: "/app/sos-trigger", label: "SOS Trigger", icon: Siren },
  { to: "/app/profile", label: "Profile", icon: User },
];

function pageTitle(pathname) {
  const seg = pathname.replace("/app/", "").split("/")[0];
  return (seg || "dashboard")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfile();
        setUser(data);
      } catch {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    // eslint-disable-next-line no-empty
    } catch {}
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const userInitial =
    user?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Subtle full-page background image – dark dashboard/tech theme */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] z-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80')`
        }}
      />

      <div className="relative z-10 flex h-screen w-full">

        {/* ── SIDEBAR ── */}
        <aside className="flex w-64 flex-shrink-0 flex-col border-r border-white/[0.08] bg-black/80 backdrop-blur-sm">
          
          {/* LOGO */}
          <div className="flex items-center justify-center border-b border-white/[0.08] px-4 py-6">
            <Logo size="md" />
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/home"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-900/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                  }`
                }
              >
                <item.icon
                  size={18}
                  strokeWidth={2}
                  className="text-zinc-500 group-hover:text-zinc-300 transition-colors"
                />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* LOGOUT */}
          <div className="border-t border-white/[0.08] p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* ── HEADER ── */}
          <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.08] bg-black/80 backdrop-blur-sm px-6">
            
            {/* Page Title – Centered */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {pageTitle(location.pathname)}
              </h1>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-5">
              <NotificationsBell />

              {user && (
                <div
                  onClick={() => navigate("/app/profile")}
                  className="group flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-base font-bold text-white shadow-md">
                    {userInitial}
                  </div>

                  {/* User Info */}
                  <div className="flex-col leading-tight hidden sm:flex">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-cyan-300 transition-colors">
                      {user.full_name || "User"}
                    </span>
                    <span className="text-xs text-zinc-500 group-hover:text-cyan-400/70 transition-colors">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <main className="flex-1 overflow-y-auto bg-transparent px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}