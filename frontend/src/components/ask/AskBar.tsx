"use client";

import { ArrowUp, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface AskBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (question: string) => void;
  loading: boolean;
  size?: "hero" | "compact";
}

export function AskBar({ value, onChange, onSubmit, loading, size = "hero" }: AskBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hero = size === "hero";

  // "/" focuses the input, a familiar shortcut for search-first tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(value.trim());
      }}
      className={`group relative flex items-center rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-200 focus-within:border-accent/40 focus-within:shadow-[var(--shadow-lift)] focus-within:ring-4 focus-within:ring-accent/[0.06] ${hero ? "h-16 pl-5 pr-2 sm:h-[68px]" : "h-14 pl-4 pr-2"}`}
    >
      <Search className={`shrink-0 text-ink-3 ${hero ? "h-5 w-5" : "h-[18px] w-[18px]"}`} strokeWidth={1.8} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask a question about your school..."
        aria-label="Ask a question about your school"
        autoComplete="off"
        className={`min-w-0 flex-1 bg-transparent px-3.5 text-ink outline-none placeholder:text-ink-3/80 ${hero ? "text-[17px] sm:text-lg" : "text-base"}`}
      />
      {hero && !value && (
        <kbd className="mr-3 hidden rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-3 sm:block">
          /
        </kbd>
      )}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear question"
          title="Clear question"
          className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent font-medium text-white transition-all duration-200 hover:bg-[#1c3459] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${hero ? "h-12 px-5 text-[15px]" : "h-10 px-4 text-sm"}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.2} />}
        <span className="hidden sm:inline">Ask</span>
      </button>
    </form>
  );
}
