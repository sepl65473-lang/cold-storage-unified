import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api.js";

export function useFacilities() {
  const q = useQuery({ queryKey: ["facilities"], queryFn: () => api.getFacilities() });
  return { facilities: q.data || [], status: q.isLoading ? "loading" : q.isError ? "error" : "idle" };
}
