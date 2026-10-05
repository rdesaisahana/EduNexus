/**
 * Contract for the EduNexus `/ask` endpoint.
 *
 * Mirrors the backend's `evaluate_question()` output ({ route, retrieved, answer })
 * plus an optional `trace` describing how retrieval was performed.
 */

export type Route = "GRAPH" | "VECTOR" | "EXACT";

export const ROUTES: Route[] = ["GRAPH", "VECTOR", "EXACT"];

/** GRAPH: one row returned by the generated Cypher, e.g. { teacher: "Daniel Smith" }. */
export type GraphRecord = Record<string, unknown>;

/** VECTOR: one document chunk returned by Neo4j vector similarity search. */
export interface VectorRecord {
  title: string;
  text: string;
  score: number;
  category?: string;
}

/** EXACT: one entity returned by the Neo4j full-text index. */
export interface ExactRecord {
  name: string;
  type: string[];
  score: number;
}

export type RetrievedRecord = GraphRecord | VectorRecord | ExactRecord;

/** A linear path through the knowledge graph used to explain a GRAPH answer. */
export interface GraphPathNode {
  name: string;
  label: string; // Student | Teacher | Class | Subject | Department
}

export interface GraphPathRelationship {
  type: string; // e.g. BELONGS_TO
  /** forward: nodes[i] -> nodes[i+1]; backward: nodes[i] <- nodes[i+1] */
  direction: "forward" | "backward";
}

export interface GraphPath {
  nodes: GraphPathNode[];
  relationships: GraphPathRelationship[];
}

export interface AskTrace {
  /** Human-readable retrieval method, e.g. "Text-to-Cypher". */
  method?: string;
  /** GRAPH only: the generated Cypher query. */
  cypher?: string;
  /** GRAPH only (optional): resolved paths. If absent the UI derives a pattern from `cypher`. */
  paths?: GraphPath[];
  /** EXACT only: the name extracted from the question before the full-text search. */
  extractedName?: string;
  /** VECTOR only: index / model details. */
  index?: string;
  embeddingModel?: string;
}

export interface AskResponse {
  question: string;
  route: Route;
  answer: string;
  retrieved: RetrievedRecord[];
  trace?: AskTrace;
}

/* ---------- type guards ---------- */

export function isVectorRecord(r: RetrievedRecord): r is VectorRecord {
  return typeof r === "object" && r !== null && "text" in r && "title" in r;
}

export function isExactRecord(r: RetrievedRecord): r is ExactRecord {
  return typeof r === "object" && r !== null && "name" in r && Array.isArray((r as ExactRecord).type);
}
