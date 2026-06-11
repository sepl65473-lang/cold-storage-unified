import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useAlertRules = () => useListQuery("alertRules", api.getAlertRules);
export const useCreateAlertRule = () => useApiMutation("alertRules", api.createAlertRule);
export const useUpdateAlertRule = () => useApiMutation("alertRules", ({ id, ...body }) => api.updateAlertRule(id, body));
export const useDeleteAlertRule = () => useApiMutation("alertRules", (id) => api.deleteAlertRule(id));
