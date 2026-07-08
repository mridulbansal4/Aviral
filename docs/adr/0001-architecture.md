# ADR 0001 — Platform architecture & critical read of the V2 scaffold

- **Status:** Accepted
- **Date:** 2026-07-08

## Context

The V2 scaffold upgrades a rule-driven lending workflow into an "Adaptive
Lending Intelligence Platform" (knowledge graph, temporal ML, pattern
discovery, continuous learning, multi-dimensional confidence). It is the
product vision, not the implementation. This ADR records the architecture and,
importantly, where we deviate — because building the scaffold literally would
produce an impressive-looking demo that a senior bank architect could dismantle
in minutes.

## Decisions

### 1. One real model, not a model zoo
A single gradient-boosted propensity model (LightGBM) consumes tabular features
**engineered from** temporal sequences and graph metrics. Consequences: AUC,
lift and **SHAP are genuinely computed**, not decorative; temporal and graph
become explainable feature families rather than separate opaque models (SHAP is
clean on GBTs, muddy on learned embeddings).

### 2. Honest, causal synthetic data
A deterministic (seeded) generator where the loan-conversion label is produced
by a hidden ground-truth process and features carry **partial, noisy** signal.
This is the single most important integrity decision: if we generate both the
data and the graph carelessly, graph/temporal features leak the label and every
confidence number becomes theatre.

### 3. Continuous learning is simulated and labelled
Real Offer→Accept→Disburse→Repayment→Update needs months of labelled outcomes.
We implement a feedback store and a demoable "retrain" action that shows real
before/after metric deltas on held-out data, **explicitly badged as simulated**.
Silently faking it would contradict the explainability promise.

### 4. Defined confidence algebra
Each sub-confidence (data, model, graph, pattern, temporal) is a stated
function; Decision Confidence is a documented weighted aggregation with weights
in config. No tuned magic constants buried in code.

### 5. Compliance with teeth
A prohibited-feature registry (religion, caste, gender, and proxies) enforced at
the feature-store boundary; a generated model card; and Account Aggregator
**consent artifacts** as first-class objects gating data use. This is the move
that impresses RBI-aware reviewers.

### 6. Vertical slice before breadth
Build one applicant fully end-to-end (data → features → model → explanation →
Applicant 360) before adding screens. Avoids the "five half-working systems"
failure mode.

## Stack

- **Backend:** Python + FastAPI. Non-negotiable because SHAP, LightGBM,
  networkx and pandas are the mature tools for the explainability/graph/temporal
  requirements. A Node backend would force faking the ML.
- **Frontend:** React + TypeScript + Vite, custom design system (dark
  "intelligence console" aesthetic), TanStack Query, Cytoscape for the graph.
- **Storage:** DuckDB/SQLite behind a repository abstraction, swappable to
  Postgres. No ops burden for a prototype; a clean seam for production.
- **Config-driven:** rules, confidence weights, feature flags and prohibited
  features live in YAML, never hardcoded.

## Consequences

- Every headline metric on screen is reproducible from a fixed seed and
  defensible under questioning.
- The platform always boots in a working state; capabilities reveal
  progressively via feature flags as milestones land.
- We trade breadth-at-once for correctness-first, accepting that some screens
  are visibly "locked" until their milestone.
