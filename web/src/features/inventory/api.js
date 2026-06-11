import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useInventory = (params) => useListQuery("inventory", api.getInventory, params);
export const useCreateInventory = () => useApiMutation("inventory", api.createInventory);
export const useUpdateInventory = () => useApiMutation("inventory", ({ id, ...body }) => api.updateInventory(id, body));
export const useDeleteInventory = () => useApiMutation("inventory", (id) => api.deleteInventory(id));
