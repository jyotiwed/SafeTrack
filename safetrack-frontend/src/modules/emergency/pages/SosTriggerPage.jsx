// src/modules/emergency/SosTriggerPage.jsx
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { triggerSos } from "../api/emergencyApi";
import {
  MapPin, Navigation, AlertTriangle, CheckCircle2, AlertCircle,
  Loader2, Send, X, Download, Map, Share2, Battery, Wifi, WifiOff,
  Zap, Ambulance, Flame, Car, Hospital, ShieldCheck, Phone,
} from "lucide-react";

/* ─── Leaflet icons ───────────────────────────────────────────────────────── */
const makeIcon = (color, symbol) => L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px #0008">${symbol}</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
});
const sosIcon      = makeIcon("#ef4444", "🆘");
const hospitalIcon = makeIcon("#34d399", "🏥");
const policeIcon   = makeIcon("#60a5fa", "👮");
delete L.Icon.Default.prototype._getIconUrl;

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 15); }, [lat, lng, map]);
  return null;
}

/* ─── Templates ──────────────────────────────────────────────────────────── */
const TEMPLATES = [
  { icon: Ambulance, label: "Medical",  color: "#4ade80", text: "Medical emergency! Please send ambulance immediately."   },
  { icon: Flame,     label: "Fire",     color: "#f87171", text: "Fire emergency! Building on fire, need fire brigade now." },
  { icon: Car,       label: "Accident", color: "#fb923c", text: "Road accident! Injured persons need urgent help."         },
  { icon: Zap,       label: "Other",    color: "#a78bfa", text: ""                                                          },
];

