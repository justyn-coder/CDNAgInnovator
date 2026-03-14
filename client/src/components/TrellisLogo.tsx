/** Inline SVG nav logo — renders text with page fonts (unlike <img> which can't access external fonts). */
export function TrellisLogo({ className = "h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 40" className={className} aria-label="Trellis" role="img">
      {/* Trellis lattice icon */}
      <g transform="translate(2, 4)">
        {/* Vertical supports */}
        <line x1="4" y1="32" x2="4" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="32" x2="14" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="32" x2="24" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
        {/* Crossbars */}
        <line x1="0" y1="26" x2="28" y2="26" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
        <line x1="0" y1="16" x2="28" y2="16" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
        {/* Bottom — green */}
        <circle cx="4" cy="26" r="2.5" fill="#48B87A"/>
        <circle cx="14" cy="26" r="2.2" fill="#48B87A" opacity="0.9"/>
        <circle cx="24" cy="26" r="1.8" fill="#48B87A" opacity="0.8"/>
        {/* Middle — chartreuse */}
        <circle cx="4" cy="16" r="2.8" fill="#8CC63F"/>
        <circle cx="14" cy="16" r="2.5" fill="#8CC63F" opacity="0.9"/>
        <circle cx="24" cy="16" r="2" fill="#8CC63F" opacity="0.7"/>
        {/* Top — gold */}
        <circle cx="4" cy="6" r="2.5" fill="#D4A828" opacity="0.85"/>
        <circle cx="14" cy="3" r="2" fill="#D4A828" opacity="0.65"/>
        <circle cx="24" cy="0" r="1.5" fill="#D4A828" opacity="0.5"/>
      </g>
      {/* Wordmark — uses page-loaded DM Serif Display */}
      <text
        x="36"
        y="28"
        fontFamily="'DM Serif Display', Georgia, serif"
        fontSize="26"
        fontWeight="400"
        letterSpacing="0.01em"
        fill="#1a1a18"
      >
        Trellis
      </text>
    </svg>
  );
}
