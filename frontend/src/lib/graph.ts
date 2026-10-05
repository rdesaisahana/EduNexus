/**
 * The school knowledge graph as stored in Neo4j (structured part only;
 * document chunks have no relationships and are not drawn).
 */

import { classes, students, teachers } from "./mock/dataset";
import type { AskResponse } from "./types";

export type NodeLabel = "Student" | "Teacher" | "Class" | "Subject" | "Department";

export interface KGNode {
  id: string;
  name: string;
  label: NodeLabel;
}

export interface KGRelationship {
  source: string;
  target: string;
  type: "ENROLLED_IN" | "TEACHES" | "FOR_SUBJECT" | "BELONGS_TO" | "HEADS";
}

export interface SchoolGraph {
  nodes: KGNode[];
  relationships: KGRelationship[];
}

/** Ids include the label: "Mathematics" and "English" are both a Subject and a Department. */
export const nodeId = (label: string, name: string) => `${label}:${name}`;
export const relKey = (source: string, type: string, target: string) => `${source}|${type}|${target}`;

/** Builds the graph exactly as the notebook's add_teachers / add_classes / add_students do. */
export function buildSchoolGraph(): SchoolGraph {
  const nodes = new Map<string, KGNode>();
  const relationships: KGRelationship[] = [];
  const add = (label: NodeLabel, name: string) => {
    const id = nodeId(label, name);
    if (!nodes.has(id)) nodes.set(id, { id, name, label });
    return id;
  };

  for (const t of teachers) {
    const tid = add("Teacher", t.name);
    const did = add("Department", t.department);
    relationships.push({ source: tid, target: did, type: "BELONGS_TO" });
    if (t.head) relationships.push({ source: tid, target: did, type: "HEADS" });
  }
  for (const c of classes) {
    const cid = add("Class", c.class);
    const sid = add("Subject", c.subject);
    relationships.push({ source: nodeId("Teacher", c.teacher), target: cid, type: "TEACHES" });
    relationships.push({ source: cid, target: sid, type: "FOR_SUBJECT" });
  }
  for (const s of students) {
    const sid = add("Student", s.name);
    for (const c of s.classes) relationships.push({ source: sid, target: nodeId("Class", c), type: "ENROLLED_IN" });
  }

  return { nodes: [...nodes.values()], relationships };
}

export interface GraphHighlight {
  nodes: Set<string>;
  relationships: Set<string>;
}

/** Which nodes / relationships in the graph were used to answer a question. */
export function highlightFor(result: AskResponse | null): GraphHighlight {
  const nodes = new Set<string>();
  const relationships = new Set<string>();
  if (!result || !result.retrieved.length) return { nodes, relationships };

  if (result.route === "GRAPH") {
    for (const path of result.trace?.paths ?? []) {
      const ids = path.nodes.map((n) => nodeId(n.label, n.name));
      ids.forEach((id) => nodes.add(id));
      path.relationships.forEach((r, i) => {
        const [a, b] = r.direction === "forward" ? [ids[i], ids[i + 1]] : [ids[i + 1], ids[i]];
        relationships.add(relKey(a, r.type, b));
      });
    }
  } else if (result.route === "EXACT") {
    const best = [...result.retrieved].sort(
      (a, b) => ((b as { score: number }).score ?? 0) - ((a as { score: number }).score ?? 0),
    )[0] as { name?: string; type?: string[] };
    if (best?.name && best.type?.[0]) nodes.add(nodeId(best.type[0], best.name));
  }
  return { nodes, relationships };
}
