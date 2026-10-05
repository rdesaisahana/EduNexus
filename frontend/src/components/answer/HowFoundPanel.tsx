import { CircleSlash, Route as RouteIcon } from "lucide-react";
import { ROUTE_META } from "@/lib/constants";
import type { AskResponse } from "@/lib/types";
import { ExactEvidence } from "./ExactEvidence";
import { GraphEvidence } from "./GraphEvidence";
import { TechnicalDetails } from "./TechnicalDetails";
import { VectorEvidence } from "./VectorEvidence";

const EVIDENCE = { GRAPH: GraphEvidence, VECTOR: VectorEvidence, EXACT: ExactEvidence };

/** Route-specific evidence for one answer, plus collapsed technical details. */
export function HowFoundPanel({ result }: { result: AskResponse }) {
  const Evidence = EVIDENCE[result.route];
  const hasEvidence = result.retrieved.length > 0;

  return (
    <section className="animate-reveal overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <header className="flex items-center gap-2.5 border-b border-line-2 px-6 py-4 sm:px-8">
        <RouteIcon className="h-4 w-4 text-ink-3" />
        <h3 className="flex-1 text-[15px] font-medium text-ink">How this answer was found</h3>
        <span className="text-xs text-ink-3">{ROUTE_META[result.route].store}</span>
      </header>

      <div className="px-6 py-6 sm:px-8">
        {hasEvidence ? (
          <Evidence result={result} />
        ) : (
          <p className="flex items-start gap-2.5 text-sm text-ink-3">
            <CircleSlash className="mt-0.5 h-4 w-4 shrink-0" />
            The {result.route} route retrieved no evidence, so no answer was generated.
          </p>
        )}
      </div>

      <div className="border-t border-line-2 bg-surface-2/60 px-6 py-1 sm:px-8">
        <TechnicalDetails result={result} />
      </div>
    </section>
  );
}
