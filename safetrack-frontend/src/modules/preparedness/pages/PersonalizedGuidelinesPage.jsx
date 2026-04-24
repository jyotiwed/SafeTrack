// src/modules/preparedness/pages/PersonalizedGuidelinesPage.jsx
import { useState } from "react";
import { getPersonalizedGuidelines } from "../api/preparednessApi";
import {
  MapPin, AlertTriangle, Clock, Globe, Ruler,
  Loader2, Search, AlertCircle, ChevronDown, Navigation,
} from "lucide-react";

const HAZARD_CFG = {
  flood:      { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.30)"  },
  cyclone:    { color: "#c084fc", bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.30)" },
  earthquake: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.30)"   },
  heatwave:   { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.30)"  },
  landslide:  { color: "#a3e635", bg: "rgba(163,230,53,0.12)",  border: "rgba(163,230,53,0.30)"  },
  generic:    { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.30)" },
};

const PHASE_CFG = {
  before: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.30)"  },
  during: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.30)"  },
  after:  { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.30)"  },
};

const KEYWORDS = [
  "evacuate","evacuation","emergency","warning","danger","alert","critical","immediately",
  "do not","avoid","shelter","safe","escape","flood","cyclone","earthquake","heatwave","landslide",
  "call","contact","rescue","medical","hospital","first aid","fire","water","food","supplies",
  "stay","leave","move","protect","secure","check","report","help",
];

