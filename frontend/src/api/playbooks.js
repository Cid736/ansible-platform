import api from "./client";

export const getPlaybooks = () => api.get("/api/playbooks/").then((r) => r.data);
export const getPlaybook = (id) => api.get(`/api/playbooks/${id}`).then((r) => r.data);
export const createPlaybook = (data) => api.post("/api/playbooks/", data).then((r) => r.data);
export const updatePlaybook = (id, data) => api.put(`/api/playbooks/${id}`, data).then((r) => r.data);
export const deletePlaybook = (id) => api.delete(`/api/playbooks/${id}`);
export const uploadPlaybook = (formData) =>
  api.post("/api/playbooks/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
