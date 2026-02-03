// src/modules/geospatial/pages/IncidentsMapPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { listIncidentPoints } from "../api/geospatialApi";

// Fix default marker (if using default icons elsewhere)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
});

// Custom cluster icon factory
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  const severityOrder = ["critical", "high", "medium", "low"];
  let maxSeverity = "low";

  cluster.getAllChildMarkers().forEach((marker) => {
    const severity = marker.options.severity?.toLowerCase();
    if (severityOrder.indexOf(severity) < severityOrder.indexOf(maxSeverity)) {
      maxSeverity = severity;
    }
  });

  const color = severityColor(maxSeverity);
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;

  return L.divIcon({
    html: `<div class="cluster-icon" style="background-color:${color}80; border:2px solid ${color}; width:${size}px; height:${size}px; line-height:${size}px;">
             ${count}
           </div>`,
    className: "custom-cluster",
    iconSize: [size, size],
  });
};

function severityColor(severity) {
  const s = (severity || "").toLowerCase();
  if (s === "critical") return "#ef4444";
  if (s === "high") return "#f97316";
  if (s === "medium") return "#eab308";
  if (s === "low") return "#22c55e";
  return "#38bdf8";
}

const DEFAULT_CENTER = [18.5308, 73.8475]; // Pune
const DEFAULT_ZOOM = 10; // closer zoom for city-level

function FitBounds({ incidents }) {
  const map = useMap();
  const boundsRef = useRef(null);

  useEffect(() => {
    if (incidents.length === 0) return;

    const coords = incidents
      .filter((i) => i.latitude != null && i.longitude != null)
      .map((i) => [i.latitude, i.longitude]);

    if (coords.length < 1) return;

    const newBounds = L.latLngBounds(coords);

    if (!boundsRef.current || !boundsRef.current.equals(newBounds)) {
      map.fitBounds(newBounds, { padding: [60, 60], maxZoom: 15 });
      boundsRef.current = newBounds;
    }
  }, [incidents, map]);

  return null;
}

export default function IncidentsMapPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listIncidentPoints();
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setIncidents(items);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load incidents", err);
      setError("Failed to load incident data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 60_000); // every 1 min
    return () => clearInterval(interval);
  }, []);

  const heatmapPoints = useMemo(
    () =>
      incidents
        .filter((i) => i.latitude != null && i.longitude != null)
        .map((i) => ({
          lat: i.latitude,
          lng: i.longitude,
          intensity: typeof i.risk_probability === "number" ? i.risk_probability : 0.6,
        })),
    [incidents]
  );

  const handleSelectIncident = (incident) => {
    navigate(`/app/incidents/${incident.id}`);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6 bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Incident Map</h1>
          <p className="text-sm text-slate-400">
            Real-time view of reported incidents in the region
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {lastUpdated && (
            <span className="text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="rounded-lg bg-slate-700 px-4 py-1.5 text-white hover:bg-slate-600 disabled:opacity-50 transition"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* Error / Empty / Loading */}
      {error && (
        <div className="rounded-xl border border-red-600/50 bg-red-900/30 p-4 text-red-200">
          {error}
        </div>
      )}

      {loading && incidents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          No active incidents at the moment.
        </div>
      ) : (
        /* Map */
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            zoomControl={true}
          >
            <FitBounds incidents={incidents} />

            <LayersControl position="topright">
              {/* Base layers */}
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
              </LayersControl.BaseLayer>

              {/* Overlays */}
              <LayersControl.Overlay checked name="Incidents (clustered)">
                <MarkerClusterGroup
                  iconCreateFunction={createClusterCustomIcon}
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  chunkedLoading
                >
                  {incidents.map((i) => {
                    if (i.latitude == null || i.longitude == null) return null;

                    const color = severityColor(i.severity);

                    return (
                      <CircleMarker
                        key={i.id}
                        center={[i.latitude, i.longitude]}
                        radius={10}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.75,
                          weight: 3,
                        }}
                        severity={i.severity} // for cluster coloring
                        eventHandlers={{
                          click: () => handleSelectIncident(i),
                        }}
                      >
                        <Popup className="custom-popup" minWidth={280}>
                          <div className="text-sm space-y-2">
                            <h3 className="font-bold text-base">
                              {i.title || "Untitled Incident"}
                            </h3>

                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              ></span>
                              <span className="font-medium">Severity:</span> {i.severity || "Unknown"}
                            </div>

                            {i.status && (
                              <p><span className="font-medium">Status:</span> {i.status}</p>
                            )}

                            {i.address && (
                              <p><span className="font-medium">Near:</span> {i.address}</p>
                            )}

                            <p className="text-xs text-slate-400">
                              {i.latitude.toFixed(5)}, {i.longitude.toFixed(5)}
                            </p>

                            {i.created_at && (
                              <p className="text-xs text-slate-400">
                                Reported: {new Date(i.created_at).toLocaleString("en-IN")}
                              </p>
                            )}

                            {i.description && (
                              <p className="text-slate-200 border-t border-slate-700 pt-2 mt-2">
                                {i.description}
                              </p>
                            )}

                            <button
                              onClick={() => handleSelectIncident(i)}
                              className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-500 transition"
                            >
                              View Full Details →
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MarkerClusterGroup>
              </LayersControl.Overlay>

              <LayersControl.Overlay name="Density Heatmap">
                <LayerGroup>
                  <HeatmapLayer
                    points={heatmapPoints}
                    longitudeExtractor={(m) => m.lng}
                    latitudeExtractor={(m) => m.lat}
                    intensityExtractor={(m) => m.intensity}
                    radius={35}
                    blur={25}
                    maxZoom={17}
                    gradient={{
                      0.2: "blue",
                      0.4: "#00ff00",
                      0.6: "yellow",
                      0.8: "orange",
                      1.0: "red",
                    }}
                  />
                </LayerGroup>
              </LayersControl.Overlay>
            </LayersControl>

            {/* Simple legend (bottom left) */}
            <div className="leaflet-bottom leaflet-left mb-4 ml-4">
              <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs text-slate-200 shadow-lg">
                <div className="font-medium mb-1.5">Severity Legend</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div> Critical
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div> High
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div> Medium
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div> Low
                  </div>
                </div>
              </div>
            </div>
          </MapContainer>
        </div>
      )}
    </div>
  );
}