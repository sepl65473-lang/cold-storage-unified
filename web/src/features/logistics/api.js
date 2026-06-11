import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useWorkOrders = (params) => useListQuery("work-orders", api.getWorkOrders, params);
export const useCreateWorkOrder = () => useApiMutation("work-orders", api.createWorkOrder);
export const useUpdateWorkOrder = () => useApiMutation("work-orders", ({ id, ...body }) => api.updateWorkOrder(id, body));
export const useDeleteWorkOrder = () => useApiMutation("work-orders", (id) => api.deleteWorkOrder(id));
export const useDispatch = (params) => useListQuery("dispatch", api.getDispatch, params);
export const useCreateDispatch = () => useApiMutation("dispatch", api.createDispatch);
export const useUpdateDispatch = () => useApiMutation("dispatch", ({ id, ...body }) => api.updateDispatch(id, body));
export const useDeleteDispatch = () => useApiMutation("dispatch", (id) => api.deleteDispatch(id));
