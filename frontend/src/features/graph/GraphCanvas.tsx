import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { GraphEdge, GraphNode } from "../../lib/api";
import { Tooltip } from "../../design-system/Tooltip";

const SUBTYPE_COLOR: Record<string, string> = {
  employer:      "#3b82f6",
  builder:       "#a855f7",
  lender:        "#f59e0b",
  hospital:      "#ef4444",
  merchant:      "#06b6d4",
  amc:           "#22c55e",
  utility:       "#6b7280",
  landlord:      "#a1a1aa",
  salaried:      "#e4e4e7",
  self_employed: "#e4e4e7",
};

// Sharp Enterprise Node - radial layout, Palantir Foundry style
function EnterpriseNode({ data }: { data: any }) {
  const color = SUBTYPE_COLOR[data.subtype] ?? "#52525b";
  const isFocus = data.is_focus;
  const isPeer = data.kind === "customer" && !isFocus;

  return (
    <Tooltip content={`${data.label} · ${data.subtype.replace(/_/g, " ")}`}>
      <div style={{
        background: isFocus ? "#0f1729" : "#0d0d0d",
        border: isFocus ? `1px solid #3b82f6` : `1px solid rgba(255,255,255,0.08)`,
        borderLeft: isFocus ? `3px solid #3b82f6` : `3px solid ${color}`,
        borderRadius: "3px",
        padding: "6px 10px",
        minWidth: "100px",
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
        cursor: isPeer ? "pointer" : "default",
        boxSizing: "border-box",
      }}>
        <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

        {/* Entity type badge */}
        <div style={{
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: isFocus ? "#60a5fa" : color,
          marginBottom: "3px",
          fontWeight: 700,
        }}>
          {data.subtype.replace(/_/g, " ")}
        </div>

        {/* Label */}
        <div style={{
          fontSize: "11px",
          fontWeight: isFocus ? 700 : 500,
          color: isFocus ? "#e2e8f0" : "#a1a1aa",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}>
          {data.label.length > 18 ? data.label.slice(0, 17) + "…" : data.label}
        </div>
      </div>
    </Tooltip>
  );
}

const nodeTypes = { enterprise: EnterpriseNode };

export function GraphCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onSelectPeer,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectPeer: (id: string) => void;
}) {
  const { rfNodes, rfEdges } = useMemo(() => {
    const focus         = initialNodes.find((n) => n.is_focus);
    const counterparties= initialNodes.filter((n) => n.kind === "counterparty");
    const peers         = initialNodes.filter((n) => n.kind === "customer" && !n.is_focus);

    const cx = 400, cy = 300;
    const mappedNodes: Node[] = [];

    if (focus) {
      mappedNodes.push({ id: focus.id, type: "enterprise", position: { x: cx - 55, y: cy - 20 }, data: focus });
    }

    const r1 = 190;
    counterparties.forEach((cp, i) => {
      const angle = (i / Math.max(1, counterparties.length)) * Math.PI * 2 - Math.PI / 2;
      mappedNodes.push({
        id: cp.id, type: "enterprise",
        position: { x: cx + r1 * Math.cos(angle) - 55, y: cy + r1 * Math.sin(angle) - 20 },
        data: cp,
      });
    });

    const r2 = 340;
    peers.forEach((peer, i) => {
      const angle = (i / Math.max(1, peers.length)) * Math.PI * 2 - Math.PI / 2;
      mappedNodes.push({
        id: peer.id, type: "enterprise",
        position: { x: cx + r2 * Math.cos(angle) - 55, y: cy + r2 * Math.sin(angle) - 20 },
        data: peer,
      });
    });

    const mappedEdges: Edge[] = initialEdges.map((e, i) => {
      const fromFocus =
        initialNodes.find((n) => n.id === e.source)?.is_focus ||
        initialNodes.find((n) => n.id === e.target)?.is_focus;
      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        type: "straight",
        animated: fromFocus,
        style: {
          stroke: fromFocus ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.06)",
          strokeWidth: fromFocus ? 1.5 : 1,
          strokeDasharray: fromFocus ? undefined : "4 4",
        },
      };
    });

    return { rfNodes: mappedNodes, rfEdges: mappedEdges };
  }, [initialNodes, initialEdges]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.data.kind === "customer" && !node.data.is_focus) {
      onSelectPeer(node.id as string);
    }
  }, [onSelectPeer]);

  return (
    <div style={{
      width: "100%", height: "600px",
      background: "#050505",
      borderRadius: "var(--radius-md)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <style>{`
        .react-flow__node { background: transparent !important; border: none !important; padding: 0 !important; border-radius: 0 !important; }
        .react-flow__attribution { display: none; }
        .react-flow__controls { background: #111 !important; border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 3px !important; box-shadow: none !important; }
        .react-flow__controls-button { background: #111 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .react-flow__controls-button:hover { background: #1a1a1a !important; }
        .react-flow__controls-button svg { fill: #52525b !important; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.025)" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
