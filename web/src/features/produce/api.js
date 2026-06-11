import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useProduce = (params) => useListQuery("produce", api.getProduce, params);
export const useCreateProduce = () => useApiMutation("produce", api.createProduce);
export const useUpdateProduce = () => useApiMutation("produce", ({ id, ...body }) => api.updateProduce(id, body));
export const useDeleteProduce = () => useApiMutation("produce", (id) => api.deleteProduce(id));
