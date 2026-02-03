// src/modules/incidents/components/IncidentMapWithFeatures.jsx
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  LayerGroup,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// severity colors
const severityColors = {
  critical: "#f97373",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
};

// category/type labels (adjust to your schema)
const TYPE_LABELS = {
  flood: "Flood",
  cyclone: "Cyclone",
  earthquake: "Earthquake",
  fire: "Fire",
};

const DEFAULT_CENTER = [18.5204, 73.8567];

function severityIcon(severity) {
  const color = severityColors[severity] || "#38bdf8";
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
       <circle cx="14" cy="14" r="10" fill="${color}" stroke="white" stroke-width="2" />
     </svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  });
}

/* ---------- Heatmap layer ---------- */

function IncidentHeatmapLayer({ incidents }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const points = incidents
      .filter((i) => i.latitude != null && i.longitude != null)
      .map((i) => [
        i.latitude,
        i.longitude,
        // intensity: use probability/confidence if you have it; default 0.6
        i.latest_prediction?.probability ?? 0.6,
      ]);

    if (!points.length) return;

    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, incidents]);

  return null;
}

/* ---------- WebSocket hook for live incidents ---------- */

function useIncidentsRealtime(initialIncidents) {
  const [incidents, setIncidents] = useState(initialIncidents || []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost =
      import.meta.env.VITE_API_HOST || "localhost:8000";

    const url = `${protocol}://${backendHost}/api/v1/realtime/incidents`;
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // expect something like {id, title, latitude, longitude, severity, status, type}
        if (!data.id) return;
        setIncidents((prev) => {
          const exists = prev.find((p) => p.id === data.id);
          if (exists) {
            return prev.map((p) => (p.id === data.id ? { ...p, ...data } : p));
          }
          return [...prev, data];
        });
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return incidents;
}

/* ---------- Main map component ---------- */

export function IncidentMapWithFeatures({
  initialIncidents,
  onSelectIncident,
}) {
  // live list merged with WebSocket updates
  const incidents = useIncidentsRealtime(initialIncidents || []);

  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(
    () =>
      incidents.filter((i) =>
        typeFilter === "all" ? true : i.type === typeFilter
      ),
    [incidents, typeFilter]
  );

  const center =
    filtered.length && filtered[0].latitude != null
      ? [filtered[0].latitude, filtered[0].longitude]
      : DEFAULT_CENTER;

  const typeOptions = ["all", ...Object.keys(TYPE_LABELS)];

  return (
    <div className="space-y-3">
      {/* filters + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400">Type:</span>
          {typeOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-2.5 py-0.5 uppercase tracking-wide ${
                typeFilter === t
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-100"
                  : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-100"
              }`}
            >
              {t === "all" ? "All" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#f97373]" /> Critical
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#fb923c]" /> High
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#facc15]" /> Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#34d399]" /> Low
          </span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={11}
        className="h-[520px] w-full rounded-2xl border border-white/10"
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Streets">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* Markers (clustered) */}
          <LayersControl.Overlay checked name="Incidents (markers)">
            <MarkerClusterGroup chunkedLoading>
              {filtered
                .filter(
                  (i) => i.latitude != null && i.longitude != null
                )
                .map((incident) => (
                  <Marker
                    key={incident.id}
                    position={[incident.latitude, incident.longitude]}
                    icon={severityIcon(incident.severity)}
                    eventHandlers={{
                      click: () => onSelectIncident?.(incident),
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-900">
                          {incident.title}
                        </p>
                        {incident.type && (
                          <p className="text-slate-700">
                            Type:{" "}
                            <strong>
                              {TYPE_LABELS[incident.type] || incident.type}
                            </strong>
                          </p>
                        )}
                        <p className="text-slate-700">
                          Severity: <strong>{incident.severity}</strong>
                        </p>
                        <p className="text-slate-700">
                          Status:{" "}
                          <span>
                            {incident.status?.replace("_", " ")}
                          </span>
                        </p>
                        {incident.latest_prediction && (
                          <p className="text-slate-700">
                            Risk:{" "}
                            {(
                              incident.latest_prediction.probability * 100
                            ).toFixed(1)}
                            %
                          </p>
                        )}
                        <button
                          type="button"
                          className="mt-1 rounded-md bg-sky-600 px-2 py-1 text-[11px] font-medium text-white"
                          onClick={() => onSelectIncident?.(incident)}
                        >
                          View incident
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          </LayersControl.Overlay>

          {/* Heatmap */}
          <LayersControl.Overlay name="Heatmap">
            <LayerGroup>
              <IncidentHeatmapLayer incidents={filtered} />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
