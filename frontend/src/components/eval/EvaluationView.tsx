import { ChevronRight } from "lucide-react";
import { FAILURE_SOURCES, PHILOSOPHY } from "@/lib/evaluation";
import { EvalTimeline, StageMap } from "./EvalTimeline";

export function EvaluationView() {
  return (
    <div className="animate-reveal mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">System quality</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink sm:text-[44px]">
          Evaluated, not just spot-checked.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          The full evaluation, in the order it was run: each component measured on its own labelled questions,
          diagnosed when it failed, re-measured after every fix, and finally validated on questions never used
          during tuning.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-line-2 bg-surface-2 p-5 sm:p-6">
        <StageMap />
      </div>

      <div className="mt-12">
        <EvalTimeline />
      </div>

      <section className="mt-12 grid gap-8 rounded-2xl border border-line-2 bg-surface-2 p-6 sm:p-8 md:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Method</h3>
          <ol className="mt-4 flex flex-wrap items-center gap-y-2 text-sm text-ink">
            {PHILOSOPHY.map((step, i) => (
              <li key={step} className="flex items-center">
                <span className="rounded-full border border-line bg-surface px-3 py-1">{step}</span>
                {i < PHILOSOPHY.length - 1 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-ink-3" />}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Where RAG failures came from
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {FAILURE_SOURCES.map((s) => (
              <span key={s} className="rounded-md border border-line bg-surface px-2.5 py-1 text-[13px] text-ink-2">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
            Each fix targeted the stage that actually failed, rather than blindly rewriting prompts.
          </p>
        </div>
      </section>
    </div>
  );
}
