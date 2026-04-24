import { useEffect, useState, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  useMapEvents, useMap, Circle,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import {
  RefreshCw, Search, X, Layers, Navigation,
  Download, SlidersHorizontal, ChevronRight,
  AlertCircle, List, Map, Flame,
} from "lucide-react";
import { getIncidentsInBBox } from "../api/geospatialApi";

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV_COLOR = { low: "#22c55e", medium: "#facc15", high: "#f97316", critical: "#ef4444" };
const SEV_PRIORITY = { low: 1, medium: 2, high: 3, critical: 4 };
const SEV_LEVELS = ["low", "medium", "high", "critical"];
const SEV_LABEL  = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };

const createIcon = (severity, selected = false) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background:${SEV_COLOR[severity] || "#999"};
      width:${selected ? "22px" : "16px"};
      height:${selected ? "22px" : "16px"};
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 ${selected ? "14px 4px" : "6px"} ${SEV_COLOR[severity] || "#999"}88;
      transition:all 0.2s;">
    </div>`,
  });

// ─── Tile layers ──────────────────────────────────────────────────────────────
const TILE_LAYERS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

// ─── Map event handler (debounced bbox) ───────────────────────────────────────
function MapEventsHandler({ onMove }) {
  const timeoutRef  = useRef(null);
  const prevBBoxRef = useRef(null);
  useMapEvents({
    moveend: (e) => {
      const b = e.target.getBounds();
      const bbox = { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
      if (prevBBoxRef.current && JSON.stringify(prevBBoxRef.current) === JSON.stringify(bbox)) return;
      prevBBoxRef.current = bbox;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => onMove(bbox), 400);
    },
  });
  return null;
}

// ─── My Location button (inside map) ─────────────────────────────────────────
function LocateButton({ userPos, onLocate }) {
  const map = useMap();
  function handleClick() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      onLocate({ lat, lng });
      map.setView([lat, lng], 13);
    });
  }
  return (
    <div style={{ position: "absolute", bottom: 100, right: 12, zIndex: 1000 }}>
      <button onClick={handleClick} title="My Location"
        style={{ width: 40, height: 40, borderRadius: "50%", background: userPos ? "#14b8a6" : "#18181f", border: `2px solid ${userPos ? "#2dd4bf" : "#2a2a35"}`, color: userPos ? "#fff" : "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px #0006", transition: "all 0.2s" }}>
        <Navigation size={16} />
      </button>
    </div>
  );
}

// ─── Heatmap layer (pure CSS circles) ────────────────────────────────────────
function HeatmapLayer({ incidents }) {
  return (
    <>
      {incidents.map((inc) => (
        <Circle
          key={`heat-${inc.id}`}
          center={[inc.latitude, inc.longitude]}
          radius={8000}
          pathOptions={{
            fillColor: SEV_COLOR[inc.severity] || "#999",
            fillOpacity: 0.12,
            stroke: false,
          }}
        />
      ))}
    </>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(incidents) {
  const header = ["ID", "Title", "Severity", "Status", "Latitude", "Longitude"];
  const rows   = incidents.map((i) => [i.id, `"${i.title}"`, i.severity, i.status || "", i.latitude, i.longitude]);
  const csv    = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob   = new Blob([csv], { type: "text/csv" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href = url; a.download = `incidents-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GeospatialMap() {
  const [incidents,     setIncidents]     = useState([]);
  const [selectedId,    setSelectedId]    = useState(null);
  const [loading,       setLoading]       = useState(false);

  // Feature state
  const [activeSev,     setActiveSev]     = useState(new Set(SEV_LEVELS)); // severity filter
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showSidebar,   setShowSidebar]   = useState(false);
  const [showHeatmap,   setShowHeatmap]   = useState(false);
  const [tileLayer,     setTileLayer]     = useState("street");
  const [showTilePicker,setShowTilePicker]= useState(false);
  const [showLegend,    setShowLegend]    = useState(true);
  const [userPos,       setUserPos]       = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const abortRef = useRef(null);
  const mapRef   = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchBBoxData = useCallback(async (bbox) => {
    try {
      setLoading(true);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const data = await getIncidentsInBBox({ ...bbox, signal: abortRef.current.signal });
      setIncidents(data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBBoxData({ north: 28, south: 8, east: 97, west: 68 });
  }, [fetchBBoxData]);

  const handleRefresh = () => {
    if (!mapRef.current) return;
    const b = mapRef.current.getBounds();
    fetchBBoxData({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = incidents.filter((inc) => {
    const matchSev   = activeSev.has(inc.severity);
    const matchQuery = !searchQuery.trim() || inc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSev && matchQuery;
  });

  const sevCounts = SEV_LEVELS.reduce((acc, s) => {
    acc[s] = incidents.filter(i => i.severity === s).length;
    return acc;
  }, {});

  const sidebarList = filtered.filter(i =>
    !sidebarSearch.trim() || i.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const toggleSev = (level) => {
    setActiveSev(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const tile = TILE_LAYERS[tileLayer];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .gm-chip:hover   { filter:brightness(1.15); }
        .gm-refresh:hover{ background:#0d9488 !important; }
        .gm-sidebar-item:hover { background:#13131c !important; border-color:#2a2a45 !important; }
        .gm-sidebar-item:hover .gm-si-title { color:#2dd4bf !important; }
        .tile-opt:hover  { border-color:#2dd4bf !important; }
      `}</style>

      <div style={{ position: "relative", height: "100vh", width: "100%", background: "#0a0a0f", fontFamily: "'Inter', sans-serif" }}>

        {/* ══════════════════════════════════════════════════════════════════
            TOP CONTROL BAR
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1000, display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Search box */}
          <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 280 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280", pointerEvents: "none" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incidents…"
              style={{ width: "100%", padding: "10px 36px 10px 34px", background: "#18181f", border: "1px solid #2a2a35", borderRadius: 10, color: "#f9fafb", fontSize: 13, fontFamily: "inherit", fontWeight: 500, outline: "none", boxSizing: "border-box" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Incident count badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#18181f", border: "1px solid #1a1a28", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#f9fafb", whiteSpace: "nowrap" }}>
            <AlertCircle size={14} style={{ color: "#2dd4bf" }} />
            <span style={{ color: "#2dd4bf" }}>{filtered.length}</span>
            <span style={{ color: "#6b7280" }}>/ {incidents.length}</span>
          </div>

          {/* Refresh */}
          <button onClick={handleRefresh} disabled={loading} className="gm-refresh"
            style={{ padding: "10px 16px", background: "#14b8a6", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "background 0.2s", opacity: loading ? 0.7 : 1 }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Loading…" : "Refresh"}
          </button>

          {/* Sidebar toggle */}
          <button onClick={() => setShowSidebar(v => !v)}
            style={{ padding: "10px 14px", background: showSidebar ? "#2dd4bf20" : "#18181f", border: `1px solid ${showSidebar ? "#2dd4bf50" : "#2a2a35"}`, borderRadius: 10, color: showSidebar ? "#2dd4bf" : "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
            <List size={14} /> List
          </button>

          {/* Tile layer switcher */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowTilePicker(v => !v)}
              style={{ padding: "10px 14px", background: showTilePicker ? "#2dd4bf20" : "#18181f", border: `1px solid ${showTilePicker ? "#2dd4bf50" : "#2a2a35"}`, borderRadius: 10, color: showTilePicker ? "#2dd4bf" : "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
              <Layers size={14} /> {TILE_LAYERS[tileLayer].label}
            </button>
            {showTilePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#18181f", border: "1px solid #2a2a35", borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", gap: 4, minWidth: 130, zIndex: 2000 }}>
                {Object.entries(TILE_LAYERS).map(([key, val]) => (
                  <button key={key} className="tile-opt" onClick={() => { setTileLayer(key); setShowTilePicker(false); }}
                    style={{ padding: "8px 14px", background: tileLayer === key ? "#2dd4bf18" : "transparent", border: `1px solid ${tileLayer === key ? "#2dd4bf50" : "transparent"}`, borderRadius: 8, color: tileLayer === key ? "#2dd4bf" : "#9ca3af", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "border-color 0.15s" }}>
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Heatmap toggle */}
          <button onClick={() => setShowHeatmap(v => !v)}
            style={{ padding: "10px 14px", background: showHeatmap ? "#fb923c18" : "#18181f", border: `1px solid ${showHeatmap ? "#fb923c50" : "#2a2a35"}`, borderRadius: 10, color: showHeatmap ? "#fb923c" : "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
            <Flame size={14} /> Heatmap
          </button>

          {/* Export CSV */}
          <button onClick={() => exportCSV(filtered)}
            style={{ padding: "10px 14px", background: "#18181f", border: "1px solid #2a2a35", borderRadius: 10, color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}
            title={`Export ${filtered.length} incidents as CSV`}>
            <Download size={14} /> CSV
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEVERITY FILTER CHIPS
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: "absolute", top: 66, left: 12, zIndex: 1000, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* All toggle */}
          <button
            onClick={() => setActiveSev(activeSev.size === SEV_LEVELS.length ? new Set() : new Set(SEV_LEVELS))}
            style={{ padding: "6px 12px", background: activeSev.size === SEV_LEVELS.length ? "#2dd4bf20" : "#18181f", border: `1px solid ${activeSev.size === SEV_LEVELS.length ? "#2dd4bf50" : "#2a2a35"}`, borderRadius: 8, color: activeSev.size === SEV_LEVELS.length ? "#2dd4bf" : "#6b7280", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em" }}>
            ALL
          </button>

          {SEV_LEVELS.map((lvl) => {
            const active = activeSev.has(lvl);
            const col    = SEV_COLOR[lvl];
            return (
              <button key={lvl} className="gm-chip" onClick={() => toggleSev(lvl)}
                style={{ padding: "6px 12px", background: active ? `${col}20` : "#18181f", border: `1px solid ${active ? col + "60" : "#2a2a35"}`, borderRadius: 8, color: active ? col : "#6b7280", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", letterSpacing: "0.06em" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? col : "#374151", flexShrink: 0, transition: "background 0.2s" }}/>
                {SEV_LABEL[lvl]}
                <span style={{ fontSize: 10, opacity: 0.8 }}>({sevCounts[lvl]})</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SIDEBAR — Incident list
        ══════════════════════════════════════════════════════════════════ */}
        {showSidebar && (
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 320, background: "#0e0e17", borderRight: "1px solid #1a1a28", zIndex: 900, display: "flex", flexDirection: "column", paddingTop: 110 }}>
            {/* Sidebar header */}
            <div style={{ padding: "0 16px 12px", borderBottom: "1px solid #1a1a28" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#2dd4bf", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Incident List</p>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6b7280", pointerEvents: "none" }} />
                <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Filter list…"
                  style={{ width: "100%", padding: "9px 10px 9px 30px", background: "#0f0f16", border: "1px solid #2a2a35", borderRadius: 8, color: "#f9fafb", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <p style={{ fontSize: 12, color: "#4b5563", fontWeight: 700, marginTop: 8 }}>
                <span style={{ color: "#2dd4bf" }}>{sidebarList.length}</span> incidents
              </p>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
              {sidebarList.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#4b5563", fontSize: 13, fontWeight: 700 }}>
                  No incidents match filters
                </div>
              ) : (
                sidebarList.map((inc, i) => {
                  const col     = SEV_COLOR[inc.severity] || "#999";
                  const isSelec = selectedId === inc.id;
                  return (
                    <div key={inc.id} className="gm-sidebar-item"
                      onClick={() => setSelectedId(isSelec ? null : inc.id)}
                      style={{ padding: "11px 12px", borderRadius: 10, border: `1px solid ${isSelec ? col + "60" : "#1a1a28"}`, background: isSelec ? `${col}12` : "#0e0e17", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", animationDelay: `${i * 0.03}s` }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0, boxShadow: `0 0 6px ${col}88` }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="gm-si-title" style={{ fontSize: 13, fontWeight: 700, color: isSelec ? col : "#f9fafb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>{inc.title}</p>
                        <p style={{ fontSize: 11, color: "#4b5563", fontWeight: 500, marginTop: 2 }}>{SEV_LABEL[inc.severity]} · {inc.latitude?.toFixed(3)}, {inc.longitude?.toFixed(3)}</p>
                      </div>
                      <Link to={`/app/incidents/${inc.id}`} onClick={e => e.stopPropagation()}
                        style={{ flexShrink: 0, color: "#6b7280", padding: 4, borderRadius: 6, transition: "color 0.15s", textDecoration: "none" }}>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SEVERITY COUNTS BADGE (bottom-left)
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: "absolute", bottom: 52, left: showSidebar ? 332 : 12, zIndex: 1000, display: "flex", gap: 6, transition: "left 0.3s" }}>
          {SEV_LEVELS.slice().reverse().map((lvl) => (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#18181f", border: `1px solid ${SEV_COLOR[lvl]}40`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: SEV_COLOR[lvl] }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: SEV_COLOR[lvl] }}/>
              {sevCounts[lvl]}
            </div>
          ))}
        </div>

        {/* Legend toggle */}
        <button onClick={() => setShowLegend(v => !v)}
          style={{ position: "absolute", bottom: 12, left: showSidebar ? 332 : 12, zIndex: 1000, padding: "7px 14px", background: "#18181f", border: "1px solid #2a2a35", borderRadius: 8, color: "#9ca3af", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "left 0.3s" }}>
          <SlidersHorizontal size={12} style={{ display: "inline", marginRight: 5 }} />
          {showLegend ? "Hide Legend" : "Show Legend"}
        </button>

        {/* Severity legend */}
        {showLegend && (
          <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 1000, background: "#18181f", border: "1px solid #1a1a28", borderRadius: 12, padding: "14px 16px", minWidth: 210 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2dd4bf", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Severity Legend</p>
            {[...SEV_LEVELS].reverse().map((lvl) => (
              <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEV_COLOR[lvl], boxShadow: `0 0 6px ${SEV_COLOR[lvl]}88`, flexShrink: 0 }}/>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{SEV_LABEL[lvl]}</span>
                <span style={{ fontSize: 11, color: SEV_COLOR[lvl], fontWeight: 700, marginLeft: "auto" }}>{sevCounts[lvl]}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MAP
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: "absolute", top: 0, left: showSidebar ? 320 : 0, right: 0, bottom: 0, transition: "left 0.3s" }}>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer attribution={tile.attribution} url={tile.url} />

            <MapEventsHandler onMove={fetchBBoxData} />

            <LocateButton userPos={userPos} onLocate={setUserPos} />

           
            {userPos && (
              <Marker
                position={[userPos.lat, userPos.lng]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2dd4bf;border:3px solid #fff;box-shadow:0 0 12px #2dd4bf88;"></div>`,
                  iconSize: [18, 18], iconAnchor: [9, 9],
                })}
              >
                <Popup><strong>📍 Your Location</strong></Popup>
              </Marker>
            )}

           
            {showHeatmap && <HeatmapLayer incidents={filtered} />}

            
            <MarkerClusterGroup
              iconCreateFunction={(cluster) => {
                const children = cluster.getAllChildMarkers();
                const highestSev = children.reduce((max, m) => {
                  const s = m.options.incidentSeverity || "low";
                  return SEV_PRIORITY[s] > SEV_PRIORITY[max] ? s : max;
                }, "low");
                return L.divIcon({
                  html: `<div style="background:${SEV_COLOR[highestSev]};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px;border:3px solid #fff;box-shadow:0 2px 10px #0006;">${cluster.getChildCount()}</div>`,
                  className: "",
                  iconSize: [40, 40], iconAnchor: [20, 20],
                });
              }}
            >
              {filtered.map((inc) => (
                <Marker
                  key={inc.id}
                  position={[inc.latitude, inc.longitude]}
                  icon={createIcon(inc.severity, selectedId === inc.id)}
                  incidentSeverity={inc.severity}
                  eventHandlers={{ click: () => setSelectedId(inc.id) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEV_COLOR[inc.severity], flexShrink: 0 }}/>
                        <strong style={{ fontSize: 13 }}>{inc.title}</strong>
                      </div>
                      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                        Severity: <span style={{ color: SEV_COLOR[inc.severity], fontWeight: 700 }}>{SEV_LABEL[inc.severity]}</span>
                      </p>
                      {inc.status && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Status: {inc.status}</p>}
                      <Link to={`/app/incidents/${inc.id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, padding: "5px 12px", background: "#14b8a6", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                        onClick={e => e.stopPropagation()}>
                        View Details <ChevronRight size={12} />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

      </div>
    </>
  );
}