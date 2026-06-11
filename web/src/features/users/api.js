import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/services/api.js";
import { useListQuery, useApiMutation } from "../../shared/hooks/query.js";

export const useUsers = (params) => useListQuery("users", api.getUsers, params);
export const useInviteUser = () => useApiMutation("users", api.inviteUser);
export const useUpdateUser = () => useApiMutation("users", ({ id, ...body }) => api.updateUser(id, body));
export const useDeleteUser = () => useApiMutation("users", (id) => api.deleteUser(id));
export const useCreateRole = () => useApiMutation("roles", api.createRole);
export const useUpdateRole = () => useApiMutation("roles", ({ id, ...body }) => api.updateRole(id, body));
export const useDeleteRole = () => useApiMutation("roles", (id) => api.deleteRole(id));
export function useRoles() {
  const q = useQuery({ queryKey: ["roles"], queryFn: () => api.getRoles() });
  return {
    roles: q.data?.roles || [], perms: q.data?.perms || [], matrix: q.data?.matrix || {},
    status: q.isLoading ? "loading" : q.isError ? "error" : "idle",
  };
}
