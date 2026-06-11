import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/services/api.js";
import { useApiMutation } from "../../shared/hooks/query.js";

export function useNotifications() {
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => api.getNotifications() });
  return {
    notifications: q.data?.notifications || [],
    status: q.isLoading ? "loading" : q.isError ? "error" : "idle",
    refetch: q.refetch,
  };
}
export const useMarkAllRead = () => useApiMutation("notifications", () => api.markAllNotificationsRead());
export const useMarkRead = () => useApiMutation("notifications", (id) => api.markNotificationRead(id));
