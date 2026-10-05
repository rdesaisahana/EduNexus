import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { ROUTE_META } from "@/lib/constants";
import { ROUTE_STYLES } from "@/lib/routeStyles";
import { isExactRecord, isVectorRecord, type AskResponse } from "@/lib/types";
import { RouteBadge } from "../answer/RouteBadge";
import { TRACE_STAGES } from "./RouteTrace";

/** Route-aware generation instructions, paraphrased from generate_answer() in the notebook. */
const GENERATION_INSTRUCTIONS = {
  GRAPH: "Treat the returned fields as facts retrieved for this question and answer directly.",
  VECTOR:
    "Answer only what was asked, with the minimum information needed. Include conditions or exceptions only when they directly affect the answer.",
  EXACT: "Use the lookup result to identify whether the person is a student or a teacher.",
};

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-0.5 text-[12.5px] text-ink-2">
      {children}
    </span>
  );
}

function retrievalDetail(r: AskResponse): ReactNode {
  if (r.route === "GRAPH") {
    return r.trace?.cypher ? (
      <>
        <p>Text-to-Cypher turned the question into a read-only query:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-line-2 bg-surface-2 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-ink-2">
          {r.trace.cypher}
        </pre>
      </>
    ) : (
      <p>Text-to-Cypher did not produce a usable query.</p>
    );
  }
  if (r.route === "VECTOR") {
    return (
      <p>
        Question embedded with <span className="font-mono text-[11.5px]">all-MiniLM-L6-v2</span> (384 dimensions), then
        compared against the <span className="font-mono text-[11.5px]">school_chunks</span> vector index by cosine
        similarity (top 3).
      </p>
    );
  }
  return (
    <p>
      Extracted the name <span className="font-medium text-ink">“{r.trace?.extractedName ?? r.question}”</span> and
      searched the <span className="font-mono text-[11.5px]">school_names</span> full-text index.
    </p>
  );
}

function evidenceDetail(r: AskResponse): ReactNode {
  if (!r.retrieved.length) return <p>No matching evidence was returned.</p>;

  if (r.route === "VECTOR") {
    const docs = r.retrieved.filter(isVectorRecord).sort((a, b) => b.score - a.score);
    return (
      <div className="flex flex-wrap gap-1.5">
        {docs.map((d, i) => (
          <Chip key={d.title + i}>
            <span className="font-mono text-[10.5px] text-ink-3">#{i + 1}</span>
            {d.title}
            <span className="font-mono text-[10.5px] text-ink-3">{d.score.toFixed(2)}</span>
          </Chip>
        ))}
      </div>
    );
  }
  if (r.route === "EXACT") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {r.retrieved.filter(isExactRecord).map((p) => (
          <Chip key={p.name}>
            {p.name}
            <span className="text-[11px] text-ink-3">{p.type.join(", ")}</span>
            <span className="font-mono text-[10.5px] text-ink-3">{p.score.toFixed(2)}</span>
          </Chip>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {r.retrieved.slice(0, 8).flatMap((row, i) =>
        Object.entries(row).map(([k, v]) => (
          <Chip key={`${i}-${k}`}>
            <span className="font-mono text-[10.5px] text-ink-3">{k}</span>
            {String(v)}
          </Chip>
        )),
      )}
      {r.retrieved.length > 8 && <Chip>+{r.retrieved.length - 8} more</Chip>}
    </div>
  );
}

function stepContent(i: number, r: AskResponse): { summary: ReactNode; detail?: ReactNode } {
  const hasEvidence = r.retrieved.length > 0;
  switch (i) {
    case 0:
      return { summary: "Question received", detail: <p className="font-serif text-[16px] text-ink">“{r.question}”</p> };
    case 1:
      return {
        summary: (
          <span className="inline-flex items-center gap-2">
            Routed to <RouteBadge route={r.route} size="sm" />
          </span>
        ),
        detail: <p>{ROUTE_META[r.route].description}</p>,
      };
    case 2:
      return { summary: ROUTE_META[r.route].method, detail: retrievalDetail(r) };
    case 3: {
      const n = r.retrieved.length;
      return {
        summary: hasEvidence ? `Neo4j returned ${n} ${n === 1 ? "result" : "results"}` : "Neo4j returned nothing",
        detail: evidenceDetail(r),
      };
    }
    case 4:
      return hasEvidence
        ? { summary: `Generated with ${r.route} instructions`, detail: <p>{GENERATION_INSTRUCTIONS[r.route]}</p> }
        : { summary: "Generation skipped", detail: <p>With no evidence, EduNexus does not generate an answer.</p> };
    default:
      return {
        summary: hasEvidence ? "Grounded answer" : "No answer",
        detail: <p className={`font-serif text-[17px] leading-snug ${hasEvidence ? "text-ink" : "text-ink-2"}`}>{r.answer}</p>,
      };
  }
}

/** The pipeline as a step-by-step log, revealed in sync with the system trace. */
export function TraceLog({ result, stage }: { result: AskResponse; stage: number }) {
  const routeColor = ROUTE_STYLES[result.route];

  return (
    <ol className="rounded-2xl border border-line bg-surface px-5 py-5 shadow-[var(--shadow-card)] sm:px-7 sm:py-6">
      {TRACE_STAGES.map((label, i) => {
        const done = stage > i;
        const active = stage === i;
        const { summary, detail } = stepContent(i, result);
        return (
          <li key={label} className="relative flex gap-4 pb-5 last:pb-0">
            {i < TRACE_STAGES.length - 1 && (
              <span
                className={`absolute left-[11px] top-7 h-[calc(100%-22px)] w-px transition-colors duration-500 ${done ? (i === 1 || i === 2 ? routeColor.line : "bg-ink-3/40") : "bg-line"}`}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10.5px] transition-all duration-300 ${
                done
                  ? "border-accent bg-accent text-white"
                  : active
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-line bg-surface text-ink-3/70"
              }`}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${done || active ? "text-ink-3" : "text-ink-3/50"}`}>
                  {label}
                </p>
                {active && <span className="animate-pulse-soft text-[11px] text-accent">Running…</span>}
              </div>
              {done && (
                <div className="animate-reveal mt-1">
                  <p className="text-[14px] font-medium text-ink">{summary}</p>
                  {detail && <div className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{detail}</div>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
