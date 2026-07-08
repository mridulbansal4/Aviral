/**
 * Offer panel — the orchestrated, compliant loan offer for one applicant.
 * Shows the headline terms, how the principal was bounded (income vs FOIR cap),
 * the risk-based pricing breakdown, the FOIR impact, and every eligibility
 * check. A declined consent shows here as a hard stop.
 */

import { inr, pct } from "../../design-system/format";
import { useOffer } from "../../lib/queries";

const STATUS_META: Record<string, { label: string; tone: string }> = {
  approved_in_principle: { label: "Approved in principle", tone: "positive" },
  referred: { label: "Referred for review", tone: "warning" },
  declined: { label: "Declined", tone: "muted" },
};

export function OfferPanel({ customerId }: { customerId: string }) {
  const { data: o, isLoading } = useOffer(customerId);
  if (isLoading || !o) return <div className="empty">Orchestrating offer…</div>;

  const status = STATUS_META[o.status] ?? STATUS_META.declined;
  const foirLimit = 0.5;
  const declined = o.status === "declined";
  const foirCapBinds = o.max_principal_by_foir <= o.max_principal_by_income;

  return (
    <div className="offer">
      <div className="offer__head">
        <div>
          <div className="offer__product">{o.product_label}</div>
          <div className="offer__band">
            {o.risk_band} pricing · decision confidence {pct(o.decision_confidence)}
          </div>
        </div>
        <span className={`pill pill--${status.tone}`}>{status.label}</span>
      </div>

      {!declined && (
        <div className="offer__terms">
          <div className="offer__principal tabular">{inr(o.principal)}</div>
          <div className="offer__sub">
            at <b className="tabular">{pct(o.annual_rate, 2)}</b> for{" "}
            <b className="tabular">{o.tenure_months}</b> months ·{" "}
            EMI <b className="tabular">{inr(o.monthly_emi)}</b>/mo
          </div>
          <div className="offer__cap">
            Principal bound by {foirCapBinds ? "FOIR capacity" : "income multiple"}{" "}
            (income cap {inr(o.max_principal_by_income, true)} · FOIR cap{" "}
            {inr(o.max_principal_by_foir, true)})
          </div>
        </div>
      )}

      {/* FOIR impact */}
      <div className="offer__foir">
        <div className="offer__foir-head">
          <span>Debt-service (FOIR) impact</span>
          <span className="tabular">
            {pct(o.foir_before)} → {pct(o.foir_after)}
          </span>
        </div>
        <div className="offer__foir-bar">
          <div
            className="offer__foir-before"
            style={{ width: `${Math.min(1, o.foir_before / 0.8) * 100}%` }}
          />
          <div
            className="offer__foir-after"
            style={{ width: `${Math.min(1, o.foir_after / 0.8) * 100}%` }}
          />
          <div
            className="offer__foir-limit"
            style={{ left: `${(foirLimit / 0.8) * 100}%` }}
            title={`FOIR limit ${pct(foirLimit)}`}
          />
        </div>
      </div>

      <div className="offer__cols">
        <div>
          <div className="offer__coltitle">Pricing</div>
          {o.pricing.map((p) => (
            <div className="kv" key={p.label}>
              <span className="kv__key">{p.label}</span>
              <span className="kv__val">{p.value}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="offer__coltitle">Eligibility</div>
          {o.checks.map((c) => (
            <div className="offer__check" key={c.id} title={c.detail}>
              <span
                className={`rules__mark rules__mark--${c.passed ? "ok" : "flag"}`}
              >
                {c.passed ? "✓" : "!"}
              </span>
              <span className="offer__check-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
