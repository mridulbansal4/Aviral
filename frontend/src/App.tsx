import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import "./App.css";
import { NAV_ITEMS } from "./app/navigation";
import { useCapabilities, useHealth } from "./lib/queries";
import { Toaster } from "sonner";
import { CommandMenu } from "./app/CommandMenu";

import {
  LayoutDashboard,
  Users,
  History,
  Network,
  Sparkles,
  ShieldCheck,
  Scale,
  BrainCircuit,
} from "lucide-react";

/** Line icons per screen — keeps the sidebar reading as a real console. */
function NavIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    overview: <LayoutDashboard size={16} />,
    applicants: <Users size={16} />,
    timeline: <History size={16} />,
    graph: <Network size={16} />,
    patterns: <Sparkles size={16} />,
    confidence: <ShieldCheck size={16} />,
    governance: <Scale size={16} />,
    learning: <BrainCircuit size={16} />,
  };
  return (
    <div className="nav__icon" aria-hidden="true">
      {icons[id]}
    </div>
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
    <>
      <Toaster theme="dark" position="bottom-right" className="enterprise-toaster" />
      <CommandMenu />
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
          </div>
        </div>

        <nav className="nav">
          <div className="nav__section">
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
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ width: "100%" }}
          >
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
          </motion.div>
        </AnimatePresence>
      </main>
      </div>
    </>
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
