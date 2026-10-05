/** EduNexus mark: a small connected-node "nexus" — one hub joined to three nodes. */
export function NexusMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.92">
        <line x1="16" y1="16.5" x2="9" y2="10" />
        <line x1="16" y1="16.5" x2="23.5" y2="11" />
        <line x1="16" y1="16.5" x2="13" y2="24" />
        <line x1="23.5" y1="11" x2="13" y2="24" opacity="0.4" />
      </g>
      <circle cx="16" cy="16.5" r="3.1" fill="#fff" />
      <circle cx="9" cy="10" r="2.1" fill="#fff" />
      <circle cx="23.5" cy="11" r="2.1" fill="#fff" />
      <circle cx="13" cy="24" r="2.1" fill="#fff" />
    </svg>
  );
}
