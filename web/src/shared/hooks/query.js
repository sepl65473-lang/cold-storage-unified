import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "../../stores/uiStore.js";

// Standardised list hook. Returns a normalised shape so every table page
// consumes data the same way and gets loading/empty/error for free.
// Automatically injects facility_id from the global facility selector.
export function useListQuery(key, fn, params) {
  const facilityId = useUiStore((s) => s.facility?.id);
  const effective = facilityId ? { facility_id: facilityId, ...params } : (params || {});
  const q = useQuery({ queryKey: [key, effective], queryFn: () => fn(effective) });
  // 404 = backend route missing → treat as empty, not an error shown to user
  const is404 = q.error?.message === "not_found";
  const status = q.isLoading ? "loading" : (q.isError && !is404) ? "error" : "idle";
  const res = q.data;
  // rows is ALWAYS an array (even on error / unexpected shape) so .filter/.map
  // on pages can never crash. Accepts either [...] or { data: [...], total }.
  const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  const total = res && typeof res.total === "number" ? res.total : rows.length;
  return {
    rows,
    total,
    status,
    refetch: q.refetch,
    isFetching: q.isFetching,
    error: q.error,
  };
}

export function useObjectQuery(key, fn, params) {
  const q = useQuery({ queryKey: [key, params || {}], queryFn: () => fn(params) });
  return { data: q.data, status: q.isLoading ? "loading" : q.isError ? "error" : "idle", refetch: q.refetch };
}

// Server-side paginated list hook — manages page + search state, passes them to the API.
// Returns { rows, total, page, setPage, search, setSearch, status, refetch, isFetching }.
export function usePagedQuery(key, fn, pageSize = 8) {
  const facilityId = useUiStore((s) => s.facility?.id);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");

  const onSearch = (val) => { setSearch(val); setPage(1); };
  const params   = { page, pageSize, ...(search ? { search } : {}), ...(facilityId ? { facility_id: facilityId } : {}) };

  const q = useQuery({ queryKey: [key, params], queryFn: () => fn(params), placeholderData: (prev) => prev });
  const res   = q.data;
  const rows  = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  const total = res && typeof res.total === "number" ? res.total : rows.length;

  return { rows, total, page, setPage, search, setSearch: onSearch, status: q.isLoading ? "loading" : q.isError ? "error" : "idle", refetch: q.refetch, isFetching: q.isFetching };
}

// Standardised mutation that invalidates the affected list on success.
export function useApiMutation(invalidateKey, fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      const keys = Array.isArray(invalidateKey) ? invalidateKey : [invalidateKey];
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}
