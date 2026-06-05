export function Logo({ size = 32, variant = 'icon' }: { size?: number; variant?: 'icon' | 'wordmark' | 'full' }) {
  const w = variant === 'wordmark' ? size * 4.2 : variant === 'full' ? size * 5.6 : size;
  const h = size * 0.88;

  return (
    <svg width={w} height={h} viewBox={variant === 'icon' ? '0 0 36 32' : variant === 'wordmark' ? '0 0 151 32' : '0 0 202 32'} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="StockOS Pro">
      {/* Icon: stacked blocks forming "S" — inventory shelves + OS system */}
      {(variant === 'icon' || variant === 'full') && (
        <g transform="translate(0, 1)">
          {/* Block 1 — top left */}
          <rect x="2" y="2" width="14" height="9" rx="2" fill="currentColor" className="text-zinc-900 dark:text-white" />
          <rect x="4" y="4" width="10" height="5" rx="1" fill="white" opacity="0.18" />
          {/* Block 2 — bottom right */}
          <rect x="14" y="15" width="14" height="9" rx="2" fill="currentColor" className="text-zinc-900 dark:text-white" />
          <rect x="16" y="17" width="10" height="5" rx="1" fill="white" opacity="0.18" />
          {/* Block 3 — center connecting, accent */}
          <rect x="7" y="7" width="14" height="9" rx="2" fill="#059669" />
          <rect x="9" y="9" width="10" height="5" rx="1" fill="white" opacity="0.25" />
          {/* System dot — OS indicator */}
          <circle cx="28" cy="6" r="2.5" fill="#059669" />
          {/* Connection line */}
          <line x1="21" y1="13.5" x2="26" y2="6.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {variant === 'wordmark' || variant === 'full' ? (
        <g transform={variant === 'full' ? 'translate(42, 2)' : 'translate(4, 3)'}>
          <text x="0" y="23" fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fontWeight="800" fontSize="22" letterSpacing="-0.5" fill="currentColor" className="text-zinc-900 dark:text-white">
            Stock<tspan fill="#059669">OS</tspan>
          </text>
          <text x="0" y="30" fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fontWeight="500" fontSize="7" letterSpacing="2.4" fill="#71717a">
            PRO
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Logo size={28} variant="icon" />
    </div>
  );
}
