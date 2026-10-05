import { BookOpenText } from "lucide-react";
import { NexusMark } from "../brand/NexusMark";

export type View = "ask" | "tracing" | "evaluation";

interface SiteHeaderProps {
  view: View;
  onViewChange: (view: View) => void;
  onOpenAbout: () => void;
  /** Shows a dot on the Tracing tab when a trace is ready to inspect. */
  hasTrace: boolean;
}

export function SiteHeader({ view, onViewChange, onOpenAbout, hasTrace }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line-2 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button onClick={() => onViewChange("ask")} className="flex items-center gap-2.5" aria-label="EduNexus home">
          <NexusMark size={28} />
          <span className="hidden font-serif text-[21px] font-medium tracking-tight text-ink min-[420px]:inline">EduNexus</span>
        </button>
        <span className="hidden h-4 w-px bg-line md:block" />
        <span className="hidden text-[13px] text-ink-3 md:block">Internal knowledge assistant for school staff</span>

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          <div className="flex rounded-lg border border-line bg-surface p-0.5" role="tablist">
            {(
              [
                ["ask", "Ask"],
                ["tracing", "Tracing"],
                ["evaluation", "Evaluation"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => onViewChange(key)}
                className={`relative rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 sm:px-3 ${
                  view === key ? "bg-ink text-white shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                {label}
                {key === "tracing" && hasTrace && view !== "tracing" && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
          >
            <BookOpenText className="h-4 w-4" strokeWidth={1.8} />
            <span className="hidden sm:inline">How EduNexus works</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
