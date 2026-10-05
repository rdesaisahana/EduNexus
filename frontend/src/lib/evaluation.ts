/**
 * Evaluation results in the order they were run, taken from
 * evaluation/evaluation_summary.csv and the per-stage result files in evaluation/.
 * Per-query cases come from the failing rows of each stage's CSV.
 */

export const HELD_OUT_CAPTION = "Results on a 15-question synthetic held-out validation set.";

export const PHILOSOPHY = ["Build", "Evaluate", "Diagnose", "Improve", "Re-evaluate", "Validate"];

export const FAILURE_SOURCES = [
  "Routing",
  "Retrieval",
  "Chunking",
  "Context construction",
  "Text-to-Cypher",
  "Generation",
];

export type StageKind = "pass" | "improvement" | "regression" | "validation";

export type Phase = "Retrieval components" | "Answer generation" | "Validation" | "Refinement";

export const PHASES: { name: Phase; description: string }[] = [
  { name: "Retrieval components", description: "Each retrieval path measured on its own labelled questions." },
  { name: "Answer generation", description: "End-to-end answers judged for correctness on a 20-question set." },
  { name: "Validation", description: "Harder paraphrases, a full re-run, then questions never seen during tuning." },
  { name: "Refinement", description: "Tightening answers after validation, re-checked on the 20-question set." },
];

export interface StageMetric {
  label: string;
  value: number;
  before?: number;
  format?: "percent" | "decimal";
}

/**
 * fixed     — failed before this stage's change, passes after it
 * carried   — still failing after this stage; resolved in a later stage
 * regressed — passed before, broke because of this stage's change
 */
export type CaseOutcome = "fixed" | "carried" | "regressed";

/** One failing query: what went wrong and the one-line resolution. */
export interface EvalCase {
  query: string;
  issue: string;
  resolution: string;
  outcome: CaseOutcome;
}

export interface EvalStage {
  id: string;
  phase: Phase;
  title: string;
  /** Short name for the stage map. */
  short: string;
  area: string;
  questions: number;
  kind: StageKind;
  /** What the stage asked. */
  question: string;
  metrics: StageMetric[];
  cases?: EvalCase[];
  fixes?: string[];
  note?: string;
}

