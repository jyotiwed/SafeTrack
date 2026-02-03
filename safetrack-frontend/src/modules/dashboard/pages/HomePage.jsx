// src/modules/dashboard/pages/HomePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, MapPin, Activity, Clock, FileText, BarChart, Siren, BookOpen } from "lucide-react";

// TODO: replace with your real API helpers
// import { listIncidents } from "../../incidents/api/incidentsApi";
// import { listTasks } from "../../tasks/api/tasksApi";
// import { getNearbyIncidents } from "../../incidents/api/nearbyApi";
// import { getSystemHealth } from "../../common/api/healthApi";

// Module 1: TimeAgo Helper
function timeAgo(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  const diffMs = Date.now() - dt.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} d ago`;
}

// Module 2: ToneClasses Helper
function toneClasses(tone) {
  switch (tone) {
    case "danger":
      return "border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300";
    case "warning":
      return "border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300";
    case "info":
      return "border-l-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300";
    case "success":
      return "border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300";
    default:
      return "border-l-4 border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300";
  }
}

// Module 3: DashboardHeader Component (Top: Dashboard Overview with buttons)
function DashboardHeader({ stats, loading, navigate }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Monitor key metrics, recent activities, and quick access tools for efficient incident management.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-cyan-700 transition-colors"
            onClick={() => navigate("/app/incidents/map")}
          >
            View Incident Map
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-rose-700 transition-colors"
            onClick={() => navigate("/app/incidents")}
          >
            Report Incident
          </button>
        </div>
      </div>
      {!loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-lg p-6 shadow-md ${toneClasses(stat.tone)}`}>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{stat.label}</p>
                <stat.icon className="h-6 w-6 opacity-80" />
              </div>
              <p className="mt-2 text-4xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm opacity-80">{stat.trend}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Module 4: RecentIncidents Component (Middle: Recent Incidents)
function RecentIncidents({ recentIncidents, loading, navigate }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Recent Incidents
        </h2>
        <button
          className="text-sm font-medium text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200 transition-colors"
          onClick={() => navigate("/app/incidents")}
        >
          View All Incidents
        </button>
      </div>
      <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentIncidents.map((incident) => (
              <tr
                key={incident.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                onClick={() => navigate(`/app/incidents/${incident.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{incident.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      (incident.severity || "").toLowerCase() === "high"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {incident.severity?.toUpperCase() || "UNKNOWN"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{timeAgo(incident.created_at)}</td>
              </tr>
            ))}
            {recentIncidents.length === 0 && !loading && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No recent incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Module 5: MyTasks Component (Middle: Tasks)
function MyTasks({ myTasks, loading, navigate }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Tasks</h2>
        <button
          className="text-sm font-medium text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200 transition-colors"
          onClick={() => navigate("/app/tasks")}
        >
          View All Tasks
        </button>
      </div>
      <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {myTasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                onClick={() => navigate("/app/tasks")}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      task.status === "in_progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {task.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {myTasks.length === 0 && !loading && (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Module 6: QuickAccess Component (Bottom: Quick Tools)
function QuickAccess({ navigate }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Quick Access Tools
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow hover:shadow-md transition-shadow"
          onClick={() => navigate("/app/incidents/map")}
        >
          <MapPin className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Incident Map</span>
        </button>
        <button
          className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow hover:shadow-md transition-shadow"
          onClick={() => navigate("/app/analytics")}
        >
          <BarChart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Analytics Dashboard</span>
        </button>
        <button
          className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow hover:shadow-md transition-shadow"
          onClick={() => navigate("/app/sos-trigger")}
        >
          <Siren className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Trigger SOS</span>
        </button>
        <button
          className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow hover:shadow-md transition-shadow"
          onClick={() => navigate("/app/guidelines")}
        >
          <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Response Guidelines</span>
        </button>
      </div>
    </section>
  );
}

// Main Component: HomePage (Assembling all modules layer by layer)
export default function HomePage() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const [health, setHealth] = useState({ status: "Unknown", detail: "" });
  const [loading, setLoading] = useState(true);

  // Data Loading Logic
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // TEMP data - replace with API calls
        setIncidents([
          { id: 1, title: "Fire in warehouse sector 7", severity: "high", created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
          { id: 2, title: "Road accident near Ring Road", severity: "medium", created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString() },
          { id: 3, title: "Flooding reported in Block A", severity: "high", created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
        ]);

        setTasks([
          { id: 1, title: "Assign responders to warehouse fire", status: "in_progress" },
          { id: 2, title: "Verify flood sensor readings", status: "pending" },
          { id: 3, title: "Review analytics for last 24h", status: "pending" },
        ]);

        setNearbyIncidents([
          { id: 11, title: "Short circuit in building C" },
          { id: 12, title: "Gas leak warning in Block D" },
          { id: 13, title: "Minor fire alarm triggered" },
        ]);

        setHealth({ status: "Normal", detail: "All services up" });

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error("Dashboard load error", e);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Derived Data
  const openIncidents = useMemo(() => incidents.filter((i) => i.status === "new" || !i.status).length, [incidents]);
  const activeTasks = useMemo(() => tasks.filter((t) => t.status === "in_progress").length, [tasks]);
  const dueSoonTasks = useMemo(() => tasks.filter((t) => t.status === "pending").length, [tasks]);

  const stats = useMemo(
    () => [
      { label: "Open Incidents", value: openIncidents, trend: incidents.length > 0 ? `${incidents.length} in last 24h` : "No incidents in last 24h", tone: openIncidents > 0 ? "danger" : "success", icon: AlertCircle },
      { label: "Active Tasks", value: activeTasks, trend: dueSoonTasks > 0 ? `${dueSoonTasks} pending` : "No pending tasks", tone: dueSoonTasks > 0 ? "warning" : "success", icon: CheckCircle },
      { label: "Nearby Alerts", value: nearbyIncidents.length, trend: nearbyIncidents.length > 0 ? "within configured radius" : "No nearby alerts", tone: "info", icon: MapPin },
      { label: "System Health", value: health.status || "Unknown", trend: health.detail || "No health info", tone: health.status === "Normal" ? "success" : "warning", icon: Activity },
    ],
    [openIncidents, incidents.length, activeTasks, dueSoonTasks, nearbyIncidents.length, health]
  );

  const recentIncidents = useMemo(() => incidents.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5), [incidents]);
  const myTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  return (
    <div className="space-y-12 py-6">
      {/* Top: Dashboard Overview */}
      <DashboardHeader stats={stats} loading={loading} navigate={navigate} />

      {/* Middle: Recent Incidents */}
      <RecentIncidents recentIncidents={recentIncidents} loading={loading} navigate={navigate} />

      {/* Middle: My Tasks */}
      <MyTasks myTasks={myTasks} loading={loading} navigate={navigate} />

      {/* Bottom: Quick Access Tools */}
      <QuickAccess navigate={navigate} />
    </div>
  );
}