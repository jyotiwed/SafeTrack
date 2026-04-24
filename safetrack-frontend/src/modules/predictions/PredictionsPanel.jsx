import { useState, useMemo } from "react";
import { useIncidentPredictions } from "./useIncidentPredictions";
import {
  RISK_TYPE_LABELS,
  probabilityToBadge,
  formatProbability,
  formatConfidence,
  getRiskColor,
} from "./PredictionUtils";
import {
  AlertCircle,
  BarChart2,
  Percent,
  Shield,
  Plus,
  Brain,
  Loader2,
  PieChart as PieChartIcon,
} from "lucide-react";


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
    if (Number.isNaN(prob) || prob < 0 || prob > 1) return;

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

  // --- DATA TRANSFORMATION FOR CHARTS ---
  const chartData = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.map((p) => ({
      name: RISK_TYPE_LABELS[p.risk_type] || p.risk_type,
      probability: +(p.probability * 100).toFixed(1), // Convert to percentage
      confidence: p.confidence_score ? +(p.confidence_score * 100).toFixed(1) : 0,
      fill: getRiskColor(p.risk_type),
    }));
  }, [items]);

  const pieData = useMemo(() => {
    if (!items || items.length === 0) return [];
    // Group by risk type to show distribution if there are duplicates, 
    // or just list them if unique. Here we assume unique per incident for simplicity.
    return items.map((p) => ({
      name: RISK_TYPE_LABELS[p.risk_type] || p.risk_type,
      value: p.probability * 100,
      fill: getRiskColor(p.risk_type),
    }));
  }, [items]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
          <Brain className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Risk Predictions</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Add and review machine learning predictions for this incident.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleCreate}
        className="grid gap-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/70 p-8 shadow-xl sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <BarChart2 className="h-4 w-4" /> Risk Type
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition"
            value={riskType}
            onChange={(e) => setRiskType(e.target.value)}
          >
            {RISK_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Percent className="h-4 w-4" /> Probability
          </label>
          <input
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="0.82"
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" /> Confidence
          </label>
          <input
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            placeholder="0.9"
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" /> Save
          </button>
        </div>
      </form>

      {/* Model Metadata Inputs */}
      <div className="grid gap-6 sm:grid-cols-2">
        <InputField label="Model Version" value={modelVersion} onChange={setModelVersion} placeholder="v1" />
        <InputField label="Algorithm" value={algorithm} onChange={setAlgorithm} placeholder="MLService" />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}
      
      {!loading && items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
        
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 dark:border-white/10  bg-white dark:bg-slate-950/80 p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-500" />
              Risk Metrics Comparison
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="probability" name="Probability %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confidence" name="Confidence %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-violet-500" />
              Risk Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              Based on Probability Scores
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 px-6 py-10 text-center">
          <p className="text-sm font-medium">No predictions yet.</p>
          <p className="text-xs text-gray-500">Add your first Prediction above to see analytics.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((p) => {
            const badge = probabilityToBadge(p.probability);
            return (
              <div
                key={p.id}
                className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold">
                    {RISK_TYPE_LABELS[p.risk_type] || p.risk_type}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                  <p>Probability: <span className="font-mono">{formatProbability(p.probability)}</span></p>
                  <p>Confidence: <span className="font-mono">{formatConfidence(p.confidence_score)}</span></p>
                  <p className="text-xs text-gray-500">
                    {p.algorithm || "Model"} {p.model_version && `(${p.model_version})`} · {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition"
      />
    </div>
  );
}