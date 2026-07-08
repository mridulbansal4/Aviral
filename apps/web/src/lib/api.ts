/**
 * Typed API client. A single, thin fetch wrapper — no data-fetching logic
 * lives in components. Base URL is configurable via `VITE_API_BASE_URL`.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/* ---- Response types (kept in sync with the backend DTOs; generated from
   OpenAPI in a later milestone via packages/shared-types). ---- */

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface CapabilitiesResponse {
  version: string;
  flags: Record<string, boolean>;
}

export interface ApplicantSummary {
  customer_id: string;
  name: string;
  age: number;
  employment_type: string;
  city_tier: string;
  verified_monthly_income: number;
  converted: boolean;
  loan_type: string;
}

export interface RuleResult {
  id: string;
  label: string;
  feature: string;
  passed: boolean;
  value: number;
  threshold: number;
  weight: number;
  polarity: "positive" | "negative";
  rationale: string;
}

export interface ShapEvidence {
  feature: string;
  value: number;
  contribution: number;
  direction: "increases" | "decreases";
  provenance: string;
}

export interface Decision {
  customer_id: string;
  name: string;
  verified_monthly_income: number;
  propensity: number;
  band: { label: string; tone: string };
  model_confidence: number;
  recommended_product: string;
  rule_score: number;
  rules: RuleResult[];
  base_value: number;
  evidence: ShapEvidence[];
  model_version: string;
  ground_truth: {
    converted: boolean;
    loan_type: string;
    latent_probability: number;
  };
}

export interface ModelCard {
  version: string;
  metrics: {
    roc_auc: number;
    ks_statistic: number;
    lift_top_decile: number;
    base_rate: number;
    n_samples: number;
  };
  feature_importance: Record<string, number>;
}
