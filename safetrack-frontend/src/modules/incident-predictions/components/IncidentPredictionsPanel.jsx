// src/modules/incident-predictions/components/IncidentPredictionsPanel.jsx
import { useEffect, useState } from "react";
import {
  createIncidentPrediction,
  listPredictionsByIncident,
} from "../api/incidentPredictionsApi";

const HORIZON_OPTIONS = [7, 14, 30];

const severityStyles = {
  low: "text-emerald-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  critical: "text-rose-400",
};

const riskColor = (score) => {
  if (score >= 8) return "text-rose-400";
  if (score >= 6) return "text-orange-400";
  if (score >= 4) return "text-amber-400";
  return "text-emerald-400";
};

export function IncidentPredictionsPanel({ incidentId }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    risk_score: 5,
    predicted_severity: "moderate",
    estimated_resources_required: 8,
    estimated_budget: 75000,
    forecast_date: new Date().toISOString().slice(0, 16),
    prediction_horizon_days: 14,
    confidence_level: 0.85,
    model_version: "v1.2",
    ml_pipeline_id: "pipeline-2025",
  });

  useEffect(() => {
    if (!incidentId) return;
    let mounted = true;
    setLoading(true);

    listPredictionsByIncident(incidentId, { limit: 20 })
      .then((data) => {
        if (mounted) setPredictions(data || []);
      })
      .catch(() => {
        if (mounted) setError("Failed to load predictions");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [incidentId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const payload = {
        ...form,
        incident_id: incidentId,
        forecast_date: new Date(form.forecast_date).toISOString(),
      };
      const created = await createIncidentPrediction(payload);
      setPredictions((prev) => [created, ...prev]);
    } catch {
      setError("Could not create prediction");
    } finally {
      setCreating(false);
    }
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <aside className="w-full max-w-lg border-l border-slate-800 bg-slate-950 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-white">Incident Forecast</h2>
        <p className="mt-1 text-sm text-slate-400">
          Machine learning predictions • resource & budget estimates
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreate} className="px-6 pb-6 space-y-6 border-b border-slate-800">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:gap-5 gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Risk Score (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.risk_score}
                onChange={(e) => update("risk_score", Number(e.target.value))}
                className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none ${riskColor(
                  form.risk_score
                )}`}
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Predicted Severity
              </label>
              <select
                value={form.predicted_severity}
                onChange={(e) => update("predicted_severity", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none ${severityStyles[form.predicted_severity]}`}
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:gap-5 gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Personnel Required
              </label>
              <input
                type="number"
                min={0}
                value={form.estimated_resources_required}
                onChange={(e) => update("estimated_resources_required", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Estimated Budget (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.estimated_budget}
                onChange={(e) => update("estimated_budget", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Forecast Date
              </label>
              <input
                type="datetime-local"
                value={form.forecast_date}
                onChange={(e) => update("forecast_date", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Horizon
              </label>
              <select
                value={form.prediction_horizon_days}
                onChange={(e) => update("prediction_horizon_days", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
              >
                {HORIZON_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-28">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confidence
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.confidence_level}
                onChange={(e) => update("confidence_level", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}

        <button
          type="submit"
          disabled={creating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            "Create New Prediction"
          )}
        </button>
      </form>

      {/* Predictions List – flat, no boxes */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Forecast History
        </h3>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-10 text-slate-600 italic">
            No predictions yet.
          </div>
        ) : (
          <div className="space-y-5 divide-y divide-slate-800/50">
            {predictions.map((p) => (
              <div
                key={p.id}
                className="pt-4 first:pt-0 hover:bg-slate-900/30 -mx-2 px-2 py-3 rounded-lg transition-colors"
              >
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${riskColor(p.risk_score)}`}>
                      {p.risk_score}
                    </span>
                    <span className={`text-sm font-medium ${severityStyles[p.predicted_severity]}`}>
                      {p.predicted_severity}
                    </span>
                  </div>
                  <time className="text-xs text-slate-500">
                    {new Date(p.forecast_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>

                <div className="text-sm text-slate-300">
                  <span className="font-medium">{p.estimated_resources_required} personnel</span>
                  {" • ₹"}
                  {p.estimated_budget.toLocaleString("en-IN")}
                  {" • "}
                  <span className="text-slate-500">
                    {p.prediction_horizon_days}d horizon •{" "}
                    {(p.confidence_level * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}     