import { useEffect, useState } from "react";

// ── Stage display labels ───────────────────────────────────────────────────
const SL: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

// ── Types ──────────────────────────────────────────────────────────────────
interface PathwayStep {
  order: number;
  program_name: string;
  program_website?: string;
  category: string;
  action: string;
  why: string;
  fit_confidence?: "high" | "medium" | "exploratory";
  prepare?: string;
  timing: "now" | "next_month" | "next_quarter" | "horizon";
  horizon?: boolean;
}

interface PathwayData {
  pathway_title: string;
  summary: string;
  steps: PathwayStep[];
  gap_warning: string | null;
  next_stage_note: string | null;
}

interface PathwayResponse {
  pathway: PathwayData;
  meta: {
    stage: string;
    nextStage: string;
    provinces: string[];
    need: string;
    programsConsidered: number;
    gapInfo: Record<string, number>;
  };
}

interface Props {
  description: string;
  stage: string;
  provinces: string[];
  need: string;
  onChatFollowUp: (question: string) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Fund:  { label: "Funding",      color: "#1a5fb4", bg: "#dbeafe", icon: "💰" },
  Accel: { label: "Accelerator",  color: "#92400e", bg: "#fef3c7", icon: "🚀" },
  Pilot: { label: "Pilot Site",   color: "#166534", bg: "#dcfce7", icon: "🌾" },
  Event: { label: "Event",        color: "#9f1239", bg: "#ffe4e6", icon: "📅" },
  Org:   { label: "Industry Org", color: "#6b21a8", bg: "#f3e8ff", icon: "🏛" },
  Train: { label: "Training",     color: "#0e7490", bg: "#cffafe", icon: "📚" },
};

const TIMING_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  now:          { label: "Do now",       color: "#166534", bg: "#dcfce7" },
  next_month:   { label: "This month",   color: "#92400e", bg: "#fef3c7" },
  next_quarter: { label: "Next quarter", color: "#1a5fb4", bg: "#dbeafe" },
  horizon:      { label: "Horizon",      color: "#6b21a8", bg: "#f3e8ff" },
};

const CONFIDENCE: Record<string, { label: string; color: string; bg: string }> = {
  high:        { label: "Strong fit",  color: "#166534", bg: "#dcfce7" },
  medium:      { label: "Likely fit",  color: "#92400e", bg: "#fef3c7" },
  exploratory: { label: "Exploratory", color: "#6e6e73", bg: "#f0f0ec" },
};

// ── Loading messages ────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Scanning programs across Canada…",
  "Matching to your stage and province…",
  "Filtering by your primary need…",
  "Building your personalized pathway…",
];

