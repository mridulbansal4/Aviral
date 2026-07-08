/** TanStack Query hooks — the only place components touch the API. */

import { useQuery } from "@tanstack/react-query";

import {
  apiGet,
  type ApplicantSummary,
  type CapabilitiesResponse,
  type ConfidenceReport,
  type Decision,
  type GraphResponse,
  type HealthResponse,
  type ModelCard,
  type Pattern,
  type PatternMatch,
  type TimelineResponse,
} from "./api";

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

export function useApplicants() {
  return useQuery({
    queryKey: ["applicants"],
    queryFn: () => apiGet<ApplicantSummary[]>("/applicants"),
  });
}

export function useDecision(customerId: string | null) {
  return useQuery({
    queryKey: ["decision", customerId],
    queryFn: () => apiGet<Decision>(`/applicants/${customerId}/decision`),
    enabled: !!customerId,
  });
}

export function useModelCard() {
  return useQuery({
    queryKey: ["model-card"],
    queryFn: () => apiGet<ModelCard>("/model/card"),
  });
}

export function useTimeline(customerId: string | null) {
  return useQuery({
    queryKey: ["timeline", customerId],
    queryFn: () => apiGet<TimelineResponse>(`/applicants/${customerId}/timeline`),
    enabled: !!customerId,
  });
}

export function useGraph(customerId: string | null) {
  return useQuery({
    queryKey: ["graph", customerId],
    queryFn: () => apiGet<GraphResponse>(`/applicants/${customerId}/graph`),
    enabled: !!customerId,
  });
}

export function useConfidence(customerId: string | null) {
  return useQuery({
    queryKey: ["confidence", customerId],
    queryFn: () => apiGet<ConfidenceReport>(`/applicants/${customerId}/confidence`),
    enabled: !!customerId,
  });
}

export function usePatterns() {
  return useQuery({
    queryKey: ["patterns"],
    queryFn: () => apiGet<Pattern[]>("/patterns"),
  });
}

export function usePatternMatch(customerId: string | null) {
  return useQuery({
    queryKey: ["pattern-match", customerId],
    queryFn: () => apiGet<PatternMatch>(`/applicants/${customerId}/pattern`),
    enabled: !!customerId,
  });
}
