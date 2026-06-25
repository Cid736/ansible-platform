import api from "./client";

export const getInventories = () => api.get("/api/inventories/").then((r) => r.data);
export const getInventory = (id) => api.get(`/api/inventories/${id}`).then((r) => r.data);
export const createInventory = (data) => api.post("/api/inventories/", data).then((r) => r.data);
export const updateInventory = (id, data) => api.put(`/api/inventories/${id}`, data).then((r) => r.data);
export const deleteInventory = (id) => api.delete(`/api/inventories/${id}`);

export const getHosts = (invId) => api.get(`/api/inventories/${invId}/hosts/`).then((r) => r.data);
export const createHost = (invId, data) => api.post(`/api/inventories/${invId}/hosts/`, data).then((r) => r.data);
export const updateHost = (invId, hostId, data) => api.put(`/api/inventories/${invId}/hosts/${hostId}`, data).then((r) => r.data);
export const deleteHost = (invId, hostId) => api.delete(`/api/inventories/${invId}/hosts/${hostId}`);
