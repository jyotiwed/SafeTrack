// src/modules/tasks/pages/TasksPage.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RotateCcw, ChevronRight, ChevronDown, AlertCircle,
  SlidersHorizontal, X, ClipboardList, Loader2, Filter,
  Search, CheckSquare, Square, CheckCircle2, User, Info
} from "lucide-react";
import { listTasks, updateTask } from "../api/taskApi.js";

const STATUS_CONFIG = {
  all:         { label: "All",         color: "#9ca3af", bg: "rgba(156,163,175,0.10)",  border: "rgba(156,163,175,0.22)"  },
  pending:     { label: "Pending",     color: "#facc15", bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.22)"  },
  assigned:    { label: "Assigned",    color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  in_progress: { label: "In Progress", color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  completed:   { label: "Completed",   color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.22)"  },
  cancelled:   { label: "Cancelled",   color: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.22)"   },
};

const STATUS_VALUES = ["pending", "assigned", "in_progress", "completed", "cancelled"];

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.22)",   order: 0 },
  high:     { label: "HIGH",     color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.22)",  order: 1 },
  medium:   { label: "MEDIUM",   color: "#facc15", bg: "rgba(250,204,21,0.10)",  border: "rgba(250,204,21,0.22)",  order: 2 },
  low:      { label: "LOW",      color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.22)",  order: 3 },
};

const SORT_OPTIONS = [
  { value: "date_desc",     label: "Newest first"      },
  { value: "date_asc",      label: "Oldest first"      },
  { value: "priority_desc", label: "Priority high→low" },
  { value: "priority_asc",  label: "Priority low→high" },
  { value: "status",        label: "By status"         },
];

