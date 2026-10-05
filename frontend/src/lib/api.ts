/**
 * EduNexus API service.
 *
 * Components call `askQuestion()` only — never fetch directly.
 * Set NEXT_PUBLIC_EDUNEXUS_API_URL (e.g. http://localhost:8000) to use a live
 * backend exposing POST /ask. Without it, a local mock built on the same
 * synthetic dataset is used.
 */

import { buildSchoolGraph, type SchoolGraph } from "./graph";
import { mockAsk } from "./mock/engine";
import { NO_INFO_ANSWER } from "./constants";
import { ROUTES, type AskResponse, type Route } from "./types";

const API_URL = process.env.NEXT_PUBLIC_EDUNEXUS_API_URL?.replace(/\/$/, "");

export const isMockMode = !API_URL;

function normalize(question: string, raw: Partial<AskResponse>): AskResponse {
  const route = String(raw.route ?? "").trim().toUpperCase() as Route;
  if (!ROUTES.includes(route)) throw new Error(`Unexpected route from backend: ${raw.route}`);
  const retrieved = Array.isArray(raw.retrieved) ? raw.retrieved : [];
  return {
    question: raw.question ?? question,
    route,
    retrieved,
    answer: retrieved.length && raw.answer ? raw.answer : NO_INFO_ANSWER,
    trace: raw.trace,
  };
}

export async function askQuestion(question: string, signal?: AbortSignal): Promise<AskResponse> {
  if (isMockMode) return normalize(question, await mockAsk(question));

  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  });
  if (!res.ok) throw new Error(`EduNexus backend returned ${res.status}`);
  return normalize(question, await res.json());
}

/**
 * The structured knowledge graph for the graph explorer.
 * Uses GET {API_URL}/graph when available; otherwise the bundled synthetic snapshot,
 * which mirrors what the notebook loads into Neo4j.
 */
export async function getGraph(): Promise<SchoolGraph> {
  if (!isMockMode) {
    try {
      const res = await fetch(`${API_URL}/graph`);
      if (res.ok) return (await res.json()) as SchoolGraph;
    } catch {
      // fall through to the snapshot
    }
  }
  return buildSchoolGraph();
}
