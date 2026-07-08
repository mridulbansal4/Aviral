/**
 * Confidence radar — a pentagon plotting the five sub-confidences. Inline SVG,
 * no chart library. Communicates the *shape* of confidence at a glance: a
 * balanced pentagon reads very differently from a spiky one.
 */

import type { ConfidenceDimension } from "../../lib/api";

const SIZE = 300;
const C = SIZE / 2;
const R = 110;
const RINGS = [0.25, 0.5, 0.75, 1];

export function ConfidenceRadar({
  dimensions,
}: {
  dimensions: ConfidenceDimension[];
}) {
  const n = dimensions.length;
  const angle = (i: number) => (-Math.PI / 2) + (i / n) * Math.PI * 2;
  const point = (i: number, r: number): [number, number] => [
    C + r * R * Math.cos(angle(i)),
    C + r * R * Math.sin(angle(i)),
  ];
  const poly = (r: number | ((i: number) => number)) =>
    dimensions
      .map((_, i) => point(i, typeof r === "function" ? r(i) : r).join(","))
      .join(" ");

  return (
    <svg
      className="radar"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {/* grid rings */}
      {RINGS.map((r) => (
        <polygon
          key={r}
          points={poly(r)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}
      {/* spokes + labels */}
      {dimensions.map((d, i) => {
        const [x, y] = point(i, 1);
        const [lx, ly] = point(i, 1.22);
        return (
          <g key={d.key}>
            <line x1={C} y1={C} x2={x} y2={y} stroke="var(--color-border)" />
            <text
              x={lx}
              y={ly}
              className="radar__label"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {d.label.replace(" Confidence", "")}
            </text>
          </g>
        );
      })}
      {/* value polygon */}
      <polygon
        points={poly((i) => dimensions[i].value)}
        fill="var(--color-accent)"
        fillOpacity={0.22}
        stroke="var(--color-accent)"
        strokeWidth={2}
      />
      {dimensions.map((d, i) => {
        const [x, y] = point(i, d.value);
        return <circle key={d.key} cx={x} cy={y} r={3} fill="var(--color-accent)" />;
      })}
    </svg>
  );
}
