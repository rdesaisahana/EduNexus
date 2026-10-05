import { ROUTE_META } from "@/lib/constants";
import { ROUTE_STYLES } from "@/lib/routeStyles";
import { ROUTES, type Route } from "@/lib/types";

/**
 * Pipeline stages, in order. The trace is driven by a single stage index:
 *   -1 idle · 0..5 that stage is in progress · 6 complete
 */
export const TRACE_STAGES = [
  "Question",
  "LLM router",
  "Retrieval route",
  "Neo4j · retrieved evidence",
  "Route-aware generation",
  "Grounded answer",
] as const;

export const TRACE_COMPLETE = TRACE_STAGES.length;

interface RouteTraceProps {
  stage: number;
  /** Known once routing has finished; omitted while the pipeline is still running. */
  route?: Route;
}

type NodeState = "pending" | "active" | "done";

const SUBLABEL: Record<Route, string> = { GRAPH: "Cypher", VECTOR: "Embedding", EXACT: "Full-text" };

function Pill({ label, state }: { label: string; state: NodeState }) {
  const styles = {
    pending: "border-line bg-surface text-ink-3/70",
    active: "border-accent/30 bg-accent-soft text-accent shadow-[0_0_0_4px_rgba(36,64,107,0.06)]",
    done: "border-line bg-surface text-ink",
  }[state];
  return (
    <div className="flex justify-center">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300 ${styles}`}
      >
        {state === "active" && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />}
        {state === "done" && <span className="h-1.5 w-1.5 rounded-full bg-ink-3/60" />}
        {state === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-line" />}
        {label}
      </span>
    </div>
  );
}

function Stem({ lit, className = "" }: { lit: boolean; className?: string }) {
  return (
    <div className={`mx-auto h-4 w-px transition-colors duration-500 ${lit ? "bg-ink-3/60" : "bg-line"} ${className}`} />
  );
}

/** Horizontal fork joining the centre stem to the three route tiles. */
function Fork({ route, lit, flip = false }: { route?: Route; lit: boolean; flip?: boolean }) {
  const idx = route ? ROUTES.indexOf(route) : -1;
  const activeColor = route ? ROUTE_STYLES[route].line : "";
  const centers = [16.667, 50, 83.333];
  const segLeft = idx >= 0 ? Math.min(50, centers[idx]) : 0;
  const segWidth = idx >= 0 ? Math.abs(centers[idx] - 50) : 0;
  const show = lit && idx >= 0;

  return (
    <div className={`relative h-3 ${flip ? "-scale-y-100" : ""}`}>
      <div className={`absolute left-1/2 top-0 h-1.5 w-px transition-colors duration-500 ${show ? activeColor : lit ? "bg-ink-3/60" : "bg-line"}`} />
      <div className="absolute top-1.5 h-px bg-line" style={{ left: "16.667%", right: "16.667%" }} />
      {show && (
        <div className={`absolute top-1.5 h-px ${activeColor}`} style={{ left: `${segLeft}%`, width: `${segWidth}%` }} />
      )}
      {centers.map((c, i) => (
        <div
          key={c}
          className={`absolute top-1.5 h-1.5 w-px ${show && i === idx ? activeColor : "bg-line"}`}
          style={{ left: `${c}%` }}
        />
      ))}
    </div>
  );
}

export function RouteTrace({ stage, route }: RouteTraceProps) {
  const state = (i: number): NodeState => (stage > i ? "done" : stage === i ? "active" : "pending");
  const complete = stage >= TRACE_COMPLETE;
  const routeShown = route && stage >= 2;

  const statusText = complete
    ? "Complete"
    : stage < 0
      ? "Waiting for a question"
      : `Step ${Math.min(stage + 1, TRACE_STAGES.length)} of ${TRACE_STAGES.length}`;

  return (
    <section aria-label="System trace" className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <header className="mb-5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">System trace</h3>
        <span className={`text-[11px] tabular-nums ${complete ? "text-vector" : "text-ink-3"}`}>{statusText}</span>
      </header>

      <div className="flex flex-col">
        <Pill label={TRACE_STAGES[0]} state={state(0)} />
        <Stem lit={stage >= 1} />
        <Pill label={TRACE_STAGES[1]} state={state(1)} />
        <Stem lit={stage >= 2} className="h-2" />
        <Fork route={routeShown ? route : undefined} lit={stage >= 2} />

        <div className="grid grid-cols-3 gap-1.5">
          {ROUTES.map((r) => {
            const s = ROUTE_STYLES[r];
            const Icon = s.icon;
            const active = routeShown && r === route;
            const dimmed = routeShown && r !== route;
            const deciding = stage === 1 || (stage >= 2 && !route);
            return (
              <div
                key={r}
                className={`flex flex-col items-center rounded-lg border px-1 py-2 transition-all duration-500 ${
                  active
                    ? `${s.bg} ${s.border} ${s.text} ring-4 ${s.ring} ${stage === 2 ? "scale-[1.04]" : ""}`
                    : dimmed
                      ? "border-line-2 text-ink-3 opacity-40"
                      : `border-line text-ink-3 ${deciding ? "animate-pulse-soft" : ""}`
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                <span className="mt-1 text-[10.5px] font-semibold tracking-[0.08em]">{r}</span>
                <span className={`text-[10px] ${active ? "opacity-80" : "text-ink-3"}`}>{SUBLABEL[r]}</span>
              </div>
            );
          })}
        </div>

        <Fork route={routeShown ? route : undefined} lit={stage >= 3} flip />
        <Stem lit={stage >= 3} className="h-2" />
        <Pill label={TRACE_STAGES[3]} state={state(3)} />
        <Stem lit={stage >= 4} />
        <Pill label={TRACE_STAGES[4]} state={state(4)} />
        <Stem lit={stage >= 5} />
        <Pill label={TRACE_STAGES[5]} state={state(5)} />
      </div>

      <p className="mt-5 border-t border-line-2 pt-4 text-[12.5px] leading-relaxed text-ink-3">
        {routeShown ? (
          <>
            <span className={`font-medium ${ROUTE_STYLES[route].text}`}>{route}</span> — {ROUTE_META[route].description}
          </>
        ) : (
          "Each question is routed to exactly one retrieval strategy before an answer is generated."
        )}
      </p>
    </section>
  );
}
