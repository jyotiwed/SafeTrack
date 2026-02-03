// src/layouts/DashboardLayout.jsx (or wherever it lives)
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Menu,
  X,
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
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import Logo from "../modules/auth/components/Logo";
import { fetchProfile, logoutRequest } from "../modules/auth/api/authApi";
import { useNotifications } from "../modules/Notifications/NotificationsContext";

function NotificationsBell() {
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/80 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 hover:bg-slate-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span
          className={`absolute -bottom-0.5 right-0.5 h-2 w-2 rounded-full ring-1 ring-slate-900 ${
            connected ? "bg-emerald-400 shadow-emerald-400/50" : "bg-slate-500"
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-lg shadow-2xl ring-1 ring-black/20 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs text-rose-400">({unreadCount} unread)</span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {connected ? (
                  <span className="text-emerald-400">Live</span>
                ) : (
                  "Offline"
                )}
              </span>
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      markAllAsRead();
                      setOpen(false);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => {
                      clearAll();
                      setOpen(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(70vh-60px)] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {notifications
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        !n.read ? "bg-slate-800/40" : ""
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
                        aria-label="Remove notification"
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Dashboard Layout ---------------- */

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchProfile();
        if (mounted) setUser(data);
      } catch {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // silent fail
    }
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const navLinkBase =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200";
  const navLinkInactive =
    "text-slate-300 hover:bg-slate-800/70 hover:text-white";
  const navLinkActive =
    "bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-100 shadow-sm ring-1 ring-cyan-500/30";

  const navigation = [
    { to: "/app/home", label: "Home", icon: Home },
    { to: "/app/incidents", label: "Incidents", icon: AlertTriangle },
    { to: "/app/incidents/nearby", label: "Nearby", icon: MapPin },
    { to: "/app/incidents/map", label: "Incident Map", icon: Map },
    { to: "/app/tasks", label: "Tasks", icon: CheckSquare },
    { to: "/app/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/app/guidelines", label: "Guidelines", icon: Book },
    { to: "/app/personalized-guidelines", label: "Personalized Guidelines", icon: BookUser },
    { to: "/app/emergency-contacts", label: "Emergency Contacts", icon: Phone },
    { to: "/app/sos-trigger", label: "SOS Trigger", icon: Siren },
    { to: "/app/profile", label: "Profile", icon: User },
    { to: "/app/notifications", label: "Notifications", icon: Bell },
  ];

  const userInitial =
    user?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-50">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-800/50 bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <Logo />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-800/50 px-4 py-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-rose-600/50 hover:bg-rose-950/20 hover:text-rose-300 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-50 w-72 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl transition-transform duration-300 translate-x-0">
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <Logo />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-slate-800 px-4 py-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setSidebarOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-rose-600/50 hover:bg-rose-950/20 hover:text-rose-300 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Area */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar */}
          <header className="flex items-center justify-between border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-md px-4 py-3 md:px-6">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden flex items-center justify-center rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  SafeTrack
                </span>
                <span className="text-base font-medium text-slate-100">
                  Dashboard
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationsBell />

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {user && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-100">
                      {user.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>

                  <button
                    onClick={() => navigate("/app/profile")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                    title="Profile"
                  >
                    {userInitial}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}