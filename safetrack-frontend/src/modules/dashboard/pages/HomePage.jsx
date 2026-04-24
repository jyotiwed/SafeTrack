// src/modules/dashboard/pages/HomePage.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listIncidents, listNearbyIncidents } from "../../incidents/api/incidentsApi";
import { listTasks } from "../../tasks/api/taskApi";
import { fetchProfile } from "../../auth/api/authApi";
import IncidentForm from "../../incidents/components/IncidentForm";
import { Map, BarChart2, BookOpen, Siren, RefreshCw, Plus, X, AlertTriangle } from "lucide-react";

/* ─── Configuration ──────────────────────────────────────────────────────── */
const MAX_INCIDENTS_DISPLAY = 5;  // Show only 5 recent incidents
const MAX_TASKS_DISPLAY = 5;      // Show only 5 recent tasks

/* ─── Page section images ─────────────────────────────────────────────────── */
const PAGE_SECTION_IMAGES = {
  hero:       "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=85",
  map:        "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=85",
  analytics:  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=85",
  guidelines: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=85",
  sos:        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=85",
};

function getSectionImage(section) {
  return PAGE_SECTION_IMAGES[section] || PAGE_SECTION_IMAGES.hero;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const SEV_DOT = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-cyan-400",
  low:      "bg-emerald-400",
};

const TASK_BADGE = {
  in_progress: "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
  pending:     "border-orange-500/20 bg-orange-500/10 text-orange-400",
  completed:   "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  cancelled:   "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
};

const TASK_LABEL = {
  in_progress: "In Progress",
  pending:     "Pending",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

/* ─── Skeleton ──────────────────────────────────────────────────────── */
function Skel({ n = 4 }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-white/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-2 w-1/2 rounded bg-white/[0.04]" />
          </div>
          <div className="h-4 w-16 rounded bg-white/[0.06]" />
        </div>
      ))}
    </>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
const ACCENT_CLS = {
  red:    "before:bg-red-500     border-red-500/[0.12]     bg-red-500/[0.03]",
  orange: "before:bg-orange-500  border-orange-500/[0.12]  bg-orange-500/[0.03]",
  cyan:   "before:bg-cyan-400    border-cyan-400/[0.12]    bg-cyan-400/[0.03]",
  green:  "before:bg-emerald-400 border-emerald-400/[0.12] bg-emerald-400/[0.03]",
};

function StatCard({ emoji, label, value, note, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-6 before:absolute before:inset-x-0 before:top-0 before:h-1 ${ACCENT_CLS[accent] || "border-white/[0.06] bg-white/[0.025]"}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-xl">{emoji}</div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mb-2 text-4xl font-bold leading-none tracking-tight text-white">{value}</p>
      <p className="text-sm text-zinc-600">{note}</p>
    </div>
  );
}

/* ─── Feature Card (Map, Analytics, Guidelines, SOS) ─────────────────────── */
// eslint-disable-next-line no-unused-vars
function FeatureCard({ icon: Icon, label, description, section, colorClass, onClick }) {
  const imgSrc = getSectionImage(section);
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] cursor-pointer transition-all duration-300 hover:border-white/[0.14] hover:scale-[1.02]"
    >
      {/* Background image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={imgSrc}
          alt={label}
          className="h-full w-full object-cover opacity-30 group-hover:opacity-45 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#09090b]" />
        <div className={`absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {/* Content section with more spacing */}
      <div className="px-4 pb-4 pt-3">
        <p className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-white transition-colors">{label}</p>
        <p className="mt-2 text-xs text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

