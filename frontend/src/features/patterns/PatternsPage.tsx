/**
 * Pattern Explorer — the behavioural clusters discovered in the population,
 * ranked by conversion rate. Each card shows how far the pattern departs from
 * the base rate (the discovery signal), what defines it, and example members.
 */

import "./patterns.css";
import { num, pct, titleCase } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useModelCard, usePatterns } from "../../lib/queries";
import type { Pattern } from "../../lib/api";

function PatternCard({
  pattern,
  baseRate,
  onPick,
}: {
  pattern: Pattern;
  baseRate: number;
  onPick: (id: string) => void;
}) {
  const converts = pattern.precision >= baseRate;
  return (
    <div className={`card pattern ${pattern.significant ? "pattern--sig" : ""}`}>
      <div className="pattern__head">
        <span className="pattern__label">{pattern.label}</span>
        {pattern.significant && (
          <span className={`tag ${converts ? "tag--positive" : "tag--negative"}`}>
            {converts ? "Converts" : "Rarely converts"}
          </span>
        )}
      </div>

      {/* precision vs base rate */}
      <div className="pattern__bar">
        <div
          className="pattern__base"
          style={{ left: `${baseRate * 100}%` }}
          title={`Base rate ${pct(baseRate)}`}
        />
        <div
          className={`pattern__fill ${converts ? "up" : "down"}`}
          style={{ width: `${pattern.precision * 100}%` }}
        />
      </div>
      <div className="pattern__stats">
        <span>
          Conversion <b className="tabular">{pct(pattern.precision)}</b>
        </span>
        <span>
          Lift <b className="tabular">{num(pattern.lift, 2)}×</b>
        </span>
        <span>
          Support <b className="tabular">{pattern.support}</b>
        </span>
        <span>
          Product <b>{titleCase(pattern.dominant_loan_type)}</b>
        </span>
      </div>

      <div className="pattern__features">
        {pattern.defining_features.map((f) => (
          <span
            className="chip"
            key={f.feature}
            title={`${titleCase(f.feature)} · z=${f.z}`}
          >
            {f.phrase}
          </span>
        ))}
      </div>

      <div className="pattern__examples">
        <span className="pattern__examples-label">Examples:</span>
        {pattern.example_customer_ids.map((cid) => (
          <button key={cid} className="linkchip" onClick={() => onPick(cid)}>
            {cid}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PatternsPage() {
  const { setId } = useActiveApplicant();
  const { data: patterns, isLoading } = usePatterns();
  const { data: card } = useModelCard();
  const baseRate = card?.metrics.base_rate ?? 0.38;

  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">Pattern Explorer</h1>
        <p className="workspace__subtitle">
          Behavioural clusters discovered unsupervised, then characterized by
          outcome — base rate {pct(baseRate)}
        </p>
      </header>

      {isLoading || !patterns ? (
        <div className="empty">Discovering patterns…</div>
      ) : (
        <div className="pattern-grid">
          {patterns.map((p) => (
            <PatternCard
              key={p.id}
              pattern={p}
              baseRate={baseRate}
              onPick={setId}
            />
          ))}
        </div>
      )}
    </>
  );
}
