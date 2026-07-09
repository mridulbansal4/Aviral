import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

// Strict Zod schema for enterprise compliance
const declineSchema = z.object({
  reasonCode: z.enum(["DTI_HIGH", "SCORE_LOW", "INCOME_UNVERIFIED", "FRAUD_RISK", "POLICY_VIOLATION"], {
    errorMap: () => ({ message: "A valid decline reason code is required for compliance." })
  }),
  internalNotes: z.string().min(10, "Internal notes must be at least 10 characters detailing the adverse action."),
  complianceOverride: z.boolean().default(false),
});

type DeclineFormValues = z.infer<typeof declineSchema>;

export function DecisionForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  applicantId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: DeclineFormValues) => void;
  applicantId: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<DeclineFormValues>({
    resolver: zodResolver(declineSchema)
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            background: "var(--color-surface-solid)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            width: "480px",
            maxWidth: "90vw",
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", margin: 0, color: "var(--color-text)" }}>Decline Application</h2>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>ID: {applicantId}</div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "8px", background: "rgba(231, 76, 60, 0.1)", color: "var(--color-negative)", padding: "12px", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "var(--text-sm)", alignItems: "flex-start" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>Adverse Action Notice: Declining this application triggers a mandatory FCRA notification to the applicant.</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Primary Reason Code</label>
              <select 
                {...register("reasonCode")}
                style={{ width: "100%", padding: "10px 12px", background: "var(--color-surface)", border: `1px solid ${errors.reasonCode ? 'var(--color-negative)' : 'var(--color-border)'}`, borderRadius: "var(--radius-sm)", color: "var(--color-text)", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)" }}
              >
                <option value="">Select a reason code...</option>
                <option value="DTI_HIGH">DTI_HIGH (Debt-to-Income exceeds policy)</option>
                <option value="SCORE_LOW">SCORE_LOW (Credit score below threshold)</option>
                <option value="INCOME_UNVERIFIED">INCOME_UNVERIFIED (Failed income verification)</option>
                <option value="FRAUD_RISK">FRAUD_RISK (Velocity or identity signals)</option>
                <option value="POLICY_VIOLATION">POLICY_VIOLATION (Restricted industry/watchlist)</option>
              </select>
              {errors.reasonCode && <span style={{ color: "var(--color-negative)", fontSize: "var(--text-xs)", marginTop: "4px", display: "block" }}>{errors.reasonCode.message}</span>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Compliance Notes</label>
              <textarea 
                {...register("internalNotes")}
                placeholder="Enter detailed rationale for decline..."
                rows={4}
                style={{ width: "100%", padding: "10px 12px", background: "var(--color-surface)", border: `1px solid ${errors.internalNotes ? 'var(--color-negative)' : 'var(--color-border)'}`, borderRadius: "var(--radius-sm)", color: "var(--color-text)", fontSize: "var(--text-sm)", resize: "none" }}
              />
              {errors.internalNotes && <span style={{ color: "var(--color-negative)", fontSize: "var(--text-xs)", marginTop: "4px", display: "block" }}>{errors.internalNotes.message}</span>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: "8px 16px", background: "var(--color-negative)", color: "var(--color-on-accent)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", cursor: "pointer" }}>
                Confirm Decline
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
