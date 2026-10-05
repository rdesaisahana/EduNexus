import { FileText, Network, UserSearch, type LucideIcon } from "lucide-react";
import type { Route } from "./types";

/** Literal class strings per route (kept literal so Tailwind can see them). */
export const ROUTE_STYLES: Record<
  Route,
  { text: string; bg: string; border: string; dot: string; ring: string; line: string; icon: LucideIcon }
> = {
  GRAPH: {
    text: "text-graph",
    bg: "bg-graph-bg",
    border: "border-graph-line",
    dot: "bg-graph",
    ring: "ring-graph/10",
    line: "bg-graph",
    icon: Network,
  },
  VECTOR: {
    text: "text-vector",
    bg: "bg-vector-bg",
    border: "border-vector-line",
    dot: "bg-vector",
    ring: "ring-vector/10",
    line: "bg-vector",
    icon: FileText,
  },
  EXACT: {
    text: "text-exact",
    bg: "bg-exact-bg",
    border: "border-exact-line",
    dot: "bg-exact",
    ring: "ring-exact/10",
    line: "bg-exact",
    icon: UserSearch,
  },
};
