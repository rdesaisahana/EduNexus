/** Quiet placeholder shown on the Ask page while an answer is being generated. */
export function AnswerPending({ question }: { question: string }) {
  return (
    <div
      className="animate-reveal rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Question</p>
      <p className="mt-1.5 text-[15px] text-ink-2">{question}</p>
      <p className="mt-7 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        Answer
        <span className="animate-pulse-soft font-normal normal-case tracking-normal text-accent">Finding answer…</span>
      </p>
      <div className="mt-3 space-y-2.5">
        <div className="h-4 w-[92%] animate-pulse-soft rounded bg-line-2" />
        <div className="h-4 w-[70%] animate-pulse-soft rounded bg-line-2 [animation-delay:150ms]" />
      </div>
    </div>
  );
}
