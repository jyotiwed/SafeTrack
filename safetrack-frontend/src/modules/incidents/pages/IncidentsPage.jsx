// src/modules/incidents/pages/IncidentsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ChevronRight, MapPin, Calendar, Plus, Loader2, ChevronDown } from "lucide-react";
import IncidentForm from "../components/IncidentForm";
import { listIncidents } from "../api/incidentsApi.js";

const STATUS_OPTIONS = [
  { value: "all",         label: "All Statuses" },
  { value: "new",         label: "New"          },
  { value: "verified",    label: "Verified"     },
  { value: "in_progress", label: "In Progress"  },
  { value: "resolved",    label: "Resolved"     },
  { value: "closed",      label: "Closed"       },
];

const STATUS_STYLE = {
  new:         { color: "#00c4ff", bg: "rgba(0,196,255,0.10)",   border: "rgba(0,196,255,0.2)"   },
  verified:    { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.2)"  },
  in_progress: { color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.2)"  },
  resolved:    { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.2)" },
  closed:      { color: "rgba(228,228,231,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" },
};

const SEV_STYLE = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.2)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.2)"  },
  medium:   { color: "#facc15", bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.2)"  },
  low:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.2)"  },
  info:     { color: "#00c4ff", bg: "rgba(0,196,255,0.10)",  border: "rgba(0,196,255,0.2)"   },
};

const getStatus = s => STATUS_STYLE[s] || STATUS_STYLE.closed;
const getSev    = s => SEV_STYLE[s]    || SEV_STYLE.info;

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Incident Card ─────────────────────────────────────────────────────────── */
function IncidentCard({ incident, onClick }) {
  const st  = getStatus(incident.status);
  const sev = getSev(incident.severity);

  return (
    <article
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 flex flex-col gap-2 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-xl opacity-80" style={{ background: sev.color }} />
      <div className="flex items-center justify-between gap-2 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          {incident.severity && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide"
              style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sev.color }} />
              {incident.severity.toUpperCase()}
            </span>
          )}
          {incident.status && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide"
              style={{ color: st.color, background: st.bg, borderColor: st.border }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: st.color }} />
              {incident.status.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          <span className="opacity-50">#</span>{incident.id?.toString().slice(0, 8)}
          <ChevronRight size={14} className="text-zinc-500 group-hover:text-cyan-400" />
        </div>
      </div>

      <p className="line-clamp-2 pl-2 text-[15px] font-bold leading-snug text-white group-hover:text-cyan-300">
        {incident.title}
      </p>

      {incident.description && (
        <p className="line-clamp-2 pl-2 text-[13px] leading-relaxed text-zinc-400">
          {incident.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pl-2 pt-3 mt-1">
        {incident.address && (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <MapPin size={12} className="text-cyan-400/70" /> {incident.address}
          </span>
        )}
        {incident.created_at && (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <Calendar size={12} className="text-emerald-400/70" /> {fmtDate(incident.created_at)}
          </span>
        )}
      </div>
    </article>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function IncidentsPage() {
  const navigate = useNavigate();
  const [incidents,    setIncidents]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen,     setFormOpen]     = useState(false);

  async function loadIncidents(status = statusFilter) {
    setLoading(true);
    try {
      const params = status === "all"
        ? { limit: 50, offset: 0 }
        : { limit: 50, offset: 0, status };
      const data = await listIncidents(params);
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load incidents", err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIncidents("all"); }, []); // eslint-disable-line

  function handleCreated(inc) {
    setIncidents(prev => [inc, ...prev]);
    setFormOpen(false);
  }

  function handleStatusChange(e) {
    const v = e.target.value;
    setStatusFilter(v);
    loadIncidents(v);
  }

  const totalCount    = incidents.length;
  const activeCount   = incidents.filter(i => i.status === "in_progress").length;
  const criticalCount = incidents.filter(i => i.severity === "critical").length;
  const newCount      = incidents.filter(i => i.status === "new").length;

  return (
    <div className="min-h-screen bg-black px-6 pb-20 text-zinc-100 max-sm:px-4" style={{ fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="mx-auto max-w-6xl">

        {/* ── TOPBAR ── */}
        <div className="flex items-center justify-between border-b border-white/[0.08] py-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-[13px] font-bold tracking-widest text-cyan-400 uppercase">SafeTrack ICC</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/app/incidents/map")}
              className="flex items-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-5 py-2 text-[14px] font-semibold text-zinc-200 hover:border-cyan-400/40 hover:bg-cyan-400/[0.08] hover:text-white transition-colors"
            >
              <MapPin size={14} /> Map View
            </button>
          
          </div>
        </div>

        {/* ── HERO – CENTERED ── */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-3 text-[12px] uppercase tracking-widest font-bold text-cyan-400/70 mx-auto">
            Incident Management
          </div>
          <h1 className="mb-2 text-4xl md:text-5xl font-black tracking-tight text-white">
            Active Incidents
          </h1>
          <p className="text-[13px] font-semibold tracking-wide text-zinc-400 uppercase mx-auto">
            REAL-TIME REPORTS · SEVERITY TRIAGE · LIVE STATUS TRACKING
          </p>
        </div>

        {/* ── STATS CARDS ── */}
        {!loading && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: totalCount,    label: "Total",       color: "cyan-400"   },
              { val: activeCount,   label: "In Progress", color: "orange-400" },
              { val: criticalCount, label: "Critical",    color: "red-400"    },
              { val: newCount,      label: "New",         color: "cyan-300"   },
            ].map(s => (
              <div
                key={s.label}
                className={`rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-center`}
              >
                <div className={`text-3xl font-black text-${s.color}`}>{s.val}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPORT FORM (collapsible) ── */}
        <div className="mb-10 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">Report New Incident</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {formOpen ? "Fill details below" : "Click to expand form"}
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-zinc-400 ${formOpen ? "rotate-180" : ""}`}
            />
          </button>

          {formOpen && (
            <>
              <div className="border-t border-white/[0.08] p-6">
                <IncidentForm onCreated={handleCreated} />
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-6 py-4">
                {[
                  { dot: "bg-emerald-400", label: "24/7 Monitoring" },
                  { dot: "bg-cyan-400",    label: "AI Triage"       },
                  { dot: "bg-orange-400",  label: "Instant Alerts"  },
                ].map(c => (
                  <div
                    key={c.label}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400"
                  >
                    <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                    {c.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-zinc-300">
              {loading ? "Loading…" : `${incidents.length} reports`}
            </span>
            {loading && (
              <Loader2 size={16} className="animate-spin text-cyan-400" />
            )}
          </div>

          <div className="relative min-w-[180px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Filter size={14} />
            </span>
            <select
              className="appearance-none w-full rounded-lg border border-white/[0.10] bg-white/[0.05] pl-10 pr-10 py-2.5 text-[14px] text-zinc-100 outline-none focus:border-cyan-400/40"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── INCIDENT LIST ── */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-16 text-center">
            <AlertCircle size={64} className="mx-auto mb-6 text-zinc-600 opacity-60" />
            <p className="text-2xl font-bold text-zinc-300 mb-3">No incidents found</p>
            <p className="text-[15px] text-zinc-500">
              {statusFilter === "all"
                ? "No incidents reported yet"
                : `No incidents with status "${statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {incidents.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => navigate(`/app/incidents/${inc.id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}