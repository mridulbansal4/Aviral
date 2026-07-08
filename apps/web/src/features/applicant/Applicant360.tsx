/**
 * Applicant 360 — the vertical-slice centrepiece. An RM should understand an
 * applicant in seconds: propensity and band up top, verified income and the
 * recommended product beside it, then the evidence (SHAP) and the auditable
 * rules below. Ground truth is shown (synthetic-only) so the model can be
 * judged against reality.
 */

import { Gauge } from "../../design-system/Gauge";
import { StatusBadge } from "../../design-system/StatusBadge";
import { inr, pct, titleCase } from "../../design-system/format";
import { useDecision } from "../../lib/queries";
import { RulesPanel } from "./RulesPanel";
import { ShapChart } from "./ShapChart";

export function Applicant360({
  customerId,
  onBack,
}: {
  customerId: string;
  onBack: () => void;
}) {
  const { data: d, isLoading, isError } = useDecision(customerId);

  if (isLoading) return <div className="empty">Computing decision…</div>;
  if (isError || !d)
    return <div className="empty">Could not load this applicant.</div>;

  const predictedConvert = d.propensity >= 0.5;
  const agrees = predictedConvert === d.ground_truth.converted;

  return (
    <div className="a360">
      <button className="a360__back" onClick={onBack}>
        ← All applicants
      </button>

      <header className="a360__header">
        <div>
          <h1 className="workspace__title">{d.name}</h1>
          <p className="workspace__subtitle">
            {d.customer_id} · Model {d.model_version}
          </p>
        </div>
        <span className={`pill pill--${d.band.tone}`}>{d.band.label}</span>
      </header>

      {/* headline row */}
      <div className="a360__headline">
        <div className="card a360__gauge-card">
          <Gauge value={d.propensity} tone={d.band.tone} label="Propensity" />
          <div className="a360__conf">
            Model confidence
            <span className="tabular"> {pct(d.model_confidence)}</span>
          </div>
        </div>

        <div className="card a360__stat-card">
          <div className="stat">
            <div className="stat__label">Verified monthly income</div>
            <div className="stat__value tabular">
              {inr(d.verified_monthly_income)}
            </div>
            <div className="stat__hint">Robust median of salary credits</div>
          </div>
          <div className="stat">
            <div className="stat__label">Recommended product</div>
            <div className="stat__value">
              {titleCase(d.recommended_product)}
            </div>
            <div className="stat__hint">Routed by deterministic rules</div>
          </div>
          <div className="stat">
            <div className="stat__label">Rule score</div>
            <div className="stat__value tabular">{pct(d.rule_score)}</div>
            <div className="stat__hint">Weighted favourable rules</div>
          </div>
        </div>

        <div className="card a360__truth-card">
          <div className="card__title">Outcome check</div>
          <div className="card__hint">Synthetic ground truth — prototype only</div>
          <div className="kv">
            <span className="kv__key">Actual outcome</span>
            <span className="kv__val">
              {d.ground_truth.converted
                ? `Converted · ${titleCase(d.ground_truth.loan_type)}`
                : "Did not convert"}
            </span>
          </div>
          <div className="kv">
            <span className="kv__key">Model prediction</span>
            <span className="kv__val">
              {predictedConvert ? "Convert" : "No convert"}
            </span>
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            <StatusBadge
              status={agrees ? "ok" : "error"}
              label={agrees ? "Model agrees with outcome" : "Model disagrees"}
            />
          </div>
        </div>
      </div>

      {/* evidence + rules */}
      <div className="a360__lower">
        <div className="card">
          <div className="card__title">Why this score — evidence</div>
          <div className="card__hint">
            Exact SHAP decomposition from the gradient-boosted model
          </div>
          <ShapChart evidence={d.evidence} />
        </div>

        <div className="card">
          <div className="card__title">Policy rules</div>
          <div className="card__hint">Deterministic, auditable checks</div>
          <RulesPanel rules={d.rules} />
        </div>
      </div>
    </div>
  );
}
