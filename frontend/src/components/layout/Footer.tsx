import { isMockMode } from "@/lib/api";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          EduNexus is a prototype built with synthetic school data for demonstration purposes. Not affiliated
          with any school.
        </p>
        <p className="flex items-center gap-3 whitespace-nowrap">
          {isMockMode && (
            <span
              className="rounded-md border border-line bg-surface px-1.5 py-px text-[11px]"
              title="No backend URL configured — responses come from a local mock over the same synthetic dataset."
            >
              Demo responses
            </span>
          )}
          Neo4j · LangChain · Groq · MiniLM
        </p>
      </div>
    </footer>
  );
}
