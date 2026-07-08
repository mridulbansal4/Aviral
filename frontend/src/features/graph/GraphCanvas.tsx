/**
 * Relationship graph canvas. A deterministic radial layout: the applicant sits
 * at the centre, counterparties ring around them, and peer customers sit on an
 * outer ring — evenly spaced (ordered by the hub they share) so labels never
 * clump. Labels fan outward along each node's radius to avoid collisions.
 * Inline SVG only — no external graph library.
 */

import { useMemo } from "react";

import type { GraphEdge, GraphNode } from "../../lib/api";

const W = 840;
const H = 700;
const CX = W / 2;
const CY = 340;
const R1 = 182; // counterparty ring
const R2 = 278; // peer ring

const SUBTYPE_COLOR: Record<string, string> = {
  employer: "#4c8dff",
  builder: "#b57bff",
  lender: "#e0a53b",
  hospital: "#e5484d",
  merchant: "#5b93a8",
  amc: "#2fbf71",
  utility: "#6b7280",
  landlord: "#8a94a6",
  salaried: "#e6e9ef",
  self_employed: "#e6e9ef",
};

interface Placed {
  node: GraphNode;
  x: number;
  y: number;
  r: number;
  angle: number;
}

export function GraphCanvas({
  nodes,
  edges,
  onSelectPeer,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectPeer: (id: string) => void;
}) {
  const { placed, positioned } = useMemo(() => {
    const focus = nodes.find((n) => n.is_focus);
    const counterparties = nodes
      .filter((n) => n.kind === "counterparty")
      .sort((a, b) => a.subtype.localeCompare(b.subtype));
    const peers = nodes.filter((n) => n.kind === "customer" && !n.is_focus);

    const pos = new Map<string, Placed>();
    if (focus)
      pos.set(focus.id, { node: focus, x: CX, y: CY, r: 27, angle: Math.PI / 2 });

    // Inner ring: counterparties evenly spaced, grouped by subtype.
    const angleOf = new Map<string, number>();
    counterparties.forEach((cp, i) => {
      const angle =
        (i / Math.max(1, counterparties.length)) * Math.PI * 2 - Math.PI / 2;
      angleOf.set(cp.id, angle);
      pos.set(cp.id, {
        node: cp,
        x: CX + R1 * Math.cos(angle),
        y: CY + R1 * Math.sin(angle),
        r: 13,
        angle,
      });
    });

    // Which hub each peer connects to (used only for ordering).
    const peerHub = new Map<string, string>();
    for (const e of edges) {
      const s = nodes.find((n) => n.id === e.source);
      if (s && s.kind === "customer" && !s.is_focus) peerHub.set(e.source, e.target);
    }

    // Outer ring: peers ordered by their hub's angle, then spread EVENLY around
    // the full circle so names never cluster. The +0.5 phase keeps them off the
    // inner spokes.
    const ordered = [...peers].sort(
      (a, b) =>
        (angleOf.get(peerHub.get(a.id) ?? "") ?? 0) -
        (angleOf.get(peerHub.get(b.id) ?? "") ?? 0),
    );
    const n = Math.max(1, ordered.length);
    ordered.forEach((peer, i) => {
      const angle = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
      pos.set(peer.id, {
        node: peer,
        x: CX + R2 * Math.cos(angle),
        y: CY + R2 * Math.sin(angle),
        r: 9,
        angle,
      });
    });

    return { placed: [...pos.values()], positioned: pos };
  }, [nodes, edges]);

  const truncate = (s: string, n = 16) =>
    s.length > n ? s.slice(0, n - 1) + "…" : s;

  return (
    <svg
      className="graph-canvas"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {/* edges */}
      {edges.map((e, i) => {
        const a = positioned.get(e.source);
        const b = positioned.get(e.target);
        if (!a || !b) return null;
        const fromFocus = a.node.is_focus || b.node.is_focus;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={fromFocus ? "var(--color-border-strong)" : "var(--color-border)"}
            strokeWidth={fromFocus ? 1.4 : 1}
            opacity={fromFocus ? 0.85 : 0.4}
          />
        );
      })}

      {/* nodes + outward-fanned labels */}
      {placed.map((p) => {
        const color = SUBTYPE_COLOR[p.node.subtype] ?? "var(--color-text-muted)";
        const isPeer = p.node.kind === "customer" && !p.node.is_focus;

        if (p.node.is_focus) {
          return (
            <g key={p.node.id} className="graph-node">
              <circle cx={p.x} cy={p.y} r={p.r + 6} fill="none" stroke={color} opacity={0.25} />
              <circle cx={p.x} cy={p.y} r={p.r} fill="var(--color-accent)" stroke={color} strokeWidth={2.5} />
              <text x={p.x} y={p.y + p.r + 16} className="graph-label graph-label--focus" textAnchor="middle">
                {p.node.label}
              </text>
            </g>
          );
        }

        // Label placed radially outward; anchor flips by side to avoid overlap.
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);
        const lx = p.x + cos * (p.r + 8);
        const ly = p.y + sin * (p.r + 8);
        const anchor = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";

        return (
          <g
            key={p.node.id}
            className={isPeer ? "graph-node graph-node--peer" : "graph-node"}
            onClick={() => isPeer && onSelectPeer(p.node.id)}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={isPeer ? "var(--color-surface)" : "var(--color-surface-raised)"}
              stroke={color}
              strokeWidth={1.5}
            />
            <text
              x={lx}
              y={ly}
              className={isPeer ? "graph-label graph-label--peer" : "graph-label"}
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {truncate(p.node.label)}
            </text>
            <title>
              {p.node.label} · {p.node.subtype.replace("_", " ")}
            </title>
          </g>
        );
      })}
    </svg>
  );
}
