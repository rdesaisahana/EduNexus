"use client";

import { useMemo, useState } from "react";
import { pathFromCypher } from "@/lib/cypher";
import type { AskResponse, GraphPath } from "@/lib/types";
import { GraphPathView } from "./GraphPathView";
import { MethodRow, SubHeading } from "./MethodRow";

const MAX_PATHS = 3;

export function GraphEvidence({ result }: { result: AskResponse }) {
  const [showAll, setShowAll] = useState(false);

  const resultValues = useMemo(
    () => new Set(result.retrieved.flatMap((r) => Object.values(r).map(String))),
    [result.retrieved],
  );

  const { paths, derived } = useMemo(() => {
    if (result.trace?.paths?.length) return { paths: result.trace.paths, derived: false };
    const p = result.trace?.cypher ? pathFromCypher(result.trace.cypher) : null;
    return { paths: p ? [p] : ([] as GraphPath[]), derived: true };
  }, [result.trace]);

  const visible = showAll ? paths : paths.slice(0, MAX_PATHS);

  return (
    <div className="space-y-7">
      <MethodRow
        items={[
          ["Retrieval method", "Graph traversal"],
          ["Query generation", result.trace?.method ?? "Text-to-Cypher"],
          ["Source", "Neo4j knowledge graph"],
        ]}
      />

      {paths.length > 0 && (
        <div>
          <SubHeading aside={paths.length > 1 ? `${paths.length} paths` : undefined}>
            {derived ? "Query pattern" : "Path through the knowledge graph"}
          </SubHeading>
          <div className="space-y-3 rounded-xl border border-line-2 bg-surface-2 p-4 sm:p-5">
            {visible.map((p, i) => (
              <div key={i} className={i > 0 ? "border-t border-line-2 pt-3" : ""}>
                <GraphPathView path={p} resultValues={resultValues} />
              </div>
            ))}
            {paths.length > MAX_PATHS && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="text-xs font-medium text-graph hover:underline"
              >
                {showAll ? "Show fewer" : `Show ${paths.length - MAX_PATHS} more`}
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <SubHeading aside={`${result.retrieved.length} ${result.retrieved.length === 1 ? "row" : "rows"}`}>
          Returned by Neo4j
        </SubHeading>
        <div className="flex flex-wrap gap-2">
          {result.retrieved.map((row, i) =>
            Object.entries(row).map(([key, value]) => (
              <span
                key={`${i}-${key}`}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm"
              >
                <span className="font-mono text-[11px] text-ink-3">{key}</span>
                <span className="text-ink">{String(value)}</span>
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
