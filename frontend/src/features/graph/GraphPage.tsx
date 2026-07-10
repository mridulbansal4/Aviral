/**
 * Relationship Graph - the applicant's financial neighbourhood: employers,
 * builders, lenders and merchants, plus peers who share the same employer or
 * builder. Clicking a peer re-centres the investigation on them.
 */

import "./graph.css";
import { ApplicantPicker } from "../../design-system/ApplicantPicker";
import { num, titleCase } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useGraph } from "../../lib/queries";
import { GraphCanvas } from "./GraphCanvas";

const LEGEND = [
  { subtype: "employer", color: "#4c8dff", label: "Employer" },
  { subtype: "builder", color: "#b57bff", label: "Builder" },
  { subtype: "lender", color: "#e0a53b", label: "Lender" },
  { subtype: "hospital", color: "#e5484d", label: "Hospital" },
  { subtype: "merchant", color: "#5b93a8", label: "Merchant" },
  { subtype: "amc", color: "#2fbf71", label: "Investment" },
];

export function GraphPage() {
  const { id, setId } = useActiveApplicant();
  const { data, isLoading } = useGraph(id);

  return (
    <>
      <header className="workspace__header workspace__header--row">
        <div>
          <h1 className="workspace__title">Relationship Graph</h1>
          <p className="workspace__subtitle">
            Financial knowledge graph - entities, flows and shared hubs
          </p>
        </div>
        <ApplicantPicker value={id} onChange={setId} />
      </header>

      {!id ? (
        <div className="card">
          <p className="empty">Select an applicant to explore their network.</p>
        </div>
      ) : isLoading || !data ? (
        <div className="empty">Building graph…</div>
      ) : (
        <div className="graph-layout">
          <div className="card graph-card">
            <GraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              onSelectPeer={setId}
            />
            <div className="graph-legend">
              {LEGEND.map((l) => (
                <span key={l.subtype}>
                  <i className="dot" style={{ background: l.color }} /> {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="graph-side">
            <div className="card">
              <div className="card__title">Graph features</div>
              <div className="card__hint">Fed to the propensity model</div>
              {data.features.map((f) => (
                <div className="kv" key={f.key}>
                  <span className="kv__key" title={f.provenance}>
                    {f.label}
                  </span>
                  <span className="kv__val">{num(f.value, 2)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card__title">Neighbourhood</div>
              <div className="card__hint">{data.nodes.length} entities · {data.edges.length} flows</div>
              <div className="chip-row">
                {Array.from(new Set(data.nodes.map((n) => n.subtype))).map((s) => (
                  <span className="chip" key={s}>
                    {titleCase(s)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