// ── Component ──────────────────────────────────────────────────────────────
export default function PathwayCard({ description, stage, provinces, need, onChatFollowUp }: Props) {
  const [data, setData] = useState<PathwayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    setLoadingStep(0);

    // Phased loading messages
    const timers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 4500),
      setTimeout(() => setLoadingStep(3), 7000),
    ];

    fetch("/api/pathway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, stage, provinces, need }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: PathwayResponse) => {
        timers.forEach(clearTimeout);
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        timers.forEach(clearTimeout);
        setError("Failed to generate pathway. Try refreshing.");
        setLoading(false);
      });

    return () => timers.forEach(clearTimeout);
  }, [description, stage, provinces.join(","), need]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        margin: "16px", padding: "36px 24px",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)",
      }}>
        {/* Progress bar */}
        <div style={{
          height: 3, background: "var(--bg-tertiary)", borderRadius: 2,
          overflow: "hidden", marginBottom: 24,
        }}>
          <div style={{
            height: "100%", background: "var(--green-mid)",
            borderRadius: 2, transition: "width 2s ease",
            width: `${Math.min(25 + loadingStep * 25, 95)}%`,
          }} />
        </div>
        {/* Messages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LOADING_MESSAGES.map((msg, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: i <= loadingStep ? 1 : 0.25,
              transition: "opacity 0.5s ease",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: i < loadingStep ? "var(--green-mid)" : (i === loadingStep ? "var(--bg-tertiary)" : "var(--bg-secondary)"),
                border: i === loadingStep ? "2px solid var(--green-mid)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                {i < loadingStep && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {i === loadingStep && (
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "var(--green-mid)",
                    animation: "pulse 1.2s ease infinite",
                  }} />
                )}
              </div>
              <span style={{
                fontSize: "0.82rem", fontWeight: i <= loadingStep ? 600 : 400,
                color: i <= loadingStep ? "var(--text)" : "var(--text-tertiary)",
              }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{
        margin: "16px", padding: "28px 24px",
        background: "#fef2f2", border: "1px solid #fecaca",
        borderRadius: "var(--radius-lg)", textAlign: "center",
      }}>
        <div style={{ fontSize: "0.88rem", color: "#991b1b", fontWeight: 600, marginBottom: 10 }}>{error || "Something went wrong."}</div>
        <button
          onClick={() => { setError(""); setLoading(true); }}
          style={{
            background: "var(--green-mid)", color: "#fff", border: "none",
            borderRadius: "var(--radius-sm)", padding: "10px 20px",
            fontWeight: 600, fontSize: "0.82rem",
          }}
        >Try Again</button>
      </div>
    );
  }

  const { pathway, meta } = data;
  const stageLabel = SL[stage] || stage;
  const nextStageLabel = SL[meta.nextStage] || meta.nextStage;
  // Fix "Scale → Scale" — if same stage, show differently
  const titleOverride = stage === meta.nextStage
    ? `Your ${stageLabel} Growth Pathway`
    : `${stageLabel} → ${nextStageLabel}`;

  return (
    <div style={{
      margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: 0,
      animation: "fadeInUp 0.5s ease",
    }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #0a1f08 0%, #14330c 40%, #1e5510 100%)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        padding: "24px 22px 20px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle texture overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <div style={{ position: "relative" }}>
          {/* Top label */}
          <div style={{
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)", marginBottom: 6,
          }}>Your Innovation Pathway</div>

          {/* Title — large, readable */}
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em",
            color: "#fff", marginBottom: 10, lineHeight: 1.2,
          }}>{titleOverride}</h2>

          {/* Summary */}
          <p style={{
            fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65,
            maxWidth: 520,
          }}>{pathway.summary}</p>

          {/* Meta chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {provinces.map(p => (
              <span key={p} style={{
                fontSize: "0.62rem", fontWeight: 600, padding: "3px 10px", borderRadius: 100,
                background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              }}>{p}</span>
            ))}
            <span style={{
              fontSize: "0.62rem", fontWeight: 600, padding: "3px 10px", borderRadius: 100,
              background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
            }}>{meta.programsConsidered} programs analyzed</span>
          </div>
        </div>
      </div>

      {/* ── Gap warning ───────────────────────────────────────────────── */}
      {pathway.gap_warning && (
        <div style={{
          padding: "12px 22px",
          background: "#fffbeb",
          borderLeft: "3px solid #f59e0b",
          fontSize: "0.78rem", color: "#78350f", lineHeight: 1.55,
        }}>
          <strong style={{ fontWeight: 700 }}>Gap detected:</strong> {pathway.gap_warning}
        </div>
      )}

      {/* ── Steps ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderTop: "none",
      }}>
        {pathway.steps.map((step, i) => {
          const cat = CAT_STYLE[step.category] || CAT_STYLE.Org;
          const timing = TIMING_LABEL[step.timing] || TIMING_LABEL.now;
          const conf = step.fit_confidence ? CONFIDENCE[step.fit_confidence] : null;
          const isLast = i === pathway.steps.length - 1;
          const isHorizon = step.horizon || step.timing === "horizon";

          return (
            <div key={i} style={{
              padding: "16px 22px",
              borderBottom: isLast ? "none" : "1px solid var(--border)",
              display: "flex", gap: 14,
              opacity: isHorizon ? 0.65 : 1,
              background: isHorizon ? "var(--bg-secondary)" : "var(--bg)",
              animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
            }}>
              {/* Step number + connector */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 32, paddingTop: 2,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isHorizon ? "var(--bg-tertiary)" : cat.bg,
                  border: `2px solid ${isHorizon ? "var(--border)" : cat.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 800,
                  color: isHorizon ? "var(--text-tertiary)" : cat.color,
                }}>
                  {step.order}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 16, marginTop: 4,
                    background: isHorizon ? "var(--border)" : "var(--bg-tertiary)",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Program name */}
                <div style={{ marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                    {step.program_website ? (
                      <a href={step.program_website} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--green-mid)", textDecoration: "none", borderBottom: "1px solid rgba(30,107,10,0.2)" }}>
                        {step.program_name} ↗
                      </a>
                    ) : <span style={{ color: "var(--text)" }}>{step.program_name}</span>}
                  </span>
                </div>

                {/* Badges row */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                    background: cat.bg, color: cat.color,
                  }}>{cat.label}</span>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                    background: timing.bg, color: timing.color,
                  }}>{timing.label}</span>
                  {conf && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                      background: conf.bg, color: conf.color,
                    }}>{conf.label}</span>
                  )}
                </div>

                {/* Action */}
                <div style={{
                  fontSize: "0.82rem", fontWeight: 600, color: "var(--text)",
                  lineHeight: 1.5, marginBottom: 4,
                }}>
                  {step.action}
                </div>

                {/* Why */}
                <div style={{
                  fontSize: "0.78rem", color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}>
                  {step.why}
                </div>

                {/* Prepare */}
                {step.prepare && (
                  <div style={{
                    fontSize: "0.72rem", color: "var(--text-tertiary)",
                    lineHeight: 1.45, marginTop: 6,
                    padding: "6px 10px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "2px solid var(--bg-tertiary)",
                  }}>
                    <strong style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Prepare:</strong> {step.prepare}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Next stage note ───────────────────────────────────────────── */}
      {pathway.next_stage_note && (
        <div style={{
          padding: "12px 22px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55,
        }}>
          <strong style={{ fontWeight: 700, color: "var(--text)" }}>
            Looking ahead ({nextStageLabel}):
          </strong>{" "}
          {pathway.next_stage_note}
        </div>
      )}

      {/* ── Follow-up chips ───────────────────────────────────────────── */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          fontSize: "0.68rem", fontWeight: 700, color: "var(--text-tertiary)",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>Ask a follow-up</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(() => {
            const chips: { label: string; q: string }[] = [];
            const firstStep = pathway.steps[0];
            if (firstStep) {
              chips.push({
                label: `How do I approach ${firstStep.program_name.length > 28 ? firstStep.program_name.slice(0, 25) + "…" : firstStep.program_name}?`,
                q: `Tell me more about ${firstStep.program_name}. What exactly should I prepare before reaching out, and who should I contact?`,
              });
            }
            if (pathway.gap_warning) {
              chips.push({
                label: "How do I fill the gap?",
                q: "You flagged a gap in my pathway. What's the best workaround — are there national programs, neighboring provinces, or other approaches I should consider?",
              });
            }
            chips.push({
              label: "What am I missing?",
              q: `Beyond the programs in my pathway, what other resources, connections, or strategies should I be pursuing at the ${stageLabel} stage in ${provinces.join(", ")}?`,
            });
            if (pathway.steps.length > 2) {
              chips.push({
                label: "Prioritize for me",
                q: "If I only have bandwidth for 2 things this month, which steps in my pathway should I prioritize and why?",
              });
            }
            return chips.slice(0, 3).map((chip, i) => (
              <button key={i} onClick={() => onChatFollowUp(chip.q)}
                style={{
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", padding: "8px 14px",
                  fontSize: "0.78rem", fontWeight: 500, color: "var(--text)",
                  transition: "all 0.15s",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "var(--green-mid)"; t.style.boxShadow = "var(--shadow-md)"; t.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "var(--border)"; t.style.boxShadow = "var(--shadow-sm)"; t.style.transform = "translateY(0)"; }}
              >{chip.label}</button>
            ));
          })()}
        </div>

        {/* Share */}
        <button
          onClick={() => {
            const url = new URL(window.location.origin + "/navigator");
            url.searchParams.set("stage", stage);
            url.searchParams.set("prov", provinces.join(","));
            url.searchParams.set("need", need);
            navigator.clipboard.writeText(url.toString()).then(
              () => alert("Link copied! Share it with your advisor or team."),
              () => alert("Couldn't copy — try manually.")
            );
          }}
          style={{
            alignSelf: "flex-start", padding: "7px 14px",
            background: "none", color: "var(--text-tertiary)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", fontWeight: 500, fontSize: "0.72rem",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
        >📋 Copy shareable link</button>

        {/* Disclaimer */}
        <div style={{
          fontSize: "0.65rem", color: "var(--text-tertiary)", lineHeight: 1.5,
          marginTop: 4, fontStyle: "italic",
        }}>
          Built from public data — we're probably missing things. If a recommendation looks off, that's useful feedback too.
        </div>
      </div>
    </div>
  );
}
