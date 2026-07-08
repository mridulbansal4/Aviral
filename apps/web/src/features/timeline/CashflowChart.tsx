/**
 * Cashflow chart — monthly net-savings bars with income and spend overlaid as
 * lines. Pure inline SVG (viewBox-scaled) so it stays crisp and dependency-free.
 */

import type { TimelinePoint } from "../../lib/api";
import { inr } from "../../design-system/format";

const W = 720;
const H = 260;
const PAD = { top: 20, right: 16, bottom: 28, left: 56 };

export function CashflowChart({ points }: { points: TimelinePoint[] }) {
  if (!points.length) return null;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...points.flatMap((p) => [p.income, p.total_spend]));
  const minNet = Math.min(0, ...points.map((p) => p.net_savings));
  const maxNet = Math.max(...points.map((p) => p.net_savings));
  const top = Math.max(maxVal, maxNet);
  const bottom = Math.min(0, minNet);
  const range = top - bottom || 1;

  const x = (i: number) =>
    PAD.left + (i + 0.5) * (plotW / points.length);
  const y = (v: number) => PAD.top + plotH * (1 - (v - bottom) / range);
  const barW = (plotW / points.length) * 0.5;

  const line = (key: "income" | "total_spend") =>
    points.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");

  const yZero = y(0);
  const gridVals = [top, top / 2, 0].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {/* gridlines + y labels */}
      {gridVals.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--color-border)"
            strokeDasharray="2 3"
          />
          <text x={PAD.left - 8} y={y(v) + 3} className="chart__ytick">
            {inr(v, true)}
          </text>
        </g>
      ))}

      {/* net-savings bars */}
      {points.map((p, i) => {
        const positive = p.net_savings >= 0;
        const yTop = y(Math.max(0, p.net_savings));
        const h = Math.abs(y(p.net_savings) - yZero);
        return (
          <rect
            key={p.month}
            x={x(i) - barW / 2}
            y={yTop}
            width={barW}
            height={Math.max(1, h)}
            rx={2}
            fill={positive ? "var(--color-positive)" : "var(--color-negative)"}
            opacity={0.28}
          >
            <title>
              {p.month} · net {inr(p.net_savings)}
            </title>
          </rect>
        );
      })}

      {/* income + spend lines */}
      <polyline
        points={line("income")}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
      />
      <polyline
        points={line("total_spend")}
        fill="none"
        stroke="var(--color-warning)"
        strokeWidth={2}
        strokeDasharray="4 3"
      />

      {/* x labels (every other month) */}
      {points.map((p, i) =>
        i % 2 === 0 ? (
          <text key={p.month} x={x(i)} y={H - 8} className="chart__xtick">
            {p.month.slice(2)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
