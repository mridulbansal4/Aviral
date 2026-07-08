import { useState } from "react";

import "./App.css";
import { NAV_ITEMS } from "./app/navigation";
import { useCapabilities, useHealth } from "./lib/queries";

/** Line icons per screen — keeps the sidebar reading as a real console. */
function NavIcon({ id }: { id: string }) {
  const paths: Record<string, React.ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    applicants: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    timeline: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    graph: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </>
    ),
    patterns: (
      <>
        <path d="M12 3l1.9 4.9L18.9 10l-5 2.1L12 17l-1.9-4.9L5.1 10l5-2.1L12 3z" />
      </>
    ),
    confidence: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.4" />
      </>
    ),
    governance: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </>
    ),
    learning: (
      <>
        <path d="M21 4v6h-6" />
        <path d="M18.5 15a8 8 0 1 1-1.9-8.3L21 10" />
      </>
    ),
  };
  return (
    <svg
      className="nav__icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[id]}
    </svg>
  );
}
import { OverviewPage } from "./features/overview/OverviewPage";
import { ApplicantsPage } from "./features/applicants/ApplicantsPage";
import { TimelinePage } from "./features/timeline/TimelinePage";
import { GraphPage } from "./features/graph/GraphPage";
import { PatternsPage } from "./features/patterns/PatternsPage";
import { ConfidencePage } from "./features/confidence/ConfidencePage";
import { GovernancePage } from "./features/governance/GovernancePage";
import { LearningPage } from "./features/learning/LearningPage";

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
          <div className="brand__mark">
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <g fill="currentColor">
                <rect x="13" y="27" width="6" height="9" rx="2.2" />
                <rect x="21" y="20" width="6" height="16" rx="2.2" />
                <rect x="29" y="13" width="6" height="23" rx="2.2" />
              </g>
            </svg>
          </div>
          <div>
            <div className="brand__name">Aviral</div>
            <div className="brand__sub">Adaptive Lending</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav__section">
            <span className="nav__section-line" />
            <span className="nav__section-label">Console</span>
          </div>
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
                <NavIcon id={item.id} />
                <span className="nav__text">{item.label}</span>
                {!unlocked && (
                  <span className="nav__lock">{item.milestone}</span>
                )}
              </button>
            );
          })}
        </nav>

        <SidebarFooter />
      </aside>

      <main className="workspace">
        {active === "overview" && <OverviewPage />}
        {active === "applicants" && <ApplicantsPage />}
        {active === "timeline" && <TimelinePage />}
        {active === "graph" && <GraphPage />}
        {active === "patterns" && <PatternsPage />}
        {active === "confidence" && <ConfidencePage />}
        {active === "governance" && <GovernancePage />}
        {active === "learning" && <LearningPage />}
        {![
          "overview",
          "applicants",
          "timeline",
          "graph",
          "patterns",
          "confidence",
          "governance",
          "learning",
        ].includes(active) && <PlaceholderScreen id={active} />}
      </main>
    </div>
  );
}

function SidebarFooter() {
  const health = useHealth();
  const ok = health.isSuccess;
  const version = health.data?.version;
  return (
    <div className="sidebar__footer">
      <div className={`sysstatus ${ok ? "sysstatus--ok" : "sysstatus--pending"}`}>
        <span className="sysstatus__dot" />
        <div className="sysstatus__body">
          <span className="sysstatus__title">
            {ok ? "All systems operational" : "Connecting…"}
          </span>
          <span className="sysstatus__meta">
            Engine {version ? `v${version}` : "—"}
          </span>
        </div>
      </div>
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
