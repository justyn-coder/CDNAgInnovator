import { useEffect, useState } from "react";

// ── Stage display labels ───────────────────────────────────────────────────
const SL: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};
const STAGE_ORDER = ["Idea", "MVP", "Pilot", "Comm", "Scale"];
const STAGE_ICONS: Record<string, string> = {
  Idea: "💡", MVP: "🔧", Pilot: "🌾", Comm: "🤝", Scale: "📈",
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

const TIMING_LABEL: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  now:          { label: "Do now",       color: "#166534", bg: "#dcfce7", icon: "⚡" },
  next_month:   { label: "This month",   color: "#92400e", bg: "#fef3c7", icon: "📅" },
  next_quarter: { label: "Next quarter", color: "#1a5fb4", bg: "#dbeafe", icon: "📅" },
  horizon:      { label: "Future",       color: "#6b21a8", bg: "#f3e8ff", icon: "🔭" },
};

const CONFIDENCE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  high:        { label: "Strong fit",  color: "#166534", bg: "#dcfce7", icon: "✓" },
  medium:      { label: "Likely fit",  color: "#92400e", bg: "#fef3c7", icon: "~" },
  exploratory: { label: "Exploratory", color: "#6e6e73", bg: "#f0f0ec", icon: "?" },
};

// ── Loading messages ────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Scanning programs across Canada…",
  "Matching to your stage and province…",
  "Filtering by your primary need…",
  "Building your personalized pathway…",
];

