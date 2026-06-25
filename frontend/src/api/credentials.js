import api from "./client";

export const getCredentials = () => api.get("/api/credentials/").then((r) => r.data);
export const getCredential = (id) => api.get(`/api/credentials/${id}`).then((r) => r.data);
export const createCredential = (data) => api.post("/api/credentials/", data).then((r) => r.data);
export const updateCredential = (id, data) => api.put(`/api/credentials/${id}`, data).then((r) => r.data);
export const deleteCredential = (id) => api.delete(`/api/credentials/${id}`);
