# EduNexus — frontend

*Your school's knowledge, connected.*

Demo UI for the EduNexus GraphRAG pipeline in `../graphrag.ipynb`. Next.js (App Router) · TypeScript · Tailwind CSS v4 · Lucide.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Backend integration

Components never call `fetch` directly; all requests go through `src/lib/api.ts`.

- **No env var set** → a local mock (`src/lib/mock/`) answers using the same synthetic dataset as the notebook. The footer shows a "Demo responses" tag.
- **`NEXT_PUBLIC_EDUNEXUS_API_URL=http://localhost:8000`** (in `.env.local`) → `POST {url}/ask`.

Contract (matches the notebook's `evaluate_question()` plus an optional `trace`):

```jsonc
// request
{ "question": "Who teaches Emma Johnson?" }

// response
{
  "question": "Who teaches Emma Johnson?",
  "route": "GRAPH",                          // GRAPH | VECTOR | EXACT
  "answer": "Daniel Smith and Laura Taylor teach Emma Johnson.",
  "retrieved": [{ "teacher": "Daniel Smith" }, { "teacher": "Laura Taylor" }],
  "trace": { "method": "Text-to-Cypher", "cypher": "MATCH ..." }   // optional
}
```

`retrieved` items by route:

| Route  | Shape                                                   |
| ------ | ------------------------------------------------------- |
| GRAPH  | any Cypher row, e.g. `{ "department_head": "Rachel Wilson" }` |
| VECTOR | `{ "title", "text", "score", "category"? }`              |
| EXACT  | `{ "name", "type": ["Teacher"], "score" }`               |

For GRAPH answers, the UI draws the path from `trace.paths` if the backend sends it. Otherwise it derives the query pattern from `trace.cypher`. An empty `retrieved` list renders the "not enough information" state.

The graph explorer on the Tracing tab calls the optional `GET {url}/graph`, which returns `{ nodes: [{id, name, label}], relationships: [{source, target, type}] }`. If that endpoint is missing, it uses a bundled synthetic snapshot built exactly like the notebook's `add_teachers` / `add_classes` / `add_students`.

## Structure

```
src/
  app/            layout, page (Ask · Tracing · Evaluation), design tokens
  hooks/useAsk.ts request lifecycle
  lib/            types, api service, mock engine, cypher parser, evaluation data
  components/
    ask/          AskBar, ExampleChips, AnswerPending
    answer/       AnswerCard (Ask tab), HowFoundPanel, RouteBadge, Graph/Vector/Exact evidence, TechnicalDetails
    trace/        TracingView (replays each answer step by step), TraceLog, RouteTrace
    graph/        GraphExplorer, GraphCanvas (pan/zoom/expand), d3-force layout
    eval/         EvaluationView, EvalTimeline (stages in the order they were run)
    layout/       SiteHeader, Footer, HowItWorksDrawer
    ui/           Collapsible, Drawer
```

Evaluation figures in `src/lib/evaluation.ts` are taken from `../evaluation/evaluation_summary.csv`.

All data is synthetic. EduNexus is a prototype and is not affiliated with any school.
