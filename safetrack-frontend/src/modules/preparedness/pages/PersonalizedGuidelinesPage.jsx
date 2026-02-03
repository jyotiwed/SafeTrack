import { useState } from "react";
import { getPersonalizedGuidelines } from "../api/preparednessApi";
import { MapPin, AlertTriangle, Clock, Globe, Ruler, Loader2, Search, AlertCircle } from "lucide-react";

export default function PersonalizedGuidelinesPage() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [hazard, setHazard] = useState("flood");
  const [phase, setPhase] = useState("before");
  const [language, setLanguage] = useState("en");
  const [radius, setRadius] = useState(50000);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        hazard_type: hazard,
        phase,
        language_code: language,
        radius_meters: Number(radius),
      };
      const data = await getPersonalizedGuidelines(payload);
      setResults(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to load personalized guidelines"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
          Personalized Preparedness
        </h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Get guidelines tailored to your location, hazard type, and phase.
        </p>
      </header>

      {/* query form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg sm:grid-cols-3"
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <MapPin className="h-4 w-4" />
            Latitude
          </label>
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="e.g., 37.7749"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Between -90 and 90 degrees.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <MapPin className="h-4 w-4" />
            Longitude
          </label>
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="e.g., -122.4194"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Between -180 and 180 degrees.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <AlertTriangle className="h-4 w-4" />
            Hazard
          </label>
          <select
            value={hazard}
            onChange={(e) => setHazard(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
          >
            <option value="flood">Flood</option>
            <option value="cyclone">Cyclone</option>
            <option value="earthquake">Earthquake</option>
            <option value="heatwave">Heatwave</option>
            <option value="landslide">Landslide</option>
            <option value="generic">Generic</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Clock className="h-4 w-4" />
            Phase
          </label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
          >
            <option value="before">Before</option>
            <option value="during">During</option>
            <option value="after">After</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Globe className="h-4 w-4" />
            Language
          </label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="en"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <Ruler className="h-4 w-4" />
            Radius (meters)
          </label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            min={1000}
            max={100000}
            step={1000}
            className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
            placeholder="50000"
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Search distance up to 100 km.
          </p>
        </div>

        <div className="sm:col-span-3 flex items-end gap-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            {loading ? "Loading..." : "Get Guidelines"}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </form>

      {/* results */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              No Personalized Guidelines Yet
            </p>
            <p className="max-w-md text-sm text-gray-600 dark:text-slate-400">
              Enter your coordinates and hazard above to see the most relevant preparedness guidance for your area.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950/90 p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      {g.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-600 dark:text-slate-400">
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Phase: {g.phase}
                      </span>
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Hazard: {g.hazard_type}
                      </span>
                      <span className="rounded-full bg-white/5 dark:bg-white/10 px-3 py-1">
                        Lang: {g.language_code}
                      </span>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                        Match: {g.match_score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                  {g.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}