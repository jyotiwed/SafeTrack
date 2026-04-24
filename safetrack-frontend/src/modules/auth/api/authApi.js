import apiClient from "../../../lib/apiClient";

export async function loginRequest({ email, password }) {
  const form = new URLSearchParams();
  form.append("username", email);         
  form.append("password", password);

  const { data } = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data;
}

export async function registerRequest({ email, full_name, role, password }) {
  const { data } = await apiClient.post("/auth/register", {
    email,
    full_name,
    role,       
    password,
  });

  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get("/auth/me");

  return data;
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}
