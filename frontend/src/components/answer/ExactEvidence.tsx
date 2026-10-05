import { isExactRecord, type AskResponse } from "@/lib/types";
import { MethodRow, SubHeading } from "./MethodRow";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

export function ExactEvidence({ result }: { result: AskResponse }) {
  const people = result.retrieved.filter(isExactRecord).sort((a, b) => b.score - a.score);
  const [best, ...others] = people;
  if (!best) return null;

  return (
    <div className="space-y-7">
      <MethodRow
        items={[
          ["Retrieval method", "Full-text entity search"],
          ["Searched for", result.trace?.extractedName ?? best.name],
          ["Source", "Neo4j name index"],
        ]}
      />

      <div>
        <SubHeading aside="Best match">Matched entity</SubHeading>
        <div className="flex items-center gap-4 rounded-xl border border-exact-line bg-surface p-4 sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-exact-line bg-exact-bg font-serif text-lg text-exact">
            {initials(best.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-medium text-ink">{best.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {best.type.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-exact-line bg-exact-bg px-2 py-px text-xs font-medium text-exact"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.1em] text-ink-3">Match score</p>
            <p className="font-mono text-sm tabular-nums text-ink">{best.score.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <SubHeading aside="Partial name matches">Other matches</SubHeading>
          <ul className="divide-y divide-line-2 rounded-xl border border-line-2 bg-surface">
            {others.map((p) => (
              <li key={p.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 text-ink-2">{p.name}</span>
                <span className="text-xs text-ink-3">{p.type.join(", ")}</span>
                <span className="w-12 text-right font-mono text-xs tabular-nums text-ink-3">{p.score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
