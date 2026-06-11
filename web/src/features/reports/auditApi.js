import { api } from "../../shared/services/api.js";
import { useListQuery } from "../../shared/hooks/query.js";

export const useAudit = (params) => useListQuery("audit", api.getAudit, params);
