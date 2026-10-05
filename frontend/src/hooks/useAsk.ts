"use client";

import { useCallback, useRef, useState } from "react";
import { askQuestion } from "@/lib/api";
import type { AskResponse } from "@/lib/types";

export type AskStatus = "idle" | "loading" | "done" | "error";

/** Avoids a jarring flash when the backend answers instantly. */
const MIN_DURATION_MS = 500;

export function useAsk() {
  const [status, setStatus] = useState<AskStatus>("idle");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Increments on every completed answer; lets views restart per-answer animations. */
  const [runId, setRunId] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const ask = useCallback(async (q: string) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;

    setQuestion(q);
    setStatus("loading");
    setError(null);

    try {
      const [response] = await Promise.all([
        askQuestion(q, ctrl.signal),
        new Promise((r) => setTimeout(r, MIN_DURATION_MS)),
      ]);
      if (ctrl.signal.aborted) return;
      setResult(response);
      setRunId((n) => n + 1);
      setStatus("done");
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, question, result, error, runId, ask, reset };
}
