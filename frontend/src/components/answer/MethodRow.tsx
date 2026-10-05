/** Compact "label: value" facts describing a retrieval step. */
export function MethodRow({ items }: { items: [string, string][] }) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-3">{label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SubHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">{children}</h4>
      {aside && <span className="text-xs text-ink-3">{aside}</span>}
    </div>
  );
}
