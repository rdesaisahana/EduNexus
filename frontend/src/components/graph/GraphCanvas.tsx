"use client";

import { Crosshair, Maximize2, Minimize2, Minus, Plus, Scan } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphHighlight, NodeLabel } from "@/lib/graph";
import { NODE_RADIUS, type GraphLayout, type PositionedNode, type PositionedRelationship } from "./layout";

export const LABEL_COLORS: Record<NodeLabel, { fill: string; stroke: string; text: string }> = {
  Student: { fill: "#e3e5ea", stroke: "#8d94a3", text: "#474d5a" },
  Teacher: { fill: "#dde1f2", stroke: "var(--graph)", text: "var(--graph)" },
  Class: { fill: "#d5e8e1", stroke: "var(--vector)", text: "var(--vector)" },
  Subject: { fill: "#f0e1cb", stroke: "var(--exact)", text: "var(--exact)" },
  Department: { fill: "#d3dded", stroke: "var(--accent)", text: "var(--accent)" },
};

const MIN_K = 0.3;
const MAX_K = 4;
const clamp = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

interface Transform {
  k: number;
  x: number;
  y: number;
}

interface GraphCanvasProps {
  layout: GraphLayout;
  highlight: GraphHighlight;
  expanded: boolean;
  onToggleExpand: () => void;
}

/** Geometry for a (possibly bent) relationship, trimmed to the node circles. */
function edgeGeometry(r: PositionedRelationship, s: PositionedNode, t: PositionedNode) {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (s.x + t.x) / 2 + (-dy / len) * r.bend * 2;
  const cy = (s.y + t.y) / 2 + (dx / len) * r.bend * 2;

  const unit = (ax: number, ay: number, bx: number, by: number) => {
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [(bx - ax) / l, (by - ay) / l];
  };
  const [ux1, uy1] = unit(s.x, s.y, cx, cy);
  const [ux2, uy2] = unit(cx, cy, t.x, t.y);
  const rs = NODE_RADIUS[s.label] + 1;
  const rt = NODE_RADIUS[t.label] + 4;
  const sx = s.x + ux1 * rs;
  const sy = s.y + uy1 * rs;
  const ex = t.x - ux2 * rt;
  const ey = t.y - uy2 * rt;

  return {
    d: `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`,
    mx: 0.25 * sx + 0.5 * cx + 0.25 * ex,
    my: 0.25 * sy + 0.5 * cy + 0.25 * ey,
  };
}

/** Transform that fits all nodes (or just `ids`) into a w×h viewport. */
function fitTransform(layout: GraphLayout, w: number, h: number, ids?: Set<string>): Transform | null {
  if (!w || !h) return null;
  const pts = layout.nodes.filter((n) => !ids || ids.has(n.id));
  if (!pts.length) return null;
  const pad = ids ? 90 : 36;
  const xs = pts.map((n) => n.x);
  const ys = pts.map((n) => n.y);
  const x0 = Math.min(...xs) - pad;
  const x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  const k = clamp(Math.min(w / (x1 - x0), h / (y1 - y0), ids ? 2.2 : 1.6));
  return { k, x: w / 2 - ((x0 + x1) / 2) * k, y: h / 2 - ((y0 + y1) / 2) * k };
}

