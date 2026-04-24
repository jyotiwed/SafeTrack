// src/modules/guidelines/components/CreateGuidelineForm.jsx
import { useState } from "react";
import { createGuideline } from "../api/preparednessApi";
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, Zap } from "lucide-react";

/* ─── Options ─────────────────────────────────────────────────────────────── */
const PHASE_OPTIONS = [
  { value: "before", label: "Before", icon: "◎" },
  { value: "during", label: "During", icon: "◉" },
  { value: "after",  label: "After",  icon: "○" },
];

const HAZARD_OPTIONS = [
  { value: "flood",      label: "Flood",      color: "text-blue-400  border-blue-500   shadow-blue-500/20"  },
  { value: "cyclone",    label: "Cyclone",    color: "text-violet-400 border-violet-500 shadow-violet-500/20"},
  { value: "earthquake", label: "Earthquake", color: "text-orange-400 border-orange-500 shadow-orange-500/20"},
  { value: "heatwave",   label: "Heatwave",   color: "text-red-400   border-red-500    shadow-red-500/20"   },
  { value: "landslide",  label: "Landslide",  color: "text-purple-400 border-purple-500 shadow-purple-500/20"},
  { value: "generic",    label: "Generic",    color: "text-gray-400  border-gray-500   shadow-gray-500/20"  },
];

const HAZARD_DOT = {
  flood:      "bg-blue-400",
  cyclone:    "bg-violet-400",
  earthquake: "bg-orange-400",
  heatwave:   "bg-red-400",
  landslide:  "bg-purple-400",
  generic:    "bg-gray-400",
};

