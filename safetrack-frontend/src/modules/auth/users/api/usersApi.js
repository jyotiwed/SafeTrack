import apiClient from "../../lib/apiClient";

export async function fetchUsers({ role, limit = 50, offset = 0 } = {}) {
  const params = {};
  if (role) params.role = role;
  params.limit = limit;
  params.offset = offset;

  const { data } = await apiClient.get("/users", { params });
  // [{ id, full_name, role }]
  return data;
}

export async function fetchUserById(userId) {
  const { data } = await apiClient.get(`/users/${userId}`);
  // { id, full_name, role }
  return data;
}

export async function adminUpdateUser(userId, payload) {
  // payload: { full_name?, role?, is_active? }
  const { data } = await apiClient.patch(`/users/${userId}`, payload);
  // { email, full_name, role, id, is_active }
  return data;
}