/* ─── Report Incident Modal — wraps the real IncidentForm ────────────────── */
function ReportIncidentModal({ isOpen, onClose, onSuccess }) {
  const overlayRef = useRef(null);

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCreated = (incident) => {
    setTimeout(() => {
      onClose();
      onSuccess?.(incident);
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.09] bg-[#0f0f11] shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Report Incident</h2>
              <p className="text-xs text-zinc-400">Submit a new emergency to command</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <IncidentForm onCreated={handleCreated} />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.05] px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Fields marked * are required</p>
          <button
            onClick={onClose}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Incident Row (NO IMAGE - Larger Font) ───────────────────────────────── */
function IncidentRow({ inc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-4 border-b border-white/[0.04] px-6 py-4 hover:bg-white/[0.02] transition-colors last:border-b-0"
    >
      {/* Severity Indicator Dot */}
      <div className={`h-3 w-3 shrink-0 rounded-full ${SEV_DOT[inc.severity] || "bg-cyan-400"} shadow-lg shadow-white/10`} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-base font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors leading-snug">{inc.title}</p>
        <div className="flex items-center gap-3 mt-1">
          {inc.type && (
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{inc.type}</span>
          )}
          {inc.severity && (
            <>
              <span className="text-zinc-600">•</span>
              <span className={`text-xs font-medium uppercase tracking-wide ${
                inc.severity === 'critical' ? 'text-red-400' :
                inc.severity === 'high' ? 'text-orange-400' :
                inc.severity === 'medium' ? 'text-cyan-400' :
                'text-emerald-400'
              }`}>
                {inc.severity}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Time */}
      <span className="shrink-0 text-sm font-medium text-zinc-500 tabular-nums">{timeAgo(inc.created_at)}</span>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function HomePage({
  isLoading: controlledLoading,
  incidents: controlledIncidents,
  onRefresh,
}) {
  const navigate = useNavigate();

  const [internalIncidents, setInternalIncidents] = useState([]);
  const [internalLoading,   setInternalLoading]   = useState(true);

  const incidents = controlledIncidents !== undefined ? controlledIncidents : internalIncidents;
  const loading   = controlledLoading   !== undefined ? controlledLoading   : internalLoading;

  const [tasks,           setTasks]           = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const [error,           setError]           = useState(null);
  const [time,            setTime]            = useState(new Date());
  const [showReport,      setShowReport]      = useState(false);

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* data fetch */
  useEffect(() => {
    if (controlledLoading !== undefined || controlledIncidents !== undefined) return;
    let cancelled = false;
    (async () => {
      setInternalLoading(true);
      setError(null);
      try {
        const profile = await fetchProfile().catch(() => null);
        const [incData, taskData] = await Promise.all([
          listIncidents({ limit: 10 }),
          listTasks({ limit: 50 }),
        ]);
        if (!cancelled) {
          setInternalIncidents(Array.isArray(incData) ? incData : []);
          const allTasks = Array.isArray(taskData) ? taskData : [];
          let displayedTasks = allTasks;
          if (profile && profile.id) {
            const myTasks = allTasks.filter(t => t.assignee_id === profile.id);
            if (myTasks.length > 0) displayedTasks = myTasks;
          }
          displayedTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setTasks(displayedTasks);
        }
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async pos => {
            if (cancelled) return;
            try {
              const nb = await listNearbyIncidents({
                latitude:      pos.coords.latitude,
                longitude:     pos.coords.longitude,
                radius_meters: 5000,
                limit:         10,
              });
              if (!cancelled) setNearbyIncidents(Array.isArray(nb) ? nb : []);
            } catch { /* silent */ }
          });
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (!cancelled) setError("Failed to load data. Please try again.");
      } finally {
        if (!cancelled) setInternalLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [controlledLoading, controlledIncidents]);

  const handleIncidentReported = (newIncident) => {
    if (!controlledIncidents) {
      setInternalIncidents(prev => [newIncident, ...prev]);
    }
    onRefresh?.();
  };

  const openCount   = incidents.length;
  const activeCount = tasks.filter(t => t.status === "in_progress").length;
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const navBtn = "flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors";
  const handleRefresh = () => (onRefresh ? onRefresh() : window.location.reload());

 
  const displayedIncidents = incidents.slice(0, MAX_INCIDENTS_DISPLAY);
  const displayedTasks = tasks.slice(0, MAX_TASKS_DISPLAY);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">

        {/* TOPBAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] py-6 mb-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-cyan-400/[0.18] bg-cyan-400/[0.07] px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">SafeTrack ICC</span>
            </div>
            <span className="text-sm font-medium tracking-wide text-zinc-400">{dateStr} · {timeStr}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={navBtn} onClick={() => navigate("/app/incidents/map")}><Map size={16} /> Map</button>
            <button className={navBtn} onClick={() => navigate("/app/analytics")}><BarChart2 size={16} /> Analytics</button>
            <button className={navBtn} onClick={() => navigate("/app/guidelines")}><BookOpen size={16} /> Guidelines</button>
            <button
              onClick={() => navigate("/app/sos-trigger")}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-4 py-2 text-sm font-medium text-red-400 hover:border-red-500/55 hover:bg-red-500/[0.13] hover:text-red-500 transition-colors"
            >
              <Siren size={16} /> SOS
            </button>
            <button onClick={handleRefresh} aria-label="Refresh" className={navBtn}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* HERO BANNER with emergency image */}
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-white/[0.07]">
          {/* Background image */}
          <img
            src={PAGE_SECTION_IMAGES.hero}
            alt="Emergency Command"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/60 via-transparent to-transparent" />
          {/* Subtle red glow top-right */}
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-cyan-400/5 blur-2xl" />

          {/* Content */}
          <div className="relative flex flex-wrap items-end justify-between gap-6 px-8 py-10 sm:px-10 sm:py-12">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400/80">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Command & Control · Live
              </div>
              <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Incident{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                  Command Center
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium tracking-widest text-zinc-400 uppercase">
                Real-Time Monitoring · Critical Alerts · Response Coordination
              </p>

              {/* Live status pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Systems Online
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                  {loading ? "Loading…" : `${incidents.length} Active Incidents`}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                  {loading ? "…" : `${activeCount} Tasks In Progress`}
                </span>
              </div>
            </div>

            {/* REPORT INCIDENT CTA */}
            <div className="flex flex-col items-end gap-3">
              <button
                onClick={() => setShowReport(true)}
                className="group flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/[0.12] px-7 py-4 text-sm font-bold text-red-400 hover:border-red-400/60 hover:bg-red-500/[0.20] hover:text-red-300 transition-all duration-200 shadow-xl shadow-red-500/10 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/15 group-hover:bg-red-500/25 transition-colors">
                  <Plus size={16} />
                </div>
                <span>Report Incident</span>
              </button>
              <p className="text-xs text-zinc-500">Submit emergency to command</p>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/25 bg-red-500/[0.12] px-4 py-3 text-sm text-red-400">
            <span>⚠ {error}</span>
            <button onClick={handleRefresh} className="rounded-lg border border-red-500/25 bg-transparent px-3 py-1 font-bold hover:bg-red-500/10 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard emoji="🚨" label="Open Incidents"  value={loading ? "—" : openCount}              note={loading ? "Loading…" : `${incidents.length} reported`} accent="red"    />
          <StatCard emoji="⚡" label="Active Tasks"    value={loading ? "—" : activeCount}            note={loading ? "Loading…" : `${tasks.length} total`}        accent="orange" />
          <StatCard emoji="📍" label="Nearby Alerts"   value={loading ? "—" : nearbyIncidents.length} note="Within 5 km radius"                                    accent="cyan"   />
          <StatCard emoji="✅" label="System Health"   value="Normal"                                  note="All systems operational"                               accent="green"  />
        </div>

        {/* PANELS */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Recent Incidents - Limited Display */}
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
              <span className="text-base font-bold uppercase tracking-wide text-zinc-400">Recent Incidents</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/[0.12] transition-colors"
                >
                  <Plus size={11} /> Report
                </button>
                <button onClick={() => navigate("/app/incidents")} className="border-none bg-transparent text-sm font-medium text-cyan-400/60 hover:text-cyan-400 transition-colors cursor-pointer">
                  View All →
                </button>
              </div>
            </div>
            {loading ? (
              <div data-testid="loading-spinner"><Skel n={5} /></div>
            ) : displayedIncidents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10">
                <p className="text-sm text-zinc-500">No incidents reported</p>
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Plus size={12} /> Report First Incident
                </button>
              </div>
            ) : (
              <>
                {displayedIncidents.map(inc => (
                  <IncidentRow
                    key={inc.id}
                    inc={inc}
                    onClick={() => navigate(`/app/incidents/${inc.id}`)}
                  />
                ))}
                {/* Show count if more incidents exist */}
                {incidents.length > MAX_INCIDENTS_DISPLAY && (
                  <div className="px-6 py-3 border-t border-white/[0.04]">
                    <button 
                      onClick={() => navigate("/app/incidents")}
                      className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View {incidents.length - MAX_INCIDENTS_DISPLAY} more incidents →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* My Tasks / All Tasks - Limited Display */}
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
              <span className="text-base font-bold uppercase tracking-wide text-zinc-400">
                {tasks.some(t => t.assignee_id) ? "My Tasks" : "All Active Tasks"}
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-400/[0.18] bg-cyan-400/[0.08] px-3 py-1 text-xs font-mono text-cyan-400">
                  {loading ? "…" : tasks.length}
                </span>
                <button onClick={() => navigate("/app/tasks")} className="border-none bg-transparent text-sm font-medium text-cyan-400/60 hover:text-cyan-400 transition-colors cursor-pointer">
                  All →
                </button>
              </div>
            </div>
            {loading ? (
              <div data-testid="loading-spinner"><Skel n={4} /></div>
            ) : displayedTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-zinc-500">No tasks available</p>
            ) : (
              <>
                {displayedTasks.map(task => (
                  <div key={task.id} onClick={() => navigate("/app/tasks")}
                    className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/[0.04] px-6 py-4 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-base font-semibold text-zinc-200">{task.title}</p>
                      <p className="truncate text-sm text-zinc-500 mt-1">{task.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${TASK_BADGE[task.status] || TASK_BADGE.pending}`}>
                      {TASK_LABEL[task.status] || "PENDING"}
                    </span>
                  </div>
                ))}
                {/* Show count if more tasks exist */}
                {tasks.length > MAX_TASKS_DISPLAY && (
                  <div className="px-6 py-3 border-t border-white/[0.04]">
                    <button 
                      onClick={() => navigate("/app/tasks")}
                      className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View {tasks.length - MAX_TASKS_DISPLAY} more tasks →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* QUICK ACTIONS with images */}
        <div className="mt-12">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Quick Actions</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FeatureCard
              icon={Map}
              label="Incident Map"
              description="Live geospatial view"
              section="map"
              colorClass="bg-cyan-500/20"
              onClick={() => navigate("/app/incidents/map")}
            />
            <FeatureCard
              icon={BarChart2}
              label="Analytics"
              description="Trends & reports"
              section="analytics"
              colorClass="bg-blue-500/20"
              onClick={() => navigate("/app/analytics")}
            />
            <FeatureCard
              icon={Siren}
              label="Trigger SOS"
              description="Emergency alert"
              section="sos"
              colorClass="bg-red-500/20"
              onClick={() => navigate("/app/sos-trigger")}
            />
            <FeatureCard
              icon={BookOpen}
              label="Guidelines"
              description="Protocols & SOPs"
              section="guidelines"
              colorClass="bg-amber-500/20"
              onClick={() => navigate("/app/guidelines")}
            />
          </div>
        </div>

      </div>

      {/* REPORT INCIDENT MODAL */}
      <ReportIncidentModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onSuccess={handleIncidentReported}
      />
    </div>
  );
}