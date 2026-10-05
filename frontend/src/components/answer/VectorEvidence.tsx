"use client";

import { ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import { isVectorRecord, type AskResponse, type VectorRecord } from "@/lib/types";
import { MethodRow, SubHeading } from "./MethodRow";

const STOP = new Set([
  "what", "when", "where", "which", "with", "after", "does", "have", "that", "this", "from", "there",
  "their", "about", "should", "would", "could", "school", "student", "students", "they", "into", "were", "will",
]);

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

/** Terms from the question used to visually mark matching sentences in the evidence. */
function questionTerms(question: string) {
  return question
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()))
    .map(norm);
}

function sentenceMatches(sentence: string, terms: string[]) {
  const words = sentence.split(/\s+/).map(norm).filter((w) => w.length >= 3);
  return words.some((w) => terms.some((t) => w.startsWith(t) || t.startsWith(w)));
}

function ScoreBar({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-14 overflow-hidden rounded-full bg-line-2">
        <span className="block h-full rounded-full bg-vector/70" style={{ width: `${Math.min(score, 1) * 100}%` }} />
      </span>
      <span className="font-mono text-[11px] tabular-nums text-ink-2">{score.toFixed(2)}</span>
    </span>
  );
}

function EvidenceCard({ doc, question }: { doc: VectorRecord; question: string }) {
  const terms = questionTerms(question);
  const sentences = doc.text.trim().split(/(?<=\.)\s+/);
  const marked = sentences.map((s) => sentenceMatches(s, terms));
  const highlight = marked.some(Boolean) && !marked.every(Boolean);

  return (
    <article className="overflow-hidden rounded-xl border border-vector-line bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-vector-line/70 bg-vector-bg/60 px-4 py-3 sm:px-5">
        <FileText className="h-4 w-4 text-vector" strokeWidth={1.8} />
        <h5 className="font-medium text-ink">{doc.title}</h5>
        {doc.category && (
          <span className="rounded-md border border-vector-line bg-surface px-1.5 py-px text-[11px] text-vector">
            {doc.category}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 text-[11px] text-ink-3">
          Similarity <ScoreBar score={doc.score} />
        </span>
      </header>
      <blockquote className="px-4 py-4 font-serif text-[17px] leading-relaxed text-ink-2 sm:px-5">
        {"“"}
        {sentences.map((s, i) => (
          <span key={i}>
            <span
              className={
                highlight && marked[i] ? "rounded-sm bg-vector-bg px-0.5 text-ink [box-decoration-break:clone]" : ""
              }
            >
              {s}
            </span>
            {i < sentences.length - 1 ? " " : ""}
          </span>
        ))}
        {"”"}
      </blockquote>
      {highlight && (
        <p className="px-4 pb-3 text-[11px] text-ink-3 sm:px-5">Highlighted: sentences sharing terms with the question.</p>
      )}
    </article>
  );
}

function AlsoRetrieved({ doc, rank }: { doc: VectorRecord; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-line-2 bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
        aria-expanded={open}
      >
        <span className="font-mono text-[11px] text-ink-3">#{rank}</span>
        <span className="flex-1 text-ink-2">{doc.title}</span>
        <ScoreBar score={doc.score} />
        <ChevronDown className={`h-3.5 w-3.5 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="collapse-grid" data-open={open}>
        <div>
          <p className="px-3.5 pb-3 text-[13px] leading-relaxed text-ink-3">{doc.text}</p>
        </div>
      </div>
    </li>
  );
}

export function VectorEvidence({ result }: { result: AskResponse }) {
  const docs = result.retrieved.filter(isVectorRecord).sort((a, b) => b.score - a.score);
  const [top, ...rest] = docs;
  if (!top) return null;

  return (
    <div className="space-y-7">
      <MethodRow
        items={[
          ["Retrieval method", "Semantic vector search"],
          ["Source", top.title],
          ["Store", "Neo4j document chunks"],
        ]}
      />

      <div>
        <SubHeading aside="Top match">Retrieved evidence</SubHeading>
        <EvidenceCard doc={top} question={result.question} />
      </div>

      {rest.length > 0 && (
        <div>
          <SubHeading aside="Considered, ranked lower">Also retrieved (top {docs.length})</SubHeading>
          <ul className="space-y-2">
            {rest.map((d, i) => (
              <AlsoRetrieved key={d.title + i} doc={d} rank={i + 2} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