const getStatus   = s => STATUS_CONFIG[s]   || STATUS_CONFIG.pending;
const getPriority = p => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium;

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Task Card (Compact + RBAC) ────────────────────────────────────────── */
function TaskCard({ task, selected, onSelect, onNavigate, onStatusChange, onComplete, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  const priority = getPriority(task.priority);
  const status = getStatus(task.status);
  const isDone = task.status === "completed";

  // --- RBAC LOGIC ---
  const isAssignee = task.assignee_id === currentUser?.id;
  const isPrivileged = ['responder', 'admin', 'ngo_lead'].includes(currentUser?.role);
  const canEdit = isPrivileged || (currentUser?.role === 'volunteer' && isAssignee);

  async function handleStatusChange(e) {
    e.stopPropagation();
    if (!canEdit) return;
    const val = e.target.value;
    if (val === task.status) return;
    setStatusUpdating(true);
    await onStatusChange(task.id, val);
    setStatusUpdating(false);
  }

  async function handleComplete(e) {
    e.stopPropagation();
    if (!canEdit || isDone) return;
    setStatusUpdating(true);
    await onComplete(task.id);
    setStatusUpdating(false);
  }

  return (
    <div className={`relative flex items-stretch rounded-[12px] border bg-white/[0.025] transition-colors hover:border-white/10 hover:bg-white/[0.04] ${selected ? "border-cyan-400/30 bg-cyan-400/[0.035]" : "border-white/[0.06]"}`}>
      {/* Checkbox */}
      <div onClick={e => { e.stopPropagation(); onSelect(task.id); }}
        className={`flex shrink-0 cursor-pointer items-center justify-center px-3 pl-3.5 transition-colors ${selected ? "text-cyan-400" : "text-zinc-700 hover:text-cyan-400"}`}>
        {selected ? <CheckSquare size={14} /> : <Square size={14} />}
      </div>

      {/* Priority Stripe */}
      <div className="w-[3px] shrink-0 opacity-55" style={{ background: priority.color }} />

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <button
            className="flex-1 text-left text-[14px] font-bold leading-snug text-zinc-200 hover:text-cyan-400 transition-colors"
            onClick={() => onNavigate(task)}
          >
            {task.title}
          </button>
          <button onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border border-white/[0.07] bg-white/[0.03] text-zinc-600 hover:border-cyan-400/25 hover:text-cyan-400 transition-colors">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        </div>

        {task.description && (
          <p className={`text-[12px] leading-relaxed text-zinc-500 ${expanded ? "" : "line-clamp-2"}`}>
            {task.description}
          </p>
        )}

        {/* Footer Meta */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] pt-2" onClick={e => e.stopPropagation()}>
          <span className="inline-flex items-center gap-1 rounded-full border px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[.08em]"
            style={{ color: priority.color, background: priority.bg, borderColor: priority.border }}>
            <span className="h-1 w-1 rounded-full" style={{ background: priority.color }} />
            {priority.label}
          </span>

          {/* Status Dropdown with RBAC */}
          <div className="relative group">
            <select 
              value={task.status} 
              onChange={handleStatusChange} 
              disabled={!canEdit || statusUpdating}
              className={`appearance-none rounded-[6px] border px-[7px] py-[2px] font-mono text-[10px] font-bold tracking-[.04em] outline-none disabled:opacity-50 cursor-pointer ${!canEdit ? 'cursor-not-allowed' : 'hover:border-white/20'}`}
              style={{ color: status.color, borderColor: status.border, background: status.bg }}
              title={!canEdit ? "Only assigned users can update" : ""}
            >
              {STATUS_VALUES.map(s => (
                <option key={s} value={s} style={{ background: "#141418", color: "#e4e4e7" }}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            {!canEdit && (
              <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-red-500 px-2 py-1 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                🔒 Assigned Only
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-[7px] py-[2px] font-mono text-[9px] font-semibold text-zinc-600">
            <User size={8} />
            {task.assignee_name ? task.assignee_name : task.assignee_id ? `User #${task.assignee_id}` : "Unassigned"}
            {isAssignee && <span className="ml-1 text-[8px] uppercase text-cyan-400 font-bold">(You)</span>}
          </span>

          <span className="font-mono text-[10px] text-zinc-700">INC#{task.incident_id}</span>
          
          {task.created_at && (
            <span className="ml-auto font-mono text-[10px] text-zinc-700">{fmtDate(task.created_at)}</span>
          )}

          {/* Complete Button */}
          <button onClick={handleComplete} disabled={!canEdit || isDone || statusUpdating}
            className={`inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-[3px] font-mono text-[10px] font-bold transition-colors disabled:cursor-default disabled:opacity-35 ${
              isDone 
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" 
                : canEdit 
                  ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400/65 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-400" 
                  : "border-zinc-700 bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}>
            <CheckCircle2 size={10} /> {isDone ? "Completed" : "Mark Done"}
          </button>
        </div>
        
        {currentUser?.role === 'volunteer' && !isAssignee && (
          <p className="text-[9px] text-orange-400/60 mt-1 flex items-center gap-1">
            <Info size={9} /> You can only update tasks assigned to you.
          </p>
        )}
      </div>

      {/* Navigate Arrow */}
      <button onClick={e => { e.stopPropagation(); onNavigate(task); }}
        className="flex shrink-0 cursor-pointer items-center rounded-r-[12px] border-l border-white/[0.05] px-3.5 text-zinc-700 hover:border-cyan-400/10 hover:bg-cyan-400/[0.04] hover:text-cyan-400 transition-colors"
        title="View incident">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  
  const currentUser = { id: 3, role: 'responder', name: 'Admin User' }; 

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [incidentFilter, setIncidentFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true); setError(null); setSelected(new Set());
    try {
      const params = { limit: 100, offset: 0 };
      if (statusFilter !== "all")  params.status = statusFilter;
      if (incidentFilter.trim())   params.incident_id = Number(incidentFilter);
      if (assigneeFilter.trim())   params.assignee_id = Number(assigneeFilter);
      
      const data = await listTasks(params);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load tasks");
    } finally { setLoading(false); }
  }, [statusFilter, incidentFilter, assigneeFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function handleResetFilters() {
    setStatusFilter("all"); setIncidentFilter(""); setAssigneeFilter(""); setSearchQuery(""); setSortBy("date_desc");
  }

  const handleTaskNavigate = task => navigate(`/app/incidents/${task.incident_id}`, { state: { scrollToTask: task.id } });

  async function handleStatusChange(taskId, newStatus) {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) { console.error("Status update failed", err); }
  }

  async function handleComplete(taskId) { await handleStatusChange(taskId, "completed"); }

  async function handleBulkStatus(newStatus) {
    if (!selected.size) return;
    setBulkUpdating(true);
    try {
      await Promise.all([...selected].map(id => updateTask(id, { status: newStatus })));
      setTasks(prev => prev.map(t => selected.has(t.id) ? { ...t, status: newStatus } : t));
      setSelected(new Set());
    } catch (err) { console.error("Bulk update failed", err); }
    finally { setBulkUpdating(false); }
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "date_asc")      return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "date_desc")     return new Date(b.created_at) - new Date(a.created_at); 
      if (sortBy === "priority_desc") return (getPriority(a.priority).order ?? 9) - (getPriority(b.priority).order ?? 9);
      if (sortBy === "priority_asc")  return (getPriority(b.priority).order ?? 9) - (getPriority(a.priority).order ?? 9);
      if (sortBy === "status")        return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
    return list;
  }, [tasks, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total:     tasks.length,
    pending:   tasks.filter(t => t.status === "pending").length,
    critical:  tasks.filter(t => t.priority === "critical").length,
    completed: tasks.filter(t => t.status === "completed").length,
  }), [tasks]);

  const allSelected  = filtered.length > 0 && selected.size === filtered.length;
  const activeStatus = getStatus(statusFilter);

  const selectCls = "w-full appearance-none rounded-[7px] border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 font-mono text-[12px] text-zinc-300 outline-none focus:border-cyan-400/35 transition-colors";
  const inputCls  = "w-full rounded-[7px] border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 font-mono text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-cyan-400/35 transition-colors";
  const navBtn    = "flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-[7px] text-[13px] font-semibold text-zinc-400 hover:border-cyan-400/28 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-20 text-zinc-200 max-sm:px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1100px]">

        {/* TOPBAR */}
        <div className="flex items-center justify-between border-b border-white/[0.06] py-[18px] mb-9">
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-cyan-400">SafeTrack ICC</span>
          </div>
          <div className="flex gap-2">
            <button className={navBtn} onClick={() => navigate("/app/incidents")}>Incidents</button>
            <button className={navBtn} onClick={() => navigate("/app/home")}>← Dashboard</button>
          </div>
        </div>

        {/* HERO */}
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400/55">
            <div className="w-2 h-2 bg-cyan-400/40 rounded-full" /> Task Management
          </div>
          <h1 className="mb-1.5 text-[30px] font-extrabold tracking-tight text-white max-sm:text-2xl">Tasks Overview</h1>
          <p className="font-mono text-[10px] uppercase tracking-[.1em] text-zinc-600">TRACK · ASSIGN · RESOLVE · MONITOR ACROSS ALL INCIDENTS</p>
        </div>

        {/* STATS */}
        {!loading && (
          <div className="mb-5 flex flex-wrap gap-2.5">
            {[
              { key: "total",     label: "Total",     val: stats.total,     color: "#00c4ff" },
              { key: "pending",   label: "Pending",   val: stats.pending,   color: "#facc15" },
              { key: "critical",  label: "Critical",  val: stats.critical,  color: "#ef4444" },
              { key: "completed", label: "Completed", val: stats.completed, color: "#4ade80" },
            ].map(s => (
              <div key={s.key}
                onClick={() => { if (s.key === "pending" || s.key === "completed") setStatusFilter(prev => prev === s.key ? "all" : s.key); }}
                className="flex min-w-[70px] flex-1 cursor-pointer flex-col gap-0.5 rounded-[9px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 hover:border-white/10 hover:bg-white/[0.035] transition-colors">
                <span className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color: s.color }}>{s.val}</span>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[.1em] text-zinc-600">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* FILTER PANEL */}
        <div className="mb-4 rounded-[14px] border border-white/[0.07] bg-white/[0.02] px-5 py-4">
          <div className="mb-3.5 flex items-center gap-2">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-cyan-400/14 bg-cyan-400/[0.08] text-cyan-400"><Filter size={12} /></div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[.08em] text-zinc-500">Search &amp; Filter</span>
          </div>

          <div className="relative mb-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"><Search size={14} /></span>
            <input className="w-full rounded-[8px] border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-3 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-cyan-400/35 transition-colors"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks by title or description…" />
          </div>

          <form onSubmit={e => { e.preventDefault(); loadTasks(); }}>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2.5 max-[900px]:grid-cols-[1fr_1fr_1fr] max-[560px]:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="status-filter" className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Status</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: activeStatus.color }} />
                  <select id="status-filter" className={selectCls} style={{ paddingLeft: "22px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    {Object.entries(STATUS_CONFIG).map(([k, c]) => <option key={k} value={k} style={{ background: "#141418" }}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Sort By</label>
                <select className={selectCls} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: "#141418" }}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Incident ID</label>
                <input className={inputCls} type="number" min={1} value={incidentFilter} onChange={e => setIncidentFilter(e.target.value)} placeholder="Incident ID" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Assignee ID</label>
                <input className={inputCls} type="number" min={1} value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} placeholder="Assignee ID" />
              </div>

              <div className="flex items-end gap-1.5 max-[900px]:col-span-3 max-[560px]:col-span-2">
                <button type="button" onClick={loadTasks} disabled={loading} title="Refresh"
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-cyan-400/28 hover:text-cyan-400 disabled:opacity-40 transition-colors">
                  <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
                </button>
                <button type="button" onClick={handleResetFilters} title="Reset"
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300 transition-colors">
                  <X size={13} />
                </button>
                <button type="submit"
                  className="flex h-[34px] items-center gap-1.5 rounded-[7px] border border-cyan-400/35 bg-cyan-400/10 px-3.5 font-mono text-[12px] font-bold text-cyan-400 hover:bg-cyan-400/[0.18] transition-colors whitespace-nowrap">
                  <SlidersHorizontal size={12} /> Apply
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 font-mono text-[12px] text-red-400">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* BULK BAR */}
        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2.5 rounded-[10px] border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-2.5">
            <span className="shrink-0 font-mono text-[11px] tracking-[.05em] text-cyan-400">{selected.size} selected — set status:</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {STATUS_VALUES.map(s => {
                const sc = STATUS_CONFIG[s];
                return (
                  <button key={s} onClick={() => handleBulkStatus(s)} disabled={bulkUpdating}
                    className="rounded-[6px] border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[.05em] hover:opacity-80 disabled:opacity-35 transition-opacity"
                    style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}>
                    {sc.label}
                  </button>
                );
              })}
            </div>
            {bulkUpdating && <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400/50"><Loader2 size={11} className="animate-spin" /> Updating…</span>}
            <button onClick={() => setSelected(new Set())}
              className="flex items-center gap-1 rounded-[6px] border border-white/[0.07] bg-transparent px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-500 hover:border-red-500/30 hover:text-red-400 transition-colors">
              <X size={11} /> Deselect
            </button>
          </div>
        )}

        {/* RESULTS BAR */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-zinc-600">Results</span>
            {!loading && <span className="font-mono text-[11px] text-cyan-400/60">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>}
            {loading  && <Loader2 size={12} className="animate-spin text-cyan-400" />}
          </div>
          {!loading && filtered.length > 0 && (
            <button onClick={() => { if (allSelected) setSelected(new Set()); else setSelected(new Set(filtered.map(t => t.id))); }}
              className="flex items-center gap-1.5 rounded-[6px] border border-white/[0.07] bg-transparent px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-500 hover:border-cyan-400/25 hover:text-cyan-400 transition-colors">
              {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>

        {/* TASK LIST */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[105px] rounded-[12px] border border-white/[0.05] bg-white/[0.02]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.015] py-16 text-center">
            <ClipboardList size={40} className="opacity-10" />
            <p className="text-[15px] font-bold text-zinc-600">{searchQuery ? "No tasks match your search" : "No tasks found"}</p>
            <p className="font-mono text-[10px] tracking-[.06em] text-zinc-700">Try adjusting filters or search query</p>
            <button onClick={handleResetFilters}
              className="flex items-center gap-1.5 rounded-[8px] border border-cyan-400/25 bg-cyan-400/[0.06] px-3.5 py-[7px] text-[12px] font-bold text-cyan-400 hover:bg-cyan-400/12 transition-colors">
              <X size={11} /> Reset
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} selected={selected.has(task.id)}
                currentUser={currentUser}
                onSelect={toggleSelect} onNavigate={handleTaskNavigate}
                onStatusChange={handleStatusChange} onComplete={handleComplete} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}