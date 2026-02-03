// src/modules/incidents/api/incidentApi.js
import apiClient from "../../../lib/apiClient";

// Create incident
export async function createIncident({
  title,
  description,
  severity,
  address,
  latitude,
  longitude,
  media_urls,
}) {
  const { data } = await apiClient.post("/incidents", {
    title,
    description,
    severity, // "low" | "medium" | "high" | "critical"
    address: address ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    media_urls: media_urls ?? null, // array or null
  });
  // data: IncidentRead
  return data;
}

// List incidents (operational)
export async function listIncidents({ limit = 50, offset = 0, status } = {}) {
  const params = { limit, offset };
  if (status) {
    params.status = status; // "new" | "verified" | "in_progress" | "resolved" | "closed"
  }

  const { data } = await apiClient.get("/incidents", { params });
  // data: IncidentRead[]
  return data;
}

// Get single incident
export async function getIncident(incidentId) {
  const { data } = await apiClient.get(`/incidents/${incidentId}`);
  // data: IncidentRead
  return data;
}

// Update incident (partial)
export async function updateIncident(incidentId, partial) {
  const { data } = await apiClient.patch(`/incidents/${incidentId}`, partial);
  // data: IncidentRead
  return data;
}

// List nearby incidents
export async function listNearbyIncidents({
  latitude,
  longitude,
  radius_meters = 5000,
  limit = 50,
  offset = 0,
}) {
  const params = {
    latitude,
    longitude,
    radius_meters,
    limit,
    offset,
  };

  const { data } = await apiClient.get("/incidents/nearby", { params });
  // data: IncidentRead[]
  return data;
}
