/** Inline SVG nav logo — icon + wordmark. Use showTagline to add subtitle. */
export function TrellisLogo({ className = "h-8", showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <svg viewBox="0 0 140 36" className={className} aria-label="Trellis" role="img">
        {/* Trellis lattice icon */}
        <g transform="translate(2, 2)">
          {/* Vertical supports */}
          <line x1="4" y1="30" x2="4" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="30" x2="12" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="30" x2="20" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
          {/* Crossbars */}
          <line x1="0" y1="24" x2="24" y2="24" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
          <line x1="0" y1="15" x2="24" y2="15" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
          {/* Bottom — green */}
          <circle cx="4" cy="24" r="2.2" fill="#48B87A"/>
          <circle cx="12" cy="24" r="1.9" fill="#48B87A" opacity="0.9"/>
          <circle cx="20" cy="24" r="1.6" fill="#48B87A" opacity="0.8"/>
          {/* Middle — chartreuse */}
          <circle cx="4" cy="15" r="2.4" fill="#8CC63F"/>
          <circle cx="12" cy="15" r="2.1" fill="#8CC63F" opacity="0.9"/>
          <circle cx="20" cy="15" r="1.7" fill="#8CC63F" opacity="0.7"/>
          {/* Top — gold */}
          <circle cx="4" cy="6" r="2.1" fill="#D4A828" opacity="0.85"/>
          <circle cx="12" cy="3" r="1.7" fill="#D4A828" opacity="0.65"/>
          <circle cx="20" cy="0" r="1.3" fill="#D4A828" opacity="0.5"/>
        </g>
        {/* Wordmark — uses page-loaded DM Serif Display */}
        <text
          x="32"
          y="24"
          fontFamily="'DM Serif Display', Georgia, serif"
          fontSize="22"
          fontWeight="400"
          letterSpacing="0.01em"
          fill="#1a1a18"
        >
          Trellis
        </text>
      </svg>
      {showTagline && (
        <span
          className="hidden md:block"
          style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.04em", textTransform: "uppercase", color: "#999", marginTop: -2 }}
        >
          Navigate Canada's AgTech Ecosystem
        </span>
      )}
    </div>
  );
}

/** Maple leaf — uses PNG if available, inline SVG fallback */
export function MapleLeaf({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/maple-leaf.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      aria-hidden="true"
    />
  );
}
