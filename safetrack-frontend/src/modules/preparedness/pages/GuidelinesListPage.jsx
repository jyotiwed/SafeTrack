import { useEffect, useState } from "react";
import { listGuidelines } from "../api/preparednessApi";
import CreateGuidelineForm from "../components/CreateGuidelineForm";
import { Filter, AlertCircle, Loader2, Search, AlertTriangle, Clock, Globe } from "lucide-react";

const PHASE_OPTIONS = [
  { value: "", label: "All phases" },
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
];

const HAZARD_OPTIONS = [
  { value: "", label: "All hazards" },
  { value: "flood", label: "Flood" },
  { value: "cyclone", label: "Cyclone" },
  { value: "earthquake", label: "Earthquake" },
  { value: "heatwave", label: "Heatwave" },
  { value: "landslide", label: "Landslide" },
  { value: "generic", label: "Generic" },
];

export default function GuidelinesListPage() {
  const [phase, setPhase] = useState("");
  const [hazard, setHazard] = useState("");
  const [language, setLanguage] = useState("en");
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await listGuidelines({
        phase: phase || undefined,
        hazardType: hazard || undefined,
        languageCode: language || undefined,
      });

      setGuidelines(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to load preparedness guidelines"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
          Preparedness Guidelines
        </h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Filter and manage safety guidelines by phase, hazard type, and language.
        </p>
      </header>

      {/* Create guideline */}
      <CreateGuidelineForm onCreated={load} />

      {/* Filters */}
      <form
        onSubmit={handleApplyFilters}
        className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-4 shadow-md"
      >
        <div className="flex-1 space-y-2 min-w-[150px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            <Clock className="h-4 w-4" />
            Phase
          </label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
          >
            {PHASE_OPTIONS.map((opt) => (
              <option key={opt.value || "all-phase"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2 min-w-[150px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            <AlertTriangle className="h-4 w-4" />
            Hazard
          </label>
          <select
            value={hazard}
            onChange={(e) => setHazard(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
          >
            {HAZARD_OPTIONS.map((opt) => (
              <option key={opt.value || "all-hazard"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2 min-w-[120px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            <Globe className="h-4 w-4" />
            Language
          </label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="en"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 transition-all"
        >
          <Search className="h-4 w-4" />
          Apply Filters
        </button>

        {loading && (
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </form>

      {/* List */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        {guidelines.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              No Guidelines Found
            </p>
            <p className="max-w-md text-sm text-gray-600 dark:text-slate-400">
              Try broadening the filters or create a new guideline for this hazard and phase.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guidelines.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950/90 p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      {g.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-600 dark:text-slate-400">
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Phase: {g.phase}
                      </span>
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Hazard: {g.hazard_type}
                      </span>
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Lang: {g.language_code}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                  {g.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}