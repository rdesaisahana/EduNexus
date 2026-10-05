import { EXAMPLE_QUESTIONS } from "@/lib/constants";
import { ROUTE_STYLES } from "@/lib/routeStyles";

interface ExampleChipsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
  align?: "center" | "start";
}

export function ExampleChips({ onSelect, disabled, align = "center" }: ExampleChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}>
      {EXAMPLE_QUESTIONS.map(({ question, route }) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="group inline-flex items-center gap-2 rounded-full text-left border border-line bg-surface/70 px-3.5 py-1.5 text-[13px] text-ink-2 transition-all duration-200 hover:-translate-y-px hover:border-ink-3/40 hover:bg-surface hover:text-ink hover:shadow-[var(--shadow-card)] disabled:pointer-events-none disabled:opacity-50"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full opacity-60 transition-opacity group-hover:opacity-100 ${ROUTE_STYLES[route].dot}`}
            title={`Routes to ${route}`}
          />
          {question}
        </button>
      ))}
    </div>
  );
}
