// src/modules/analytics/api/analyticsApi.js
import apiClient from "../../../lib/apiClient";

export async function fetchIncidentStats() {
  const { data } = await apiClient.get("/analytics/incidents");
  return data;
}

export async function fetchTaskStats() {
  const { data } = await apiClient.get("/analytics/tasks");
  return data;
}

export async function fetchIncidentTimeline(days = 30) {
  const { data } = await apiClient.get("/analytics/incidents/timeline", {
    params: { days },
  });
  return data;
}
