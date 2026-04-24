// src/api/emailApi.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function sendRegistrationEmail(emailData) {
  const response = await axios.post(`${API_BASE}/api/email/send-registration`, emailData);
  return response.data;
}

export async function sendWelcomeEmail(emailData) {
  const response = await axios.post(`${API_BASE}/api/email/send-welcome`, emailData);
  return response.data;
}