import type { GraphPath } from "./types";

/**
 * Derives a schema-level path from the first MATCH pattern of a generated Cypher query.
 * Used when the backend returns Cypher but no resolved `trace.paths`.
 *
 *   MATCH (t:Teacher {name: "Daniel Smith"})-[:BELONGS_TO]->(d:Department)<-[:HEADS]-(h:Teacher)
 *   => Daniel Smith (Teacher) -BELONGS_TO-> Department <-HEADS- Teacher
 */
export function pathFromCypher(cypher: string): GraphPath | null {
  const match = cypher.replace(/\s+/g, " ").match(/MATCH\s+(.*?)(?:\s+(?:WHERE|RETURN|WITH|OPTIONAL)\b|$)/i);
  if (!match) return null;

  const token = /\((\w*)(?::(\w+))?\s*(?:\{\s*name\s*:\s*["']([^"']+)["']\s*\})?\s*\)|(<?-)\s*\[\w*:(\w+)[^\]]*\]\s*(->?)/g;
  const path: GraphPath = { nodes: [], relationships: [] };

  for (const m of match[1].matchAll(token)) {
    if (m[0].startsWith("(")) {
      const label = m[2] ?? "Node";
      path.nodes.push({ name: m[3] ?? label, label });
    } else {
      path.relationships.push({ type: m[5], direction: m[4] === "<-" ? "backward" : "forward" });
    }
  }

  const valid = path.nodes.length >= 2 && path.relationships.length === path.nodes.length - 1;
  return valid ? path : null;
}