// ── Stage Journey Bar ───────────────────────────────────────────────────────
function StageJourney({ current, next }: { current: string; next: string }) {
  const currentIdx = STAGE_ORDER.indexOf(current);
  const nextIdx = STAGE_ORDER.indexOf(next);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 0,
      padding: "0 4px", marginTop: 16,
    }}>
      {STAGE_ORDER.map((s, i) => {
        const isCurrent = s === current;
        const isNext = s === next && s !== current;
        const isPast = i < currentIdx;

        return (
          <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: i < STAGE_ORDER.length - 1 ? 1 : "none" }}>
            {/* Stage dot */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              paddingTop: isCurrent ? 0 : 5,
            }}>
              <div style={{
                width: isCurrent ? 36 : 26,
                height: isCurrent ? 36 : 26,
                borderRadius: "50%",
                background: isCurrent
                  ? "var(--green-mid)"
                  : isPast
                    ? "rgba(255,255,255,0.25)"
                    : isNext
                      ? "transparent"
                      : "rgba(255,255,255,0.06)",
                border: isCurrent
                  ? "2.5px solid var(--green-accent)"
                  : isNext
                    ? "2px dashed rgba(255,255,255,0.4)"
                    : isPast
                      ? "2px solid rgba(255,255,255,0.25)"
                      : "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCurrent ? "0.85rem" : "0.6rem",
                transition: "all 0.3s ease",
                boxShadow: isCurrent ? "0 0 16px rgba(61,204,26,0.35)" : "none",
                animation: isNext ? "stagePulse 2s ease-in-out infinite" : "none",
                color: isPast ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
              }}>
                {isCurrent ? STAGE_ICONS[s] : isPast ? "✓" : isNext ? STAGE_ICONS[s] : ""}
              </div>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: isCurrent ? 700 : isNext ? 600 : 400,
                color: isCurrent
                  ? "#fff"
                  : isNext
                    ? "rgba(255,255,255,0.75)"
                    : isPast
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(255,255,255,0.25)",
                whiteSpace: "nowrap",
              }}>{SL[s] || s}</span>
              {isCurrent && (
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700,
                  color: "var(--green-accent)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  marginTop: -2,
                }}>YOU ARE HERE</span>
              )}
            </div>
            {/* Connector line */}
            {i < STAGE_ORDER.length - 1 && (
              <div style={{
                flex: 1, height: 2, minWidth: 8,
                background: i < currentIdx
                  ? "rgba(255,255,255,0.25)"
                  : i === currentIdx
                    ? "linear-gradient(90deg, var(--green-accent), rgba(255,255,255,0.12))"
                    : "rgba(255,255,255,0.06)",
                marginTop: 17,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ step, isLast, isHorizon, animDelay, onFollowUp }: {
  step: PathwayStep; isLast: boolean; isHorizon: boolean; animDelay: number;
  onFollowUp: (q: string) => void;
}) {
  const cat = CAT_STYLE[step.category] || CAT_STYLE.Org;
  const timing = TIMING_LABEL[step.timing] || TIMING_LABEL.now;
  const conf = step.fit_confidence ? CONFIDENCE[step.fit_confidence] : null;

  return (
    <div style={{
      padding: "16px 22px",
      borderBottom: isLast ? "none" : "1px solid var(--border)",
      display: "flex", gap: 14,
      opacity: isHorizon ? 0.75 : 1,
      background: isHorizon ? "var(--bg-secondary)" : "var(--bg)",
      animation: `fadeInUp 0.4s ease ${animDelay}s both`,
    }}>
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

      <div style={{ flex: 1, minWidth: 0 }}>
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

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
            background: cat.bg, color: cat.color,
          }}>{cat.icon} {cat.label}</span>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
            background: timing.bg, color: timing.color,
            border: `1px solid ${timing.color}22`,
          }}>{timing.icon} {timing.label}</span>
          {conf && (
            <span style={{
              fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: 100,
              background: conf.bg, color: conf.color,
              border: `1px dashed ${conf.color}44`,
            }}>{conf.icon} {conf.label}</span>
          )}
        </div>

        <div style={{
          fontSize: "0.82rem", fontWeight: 600, color: "var(--text)",
          lineHeight: 1.5, marginBottom: 4,
        }}>{step.action}</div>

        <div style={{
          fontSize: "0.78rem", color: "var(--text-secondary)",
          lineHeight: 1.55,
        }}>{step.why}</div>

        {step.prepare && (
          <div style={{
            fontSize: "0.72rem", color: "var(--text-tertiary)",
            lineHeight: 1.45, marginTop: 6,
            padding: "6px 10px",
            background: isHorizon ? "var(--bg-tertiary)" : "var(--bg-secondary)",
            borderRadius: "var(--radius-sm)",
            borderLeft: `2px solid ${isHorizon ? "var(--border)" : "var(--bg-tertiary)"}`,
          }}>
            <strong style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Prepare:</strong> {step.prepare}
          </div>
        )}

        {step.order === 1 && !isHorizon && (
          <button
            onClick={() => onFollowUp(`Tell me more about ${step.program_name}. What exactly should I prepare before reaching out, and who should I contact?`)}
            style={{
              marginTop: 8, padding: "5px 12px",
              background: "none", border: "1px solid var(--green-mid)",
              borderRadius: 100, fontSize: "0.68rem", fontWeight: 600,
              color: "var(--green-mid)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "var(--green-mid)"; t.style.color = "#fff"; }}
            onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "none"; t.style.color = "var(--green-mid)"; }}
          >
            Tell me how to approach this →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PathwayCard({ description, stage, provinces, need, onChatFollowUp }: Props) {
  const [data, setData] = useState<PathwayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    setLoadingStep(0);
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
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: PathwayResponse) => { timers.forEach(clearTimeout); setData(d); setLoading(false); })
      .catch(() => { timers.forEach(clearTimeout); setError("Failed to generate pathway. Try refreshing."); setLoading(false); });

    return () => timers.forEach(clearTimeout);
  }, [description, stage, provinces.join(","), need]);

  if (loading) {
    return (
      <div style={{
        margin: "16px", padding: "36px 24px",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)",
      }}>
        <div style={{ height: 3, background: "var(--bg-tertiary)", borderRadius: 2, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", background: "var(--green-mid)", borderRadius: 2, transition: "width 2s ease", width: `${Math.min(25 + loadingStep * 25, 95)}%` }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LOADING_MESSAGES.map((msg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= loadingStep ? 1 : 0.25, transition: "opacity 0.5s ease" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: i < loadingStep ? "var(--green-mid)" : (i === loadingStep ? "var(--bg-tertiary)" : "var(--bg-secondary)"),
                border: i === loadingStep ? "2px solid var(--green-mid)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s",
              }}>
                {i < loadingStep && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {i === loadingStep && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-mid)", animation: "pulse 1.2s ease infinite" }} />}
              </div>
              <span style={{ fontSize: "0.82rem", fontWeight: i <= loadingStep ? 600 : 400, color: i <= loadingStep ? "var(--text)" : "var(--text-tertiary)" }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ margin: "16px", padding: "28px 24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
        <div style={{ fontSize: "0.88rem", color: "#991b1b", fontWeight: 600, marginBottom: 10 }}>{error || "Something went wrong."}</div>
        <button onClick={() => { setError(""); setLoading(true); }} style={{ background: "var(--green-mid)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "10px 20px", fontWeight: 600, fontSize: "0.82rem" }}>Try Again</button>
      </div>
    );
  }

  const { pathway, meta } = data;
  const stageLabel = SL[stage] || stage;
  const nextStageLabel = SL[meta.nextStage] || meta.nextStage;
  const titleOverride = stage === meta.nextStage ? `Your ${stageLabel} Growth Pathway` : `${stageLabel} → ${nextStageLabel}`;

  const currentSteps = pathway.steps.filter(s => !s.horizon && s.timing !== "horizon");
  const futureSteps = pathway.steps.filter(s => s.horizon || s.timing === "horizon");

  return (
    <div style={{ margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: 0, animation: "fadeInUp 0.5s ease" }}>

      {/* ── Header with Stage Journey ──────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #0a1f08 0%, #14330c 40%, #1e5510 100%)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        padding: "24px 22px 16px", color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Your Innovation Pathway</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em", color: "#fff", marginBottom: 10, lineHeight: 1.2 }}>{titleOverride}</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 520 }}>{pathway.summary}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {provinces.map(p => (
              <span key={p} style={{ fontSize: "0.62rem", fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{p}</span>
            ))}
            <span style={{ fontSize: "0.62rem", fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{meta.programsConsidered} programs analyzed</span>
          </div>
          <StageJourney current={stage} next={meta.nextStage} />
        </div>
      </div>

      {/* ── Gap warning ───────────────────────────────────────────────── */}
      {pathway.gap_warning && (
        <div style={{ padding: "12px 22px", background: "#fffbeb", borderLeft: "3px solid #f59e0b", fontSize: "0.78rem", color: "#78350f", lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 700 }}>⚠ Gap detected:</strong> {pathway.gap_warning}
        </div>
      )}

      {/* ── Current Stage Steps ───────────────────────────────────────── */}
      {currentSteps.length > 0 && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}>
          <div style={{
            padding: "10px 22px",
            background: "linear-gradient(90deg, var(--green-soft), var(--bg))",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: "0.85rem" }}>🎯</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--green-mid)" }}>Your next moves</span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-tertiary)", fontWeight: 500 }}>— {stageLabel} stage</span>
          </div>
          {currentSteps.map((step, i) => (
            <StepCard key={`c-${i}`} step={step} isLast={i === currentSteps.length - 1 && futureSteps.length === 0} isHorizon={false} animDelay={i * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Future Stage Steps ────────────────────────────────────────── */}
      {futureSteps.length > 0 && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderTop: currentSteps.length > 0 ? "none" : undefined }}>
          <div style={{
            padding: "10px 22px",
            background: "linear-gradient(90deg, #f3e8ff, var(--bg-secondary))",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: "0.85rem" }}>🔭</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6b21a8" }}>Looking ahead</span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-tertiary)", fontWeight: 500 }}>— {nextStageLabel} stage</span>
          </div>
          {futureSteps.map((step, i) => (
            <StepCard key={`f-${i}`} step={step} isLast={i === futureSteps.length - 1} isHorizon={true} animDelay={(currentSteps.length + i) * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Next stage note ───────────────────────────────────────────── */}
      {pathway.next_stage_note && (
        <div style={{
          padding: "12px 22px", background: "var(--bg-secondary)",
          border: "1px solid var(--border)", borderTop: "none",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55,
        }}>
          <strong style={{ fontWeight: 700, color: "var(--text)" }}>When you reach {nextStageLabel}:</strong>{" "}
          {pathway.next_stage_note}
        </div>
      )}

      {/* ── Follow-up chips ───────────────────────────────────────────── */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Continue the conversation</div>
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
              chips.push({ label: "How do I fill the gap?", q: "You flagged a gap in my pathway. What's the best workaround — are there national programs, neighboring provinces, or other approaches I should consider?" });
            }
            chips.push({ label: "What am I missing?", q: `Beyond the programs in my pathway, what other resources, connections, or strategies should I be pursuing at the ${stageLabel} stage in ${provinces.join(", ")}?` });
            if (pathway.steps.length > 2) {
              chips.push({ label: "Prioritize for me", q: "If I only have bandwidth for 2 things this month, which steps in my pathway should I prioritize and why?" });
            }
            chips.push({ label: "Write me an outreach email", q: `Write me a concise outreach email to ${firstStep?.program_name || "the first program"} introducing what I'm building and asking about next steps.` });
            return chips.slice(0, 4).map((chip, i) => (
              <button key={i} onClick={() => onChatFollowUp(chip.q)} style={{
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "8px 14px",
                fontSize: "0.78rem", fontWeight: 500, color: "var(--text)",
                transition: "all 0.15s", boxShadow: "var(--shadow-sm)",
              }}
                onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "var(--green-mid)"; t.style.boxShadow = "var(--shadow-md)"; t.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "var(--border)"; t.style.boxShadow = "var(--shadow-sm)"; t.style.transform = "translateY(0)"; }}
              >{chip.label}</button>
            ));
          })()}
        </div>

        <button onClick={() => {
          const url = new URL(window.location.origin + "/navigator");
          url.searchParams.set("stage", stage); url.searchParams.set("prov", provinces.join(",")); url.searchParams.set("need", need);
          navigator.clipboard.writeText(url.toString()).then(() => alert("Link copied! Share it with your advisor or team."), () => alert("Couldn't copy — try manually."));
        }} style={{
          alignSelf: "flex-start", padding: "7px 14px",
          background: "none", color: "var(--text-tertiary)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", fontWeight: 500, fontSize: "0.72rem", transition: "color 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}
        >📋 Copy shareable link</button>

        <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", lineHeight: 1.5, marginTop: 4, fontStyle: "italic" }}>
          Built from public data — we're probably missing things. If a recommendation looks off, that's useful feedback too.
        </div>
      </div>

      <style>{`
        @keyframes stagePulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
