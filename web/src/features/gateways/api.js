import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useGateways = (params) => useListQuery("gateways", api.getGateways, params);
export const useCreateGateway = () => useApiMutation("gateways", api.createGateway);
export const useUpdateGateway = () => useApiMutation("gateways", ({ id, ...body }) => api.updateGateway(id, body));
export const useDeleteGateway = () => useApiMutation("gateways", (id) => api.deleteGateway(id));
