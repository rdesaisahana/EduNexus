import { ArrowRight, CircleSlash, ShieldCheck } from "lucide-react";
import { ROUTE_META } from "@/lib/constants";
import { isVectorRecord, type AskResponse } from "@/lib/types";
import { RouteBadge } from "./RouteBadge";

export function groundingLabel(result: AskResponse) {
  const n = result.retrieved.length;
  switch (result.route) {
    case "GRAPH":
      return `Grounded in ${n} knowledge-graph ${n === 1 ? "result" : "results"}`;
    case "VECTOR": {
      const top = result.retrieved.filter(isVectorRecord).sort((a, b) => b.score - a.score)[0];
      return top ? `Grounded in ${top.title}` : "Grounded in school documents";
    }
    case "EXACT":
      return "Grounded in a directory name match";
  }
}

interface AnswerCardProps {
  result: AskResponse;
  onViewTrace: () => void;
}

/** The Ask tab's result: just the answer, with a way through to the trace. */
export function AnswerCard({ result, onViewTrace }: AnswerCardProps) {
  const hasEvidence = result.retrieved.length > 0;

  return (
    <article className="animate-reveal overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Question</p>
            <p className="mt-1.5 text-[15px] text-ink-2">{result.question}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Route</span>
            <RouteBadge route={result.route} />
          </div>
        </div>

        <div className="mt-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Answer</p>
          {hasEvidence ? (
            <p className="mt-2 font-serif text-[22px] leading-[1.45] text-ink sm:text-[25px]">{result.answer}</p>
          ) : (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4">
              <CircleSlash className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" strokeWidth={1.7} />
              <div>
                <p className="font-serif text-xl leading-snug text-ink">{result.answer}</p>
                <p className="mt-1.5 text-sm text-ink-3">
                  No matching evidence was retrieved, so EduNexus did not generate an answer. Try naming a
                  student, teacher, class or school policy.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 bg-surface-2/60 px-6 py-3.5 sm:px-8">
        {hasEvidence ? (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-3">
            <ShieldCheck className="h-4 w-4 text-vector" strokeWidth={1.8} />
            {groundingLabel(result)}
            <span className="text-line">·</span>
            {ROUTE_META[result.route].method}
          </p>
        ) : (
          <p className="text-[13px] text-ink-3">No evidence retrieved</p>
        )}
        <button
          onClick={onViewTrace}
          className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft"
        >
          See how this was found
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}
