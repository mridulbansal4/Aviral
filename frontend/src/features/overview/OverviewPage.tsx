import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, DollarSign, Activity, Users, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { OverviewChart } from "./OverviewChart";

const pipelineData = [
  { name: 'Mon', value: 8.2 },
  { name: 'Tue', value: 9.1 },
  { name: 'Wed', value: 11.4 },
  { name: 'Thu', value: 10.8 },
  { name: 'Fri', value: 13.5 },
  { name: 'Sat', value: 14.0 },
  { name: 'Sun', value: 14.2 },
];

export function OverviewPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "tween", duration: 0.25, ease: [0.2, 0.8, 0.2, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden" 
      animate="show"
    >
      <header className="workspace__header">
        <div>
          <h1 className="workspace__title">Pipeline Overview</h1>
          <p className="workspace__subtitle">
            Your lending portfolio at a glance.
          </p>
        </div>
      </header>

      {/* Key Metrics Row */}
      <section style={{ marginBottom: "var(--space-6)" }}>
        <div className="grid grid--4">
          <motion.div variants={itemVariants} className="card" style={{ padding: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>
              <DollarSign size={16} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" }}>Total Pipeline</span>
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
              $14.2M
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card" style={{ padding: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>
              <Users size={16} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" }}>Active Applications</span>
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
              128
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card" style={{ padding: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" }}>Auto-Approval Rate</span>
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-positive)", fontFamily: "var(--font-mono)" }}>
              64%
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card" style={{ padding: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>
              <Activity size={16} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)" }}>Avg. Risk Score</span>
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
              42 <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: "normal" }}>/100</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Trend Chart */}
      <motion.section variants={itemVariants} style={{ marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
                Pipeline Growth
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Total loan value under management (in millions)
              </p>
            </div>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
              +73.1% <span style={{ fontSize: "var(--text-sm)", color: "var(--color-positive)", fontWeight: "var(--font-weight-medium)", fontFamily: "var(--font-sans)" }}>This Week</span>
            </div>
          </div>
          <div style={{ height: "240px", width: "100%" }}>
            <OverviewChart data={pipelineData} />
          </div>
        </div>
      </motion.section>

      <div className="grid grid--split">
        {/* Needs Attention Section */}
        <motion.section variants={itemVariants}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
              Needs Attention
            </h2>
            <button style={{ background: "transparent", border: "none", color: "var(--color-accent)", fontSize: "var(--text-sm)", cursor: "pointer" }}>View All</button>
          </div>
          <div className="card" style={{ padding: "0" }}>
            <div className="kv" style={{ padding: "var(--space-3)", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ color: "var(--color-negative)", marginTop: "2px" }}><AlertCircle size={18} /></div>
                <div>
                  <div style={{ color: "var(--color-text)", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--text-sm)" }}>Verify Income Documents</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginTop: "4px" }}>Applicant #8492 · $250k Commercial Loan</div>
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </div>
            <div className="kv" style={{ padding: "var(--space-3)", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ color: "var(--color-warning)", marginTop: "2px" }}><ShieldAlert size={18} /></div>
                <div>
                  <div style={{ color: "var(--color-text)", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--text-sm)" }}>Compliance Review Required</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginTop: "4px" }}>Applicant #9104 · High-Risk Pattern Detected</div>
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </div>
            <div className="kv" style={{ padding: "var(--space-3)", cursor: "pointer", borderBottom: "none" }}>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ color: "var(--color-info)", marginTop: "2px" }}><FileText size={18} /></div>
                <div>
                  <div style={{ color: "var(--color-text)", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--text-sm)" }}>Missing Signatures</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginTop: "4px" }}>Applicant #7721 · Retail Mortgage</div>
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </div>
          </div>
        </motion.section>

        {/* Recent Activity Section */}
        <motion.section variants={itemVariants}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", marginBottom: "var(--space-3)", color: "var(--color-text)" }}>
            Recent Engine Activity
          </h2>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-positive)", marginTop: "6px" }} />
                <div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    <span style={{ fontWeight: "var(--font-weight-semibold)" }}>Auto-Approved</span> Application #9928
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "4px" }}>2 mins ago</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-warning)", marginTop: "6px" }} />
                <div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    <span style={{ fontWeight: "var(--font-weight-semibold)" }}>Flagged</span> Application #9925 for Manual Review
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "4px" }}>14 mins ago</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-negative)", marginTop: "6px" }} />
                <div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                    <span style={{ fontWeight: "var(--font-weight-semibold)" }}>Rejected</span> Application #9914 (Risk Score: 92)
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "4px" }}>1 hour ago</div>
                </div>
              </div>

            </div>
            
            <button style={{ marginTop: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-accent)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", background: "transparent", border: "none", cursor: "pointer" }}>
              View Full Audit Log <ArrowRight size={16} />
            </button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
