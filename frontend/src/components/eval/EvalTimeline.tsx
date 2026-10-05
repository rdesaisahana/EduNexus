import { ArrowRight, Check, CornerDownRight, FlaskConical, Info, TriangleAlert } from "lucide-react";
import { Fragment } from "react";
import {
  EVAL_STAGES,
  formatMetric,
  HELD_OUT_CAPTION,
  PHASES,
  type CaseOutcome,
  type EvalCase,
  type EvalStage,
  type StageKind,
  type StageMetric,
} from "@/lib/evaluation";

export const KIND_STYLES: Record<StageKind, { dot: string; tag: string; label: string }> = {
  pass: { dot: "border-vector text-vector bg-surface", tag: "bg-vector-bg text-vector", label: "Passed" },
  improvement: { dot: "border-accent text-accent bg-surface", tag: "bg-accent-soft text-accent", label: "Improved" },
  regression: { dot: "border-exact text-exact bg-exact-bg", tag: "bg-exact-bg text-exact", label: "Regression · learning step" },
  validation: { dot: "border-vector bg-vector text-white", tag: "bg-vector-bg text-vector", label: "Validation" },
};

const pad = (n: number) => String(n).padStart(2, "0");

function Metric({ m, large }: { m: StageMetric; large?: boolean }) {
  const pts = m.before !== undefined ? Math.round((m.value - m.before) * 1000) / 10 : null;
  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        {m.before !== undefined && (
          <>
            <span className="font-serif text-xl tabular-nums text-ink-3">{formatMetric(m.before, m.format)}</span>
            <span className="text-ink-3">→</span>
          </>
        )}
        <span className={`font-serif tabular-nums text-ink ${large ? "text-[44px] leading-none" : "text-3xl"}`}>
          {formatMetric(m.value, m.format)}
        </span>
        {pts !== null && (
          <span
            className={`rounded-md px-1.5 py-px font-mono text-[11px] tabular-nums ${pts >= 0 ? "bg-vector-bg text-vector" : "bg-exact-bg text-exact"}`}
          >
            {pts >= 0 ? "+" : "−"}
            {Math.abs(pts)} pts
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">{m.label}</p>
    </div>
  );
}

const OUTCOME_STYLES: Record<CaseOutcome, { label: string; tag: string; icon: typeof Check; iconColor: string }> = {
  fixed: { label: "Resolved", tag: "bg-vector-bg text-vector", icon: Check, iconColor: "text-vector" },
  carried: { label: "Carried forward", tag: "bg-accent-soft text-accent", icon: ArrowRight, iconColor: "text-accent" },
  regressed: { label: "New failure", tag: "bg-exact-bg text-exact", icon: ArrowRight, iconColor: "text-exact" },
};

/** One failing query: the issue, then a one-line resolution. */
function CaseRow({ c }: { c: EvalCase }) {
  const o = OUTCOME_STYLES[c.outcome];
  const Icon = o.icon;
  return (
    <li className="rounded-xl border border-line-2 bg-surface-2/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="font-serif text-[15px] italic text-ink">“{c.query}”</p>
        <span className={`shrink-0 rounded-md px-1.5 py-px text-[11px] font-medium ${o.tag}`}>{o.label}</span>
      </div>
      <p className="mt-1.5 flex gap-2 text-[13px] leading-snug text-ink-3">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-exact/80" />
        {c.issue}
      </p>
      <p className="mt-1 flex gap-2 text-[13px] leading-snug text-ink-2">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${o.iconColor}`} strokeWidth={2.5} />
        <span>
          <span className="font-medium text-ink">Resolution: </span>
          {c.resolution}
        </span>
      </p>
    </li>
  );
}

function StageCard({ stage, index, last }: { stage: EvalStage; index: number; last: boolean }) {
  const k = KIND_STYLES[stage.kind];
  const final = stage.id === "held-out";

  return (
    <li id={`stage-${stage.id}`} className="relative scroll-mt-28 pb-6 pl-12 sm:pl-14">
      {!last && <span className="absolute left-[15px] top-9 h-full w-px bg-line sm:left-[17px]" aria-hidden />}
      <span
        className={`absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold sm:h-9 sm:w-9 ${k.dot}`}
      >
        {pad(index + 1)}
      </span>

      <article
        className={`rounded-2xl border bg-surface p-5 sm:p-6 ${final ? "border-vector-line shadow-[var(--shadow-lift)]" : "border-line shadow-[var(--shadow-card)]"}`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {final && <FlaskConical className="h-4 w-4 text-vector" />}
          <h4 className={`font-medium text-ink ${final ? "font-serif text-xl" : ""}`}>{stage.title}</h4>
          <span className={`rounded-md px-1.5 py-px text-[11px] font-medium ${k.tag}`}>{k.label}</span>
          <span className="text-xs text-ink-3">{stage.area}</span>
          <span className="ml-auto text-[11px] text-ink-3">n = {stage.questions}</span>
        </div>
        <p className="mt-2 text-[14px] text-ink-2">{stage.question}</p>

        <div className={`mt-5 flex flex-wrap gap-x-10 gap-y-4 ${final ? "rounded-xl border border-line-2 bg-surface-2 px-5 py-5" : ""}`}>
          {stage.metrics.map((m) => (
            <Metric key={m.label} m={m} large={final} />
          ))}
        </div>

        {stage.cases && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Failed queries and resolutions
            </p>
            <ul className="space-y-2.5">
              {stage.cases.map((c) => (
                <CaseRow key={c.query} c={c} />
              ))}
            </ul>
          </div>
        )}

        {stage.fixes && (
          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              {stage.kind === "regression" ? "Change tried" : "Changes made"}
            </p>
            <ul className="space-y-1.5">
              {stage.fixes.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-ink-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vector" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage.note && (
          <p
            className={`mt-5 flex gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-2 ${stage.kind === "regression" ? "border border-exact-line/70 bg-exact-bg/50" : "bg-surface-2"}`}
          >
            <CornerDownRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${stage.kind === "regression" ? "text-exact" : "text-ink-3"}`} />
            {stage.note}
          </p>
        )}

        {final && (
          <p className="mt-5 flex items-start gap-2 border-t border-line-2 pt-4 text-[13px] text-ink-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {HELD_OUT_CAPTION} Small, synthetic evaluation sets demonstrate the method; they do not imply universal
              accuracy.
            </span>
          </p>
        )}
      </article>
    </li>
  );
}

