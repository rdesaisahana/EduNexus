"use client";

import { Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getGraph } from "@/lib/api";
import type { GraphHighlight, NodeLabel, SchoolGraph } from "@/lib/graph";
import { GraphCanvas, LABEL_COLORS } from "./GraphCanvas";
import { computeLayout } from "./layout";

const LEGEND: NodeLabel[] = ["Student", "Teacher", "Class", "Subject", "Department"];

function Legend({ graph }: { graph: SchoolGraph }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
      {LEGEND.map((l) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border"
            style={{ background: LABEL_COLORS[l].fill, borderColor: LABEL_COLORS[l].stroke }}
          />
          {l}
          <span className="text-ink-3">{graph.nodes.filter((n) => n.label === l).length}</span>
        </span>
      ))}
    </div>
  );
}

interface GraphExplorerProps {
  highlight: GraphHighlight;
  /** Short note under the title, e.g. why nothing is highlighted. */
  note?: string;
}

export function GraphExplorer({ highlight, note }: GraphExplorerProps) {
  const [graph, setGraph] = useState<SchoolGraph | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    getGraph().then((g) => alive && setGraph(g));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const layout = useMemo(() => (graph ? computeLayout(graph) : null), [graph]);

  const header = graph && (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line-2 px-5 py-4 sm:px-6">
      <div>
        <h3 className="flex items-center gap-2 font-medium text-ink">
          <Share2 className="h-4 w-4 text-ink-3" strokeWidth={1.8} />
          Neo4j knowledge graph
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-3">
          {graph.nodes.length} nodes · {graph.relationships.length} relationships ·{" "}
          {note ?? "Scroll to zoom, drag to pan, click a node to inspect it."}
        </p>
      </div>
      <Legend graph={graph} />
    </div>
  );

  const canvas = (isExpanded: boolean) =>
    layout && (
      <GraphCanvas
        layout={layout}
        highlight={highlight}
        expanded={isExpanded}
        onToggleExpand={() => setExpanded((e) => !e)}
      />
    );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        {header}
        <div className="h-[460px] bg-surface-2 sm:h-[540px]">
          {layout ? canvas(false) : <div className="h-full animate-pulse-soft bg-line-2/50" />}
        </div>
      </section>

      {expanded &&
        createPortal(
        <div className="animate-fade fixed inset-0 z-50 flex bg-ink/25 p-3 backdrop-blur-[1px] sm:p-6" onClick={() => setExpanded(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Neo4j knowledge graph"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-lift)]"
          >
            {header}
            <div className="flex-1 bg-surface-2">{canvas(true)}</div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
