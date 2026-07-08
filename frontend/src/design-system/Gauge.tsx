/**
 * Radial propensity gauge. A 270° arc with a value track, rendered as inline
 * SVG so it stays crisp and themeable. Colour follows the propensity band tone.
 */

const TONE_COLOR: Record<string, string> = {
  positive: "var(--color-positive)",
  warning: "var(--color-warning)",
  muted: "var(--color-text-muted)",
};

export function Gauge({
  value,
  tone = "positive",
  label,
  size = 148,
}: {
  value: number; // 0–1
  tone?: string;
  label?: string;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const start = 135; // degrees
  const sweep = 270;
  const circumference = (2 * Math.PI * r * sweep) / 360;
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));
  const color = TONE_COLOR[tone] ?? "var(--color-accent)";

  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x0, y0] = polar(start);
  const [x1, y1] = polar(start + sweep);
  const arc = (x0e: number, y0e: number, x1e: number, y1e: number) =>
    `M ${x0e} ${y0e} A ${r} ${r} 0 1 1 ${x1e} ${y1e}`;

  return (
    <div className="gauge" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={arc(x0, y0, x1, y1)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={arc(x0, y0, x1, y1)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
        />
      </svg>
      <div className="gauge__center">
        <div className="gauge__value tabular" style={{ color }}>
          {Math.round(value * 100)}
          <span className="gauge__pct">%</span>
        </div>
        {label && <div className="gauge__label">{label}</div>}
      </div>
    </div>
  );
}
