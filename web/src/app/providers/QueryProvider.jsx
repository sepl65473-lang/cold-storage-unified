import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failCount, error) => {
        // Don't retry on 401 (session) or 404 (missing route)
        if (error?.message === "not_found") return false;
        if (error?.message?.includes("Session expired")) return false;
        return failCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function QueryProvider({ children }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
