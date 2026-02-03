// src/modules/predictions/api/predictionsApi.js
import api from "../../../lib/apiClient"; // adjust path

export async function createPrediction(payload) {
  const { data } = await api.post("/predictions/", payload);
  return data;
}

export async function getPrediction(predictionId) {
  const { data } = await api.get(`/predictions/${predictionId}`);
  return data;
}

export async function getPredictionsByIncident(incidentId, params = {}) {
  const { skip = 0, limit = 10 } = params;
  const { data } = await api.get(`/predictions/incident/${incidentId}`, {
    params: { skip, limit },
  });
  return data;
}

export async function getPredictionsByRiskType(riskType, params = {}) {
  const { skip = 0, limit = 10 } = params;
  const { data } = await api.get(`/predictions/risk-type/${riskType}`, {
    params: { skip, limit },
  });
  return data;
}

export async function getHighConfidencePredictions(params = {}) {
  const { min_confidence = 0.8, skip = 0, limit = 10 } = params;
  const { data } = await api.get("/predictions/confidence/high", {
    params: { min_confidence, skip, limit },
  });
  return data;
}

export async function updatePrediction(predictionId, payload) {
  const { data } = await api.put(`/predictions/${predictionId}`, payload);
  return data;
}

export async function deletePrediction(predictionId) {
  await api.delete(`/predictions/${predictionId}`);
}
