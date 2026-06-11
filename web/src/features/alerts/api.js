import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useAlerts = (params) => useListQuery("alerts", api.getAlerts, params);
export const useAckAlert = () => useApiMutation("alerts", (id) => api.ackAlert(id));
export const useResolveAlert = () => useApiMutation("alerts", (id) => api.resolveAlert(id));
