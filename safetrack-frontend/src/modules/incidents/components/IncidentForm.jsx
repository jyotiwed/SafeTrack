// src/modules/incidents/components/IncidentForm.jsx
import { useState } from "react";
import { createIncident } from "../api/incidentsApi.js";
import { AlertCircle, MapPin, AlertOctagon, Image, Type, FileText, ArrowRight } from "lucide-react";

const defaultForm = {
  title: "",
  description: "",
  severity: "medium", // "low" | "medium" | "high" | "critical"
  address: "",
  latitude: "",
  longitude: "",
  mediaText: "", // textarea with one URL per line
};

export default function IncidentForm({ onCreated }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    const updatedValue = name === "latitude" || name === "longitude" ? value : value;
    setForm((prev) => ({ ...prev, [name]: updatedValue }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const media_urlsArr = form.mediaText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload = {
        title: form.title,
        description: form.description,
        severity: form.severity,
        address: form.address || null,
        latitude: form.latitude !== "" ? Number(form.latitude) : null,
        longitude: form.longitude !== "" ? Number(form.longitude) : null,
        media_urls: media_urlsArr.length > 0 ? media_urlsArr : null,
      };

      const incident = await createIncident(payload);
      setForm(defaultForm);
      if (onCreated) onCreated(incident);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Failed to create incident"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-950/80 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
          Report New Incident
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Provide details to help your team respond effectively.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Type className="h-4 w-4" />
            Title
          </label>
          <input
            name="title"
            type="text"
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={form.title}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={255}
            placeholder="Enter a concise title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <FileText className="h-4 w-4" />
            Description
          </label>
          <textarea
            name="description"
            className="min-h-[120px] w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={form.description}
            onChange={handleChange}
            required
            minLength={10}
            placeholder="Provide detailed description of the incident"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <MapPin className="h-4 w-4" />
            Address / Location (optional)
          </label>
          <input
            name="address"
            type="text"
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g., Plant A, Gate 3"
          />
        </div>

        {/* Severity + coordinates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
              <AlertOctagon className="h-4 w-4" />
              Severity
            </label>
            <select
              name="severity"
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={form.severity}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Latitude (optional)
            </label>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              min={-90}
              max={90}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={form.latitude}
              onChange={handleChange}
              placeholder="e.g., 37.7749"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Longitude (optional)
            </label>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              min={-180}
              max={180}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={form.longitude}
              onChange={handleChange}
              placeholder="e.g., -122.4194"
            />
          </div>
        </div>

        {/* Media URLs */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Image className="h-4 w-4" />
            Media URLs (optional)
          </label>
          <textarea
            name="mediaText"
            className="min-h-[100px] w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/40 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="One URL per line (images, videos, documents)"
            value={form.mediaText}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 dark:text-slate-400">
            These links will be sent as an array of URLs in the media_urls field.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        <span>{loading ? "Submitting..." : "Create Incident"}</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}