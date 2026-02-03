import apiClient from "../../../lib/apiClient";

export async function loginRequest({ email, password }) {
  const form = new URLSearchParams();
  form.append("username", email);          // matches OAuth2 password flow
  form.append("password", password);

  const { data } = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  // data: { access_token, token_type }
  return data;
}

export async function registerRequest({ email, full_name, role, password }) {
  const { data } = await apiClient.post("/auth/register", {
    email,
    full_name,
    role,       // "citizen" | "volunteer" | "ngo" | "admin" | "official"
    password,
  });
  // data: { email, full_name, role, id, is_active }
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get("/auth/me");
  // data: { email, full_name, role, id, is_active }
  return data;
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}
