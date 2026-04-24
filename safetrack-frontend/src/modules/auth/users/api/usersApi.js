import apiClient from "../../lib/apiClient";

export async function fetchUsers({ role, limit = 50, offset = 0 } = {}) {
  const params = {};
  if (role) params.role = role;
  params.limit = limit;
  params.offset = offset;

  const { data } = await apiClient.get("/users", { params });

  return data;
}

export async function fetchUserById(userId) {
  const { data } = await apiClient.get(`/users/${userId}`);

  return data;
}

export async function adminUpdateUser(userId, payload) {

  const { data } = await apiClient.patch(`/users/${userId}`, payload);
  return data;
}
