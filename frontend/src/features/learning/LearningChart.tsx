/**
 * Learning-history chart — ROC-AUC on the fixed held-out set across simulated
 * retrain rounds. Inline SVG; points appear as outcomes accumulate.
 */

import type { LearningStep } from "../../lib/api";
import { num } from "../../design-system/format";

const W = 560;
const H = 220;
const PAD = { top: 24, right: 20, bottom: 40, left: 48 };

export function LearningChart({ history }: { history: LearningStep[] }) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Fixed y-range around typical AUC so movement is legible.
  const yMin = 0.6;
  const yMax = 0.9;
  const stepsTotal = 4;

  const x = (step: number) =>
    PAD.left + (stepsTotal <= 1 ? 0 : (step / (stepsTotal - 1)) * plotW);
  const y = (v: number) =>
    PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin));

  const path = history.map((h) => `${x(h.step)},${y(h.roc_auc)}`).join(" ");
  const yTicks = [0.6, 0.7, 0.8, 0.9];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img">
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)}
            stroke="var(--color-border)" strokeDasharray="2 3" />
          <text x={PAD.left - 8} y={y(v) + 3} className="chart__ytick">
            {num(v, 2)}
          </text>
        </g>
      ))}

      {/* projected future points (faint) */}
      {Array.from({ length: stepsTotal }, (_, s) => (
        <circle key={`ghost-${s}`} cx={x(s)} cy={y(yMin)} r={0} />
      ))}

      <polyline points={path} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} />
      {history.map((h) => (
        <g key={h.step}>
          <circle cx={x(h.step)} cy={y(h.roc_auc)} r={4} fill="var(--color-accent)" />
          <text x={x(h.step)} y={y(h.roc_auc) - 10} className="chart__point">
            {num(h.roc_auc, 3)}
          </text>
          <text x={x(h.step)} y={H - 22} className="chart__xtick">
            R{h.step}
          </text>
          <text x={x(h.step)} y={H - 8} className="chart__xsub">
            {h.train_size}
          </text>
        </g>
      ))}
    </svg>
  );
}
