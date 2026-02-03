import apiClient from "../../../lib/apiClient";

export async function createIncidentPrediction(payload) {
  const { data } = await apiClient.post(
    "/incident-predictions/",
    payload
  );
  return data;
}

export async function getIncidentPrediction(id) {
  const { data } = await apiClient.get(
    `/incident-predictions/${id}`
  );
  return data;
}

export async function updateIncidentPrediction(id, payload) {
  const { data } = await apiClient.put(
    `/incident-predictions/${id}`,
    payload
  );
  return data;
}

export async function deleteIncidentPrediction(id) {
  await apiClient.delete(`/incident-predictions/${id}`);
}

export async function listPredictionsByIncident(incidentId, params = {}) {
  const { data } = await apiClient.get(
    `/incident-predictions/by-incident/${incidentId}`,
    { params }
  );
  return data;
}

export async function listPredictionsBySeverity(severity, params = {}) {
  const { data } = await apiClient.get(
    `/incident-predictions/by-severity/${severity}`,
    { params }
  );
  return data;
}

export async function listPredictionsByDateRange(params) {
  const { data } = await apiClient.get(
    "/incident-predictions/by-date-range",
    { params }
  );
  return data;
}

export async function listHighRiskPredictions(params = {}) {
  const { data } = await apiClient.get(
    "/incident-predictions/high-risk",
    { params }
  );
  return data;
}

export async function getResourceForecastSummary(incidentId) {
  const { data } = await apiClient.get(
    `/incident-predictions/forecast/summary/${incidentId}`
  );
  return data;
}