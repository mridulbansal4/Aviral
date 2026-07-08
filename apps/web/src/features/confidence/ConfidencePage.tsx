/**
 * Confidence Inspector — decomposes Decision Confidence into its five defined
 * dimensions. The radar shows the shape; the dimension cards show the exact
 * value, weight, rationale and the raw inputs behind each score. No black-box
 * "High/Medium/Low".
 */

import "./confidence.css";
import { ApplicantPicker } from "../../design-system/ApplicantPicker";
import { Gauge } from "../../design-system/Gauge";
import { pct, titleCase } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useConfidence } from "../../lib/queries";
import { ConfidenceRadar } from "./ConfidenceRadar";

export function ConfidencePage() {
  const { id, setId } = useActiveApplicant();
  const { data, isLoading } = useConfidence(id);

  return (
    <>
      <header className="workspace__header workspace__header--row">
        <div>
          <h1 className="workspace__title">Confidence Inspector</h1>
          <p className="workspace__subtitle">
            Five defined dimensions aggregated into Decision Confidence
          </p>
        </div>
        <ApplicantPicker value={id} onChange={setId} />
      </header>

      {!id ? (
        <div className="card">
          <p className="empty">Select an applicant to inspect confidence.</p>
        </div>
      ) : isLoading || !data ? (
        <div className="empty">Computing confidence…</div>
      ) : (
        <div className="conf-layout">
          <div className="card conf-hero">
            <Gauge
              value={data.decision_confidence}
              tone={data.band.tone}
              label="Decision"
              size={168}
            />
            <span className={`pill pill--${data.band.tone}`}>
              {data.band.label}
            </span>
            <ConfidenceRadar dimensions={data.dimensions} />
          </div>

          <div className="conf-dims">
            {data.dimensions.map((d) => (
              <div className="card conf-dim" key={d.key}>
                <div className="conf-dim__head">
                  <span className="conf-dim__label">{d.label}</span>
                  <span className="conf-dim__weight tabular">
                    weight {pct(d.weight)}
                  </span>
                </div>
                <div className="conf-dim__bar">
                  <div
                    className="conf-dim__fill"
                    style={{ width: `${d.value * 100}%` }}
                  />
                  <span className="conf-dim__val tabular">{pct(d.value)}</span>
                </div>
                <div className="conf-dim__rationale">{d.rationale}</div>
                <div className="conf-dim__inputs">
                  {Object.entries(d.inputs).map(([k, v]) => (
                    <span className="conf-input" key={k}>
                      {titleCase(k)} <b className="tabular">{v}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
