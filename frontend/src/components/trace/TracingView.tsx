"use client";

import { Activity, ArrowLeft, FastForward, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AskStatus } from "@/hooks/useAsk";
import { highlightFor } from "@/lib/graph";
import type { AskResponse } from "@/lib/types";
import { HowFoundPanel } from "../answer/HowFoundPanel";
import { RouteBadge } from "../answer/RouteBadge";
import { GraphExplorer } from "../graph/GraphExplorer";
import { RouteTrace, TRACE_COMPLETE } from "./RouteTrace";
import { TraceLog } from "./TraceLog";

const STAGE_MS = 750;
/** Stage at which retrieval has happened and the graph path can be highlighted. */
const RETRIEVED_STAGE = 4;

const EMPTY_HIGHLIGHT = highlightFor(null);

function graphNote(result: AskResponse | null) {
  if (!result || !result.retrieved.length) return undefined;
  if (result.route === "GRAPH") return "Highlighted: the path used to answer this question.";
  if (result.route === "EXACT") return "Highlighted: the matched person.";
  return "This answer came from a document chunk, so no graph path is highlighted.";
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Replays one answer's pipeline from the first stage. Remount (new key) to replay. */
function TraceReplay({ result, onReplay, onBack }: { result: AskResponse; onReplay: () => void; onBack: () => void }) {
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? TRACE_COMPLETE : 0));
  const complete = stage >= TRACE_COMPLETE;

  useEffect(() => {
    if (complete) return;
    const id = setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => clearTimeout(id);
  }, [stage, complete]);

  const fullHighlight = useMemo(() => highlightFor(result), [result]);
  const highlight = stage >= RETRIEVED_STAGE ? fullHighlight : EMPTY_HIGHLIGHT;

  return (
    <>
      <header className="mb-8">
        <TracingEyebrow onBack={onBack} backLabel="Back to answer" />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <h1 className="min-w-0 max-w-3xl font-serif text-[28px] leading-tight tracking-tight text-ink sm:text-[34px]">
            {result.question}
          </h1>
          <div className="flex items-center gap-2">
            {stage >= 2 && <RouteBadge route={result.route} />}
            {complete ? (
              <button
                onClick={onReplay}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Replay trace
              </button>
            ) : (
              <button
                onClick={() => setStage(TRACE_COMPLETE)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-ink-3 transition-colors hover:bg-surface hover:text-ink"
              >
                <FastForward className="h-3.5 w-3.5" /> Skip
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <TraceLog result={result} stage={stage} />
          {complete && <HowFoundPanel result={result} />}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RouteTrace stage={stage} route={result.route} />
        </aside>
      </div>

      <GraphExplorer highlight={highlight} note={stage >= RETRIEVED_STAGE ? graphNote(result) : undefined} />
    </>
  );
}

function TracingEyebrow({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        <Activity className="h-3.5 w-3.5" /> Tracing
      </p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </button>
    </div>
  );
}

interface TracingViewProps {
  status: AskStatus;
  question: string;
  result: AskResponse | null;
  runId: number;
  onGoAsk: () => void;
}

export function TracingView({ status, question, result, runId, onGoAsk }: TracingViewProps) {
  const [replay, setReplay] = useState(0);
  const loading = status === "loading";

  return (
    <div className="animate-reveal mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      {status === "done" && result ? (
        // Keyed by answer + replay count, so each new answer (or Replay) starts from the first stage.
        <TraceReplay
          key={`${runId}-${replay}`}
          result={result}
          onReplay={() => setReplay((n) => n + 1)}
          onBack={onGoAsk}
        />
      ) : loading ? (
        <>
          <header className="mb-8">
            <TracingEyebrow onBack={onGoAsk} backLabel="Back to answer" />
            <h1 className="mt-3 max-w-3xl font-serif text-[28px] leading-tight tracking-tight text-ink sm:text-[34px]">
              {question}
            </h1>
          </header>
          <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-5 text-sm text-ink-2 shadow-[var(--shadow-card)]">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              EduNexus is answering this question — the trace will replay from the start once it finishes.
            </div>
            <aside>
              <RouteTrace stage={1} />
            </aside>
          </div>
          <GraphExplorer highlight={EMPTY_HIGHLIGHT} />
        </>
      ) : (
        <>
          <header className="mb-8">
            <TracingEyebrow onBack={onGoAsk} backLabel="Ask a question" />
            <div className="mt-3 max-w-2xl">
              <h1 className="font-serif text-[28px] leading-tight tracking-tight text-ink sm:text-[34px]">
                No question traced yet.
              </h1>
              <p className="mt-2 text-[15px] text-ink-3">
                Ask a question and this page will replay how EduNexus answered it: the route it chose, the evidence it
                retrieved and where that evidence sits in the knowledge graph.
              </p>
            </div>
          </header>
          <GraphExplorer highlight={EMPTY_HIGHLIGHT} />
        </>
      )}
    </div>
  );
}
