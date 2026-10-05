import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { KGNode, KGRelationship, NodeLabel, SchoolGraph } from "@/lib/graph";

export const NODE_RADIUS: Record<NodeLabel, number> = {
  Department: 17,
  Teacher: 12.5,
  Class: 12.5,
  Subject: 10,
  Student: 7,
};

export type PositionedNode = KGNode & { x: number; y: number };

export interface PositionedRelationship extends KGRelationship {
  key: string;
  /** Perpendicular offset for parallel relationships (e.g. BELONGS_TO + HEADS). */
  bend: number;
}

export interface GraphLayout {
  nodes: PositionedNode[];
  byId: Map<string, PositionedNode>;
  relationships: PositionedRelationship[];
}

type SimNode = KGNode & SimulationNodeDatum;

/** Deterministic force layout (d3 seeds positions with a fixed phyllotaxis pattern). */
export function computeLayout(graph: SchoolGraph): GraphLayout {
  const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
  const simLinks: SimulationLinkDatum<SimNode>[] = graph.relationships.map((r) => ({ ...r }));

  forceSimulation(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .id((d) => d.id)
        .distance((l) => ((l as unknown as KGRelationship).type === "ENROLLED_IN" ? 62 : 78))
        .strength(0.55),
    )
    .force("charge", forceManyBody<SimNode>().strength((d) => (d.label === "Student" ? -160 : -460)))
    .force("collide", forceCollide<SimNode>((d) => NODE_RADIUS[d.label] + (d.label === "Student" ? 20 : 14)).strength(0.9))
    .force("x", forceX(0).strength(0.05))
    .force("y", forceY(0).strength(0.07))
    .stop()
    .tick(420);

  const nodes = simNodes.map((n) => ({ id: n.id, name: n.name, label: n.label, x: n.x ?? 0, y: n.y ?? 0 }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Spread relationships that join the same pair of nodes.
  const pairCount = new Map<string, number>();
  const pairIndex = new Map<string, number>();
  const pair = (r: KGRelationship) => [r.source, r.target].sort().join("~");
  graph.relationships.forEach((r) => pairCount.set(pair(r), (pairCount.get(pair(r)) ?? 0) + 1));

  const relationships = graph.relationships.map((r) => {
    const p = pair(r);
    const i = pairIndex.get(p) ?? 0;
    pairIndex.set(p, i + 1);
    const n = pairCount.get(p)!;
    return { ...r, key: `${r.source}|${r.type}|${r.target}`, bend: (i - (n - 1) / 2) * 26 };
  });

  return { nodes, byId, relationships };
}
