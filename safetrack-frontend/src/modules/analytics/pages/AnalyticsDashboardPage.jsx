import { useEffect, useState, useCallback } from "react";
import { fetchIncidentStats, fetchTaskStats, fetchIncidentTimeline } from "../api/analyticsApi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  AlertCircle, CheckCircle, Activity, TrendingUp, BarChart2,
  RotateCcw, Zap, Target
} from "lucide-react";

const SEV_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#facc15", low: "#4ade80" };
const TASK_STATUS_COLORS = { pending: "#facc15", assigned: "#60a5fa", in_progress: "#a78bfa", completed: "#4ade80", cancelled: "#ef4444" };
const PERIOD_OPTIONS = [{ label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "90d", value: 90 }];

function fmtTime(d) { if (!d) return ""; return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
      <p style={{ color: "rgba(228,228,231,0.4)", marginBottom: 4, fontSize: 10 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || "#00c4ff", fontWeight: 700 }}>{p.value}{unit}</p>)}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [incidentStats, setIncidentStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [incidents, tasks, timelineData] = await Promise.all([
        fetchIncidentStats(), fetchTaskStats(), fetchIncidentTimeline(period),
      ]);
      setIncidentStats(incidents); setTaskStats(tasks); setTimeline(timelineData);
      setLastUpdated(new Date());
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load analytics");
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const chartData = timeline?.buckets?.map(b => ({
    date: new Date(b.period_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    count: b.count,
  })) ?? [];

  const peakBucket = timeline?.buckets?.reduce((best, b) => (!best || b.count > best.count) ? b : best, null);
  const peakDay = peakBucket
    ? { label: new Date(peakBucket.period_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), count: peakBucket.count }
    : null;

  const avgPerDay = chartData.length > 0
    ? (chartData.reduce((s, d) => s + d.count, 0) / chartData.length).toFixed(1)
    : "—";

  const completionRate = taskStats?.total_tasks > 0
    ? Math.round((taskStats.completed_tasks / taskStats.total_tasks) * 100)
    : 0;

  const sevData = incidentStats ? [
    { name: "Critical", value: incidentStats.critical_incidents ?? incidentStats.by_severity?.critical ?? 0, color: SEV_COLORS.critical },
    { name: "High", value: incidentStats.high_incidents ?? incidentStats.by_severity?.high ?? 0, color: SEV_COLORS.high },
    { name: "Medium", value: incidentStats.medium_incidents ?? incidentStats.by_severity?.medium ?? 0, color: SEV_COLORS.medium },
    { name: "Low", value: incidentStats.low_incidents ?? incidentStats.by_severity?.low ?? 0, color: SEV_COLORS.low },
  ] : [];

  const donutData = taskStats ? [
    { name: "Pending", value: taskStats.pending_tasks ?? taskStats.by_status?.pending ?? 0, color: TASK_STATUS_COLORS.pending },
    { name: "In Progress", value: taskStats.in_progress_tasks ?? taskStats.by_status?.in_progress ?? 0, color: TASK_STATUS_COLORS.in_progress },
    { name: "Completed", value: taskStats.completed_tasks ?? taskStats.by_status?.completed ?? 0, color: TASK_STATUS_COLORS.completed },
    { name: "Cancelled", value: taskStats.cancelled_tasks ?? taskStats.by_status?.cancelled ?? 0, color: TASK_STATUS_COLORS.cancelled },
  ].filter(d => d.value > 0) : [];

  const chartDataWithPeak = chartData.map(d => ({ ...d, isPeak: d.date === peakDay?.label }));

  const navBtn = "flex items-center gap-1.5 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-[7px] text-[13px] font-semibold text-zinc-400 hover:border-cyan-400/28 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors";
  const sectionLbl = "mb-2.5 flex items-center gap-2 font-mono text-[14px] uppercase tracking-[.18em] text-cyan-400/50";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-20 text-zinc-200 max-sm:px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1280px]">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] py-[18px] mb-9">
          <div className="flex items-center gap-2.5">
            <div className="h-[10px] w-[10px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[17px] font-semibold uppercase tracking-[.15em] text-cyan-400">SafeTrack ICC</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {lastUpdated && (
              <span className="font-mono text-[17px] tracking-[.04em] text-zinc-700">Updated {fmtTime(lastUpdated)}</span>
            )}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.07] px-3.5 py-[7px] text-[13px] font-semibold text-cyan-400 hover:bg-cyan-400/14 hover:border-cyan-400/40 disabled:opacity-50 transition-colors">
              <RotateCcw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={() => window.history.back()} className={navBtn}>← Dashboard</button>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400/55">
            <div className="bg-cyan-400/40" /> Intelligence &amp; Analytics
          </div>
          <h1 className="mb-1.5 text-[30px] font-extrabold tracking-tight text-white max-sm:text-2xl">Analytics Overview</h1>
          <p className="font-mono text-[10px] uppercase tracking-[.1em] text-zinc-600">INCIDENT VOLUME · TASK WORKLOAD · SEVERITY DISTRIBUTION · TRENDS</p>
        </div>

        {error && !loading && (
          <div className="mb-6 flex items-center gap-2.5 rounded-[10px] border border-red-500/20 bg-red-500/[0.08] px-4 py-3.5 font-mono text-[13px] text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-6 gap-2.5 max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[90px] rounded-[12px] border border-white/[0.04] bg-white/[0.02]" />)}
            </div>
            <div className="grid grid-cols-[1fr_340px] gap-2.5 max-[1000px]:grid-cols-1">
              <div className="h-[300px] rounded-[14px] border border-white/[0.04] bg-white/[0.02]" />
              <div className="h-[300px] rounded-[14px] border border-white/[0.04] bg-white/[0.02]" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-[800px]:grid-cols-1">
              <div className="h-[260px] rounded-[14px] border border-white/[0.04] bg-white/[0.02]" />
              <div className="h-[260px] rounded-[14px] border border-white/[0.04] bg-white/[0.02]" />
            </div>
          </div>
        )}

        {!loading && !error && incidentStats && taskStats && timeline && (<>

          <p className={sectionLbl}>Key Metrics</p>
          <div className="mb-7 grid grid-cols-6 gap-2.5 max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2">
            {[
              { lbl: "Total Incidents", val: incidentStats.total_incidents, color: "#00c4ff", Icon: BarChart2 },
              { lbl: "Open Incidents", val: incidentStats.open_incidents, color: "#f97316", Icon: AlertCircle },
              { lbl: "Closed", val: incidentStats.closed_incidents, color: "#4ade80", Icon: CheckCircle },
              { lbl: "Total Tasks", val: taskStats.total_tasks, color: "#a78bfa", Icon: Activity },
              { lbl: "Open Tasks", val: taskStats.open_tasks, color: "#facc15", Icon: Activity },
              { lbl: "Avg / Day", val: avgPerDay, color: "#00c4ff", Icon: TrendingUp, mono: true },
            // eslint-disable-next-line no-unused-vars
            ].map(({ lbl, val, Icon, color, mono }) => (
              <div key={lbl} className="flex flex-col gap-2.5 overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-4 py-4 hover:border-white/10 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">{lbl}</span>
                  <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px]"
                    style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                </div>
                <span className="text-[28px] font-extrabold leading-none tracking-tight"
                  style={{ color, fontFamily: mono ? "'JetBrains Mono',monospace" : undefined }}>
                  {val ?? "—"}
                </span>
              </div>
            ))}
          </div>

          <p className={sectionLbl}>Task Progress</p>
          <div className="mb-7 rounded-[14px] border border-emerald-400/[0.15] bg-emerald-400/[0.03] px-6 py-5">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-bold text-zinc-200">Task Completion Rate</p>
                <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{taskStats.completed_tasks} of {taskStats.total_tasks} tasks completed</p>
              </div>
              <span className="font-mono text-[28px] font-extrabold leading-none tracking-tight text-emerald-400">{completionRate}%</span>
            </div>
            <div className="mb-2.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-all" style={{ width: `${completionRate}%`, background: "linear-gradient(90deg,#4ade80,#00c4ff)" }} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { color: TASK_STATUS_COLORS.completed, label: `${taskStats.completed_tasks ?? 0} Completed` },
                { color: TASK_STATUS_COLORS.in_progress, label: `${taskStats.in_progress_tasks ?? taskStats.open_tasks ?? 0} In Progress` },
                { color: TASK_STATUS_COLORS.pending, label: `${taskStats.pending_tasks ?? 0} Pending` },
                { color: TASK_STATUS_COLORS.cancelled, label: `${taskStats.cancelled_tasks ?? 0} Cancelled` },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                  <span className="h-[6px] w-[6px] rounded-full shrink-0" style={{ background: s.color }} />{s.label}
                </span>
              ))}
            </div>
          </div>

          <p className={sectionLbl}>Severity Breakdown</p>
          <div className="mb-7 grid grid-cols-4 gap-2.5 max-[640px]:grid-cols-2">
            {[
              { key: "critical", label: "Critical", val: incidentStats.critical_incidents ?? incidentStats.by_severity?.critical ?? "—" },
              { key: "high", label: "High", val: incidentStats.high_incidents ?? incidentStats.by_severity?.high ?? "—" },
              { key: "medium", label: "Medium", val: incidentStats.medium_incidents ?? incidentStats.by_severity?.medium ?? "—" },
              { key: "low", label: "Low", val: incidentStats.low_incidents ?? incidentStats.by_severity?.low ?? "—" },
            ].map(s => {
              const color = SEV_COLORS[s.key];
              const pct = incidentStats.total_incidents ? Math.round(((s.val || 0) / incidentStats.total_incidents) * 100) : 0;
              return (
                <div key={s.key} className="flex flex-col gap-1.5 rounded-[12px] border px-4 py-3.5"
                  style={{ borderColor: `${color}22`, background: `${color}08` }}>
                  <span className="text-[24px] font-extrabold leading-none tracking-tight" style={{ color }}>{s.val}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[.12em] text-zinc-600">{s.label}</span>
                  <div className="mt-1 h-[2px] rounded-full overflow-hidden" style={{ background: `${color}30` }}>
                    <div className="h-full rounded-full opacity-70" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className={sectionLbl}>Incident Timeline</p>
          <div className="mb-7 grid grid-cols-[1fr_340px] gap-4 max-[1000px]:grid-cols-1">

            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-5">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-zinc-200">Incident Activity</p>
                  {peakDay && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-2.5 py-[3px] font-mono text-[10px] font-bold text-orange-400">
                      <Zap size={10} /> Peak: {peakDay.label} — {peakDay.count} incidents
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {PERIOD_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { if (period !== o.value) setPeriod(o.value); }}
                      className={`rounded-[6px] border px-2.5 py-1 font-mono text-[10px] font-bold transition-colors ${period === o.value ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400" : "border-white/[0.07] bg-transparent text-zinc-500 hover:border-cyan-400/25 hover:text-cyan-400"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataWithPeak} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date"
                      tick={{ fontSize: 10, fill: "rgba(228,228,231,0.25)", fontFamily: "'JetBrains Mono',monospace" }}
                      tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false}
                      tick={{ fontSize: 10, fill: "rgba(228,228,231,0.22)", fontFamily: "'JetBrains Mono',monospace" }}
                      tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip unit=" incidents" />} cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="count" stroke="#00c4ff" strokeWidth={2}
                      dot={props => {
                        const { cx, cy, payload } = props;
                        if (!payload.isPeak) return <circle key={`d-${cx}-${cy}`} cx={cx} cy={cy} r={0} />;
                        return <circle key={`p-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#f97316" stroke="#09090b" strokeWidth={2} />;
                      }}
                      activeDot={{ r: 4, fill: "#00c4ff", stroke: "#09090b", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
                  <span className="inline-block h-[2px] w-5 rounded bg-cyan-400" /> Incidents / day
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Peak day
                </span>
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-5">
              <p className="mb-5 text-[13px] font-bold text-zinc-200">Insight Summary</p>
              <div className="flex flex-col gap-3.5">
                {[
                  { Icon: BarChart2, color: "#00c4ff", label: "Total Incidents", val: incidentStats.total_incidents },
                  { Icon: AlertCircle, color: "#f97316", label: "Open Incidents", val: incidentStats.open_incidents },
                  { Icon: CheckCircle, color: "#4ade80", label: "Completed Tasks", val: taskStats.completed_tasks },
                  { Icon: Activity, color: "#a78bfa", label: "Total Tasks", val: taskStats.total_tasks },
                  { Icon: TrendingUp, color: "#00c4ff", label: "Avg / Day", val: avgPerDay },
                  { Icon: Zap, color: "#f97316", label: "Peak Day Count", val: peakDay?.count ?? "—" },
                  { Icon: Target, color: "#4ade80", label: "Completion Rate", val: `${completionRate}%` },
                // eslint-disable-next-line no-unused-vars
                ].map(({ Icon, color, label, val }) => (
                  <div key={label} className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]"
                        style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span className="text-[12px] font-medium text-zinc-500">{label}</span>
                    </div>
                    <span className="font-mono text-[18px] font-extrabold tracking-tight" style={{ color }}>{val ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className={sectionLbl}>Distribution</p>
          <div className="grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">

            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-zinc-200">Severity Distribution</p>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{incidentStats.total_incidents} total incidents</p>
                </div>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sevData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name"
                      tick={{ fontSize: 10, fill: "rgba(228,228,231,0.3)", fontFamily: "'JetBrains Mono',monospace" }}
                      tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} />
                    <YAxis allowDecimals={false}
                      tick={{ fontSize: 10, fill: "rgba(228,228,231,0.22)", fontFamily: "'JetBrains Mono',monospace" }}
                      tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {sevData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-5">
              <div className="mb-5">
                <p className="text-[13px] font-bold text-zinc-200">Task Status Split</p>
                <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{taskStats.total_tasks} total tasks</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData.length > 0 ? donutData : [{ name: "empty", value: 1, color: "rgba(255,255,255,0.06)" }]}
                        cx="50%" cy="50%" innerRadius={46} outerRadius={72}
                        paddingAngle={donutData.length > 1 ? 3 : 0} dataKey="value" strokeWidth={0}>
                        {(donutData.length > 0 ? donutData : [{ color: "rgba(255,255,255,0.06)" }]).map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-[20px] font-extrabold leading-none text-white">{completionRate}%</span>
                    <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[.08em] text-zinc-600">done</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: d.color }} />
                        <span className="font-mono text-[10px] text-zinc-500">{d.name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">{d.value}</span>
                    </div>
                  ))}
                  {donutData.length === 0 && (
                    <span className="font-mono text-[10px] text-zinc-700">No task data</span>
                  )}
                </div>
              </div>
            </div>

          </div>

        </>)}
      </div>
    </div>
  );
}