import api from "./client";

export const getJobs = (params) => api.get("/api/jobs/", { params }).then((r) => r.data);
export const getJob = (id) => api.get(`/api/jobs/${id}`).then((r) => r.data);
export const launchJob = (data) => api.post("/api/jobs/", data).then((r) => r.data);
export const cancelJob = (id) => api.post(`/api/jobs/${id}/cancel`).then((r) => r.data);
export const deleteJob = (id) => api.delete(`/api/jobs/${id}`);
export const getDashboard = () => api.get("/api/dashboard/stats").then((r) => r.data);
