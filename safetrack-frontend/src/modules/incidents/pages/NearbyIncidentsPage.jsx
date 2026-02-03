// src/modules/incidents/pages/NearbyIncidentsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { listNearbyIncidents } from "../api/incidentsApi.js";

export default function NearbyIncidentsPage() {
  const navigate = useNavigate();

  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [radius, setRadius] = useState(5000);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleCoordChange(e) {
    const { name, value } = e.target;
    setCoords((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);

    const lat = Number(coords.latitude);
    const lon = Number(coords.longitude);
    const rad = Number(radius);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError("Please enter valid latitude and longitude.");
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError(
        "Latitude must be between -90 and 90, longitude between -180 and 180."
      );
      return;
    }
    if (Number.isNaN(rad) || rad <= 0 || rad > 50000) {
      setError("Radius must be between 1 and 50000 meters.");
      return;
    }

    setLoading(true);
    try {
      const data = await listNearbyIncidents({
        latitude: lat,
        longitude: lon,
        radius_meters: rad,
        limit: 50,
        offset: 0,
      });
      setIncidents(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to load nearby incidents"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Controls */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <header className="space-y-2 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
            Nearby Incidents
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Search for incidents around a point using coordinates or your current location.
          </p>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-6">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSearch}
          className="grid gap-6 text-sm sm:grid-cols-6"
        >
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-200">
              <MapPin className="h-4 w-4" />
              Latitude
            </label>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              min={-90}
              max={90}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={coords.latitude}
              onChange={handleCoordChange}
              required
              placeholder="e.g., 37.7749"
            />
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Between -90 and 90 degrees.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-200">
              <MapPin className="h-4 w-4" />
              Longitude
            </label>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              min={-180}
              max={180}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={coords.longitude}
              onChange={handleCoordChange}
              required
              placeholder="e.g., -122.4194"
            />
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Between -180 and 180 degrees.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="font-medium text-gray-700 dark:text-slate-200">
              Radius (meters)
            </label>
            <input
              type="number"
              min={100}
              max={50000}
              step={100}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-3 text-sm text-gray-900 dark:text-slate-50 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 transition-all"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="e.g., 5000"
            />
            <p className="text-xs text-gray-500 dark:text-slate-500">
              Search distance up to 50 km.
            </p>
          </div>

          <div className="flex flex-col items-stretch justify-end gap-3 sm:col-span-6 sm:flex-row">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-900/60 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-200 hover:border-cyan-500/60 hover:text-cyan-700 dark:hover:text-cyan-100 transition-colors sm:flex-none"
            >
              <MapPin className="h-4 w-4" />
              Use My Location
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all sm:flex-none"
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Search Nearby"}
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      <section className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/80 p-6 shadow-lg">
        <header className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-50">
            Search Results
          </h3>
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
          )}
        </header>

        {incidents.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-950/60 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-gray-500 dark:text-slate-400" />
            <p className="text-lg font-medium text-gray-900 dark:text-slate-100">
              No Incidents Found
            </p>
            <p className="max-w-md text-sm text-gray-600 dark:text-slate-400">
              Try increasing the radius or adjusting the coordinates to search a wider area.
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
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-gray-700 dark:text-slate-300">
                        {incident.severity}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">
                      {incident.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                      {incident.distance_meters != null && (
                        <span>
                          📏 {(incident.distance_meters / 1000).toFixed(2)} km away
                        </span>
                      )}
                      {incident.address && (
                        <span className="flex items-center gap-2 truncate">
                          <MapPin className="h-4 w-4" />
                          {incident.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="rounded-full border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-gray-700 dark:text-slate-300">
                      {incident.status}
                    </span>
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