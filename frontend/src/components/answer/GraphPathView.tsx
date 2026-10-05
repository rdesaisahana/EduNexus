import { ArrowDown, ArrowUp, BookOpen, Building2, ChevronLeft, ChevronRight, Library, User, UserRound } from "lucide-react";
import { Fragment } from "react";
import type { GraphPath, GraphPathNode, GraphPathRelationship } from "@/lib/types";

const LABEL_ICONS: Record<string, typeof User> = {
  Student: User,
  Teacher: UserRound,
  Class: BookOpen,
  Subject: Library,
  Department: Building2,
};

function NodeChip({ node, isResult }: { node: GraphPathNode; isResult: boolean }) {
  const Icon = LABEL_ICONS[node.label] ?? User;
  const unresolved = node.name === node.label;
  return (
    <div
      className={`inline-flex min-w-0 shrink-0 flex-col rounded-xl border px-3.5 py-2 transition-colors ${
        isResult
          ? "border-graph-line bg-graph-bg ring-4 ring-graph/[0.07]"
          : unresolved
            ? "border-dashed border-line bg-surface"
            : "border-line bg-surface"
      }`}
    >
      <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${isResult ? "text-graph" : "text-ink-3"}`}>
        <Icon className="h-3 w-3" strokeWidth={2} />
        {node.label}
      </span>
      <span className={`mt-0.5 whitespace-nowrap text-[15px] ${unresolved ? "italic text-ink-3" : "font-medium text-ink"}`}>
        {unresolved ? "any" : node.name}
      </span>
    </div>
  );
}

function Connector({ rel }: { rel: GraphPathRelationship }) {
  const forward = rel.direction === "forward";
  return (
    <>
      {/* narrow: vertical, like  ↓ BELONGS_TO */}
      <div className="flex items-center gap-2 py-1.5 pl-5 @lg:hidden">
        {forward ? <ArrowDown className="h-3.5 w-3.5 text-graph" /> : <ArrowUp className="h-3.5 w-3.5 text-graph" />}
        <span className="font-mono text-[11px] font-medium tracking-wide text-graph">{rel.type}</span>
      </div>
      {/* wide: horizontal */}
      <div className="hidden min-w-[92px] flex-1 flex-col items-center px-1 @lg:flex">
        <span className="mb-1 font-mono text-[10px] font-medium tracking-wide text-graph">{rel.type}</span>
        <div className="relative flex w-full items-center">
          {!forward && <ChevronLeft className="-mr-1.5 h-3.5 w-3.5 shrink-0 text-graph" strokeWidth={2.5} />}
          <div className="h-px flex-1 bg-graph/50" />
          {forward && <ChevronRight className="-ml-1.5 h-3.5 w-3.5 shrink-0 text-graph" strokeWidth={2.5} />}
        </div>
      </div>
    </>
  );
}

export function GraphPathView({ path, resultValues }: { path: GraphPath; resultValues: Set<string> }) {
  return (
    <div className="@container">
      <div className="flex flex-col items-start @lg:flex-row @lg:items-center">
        {path.nodes.map((n, i) => (
          <Fragment key={`${n.name}-${i}`}>
            <NodeChip node={n} isResult={resultValues.has(n.name)} />
            {path.relationships[i] && <Connector rel={path.relationships[i]} />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
