/**
 * Relationship graph canvas. A deterministic radial hub-and-spoke layout: the
 * applicant sits at the centre, counterparties ring around them, and peer
 * customers cluster near the employer/builder hubs they share. Rendered as
 * inline SVG — no external graph library — so it stays self-contained and crisp.
 */

import { useMemo } from "react";

import type { GraphEdge, GraphNode } from "../../lib/api";

const W = 760;
const H = 520;
const CX = W / 2;
const CY = H / 2;
const R1 = 158; // counterparty ring
const R2 = 236; // peer ring

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
    if (focus) pos.set(focus.id, { node: focus, x: CX, y: CY, r: 26 });

    const angleOf = new Map<string, number>();
    counterparties.forEach((cp, i) => {
      const angle = (i / Math.max(1, counterparties.length)) * Math.PI * 2 - Math.PI / 2;
      angleOf.set(cp.id, angle);
      pos.set(cp.id, {
        node: cp,
        x: CX + R1 * Math.cos(angle),
        y: CY + R1 * Math.sin(angle),
        r: 13,
      });
    });

    // Peers cluster near the hub they connect to.
    const peerHub = new Map<string, string>();
    for (const e of edges) {
      const s = nodes.find((n) => n.id === e.source);
      if (s && s.kind === "customer" && !s.is_focus) peerHub.set(e.source, e.target);
    }
    const hubPeerIndex = new Map<string, number>();
    peers.forEach((p) => {
      const hub = peerHub.get(p.id);
      const base = hub ? (angleOf.get(hub) ?? 0) : Math.random() * Math.PI * 2;
      const k = hubPeerIndex.get(hub ?? "") ?? 0;
      hubPeerIndex.set(hub ?? "", k + 1);
      const angle = base + (k - 1.5) * 0.16;
      pos.set(p.id, {
        node: p,
        x: CX + R2 * Math.cos(angle),
        y: CY + R2 * Math.sin(angle),
        r: 9,
      });
    });

    return { placed: [...pos.values()], positioned: pos };
  }, [nodes, edges]);

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
            strokeWidth={fromFocus ? 1.5 : 1}
            opacity={fromFocus ? 0.9 : 0.5}
          />
        );
      })}

      {/* nodes */}
      {placed.map((p) => {
        const color = SUBTYPE_COLOR[p.node.subtype] ?? "var(--color-text-muted)";
        const isPeer = p.node.kind === "customer" && !p.node.is_focus;
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
              fill={p.node.is_focus ? "var(--color-accent)" : "var(--color-surface-raised)"}
              stroke={color}
              strokeWidth={p.node.is_focus ? 2.5 : 1.5}
            />
            {p.node.is_focus && (
              <circle cx={p.x} cy={p.y} r={p.r + 6} fill="none" stroke={color} opacity={0.3} />
            )}
            <text
              x={p.x}
              y={p.y + p.r + 12}
              className="graph-label"
              textAnchor="middle"
            >
              {p.node.label.length > 14 ? p.node.label.slice(0, 13) + "…" : p.node.label}
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
