import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1/resource-predictions";

export const getResourceDemand = async (payload) => {
  const response = await axios.post(`${API_BASE}/demand`, payload);
  return response.data;
};
