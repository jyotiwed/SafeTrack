// src/modules/Notifications/NotificationsCenter.jsx
import { useEffect } from "react";
import { useNotifications } from "./NotificationsContext";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronRight } from "lucide-react";


const SEV = {
  info:     { color: "#00c4ff", bg: "rgba(0,196,255,0.10)",   border: "rgba(0,196,255,0.18)"   },
  low:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.18)"  },
  medium:   { color: "#facc15", bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.18)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.18)"  },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.18)"   },
};
const getSev = (s) => SEV[s] || SEV.info;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";


export default function NotificationsCenter() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    connected,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();


  useEffect(() => {
    markAllAsRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = [...notifications].reverse();


  const counts = visible.reduce((acc, n) => {
    acc[n.severity] = (acc[n.severity] || 0) + 1;
    return acc;
  }, {});

  const summaryItems = [
    { key: "critical", label: "Critical" },
    { key: "high",     label: "High"     },
    { key: "medium",   label: "Medium"   },
    { key: "low",      label: "Low"      },
    { key: "info",     label: "Info"     },
  ].filter(item => counts[item.key] > 0);

  const navBtn = "rounded-[7px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-[6px] text-[12px] font-semibold text-zinc-400 hover:border-cyan-400/28 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-[72px] text-zinc-200 max-sm:px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[820px]">

        {/* ── TOPBAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] py-[18px] mb-11">
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-cyan-400">SafeTrack ICC</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* connection status pill */}
            <div className="flex items-center gap-1.5 rounded-full border px-3 py-[5px] font-mono text-[11px] font-semibold tracking-[.06em]"
              style={connected
                ? { color: "#4ade80", borderColor: "rgba(74,222,128,0.22)", background: "rgba(74,222,128,0.06)" }
                : { color: "rgba(228,228,231,0.3)", borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }
              }>
              <span className="h-[6px] w-[6px] rounded-full shrink-0"
                style={{ background: connected ? "#4ade80" : "rgba(228,228,231,0.2)" }} />
              {connected ? "Live" : "Offline"}
            </div>
            {unreadCount > 0 && (
              <button className={navBtn} onClick={markAllAsRead}>Mark all read</button>
            )}
            {visible.length > 0 && (
              <button
                className="rounded-[7px] border border-red-500/20 bg-red-500/[0.05] px-3.5 py-[6px] text-[12px] font-semibold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                onClick={clearAll}>
                Clear all
              </button>
            )}
            <button className={navBtn} onClick={() => navigate("/app")}>← Dashboard</button>
          </div>
        </div>

        {/* ── HERO ── */}
        <div className="mb-8">
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400/55">
            <div className=" bg-cyan-400/40" /> Alerts &amp; Updates
          </div>
          <h1 className="mb-2 text-[34px] font-extrabold tracking-tight text-white max-sm:text-2xl">Notifications</h1>
          <p className="font-mono text-[10px] uppercase tracking-[.1em] text-zinc-600">
            REAL-TIME INCIDENT ALERTS · SYSTEM EVENTS · TASK UPDATES
          </p>
        </div>

        {/* ── SUMMARY STRIP ── */}
        {summaryItems.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            {summaryItems.map((item, i) => {
              const sev = getSev(item.key);
              return (
                <div key={item.key} className="flex items-center gap-2">
                  {i > 0 && <div className="h-3.5 w-px bg-white/[0.06]" />}
                  <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[11px]"
                    style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>
                    <span className="h-[6px] w-[6px] rounded-full shrink-0" style={{ background: sev.color }} />
                    <span className="font-bold">{counts[item.key]}</span>
                    <span className="opacity-60">{item.label}</span>
                  </div>
                </div>
              );
            })}
            <div className="h-3.5 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-[3px] font-mono text-[11px] text-zinc-400">
              <span className="font-bold">{visible.length}</span>
              <span className="opacity-60">Total</span>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {visible.length === 0 ? (
          <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
            <div className="mb-4 text-[40px] opacity-20">🔔</div>
            <h3 className="mb-2 text-[17px] font-bold text-zinc-500">No notifications yet</h3>
            <p className="font-mono text-[12px] text-zinc-700">New incidents will appear here instantly when they occur</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {visible.map(n => {
                const sev = getSev(n.severity);
                const incidentId   = n.data?.incidentId;
                const incidentPath = incidentId ? `/app/incidents/${incidentId}` : null;

                return (
                  <div key={n.id}
                    className="relative flex overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.035] transition-colors">
                    {/* left severity stripe */}
                    <div className="w-[3px] shrink-0 rounded-l-[12px] opacity-55" style={{ background: sev.color }} />

                    {/* unread dot */}
                    {!n.read && (
                      <div className="absolute right-12 top-3.5 h-[6px] w-[6px] rounded-full bg-cyan-400" />
                    )}

                    <div className="flex-1 px-4 py-4">
                      {/* header: severity badge + delete */}
                      <div className="mb-2.5 flex items-center justify-between gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-[9px] py-[3px] font-mono text-[9px] font-bold tracking-[.12em]"
                          style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>
                          <span className="h-[5px] w-[5px] rounded-full shrink-0" style={{ background: sev.color }} />
                          {(n.severity || "info").toUpperCase()}
                        </span>
                        <button onClick={() => removeNotification(n.id)} title="Delete"
                          className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px] border border-transparent bg-transparent text-zinc-600 hover:border-red-500/28 hover:bg-red-500/[0.07] hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* title */}
                      {incidentPath ? (
                        <Link to={incidentPath}
                          className="mb-1.5 block text-[14px] font-bold leading-snug text-zinc-200 no-underline hover:text-cyan-400 transition-colors">
                          {n.title}
                        </Link>
                      ) : (
                        <span className="mb-1.5 block text-[14px] font-bold leading-snug text-zinc-200">{n.title}</span>
                      )}

                      {/* body */}
                      {n.body && (
                        <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">{n.body}</p>
                      )}

                      {/* optional video */}
                      {n.data?.mediaUrl && (
                        <video controls className="mb-3 max-h-40 w-full rounded-[7px] object-cover" preload="metadata">
                          <source src={n.data.mediaUrl} type="video/mp4" />
                        </video>
                      )}

                      {/* footer */}
                      <div className="flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                        <span className="font-mono text-[10px] tracking-[.04em] text-zinc-600">{fmtDate(n.createdAt)}</span>
                        {incidentPath && (
                          <Link to={incidentPath}
                            className="flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[.06em] text-cyan-400/45 no-underline hover:text-cyan-400 transition-colors">
                            View Incident <ChevronRight size={11} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="mt-5 w-full rounded-[9px] border border-white/[0.06] bg-white/[0.02] py-3 font-mono text-[10px] uppercase tracking-[.1em] text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-colors">
              LOAD MORE NOTIFICATIONS
            </button>
          </>
        )}

      </div>
    </div>
  );
}