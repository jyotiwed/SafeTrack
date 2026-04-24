
import apiClient from "../../../lib/apiClient";


export async function createTask({
  title,
  description,
  priority = "medium",
  incident_id,
  assignee_id,
  extra_data,
}) {
  const { data } = await apiClient.post("/tasks", {
    title,
    description: description ?? null,
    priority,
    incident_id,
    assignee_id: assignee_id ?? null,
    extra_data: extra_data ?? null,
  });
  return data; 
}


export async function listTasks({
  limit = 50,
  offset = 0,
  status,
  incident_id,
  assignee_id,
} = {}) {
  const params = { limit, offset };
  if (status) params.status = status;
  if (incident_id) params.incident_id = incident_id;
  if (assignee_id) params.assignee_id = assignee_id;

  const { data } = await apiClient.get("/tasks", { params });
  return data;
}


export async function getTask(taskId) {
  const { data } = await apiClient.get(`/tasks/${taskId}`);
  return data; 
}


export async function updateTask(taskId, partial) {
  const { data } = await apiClient.patch(`/tasks/${taskId}`, partial);
  return data; 
}