function HighlightedText({ text }) {
  if (!text) return null;
  const pattern = new RegExp(
    `(${KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part)
          ? <strong key={i} className="text-zinc-100 font-bold">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/* ─── Shared input classes ────────────────────────────────────────────────── */
const inputCls = "w-full rounded-lg border border-white/[0.10] bg-white/[0.05] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-cyan-400/40 appearance-none";
const labelCls = "flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5";

/* ─── Guideline Card ──────────────────────────────────────────────────────── */
function GuidelineCard({ g }) {
  const [expanded, setExpanded] = useState(false);
  const phase  = PHASE_CFG[g.phase]        || PHASE_CFG.before;
  const hazard = HAZARD_CFG[g.hazard_type] || HAZARD_CFG.generic;
  const isLong = (g.content?.length || 0) > 220;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition-all hover:border-white/[0.15] hover:bg-white/[0.06]">
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0 opacity-80" style={{ background: phase.color }} />
        <div className="flex flex-1 items-start justify-between gap-4 px-6 py-4 max-sm:flex-col max-sm:gap-3">
          <span className="flex-1 text-[16px] font-bold leading-tight text-white">{g.title}</span>
          <div className="flex flex-wrap justify-end gap-2 max-sm:justify-start">
            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide"
              style={{ color: phase.color, background: phase.bg, borderColor: phase.border }}
            >
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: phase.color }} />
              {g.phase.toUpperCase()}
            </span>
            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide"
              style={{ color: hazard.color, background: hazard.bg, borderColor: hazard.border }}
            >
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: hazard.color }} />
              {g.hazard_type.toUpperCase()}
            </span>
            {g.language_code && (
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1 text-[11px] font-bold text-zinc-300">
                {g.language_code.toUpperCase()}
              </span>
            )}
            {g.match_score != null && (
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-bold text-emerald-300">
                {(g.match_score * 100).toFixed(0)}% match
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 pb-5 pt-1">
        <div className="mb-4 h-px bg-white/[0.08]" />
        <p className={`text-[14.5px] leading-relaxed text-zinc-300 [&_strong]:text-white ${expanded ? "" : "line-clamp-4"}`}>
          <HighlightedText text={g.content} />
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(x => !x)}
            className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            {expanded ? "Show Less" : "Read More"}
            <ChevronDown size={14} className={expanded ? "rotate-180" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function PersonalizedGuidelinesPage() {
  const [latitude,  setLatitude]  = useState("");
  const [longitude, setLongitude] = useState("");
  const [hazard,    setHazard]    = useState("flood");
  const [phase,     setPhase]     = useState("before");
  const [language,  setLanguage]  = useState("en");
  const [radius,    setRadius]    = useState(50000);
  const [results,   setResults]   = useState([]);
  const [searched,  setSearched]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [locating,  setLocating]  = useState(false);

  // ─── These two lines were missing ───────────────────────────────────────
  const activePhase  = PHASE_CFG[phase]   || PHASE_CFG.before;
  const activeHazard = HAZARD_CFG[hazard] || HAZARD_CFG.generic;

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      err => {
        console.error("Geolocation error:", err);
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await getPersonalizedGuidelines({
        latitude:      parseFloat(latitude),
        longitude:     parseFloat(longitude),
        hazard_type:   hazard,
        phase,
        language_code: language,
        radius_meters: Number(radius),
      });
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load personalized guidelines");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-6 pb-20 text-zinc-100 max-sm:px-4" style={{ fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="mx-auto max-w-5xl">

        {/* ── TOPBAR ── */}
        <div className="flex items-center justify-between border-b border-white/[0.08] py-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-[13px] font-bold tracking-widest text-cyan-400 uppercase">SafeTrack ICC</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-5 py-2 text-[14px] font-semibold text-zinc-200 hover:border-cyan-400/40 hover:bg-cyan-400/[0.08] hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* ── HERO (centered) ── */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-3 text-[12px] uppercase tracking-widest font-bold text-cyan-400/70 mx-auto">
            Location-Based Preparedness
          </div>
          <h1 className="mb-2 text-3xl md:text-5xl font-bold tracking-tight text-white">
            Personalized Guidelines
          </h1>
          <p className="text-[13px] font-semibold tracking-wide text-zinc-400 uppercase mx-auto">
            TAILORED TO LOCATION · HAZARD · PHASE
          </p>
        </div>

        {/* ── FORM PANEL ── */}
        <div className="relative mb-8 overflow-hidden rounded-xl border border-cyan-400/[0.20] bg-cyan-400/[0.04] p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/15 text-cyan-300">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">Search Parameters</p>
              <p className="text-[11px] uppercase tracking-wider text-cyan-400/60 mt-1">Location & hazard details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Coordinates + GPS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className={labelCls}><MapPin size={12} /> Latitude</label>
                <input
                  className={inputCls}
                  required
                  type="number"
                  step="0.000001"
                  min={-90}
                  max={90}
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label className={labelCls}><MapPin size={12} /> Longitude</label>
                <input
                  className={inputCls}
                  required
                  type="number"
                  step="0.000001"
                  min={-180}
                  max={180}
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  placeholder="72.8777"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-5 text-[14px] font-semibold text-zinc-200 hover:border-emerald-400/30 hover:bg-emerald-400/[0.08] hover:text-emerald-300 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                  Use My Location
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className={labelCls}><AlertTriangle size={12} /> Hazard</label>
                <select
                  className={inputCls}
                  value={hazard}
                  onChange={e => setHazard(e.target.value)}
                  style={{ borderColor: activeHazard.border, color: activeHazard.color }}
                >
                  {["flood", "cyclone", "earthquake", "heatwave", "landslide", "generic"].map(h => (
                    <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}><Clock size={12} /> Phase</label>
                <select
                  className={inputCls}
                  value={phase}
                  onChange={e => setPhase(e.target.value)}
                  style={{ borderColor: activePhase.border, color: activePhase.color }}
                >
                  {["before", "during", "after"].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}><Globe size={12} /> Language</label>
                <input className={inputCls} value={language} onChange={e => setLanguage(e.target.value)} placeholder="en" />
              </div>
              <div>
                <label className={labelCls}><Ruler size={12} /> Radius (m)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={radius}
                  onChange={e => setRadius(e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.10] px-8 text-[14px] font-bold text-white hover:bg-cyan-400/[0.20] transition-colors whitespace-nowrap disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.10] px-5 py-3 text-[14px] font-semibold text-red-200">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* ── RESULTS ── */}
        {(searched || loading) ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px] uppercase tracking-wider font-semibold text-zinc-400">Results</span>
              {loading && <Loader2 size={15} className="animate-spin text-cyan-400" />}
              {!loading && (
                <span className="text-[14px] font-semibold text-cyan-300">
                  {results.length} guideline{results.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl border border-white/[0.06] bg-white/[0.03]" />
                ))}
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-16 text-center">
                <AlertCircle size={48} className="opacity-20 text-zinc-500" />
                <p className="text-[18px] font-bold text-zinc-300">No guidelines found</p>
                <p className="text-[14px] text-zinc-500">Try adjusting location, radius or hazard type</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="flex flex-col gap-4">
                {results.map(g => <GuidelineCard key={g.id} g={g} />)}
              </div>
            )}
          </>
        ) : null}

      </div>
    </div>
  );
}