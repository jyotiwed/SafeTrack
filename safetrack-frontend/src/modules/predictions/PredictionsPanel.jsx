// src/modules/predictions/IncidentPredictionsPanel.jsx
import { useState } from "react";
import { useIncidentPredictions } from "./useIncidentPredictions";
import {
  RISK_TYPE_LABELS,
  probabilityToBadge,
  formatProbability,
  formatConfidence,
} from "./PredictionUtils";
import { AlertCircle, BarChart2, Percent, Shield, Plus } from "lucide-react";

const RISK_OPTIONS = Object.entries(RISK_TYPE_LABELS);

export function PredictionsPanel({ incidentId }) {
  const { items, loading, error, addPrediction } =
    useIncidentPredictions(incidentId);

  const [riskType, setRiskType] = useState("flood");
  const [probability, setProbability] = useState("");
  const [confidence, setConfidence] = useState("");
  const [modelVersion, setModelVersion] = useState("v1");
  const [algorithm, setAlgorithm] = useState("MLService");

  function handleCreate(e) {
    e.preventDefault();
    const prob = parseFloat(probability);
    const conf = confidence ? parseFloat(confidence) : undefined;
    if (Number.isNaN(prob)) return;

    addPrediction({
      risk_type: riskType,
      probability: prob,
      confidence_score: conf,
      model_version: modelVersion || undefined,
      algorithm: algorithm || undefined,
    });

    setProbability("");
    setConfidence("");
  }

  return (
    <div className="space-y-6">
      {/* CREATE */}
      <form
        onSubmit={handleCreate}
        className="grid gap-4 text-sm sm:grid-cols-5"
      >
        <div className="sm:col-span-2 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <BarChart2 className="h-4 w-4" />
            Risk Type
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={riskType}
            onChange={(e) => setRiskType(e.target.value)}
          >
            {RISK_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Percent className="h-4 w-4" />
            Probability (0–1)
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="0.82"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Shield className="h-4 w-4" />
            Confidence (0–1)
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            placeholder="0.9"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Save Prediction
          </button>
        </div>
      </form>

      {/* optional model + algorithm */}
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-400">
            Model Version
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
            placeholder="v1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-400">
            Algorithm
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            placeholder="RandomForest"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="mt-4 h-32 animate-pulse rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-slate-950/70" />
      ) : items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-950/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
            No predictions recorded yet.
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            Add a new prediction using the form above.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => {
            const badge = probabilityToBadge(p.probability);
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950/80 px-4 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-50">
                      {RISK_TYPE_LABELS[p.risk_type] || p.risk_type}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                      #{p.id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                    Probability:{" "}
                    <span className="font-mono">
                      {formatProbability(p.probability)}
                    </span>{" "}
                    · Confidence:{" "}
                    <span className="font-mono">
                      {formatConfidence(p.confidence_score)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                    {p.algorithm || "Model"}{" "}
                    {p.model_version && `(${p.model_version})`} ·{" "}
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}