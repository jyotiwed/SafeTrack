// src/modules/Notifications/NotificationsCenter.jsx
import { useNotifications } from "./NotificationsContext";

export default function NotificationsCenter() {
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Notifications</h1>
          <p className="text-xs text-slate-400">
            All incident notifications from realtime stream
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              connected
                ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-300"
                : "border-slate-600 bg-slate-800 text-slate-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {connected ? "Live" : "Offline"}
          </span>

          <span className="text-xs text-slate-300">
            Unread: <strong>{unreadCount}</strong>
          </span>

          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="text-xs rounded border border-slate-600 px-3 py-1.5 text-slate-200 hover:bg-slate-800 transition"
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="text-xs rounded border border-slate-600 px-3 py-1.5 text-slate-200 hover:bg-slate-800 transition"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 backdrop-blur">
        {notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
            <p className="text-base font-medium text-slate-200">No notifications yet</p>
            <p className="text-sm">New incidents will appear here in real time</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications
              .slice()
              .reverse()
              .map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:bg-slate-800/80 transition-all ${
                    !n.read ? "border-l-4 border-cyan-500" : ""
                  }`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-center gap-3">
                      {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                      <h3 className="text-sm font-semibold text-slate-100">{n.title}</h3>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-300">{n.body}</p>

                    <p className="mt-2 text-[11px] text-slate-500">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>

                    {n.data && (
                      <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                        {n.data.severity && <div>Severity: {n.data.severity}</div>}
                        {n.data.status && <div>Status: {n.data.status}</div>}
                        {n.data.address && <div>📍 {n.data.address}</div>}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeNotification(n.id)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-200 transition"
                  >
                    ×
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}