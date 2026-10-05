import { ROUTE_META } from "@/lib/constants";
import { ROUTE_STYLES } from "@/lib/routeStyles";
import { ROUTES } from "@/lib/types";
import { RouteBadge } from "../answer/RouteBadge";
import { Drawer } from "../ui/Drawer";

const PIPELINE = [
  ["Question", "A staff member asks in plain language."],
  ["Router", "An LLM chooses GRAPH, VECTOR or EXACT."],
  ["Retrieval strategy", "Cypher, embedding search or full-text lookup."],
  ["Neo4j", "One database holds the graph and the documents."],
  ["Retrieved evidence", "Graph rows, document chunks or a person match."],
  ["Route-aware generation", "Answer instructions tailored to the evidence type."],
  ["Grounded answer", "Uses only retrieved evidence — or says it doesn't know."],
];

const ROUTE_EXAMPLES = {
  GRAPH: "Who heads the department Daniel Smith belongs to?",
  VECTOR: "What happens after five unexcused absences?",
  EXACT: "Look up Daniel Smith",
};

const SCHEMA = [
  "Student -[:ENROLLED_IN]-> Class",
  "Teacher -[:TEACHES]-> Class",
  "Class -[:FOR_SUBJECT]-> Subject",
  "Teacher -[:BELONGS_TO]-> Department",
  "Teacher -[:HEADS]-> Department",
];

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{children}</h3>;
}

export function HowItWorksDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="How EduNexus works" subtitle="GraphRAG over one Neo4j knowledge base">
      <div className="space-y-9">
        <p className="text-[15px] leading-relaxed text-ink-2">
          School knowledge lives in two shapes: <span className="text-ink">relationships</span> (who teaches whom,
          who heads which department) and <span className="text-ink">documents</span> (policies, incidents).
          Similarity search alone struggles with multi-hop relationships, and a graph can’t read a policy. EduNexus
          picks the right strategy for each question.
        </p>

        <section>
          <Heading>Pipeline</Heading>
          <ol>
            {PIPELINE.map(([title, detail], i) => (
              <li key={title} className="relative flex gap-3.5 pb-4 last:pb-0">
                {i < PIPELINE.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-14px)] w-px bg-line" />}
                <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-[10px] text-ink-3">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="text-[13px] text-ink-3">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <Heading>Three retrieval routes</Heading>
          <div className="space-y-2.5">
            {ROUTES.map((r) => (
              <div key={r} className={`rounded-xl border p-4 ${ROUTE_STYLES[r].border} bg-surface`}>
                <div className="flex items-center justify-between gap-3">
                  <RouteBadge route={r} size="sm" />
                  <span className="text-[11px] text-ink-3">{ROUTE_META[r].method}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{ROUTE_META[r].description}</p>
                <p className="mt-1 font-serif text-[14px] italic text-ink-3">“{ROUTE_EXAMPLES[r]}”</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Heading>Inside Neo4j</Heading>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-sm font-medium text-ink">Knowledge graph</p>
              <ul className="mt-2 space-y-1 font-mono text-[11px] leading-relaxed text-ink-2">
                {SCHEMA.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-sm font-medium text-ink">Document chunks</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
                Policy and incident text with title, category and a 384-d embedding from
                <span className="font-mono text-[11px] text-ink-2"> all-MiniLM-L6-v2</span>.
              </p>
            </div>
          </div>
        </section>

        <p className="border-t border-line-2 pt-5 text-[12.5px] leading-relaxed text-ink-3">
          Built with Python, LangChain, Groq, Neo4j and HuggingFace embeddings. All school data is synthetic.
        </p>
      </div>
    </Drawer>
  );
}
