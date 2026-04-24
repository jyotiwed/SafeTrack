// src/modules/Notifications/IncidentNotifications.jsx
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "./NotificationsContext";
import { X } from "lucide-react";

/* ─── severity map ─────────────────────────────────────────────────────────── */
const SEV = {
  info:     { color: "#00c4ff", bg: "rgba(0,196,255,0.10)",   border: "rgba(0,196,255,0.25)"   },
  low:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.25)"  },
  medium:   { color: "#facc15", bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.25)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.25)"  },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.25)"   },
};
const getSev = (s) => SEV[s] || SEV.info;

const TOAST_DURATION = 5000; // ms

/* ─── Progress bar sub-component ─────────────────────────────────────────── */
function ProgressBar({ color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    // trigger reflow so transition starts at 100%
    ref.current.style.width = "100%";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (ref.current) ref.current.style.width = "0%";
      })
    );
  }, []);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.05]">
      <div
        ref={ref}
        className="h-full opacity-50"
        style={{ background: color, transition: `width ${TOAST_DURATION}ms linear`, width: "100%" }}
      />
    </div>
  );
}

export function IncidentNotifications() {
  const { notifications, connected, markAsRead } = useNotifications();
  const [visible,  setVisible]  = useState(new Set());
  const shownRef  = useRef(new Set());
  const timersRef = useRef({});

  useEffect(() => {
    notifications.filter(n => !n.read && !n.deleted).forEach(n => {
      if (shownRef.current.has(n.id)) return;
      shownRef.current.add(n.id);
      setVisible(prev => new Set([...prev, n.id]));
      timersRef.current[n.id] = setTimeout(() => dismissToast(n.id), TOAST_DURATION);
    });
  }, [notifications]); // eslint-disable-line


  useEffect(() => () => Object.values(timersRef.current).forEach(clearTimeout), []);

  function dismissToast(id) {
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
    setVisible(prev => { const n = new Set(prev); n.delete(id); return n; });
    markAsRead(id);
  }

  const toastsToShow = notifications.filter(n => visible.has(n.id));

  if (toastsToShow.length === 0 && connected) return null;

  return (
    <div
      className="pointer-events-none fixed right-5 top-5 z-[9999] flex w-[340px] flex-col gap-2.5 max-[420px]:right-4 max-[420px]:top-4 max-[420px]:w-[calc(100vw-32px)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* offline banner */}
      {!connected && (
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-[10px] border border-yellow-400/25 bg-yellow-400/[0.07] px-3.5 py-2.5 font-mono text-[11px] font-medium tracking-[.05em] text-yellow-400/80">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-yellow-400" />
          Realtime connection lost — alerts paused
        </div>
      )}

      {toastsToShow.map(n => {
        const sev     = getSev(n.severity);
        const timeStr = new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return (
          <div key={n.id}
            className="pointer-events-auto relative flex overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#141418] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* left accent strip */}
            <div className="w-[3px] shrink-0" style={{ background: sev.color }} />

            <div className="flex flex-1 flex-col px-3.5 py-3.5">
              {/* header */}
              <div className="mb-1.5 flex items-start justify-between gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[.12em]"
                  style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>
                  <span className="h-1 w-1 rounded-full shrink-0" style={{ background: sev.color }} />
                  {(n.severity || "info").toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  {n.count > 1 && (
                    <span className="rounded-[4px] bg-white/[0.07] px-1.5 font-mono text-[10px] font-bold text-zinc-500">
                      ×{n.count}
                    </span>
                  )}
                  <button onClick={() => dismissToast(n.id)} title="Dismiss"
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border-none bg-transparent text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* title */}
              <div onClick={() => dismissToast(n.id)}
                className="mb-1 cursor-pointer text-[13px] font-bold leading-snug text-zinc-200 hover:text-cyan-400 transition-colors">
                {n.title}
              </div>

              {/* body */}
              {n.body && (
                <p className="mb-2 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">{n.body}</p>
              )}

              {/* footer */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[.04em] text-zinc-600">{timeStr}</span>
              </div>
            </div>

            {/* progress bar */}
            <ProgressBar color={sev.color} />
          </div>
        );
      })}
    </div>
  );
}