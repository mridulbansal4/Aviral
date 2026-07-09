import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import type { ShapEvidence } from "../../lib/api";
import { num, titleCase } from "../../design-system/format";
import { Tooltip as UITooltip } from "../../design-system/Tooltip";

export function ShapChart({
  evidence,
  limit = 8,
}: {
  evidence: ShapEvidence[];
  limit?: number;
}) {
  const shown = evidence.slice(0, limit);

  return (
    <div style={{ width: "100%", height: 350, marginTop: "var(--space-2)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={shown}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
        >
          <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
          <YAxis 
            type="category" 
            dataKey="feature" 
            axisLine={false} 
            tickLine={false} 
            width={140}
            tickFormatter={(val) => titleCase(val)}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-raised)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ShapEvidence;
                return (
                  <div style={{ background: "var(--color-surface-solid)", padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>{titleCase(data.feature)}</div>
                    <div style={{ color: "var(--color-text-secondary)", fontSize: "12px", marginBottom: "8px" }}>{data.provenance}</div>
                    <div style={{ color: data.contribution >= 0 ? "var(--color-positive)" : "var(--color-negative)", fontWeight: "bold" }}>
                      {data.contribution >= 0 ? "+" : "−"}{num(Math.abs(data.contribution), 2)} log-odds
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="var(--color-border-strong)" />
          <Bar dataKey="contribution" barSize={8} radius={[4, 4, 4, 4]}>
            {shown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? "var(--color-positive)" : "var(--color-negative)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-text-secondary)" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-negative)" }} /> Lowers propensity
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-positive)" }} /> Raises propensity
          </span>
        </div>
        
        <UITooltip content="SHAP values represent the exact marginal contribution of a feature to the model's log-odds output. Hover over bars to trace exact data provenance.">
          <span style={{ cursor: "help", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "4px" }}>What is this?</span>
        </UITooltip>
      </div>
    </div>
  );
}
