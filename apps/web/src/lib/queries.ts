/** TanStack Query hooks — the only place components touch the API. */

import { useQuery } from "@tanstack/react-query";

import { apiGet, type CapabilitiesResponse, type HealthResponse } from "./api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthResponse>("/health"),
    refetchInterval: 15_000,
  });
}

export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: () => apiGet<CapabilitiesResponse>("/capabilities"),
  });
}
