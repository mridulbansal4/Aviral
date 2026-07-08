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

export async function apiPost<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed: ${res.status}`);
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

export interface InsightMetric {
  key: string;
  label: string;
  value: number;
  provenance: string;
  tone: "positive" | "warning" | "muted";
}

export interface TimelinePoint {
  month: string;
  income: number;
  total_spend: number;
  net_savings: number;
  categories: Record<string, number>;
}

export interface TimelineResponse {
  customer_id: string;
  points: TimelinePoint[];
  metrics: InsightMetric[];
}

export interface GraphNode {
  id: string;
  label: string;
  kind: string;
  subtype: string;
  is_focus: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  edge_type: string;
  total: number;
  count: number;
}

export interface GraphResponse {
  customer_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  features: InsightMetric[];
}

export interface ConfidenceDimension {
  key: string;
  label: string;
  value: number;
  weight: number;
  rationale: string;
  inputs: Record<string, number>;
}

export interface ConfidenceReport {
  customer_id: string;
  dimensions: ConfidenceDimension[];
  decision_confidence: number;
  band: { label: string; tone: string };
}

export interface DefiningFeature {
  feature: string;
  z: number;
  phrase: string;
}

export interface Pattern {
  id: number;
  label: string;
  support: number;
  precision: number;
  lift: number;
  dominant_loan_type: string;
  significant: boolean;
  defining_features: DefiningFeature[];
  example_customer_ids: string[];
}

export interface PatternMatch {
  pattern_id: number;
  label: string;
  membership: number;
  precision: number;
  lift: number;
}

export interface Consent {
  consent_handle: string;
  customer_id: string;
  purpose: string;
  data_scope: string[];
  fetch_type: string;
  granted_on: string;
  expires_on: string;
  status: "active" | "expired" | "revoked";
}

export interface EligibilityCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface Offer {
  customer_id: string;
  product: string;
  product_label: string;
  status: "approved_in_principle" | "referred" | "declined";
  principal: number;
  tenure_months: number;
  annual_rate: number;
  monthly_emi: number;
  foir_before: number;
  foir_after: number;
  risk_band: string;
  decision_confidence: number;
  max_principal_by_income: number;
  max_principal_by_foir: number;
  consent_status: "active" | "expired" | "revoked";
  pricing: { label: string; value: string }[];
  checks: EligibilityCheck[];
}

export interface ModelCard2 {
  model_version: string;
  purpose: string;
  training_population: number;
  used_features: string[];
  prohibited_features: string[];
  review_required_features: string[];
  metrics: Record<string, number>;
  fairness_statement: string;
  limitations: string[];
}

export interface ComplianceSummary {
  model_version: string;
  total_applicants: number;
  consent_active: number;
  consent_expired: number;
  consent_revoked: number;
  prohibited_feature_count: number;
  used_feature_count: number;
}

export interface RulePrecision {
  id: string;
  label: string;
  polarity: string;
  coverage: number;
  precision: number;
  lift: number;
}

export interface FamilyContribution {
  family: string;
  feature_count: number;
  importance_share: number;
}

export interface DriftFeature {
  feature: string;
  psi: number;
  status: "stable" | "minor" | "material";
}

export interface ValidationReport {
  model_version: string;
  model_metrics: {
    roc_auc: number;
    ks_statistic: number;
    lift_top_decile: number;
    base_rate: number;
    n_samples: number;
  };
  rules: RulePrecision[];
  family_contribution: FamilyContribution[];
  drift: {
    status: string;
    reference_label: string;
    current_label: string;
    features: DriftFeature[];
  };
}

export interface LearningStep {
  step: number;
  label: string;
  train_size: number;
  roc_auc: number;
  ks_statistic: number;
  lift_top_decile: number;
}

export interface LearningState {
  simulated: boolean;
  held_out_size: number;
  total_pool: number;
  steps_total: number;
  current_step: number;
  can_retrain: boolean;
  history: LearningStep[];
}
