// src/modules/tasks/pages/TasksPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, AlertCircle, Search, RotateCcw, ChevronRight, Calendar, User, AlertOctagon } from "lucide-react";
import { listTasks } from "../api/taskApi.js";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_BADGE_CLASSES = {
  critical: "bg-red-500/20 text-red-300 border border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  low: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

export default function TasksPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [incidentFilter, setIncidentFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [error, setError] = useState(null);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50, offset: 0 };

      if (statusFilter !== "all") params.status = statusFilter;
      if (incidentFilter.trim() !== "")
        params.incident_id = Number(incidentFilter);
      if (assigneeFilter.trim() !== "")
        params.assignee_id = Number(assigneeFilter);

      const data = await listTasks(params);
      setTasks(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(e) {
    e.preventDefault();
    loadTasks();
  }

  function handleResetFilters() {
    setStatusFilter("all");
    setIncidentFilter("");
    setAssigneeFilter("");
    loadTasks();
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
            Tasks Overview
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Manage follow-up work assigned across all incidents.
          </p>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={handleApplyFilters}
        className="space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-4 shadow-md sm:flex sm:flex-wrap sm:items-end sm:gap-4 sm:space-y-0"
      >
        <div className="space-y-2 flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Filter className="h-4 w-4" />
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <AlertCircle className="h-4 w-4" />
            Incident ID
          </label>
          <input
            type="number"
            min={1}
            value={incidentFilter}
            onChange={(e) => setIncidentFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="Any"
          />
        </div>

        <div className="space-y-2 flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <User className="h-4 w-4" />
            Assignee ID
          </label>
          <input
            type="number"
            min={1}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="Any"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 transition-all"
          >
            <Search className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/10 px-6 py-3 text-sm font-medium text-gray-700 dark:text-slate-200 hover:border-cyan-500/60 hover:text-cyan-700 dark:hover:text-cyan-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </form>

      {/* List */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        {tasks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              No Tasks Found
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Adjust filters or check back later for new assignments.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-950/90 px-6 py-4 transition hover:border-cyan-500/50 hover:shadow-md dark:hover:bg-slate-900/80"
                onClick={() =>
                  navigate(`/app/incidents/${task.incident_id}`)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="truncate text-lg font-medium text-gray-900 dark:text-slate-50">
                        {task.title}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {task.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                      <span>
                        Incident #{task.incident_id}
                      </span>
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Assignee: <span className="font-medium text-gray-900 dark:text-slate-100">{task.assignee_id ?? "Unassigned"}</span>
                      </span>
                      {task.due_at && (
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(task.due_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <StatusChip status={task.status} />
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

function PriorityBadge({ priority }) {
  const base =
    "rounded-full px-3 py-1 text-xs uppercase tracking-wide flex items-center gap-2";
  const cls = PRIORITY_BADGE_CLASSES[priority] || "";
  return (
    <span className={`${base} ${cls}`}>
      <AlertOctagon className="h-3 w-3" />
      {priority}
    </span>
  );
}

function StatusChip({ status }) {
  const base =
    "rounded-full px-3 py-1 text-xs uppercase tracking-wide border";
  const map = {
    pending: "bg-slate-100 dark:bg-slate-500/20 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-500/40",
    assigned: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-500/40",
    in_progress: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-500/40",
    completed:
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40",
    cancelled:
      "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-500/40",
  };
  return <span className={`${base} ${map[status] || ""}`}>{status}</span>;
}