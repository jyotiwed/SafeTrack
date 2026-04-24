// src/modules/incidents/pages/IncidentsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, AlertCircle, ChevronRight, Loader2, MapPin, Calendar } from "lucide-react";
import IncidentForm from "../components/IncidentForm";
import { listIncidents } from "../api/incidentsApi.js";
import "../../geospartial/api/geospatialApi.js"; // for fixLeafletIcons side effect

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "verified", label: "Verified" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  async function loadIncidents(currentStatus = statusFilter) {
    setLoading(true);
    try {
      const params =
        currentStatus === "all"
          ? { limit: 50, offset: 0 }
          : { limit: 50, offset: 0, status: currentStatus };
      const data = await listIncidents(params);
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(newIncident) {
    setIncidents((prev) => [newIncident, ...prev]);
  }

  function handleStatusFilterChange(e) {
    const value = e.target.value;
    setStatusFilter(value);
    loadIncidents(value);
  }

  return (
    <div className="space-y-8">
      {/* creation panel */}
      <section className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.15)_0,_transparent_55%)] opacity-60" />
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
              Report Incident
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Capture new emergencies with location, severity, and media for faster team response.
            </p>
          </div>
        </div>
        <IncidentForm onCreated={handleCreated} />
      </section>

      {/* list panel */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
              Incidents List
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Browse and filter incidents by status to prioritize actions.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
            )}
          </div>
        </header>

        {/* empty / loading / list */}
        {incidents.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-950/60 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-gray-500 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              No incidents for this filter.
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Try switching to “All statuses” or report a new incident above.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {incidents.map((incident) => (
              <li
                key={incident.id}
                onClick={() => navigate(`/app/incidents/${incident.id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-950/80 px-6 py-4 transition hover:border-cyan-500/50 hover:shadow-md dark:hover:bg-slate-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="truncate text-lg font-medium text-gray-900 dark:text-slate-50">
                        {incident.title}
                      </span>
                      <SeverityBadge severity={incident.severity} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">
                      {incident.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                      {incident.address && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {incident.address}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(incident.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={incident.status} />
                    <ChevronRight className="h-5 w-5 text-gray-500 dark:text-slate-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------- Badges ---------------- */

function SeverityBadge({ severity }) {
  const base =
    "rounded-full px-3 py-1 text-xs uppercase tracking-wide border shadow-sm";

  const map = {
    critical: "border-red-600/60 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    high: "border-orange-600/60 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    medium: "border-yellow-600/60 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    low: "border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span className={`${base} ${map[severity] || map.low}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const base =
    "rounded-full px-3 py-1 text-xs uppercase tracking-wide border shadow-sm";

  const map = {
    new: "border-gray-600/60 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
    verified: "border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
    in_progress: "border-blue-600/60 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    resolved: "border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    closed: "border-purple-600/60 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };

  return (
    <span className={`${base} ${map[status] || map.new}`}>
      {status}
    </span>
  );
}