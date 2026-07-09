import { motion } from "framer-motion";
import { ArrowLeft, Check, X, Flag, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import "../offer/offer.css";
import { Gauge } from "../../design-system/Gauge";
import { StatusBadge } from "../../design-system/StatusBadge";
import { inr, pct, titleCase } from "../../design-system/format";
import { useConsent, useDecision } from "../../lib/queries";
import { OfferPanel } from "../offer/OfferPanel";
import { RulesPanel } from "./RulesPanel";
import { ShapChart } from "./ShapChart";
import { DecisionForm } from "./DecisionForm";
import { useState } from "react";

function ConsentChip({ customerId }: { customerId: string }) {
  const { data } = useConsent(customerId);
  if (!data) return null;
  return (
    <span className={`consent-chip consent-chip--${data.status}`} title={data.purpose}>
      <span className="consent-chip__dot" />
      AA consent {data.status}
    </span>
  );
}

export function Applicant360({
  customerId,
  onBack,
}: {
  customerId: string;
  onBack: () => void;
}) {
  const { data: d, isLoading, isError } = useDecision(customerId);
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  if (isLoading) return <div className="empty">Computing decision…</div>;
  if (isError || !d)
    return <div className="empty">Could not load this applicant.</div>;

  const predictedConvert = d.propensity >= 0.5;
  const agrees = predictedConvert === d.ground_truth.converted;

  const handleAction = (action: string) => {
    toast.success(`Applicant ${action}`, {
      description: `Decision logged for ${d.customer_id}`
    });
    onBack();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="a360"
      style={{ paddingBottom: "100px" }} // Space for floating action bar
    >
      {/* 1. DECISION TOP-BAR */}
      <header className="a360__header" style={{ position: "sticky", top: 0, background: "var(--color-canvas)", zIndex: 40, borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <div>
          <button className="a360__back" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", marginBottom: "var(--space-2)" }}>
            <ArrowLeft size={14} /> Back to queue
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <h1 className="workspace__title" style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{d.name}</h1>
            <span className={`pill pill--${d.band.tone}`}>{d.band.label}</span>
          </div>
          <p className="workspace__subtitle" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
            ID: {d.customer_id} · Model: {d.model_version}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>System Recommendation</div>
          <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: predictedConvert ? "var(--color-positive)" : "var(--color-negative)" }}>
            {predictedConvert ? "APPROVE" : "DECLINE"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Confidence <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{pct(d.model_confidence)}</span>
          </div>
        </div>
      </header>

      {/* 2. EVIDENCE PANELS */}
      <div className="section-title" style={{ fontSize: "var(--text-sm)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>Primary Evidence</div>
      
      <div className="grid grid--split" style={{ marginBottom: "var(--space-4)" }}>
        {/* Core Financials */}
        <div style={{ border: "1px solid var(--color-border)", padding: "var(--space-4)", background: "var(--color-surface-solid)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ marginBottom: "var(--space-4)" }}>
             <div className="stat__label">Verified Monthly Income</div>
             <div className="stat__value tabular" style={{ fontSize: "var(--text-2xl)" }}>{inr(d.verified_monthly_income)}</div>
             <div className="stat__hint">Robust median of salary credits</div>
          </div>
          <div className="kv">
            <span className="kv__key">Recommended Product</span>
            <span className="kv__val">{titleCase(d.recommended_product)}</span>
          </div>
          <div className="kv">
            <span className="kv__key">Rule Score</span>
            <span className="kv__val">{pct(d.rule_score)}</span>
          </div>
          <div className="kv" style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
            <span className="kv__key">Ground Truth (Prototype)</span>
            <span className="kv__val">{d.ground_truth.converted ? "Converted" : "Did not convert"}</span>
          </div>
        </div>

        {/* Predictive Factors (SHAP) */}
        <div style={{ border: "1px solid var(--color-border)", padding: "var(--space-4)", background: "var(--color-surface-solid)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-weight-semibold)" }}>Predictive Factors</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Gradient-boosted SHAP exact</span>
          </div>
          <ShapChart evidence={d.evidence} />
        </div>
      </div>

      <div className="grid grid--split">
        {/* Policy Rules */}
        <div style={{ border: "1px solid var(--color-border)", padding: "var(--space-4)", background: "var(--color-surface-solid)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ marginBottom: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-weight-semibold)" }}>Deterministic Policy</span>
          </div>
          <RulesPanel rules={d.rules} />
        </div>

        {/* Orchestrated Offer */}
        <div style={{ border: "1px solid var(--color-border)", padding: "var(--space-4)", background: "var(--color-surface-solid)", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--font-weight-semibold)" }}>Orchestrated Offer</span>
            <ConsentChip customerId={customerId} />
          </div>
          <OfferPanel customerId={customerId} />
        </div>
      </div>

      {/* 3. ACTION (FLOATING BAR) */}
      <div style={{
        position: "fixed",
        bottom: "var(--space-4)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--color-surface-overlay)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-2)",
        display: "flex",
        gap: "var(--space-2)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 100
      }}>
        <button 
          onClick={() => setShowDeclineForm(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-negative)", border: "none", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", cursor: "pointer" }}
        >
          <X size={16} /> Decline
        </button>
        <button 
          onClick={() => handleAction("Flagged for Review")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--color-warning)", border: "none", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", cursor: "pointer" }}
        >
          <Flag size={16} /> Investigate
        </button>
        <div style={{ width: "1px", background: "var(--color-border)", margin: "0 4px" }} />
        <button 
          onClick={() => handleAction("Approved")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 24px", borderRadius: "var(--radius-sm)", background: "var(--color-text)", color: "var(--color-on-accent)", border: "none", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", cursor: "pointer" }}
        >
          <Check size={16} /> Authorize Line
        </button>
      </div>

      <DecisionForm 
        isOpen={showDeclineForm} 
        onClose={() => setShowDeclineForm(false)} 
        applicantId={d.customer_id}
        onSubmit={(data) => {
          setShowDeclineForm(false);
          toast.success("Application Declined", {
            description: `Logged FCRA code ${data.reasonCode} for ${d.customer_id}`
          });
          onBack();
        }}
      />
    </motion.div>
  );
}
