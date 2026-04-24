import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertOctagon, MapPin, Calendar, ImageIcon,
  ChevronLeft, ExternalLink, Copy, Clock,
  User, Activity, Loader2, CheckCircle, AlertTriangle,
  BarChart3, Brain, Truck
} from "lucide-react";
import { getIncident, updateIncident } from "../api/incidentsApi.js";
import IncidentTasksPanel from "../../tasks/components/IncidentTasksPanel.jsx";
import { PredictionsPanel as RiskPredictionPanel } from "../../predictions/PredictionsPanel.jsx";
import { IncidentPredictionsPanel } from "../../incident-predictions/components/IncidentPredictionsPanel.jsx";
import ResourceDemandForm from "../../resourcePredictions/ResourceDemandForm.jsx";

const STATUS_VALUES = ["new", "verified", "in_progress", "resolved", "closed"];
const SEV_STYLE = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", label: "CRITICAL" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.25)", label: "HIGH" },
  medium:   { color: "#facc15", bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.25)", label: "MEDIUM" },
  low:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)", label: "LOW" },
  info:     { color: "#00c4ff", bg: "rgba(0,196,255,0.10)", border: "rgba(0,196,255,0.25)", label: "INFO" },
};
const STATUS_STYLE = {
  new:         { color: "#00c4ff", bg: "rgba(0,196,255,0.10)", border: "rgba(0,196,255,0.25)" },
  verified:    { color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  in_progress: { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.25)" },
  resolved:    { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
  closed:      { color: "rgba(228,228,231,0.4)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
};
const getSev = s => SEV_STYLE[s] || SEV_STYLE.info;
const getStatus = s => STATUS_STYLE[s] || STATUS_STYLE.closed;

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const numericId = Number(incidentId);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!incidentId || Number.isNaN(numericId)) { setLoadError("Invalid incident ID"); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true); setLoadError(null);
      try {
        const data = await getIncident(numericId);
        if (!cancelled) setIncident(data);
      } catch (err) {
        if (!cancelled) setLoadError("Failed to load incident");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [incidentId, numericId]);

  async function handleStatusChange(newStatus) {
    if (!incident || incident.status === newStatus) return;
    setUpdating(true); setUpdateError(null);
    try {
      const updated = await updateIncident(numericId, { status: newStatus });
      setIncident(updated);
    } catch (err) {
      setUpdateError("Failed to update status");
    } finally { setUpdating(false); }
  }

  function copyCoordinates() {
    if (!incident?.latitude || !incident?.longitude) return;
    navigator.clipboard.writeText(`${incident.latitude}, ${incident.longitude}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const wrap = "min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-cyan-500/30";

  if (loading) return (
    <div className={wrap}>
      <div className="flex h-screen items-center justify-center gap-3 font-mono text-sm text-zinc-500">
        <Loader2 size={18} className="animate-spin text-cyan-400" /> Loading Incident Data...
      </div>
    </div>
  );

  if (loadError || !incident) return (
    <div className={wrap}>
      <div className="flex h-screen items-center justify-center gap-3 font-mono text-sm text-red-400">
        <AlertOctagon size={18} /> {loadError}
      </div>
    </div>
  );

  const sevStyle = getSev(incident.severity);
  const stStyle = getStatus(incident.status);

  return (
    <div className={wrap}>
      
         <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">
        
        {/* HEADER NAV */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate("/app/incidents")}
            className="group flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-cyan-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-cyan-400/10">
              <ChevronLeft size={16} />
            </div>
            Back to Incidents
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            SAFETRACK ICC LIVE
          </div>
        </div>

        {/* ================= SECTION 1: INCIDENT HERO ================= */}
        <section className="mb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold tracking-widest text-zinc-500">INCIDENT #{incident.id}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700"></span>
                <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors"
                  style={{ color: sevStyle.color, borderColor: sevStyle.border, background: sevStyle.bg }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: sevStyle.color }} /> {sevStyle.label}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors"
                  style={{ color: stStyle.color, borderColor: stStyle.border, background: stStyle.bg }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: stStyle.color }} /> {incident.status.replace("_", " ")}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{incident.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-zinc-600" />
                  <span>Reported by <span className="text-zinc-300">User #{incident.reporter_id}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-600" />
                  <span>{fmtDate(incident.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-600" />
                  <span>Updated {fmtDate(incident.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="w-full md:w-auto">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_VALUES.map(s => {
                    const style = getStatus(s);
                    const isActive = incident.status === s;
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)} disabled={updating || isActive}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${isActive ? 'shadow-lg shadow-black/20' : 'hover:bg-white/5'}`}
                        style={isActive ? { color: style.color, background: style.bg, borderColor: style.border, border: '1px solid' } : { color: '#71717a', border: '1px solid transparent' }}>
                        {s.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
                {updateError && <p className="mt-2 text-xs text-red-400">{updateError}</p>}
              </div>
            </div>
          </div>

          {/* Description & Location Row */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                  <Activity size={14} /> Description
                </h3>
                <p className="rounded-xl bg-white/[0.02] p-5 text-base leading-relaxed text-zinc-300 border border-white/5">
                  {incident.description || "No description provided."}
                </p>
              </div>
              
              {incident.media_urls?.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                    <ImageIcon size={14} /> Media Evidence
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {incident.media_urls.map((url, i) => (
                      <a key={i} href={normalizeUrl(url)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-400 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10">
                        <ExternalLink size={14} /> View Media {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                  <MapPin size={14} /> Location
                </h3>
                <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  {incident.address && (
                    <p className="mb-4 text-sm text-zinc-300">{incident.address}</p>
                  )}
                  {incident.latitude && incident.longitude && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-black/20 p-2 font-mono text-xs text-zinc-400">
                        <span>{incident.latitude}, {incident.longitude}</span>
                        <button onClick={copyCoordinates} className="text-zinc-500 hover:text-white">
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <a href={`/app/incidents/map?lat=${incident.latitude}&lng=${incident.longitude}`} 
                          className="flex items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10">
                          <MapPin size={12} /> Internal Map
                        </a>
                        <a href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10">
                          <ExternalLink size={12} /> Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* ================= SECTION 2: TASKS ================= */}
        <section className="mb-16 scroll-mt-24" id="tasks">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Linked Tasks</h2>
              <p className="text-sm text-zinc-400">Manage follow-up actions and assignments</p>
            </div>
          </div>
          <div className="rounded-2xl">
            <IncidentTasksPanel incidentId={incident.id} />
          </div>
        </section>

        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* ================= SECTION 3: AI RISK PREDICTIONS ================= */}
         <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">
        <section className="mb-16 scroll-mt-24" id="risk-predictions">
          <div className="mb-6 flex items-center gap-3">
             
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Risk Assessment</h2>
              <p className="text-sm text-zinc-400">Real-time probability and confidence scoring</p>
            </div>
          </div>
          <div className="rounded-2xl">
            <RiskPredictionPanel incidentId={incident.id} />
          </div>
        </section>
        </div>

        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* ================= SECTION 4: INCIDENT FORECAST (Charts) ================= */}
        <section className="mb-16 scroll-mt-24" id="forecast">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Incident Forecast & Budget</h2>
              <p className="text-sm text-zinc-400">Resource allocation and financial impact projection</p>
            </div>
          </div>
          <div className="rounded-2xl">
            <IncidentPredictionsPanel incidentId={incident.id} />
          </div>
        </section>

        <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* ================= SECTION 5: RESOURCE DEMAND (Bottom) ================= */}
        <section className="mb-24 scroll-mt-24" id="resource-demand">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Resource Demand Simulator</h2>
              <p className="text-sm text-zinc-400">Calculate logistics for hypothetical scenarios</p>
            </div>
          </div>
          <div className="rounded-2xl">
            <ResourceDemandForm incidentId={incident.id} />
          </div>
        </section>
        </div>

      </div>
    
  );
}