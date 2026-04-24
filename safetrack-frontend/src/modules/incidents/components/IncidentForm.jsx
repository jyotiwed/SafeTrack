// src/modules/incidents/components/IncidentForm.jsx
import { useEffect, useState } from "react";
import { createIncident } from "../api/incidentsApi.js";
import {
  AlertCircle, MapPin, AlertOctagon,
  Type, Send, Locate, X, Link, Plus,
} from "lucide-react";

const defaultForm = {
  title: "", description: "", severity: "medium",
  address: "", latitude: "", longitude: "",
};

/* ══════════════════════════════════════════════════════
   MAP PICKER COMPONENT (Tailwind)
══════════════════════════════════════════════════════ */
function MapPicker({ lat, lng, onPick }) {
  const [locating, setLocating] = useState(false);
  const [pin, setPin]           = useState(null);
  const [center, setCenter]     = useState({ lat: 20.5937, lng: 78.9629, zoom: 5 });

  useEffect(() => {
    if (lat && lng) {
      setCenter({ lat: Number(lat), lng: Number(lng), zoom: 14 });
      setPin({ xPct: 50, yPct: 50 });
    }
  }, [lat, lng]);

  function iframeSrc() {
    const d  = 360 / Math.pow(2, center.zoom);
    const d2 = d * 0.6;
    const bbox = [center.lng - d, center.lat - d2, center.lng + d, center.lat + d2].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left)  / rect.width;
    const yPct = (e.clientY - rect.top)   / rect.height;
    const d    = 360 / Math.pow(2, center.zoom);
    const clickLng = center.lng + (xPct - 0.5) * d * 2;
    const clickLat = center.lat - (yPct - 0.5) * d * 1.2;
    setPin({ xPct: xPct * 100, yPct: yPct * 100 });
    setCenter(p => ({ ...p, lat: clickLat, lng: clickLng }));
    onPick({ lat: clickLat.toFixed(6), lng: clickLng.toFixed(6) });
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCenter({ lat: latitude, lng: longitude, zoom: 15 });
        setPin({ xPct: 50, yPct: 50 });
        onPick({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <>
      <div className="flex gap-2 mb-2">
        <button 
          type="button" 
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[12px] font-semibold text-zinc-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={geolocate} 
          disabled={locating}
        >
          <Locate size={13} />
          {locating ? "Locating…" : "Use My Location"}
        </button>
      </div>

      <div className="relative h-50 rounded-lg overflow-hidden border border-white/[0.08] bg-[#0d1117] cursor-crosshair mb-2">
        <iframe title="incident-map" src={iframeSrc()} loading="lazy" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-none block pointer-events-none" />
        <div className="absolute inset-0 z-10 cursor-crosshair" onClick={handleClick} />
        {pin && (
          <div className="absolute z-20 pointer-events-none" style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%`, transform: 'translate(-50%, -100%)' }}>
            <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <path d="M13 0C5.82 0 0 5.82 0 13c0 8.667 13 21 13 21S26 21.667 26 13C26 5.82 20.18 0 13 0z" fill="#00c4ff"/>
              <circle cx="13" cy="13" r="5.5" fill="white"/>
            </svg>
          </div>
        )}
      </div>

      <p className="font-mono text-[10px] tracking-[0.04em] text-zinc-600 text-center mb-2">
        TAP MAP TO DROP PIN  ·  OR USE "USE MY LOCATION"
      </p>

      {lat && lng && (
        <div className="flex gap-4 items-center flex-wrap px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] mb-2">
          <span><span className="text-zinc-600 mr-1">LAT</span><span className="text-cyan-400/75">{Number(lat).toFixed(6)}</span></span>
          <span><span className="text-zinc-600 mr-1">LNG</span><span className="text-cyan-400/75">{Number(lng).toFixed(6)}</span></span>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MEDIA URL INPUT COMPONENT (Tailwind)
══════════════════════════════════════════════════════ */
function MediaUrlInput({ urls, onChange }) {
  const [input, setInput] = useState("");

  function addUrl() {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    // Basic URL validation
    try {
      new URL(trimmed);
      if (!urls.includes(trimmed)) {
        onChange([...urls, trimmed]);
      }
      setInput("");
    } catch {
      // Optionally show error - keeping it silent for now
      setInput("");
    }
  }

  function remove(i) {
    onChange(urls.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/image.jpg"
          className="flex-1 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 rounded-lg border border-cyan-400/35 bg-cyan-400/[0.12] text-cyan-400 hover:bg-cyan-400/[0.2] transition-colors flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.08em] uppercase"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {urls.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.06] bg-white/[0.025]">
              <div className="w-9 h-9 rounded flex-shrink-0 bg-white/[0.05] flex items-center justify-center">
                <Link size={16} className="text-cyan-400/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-zinc-400/65 truncate">{url}</div>
              </div>
              <button 
                type="button" 
                className="w-6 h-6 flex items-center justify-center rounded cursor-pointer border-none bg-transparent text-zinc-400/22 hover:bg-red-500/10 hover:text-red-400 flex-shrink-0" 
                onClick={() => remove(i)}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN FORM (Tailwind)
══════════════════════════════════════════════════════ */
export default function IncidentForm({ onCreated }) {
  const [form, setForm]         = useState(defaultForm);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  function set(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  function handleMapPick({ lat, lng }) {
    setForm(p => ({ ...p, latitude: lat, longitude: lng }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        severity:    form.severity,
        status:      "new",
        address:     form.address    || null,
        latitude:    form.latitude   !== "" ? Number(form.latitude)  : null,
        longitude:   form.longitude  !== "" ? Number(form.longitude) : null,
        media_urls:  mediaUrls.length > 0 ? mediaUrls : null,
      };

      const incident = await createIncident(payload);
      setForm(defaultForm);
      setMediaUrls([]);
      setSuccess(true);
      if (onCreated) onCreated(incident);
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Failed to create incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-sans text-zinc-200">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/25 bg-red-500/[0.07] text-[13px] text-red-400 mb-3">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] text-[13px] text-emerald-400 mb-3">
          ✓ Incident reported successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── BASIC INFO ── */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-3">
            <Type size={12} /> Basic Information
          </div>
          <input
            className="w-full px-3 py-2 rounded-lg mb-2 border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22"
            name="title" required
            value={form.title} onChange={set} placeholder="Incident title *"
          />
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22 resize-y min-h-[80px]"
            name="description" required
            value={form.description} onChange={set} placeholder="Describe what happened *"
          />
        </div>

        {/* ── SEVERITY ── */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-3">
            <AlertOctagon size={12} /> Severity
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["low","medium","high","critical"].map(s => {
              const styles = {
                low:      "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
                medium:   "border-yellow-400/40 bg-yellow-400/10 text-yellow-400",
                high:     "border-orange-500/40 bg-orange-500/10 text-orange-500",
                critical: "border-red-500/40 bg-red-500/10 text-red-500",
              };
              const isActive = form.severity === s;
              return (
                <button
                  key={s} type="button"
                  className={`flex-1 min-w-[55px] px-2 py-1.5 rounded-lg cursor-pointer text-center font-mono text-[10px] font-bold tracking-[0.08em] uppercase border transition-colors ${
                    isActive 
                      ? styles[s] 
                      : 'border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:border-white/[0.15]'
                  }`}
                  onClick={() => setForm(p => ({ ...p, severity: s }))}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LOCATION ── */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-3">
            <MapPin size={12} /> Location
          </div>
          <input
            className="w-full px-3 py-2 rounded-lg mb-2 border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22"
            name="address"
            value={form.address} onChange={set}
            placeholder="Address or landmark (optional)"
          />
          <MapPicker lat={form.latitude} lng={form.longitude} onPick={handleMapPick} />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22"
              name="latitude" type="number" step="0.000001"
              value={form.latitude} onChange={set} placeholder="Latitude"
            />
            <input
              className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-200 font-sans text-[13px] outline-none focus:border-cyan-400/40 focus:bg-cyan-400/[0.03] placeholder:text-zinc-600/22"
              name="longitude" type="number" step="0.000001"
              value={form.longitude} onChange={set} placeholder="Longitude"
            />
          </div>
        </div>

        {/* ── MEDIA URLS ── */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-3">
            <Link size={12} /> Media URLs
          </div>
          <MediaUrlInput urls={mediaUrls} onChange={setMediaUrls} />
          <p className="font-mono text-[10px] text-zinc-600 mt-2">
            Paste direct links to images or videos. Supports JPG, PNG, MP4, MOV, etc.
          </p>
        </div>

        {/* ── SUBMIT ── */}
        <button 
          type="submit" 
          className="w-full px-3 py-2.5 rounded-lg cursor-pointer font-sans text-[14px] font-bold border border-cyan-400/35 bg-cyan-400/[0.12] text-cyan-400 flex items-center justify-center gap-2 hover:bg-cyan-400/[0.2] hover:border-cyan-400/55 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Send size={14} />
          {loading ? "Submitting…" : "Submit Incident Report"}
        </button>
      </form>
    </div>
  );
}