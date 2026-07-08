/**
 * Deterministic-rules panel. Banks require auditable rules alongside the model;
 * each row shows the verdict and a plain-language rationale.
 */

import type { RuleResult } from "../../lib/api";

export function RulesPanel({ rules }: { rules: RuleResult[] }) {
  return (
    <div className="rules">
      {rules.map((r) => {
        // A "favourable" outcome depends on polarity: positive rules should
        // pass; negative rules (risk flags) are favourable when they do NOT.
        const favourable = r.polarity === "positive" ? r.passed : !r.passed;
        return (
          <div className="rules__row" key={r.id}>
            <span
              className={`rules__mark rules__mark--${
                favourable ? "ok" : "flag"
              }`}
            >
              {favourable ? "✓" : "!"}
            </span>
            <div className="rules__body">
              <div className="rules__label">{r.label}</div>
              <div className="rules__rationale">{r.rationale}</div>
            </div>
            <span className="rules__weight tabular">
              {Math.round(r.weight * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
