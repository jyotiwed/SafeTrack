import { useEffect, useState, useCallback } from "react";
import { createTask, listTasks, updateTask } from "../api/taskApi.js";
import {
  User, Calendar, Plus, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, ArrowRight, ChevronDown, Info, RotateCcw
} from "lucide-react";

/* ─── Config ──────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:     { label: "Pending",     icon: Clock,        color: "#facc15" },
  assigned:    { label: "Assigned",    icon: User,         color: "#60a5fa" },
  in_progress: { label: "In Progress", icon: ArrowRight,   color: "#a78bfa" },
  completed:   { label: "Completed",   icon: CheckCircle2, color: "#4ade80" },
  cancelled:   { label: "Cancelled",   icon: XCircle,      color: "#71717a" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "#ef4444" },
  high:     { label: "High",     color: "#f97316" },
  medium:   { label: "Medium",   color: "#facc15" },
  low:      { label: "Low",      color: "#4ade80" },
};

/* ─── Priority Buttons ────────────────────────────────────────────────────── */
function PriorityButtonGroup({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Priority">
      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            style={{
              borderColor: active ? `${cfg.color}55` : "rgba(255,255,255,0.08)",
              background:  active ? `${cfg.color}14` : "transparent",
              color:       active ? cfg.color         : "rgba(255,255,255,0.7)",
              boxShadow:   active ? `0 0 0 1px ${cfg.color}35` : "none",
            }}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[12px] uppercase tracking-[.1em] font-semibold transition-all"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: active ? cfg.color : "rgba(255,255,255,0.4)" }}
            />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Panel ───────────────────────────────────────────────────────────────── */
export default function IncidentTasksPanel({ incidentId }) {
  const [tasks,          setTasks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [creating,       setCreating]       = useState(false);
  const [error,          setError]          = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", assignee_id: "",
  });

  const loadTasks = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true); setError(null);
    try {
      const data = await listTasks({ incident_id: incidentId, limit: 50, offset: 0 });
      setTasks(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load tasks");
    } finally { setLoading(false); }
  }, [incidentId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError("Task title is required."); return; }
    setCreating(true);
    try {
      const assigneeVal = form.assignee_id.trim();
      const created = await createTask({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        incident_id: incidentId,
        assignee_id: assigneeVal ? Number(assigneeVal) : null,
      });
      setTasks(prev => [created, ...prev]);
      setForm({ title: "", description: "", priority: "medium", assignee_id: "" });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      let msg = "Failed to create task";
      if (typeof detail === "string") {
        msg = (detail.includes("role") || detail.includes("volunteer") || detail.includes("citizen"))
          ? "Tasks can only be assigned to Volunteers, Responders, or Admins."
          : detail;
      }
      setError(msg);
    } finally { setCreating(false); }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to update task");
    }
  }

  function toggleExpand(taskId) {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  }

  /* ── shared styles ── */
  const sectionLbl = "mb-3 font-mono text-[13px] uppercase tracking-[.18em] text-cyan-400/50";
  const inputCls   = "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-[14px] text-white placeholder-white/30 outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-cyan-400/20 transition-all";
  const labelCls   = "font-mono text-[11px] uppercase tracking-[.14em] text-white/60";

  return (
    <div
      className="min-h-screen bg-[#09090b] px-7 pb-20 text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mx-auto max-w-[1500px]">

        {/* ── HERO ── */}
        <div className="mb-9">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[.22em] text-cyan-400/55">
            Incident Management
          </div>
          <h1 className="mb-1.5 text-[30px] font-extrabold tracking-tight text-white max-sm:text-2xl">
            Incident Tasks
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[.1em] text-white/40">
            MANAGE · ASSIGN · TRACK · RESOLVE
          </p>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div
            role="alert"
            className="mb-7 flex items-start gap-3 rounded-[10px] border border-red-500/20 bg-red-500/[0.08] px-4 py-3.5 font-mono text-[13px] text-red-400"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 transition-colors">
              <XCircle size={14} />
            </button>
          </div>
        )}

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-[420px_1fr] gap-6 items-start max-[1000px]:grid-cols-1">

          {/* ══ LEFT COL — sticky form ══ */}
          <div className="sticky top-6 max-[1000px]:static">
            <p className={sectionLbl}>New Task</p>
            <form
              onSubmit={handleCreate}
              className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-6 py-6"
            >
              {/* form header */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-cyan-400/20 bg-cyan-400/10">
                  <Plus size={15} className="text-cyan-400" />
                </div>
                <span className="font-mono text-[14px] font-semibold uppercase tracking-[.08em] text-white">
                  Add New Task
                </span>
              </div>

              <div className="flex flex-col gap-5">

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="task-title" className={labelCls}>
                    Task Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="task-title" name="title" type="text"
                    minLength={3} maxLength={255} required
                    className={inputCls}
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Enter task title…"
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-2">
                  <span className={labelCls}>Priority</span>
                  <PriorityButtonGroup value={form.priority} onChange={p => setForm(prev => ({ ...prev, priority: p }))} />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="task-description" className={labelCls}>
                    Description
                  </label>
                  <textarea
                    id="task-description" name="description" rows={3}
                    className={`${inputCls} resize-none`}
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Add context, instructions, or notes…"
                  />
                </div>

                {/* Assignee */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="task-assignee" className={labelCls}>
                    Assign to User ID <span className="text-white/30">(Optional)</span>
                  </label>
                  <input
                    id="task-assignee" name="assignee_id" type="number" min={1}
                    className={inputCls}
                    value={form.assignee_id}
                    onChange={handleFormChange}
                    placeholder="e.g. 123"
                  />
                  <div className="flex items-start gap-2.5 rounded-[8px] border border-cyan-400/15 bg-cyan-400/[0.05] px-3.5 py-2.5 mt-1">
                    <Info size={12} className="mt-0.5 shrink-0 text-cyan-400/50" />
                    <span className="font-mono text-[11px] text-white/50">
                      Assignable roles:{" "}
                      <span className="text-cyan-400 font-semibold">Volunteer</span>,{" "}
                      <span className="text-cyan-400 font-semibold">Responder</span>,{" "}
                      <span className="text-cyan-400 font-semibold">Admin</span>.{" "}
                      Citizens cannot be assigned.
                    </span>
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={creating || !form.title.trim()}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.07] px-5 py-[9px] font-mono text-[13px] font-semibold text-cyan-400 hover:bg-cyan-400/14 hover:border-cyan-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating
                    ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
                    : <><Plus size={13} /> Add Task</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* ══ RIGHT COL — task list ══ */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[13px] uppercase tracking-[.18em] text-cyan-400/50">Task List</p>
              {!loading && tasks.length > 0 && (
                <span className="font-mono text-[12px] text-white/50">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse h-[110px] rounded-[14px] border border-white/[0.04] bg-white/[0.02]" />
                ))}
              </div>

            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[14px] border border-white/[0.06] bg-white/[0.02] py-20 text-center">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                  <AlertCircle size={22} className="text-white/30" />
                </div>
                <div>
                  <p className="font-semibold text-white text-[16px]">No tasks yet</p>
                  <p className="mt-1 font-mono text-[12px] text-white/40">
                    Use the form on the left to create the first task.
                  </p>
                </div>
              </div>

            ) : (
              <ul className="flex flex-col gap-3">
                {tasks.map(task => {
                  const statusCfg   = STATUS_CONFIG[task.status]    || STATUS_CONFIG.pending;
                  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                  const StatusIcon  = statusCfg.icon;
                  const isExpanded  = expandedTaskId === task.id;

                  return (
                    <li
                      key={task.id}
                      className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:border-white/10 hover:bg-white/[0.035] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">

                        {/* Left */}
                        <div className="min-w-0 flex-1">
                          {/* title + priority badge */}
                          <div className="flex flex-wrap items-center gap-2.5 mb-2">
                            <span className="font-semibold text-white text-[15px] tracking-tight truncate">
                              {task.title}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[11px] font-semibold shrink-0"
                              style={{
                                borderColor: `${priorityCfg.color}35`,
                                background:  `${priorityCfg.color}10`,
                                color:        priorityCfg.color,
                              }}
                            >
                              <span className="h-[5px] w-[5px] rounded-full shrink-0" style={{ background: priorityCfg.color }} />
                              {priorityCfg.label}
                            </span>
                          </div>

                          {/* description preview */}
                          {task.description && !isExpanded && (
                            <p className="font-mono text-[12px] text-white/40 mb-2.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}

                          {/* meta */}
                          <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-white/50">
                            <span className="flex items-center gap-1.5">
                              <User size={11} />
                              {task.assignee_id ? (
                                <>
                                  ID: {task.assignee_id}
                                  <span className="ml-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-1.5 py-[1px] text-[10px] uppercase tracking-[.08em] text-cyan-400">
                                    Assigned
                                  </span>
                                </>
                              ) : (
                                <span className="italic text-white/30">Unassigned</span>
                              )}
                            </span>
                            {task.created_at && (
                              <span className="flex items-center gap-1.5">
                                <Calendar size={11} />
                                {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right — status controls */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="relative">
                            <select
                              aria-label="task status"
                              value={task.status}
                              onChange={e => handleStatusChange(task.id, e.target.value)}
                              style={{
                                borderColor: `${statusCfg.color}30`,
                                background:  `${statusCfg.color}08`,
                                color:        statusCfg.color,
                              }}
                              className="appearance-none rounded-[8px] border px-3 py-[5px] pr-7 font-mono text-[12px] font-semibold outline-none cursor-pointer transition-all"
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={11}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                              style={{ color: statusCfg.color }}
                            />
                          </div>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[11px] font-semibold"
                            style={{
                              borderColor: `${statusCfg.color}30`,
                              background:  `${statusCfg.color}0a`,
                              color:        statusCfg.color,
                            }}
                          >
                            <StatusIcon size={10} />
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* expanded description */}
                      {isExpanded && task.description && (
                        <div className="mt-3.5 pt-3.5 border-t border-white/[0.06]">
                          <p className="font-mono text-[13px] text-white/60 leading-relaxed">{task.description}</p>
                        </div>
                      )}

                      {/* expand toggle */}
                      {task.description && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-cyan-400/60 hover:text-cyan-400 transition-colors"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                          <ChevronDown size={10} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
        {/* end two-column */}

      </div>
    </div>
  );
}