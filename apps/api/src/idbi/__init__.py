"""IDBI Adaptive Lending Intelligence Platform.

A domain-driven backend that fuses three data tracks (Core Banking, Account
Aggregator, PDF narration) into an explainable retail-lending intelligence view.

Package layout:
    domain/         entities, value objects, DTOs
    services/       application services (ingestion, fusion, features, decision...)
    ml/             propensity model, SHAP explainability, model registry
    graph/          financial knowledge graph + graph features
    rules/          config-driven trigger plugins
    repositories/   data access, swappable behind interfaces
    config/         typed settings + YAML configuration loading
    api/            versioned HTTP surface
"""

__version__ = "0.1.0"
