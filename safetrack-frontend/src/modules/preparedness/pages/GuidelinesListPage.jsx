// src/modules/preparedness/pages/GuidelinesListPage.jsx
import { useEffect, useState } from "react";
import { listGuidelines } from "../api/preparednessApi";
import CreateGuidelineForm from "../components/CreateGuidelineForm";
import {
  AlertCircle, Loader2, Search, AlertTriangle,
  Clock, Globe, X, ChevronDown, ClipboardList,
  RotateCcw, Filter, Plus,
} from "lucide-react";

/* ─── Config ──────────────────────────────────────────────────────────────── */
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

const PHASE_OPTIONS = [
  { value: "",       label: "All Phases"  },
  { value: "before", label: "Before"      },
  { value: "during", label: "During"      },
  { value: "after",  label: "After"       },
];

const HAZARD_OPTIONS = [
  { value: "",           label: "All Hazards"  },
  { value: "flood",      label: "Flood"        },
  { value: "cyclone",    label: "Cyclone"      },
  { value: "earthquake", label: "Earthquake"   },
  { value: "heatwave",   label: "Heatwave"     },
  { value: "landslide",  label: "Landslide"    },
  { value: "generic",    label: "Generic"      },
];

/* ─── Keyword highlighter ─────────────────────────────────────────────────── */
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

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function GuidelinesListPage() {
  const [phase,      setPhase]      = useState("");
  const [hazard,     setHazard]     = useState("");
  const [language,   setLanguage]   = useState("en");
  const [guidelines, setGuidelines] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listGuidelines({
        phase:        phase    || undefined,
        hazardType:   hazard   || undefined,
        languageCode: language || undefined,
      });
      setGuidelines(Array.isArray(data) ? data : []);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load guidelines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function handleReset() {
    setPhase("");
    setHazard("");
    setLanguage("en");
  }

  return (
    <div className="min-h-screen bg-black px-6 pb-20 text-zinc-100 max-sm:px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
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

        {/* ── HERO ── */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center gap-3 text-[12px] uppercase tracking-widest font-bold text-cyan-400/70">
            Preparedness Library
          </div>
          <h1 className="mb-2 text-3xl md:text-4xl font-bold tracking-tight text-white">Preparedness Guidelines</h1>
          <p className="text-[13px] font-semibold tracking-wide text-zinc-400 uppercase">
            FILTER · MANAGE · BROWSE SAFETY GUIDELINES
          </p>
        </div>

        {/* ── CREATE PANEL ── */}
        <div className="relative mb-8 overflow-hidden rounded-xl border border-cyan-400/[0.20] bg-cyan-400/[0.04] p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setShowCreate(x => !x)}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/15 text-cyan-300">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">Create New Guideline</p>
                <p className="text-[11px] uppercase tracking-wider text-cyan-400/60 mt-1">Add to library</p>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowCreate(x => !x); }}
              className="flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.08] px-5 py-2 text-[13px] font-bold text-cyan-300 hover:bg-cyan-400/[0.15] transition-colors"
            >
              {showCreate ? "Hide Form" : "New Guideline"}
              <ChevronDown size={14} className={showCreate ? "rotate-180" : ""} />
            </button>
          </div>

          {showCreate && (
            <div className="mt-6 border-t border-white/[0.08] pt-6">
              <CreateGuidelineForm onCreated={() => { load(); setShowCreate(false); }} />
            </div>
          )}
        </div>

        {/* ── FILTER PANEL ── */}
        <div className="mb-8 rounded-xl border border-white/[0.09] bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Filter size={16} />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-wider text-zinc-300">Filter Guidelines</span>
          </div>

          <form onSubmit={e => { e.preventDefault(); load(); }}>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end max-md:grid-cols-[1fr_1fr] max-sm:grid-cols-1">
              <div>
                <label className={labelCls}><Clock size={12} /> Phase</label>
                <select className={inputCls} value={phase} onChange={e => setPhase(e.target.value)}>
                  {PHASE_OPTIONS.map(o => (
                    <option key={o.value || "all"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}><AlertTriangle size={12} /> Hazard</label>
                <select className={inputCls} value={hazard} onChange={e => setHazard(e.target.value)}>
                  {HAZARD_OPTIONS.map(o => (
                    <option key={o.value || "all"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}><Globe size={12} /> Language</label>
                <input className={inputCls} value={language} onChange={e => setLanguage(e.target.value)} placeholder="en" />
              </div>
              <div className="flex items-end gap-3 max-md:col-span-2 max-sm:col-span-1">
                <button type="button" onClick={load} disabled={loading} title="Refresh"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-zinc-300 hover:border-cyan-400/30 hover:text-cyan-200 transition-colors disabled:opacity-50">
                  <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
                </button>
                <button type="button" onClick={handleReset} title="Reset"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-zinc-300 hover:border-red-400/30 hover:text-red-300 transition-colors">
                  <X size={16} />
                </button>
                <button type="submit"
                  className="flex h-11 flex-1 items-center justify-center gap-2.5 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.10] px-6 text-[14px] font-bold text-white hover:bg-cyan-400/[0.20] transition-colors whitespace-nowrap"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.10] px-5 py-3 text-[14px] font-semibold text-red-200">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* ── RESULTS BAR ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] uppercase tracking-wider font-semibold text-zinc-400">All Guidelines</span>
          {loading && <Loader2 size={15} className="animate-spin text-cyan-400" />}
          {!loading && (
            <span className="text-[14px] font-semibold text-cyan-300">
              {guidelines.length} guideline{guidelines.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── LIST ── */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        )}

        {!loading && guidelines.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-20 text-center">
            <ClipboardList size={56} className="opacity-20 text-zinc-500" />
            <p className="text-[18px] font-bold text-zinc-300">No guidelines found</p>
            <p className="text-[14px] text-zinc-500">Try different filters or create a new guideline</p>
          </div>
        )}

        {!loading && guidelines.length > 0 && (
          <div className="flex flex-col gap-4">
            {guidelines.map(g => <GuidelineCard key={g.id} g={g} />)}
          </div>
        )}

      </div>
    </div>
  );
}