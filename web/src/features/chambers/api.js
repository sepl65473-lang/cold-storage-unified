import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useChambers = (params) => useListQuery("chambers", api.getChambers, params);
export const useCreateChamber = () => useApiMutation("chambers", api.createChamber);
export const useUpdateChamber = () => useApiMutation("chambers", ({ id, ...body }) => api.updateChamber(id, body));
export const useDeleteChamber = () => useApiMutation("chambers", (id) => api.deleteChamber(id));
