// src/modules/Notifications/IncidentNotifications.jsx
import { useEffect } from "react";
import { useNotifications } from "./NotificationsContext";

export function IncidentNotifications() {
  const { notifications, connected, markAsRead, removeNotification } = useNotifications();

  const activeToasts = notifications.filter((n) => !n.read);

  useEffect(() => {
    const timers = activeToasts.map((n) => {
      if (n.data?.severity !== "critical") {
        return setTimeout(() => {
          markAsRead(n.id);
          removeNotification(n.id);
        }, 7000);
      }
      return null;
    });

    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [activeToasts, markAsRead, removeNotification]);

  if (activeToasts.length === 0 && connected) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
      {!connected && (
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-slate-700 text-slate-300 px-4 py-3 rounded-lg text-sm shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          Realtime disconnected
        </div>
      )}

      {activeToasts.map((n) => {
        const isCritical = n.data?.severity === "critical";
        const bg = isCritical ? "bg-rose-600" : "bg-slate-800";

        return (
          <div
            key={n.id}
            className={`pointer-events-auto ${bg} text-white px-4 py-3 rounded-lg shadow-2xl border-l-4 ${
              isCritical ? "border-rose-300" : "border-slate-400"
            } flex items-start gap-3 animate-in fade-in slide-in-from-right-5 duration-300`}
          >
            <div className="flex-1 cursor-pointer" onClick={() => markAsRead(n.id)}>
              <div className="font-semibold text-sm">{n.title}</div>
              <div className="text-xs opacity-90 mt-1">{n.body}</div>
              <div className="text-[10px] opacity-70 mt-1.5">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-lg font-bold opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              ×
            </button>

            {!isCritical && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 overflow-hidden">
                <div className="h-full bg-white/30 animate-[progress_7s_linear_forwards]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}