import type { Route } from "./types";

export const NO_INFO_ANSWER =
  "I don't have enough information to answer that from the available school knowledge.";

export const EXAMPLE_QUESTIONS: { question: string; route: Route }[] = [
  { question: "Who teaches Emma Johnson?", route: "GRAPH" },
  { question: "Can I submit homework four days late?", route: "VECTOR" },
  { question: "Find Priya Patel", route: "EXACT" },
  { question: "Who heads Daniel Smith's department?", route: "GRAPH" },
  { question: "Where was Physics 101 moved after the water leak?", route: "VECTOR" },
];

export const ROUTE_META: Record<
  Route,
  { label: string; short: string; description: string; method: string; store: string }
> = {
  GRAPH: {
    label: "Graph",
    short: "Relationships",
    description: "Relationships and multi-hop questions.",
    method: "Text-to-Cypher → graph traversal",
    store: "Knowledge graph",
  },
  VECTOR: {
    label: "Vector",
    short: "Documents",
    description: "Policies, incidents and semantic document retrieval.",
    method: "Query embedding → vector similarity",
    store: "Document chunks",
  },
  EXACT: {
    label: "Exact",
    short: "People",
    description: "Student and teacher entity lookup.",
    method: "Full-text entity search",
    store: "Name index",
  },
};
