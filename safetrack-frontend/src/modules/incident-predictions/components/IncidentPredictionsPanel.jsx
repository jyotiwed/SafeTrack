import { useEffect, useState, useMemo } from "react";
import {
  createIncidentPrediction,
  listPredictionsByIncident,
} from "../api/incidentPredictionsApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const HORIZON_OPTIONS = [7, 14, 30];

const severityStyles = {
  low: "text-green-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const riskColor = (score) => {
  if (score >= 8) return "text-red-400";
  if (score >= 6) return "text-orange-400";
  if (score >= 4) return "text-amber-400";
  return "text-green-400";
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

  // --- CHART DATA PREPARATION ---
  const chartData = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    
    // Reverse to show chronological order in charts (oldest -> newest)
    const sorted = [...predictions].sort((a, b) => 
      new Date(a.forecast_date) - new Date(b.forecast_date)
    );

    return sorted.map((p, index) => ({
      name: `Pred ${index + 1}`,
      fullDate: new Date(p.forecast_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
      budget: p.estimated_budget,
      resources: p.estimated_resources_required,
      riskScore: p.risk_score,
      confidence: p.confidence_level * 100,
    }));
  }, [predictions]);

  return (
    <aside className="w-full border-l border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Incident Forecast</h2>
        <p className="mt-1 text-sm text-light-footerText dark:text-dark-footerText">
          Machine learning predictions • resource & budget estimates
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
        
        {/* Form Section */}
        <form onSubmit={handleCreate} className="space-y-6 pb-6 border-b border-light-border dark:border-dark-border">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:gap-5 gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Risk Score (1–10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.risk_score}
                  onChange={(e) => update("risk_score", Number(e.target.value))}
                  className={`w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base font-medium focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none ${riskColor(
                    form.risk_score
                  )}`}
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Predicted Severity
                </label>
                <select
                  value={form.predicted_severity}
                  onChange={(e) => update("predicted_severity", e.target.value)}
                  className={`w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base font-medium focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none ${severityStyles[form.predicted_severity]}`}
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
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Personnel Required
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.estimated_resources_required}
                  onChange={(e) => update("estimated_resources_required", Number(e.target.value))}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Estimated Budget (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.estimated_budget}
                  onChange={(e) => update("estimated_budget", Number(e.target.value))}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Forecast Date
                </label>
                <input
                  type="datetime-local"
                  value={form.forecast_date}
                  onChange={(e) => update("forecast_date", e.target.value)}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none"
                />
              </div>

              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Horizon
                </label>
                <select
                  value={form.prediction_horizon_days}
                  onChange={(e) => update("prediction_horizon_days", Number(e.target.value))}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none"
                >
                  {HORIZON_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-28">
                <label className="block text-xs font-medium text-light-footerText dark:text-dark-footerText mb-1.5">
                  Confidence
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={form.confidence_level}
                  onChange={(e) => update("confidence_level", Number(e.target.value))}
                  className="w-full rounded-lg border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header px-4 py-2.5 text-base focus:border-twitterBlue-default focus:ring-1 focus:ring-twitterBlue-default/30 outline-none"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 rounded-xl bg-twitterBlue-default text-white font-medium hover:bg-twitterBlue-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* ================= CHARTS SECTION ================= */}
        {predictions.length > 0 ? (
          <div className="space-y-8">
            
            {/* Chart 1: Resource & Budget Comparison */}
            <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header p-4">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                Resource & Budget Allocation
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="fullDate" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                      formatter={(value, name) => {
                        if (name === 'Budget') return [`₹${value.toLocaleString()}`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="resources" name="Personnel" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="budget" name="Budget" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Risk Score Trend */}
            <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-header dark:bg-dark-header p-4">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-4">
                Risk Evolution Trend
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="fullDate" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="riskScore" 
                      name="Risk Score" 
                      stroke="#F59E0B" 
                      strokeWidth={3} 
                      dot={{ fill: '#F59E0B', r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {/* ================= LIST HISTORY (Flat Style) ================= */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-light-footerText dark:text-dark-footerText mb-4">
            Forecast History
          </h3>

          {loading ? (
            <div className="text-center py-10 text-light-footerText dark:text-dark-footerText">Loading...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-10 text-light-footerText dark:text-dark-footerText italic">
              No predictions yet. Create one to see analytics.
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-light-border/50 dark:divide-dark-border/50">
              {predictions.slice().reverse().map((p) => (
                <div
                  key={p.id}
                  className="pt-4 first:pt-0 hover:bg-light-header dark:hover:bg-dark-header -mx-2 px-2 py-3 rounded-lg transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${riskColor(p.risk_score)}`}>
                        {p.risk_score}
                      </span>
                      <span className={`text-sm font-medium ${severityStyles[p.predicted_severity]}`}>
                        {p.predicted_severity.toUpperCase()}
                      </span>
                    </div>
                    <time className="text-xs text-light-footerText dark:text-dark-footerText">
                      {new Date(p.forecast_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <div className="text-sm text-light-footerText dark:text-dark-footerText flex flex-wrap gap-2">
                    <span className="font-medium text-light-text dark:text-dark-text">
                      {p.estimated_resources_required} personnel
                    </span>
                    <span>•</span>
                    <span className="font-medium text-light-text dark:text-dark-text">
                      ₹{p.estimated_budget.toLocaleString("en-IN")}
                    </span>
                    <span>•</span>
                    <span>{p.prediction_horizon_days}d horizon</span>
                    <span>•</span>
                    <span>{(p.confidence_level * 100).toFixed(0)}% conf.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}