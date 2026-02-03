// src/modules/incidents/pages/IncidentDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertOctagon, MapPin, Calendar, Edit, ImageIcon, ChevronLeft, Loader2, Activity } from "lucide-react";

import { getIncident, updateIncident } from "../api/incidentsApi.js";
import IncidentTasksPanel from "../../tasks/components/IncidentTasksPanel.jsx";
import { PredictionsPanel as PredictionPanel } from "../../predictions/PredictionsPanel.jsx";
import { IncidentPredictionsPanel } from "../../incident-predictions/components/IncidentPredictionsPanel.jsx";

const STATUS_VALUES = ["new", "verified", "in_progress", "resolved", "closed"];

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const numericId = Number(incidentId);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  /* ---------------- Fetch Incident ---------------- */
  useEffect(() => {
    if (!incidentId || Number.isNaN(numericId)) {
      setLoadError("Invalid incident id in URL");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchIncident() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getIncident(numericId);
        if (!cancelled) {
          setIncident(data);
        }
      } catch (err) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail;
        setLoadError(
          typeof detail === "string" ? detail : "Failed to load incident",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchIncident();
    return () => {
      cancelled = true;
    };
  }, [incidentId, numericId]);

  /* ---------------- Handlers ---------------- */
  function handleBack() {
    navigate("/app/incidents");
  }

  async function handleStatusChange(newStatus) {
    if (!incident || incident.status === newStatus) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const updated = await updateIncident(numericId, { status: newStatus });
      setIncident(updated);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setUpdateError(
        typeof detail === "string" ? detail : "Failed to update status",
      );
    } finally {
      setUpdating(false);
    }
  }

  /* ---------------- States ---------------- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to incidents
        </button>
        <div className="mt-4 h-48 animate-pulse rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-slate-950/70 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to incidents
        </button>
        <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to incidents
        </button>
        <p className="text-sm text-gray-600 dark:text-slate-300">Incident not found.</p>
      </div>
    );
  }

  /* ---------------- Render: top incident, middle tasks, bottom predictions ---------------- */
  return (
    <div className="space-y-8 p-4 sm:p-6">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to incidents
      </button>

      {updateError && (
        <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {updateError}
        </div>
      )}

      {/* TOP: Incident details frame */}
      <section className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.15)_0,_transparent_55%)] opacity-60" />

        {/* header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-600/30 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
              Incident #{incident.id}
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
              {incident.title}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              Reported by User #{incident.reporter_id}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>

        {/* meta row */}
        <div className="mt-6 grid gap-4 text-sm text-gray-600 dark:text-slate-300 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Reported at
              </p>
              <p className="font-medium">{new Date(incident.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Edit className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Last update
              </p>
              <p className="font-medium">{new Date(incident.updated_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Status
              </p>
              <p className="font-medium capitalize">{incident.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* status + location */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Update Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Select the current operational state for this incident.
            </p>
            <div className="flex flex-wrap gap-3">
              {STATUS_VALUES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  disabled={updating || incident.status === s}
                  className={`rounded-full border px-4 py-2 text-sm uppercase tracking-wide transition-shadow ${
                    incident.status === s
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-100 shadow-md"
                      : "border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 hover:border-cyan-500 hover:shadow-md"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Location Details
            </h3>
            {incident.address && <p className="text-sm text-gray-600 dark:text-slate-300">{incident.address}</p>}
            {incident.latitude != null && incident.longitude != null ? (
              <p className="font-mono text-sm text-gray-500 dark:text-slate-400">
                Lat: {incident.latitude}, Lng: {incident.longitude}
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-slate-400">No coordinates provided.</p>
            )}
          </div>
        </div>

        {/* description */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
            Description
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-slate-50">
            {incident.description}
          </p>
        </div>

        {/* media */}
        {incident.media_urls?.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">
              Attached Media
            </h3>
            <ul className="grid gap-3 text-sm text-cyan-600 dark:text-cyan-300 sm:grid-cols-2">
              {incident.media_urls.map((url, idx) => (
                <li key={idx}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-3 truncate rounded-lg border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-3 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* MIDDLE: Tasks frame */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-200">
          Linked Tasks
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
          Track actions assigned to this incident in real time.
        </p>
        <IncidentTasksPanel incidentId={incident.id} />
      </section>

      {/* BOTTOM: Predictions frame */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-200">
          Predictions
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
          Stored model outputs and risk assessments for this incident.
        </p>
        <PredictionPanel incidentId={incident.id} />
      </section>
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-200">
         Incident Predictions  {/* Fixed typo: removed extra 'n' */}
        </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
               Resource forecasts, severity predictions, and ML pipeline outputs.
              </p>
                <IncidentPredictionsPanel incidentId={incident.id} />
             </section>


      <h2></h2>


    </div>
  );
}

/* ---------------- Badges ---------------- */

function SeverityBadge({ severity }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm uppercase tracking-wide border shadow-sm";

  const map = {
    critical: "border-red-600/60 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    high: "border-orange-600/60 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    medium: "border-yellow-600/60 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    low: "border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span className={`${base} ${map[severity] || map.low}`}>
      <AlertOctagon className="h-4 w-4" />
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm uppercase tracking-wide border shadow-sm";

  const map = {
    new: "border-gray-600/60 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
    verified: "border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
    in_progress: "border-blue-600/60 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    resolved: "border-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    closed: "border-purple-600/60 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };

  return (
    <span className={`${base} ${map[status] || map.new}`}>
      <Activity className="h-4 w-4" />
      {status.replace("_", " ")}
    </span>
  );
}