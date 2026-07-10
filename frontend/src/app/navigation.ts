/**
 * Navigation model. Each screen from the roadmap maps to the feature flag that
 * unlocks it, so the UI progressively reveals complexity as milestones land -
 * locked screens are shown but disabled, communicating the platform's shape
 * without pretending unfinished features work.
 */

export interface NavItem {
  id: string;
  label: string;
  /** Feature flag gating this screen; `null` means always available. */
  flag: string | null;
  milestone: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    flag: null,
    milestone: "M0",
    description: "Platform status and capabilities",
  },
  {
    id: "applicants",
    label: "Applicants",
    flag: null,
    milestone: "M2",
    description: "Book of business, scored - drill into Applicant 360 with SHAP evidence",
  },
  {
    id: "timeline",
    label: "Behaviour Timeline",
    flag: "temporal_features",
    milestone: "M3",
    description: "Rolling 12-month momentum, volatility and seasonality",
  },
  {
    id: "graph",
    label: "Relationship Graph",
    flag: "knowledge_graph",
    milestone: "M3",
    description: "Financial knowledge graph of employers, merchants and flows",
  },
  {
    id: "patterns",
    label: "Pattern Explorer",
    flag: "pattern_discovery",
    milestone: "M4",
    description: "Discovered transaction sequences that convert into loans",
  },
  {
    id: "confidence",
    label: "Confidence Inspector",
    flag: "confidence_intelligence",
    milestone: "M4",
    description: "Data, model, graph, pattern and temporal confidence",
  },
  {
    id: "governance",
    label: "Governance",
    flag: "compliance_engine",
    milestone: "M5",
    description: "Model card, fair-lending guardrails and AA consent posture",
  },
  {
    id: "learning",
    label: "Learning Dashboard",
    flag: "continuous_learning",
    milestone: "M6",
    description: "Validation metrics and simulated outcome-driven retraining",
  },
];
