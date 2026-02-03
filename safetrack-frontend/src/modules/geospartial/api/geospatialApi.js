import apiClient from "../../../lib/apiClient";

export async function listIncidentPoints({ 
  limit = 1000,
  bbox = null,
  hazardType = null,
  severity = null,
  dateRange = null
} = {}) {
  try {
    const { data } = await apiClient.get("/geospatial/incidents/points", {
      params: { limit, bbox, hazardType, severity, ...(dateRange || {}) },
    });
    return data;
  } catch (error) {
    console.error("Error fetching incident points:", error);
    throw error;
  }
}

export async function listIncidentClusters({ 
  zoom = 10, 
  limit = 2000,
  bbox = null,
  hazardType = null 
} = {}) {
  try {
    const { data } = await apiClient.get("/geospatial/incidents/clusters", {
      params: { zoom, limit, bbox, hazardType },
    });
    return data;
  } catch (error) {
    console.error("Error fetching incident clusters:", error);
    throw error;
  }
}

export async function getIncidentHeatmap({ 
  zoom = 10,
  bbox = null,
  hazardType = null,
  intensity = "medium"
} = {}) {
  try {
    const { data } = await apiClient.get("/geospatial/incidents/heatmap", {
      params: { zoom, bbox, hazardType, intensity },
    });
    return data;
  } catch (error) {
    console.error("Error fetching incident heatmap:", error);
    throw error;
  }
}