export function GraphCanvas({ layout, highlight, expanded, onToggleExpand }: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [t, setT] = useState<Transform>({ k: 1, x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean; node: string | null } | null>(null);

  const hasHighlight = highlight.nodes.size > 0;

  /* ---------- sizing & fitting ---------- */

  // Fit the whole graph on first paint and whenever the canvas is resized (e.g. expand/collapse).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setSize({ w, h });
      const fit = fitTransform(layout, w, h);
      if (fit) setT(fit);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);

  const fitTo = useCallback(
    (ids?: Set<string>) => {
      const fit = fitTransform(layout, size.w, size.h, ids);
      if (fit) setT(fit);
    },
    [layout, size],
  );

  /* ---------- zoom & pan ---------- */

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setT((prev) => {
      const k = clamp(prev.k * factor);
      const r = k / prev.k;
      return { k, x: px - (px - prev.x) * r, y: py - (py - prev.y) * r };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - rect.left, e.clientY - rect.top);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Read the node before capturing: capture retargets later events to the <svg>.
    const node = (e.target as Element).closest("[data-node]")?.getAttribute("data-node") ?? null;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y, moved: false, node };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setT((prev) => ({ ...prev, x: d.tx + dx, y: d.ty + dy }));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    // A click (not a drag): select the node under the pointer, or clear.
    if (d && !d.moved) setSelected((cur) => (d.node && d.node !== cur ? d.node : null));
  };

  /* ---------- focus (hover / selection) ---------- */

  const focusId = hovered ?? selected;
  const neighbors = useMemo(() => {
    if (!focusId) return null;
    const set = new Set([focusId]);
    layout.relationships.forEach((r) => {
      if (r.source === focusId) set.add(r.target);
      if (r.target === focusId) set.add(r.source);
    });
    return set;
  }, [focusId, layout]);

  const nodeActive = (id: string) =>
    neighbors ? neighbors.has(id) : hasHighlight ? highlight.nodes.has(id) : true;
  const relActive = (r: PositionedRelationship) =>
    neighbors
      ? r.source === focusId || r.target === focusId
      : hasHighlight
        ? highlight.relationships.has(r.key)
        : true;

  const fontSize = 11 / Math.sqrt(t.k);
  const showStudentNames = t.k >= 1.25;
  const showRelLabels = t.k >= 1.7;

  const selectedNode = selected ? layout.byId.get(selected) : null;
  const selectedRels = selected
    ? layout.relationships.filter((r) => r.source === selected || r.target === selected)
    : [];

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="img"
        aria-label="Neo4j knowledge graph"
      >
        <defs>
          {(["muted", "active", "path"] as const).map((v) => (
            <marker
              key={v}
              id={`arrow-${v}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M0,1 L9,5 L0,9 z"
                fill={v === "path" ? "var(--accent)" : v === "active" ? "#8a90a0" : "#c9ccd4"}
              />
            </marker>
          ))}
        </defs>

        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          {/* relationships */}
          {layout.relationships.map((r) => {
            const s = layout.byId.get(r.source);
            const tg = layout.byId.get(r.target);
            if (!s || !tg) return null;
            const g = edgeGeometry(r, s, tg);
            const onPath = highlight.relationships.has(r.key);
            const active = relActive(r);
            const variant = onPath ? "path" : active && (neighbors || !hasHighlight) ? "active" : "muted";
            const showLabel = (showRelLabels && active) || (onPath && !neighbors) || (neighbors && active);
            return (
              <g key={r.key} className="transition-opacity duration-300" opacity={active ? 1 : 0.3}>
                <path
                  d={g.d}
                  fill="none"
                  stroke={onPath ? "var(--accent)" : variant === "active" ? "#a3a8b5" : "#d3d6dc"}
                  strokeWidth={(onPath ? 2 : 1) / Math.sqrt(t.k)}
                  markerEnd={`url(#arrow-${variant})`}
                />
                {showLabel && (
                  <text
                    x={g.mx}
                    y={g.my}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={fontSize * 0.78}
                    className="pointer-events-none font-mono"
                    fill={onPath ? "var(--accent)" : "#6b7180"}
                    stroke="var(--surface-2)"
                    strokeWidth={3 / Math.sqrt(t.k)}
                    paintOrder="stroke"
                  >
                    {r.type}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {layout.nodes.map((n) => {
            const c = LABEL_COLORS[n.label];
            const r = NODE_RADIUS[n.label];
            const active = nodeActive(n.id);
            const onPath = highlight.nodes.has(n.id);
            const isFocus = n.id === focusId;
            const showName = n.label !== "Student" || showStudentNames || onPath || (neighbors?.has(n.id) ?? false);
            return (
              <g
                key={n.id}
                data-node={n.id}
                transform={`translate(${n.x},${n.y})`}
                className="cursor-pointer transition-opacity duration-300"
                opacity={active ? 1 : 0.4}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
              >
                {(onPath || isFocus) && (
                  <circle r={r + 5} fill="none" stroke={onPath ? "var(--accent)" : c.stroke} strokeOpacity={0.35} strokeWidth={3} />
                )}
                <circle r={r} fill={c.fill} stroke={c.stroke} strokeWidth={onPath || isFocus ? 2 : 1.2} />
                {showName && (
                  <text
                    y={r + fontSize * 1.05}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={onPath || isFocus ? 600 : n.label === "Student" ? 400 : 500}
                    fill={onPath ? "var(--ink)" : c.text}
                    stroke="var(--surface-2)"
                    strokeWidth={3.5 / Math.sqrt(t.k)}
                    paintOrder="stroke"
                    className="pointer-events-none"
                  >
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* controls */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)]">
        {[
          { icon: Plus, label: "Zoom in", on: () => zoomAt(1.3, size.w / 2, size.h / 2) },
          { icon: Minus, label: "Zoom out", on: () => zoomAt(1 / 1.3, size.w / 2, size.h / 2) },
          { icon: Scan, label: "Fit graph", on: () => fitTo() },
          ...(hasHighlight ? [{ icon: Crosshair, label: "Focus on answer path", on: () => fitTo(highlight.nodes) }] : []),
          { icon: expanded ? Minimize2 : Maximize2, label: expanded ? "Exit full screen" : "Expand", on: onToggleExpand },
        ].map(({ icon: Icon, label, on }) => (
          <button
            key={label}
            onClick={on}
            title={label}
            aria-label={label}
            className="flex h-8 w-8 items-center justify-center border-b border-line-2 text-ink-2 transition-colors last:border-b-0 hover:bg-paper hover:text-ink"
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-surface/80 px-2 py-1 font-mono text-[10.5px] text-ink-3">
        {Math.round(t.k * 100)}%
      </div>

      {/* selected node details */}
      {selectedNode && (
        <div className="animate-fade absolute bottom-3 left-3 max-h-[60%] w-64 overflow-y-auto rounded-xl border border-line bg-surface/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: LABEL_COLORS[selectedNode.label].text }}>
            {selectedNode.label}
          </p>
          <p className="mt-0.5 font-medium text-ink">{selectedNode.name}</p>
          <ul className="mt-3 space-y-1.5 text-[12px]">
            {selectedRels.map((r) => {
              const out = r.source === selectedNode.id;
              const other = layout.byId.get(out ? r.target : r.source)!;
              return (
                <li key={r.key} className="flex items-center gap-1.5 text-ink-2">
                  <span className="font-mono text-[10.5px] text-ink-3">
                    {out ? `−${r.type}→` : `←${r.type}−`}
                  </span>
                  <span className="truncate">{other.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
