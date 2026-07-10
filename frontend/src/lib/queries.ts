/** TanStack Query hooks - the only place components touch the API. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiGet,
  apiPost,
  type ApplicantSummary,
  type CapabilitiesResponse,
  type ComplianceSummary,
  type ConfidenceReport,
  type Consent,
  type Decision,
  type GraphResponse,
  type HealthResponse,
  type LearningState,
  type ModelCard,
  type ModelCard2,
  type Offer,
  type Pattern,
  type PatternMatch,
  type TimelineResponse,
  type ValidationReport,
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

export function useOffer(customerId: string | null) {
  return useQuery({
    queryKey: ["offer", customerId],
    queryFn: () => apiGet<Offer>(`/applicants/${customerId}/offer`),
    enabled: !!customerId,
  });
}

export function useConsent(customerId: string | null) {
  return useQuery({
    queryKey: ["consent", customerId],
    queryFn: () => apiGet<Consent>(`/applicants/${customerId}/consent`),
    enabled: !!customerId,
  });
}

export function useModelCard2() {
  return useQuery({
    queryKey: ["model-card-full"],
    queryFn: () => apiGet<ModelCard2>("/compliance/model-card"),
  });
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: ["compliance-summary"],
    queryFn: () => apiGet<ComplianceSummary>("/compliance/summary"),
  });
}

export function useValidation() {
  return useQuery({
    queryKey: ["validation"],
    queryFn: () => apiGet<ValidationReport>("/validation/report"),
  });
}

export function useLearningState() {
  return useQuery({
    queryKey: ["learning"],
    queryFn: () => apiGet<LearningState>("/learning/state"),
  });
}

export function useLearningMutations() {
  const qc = useQueryClient();
  const retrain = useMutation({
    mutationFn: () => apiPost<LearningState>("/learning/retrain"),
    onSuccess: (data) => qc.setQueryData(["learning"], data),
  });
  const reset = useMutation({
    mutationFn: () => apiPost<LearningState>("/learning/reset"),
    onSuccess: (data) => qc.setQueryData(["learning"], data),
  });
  return { retrain, reset };
}
