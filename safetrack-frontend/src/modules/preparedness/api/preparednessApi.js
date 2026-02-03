import apiClient from "../../../lib/apiClient";

// Enums should match backend: "before" | "during" | "after", etc.
export async function listGuidelines({ phase, hazardType, languageCode, limit = 50, offset = 0 } = {}) {
  const params = {};
  if (phase) params.phase = phase;            // e.g. "before"
  if (hazardType) params.hazard_type = hazardType; // e.g. "flood"
  if (languageCode) params.language_code = languageCode;
  params.limit = limit;
  params.offset = offset;

  const { data } = await apiClient.get("/preparedness/guidelines", { params });
  return data;
}

export async function getGuideline(id) {
  const { data } = await apiClient.get(`/preparedness/guidelines/${id}`);
  return data;
}

export async function getPersonalizedGuidelines(payload) {
  const { data } = await apiClient.post("/preparedness/personalized", payload);
  return data;
}
export async function createGuideline(payload) {
  const { data } = await apiClient.post("/preparedness/guidelines", payload);
  return data;
}