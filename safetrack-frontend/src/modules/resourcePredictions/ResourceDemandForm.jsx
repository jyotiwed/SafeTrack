import { useState, useMemo } from "react";
import { getResourceDemand } from "../resourcePredictions/api/resourcePredictionApi";
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
import { AlertCircle, Activity, Users, Ship, Ambulance } from "lucide-react";

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"];

// Color palette for charts
const COLORS = ["#06b6d4", "#8b5cf6", "#ef4444"]; // Cyan, Violet, Red

export default function ResourceDemandForm({ incidentId }) {
  const [incidentIdState, setIncidentIdState] = useState(incidentId || "");
  const [severity, setSeverity] = useState("medium");
  const [affectedPopulation, setAffectedPopulation] = useState(0);
  const [areaKm2, setAreaKm2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      incident_id: incidentIdState ? Number(incidentIdState) : null,
      severity,
      affected_population: Number(affectedPopulation),
      area_km2: Number(areaKm2),
    };

    try {
      const data = await getResourceDemand(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  }

  // --- CHART DATA PREPARATION ---
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      { name: "Teams", value: result.teams_needed, fill: COLORS[0], icon: Users },
      { name: "Boats", value: result.boats_needed, fill: COLORS[1], icon: Ship },
      { name: "Ambulances", value: result.ambulances_needed, fill: COLORS[2], icon: Ambulance },
    ];
  }, [result]);

  const totalResources = useMemo(() => {
    if (!result) return 0;
    return result.teams_needed + result.boats_needed + result.ambulances_needed;
  }, [result]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Activity className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-200">
            Resource Demand Prediction
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            AI-driven estimation for emergency logistics.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 dark:text-gray-400">Incident ID (optional)</label>
          <input
            type="number"
            value={incidentIdState}
            onChange={(e) => setIncidentIdState(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="e.g. 9"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 dark:text-gray-400">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 dark:text-gray-400">Affected Population</label>
          <input
            type="number"
            min={0}
            value={affectedPopulation}
            onChange={(e) => setAffectedPopulation(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="e.g. 5000"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 dark:text-gray-400">Area (km²)</label>
          <input
            type="number"
            min={0}
            value={areaKm2}
            onChange={(e) => setAreaKm2(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            placeholder="e.g. 25"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              "Predict Resource Demand"
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* ================= RESULTS & CHARTS ================= */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Prediction Result
            </h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Total Units: {totalResources}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Bar Chart: Resource Comparison */}
            <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50 p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-4">Resource Allocation Breakdown</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend />
                  
                    {chartData.map((entry, index) => (
                      <Bar 
                        key={entry.name} 
                        dataKey="value" 
                        name={entry.name} 
                        fill={entry.fill} 
                        radius={[6, 6, 0, 0]} 
                        barSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Distribution */}
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50 p-4 flex flex-col items-center justify-center">
              <h4 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2 w-full text-left">Distribution %</h4>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                      formatter={(value) => `${value} units`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">{totalResources}</span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>
              </div>
              
              {/* Legend List */}
              <div className="w-full mt-4 space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-gray-600 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-slate-200">
                      {((item.value / totalResources) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Stats Cards (Optional Extra) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950 p-4 shadow-sm">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${item.fill}20` }}>
                  <item.icon className="h-6 w-6" style={{ color: item.fill }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.name} Needed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}