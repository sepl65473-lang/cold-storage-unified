import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useReports = (params) => useListQuery("reports", api.getReports, params);
export const useGenerateReport = () => useApiMutation("reports", (id) => api.generateReport(id));
export const useScheduleReport = () => useApiMutation("reports", api.scheduleReport);
export function useReportMetrics() {
  const q = useQuery({ queryKey: ["report-metrics"], queryFn: () => api.getReportMetrics() });
  return { monthly: q.data?.monthly || [], status: q.isLoading ? "loading" : q.isError ? "error" : "idle" };
}
export function useTelemetryHistory(period) {
  const q = useQuery({ queryKey: ["telemetry-history", period], queryFn: () => api.getTelemetryHistory({ period }) });
  return { temp: q.data?.temp || [], hum: q.data?.hum || [], status: q.isLoading ? "loading" : q.isError ? "error" : "idle" };
}