const HAZARD_MAP = Object.fromEntries(HAZARD_OPTIONS.map(h => [h.value, h]));

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CreateGuidelineForm({ onCreated }) {
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [phase,    setPhase]    = useState("before");
  const [hazard,   setHazard]   = useState("flood");
  const [language, setLanguage] = useState("en");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true); setError(null); setSuccess(null);
      const payload = { title, content, phase, hazard_type: hazard, language_code: language, author_id: 1 };
      const created = await createGuideline(payload);
      setSuccess("Guideline published successfully.");
      setTitle(""); setContent("");
      if (onCreated) onCreated(created);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail))            setError(detail[0]?.msg || "Validation error");
      else if (typeof detail === "string")   setError(detail);
      else                                   setError("Failed to create guideline.");
    } finally {
      setLoading(false);
    }
  }

  const selectedHazard = HAZARD_MAP[hazard];
  const contentLen = content.length;

  return (
    /* ── Page shell ── */
    <div className="relative min-h-full bg-[#080810] px-9 py-10 pb-16 font-[Aptos,sans-serif] text-[#f0f0f5]">

      {/* Radial glow background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_600px_300px_at_60%_-60px,rgba(45,212,191,0.05),transparent_70%),radial-gradient(ellipse_400px_200px_at_0%_100%,rgba(45,212,191,0.03),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl">

        {/* ── Hero ── */}
        <div className="mb-1 flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[.22em] text-teal-400">
          <span className="block h-px w-7 bg-teal-400 opacity-60" />
          <Zap size={10} />
          Preparedness System
        </div>

        <h1 className="mb-3 text-[clamp(30px,5vw,48px)] font-black leading-none tracking-[-0.04em] text-white">
          Create <span className="text-teal-400">Guideline</span>
        </h1>

        <p className="mb-9 font-mono text-[11px] tracking-[.06em] text-white/30">
          DEFINE · CLASSIFY · PUBLISH · DISTRIBUTE
        </p>

        {/* ── Alerts ── */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-300">
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-teal-800/40 bg-teal-950/30 px-4 py-3 text-sm font-semibold text-teal-300">
            <CheckCircle2 size={15} className="shrink-0" />{success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ══ Card 1: Identification ══ */}
          <div className="mb-3.5 rounded-[18px] border border-white/[0.07] bg-[#0e0e18] p-7 transition-colors duration-200 focus-within:border-teal-500/30">

            {/* Section label */}
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-white/35 after:h-px after:flex-1 after:bg-white/[0.07] after:content-['']">
              Identification
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">

              {/* Title — spans 3 columns */}
              <div className="col-span-3">
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
                  Guideline Title
                </label>
                <input
                  required
                  minLength={3}
                  maxLength={255}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Flood evacuation procedures for coastal zones"
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#13131f] px-4 py-3.5 text-sm font-semibold text-[#f0f0f5] outline-none transition-all placeholder:font-normal placeholder:text-white/20 focus:border-teal-500/30 focus:ring-2 focus:ring-teal-500/[0.08]"
                />
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
                  Language
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold tracking-[.1em] text-teal-400">
                    ⌘
                  </span>
                  <input
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    maxLength={10}
                    placeholder="en"
                    className="w-full rounded-[10px] border border-white/[0.07] bg-[#13131f] py-3.5 pl-9 pr-4 font-mono text-sm font-semibold tracking-[.08em] text-[#f0f0f5] outline-none transition-all placeholder:font-normal placeholder:text-white/20 focus:border-teal-500/30 focus:ring-2 focus:ring-teal-500/[0.08]"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ══ Card 2: Classification ══ */}
          <div className="mb-3.5 rounded-[18px] border border-white/[0.07] bg-[#0e0e18] p-7 transition-colors duration-200 focus-within:border-teal-500/30">

            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-white/35 after:h-px after:flex-1 after:bg-white/[0.07] after:content-['']">
              Classification
            </div>

            {/* Phase toggle */}
            <label className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
              Response Phase
            </label>
            <div className="mb-6 flex gap-0 rounded-[10px] bg-[#13131f] p-1">
              {PHASE_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPhase(p.value)}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all duration-150",
                    phase === p.value
                      ? "bg-teal-500/10 text-teal-400 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]"
                      : "text-white/35 hover:text-white/70",
                  ].join(" ")}
                >
                  <span className="text-sm">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Hazard pills */}
            <label className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
              Hazard Type
            </label>
            <div className="flex flex-wrap gap-2">
              {HAZARD_OPTIONS.map(h => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHazard(h.value)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-150",
                    hazard === h.value
                      ? `bg-white/5 shadow-lg ${h.color}`
                      : "border-white/[0.07] bg-[#13131f] text-white/35 hover:border-white/[0.13] hover:text-white/70",
                  ].join(" ")}
                >
                  <span className={[
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    HAZARD_DOT[h.value],
                    hazard === h.value ? "opacity-100" : "opacity-40",
                  ].join(" ")} />
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══ Card 3: Content ══ */}
          <div className="mb-3.5 rounded-[18px] border border-white/[0.07] bg-[#0e0e18] p-7 transition-colors duration-200 focus-within:border-teal-500/30">

            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-white/35 after:h-px after:flex-1 after:bg-white/[0.07] after:content-['']">
              Content
            </div>

            <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
              Guideline Body
            </label>
            <textarea
              required
              minLength={20}
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe the preparedness steps, procedures, and recommendations in detail…"
              className="w-full resize-y rounded-[10px] border border-white/[0.07] bg-[#13131f] px-4 py-3.5 text-sm font-medium leading-[1.75] text-[#f0f0f5] outline-none transition-all placeholder:text-white/20 focus:border-teal-500/30 focus:ring-2 focus:ring-teal-500/[0.08]"
            />
            <p className={[
              "mt-1.5 text-right font-mono text-[10px]",
              contentLen > 1800 ? "text-amber-400" : "text-white/20",
            ].join(" ")}>
              {contentLen} chars
            </p>
          </div>

          {/* ══ Submit row ══ */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3.5">

            <span className="font-mono text-[10px] tracking-[.06em] text-white/20">
              {selectedHazard.label.toUpperCase()} · {phase.toUpperCase()} PHASE · {language.toUpperCase()}
            </span>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-xl border-none bg-teal-400 px-7 py-4 text-sm font-extrabold tracking-[-0.01em] text-[#060a09] shadow-[0_0_24px_rgba(45,212,191,0.25)] transition-all duration-[180ms] hover:-translate-y-px hover:bg-teal-300 hover:shadow-[0_0_36px_rgba(45,212,191,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {loading
                ? <Loader2 size={16} className="" />
                : <ArrowRight size={16} />
              }
              {loading ? "Publishing…" : "Publish Guideline"}
            </button>

          </div>

        </form>
      </div>

    </div>
  );
}