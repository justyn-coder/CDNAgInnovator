import { useEffect, useState } from "react";

const C = {
  greenDark: "#1B4332",
  green: "#2D5A3D",
  greenAccent: "#48B87A",
  chartreuse: "#8CC63F",
  gold: "#D4A828",
  muted: "#6B7C6B",
};

const PHRASES: Record<string, string[]> = {
  // Any AI-wait, general purpose
  generic: [
    "Walking the rows…",
    "Cross-referencing the almanac…",
    "Pulling last year's yield map…",
    "Consulting the agronomist…",
    "Reading the seed packet…",
    "Pacing the fenceline…",
    "Checking the soil samples…",
    "Flagging the test plot…",
  ],
  // Gap-map and ecosystem analysis
  gap: [
    "Scanning the back forty…",
    "Flagging thin spots…",
    "Walking the gap line…",
    "Checking coverage county by county…",
    "Comparing yield to neighbours…",
  ],
  // Sandbox feature generation
  sandbox: [
    "Three takes, one plot at a time…",
    "Sketching at the kitchen table…",
    "Claude is walking the fenceline…",
    "Drafting, tearing up, drafting again…",
    "Holding the blueprint up to the light…",
  ],
  // Founder wizard building a pathway
  pathway: [
    "Matching soil to crop…",
    "Sorting the seed stock…",
    "Lining up the cohort…",
    "Picking the right row to start…",
    "Clearing a path through 500 programs…",
  ],
  // Chat / Ask AI general
  chat: [
    "Checking the almanac…",
    "Walking down to the mailbox…",
    "Consulting the barn cat…",
    "Reading the last five yield reports…",
    "Cross-checking with the gate receipts…",
    "Running this past the agronomist…",
  ],
};

export default function FarmLoader({
  kind = "generic",
  inline = false,
  compact = false,
}: {
  kind?: keyof typeof PHRASES;
  inline?: boolean;
  compact?: boolean;
}) {
  const pool = PHRASES[kind] || PHRASES.generic;
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length));

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, 2400);
    return () => clearInterval(id);
  }, [pool]);

  const phrase = pool[idx];
  const dotSize = compact ? 7 : 9;
  const fontSize = compact ? 13 : 15;

  const container: React.CSSProperties = inline
    ? { display: "inline-flex", alignItems: "center", gap: 12 }
    : { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: compact ? 0 : "6px 0" };

  return (
    <div style={container} aria-live="polite" aria-label="Loading">
      <style>{`
        @keyframes trellis-pulse {
          0%, 80%, 100% { opacity: 0.35; transform: scale(0.88); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              background: i === 0 ? C.greenAccent : i === 1 ? C.chartreuse : C.gold,
              display: "inline-block",
              animation: `trellis-pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize,
        color: C.muted,
        fontStyle: "italic",
        letterSpacing: "0.005em",
        transition: "opacity 0.25s ease",
      }}>
        {phrase}
      </span>
    </div>
  );
}
