"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { useState } from "react";
import { AskBar } from "@/components/ask/AskBar";
import { ExampleChips } from "@/components/ask/ExampleChips";
import { AnswerPending } from "@/components/ask/AnswerPending";
import { AnswerCard } from "@/components/answer/AnswerCard";
import { RouteBadge } from "@/components/answer/RouteBadge";
import { NexusMark } from "@/components/brand/NexusMark";
import { EvaluationView } from "@/components/eval/EvaluationView";
import { Footer } from "@/components/layout/Footer";
import { HowItWorksDrawer } from "@/components/layout/HowItWorksDrawer";
import { SiteHeader, type View } from "@/components/layout/SiteHeader";
import { TracingView } from "@/components/trace/TracingView";
import { useAsk } from "@/hooks/useAsk";
import { ROUTE_META } from "@/lib/constants";
import { ROUTES } from "@/lib/types";

export default function Home() {
  const [view, setView] = useState<View>("ask");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [input, setInput] = useState("");
  const { status, question, result, error, runId, ask, reset } = useAsk();

  const submit = (q: string) => {
    setInput(q);
    setView("ask");
    ask(q);
  };

  const changeView = (v: View) => {
    if (v === "ask" && view === "ask") {
      reset();
      setInput("");
    }
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loading = status === "loading";

  return (
    <>
      <SiteHeader
        view={view}
        onViewChange={changeView}
        onOpenAbout={() => setAboutOpen(true)}
        hasTrace={status === "done" && !!result}
      />

      <main className="flex flex-1 flex-col">
        {view === "evaluation" ? (
          <EvaluationView />
        ) : view === "tracing" ? (
          <TracingView
            status={status}
            question={question}
            result={result}
            runId={runId}
            onGoAsk={() => changeView("ask")}
          />
        ) : status === "idle" ? (
          /* ---------------- Empty state ---------------- */
          <section className="relative flex-1">
            <div className="paper-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden />
            <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
              <div className="animate-reveal">
                <NexusMark size={44} className="mx-auto shadow-[var(--shadow-card)] rounded-[11px]" />
                <h1 className="mt-6 font-serif text-[52px] font-medium leading-none tracking-tight text-ink sm:text-[68px]">
                  EduNexus
                </h1>
                <p className="mt-4 font-serif text-[22px] italic text-ink-2 sm:text-[26px]">
                  Your school&rsquo;s knowledge, connected.
                </p>
                <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-3">
                  Ask across students, classes, departments, policies and school operations.
                </p>
              </div>

              <div className="animate-reveal mt-10 [animation-delay:80ms]">
                <AskBar value={input} onChange={setInput} onSubmit={submit} loading={loading} />
              </div>

              <div className="animate-reveal mt-9 [animation-delay:160ms]">
                <p className="mb-3.5 text-[13px] text-ink-3">Ask across your school&rsquo;s connected knowledge — try:</p>
                <ExampleChips onSelect={submit} />
              </div>

              <div className="animate-reveal mt-16 grid gap-px overflow-hidden rounded-xl border border-line-2 bg-line-2 text-left [animation-delay:240ms] sm:grid-cols-3">
                {ROUTES.map((r) => (
                  <div key={r} className="bg-paper/90 px-4 py-4">
                    <RouteBadge route={r} size="sm" />
                    <p className="mt-2 text-[13px] leading-snug text-ink-2">{ROUTE_META[r].description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-ink-3">
                An LLM router sends every question down exactly one retrieval path.
              </p>
            </div>
          </section>
        ) : (
          /* ---------------- Question / answer ---------------- */
          <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
            <div className="space-y-5">
              <AskBar value={input} onChange={setInput} onSubmit={submit} loading={loading} size="compact" />
              <ExampleChips onSelect={submit} disabled={loading} align="start" />

              <div className="pt-2">
                {loading && <AnswerPending question={question} />}
                {status === "done" && result && (
                  <AnswerCard
                    key={`${result.question}-${result.route}`}
                    result={result}
                    onViewTrace={() => changeView("tracing")}
                  />
                )}
                {status === "error" && (
                  <div className="animate-reveal flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                    <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" strokeWidth={1.7} />
                    <div className="flex-1">
                      <p className="font-medium text-ink">EduNexus couldn&rsquo;t reach the knowledge service.</p>
                      <p className="mt-1 text-sm text-ink-3">{error}</p>
                      <button
                        onClick={() => ask(question)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-paper hover:text-ink"
                      >
                        <RotateCw className="h-3.5 w-3.5" /> Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <HowItWorksDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
