/**
 * Behaviour Timeline — rolling 12-month cashflow with temporal-intelligence
 * metrics (momentum, seasonality, volatility trend). These are the same signals
 * the propensity model consumes, shown here so the RM can see the trajectory.
 */

import "./timeline.css";
import { ApplicantPicker } from "../../design-system/ApplicantPicker";
import { num } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useTimeline } from "../../lib/queries";
import { CashflowChart } from "./CashflowChart";

export function TimelinePage() {
  const { id, setId } = useActiveApplicant();
  const { data, isLoading } = useTimeline(id);

  return (
    <>
      <header className="workspace__header workspace__header--row">
        <div>
          <h1 className="workspace__title">Behaviour Timeline</h1>
          <p className="workspace__subtitle">
            Rolling 12-month cashflow and temporal intelligence
          </p>
        </div>
        <ApplicantPicker value={id} onChange={setId} />
      </header>

      {!id ? (
        <div className="card">
          <p className="empty">Select an applicant to view their timeline.</p>
        </div>
      ) : isLoading || !data ? (
        <div className="empty">Loading timeline…</div>
      ) : (
        <>
          <div className="card">
            <div className="card__title">Monthly cashflow</div>
            <div className="card__hint">
              Net savings (bars) with income and spend (lines)
            </div>
            <CashflowChart points={data.points} />
            <div className="chart-legend">
              <span>
                <i className="dot dot--accent" /> Income
              </span>
              <span>
                <i className="dot dot--warning" /> Spend
              </span>
              <span>
                <i className="dot dot--positive" /> Net savings
              </span>
            </div>
          </div>

          <div className="card" style={{ marginTop: "var(--space-4)" }}>
            <div className="card__title">Temporal intelligence</div>
            <div className="card__hint">
              Momentum and seasonality signals feeding the model
            </div>
            <div className="metric-grid">
              {data.metrics.map((m) => (
                <div className={`metric metric--${m.tone}`} key={m.key}>
                  <div className="metric__value tabular">{num(m.value, 3)}</div>
                  <div className="metric__label">{m.label}</div>
                  <div className="metric__prov">{m.provenance}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
