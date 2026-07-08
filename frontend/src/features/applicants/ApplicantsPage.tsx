/**
 * Applicants workspace — a searchable, sortable book of business with a live
 * model-quality strip, and master→detail navigation into Applicant 360.
 */

import { useMemo, useState } from "react";

import "../applicant/applicant.css";
import { inr, num, pct, titleCase } from "../../design-system/format";
import { useActiveApplicant } from "../../app/ApplicantContext";
import { useApplicants, useModelCard } from "../../lib/queries";
import { Applicant360 } from "../applicant/Applicant360";

type SortKey = "name" | "income" | "outcome";

function ModelStrip() {
  const { data } = useModelCard();
  if (!data) return null;
  const m = data.metrics;
  const items = [
    { label: "ROC-AUC", value: num(m.roc_auc, 3) },
    { label: "KS", value: num(m.ks_statistic, 3) },
    { label: "Lift @ decile", value: `${num(m.lift_top_decile, 2)}×` },
    { label: "Base rate", value: pct(m.base_rate) },
    { label: "Population", value: String(m.n_samples) },
  ];
  return (
    <div className="model-strip">
      {items.map((it) => (
        <div className="model-strip__item" key={it.label}>
          <span className="model-strip__label">{it.label}</span>
          <span className="model-strip__value tabular">{it.value}</span>
        </div>
      ))}
      <div className="model-strip__note">
        Out-of-fold metrics · {data.version}
      </div>
    </div>
  );
}

export function ApplicantsPage() {
  const { id: selected, setId: setSelected } = useActiveApplicant();
  const [showDetail, setShowDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("outcome");
  const { data, isLoading } = useApplicants();

  const openApplicant = (id: string) => {
    setSelected(id);
    setShowDetail(true);
  };

  const rows = useMemo(() => {
    let r = data ?? [];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.customer_id.toLowerCase().includes(q),
      );
    }
    return [...r].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "income")
        return b.verified_monthly_income - a.verified_monthly_income;
      return Number(b.converted) - Number(a.converted);
    });
  }, [data, query, sort]);

  if (showDetail && selected) {
    return (
      <Applicant360
        customerId={selected}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">Applicants</h1>
        <p className="workspace__subtitle">
          Book of business scored by the hybrid decision engine
        </p>
      </header>

      <ModelStrip />

      <div className="table-toolbar">
        <input
          className="input"
          placeholder="Search name or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="segmented">
          {(["outcome", "income", "name"] as SortKey[]).map((k) => (
            <button
              key={k}
              className={`segmented__btn ${
                sort === k ? "segmented__btn--active" : ""
              }`}
              onClick={() => setSort(k)}
            >
              {titleCase(k)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="empty">Loading applicants…</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="atable">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Profile</th>
                <th className="atable__num">Verified income</th>
                <th>Outcome</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.customer_id} onClick={() => openApplicant(a.customer_id)}>
                  <td>
                    <div className="atable__name">{a.name}</div>
                    <div className="atable__id">{a.customer_id}</div>
                  </td>
                  <td className="atable__muted">
                    {a.age} · {titleCase(a.employment_type)} ·{" "}
                    {a.city_tier.replace("_", " ")}
                  </td>
                  <td className="atable__num tabular">
                    {inr(a.verified_monthly_income)}
                  </td>
                  <td>
                    {a.converted ? (
                      <span className="tag tag--positive">
                        {titleCase(a.loan_type)}
                      </span>
                    ) : (
                      <span className="tag tag--muted">No loan</span>
                    )}
                  </td>
                  <td className="atable__chev">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
