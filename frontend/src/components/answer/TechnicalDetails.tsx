"use client";

import { Check, Code2, Copy } from "lucide-react";
import { useState } from "react";
import { isVectorRecord, type AskResponse } from "@/lib/types";
import { Collapsible } from "../ui/Collapsible";

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line-2 px-3.5 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-3 transition-colors hover:bg-paper hover:text-ink"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-ink-2">{code}</pre>
    </div>
  );
}

function Facts({ items }: { items: [string, string | undefined][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
      {items
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-3">{k}</dt>
            <dd className="break-all font-mono text-[12.5px] text-ink-2">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function TechnicalDetails({ result }: { result: AskResponse }) {
  const { route, trace } = result;

  // Keep the raw view readable: document text is already shown in the evidence card.
  const raw = result.retrieved.map((r) =>
    isVectorRecord(r) ? { ...r, text: r.text.length > 64 ? `${r.text.slice(0, 64)}…` : r.text } : r,
  );

  return (
    <Collapsible variant="subtle" icon={<Code2 className="h-4 w-4" />} title="Technical details">
      <div className="space-y-4 pt-2">
        <Facts
          items={[
            ["Route", route],
            ["Method", trace?.method],
            ["Index", trace?.index],
            ["Embedding model", trace?.embeddingModel],
            ["Top-k", route === "VECTOR" ? "3 · cosine similarity · 384 dimensions" : undefined],
            ["Extracted name", trace?.extractedName],
          ]}
        />
        {trace?.cypher && <CodeBlock label="Generated Cypher" code={trace.cypher} />}
        <CodeBlock label="Retrieved (raw)" code={JSON.stringify(raw, null, 2)} />
      </div>
    </Collapsible>
  );
}