/* ─── Overpass ────────────────────────────────────────────────────────────── */
async function fetchNearby(lat, lng, radius = 3000) {
  const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:${radius},${lat},${lng});node["amenity"="clinic"](around:${radius},${lat},${lng});node["amenity"="police"](around:${radius},${lat},${lng}););out body 20;`;
  const res  = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
  const data = await res.json();
  return (data.elements || []).map(el => ({
    id: el.id, type: el.tags?.amenity,
    name: el.tags?.name || (el.tags?.amenity === "police" ? "Police Station" : "Hospital"),
    lat: el.lat, lng: el.lon,
  }));
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function SosTriggerPage() {
  const [latitude,       setLatitude]       = useState("");
  const [longitude,      setLongitude]      = useState("");
  const [address,        setAddress]        = useState("");
  const [message,        setMessage]        = useState("");
  const [sending,        setSending]        = useState(false);
  const [confirming,     setConfirming]     = useState(false);
  const [feedback,       setFeedback]       = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [countdown,      setCountdown]      = useState(null);
  const [battery,        setBattery]        = useState(null);
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [shareCopied,    setShareCopied]    = useState(false);
  const [nearbyPlaces,   setNearbyPlaces]   = useState([]);
  const [loadingNearby,  setLoadingNearby]  = useState(false);
  const [showNearby,     setShowNearby]     = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall,    setShowInstall]    = useState(false);
  const cdRef = useRef(null);

  useEffect(() => {
    const h = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    if (!("getBattery" in navigator)) return;
    navigator.getBattery().then(b => {
      const upd = () => setBattery({ level: Math.round(b.level * 100), charging: b.charging });
      upd();
      b.addEventListener("levelchange", upd); b.addEventListener("chargingchange", upd);
    });
  }, []);

  useEffect(() => {
    const la = parseFloat(latitude), lo = parseFloat(longitude);
    if (!isNaN(la) && !isNaN(lo)) {
      setAddress("Loading address…");
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${lo}&zoom=16&addressdetails=1`, { headers: { "User-Agent": "SafeTrack-SOS-App" } })
        .then(r => r.json()).then(d => setAddress(d?.display_name || "Address not found"))
        .catch(() => setAddress("Could not load address"));
    } else { setAddress(""); }
  }, [latitude, longitude]);

  useEffect(() => {
    const la = parseFloat(latitude), lo = parseFloat(longitude);
    if (isNaN(la) || isNaN(lo)) { setNearbyPlaces([]); return; }
    setLoadingNearby(true);
    fetchNearby(la, lo).then(setNearbyPlaces).catch(() => setNearbyPlaces([])).finally(() => setLoadingNearby(false));
  }, [latitude, longitude]);

  function startCountdown() {
    setCountdown(5); let c = 5;
    cdRef.current = setInterval(() => {
      c--; if (c <= 0) { clearInterval(cdRef.current); setCountdown(null); sendSos(); } else setCountdown(c);
    }, 1000);
  }
  function abortCountdown() { clearInterval(cdRef.current); setCountdown(null); setConfirming(false); setFeedback(null); }
  useEffect(() => () => clearInterval(cdRef.current), []);

  async function sendSos() {
    try {
      setSending(true); setFeedback(null);
      await triggerSos({ latitude: parseFloat(latitude), longitude: parseFloat(longitude), message: message.trim() || "SOS from SafeTrack" });
      setFeedback({ type: "success", text: "SOS sent! Help is on the way." });
      setTimeout(() => { setLatitude(""); setLongitude(""); setAddress(""); setMessage(""); setConfirming(false); setFeedback(null); setActiveTemplate(null); }, 8000);
    } catch { setFeedback({ type: "error", text: "Failed to send SOS. Call 112 immediately." }); }
    finally { setSending(false); }
  }

  async function getCurrentLocation() {
    if (!navigator.geolocation) { setFeedback({ type: "error", text: "Geolocation not supported." }); return; }
    setLocationStatus("loading"); setFeedback(null);
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
      setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6));
      setLocationStatus("success"); setFeedback({ type: "success", text: "Location acquired!" });
    } catch (err) {
      let msg = "Location fetch failed.";
      if (err.code === 1) msg = "Permission denied — enable location access.";
      if (err.code === 3) msg = "Timed out — try again.";
      setFeedback({ type: "error", text: msg }); setLocationStatus("error");
    }
  }

  async function handleShare() {
    if (!hasValidCoords) return;
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    if (navigator.share) { await navigator.share({ title: "My Emergency Location", text: address || "SafeTrack SOS", url }); }
    else { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 3000); }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!latitude || !longitude) { setFeedback({ type: "error", text: "Set your location first." }); return; }
    if (confirming) { startCountdown(); }
    else { setConfirming(true); setFeedback({ type: "warning", text: "Confirm below — a 5-second countdown begins before sending." }); }
  }

  const lat = parseFloat(latitude), lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);
  const battLvl = battery?.level ?? 100;
  const battCls = battLvl > 50 ? "text-emerald-400 border-emerald-400/25 bg-emerald-400/[0.08]" : battLvl > 20 ? "text-amber-400 border-amber-400/25 bg-amber-400/[0.08]" : "text-red-400 border-red-400/25 bg-red-400/[0.08]";
  const hospitals  = nearbyPlaces.filter(p => p.type === "hospital" || p.type === "clinic");
  const policeStns = nearbyPlaces.filter(p => p.type === "police");

  const panelCls = "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 max-sm:p-4";
  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 font-mono text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 transition-colors focus:border-cyan-400/35 focus:bg-cyan-400/[0.03]";
  const labelCls = "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500 mb-[5px]";

  return (
    <div className="min-h-screen bg-[#09090b] px-7 pb-20 text-zinc-200 max-sm:px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">

        {/* ── TOPBAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-[18px] mb-9">
          <div className="flex items-center gap-2.5">
            <div className="h-[7px] w-[7px] rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] font-semibold tracking-[.15em] text-cyan-400 uppercase">SafeTrack ICC</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            
            {showInstall && (
              <button
                onClick={async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); setShowInstall(false); }}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-[11px] font-bold text-cyan-400 hover:bg-cyan-400/[0.18] transition-colors"
              >
                <Download size={11} /> Install App
              </button>
            )}
            <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-[7px] text-[13px] font-semibold text-zinc-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-cyan-400 transition-colors"
          >
            ← Dashboard
          </button>
          </div>
        </div>

        {/* ── OFFLINE BANNER ── */}
        {!isOnline && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 font-mono text-[12px] font-bold text-amber-400">
            <WifiOff size={13} className="shrink-0" />
            You're offline — SOS may not reach contacts. Call <span className="text-red-400 mx-1">112</span> directly.
          </div>
        )}

        {/* ── HERO ── */}
        <div className="relative mb-7 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-transparent p-7 max-sm:p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          <div className="mb-1 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.22em] text-red-400/60">
            <div className="text-justify bg-red-400/40" /> Emergency Response
          </div>
          <h1 className="mb-1.5 text-[30px] font-extrabold tracking-tight text-white max-sm:text-2xl">Emergency SOS</h1>
          <p className="mb-5 font-mono text-[10px] tracking-[.08em] text-zinc-600 uppercase">VERIFY LOCATION · SELECT TEMPLATE · CONFIRM SEND</p>
          <div className="flex items-start gap-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 font-black text-[14px] text-white">!</div>
            <div>
              <p className="mb-1 text-[13px] font-bold text-red-300">Real emergencies only</p>
              <p className="text-[12px] text-zinc-500">In India, dial <span className="font-bold text-red-400">112</span> if possible. False alerts may have legal consequences.</p>
            </div>
          </div>
        </div>

        {/* ── QUICK DIAL ── */}
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-600">
          <Phone size={9} /> Call Emergency Services Directly
        </p>
        <div className="mb-7 grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
          {[
            { number: "112", label: "Unified Emergency", textCls: "text-red-400",     borderCls: "border-red-500/20",     bgCls: "bg-red-500/[0.06]"     },
            { number: "100", label: "Police",            textCls: "text-blue-400",    borderCls: "border-blue-500/20",    bgCls: "bg-blue-500/[0.06]"    },
            { number: "101", label: "Fire Brigade",      textCls: "text-orange-400",  borderCls: "border-orange-500/20",  bgCls: "bg-orange-500/[0.06]"  },
            { number: "108", label: "Ambulance",         textCls: "text-emerald-400", borderCls: "border-emerald-500/20", bgCls: "bg-emerald-500/[0.06]" },
          ].map(s => (
            <a key={s.number} href={`tel:${s.number}`}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border ${s.borderCls} ${s.bgCls} py-4 px-2 text-center no-underline hover:brightness-110 hover:-translate-y-0.5 transition-all`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${s.borderCls} bg-white/[0.04]`}>
                <Phone size={15} className={s.textCls} />
              </div>
              <span className={`text-[22px] font-black leading-none tracking-tight ${s.textCls}`}>{s.number}</span>
              <span className={`font-mono text-[9px] font-semibold uppercase tracking-[.04em] ${s.textCls} opacity-70 leading-tight text-center`}>{s.label}</span>
            </a>
          ))}
        </div>
        <p className="mb-7 font-mono text-[9px] text-zinc-600">
          Tap any number to call instantly. <span className="font-bold text-red-400">112</span> works even without a SIM card.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* feedback */}
          {feedback && (
            <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-bold ${feedback.type === "success" ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400" : feedback.type === "warning" ? "border-amber-500/25 bg-amber-500/[0.08] text-amber-400" : "border-red-500/25 bg-red-500/[0.08] text-red-400"}`}>
              {feedback.type === "success" && <CheckCircle2 size={15} className="shrink-0" />}
              {feedback.type === "warning" && <AlertTriangle size={15} className="shrink-0" />}
              {feedback.type === "error"   && <AlertCircle  size={15} className="shrink-0" />}
              {feedback.text}
            </div>
          )}

          {/* ── TEMPLATES ── */}
          <div className={panelCls}>
            <p className={labelCls}><Zap size={9} /> Quick Message Templates</p>
            <div className="mt-3 grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
              {TEMPLATES.map(t => (
                <button key={t.label} type="button"
                  onClick={() => { setActiveTemplate(t.label); if (t.text) setMessage(t.text); }}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-3.5 px-2 text-center transition-all hover:brightness-110 ${activeTemplate === t.label ? "border-white/20 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.03]"}`}
                  style={{ color: t.color }}>
                  <t.icon size={20} style={{ color: t.color }} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[.06em]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── MAP ── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
              <Map size={14} className="text-cyan-400" />
              <span className="text-[13px] font-bold text-zinc-200">Live Location Map</span>
              <div className="flex gap-3 ml-2">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-zinc-600">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" /> Hospital
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-zinc-600">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" /> Police
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {loadingNearby && <Loader2 size={13} className="animate-spin text-cyan-400" />}
                {hasValidCoords && <span className="font-mono text-[9px] font-bold uppercase tracking-[.08em] rounded-full border border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-400 px-2.5 py-1">Location Set</span>}
                {hasValidCoords && (
                  <button type="button" onClick={handleShare}
                    className={`flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-transparent px-2.5 py-1.5 font-mono text-[10px] font-bold transition-colors hover:border-cyan-400/25 hover:text-cyan-400 ${shareCopied ? "text-cyan-400" : "text-zinc-500"}`}>
                    <Share2 size={11} /> {shareCopied ? "Copied!" : "Share"}
                  </button>
                )}
              </div>
            </div>
            <div className="h-[300px] bg-[#0a0a0f] max-sm:h-[220px]">
              {hasValidCoords ? (
                <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <RecenterMap lat={lat} lng={lng} />
                  <Marker position={[lat, lng]} icon={sosIcon}>
                    <Popup><strong>📍 Your Location</strong>{address && <><br /><small>{address.slice(0, 80)}</small></>}</Popup>
                  </Marker>
                  {showNearby && hospitals.map(h => (
                    <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                      <Popup><strong>🏥 {h.name}</strong><br /><small style={{ color: "#34d399" }}>Hospital / Clinic</small></Popup>
                    </Marker>
                  ))}
                  {showNearby && policeStns.map(p => (
                    <Marker key={p.id} position={[p.lat, p.lng]} icon={policeIcon}>
                      <Popup><strong>👮 {p.name}</strong><br /><small style={{ color: "#60a5fa" }}>Police Station</small></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <MapPin size={32} className="opacity-10" />
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[.1em] text-zinc-700">Map shows after location is set</p>
                </div>
              )}
            </div>
            {address && (
              <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-3 text-[12px] leading-relaxed text-zinc-500">
                <span className="font-bold text-zinc-600">Near: </span>{address}
              </div>
            )}
          </div>

          {/* ── NEARBY LIST ── */}
          {hasValidCoords && (
            <div className={panelCls}>
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className={labelCls + " mb-0"}><Hospital size={9} /> Nearby Emergency Services</p>
                  {nearbyPlaces.length > 0 && (
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[.06em] rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-400 px-2 py-0.5">
                      {nearbyPlaces.length} found
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => setShowNearby(v => !v)}
                  className="rounded-lg border border-white/[0.07] bg-transparent px-2.5 py-1.5 font-mono text-[10px] font-bold text-zinc-500 hover:border-cyan-400/25 hover:text-cyan-400 transition-colors">
                  {showNearby ? "Hide on map" : "Show on map"}
                </button>
              </div>
              {loadingNearby ? (
                <div className="flex items-center gap-2.5 py-4 font-mono text-[12px] font-bold text-zinc-500">
                  <Loader2 size={14} className="animate-spin text-cyan-400" /> Searching nearby services…
                </div>
              ) : nearbyPlaces.length === 0 ? (
                <p className="font-mono text-[12px] text-zinc-600">No hospitals or police stations found within 3 km.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {hospitals.length > 0 && <>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-emerald-400 mb-1">Hospitals & Clinics</p>
                    {hospitals.slice(0, 4).map(h => (
                      <div key={h.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-white/10 hover:bg-white/[0.04] transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.08]">
                          <Hospital size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-bold text-zinc-200">{h.name}</p>
                          <p className="font-mono text-[10px] text-zinc-500">{h.lat.toFixed(4)}, {h.lng.toFixed(4)}</p>
                        </div>
                        <a href={`https://maps.google.com/?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer"
                          className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-400 no-underline hover:bg-emerald-400/[0.14] transition-colors">
                          Directions →
                        </a>
                      </div>
                    ))}
                  </>}
                  {policeStns.length > 0 && <>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-blue-400 mb-1 mt-2">Police Stations</p>
                    {policeStns.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-white/10 hover:bg-white/[0.04] transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/25 bg-blue-400/[0.08]">
                          <ShieldCheck size={14} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-bold text-zinc-200">{p.name}</p>
                          <p className="font-mono text-[10px] text-zinc-500">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</p>
                        </div>
                        <a href={`https://maps.google.com/?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer"
                          className="shrink-0 rounded-lg border border-blue-400/20 bg-blue-400/[0.07] px-2.5 py-1 font-mono text-[10px] font-bold text-blue-400 no-underline hover:bg-blue-400/[0.14] transition-colors">
                          Directions →
                        </a>
                      </div>
                    ))}
                  </>}
                </div>
              )}
            </div>
          )}

          {/* ── LOCATION INPUTS ── */}
          <div className={panelCls}>
            <button type="button" onClick={getCurrentLocation} disabled={locationStatus === "loading" || sending}
              className="mb-5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-zinc-400 hover:border-emerald-400/30 hover:bg-emerald-400/[0.05] hover:text-emerald-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              {locationStatus === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {locationStatus === "loading" ? "Fetching Location…" : "Use My Location"}
            </button>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <div>
                <label className={labelCls}><MapPin size={9} /> Latitude *</label>
                <input className={inputCls} type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="18.5204" />
              </div>
              <div>
                <label className={labelCls}><MapPin size={9} /> Longitude *</label>
                <input className={inputCls} type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="73.8567" />
              </div>
            </div>
          </div>

          {/* ── MESSAGE ── */}
          <div className={panelCls}>
            <label className={labelCls}>Message (optional)</label>
            <textarea className={inputCls + " resize-y min-h-[80px] leading-relaxed"}
              value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="e.g. Medical emergency near Chinchwad station…" />
          </div>

          {/* ── COUNTDOWN ── */}
          {countdown !== null && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-8 text-center max-sm:p-5">
              <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-red-400/70">Sending SOS in…</p>
              <div className="mb-5 text-[80px] font-black leading-none tracking-tight text-red-400 max-sm:text-[60px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {countdown}
              </div>
              <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-red-500" style={{ animation: "cd-shrink 5s linear forwards" }} />
              </div>
              <style>{`@keyframes cd-shrink{from{width:100%}to{width:0%}}`}</style>
              <button type="button" onClick={abortCountdown}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-transparent px-6 py-3 text-[14px] font-bold text-red-400 hover:bg-red-500/[0.1] transition-colors">
                <X size={14} /> Cancel SOS
              </button>
            </div>
          )}

          {/* ── FOOTER / SUBMIT ── */}
          {countdown === null && (
            <div className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition-colors max-sm:flex-col max-sm:items-stretch ${confirming ? "border-red-500/25 bg-red-500/[0.04]" : "border-white/[0.07] bg-white/[0.02]"}`}>
              <p className="max-w-[280px] text-[12px] leading-relaxed text-zinc-500 max-sm:max-w-none">
                {confirming ? "⚠️ A 5-second countdown begins on confirm. You can cancel it." : "Check the map and address above before sending."}
              </p>
              <div className="flex shrink-0 gap-2.5 max-sm:flex-col">
                {confirming && (
                  <button type="button" onClick={() => { setConfirming(false); setFeedback(null); }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-5 py-3 text-[13px] font-bold text-zinc-500 hover:border-zinc-500/30 hover:text-zinc-300 transition-colors">
                    <X size={14} /> Cancel
                  </button>
                )}
                <button type="submit" disabled={sending || !hasValidCoords}
                  className={`flex items-center justify-center gap-2.5 rounded-xl px-8 py-3 text-[15px] font-black uppercase tracking-[.04em] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${confirming ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-red-900/80 hover:bg-red-800"}`}>
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sending ? "Sending…" : confirming ? "Confirm & Send SOS" : "Send SOS Now"}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}