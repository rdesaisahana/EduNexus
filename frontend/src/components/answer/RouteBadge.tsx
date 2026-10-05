import { ROUTE_STYLES } from "@/lib/routeStyles";
import type { Route } from "@/lib/types";

export function RouteBadge({ route, size = "md" }: { route: Route; size?: "sm" | "md" }) {
  const s = ROUTE_STYLES[route];
  const Icon = s.icon;
  const sizing =
    size === "sm" ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-[0.08em] ${sizing} ${s.text} ${s.bg} ${s.border}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
      {route}
    </span>
  );
}
