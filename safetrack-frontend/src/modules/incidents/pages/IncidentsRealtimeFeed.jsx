// src/modules/incidents/IncidentsRealtimeFeed.jsx
import { useEffect } from "react";
import { useIncidentsRealtime } from "../../realtime/useIncidentsRealtime.js";
import { AlertCircle, MapPin, Clock, Rss } from "lucide-react";
import { useNotifications } from "../../Notifications/NotificationsContext.jsx";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
}

export default function IncidentsRealtimeFeed() {
  const { events, connected, lastEventTime } = useIncidentsRealtime();
  const { addNotification } = useNotifications();

  const createdEvents = events.filter((e) => e.type === "incident.created");

  // 🔔 Handle notifications for new incidents
  useEffect(() => {
    if (!createdEvents.length) return;

    const latest = createdEvents[createdEvents.length - 1];

    // Ask permission once
    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    // 🌐 Native browser notification
    if (Notification.permission === "granted") {
      try {
        new Notification(latest.title || "New Incident", {
          body: `${latest.severity?.toUpperCase() || "INFO"}: ${
            latest.description || "New incident reported"
          }`,
          tag: `incident-${latest.id || Date.now()}`,
          icon: "/favicon.ico",
          data: latest,
        });
      } catch (err) {
        console.warn("Browser notification failed:", err);
      }
    }

    // 🔔 App notification (bell / drawer)
    addNotification({
      id: `incident-${latest.id || Date.now()}`,
      title: latest.title || "New Incident",
      body: latest.description || "New incident reported",
      severity: latest.severity || "info",
      createdAt: latest.created_at,
      data: latest,
    });

    // 🔊 Optional sound
    try {
      const audio = new Audio("/assets/notification.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {}
  }, [createdEvents, addNotification]);

  return (
    <div className="flex h-full flex-col gap-6 p-4 sm:p-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Live Incidents</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Real-time stream of new incidents
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border ${
              connected
                ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-300"
                : "border-slate-600 bg-slate-800 text-slate-400"
            }`}
          >
            <Rss className={`h-4 w-4 ${connected ? "animate-pulse" : ""}`} />
            {connected ? "Live" : "Offline"}
          </span>
          {lastEventTime && (
            <span className="text-xs text-slate-500">
              Last update: {timeAgo(lastEventTime)}
            </span>
          )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur p-5">
        {createdEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 opacity-70" />
            <p className="text-lg font-medium text-slate-200">
              No new incidents yet
            </p>
            <p className="max-w-md text-sm">
              New reports will appear here instantly when reported.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {createdEvents
              .slice()
              .reverse()
              .map((e) => (
                <li
                  key={e.id || e.created_at}
                  className="relative flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 h-3 w-3 rounded-full bg-cyan-500 shadow-md shadow-cyan-500/40" />
                    <div className="mt-2 flex-1 w-0.5 bg-gradient-to-b from-cyan-500/40 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-50">
                          {e.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                          {e.description}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {timeAgo(e.created_at)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            e.severity === "critical"
                              ? "bg-rose-500"
                              : e.severity === "high"
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        {e.severity || "Unknown"}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(e.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {e.address && (
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5" />
                          {e.address}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
