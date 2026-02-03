// src/modules/tasks/components/IncidentTasksPanel.jsx
import { useEffect, useState } from "react";
import { createTask, listTasks, updateTask } from "../api/taskApi.js";
import { AlertOctagon, User, Calendar, Edit, Plus, Loader2, AlertCircle } from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

export default function IncidentTasksPanel({ incidentId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee_id: "",
  });

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTasks({ incident_id: incidentId, limit: 50, offset: 0 });
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
    if (!incidentId) return;
    loadTasks();
  }, [incidentId]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        incident_id: incidentId,
        assignee_id:
          form.assignee_id === "" ? null : Number(form.assignee_id),
      };
      const created = await createTask(payload);
      setTasks((prev) => [created, ...prev]);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        assignee_id: "",
      });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Failed to create task"
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Failed to update task"
      );
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-6 shadow-lg">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-50">
            Tasks
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Follow-up actions linked to this incident.
          </p>
        </div>
        {loading && (
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        )}
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Create task form */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 p-4 shadow-md"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
              <Edit className="h-4 w-4" />
              Title
            </label>
            <input
              name="title"
              type="text"
              minLength={3}
              maxLength={255}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={form.title}
              onChange={handleFormChange}
              placeholder="Enter task title"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
              <AlertOctagon className="h-4 w-4" />
              Priority
            </label>
            <select
              name="priority"
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={form.priority}
              onChange={handleFormChange}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Edit className="h-4 w-4" />
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={form.description}
            onChange={handleFormChange}
            placeholder="Provide task details (optional)"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <User className="h-4 w-4" />
            Assignee ID (optional)
          </label>
          <input
            name="assignee_id"
            type="number"
            min={1}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={form.assignee_id}
            onChange={handleFormChange}
            placeholder="Enter user ID"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "Add Task"}
          </button>
        </div>
      </form>

      {/* Task list */}
      {tasks.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
            No Tasks Yet
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Add a new task using the form above.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-950/90 p-4 shadow-md"
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
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assignee: {task.assignee_id ?? "Unassigned"}
                    </span>
                    {task.due_at && (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(task.due_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(task.id, s)}
                      disabled={task.status === s}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-shadow ${
                        task.status === s
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-100 shadow-md"
                          : "border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 hover:border-cyan-500 hover:shadow-md"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PriorityBadge({ priority }) {
  const base =
    "rounded-full px-3 py-1 text-xs uppercase tracking-wide flex items-center gap-2";
  const map = {
    critical: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40",
    high: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/40",
    medium: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/40",
    low: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  };
  return (
    <span className={`${base} ${map[priority] || map.low}`}>
      <AlertOctagon className="h-3 w-3" />
      {priority}
    </span>
  );
}