/** Horizontal overview of every stage in order; each item jumps to its card. */
export function StageMap() {
  return (
    <nav aria-label="Evaluation stages">
      <ol className="flex flex-wrap items-start gap-x-6 gap-y-4">
        {PHASES.map((phase) => (
          <li key={phase.name}>
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">{phase.name}</p>
            <ol className="flex flex-wrap items-center gap-y-1.5">
              {EVAL_STAGES.filter((s) => s.phase === phase.name).map((s, i) => {
                const index = EVAL_STAGES.indexOf(s);
                return (
                  <Fragment key={s.id}>
                    {i > 0 && <span className="h-px w-3 bg-line" />}
                    <li>
                      <a
                        href={`#stage-${s.id}`}
                        className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] text-ink-2 transition-colors hover:border-ink-3/40 hover:text-ink"
                      >
                        <span className={`font-mono text-[10px] ${KIND_STYLES[s.kind].tag} rounded px-1`}>
                          {pad(index + 1)}
                        </span>
                        {s.short}
                      </a>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EvalTimeline() {
  return (
    <div className="space-y-10">
      {PHASES.map((phase) => {
        const stages = EVAL_STAGES.filter((s) => s.phase === phase.name);
        return (
          <section key={phase.name}>
            <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-serif text-2xl text-ink">{phase.name}</h3>
              <p className="text-[13px] text-ink-3">{phase.description}</p>
            </header>
            <ol>
              {stages.map((s, i) => (
                <StageCard key={s.id} stage={s} index={EVAL_STAGES.indexOf(s)} last={i === stages.length - 1} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
