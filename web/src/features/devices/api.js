import { api } from "../../shared/services/api.js";
import { useListQuery, usePagedQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useDevices      = (params) => useListQuery("devices",      api.getDevices, params);
export const usePagedDevices = (pageSize) => usePagedQuery("devices-paged", api.getDevices, pageSize);
export const useCreateDevice = () => useApiMutation("devices", api.createDevice);
export const useUpdateDevice = () => useApiMutation("devices", ({ id, ...body }) => api.updateDevice(id, body));
export const useDeleteDevice = () => useApiMutation("devices", (id) => api.deleteDevice(id));
