import axios from 'axios';

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildConfig = (params) => {
  const headers = getAuthHeaders();
  const hasHeaders = headers && Object.keys(headers).length > 0;
  const hasParams = params && Object.keys(params).length > 0;
  if (!hasHeaders && !hasParams) return undefined;
  const cfg = {};
  if (hasParams) cfg.params = params;
  if (hasHeaders) cfg.headers = headers;
  return cfg;
};

export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data;
};

export const registerUser = async (payload) => {
  const res = await axios.post(`${API_BASE}/auth/register`, payload);
  return res.data;
};

export const logoutUser = async () => {
  const res = await axios.post(`${API_BASE}/auth/logout`);
  return res.data;
};

export const refreshToken = async (token) => {
  const res = await axios.post(`${API_BASE}/auth/refresh`, { token });
  return res.data;
};

// Incidents
export const getIncidents = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/incidents`, cfg) : await axios.get(`${API_BASE}/incidents`);
  return res.data;
};

export const getIncidentById = async (id) => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/incidents/${id}`, cfg) : await axios.get(`${API_BASE}/incidents/${id}`);
  return res.data;
};

export const createIncident = async (payload) => {
  const res = await axios.post(`${API_BASE}/incidents`, payload);
  return res.data;
};

export const updateIncident = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/incidents/${id}`, payload);
  return res.data;
};

export const deleteIncident = async (id) => {
  const res = await axios.delete(`${API_BASE}/incidents/${id}`);
  return res.data;
};

export const getIncidentsByType = async (type) => {
  const cfg = buildConfig({ type });
  const res = await axios.get(`${API_BASE}/incidents`, cfg);
  return res.data;
};

export const getIncidentsNear = async (latitude, longitude, radius) => {
  const cfg = buildConfig({ latitude, longitude, radius });
  const res = await axios.get(`${API_BASE}/incidents/nearby`, cfg);
  return res.data;
};

// Predictions
export const getPredictions = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/predictions`, cfg) : await axios.get(`${API_BASE}/predictions`);
  return res.data;
};

export const getPredictionsByType = async (type) => {
  const cfg = buildConfig({ type });
  const res = await axios.get(`${API_BASE}/predictions`, cfg);
  return res.data;
};

export const getHighRiskPredictions = async (threshold) => {
  const cfg = buildConfig({ threshold });
  const res = await axios.get(`${API_BASE}/predictions/high-risk`, cfg);
  return res.data;
};

export const createPrediction = async (payload) => {
  const res = await axios.post(`${API_BASE}/predictions`, payload);
  return res.data;
};

// Tasks
export const getUserTasks = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/tasks`, cfg) : await axios.get(`${API_BASE}/tasks`);
  return res.data;
};

export const getTaskById = async (id) => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/tasks/${id}`, cfg) : await axios.get(`${API_BASE}/tasks/${id}`);
  return res.data;
};

export const createTask = async (payload) => {
  const res = await axios.post(`${API_BASE}/tasks`, payload);
  return res.data;
};

export const updateTask = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/tasks/${id}`, payload);
  return res.data;
};

export const deleteTask = async (id) => {
  const res = await axios.delete(`${API_BASE}/tasks/${id}`);
  return res.data;
};

// Alerts
export const getAlerts = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/alerts`, cfg) : await axios.get(`${API_BASE}/alerts`);
  return res.data;
};

export const getActiveAlerts = async () => {
  const cfg = buildConfig({ active: true });
  const res = await axios.get(`${API_BASE}/alerts`, cfg);
  return res.data;
};

export const acknowledgeAlert = async (id) => {
  const res = await axios.post(`${API_BASE}/alerts/${id}/acknowledge`, {});
  return res.data;
};

// Analytics
export const getIncidentStatistics = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/analytics/incidents`, cfg) : await axios.get(`${API_BASE}/analytics/incidents`);
  return res.data;
};

export const getPredictionAccuracy = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/analytics/predictions/accuracy`, cfg) : await axios.get(`${API_BASE}/analytics/predictions/accuracy`);
  return res.data;
};

export const getResponseMetrics = async () => {
  const cfg = buildConfig();
  const res = cfg ? await axios.get(`${API_BASE}/analytics/response-metrics`, cfg) : await axios.get(`${API_BASE}/analytics/response-metrics`);
  return res.data;
};

export default {
  
  loginUser,
  registerUser,
  logoutUser,
  refreshToken,
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentsByType,
  getIncidentsNear,
  getPredictions,
  getPredictionsByType,
  getHighRiskPredictions,
  createPrediction,
  getUserTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAlerts,
  getActiveAlerts,
  acknowledgeAlert,
  getIncidentStatistics,
  getPredictionAccuracy,
  getResponseMetrics
};
