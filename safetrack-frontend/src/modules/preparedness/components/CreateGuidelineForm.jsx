import { useState } from "react";
import { createGuideline } from "../api/preparednessApi";

const PHASE_OPTIONS = [
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
];

const HAZARD_OPTIONS = [
  { value: "flood", label: "Flood" },
  { value: "cyclone", label: "Cyclone" },
  { value: "earthquake", label: "Earthquake" },
  { value: "heatwave", label: "Heatwave" },
  { value: "landslide", label: "Landslide" },
  { value: "generic", label: "Generic" },
];

export default function CreateGuidelineForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [phase, setPhase] = useState("before");
  const [hazard, setHazard] = useState("flood");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const payload = {
        title,
        content,
        phase,
        hazard_type: hazard,
        language_code: language,
        // bbox fields omitted (they are optional)
      };

      const created = await createGuideline(payload);
      setTitle("");
      setContent("");
      if (onCreated) onCreated(created);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to create guideline"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/5 bg-slate-900/60 p-3 text-xs"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          Create guideline
        </h2>
        {loading && (
          <span className="text-[11px] text-slate-400">Saving…</span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col space-y-1 sm:col-span-2">
          <label className="text-[11px] text-slate-400">Title</label>
          <input
            required
            minLength={3}
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[11px] text-slate-400">Language</label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            maxLength={10}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[11px] text-slate-400">Phase</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          >
            {PHASE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[11px] text-slate-400">Hazard</label>
          <select
            value={hazard}
            onChange={(e) => setHazard(e.target.value)}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          >
            {HAZARD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[11px] text-slate-400">Content</label>
        <textarea
          required
          minLength={20}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Save guideline
        </button>
      </div>
    </form>
  );
}
