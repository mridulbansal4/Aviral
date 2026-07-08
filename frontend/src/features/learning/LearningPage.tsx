/**
 * Learning Dashboard — closes the loop. Left: the SIMULATED continuous-learning
 * cycle (retrain on accumulating outcomes, real before/after deltas on a fixed
 * held-out set). Right: validation — feature-family contribution, rule
 * precision, and PSI drift. The "Simulated" framing is explicit throughout.
 */

import "./learning.css";
import { num, pct, titleCase } from "../../design-system/format";
import {
  useLearningMutations,
  useLearningState,
  useValidation,
} from "../../lib/queries";

const FAMILY_COLOR: Record<string, string> = {
  base: "var(--color-accent)",
  temporal: "#2fbf71",
  graph: "#b57bff",
};
const DRIFT_TONE: Record<string, string> = {
  stable: "positive",
  minor: "warning",
  material: "negative",
};

import { LearningChart } from "./LearningChart";

function LearningPanel() {
  const { data: state } = useLearningState();
  const { retrain, reset } = useLearningMutations();
  if (!state) return <div className="empty">Loading learning loop…</div>;

  const latest = state.history[state.history.length - 1];
  const prev = state.history[state.history.length - 2];
  const deltaAuc = prev ? latest.roc_auc - prev.roc_auc : 0;

  return (
    <div className="card learn-card">
      <div className="learn-head">
        <div>
          <div className="card__title">Continuous learning</div>
          <div className="card__hint">
            Retrain as outcomes accumulate · held-out test {state.held_out_size},
            pool {state.total_pool}
          </div>
        </div>
        <span className="sim-badge">SIMULATED OUTCOMES</span>
      </div>

      <LearningChart history={state.history} />

      <div className="learn-current">
        <div className="learn-metric">
          <span className="learn-metric__v tabular">{num(latest.roc_auc, 3)}</span>
          <span className="learn-metric__k">
            ROC-AUC
            {prev && (
              <b className={deltaAuc >= 0 ? "delta-up" : "delta-down"}>
                {" "}
                {deltaAuc >= 0 ? "▲" : "▼"} {num(Math.abs(deltaAuc), 3)}
              </b>
            )}
          </span>
        </div>
        <div className="learn-metric">
          <span className="learn-metric__v tabular">
            {num(latest.lift_top_decile, 2)}×
          </span>
          <span className="learn-metric__k">Lift @ decile</span>
        </div>
        <div className="learn-metric">
          <span className="learn-metric__v tabular">{latest.train_size}</span>
          <span className="learn-metric__k">Training outcomes</span>
        </div>
      </div>

      <div className="learn-actions">
        <button
          className="btn btn--primary"
          disabled={!state.can_retrain || retrain.isPending}
          onClick={() => retrain.mutate()}
        >
          {retrain.isPending
            ? "Retraining…"
            : state.can_retrain
              ? "Feed next outcomes → Retrain"
              : "All outcomes incorporated"}
        </button>
        <button
          className="btn"
          disabled={reset.isPending}
          onClick={() => reset.mutate()}
        >
          Reset
        </button>
        <span className="learn-step">
          Round {state.current_step} / {state.steps_total - 1}
        </span>
      </div>
    </div>
  );
}

function ValidationPanel() {
  const { data } = useValidation();
  if (!data) return <div className="empty">Loading validation…</div>;

  return (
    <div className="learn-side">
      <div className="card">
        <div className="card__title">Feature-family contribution</div>
        <div className="card__hint">Share of model gain by family</div>
        {data.family_contribution.map((f) => (
          <div className="fam" key={f.family}>
            <div className="fam__head">
              <span>
                {titleCase(f.family)}{" "}
                <span className="fam__count">({f.feature_count})</span>
              </span>
              <span className="tabular">{pct(f.importance_share)}</span>
            </div>
            <div className="fam__bar">
              <div
                className="fam__fill"
                style={{
                  width: `${f.importance_share * 100}%`,
                  background: FAMILY_COLOR[f.family] ?? "var(--color-accent)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__title">Rule precision</div>
        <div className="card__hint">Conversion rate when each rule is favourable</div>
        {data.rules.slice(0, 6).map((r) => (
          <div className="kv" key={r.id}>
            <span className="kv__key">{r.label}</span>
            <span className="kv__val">
              {pct(r.precision)} · {num(r.lift, 2)}×
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__title">Drift monitoring</div>
        <div className="card__hint">
          PSI, reference vs recent cohort —{" "}
          <span className={`drift-status drift-status--${DRIFT_TONE[data.drift.status]}`}>
            {titleCase(data.drift.status)}
          </span>
        </div>
        {data.drift.features.slice(0, 5).map((f) => (
          <div className="kv" key={f.feature}>
            <span className="kv__key">{titleCase(f.feature)}</span>
            <span className={`kv__val drift-${DRIFT_TONE[f.status]}`}>
              {num(f.psi, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LearningPage() {
  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">Learning Dashboard</h1>
        <p className="workspace__subtitle">
          Validation and the closed continuous-learning loop
        </p>
      </header>
      <div className="learn-layout">
        <LearningPanel />
        <ValidationPanel />
      </div>
    </>
  );
}
