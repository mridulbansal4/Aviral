import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

import "./timeline.css";
import { ApplicantPicker } from "../../design-system/ApplicantPicker";
import { inr, num } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useTimeline } from "../../lib/queries";
import type { TimelinePoint } from "../../lib/api";
import { CashflowChart } from "./CashflowChart";

function TimelineEntry({ point, index }: { point: TimelinePoint; index: number }) {
  const positive = point.net_savings >= 0;
  const topCategories = Object.entries(point.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <motion.div
      className="tl-entry"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
    >
      {/* Spine dot */}
      <div className={`tl-dot ${positive ? "tl-dot--pos" : "tl-dot--neg"}`} />
      {/* Spine line drawn via CSS on .tl-feed::before */}

      <div className="tl-body">
        <div className="tl-header">
          <span className="tl-month">{point.month}</span>
          <span className={`tl-net tabular ${positive ? "tl-net--pos" : "tl-net--neg"}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {inr(Math.abs(point.net_savings))}
          </span>
        </div>

        <div className="tl-row">
          <span className="tl-kv">
            <span className="tl-kv__k">Income</span>
            <span className="tl-kv__v tabular">{inr(point.income)}</span>
          </span>
          <span className="tl-kv">
            <span className="tl-kv__k">Spend</span>
            <span className="tl-kv__v tabular">{inr(point.total_spend)}</span>
          </span>
        </div>

        {topCategories.length > 0 && (
          <div className="tl-cats">
            {topCategories.map(([cat, amt]) => (
              <span key={cat} className="tl-cat">
                {cat.replace(/_/g, " ")} <span className="tabular">{inr(amt)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TimelinePage() {
  const { id, setId } = useActiveApplicant();
  const { data, isLoading } = useTimeline(id);

  return (
    <>
      <header className="workspace__header workspace__header--row">
        <div>
          <h1 className="workspace__title">Investigation Timeline</h1>
          <p className="workspace__subtitle">
            Chronological financial history and temporal intelligence
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
        <motion.div
          className="grid grid--split"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Left: Chronological Feed */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
              <div className="card__title">Financial Chronology</div>
              <div className="card__hint">12-month trailing investigation log</div>
            </div>
            <div className="tl-feed" style={{ maxHeight: "600px", overflowY: "auto", padding: "var(--space-4)" }}>
              {data.points.map((p, i) => (
                <TimelineEntry key={p.month} point={p} index={i} />
              ))}
            </div>
          </div>

          {/* Right: Metrics + Chart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Temporal Intelligence Metrics */}
            <div className="card">
              <div className="card__title">Temporal Intelligence</div>
              <div className="card__hint" style={{ marginBottom: "var(--space-3)" }}>
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

            {/* TradingView Cashflow Chart */}
            <div className="card">
              <div className="card__title">Cashflow Chart</div>
              <div className="card__hint">Income vs. Spend vs. Net Savings - canvas-rendered</div>
              <CashflowChart points={data.points} />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
