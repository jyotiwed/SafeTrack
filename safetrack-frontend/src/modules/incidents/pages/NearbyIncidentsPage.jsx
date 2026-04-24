// src/modules/incidents/pages/NearbyIncidentsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, AlertCircle, Loader2, ChevronRight, Navigation, Radio } from "lucide-react";
import { listNearbyIncidents } from "../api/incidentsApi.js";

const SEV_STYLE = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.22)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.22)" },
  medium:   { color: "#facc15", bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.22)" },
  low:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.22)" },
  info:     { color: "#00c4ff", bg: "rgba(0,196,255,0.10)",  border: "rgba(0,196,255,0.22)"  },
};
const getSev = s => SEV_STYLE[s] || SEV_STYLE.info;

export default function NearbyIncidentsPage() {
  const navigate = useNavigate();
  const [coords,    setCoords]    = useState({ latitude: "", longitude: "" });
  const [radius,    setRadius]    = useState(5000);
  const [incidents, setIncidents] = useState([]);
  const [searched,  setSearched]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [locating,  setLocating]  = useState(false);

  function handleCoordChange(e) {
    const { name, value } = e.target;
    setCoords(prev => ({ ...prev, [name]: value }));
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }); setLocating(false); },
      err  => { console.error("Geolocation error:", err); setLocating(false); }
    );
  }

  async function handleSearch(e) {
    e.preventDefault(); setError(null);
    const lat = Number(coords.latitude), lon = Number(coords.longitude), rad = Number(radius);
    if (Number.isNaN(lat) || Number.isNaN(lon)) { setError("Please enter valid latitude and longitude."); return; }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) { setError("Latitude must be -90 to 90, longitude -180 to 180."); return; }
    if (Number.isNaN(rad) || rad <= 0 || rad > 50000) { setError("Radius must be between 1 and 50 000 meters."); return; }
    setLoading(true);
    try {
      const data = await listNearbyIncidents({ latitude: lat, longitude: lon, radius_meters: rad, limit: 50, offset: 0 });
      setIncidents(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to load nearby incidents");
    } finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-[9px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[13px] text-zinc-200 outline-none placeholder:text-zinc-700 transition-colors focus:border-cyan-400/35";
  const navBtn   = "flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-[7px] text-[13px] font-semibold text-zinc-400 hover:border-cyan-400/28 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-20 text-zinc-200 max-sm:px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1100px]">

        {/* TOPBAR */}
        <div className="flex items-center justify-between border-b border-white/[0.06] py-[18px] mb-12">
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.15em] text-cyan-400">SafeTrack ICC</span>
          </div>
          <div className="flex gap-2">
            <button className={navBtn} onClick={() => navigate("/app/incidents")}>← Incidents</button>
            
          </div>
        </div>

        {/* HERO */}
        <div className="mb-10">
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400/55">
            <div className=" bg-cyan-400/40" /> Proximity Search
          </div>
          <h1 className="mb-2 text-[32px] font-extrabold tracking-tight text-white max-sm:text-2xl">Nearby Incidents</h1>
          <p className="text-[14px] leading-relaxed text-zinc-500 max-w-[500px]">
            Discover active emergencies around any coordinate. Use your GPS location or enter coordinates manually.
          </p>
        </div>

        {/* SEARCH PANEL */}
        <div className="relative mb-10 overflow-hidden rounded-[18px] border border-cyan-400/[0.18] bg-gradient-to-[150deg] from-cyan-400/[0.05] to-white/[0.02] px-7 pb-6 pt-7 max-sm:px-5">
          <div className="absolute inset-x-0 top-0 h-[2px] opacity-60"
            style={{ background: "linear-gradient(90deg, transparent, #00c4ff 40%, transparent)" }} />
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-cyan-400/20 bg-cyan-400/10 text-cyan-400"><Radio size={16} /></div>
            <div>
              <p className="text-[15px] font-bold text-zinc-200">Location Search</p>
              <p className="font-mono text-[10px] uppercase tracking-[.05em] text-cyan-400/45 mt-0.5">Enter coordinates &amp; radius</p>
            </div>
          </div>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 max-[780px]:grid-cols-[1fr_1fr] max-sm:grid-cols-1">
              {["Latitude", "Longitude"].map(field => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500">{field}</label>
                  <input className={inputCls} name={field.toLowerCase()} type="number" step="any"
                    value={field === "Latitude" ? coords.latitude : coords.longitude}
                    onChange={handleCoordChange}
                    placeholder={field === "Latitude" ? "19.4308" : "72.8386"} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500">Radius (meters)</label>
                <input className={inputCls} type="number" value={radius} onChange={e => setRadius(e.target.value)} placeholder="5000" />
              </div>
              <div className="flex items-end gap-1.5 max-[780px]:col-span-2 max-sm:col-span-1">
                <button type="button" onClick={handleUseMyLocation} title="Use my location"
                  className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] border transition-colors ${locating ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400" : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-cyan-400/25 hover:text-cyan-400"}`}>
                  {locating ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                </button>
                <button type="submit" disabled={loading}
                  className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[9px] border border-cyan-400/30 bg-cyan-400/10 font-mono text-[13px] font-bold text-cyan-400 hover:bg-cyan-400/[0.18] disabled:opacity-50 transition-colors">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Searching…</> : <><Search size={14} /> Search</>}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/22 bg-red-500/[0.08] px-3.5 py-2.5 font-mono text-[12px] text-red-400">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* RESULTS */}
        {searched || loading ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-zinc-500">Search Results</span>
              {!loading && (
                <span className="rounded-full border border-cyan-400/[0.18] bg-cyan-400/[0.08] px-2.5 py-[2px] font-mono text-[10px] text-cyan-400">
                  {incidents.length} incident{incidents.length !== 1 ? "s" : ""} found
                </span>
              )}
              {loading && <Loader2 size={13} className="animate-spin text-cyan-400" />}
            </div>
            {!loading && incidents.length === 0 ? (
              <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] py-12 text-center">
                <div className="mb-3 text-[34px] opacity-20">📡</div>
                <p className="mb-1.5 text-[15px] font-bold text-zinc-600">No incidents in this area</p>
                <p className="font-mono text-[10px] text-zinc-700">Try increasing the radius or searching a different location</p>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {incidents.map(incident => {
                  const sev = getSev(incident.severity);
                  return (
                    <article key={incident.id} onClick={() => navigate(`/app/incidents/${incident.id}`)}
                      className="group relative cursor-pointer overflow-hidden rounded-[13px] border border-white/[0.06] bg-white/[0.025] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-colors">
                      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-[13px]" style={{ background: sev.color }} />
                      <div className="mb-2 flex items-center justify-between gap-3 pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {incident.severity && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[.1em]"
                              style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>
                              <span className="h-1 w-1 rounded-full" style={{ background: sev.color }} />
                              {incident.severity.toUpperCase()}
                            </span>
                          )}
                          {incident.distance_meters != null && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-600">
                              <MapPin size={9} />
                              {incident.distance_meters < 1000 ? `${Math.round(incident.distance_meters)} m` : `${(incident.distance_meters / 1000).toFixed(1)} km`}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={14} className="shrink-0 text-zinc-700 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="mb-1.5 pl-2 text-[14px] font-bold leading-snug text-zinc-200 group-hover:text-cyan-400 transition-colors">{incident.title}</p>
                      {incident.description && <p className="line-clamp-2 pl-2 text-[12px] leading-relaxed text-zinc-500">{incident.description}</p>}
                      {incident.address && (
                        <div className="mt-2 flex items-center gap-1.5 pl-2 font-mono text-[10px] text-zinc-600">
                          <MapPin size={10} className="text-cyan-400/60 shrink-0" /> {incident.address}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="mb-1 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-cyan-400/15 text-cyan-400/30">
              <Radio size={28} />
            </div>
            <p className="text-[15px] font-bold text-zinc-600">Enter coordinates to begin</p>
            <p className="font-mono text-[10px] tracking-[.06em] text-zinc-700">Use the GPS button to auto-fill your current location</p>
          </div>
        )}

      </div>
    </div>
  );
}