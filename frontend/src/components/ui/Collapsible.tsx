"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

interface CollapsibleProps {
  title: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  variant?: "section" | "subtle";
  children: ReactNode;
}

export function Collapsible({ title, icon, meta, defaultOpen = false, variant = "section", children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const trigger =
    variant === "section"
      ? "py-3.5 text-[15px] font-medium text-ink"
      : "py-2 text-[13px] font-medium text-ink-2 hover:text-ink";

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`group flex w-full items-center gap-2.5 text-left transition-colors ${trigger}`}
      >
        {icon && <span className="text-ink-3 transition-colors group-hover:text-ink-2">{icon}</span>}
        <span className="flex-1">{title}</span>
        {meta && <span className="text-xs font-normal text-ink-3">{meta}</span>}
        <ChevronDown
          className={`h-4 w-4 text-ink-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={id} className="collapse-grid" data-open={open}>
        <div>
          <div className={variant === "section" ? "pb-2 pt-1" : "pb-1 pt-1"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
