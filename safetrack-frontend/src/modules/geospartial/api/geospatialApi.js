import apiClient from "../../../lib/apiClient";

/* ---------------------------------------------
   Utility: Remove null/undefined params
--------------------------------------------- */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    )
  );
}

/* ---------------------------------------------
   Get incidents in bounding box
--------------------------------------------- */
export async function getIncidentsInBBox({
  north,
  south,
  east,
  west,
  hazardType,
  severity,
  startDate,
  endDate,
  limit = 1000,
  signal, // support abort controller
} = {}) {
  const params = cleanParams({
    north,
    south,
    east,
    west,
    limit,
    hazardType,
    severity,
    startDate,
    endDate,
  });

  const { data } = await apiClient.get("/geospatial/bbox", {
    params,
    signal,
  });

  return data;
}

/* ---------------------------------------------
   Get incidents within radius
--------------------------------------------- */
export async function getIncidentsWithinRadius({
  latitude,
  longitude,
  radiusKm = 5,
  hazardType,
  severity,
  signal,
} = {}) {
  const params = cleanParams({
    latitude,
    longitude,
    radius_km: radiusKm,
    hazardType,
    severity,
  });

  const { data } = await apiClient.get("/geospatial/radius", {
    params,
    signal,
  });

  return data;
}

/* ---------------------------------------------
   List incident points
--------------------------------------------- */
export async function listIncidentPoints({
  limit = 1000,
  bbox, // format: "west,south,east,north"
  hazardType,
  severity,
  startDate,
  endDate,
  signal,
} = {}) {
  const params = cleanParams({
    limit,
    bbox,
    hazardType,
    severity,
    startDate,
    endDate,
  });

  const { data } = await apiClient.get(
    "/geospatial/incidents/points",
    {
      params,
      signal,
    }
  );

  return data;
}

/* ---------------------------------------------
   List incident clusters
--------------------------------------------- */
export async function listIncidentClusters({
  zoom = 10,
  limit = 2000,
  bbox,
  hazardType,
  severity,
  signal,
} = {}) {
  const params = cleanParams({
    zoom,
    limit,
    bbox,
    hazardType,
    severity,
  });

  const { data } = await apiClient.get(
    "/geospatial/incidents/clusters",
    {
      params,
      signal,
    }
  );

  return data;
}

/* ---------------------------------------------
   Get heatmap data
--------------------------------------------- */
export async function getIncidentHeatmap({
  zoom = 10,
  bbox,
  hazardType,
  severity,
  intensity = "medium",
  signal,
} = {}) {
  const params = cleanParams({
    zoom,
    bbox,
    hazardType,
    severity,
    intensity,
  });

  const { data } = await apiClient.get(
    "/geospatial/incidents/heatmap",
    {
      params,
      signal,
    }
  );

  return data;
}
export async function getIncidentById(id) {
  const { data } = await apiClient.get(`/incidents/${id}`);
  return data;
}

