/**
 * Overview — the M0 landing screen. Confirms the backend is reachable and
 * renders the platform's capability map straight from the API's feature flags,
 * so the console always tells the truth about what is live.
 */

import { StatusBadge, type Status } from "../../design-system/StatusBadge";
import { NAV_ITEMS } from "../../app/navigation";
import { useCapabilities, useHealth } from "../../lib/queries";

const FLAG_LABELS: Record<string, string> = {
  temporal_features: "Temporal Intelligence",
  knowledge_graph: "Financial Knowledge Graph",
  pattern_discovery: "Pattern Discovery",
  confidence_intelligence: "Confidence Intelligence",
  compliance_engine: "Compliance & Consent",
  offer_orchestration: "Offer Orchestration",
  continuous_learning: "Continuous Learning",
};

function milestoneForFlag(flag: string): string {
  return NAV_ITEMS.find((n) => n.flag === flag)?.milestone ?? "—";
}

export function OverviewPage() {
  const health = useHealth();
  const caps = useCapabilities();

  const apiStatus: Status = health.isError
    ? "error"
    : health.isSuccess
      ? "ok"
      : "pending";

  const flags = caps.data?.flags ?? {};

  return (
    <>
      <header className="workspace__header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 className="workspace__title">Platform Overview</h1>
            <p className="workspace__subtitle">
              Adaptive lending intelligence — status and enabled capabilities
            </p>
          </div>
          <StatusBadge status={apiStatus} />
        </div>
      </header>

      <div className="grid grid--2" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card">
          <div className="card__title">Service</div>
          <div className="card__hint">Live backend connection</div>
          {health.isError ? (
            <p className="empty">
              API unreachable. Start it with{" "}
              <code>uv run uvicorn idbi.main:app --reload --app-dir src</code>.
            </p>
          ) : (
            <>
              <div className="kv">
                <span className="kv__key">Service</span>
                <span className="kv__val">{health.data?.service ?? "—"}</span>
              </div>
              <div className="kv">
                <span className="kv__key">Version</span>
                <span className="kv__val">{health.data?.version ?? "—"}</span>
              </div>
              <div className="kv">
                <span className="kv__key">Environment</span>
                <span className="kv__val">
                  {health.data?.environment ?? "—"}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card__title">Roadmap</div>
          <div className="card__hint">Milestone progress</div>
          <div className="kv">
            <span className="kv__key">M0 · Skeleton</span>
            <span className="kv__val" style={{ color: "var(--color-positive)" }}>
              done
            </span>
          </div>
          <div className="kv">
            <span className="kv__key">M1 · Causal data + features</span>
            <span className="kv__val" style={{ color: "var(--color-positive)" }}>
              done
            </span>
          </div>
          <div className="kv">
            <span className="kv__key">M2 · Applicant 360 spine</span>
            <span className="kv__val" style={{ color: "var(--color-positive)" }}>
              done
            </span>
          </div>
          <div className="kv">
            <span className="kv__key">M3 · Temporal + graph</span>
            <span className="kv__val">next</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Capabilities</div>
        <div className="card__hint">
          Driven live by the backend feature flags — features reveal
          progressively as milestones land.
        </div>
        <div className="grid grid--3">
          {Object.keys(FLAG_LABELS).map((flag) => {
            const on = flags[flag] ?? false;
            return (
              <div className="capability" key={flag}>
                <div className="capability__head">
                  <span className="capability__name">{FLAG_LABELS[flag]}</span>
                  <span className="capability__ms">
                    {milestoneForFlag(flag)}
                  </span>
                </div>
                <span
                  className={`capability__state capability__state--${
                    on ? "on" : "off"
                  }`}
                >
                  {on ? "● Enabled" : "○ Not yet enabled"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
