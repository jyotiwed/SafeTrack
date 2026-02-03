// src/modules/analytics/pages/AnalyticsDashboardPage.jsx
import { useEffect, useState } from "react";
import {
  fetchIncidentStats,
  fetchTaskStats,
  fetchIncidentTimeline,
} from "../api/analyticsApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, CheckCircle, Activity, TrendingUp } from "lucide-react";

export default function AnalyticsDashboardPage() {
  const [incidentStats, setIncidentStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [incidents, tasks, timelineData] = await Promise.all([
          fetchIncidentStats(),
          fetchTaskStats(),
          fetchIncidentTimeline(30),
        ]);

        setIncidentStats(incidents);
        setTaskStats(tasks);
        setTimeline(timelineData);
      } catch (err) {
        const detail = err?.response?.data?.detail;
        setError(
          typeof detail === "string" ? detail : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-slate-800/80 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-slate-950/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 p-6 text-sm text-red-700 dark:text-red-300 shadow-md">
        {error}
      </div>
    );
  }

  if (!incidentStats || !taskStats || !timeline) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 text-sm text-gray-600 dark:text-slate-300 shadow-md">
        No analytics data available.
      </div>
    );
  }

  const chartData =
    timeline?.buckets?.map((bucket) => ({
      date: new Date(bucket.period_start).toLocaleDateString(),
      count: bucket.count,
    })) ?? [];

  return (
    <div className="flex h-full flex-col gap-8 p-4 sm:p-6">
      {/* header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Analytics Overview
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Monitor incident volume and task workload across your SafeTrack workspace.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-900/80 px-4 py-2 text-xs text-gray-600 dark:text-slate-300">
          Last {timeline.buckets.length} days
        </span>
      </header>

      {/* KPI cards */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Incidents
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Total Incidents"
              value={incidentStats.total_incidents}
              accent="from-sky-600/20 to-cyan-600/20"
              icon={AlertCircle}
              iconColor="text-sky-500"
            />
            <KpiCard
              label="Open Incidents"
              value={incidentStats.open_incidents}
              valueClass="text-amber-600 dark:text-amber-300"
              accent="from-amber-600/20 to-orange-600/20"
              icon={AlertCircle}
              iconColor="text-amber-500"
            />
            <KpiCard
              label="Closed Incidents"
              value={incidentStats.closed_incidents}
              valueClass="text-emerald-600 dark:text-emerald-300"
              accent="from-emerald-600/20 to-teal-600/20"
              icon={CheckCircle}
              iconColor="text-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Tasks
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Total Tasks"
              value={taskStats.total_tasks}
              accent="from-indigo-600/20 to-sky-600/20"
              icon={Activity}
              iconColor="text-indigo-500"
            />
            <KpiCard
              label="Open Tasks"
              value={taskStats.open_tasks}
              valueClass="text-amber-600 dark:text-amber-300"
              accent="from-amber-600/20 to-orange-600/20"
              icon={Activity}
              iconColor="text-amber-500"
            />
            <KpiCard
              label="Completed Tasks"
              value={taskStats.completed_tasks}
              valueClass="text-emerald-600 dark:text-emerald-300"
              accent="from-emerald-600/20 to-teal-600/20"
              icon={CheckCircle}
              iconColor="text-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* timeline + summary */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* timeline chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Incident Timeline
            </h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Last {timeline.buckets.length} days
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb dark:stroke-slate-700/50"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280 dark:fill-slate-400" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d1d5db dark:stroke-slate-700" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6b7280 dark:fill-slate-400" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d1d5db dark:stroke-slate-700" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff dark:backgroundColor-slate-900",
                    border: "1px solid #d1d5db dark:border-slate-700",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1) dark:0 2px 4px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#374151 dark:color-slate-200" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* summary panel */}
        <div className="space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Insight Summary
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Key insights from recent activity.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-sky-500" />
              <span className="text-gray-700 dark:text-slate-200">Total Incidents: <span className="font-semibold">{incidentStats.total_incidents}</span></span>
            </li>
            <li className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-gray-700 dark:text-slate-200">Open Incidents: <span className="font-semibold">{incidentStats.open_incidents}</span></span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-gray-700 dark:text-slate-200">Completed Tasks: <span className="font-semibold">{taskStats.completed_tasks}</span></span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ---------------- KPI card component ---------------- */

function KpiCard({ label, value, accent, valueClass = "text-gray-900 dark:text-slate-50", icon: Icon, iconColor }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-4 shadow-md hover:shadow-lg transition-shadow">
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr ${accent} opacity-30 blur-md`}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {label}
          </div>
          <div
            className={`text-3xl font-bold leading-tight ${valueClass}`}
          >
            {value}
          </div>
        </div>
        {Icon && <Icon className={`h-6 w-6 ${iconColor} opacity-80`} />}
      </div>
    </div>
  );
}