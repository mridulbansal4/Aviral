/**
 * Governance — portfolio-level model card and compliance posture. Surfaces the
 * fair-lending guardrails (prohibited features refused in code), the honest
 * model metrics, consent coverage, and the model's stated limitations. This is
 * the screen a bank's risk/compliance reviewer opens first.
 */

import "./governance.css";
import { num, titleCase } from "../../design-system/format";
import { useComplianceSummary, useModelCard2 } from "../../lib/queries";

export function GovernancePage() {
  const { data: card } = useModelCard2();
  const { data: summary } = useComplianceSummary();

  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">Governance</h1>
        <p className="workspace__subtitle">
          Model card, fair-lending guardrails and Account Aggregator consent
        </p>
      </header>

      {/* consent posture */}
      {summary && (
        <div className="gov-strip">
          <Stat label="Applicants" value={String(summary.total_applicants)} />
          <Stat
            label="Active consent"
            value={String(summary.consent_active)}
            tone="positive"
          />
          <Stat
            label="Expired"
            value={String(summary.consent_expired)}
            tone="warning"
          />
          <Stat
            label="Revoked"
            value={String(summary.consent_revoked)}
            tone="negative"
          />
          <Stat
            label="Prohibited features"
            value={String(summary.prohibited_feature_count)}
          />
          <Stat
            label="Model features"
            value={String(summary.used_feature_count)}
          />
        </div>
      )}

      {card && (
        <div className="gov-grid">
          <div className="card">
            <div className="card__title">Model card</div>
            <div className="card__hint">{card.model_version}</div>
            <p className="gov-purpose">{card.purpose}</p>
            <div className="gov-metrics">
              {Object.entries(card.metrics).map(([k, v]) => (
                <div className="gov-metric" key={k}>
                  <span className="gov-metric__v tabular">
                    {k === "roc_auc" || k === "base_rate"
                      ? num(v, 3)
                      : k === "lift_top_decile"
                        ? `${num(v, 2)}×`
                        : num(v, 3)}
                  </span>
                  <span className="gov-metric__k">{titleCase(k)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__title">Fair-lending guardrails</div>
            <div className="card__hint">Refused in code at the feature-store boundary</div>
            <div className="gov-chips">
              {card.prohibited_features.map((f) => (
                <span className="chip chip--banned" key={f}>
                  ⊘ {titleCase(f)}
                </span>
              ))}
            </div>
            <p className="gov-fairness">{card.fairness_statement}</p>
            {card.review_required_features.length > 0 && (
              <div className="gov-review">
                Flagged for bias review:{" "}
                {card.review_required_features.map(titleCase).join(", ")}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card__title">Model features ({card.used_features.length})</div>
            <div className="card__hint">Every input the model is permitted to use</div>
            <div className="gov-chips">
              {card.used_features.map((f) => (
                <span className="chip" key={f}>
                  {titleCase(f)}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__title">Stated limitations</div>
            <div className="card__hint">Honest scope of this prototype</div>
            <ul className="gov-limits">
              {card.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "warning" | "negative";
}) {
  return (
    <div className="gov-stat">
      <span className={`gov-stat__v tabular ${tone ? `gov-stat__v--${tone}` : ""}`}>
        {value}
      </span>
      <span className="gov-stat__l">{label}</span>
    </div>
  );
}
