/**
 * SHAP evidence chart — a diverging horizontal bar per feature, ranked by
 * absolute impact. Green pushes propensity up, red pulls it down. This is the
 * platform's core promise: every prediction decomposed into visible evidence.
 */

import type { ShapEvidence } from "../../lib/api";
import { num, titleCase } from "../../design-system/format";

export function ShapChart({
  evidence,
  limit = 8,
}: {
  evidence: ShapEvidence[];
  limit?: number;
}) {
  const shown = evidence.slice(0, limit);
  const max = Math.max(...shown.map((e) => Math.abs(e.contribution)), 1e-6);

  return (
    <div className="shap">
      {shown.map((e) => {
        const magnitude = Math.abs(e.contribution) / max;
        const up = e.contribution >= 0;
        return (
          <div className="shap__row" key={e.feature} title={e.provenance}>
            <div className="shap__label">{titleCase(e.feature)}</div>
            <div className="shap__track">
              <div className="shap__axis" />
              <div
                className={`shap__bar shap__bar--${up ? "up" : "down"}`}
                style={{
                  width: `${magnitude * 50}%`,
                  [up ? "left" : "right"]: "50%",
                } as React.CSSProperties}
              />
            </div>
            <div
              className={`shap__value tabular ${
                up ? "shap__value--up" : "shap__value--down"
              }`}
            >
              {up ? "+" : "−"}
              {num(Math.abs(e.contribution), 2)}
            </div>
          </div>
        );
      })}
      <div className="shap__legend">
        <span>
          <i className="shap__dot shap__dot--down" /> Lowers propensity
        </span>
        <span>
          <i className="shap__dot shap__dot--up" /> Raises propensity
        </span>
        <span className="shap__legend-note">Contribution in log-odds · hover for source</span>
      </div>
    </div>
  );
}
