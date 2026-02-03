import apiClient from "../../../lib/apiClient";

export async function listEmergencyContacts() {
  const { data } = await apiClient.get("/emergency/contacts");
  return data;
}

export async function createEmergencyContact(payload) {
  const { data } = await apiClient.post("/emergency/contacts", payload);
  return data;
}

export async function triggerSos(payload) {
  const { data } = await apiClient.post("/emergency/sos", payload);
  return data;
}


export async function updateEmergencyContact(id, payload) {
  const { data } = await apiClient.put(`/emergency/contacts/${id}`, payload);
  return data;
}

export async function deleteEmergencyContact(id) {
  const { data } = await apiClient.delete(`/emergency/contacts/${id}`);
  return data;
}