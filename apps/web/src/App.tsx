import { useState } from "react";

import "./App.css";
import { NAV_ITEMS } from "./app/navigation";
import { useCapabilities } from "./lib/queries";
import { OverviewPage } from "./features/overview/OverviewPage";
import { ApplicantsPage } from "./features/applicants/ApplicantsPage";
import { TimelinePage } from "./features/timeline/TimelinePage";
import { GraphPage } from "./features/graph/GraphPage";
import { PatternsPage } from "./features/patterns/PatternsPage";
import { ConfidencePage } from "./features/confidence/ConfidencePage";
import { GovernancePage } from "./features/governance/GovernancePage";

/**
 * Application shell. A fixed sidebar drives navigation; screens are gated by
 * backend feature flags so unfinished milestones appear locked rather than
 * broken. Only the Overview screen is implemented at M0.
 */
export function App() {
  const [active, setActive] = useState("overview");
  const caps = useCapabilities();
  const flags = caps.data?.flags ?? {};

  const isUnlocked = (flag: string | null) => flag === null || !!flags[flag];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">ID</div>
          <div>
            <div className="brand__name">IDBI Intelligence</div>
            <div className="brand__sub">Adaptive Lending</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav__label">Console</div>
          {NAV_ITEMS.map((item) => {
            const unlocked = isUnlocked(item.flag);
            const activeCls = item.id === active ? " nav__item--active" : "";
            return (
              <button
                key={item.id}
                className={`nav__item${activeCls}`}
                disabled={!unlocked}
                title={item.description}
                onClick={() => unlocked && setActive(item.id)}
              >
                <span>{item.label}</span>
                {!unlocked && (
                  <span className="nav__lock">{item.milestone}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        {active === "overview" && <OverviewPage />}
        {active === "applicants" && <ApplicantsPage />}
        {active === "timeline" && <TimelinePage />}
        {active === "graph" && <GraphPage />}
        {active === "patterns" && <PatternsPage />}
        {active === "confidence" && <ConfidencePage />}
        {active === "governance" && <GovernancePage />}
        {![
          "overview",
          "applicants",
          "timeline",
          "graph",
          "patterns",
          "confidence",
          "governance",
        ].includes(active) && <PlaceholderScreen id={active} />}
      </main>
    </div>
  );
}

function PlaceholderScreen({ id }: { id: string }) {
  const item = NAV_ITEMS.find((n) => n.id === id);
  return (
    <>
      <header className="workspace__header">
        <h1 className="workspace__title">{item?.label}</h1>
        <p className="workspace__subtitle">{item?.description}</p>
      </header>
      <div className="card">
        <p className="empty">
          Arrives in milestone {item?.milestone}. This screen is scaffolded in
          the navigation model so the platform's shape is visible today.
        </p>
      </div>
    </>
  );
}