export const EVAL_STAGES: EvalStage[] = [
  {
    id: "router",
    phase: "Retrieval components",
    title: "Router evaluation",
    short: "Router",
    area: "Routing",
    questions: 15,
    kind: "pass",
    question: "Does the LLM router send clearly-worded questions to GRAPH, VECTOR or EXACT correctly?",
    metrics: [{ label: "Accuracy", value: 1.0 }],
    note: "All 15 direct questions were routed correctly. Paraphrased questions later exposed gaps (see Router validation).",
  },
  {
    id: "graph",
    phase: "Retrieval components",
    title: "Graph retrieval",
    short: "Graph",
    area: "Text-to-Cypher",
    questions: 10,
    kind: "improvement",
    question: "Does the generated Cypher return the expected values from the knowledge graph?",
    metrics: [{ label: "Accuracy", before: 0.8, value: 1.0 }],
    cases: [
      {
        query: "Who teaches Geometry?",
        issue: "Cypher matched Geometry as a Subject node, so the query returned no rows.",
        resolution: "Schema example values list Geometry as a Class, so the query now matches the Class and returns Michael Brown.",
        outcome: "fixed",
      },
      {
        query: "Who heads the department that Daniel Smith belongs to?",
        issue: "Text-to-Cypher returned an empty query for this two-hop question.",
        resolution:
          "Multi-hop instructions and a few-shot example now produce Teacher → BELONGS_TO → Department ← HEADS, returning Rachel Wilson.",
        outcome: "fixed",
      },
    ],
    fixes: [
      "Added schema example values",
      "Added entity-type grounding",
      "Added multi-hop instructions",
      "Added few-shot Cypher examples",
    ],
  },
  {
    id: "vector",
    phase: "Retrieval components",
    title: "Vector retrieval",
    short: "Vector",
    area: "Retrieval",
    questions: 10,
    kind: "pass",
    question: "Is the expected policy or incident document among the top 3 retrieved chunks?",
    metrics: [
      { label: "Hit@3", value: 1.0 },
      { label: "MRR", value: 1.0, format: "decimal" },
    ],
    note: "The expected document was ranked first for all 10 questions.",
  },
  {
    id: "exact",
    phase: "Retrieval components",
    title: "Exact retrieval",
    short: "Exact",
    area: "Retrieval",
    questions: 10,
    kind: "pass",
    question: "Does full-text search find the named student or teacher?",
    metrics: [{ label: "Accuracy", value: 1.0 }],
    note: "Partial matches are returned too (e.g. Daniel Wright for “Daniel Smith”); the expected person was always found.",
  },
  {
    id: "chunking",
    phase: "Answer generation",
    title: "Generation · chunking",
    short: "Chunking",
    area: "Chunking",
    questions: 20,
    kind: "improvement",
    question: "Are end-to-end answers correct?",
    metrics: [{ label: "Correctness", before: 0.9, value: 0.95 }],
    cases: [
      {
        query: "What happens if I have more than five unexcused absences?",
        issue:
          "The chunk was cut after “…more than five unexcused absences in a semester”, so the answer could only say “further action” may follow.",
        resolution:
          "With the policy kept as one chunk, the consequence is retrieved: the student must meet with their counselor and parent or guardian.",
        outcome: "fixed",
      },
      {
        query: "Can I submit my homework four days late?",
        issue: "The retrieved chunk stopped before the sentence allowing teacher-approved extensions, so the answer left it out.",
        resolution:
          "The full policy, including the extension sentence, is now retrieved, but the answer still left the exception out. Carried into prompt v1.",
        outcome: "carried",
      },
    ],
    fixes: ["Kept each short, semantically complete school policy together as one chunk"],
  },
  {
    id: "prompt-v1",
    phase: "Answer generation",
    title: "Generation prompt v1",
    short: "Prompt v1",
    area: "Generation",
    questions: 20,
    kind: "regression",
    question: "Do answers improve if every answer must include conditions and exceptions?",
    metrics: [{ label: "Correctness", before: 0.95, value: 0.9 }],
    cases: [
      {
        query: "Can I submit my homework four days late?",
        issue: "The answer omitted that teachers may approve extensions.",
        resolution: "Requiring conditions and exceptions made the answer include the extension rule.",
        outcome: "fixed",
      },
      {
        query: "Which department does Daniel Smith belong to?",
        issue: "Neo4j returned {department: “Science”}, but the answer said the department was not specified.",
        resolution: "Resolved in route-aware generation: GRAPH results are now treated as facts that answer the question.",
        outcome: "regressed",
      },
      {
        query: "Which department does Laura Taylor belong to?",
        issue: "Neo4j returned {department: “Mathematics”}, but the answer said the department was not specified.",
        resolution: "Resolved in route-aware generation, the same way as the Daniel Smith question.",
        outcome: "regressed",
      },
    ],
    fixes: ["Every answer instructed to include all conditions, exceptions, penalties and limitations"],
    note: "Kept as a learning step: one instruction set cannot serve documents and graph facts equally well.",
  },
  {
    id: "route-aware",
    phase: "Answer generation",
    title: "Route-aware generation",
    short: "Route-aware",
    area: "Generation",
    questions: 20,
    kind: "improvement",
    question: "Do answers improve when instructions depend on the route?",
    metrics: [{ label: "Correctness", before: 0.9, value: 0.95 }],
    cases: [
      {
        query: "Which department does Daniel Smith belong to?",
        issue: "Under prompt v1 the answer ignored the returned department.",
        resolution: "GRAPH instructions treat returned fields as facts, giving “Daniel Smith belongs to the Science department.”",
        outcome: "fixed",
      },
      {
        query: "Which department does Laura Taylor belong to?",
        issue: "Under prompt v1 the answer ignored the returned department.",
        resolution: "GRAPH instructions treat returned fields as facts, giving “Laura Taylor belongs to the Mathematics department.”",
        outcome: "fixed",
      },
      {
        query: "Where was Physics 101 moved after the water leak?",
        issue:
          "Routed to GRAPH; the Cypher returned {moved_location: “Physics 101”}, so the answer was “Physics 101 was moved to Physics 101.”",
        resolution:
          "A routing failure, not a generation one. Resolved in router validation: incident questions go to VECTOR even when they name a class.",
        outcome: "carried",
      },
    ],
    fixes: ["Separate answer instructions for GRAPH, VECTOR and EXACT evidence"],
  },
  {
    id: "router-validation",
    phase: "Validation",
    title: "Router validation",
    short: "Router v2",
    area: "Routing",
    questions: 15,
    kind: "improvement",
    question: "Does the router still choose correctly when questions are paraphrased?",
    metrics: [{ label: "Accuracy", before: 0.867, value: 1.0 }],
    cases: [
      {
        query: "Where did the Physics class go when Lab 3 had a problem?",
        issue: "Expected VECTOR, routed to GRAPH because the question names a class.",
        resolution: "New rule: VECTOR for policies, incidents and events even when graph entities are mentioned. Now routed to VECTOR.",
        outcome: "fixed",
      },
      {
        query: "What department is Daniel Smith part of?",
        issue: "Expected GRAPH, routed to EXACT because the question contains a person's name.",
        resolution: "EXACT is now only for pure person lookup; relationship questions go to GRAPH. Now routed to GRAPH.",
        outcome: "fixed",
      },
    ],
    fixes: [
      "EXACT only for pure person lookup",
      "GRAPH for relationships",
      "VECTOR for policies, incidents and events — even when graph entities are mentioned",
    ],
  },
  {
    id: "final-generation",
    phase: "Validation",
    title: "Final generation",
    short: "Final run",
    area: "20-question evaluation set",
    questions: 20,
    kind: "validation",
    question: "With every fix in place, are answers correct and faithful to the retrieved evidence?",
    metrics: [
      { label: "Correctness", value: 1.0 },
      { label: "Faithfulness", value: 1.0 },
    ],
    note: "“Where was Physics 101 moved after the water leak?” is now routed to VECTOR and answered correctly.",
  },
  {
    id: "held-out",
    phase: "Validation",
    title: "Final held-out validation",
    short: "Held-out",
    area: "15 new questions not used during tuning",
    questions: 15,
    kind: "validation",
    question: "Does the system hold up on questions it was never tuned against?",
    metrics: [
      { label: "Correctness", value: 1.0 },
      { label: "Faithfulness", value: 1.0 },
    ],
  },
  {
    id: "precision",
    phase: "Refinement",
    title: "Precision refinement",
    short: "Precision",
    area: "Generation · VECTOR instructions",
    questions: 20,
    kind: "improvement",
    question: "Can document answers be more precise without losing correctness or faithfulness?",
    metrics: [
      { label: "Correctness", value: 1.0 },
      { label: "Faithfulness", value: 1.0 },
    ],
    cases: [
      {
        query: "Why was Physics 101 moved to another lab?",
        issue: "Correct, but the answer also described the repair and the class returning, which the question didn't ask about.",
        resolution: "Precision instructions now give only the cause: a water leak damaged Science Lab 3.",
        outcome: "fixed",
      },
    ],
    fixes: [
      "Answer only what the user asked, using the minimum information needed",
      "Include conditions, exceptions or penalties only when they directly affect the answer",
      "Do not summarise the whole document or add unrelated details",
    ],
    note: "Re-evaluated on the 20-question set. The 15-question held-out set was not re-run with this prompt.",
  },
];

export function formatMetric(value: number, format: "percent" | "decimal" = "percent") {
  if (format === "decimal") return value.toFixed(1);
  const pct = value * 100;
  return `${Number.isInteger(+pct.toFixed(1)) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}
