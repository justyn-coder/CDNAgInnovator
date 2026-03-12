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
  Fund:  { label: "Funding",      color: "#1a4b8c", bg: "#e8f0fe", icon: "💰" },
  Accel: { label: "Accelerator",  color: "#8c5a1a", bg: "#fff3e0", icon: "🚀" },
  Pilot: { label: "Pilot Site",   color: "#1a6b2a", bg: "#e8f5e9", icon: "🌾" },
  Event: { label: "Event",        color: "#8c1a3a", bg: "#fce4ec", icon: "📅" },
  Org:   { label: "Industry Org", color: "#6a1a8c", bg: "#f3e5f5", icon: "🏛" },
  Train: { label: "Training",     color: "#1a6b7a", bg: "#e0f7fa", icon: "📚" },
};

const TIMING_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  now:          { label: "Do now",       color: "#166534", bg: "#dcfce7" },
  next_month:   { label: "This month",   color: "#854d0e", bg: "#fef9c3" },
  next_quarter: { label: "Next quarter", color: "#1a4b8c", bg: "#e8f0fe" },
  horizon:      { label: "Horizon",      color: "#6a1a8c", bg: "#f3e5f5" },
};

// ── Component ──────────────────────────────────────────────────────────────
export default function PathwayCard({ description, stage, provinces, need, onChatFollowUp }: Props) {
  const [data, setData] = useState<PathwayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
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
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to generate pathway. Try refreshing.");
        setLoading(false);
      });
  }, [description, stage, provinces.join(","), need]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        margin: "16px", padding: "32px 20px",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, margin: "0 auto 16px",
          border: "3px solid var(--bg-tertiary)", borderTop: "3px solid var(--green-mid)",
          borderRadius: "50%", animation: "spin 1s linear infinite",
        }} />
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", marginBottom: 4 }}>
          Building your pathway…
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          Analyzing {provinces.join(", ")} programs for {SL[stage] || stage}-stage companies
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div style={{
        margin: "16px", padding: "24px 20px",
        background: "#fef2f2", border: "1px solid #fecaca",
        borderRadius: "var(--radius)", textAlign: "center",
      }}>
        <div style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600, marginBottom: 8 }}>{error || "Something went wrong."}</div>
        <button
          onClick={() => { setError(""); setLoading(true); /* re-trigger useEffect by changing a dep */ }}
          style={{
            background: "var(--green-mid)", color: "#fff", border: "none",
            borderRadius: "var(--radius-sm)", padding: "8px 16px",
            fontWeight: 600, fontSize: "0.78rem",
          }}
        >Try Again</button>
      </div>
    );
  }

  const { pathway, meta } = data;

  return (
    <div style={{ margin: "12px 16px 0", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Pathway header card ────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f2410 0%, #1a3a0a 50%, #2d5016 100%)",
        borderRadius: "16px 16px 0 0",
        padding: "20px 18px 16px",
        color: "#fff",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M8 3l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              Your Innovation Pathway
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {pathway.pathway_title}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.55,
          paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {pathway.summary}
        </div>

        {/* Meta pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "3px 9px", borderRadius: 100,
            background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
          }}>{SL[stage] || stage} → {SL[meta.nextStage] || meta.nextStage}</span>
          {provinces.map(p => (
            <span key={p} style={{
              fontSize: "0.6rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100,
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
            }}>{p}</span>
          ))}
          <span style={{
            fontSize: "0.6rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100,
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
          }}>{meta.programsConsidered} programs analyzed</span>
        </div>
      </div>

      {/* ── Gap warning (if present) ──────────────────────────────────── */}
      {pathway.gap_warning && (
        <div style={{
          padding: "10px 18px",
          background: "#fef9c3",
          borderLeft: "3px solid #f59e0b",
          fontSize: "0.75rem", color: "#854d0e", lineHeight: 1.5,
        }}>
          <strong style={{ fontWeight: 700 }}>⚠ Gap detected:</strong> {pathway.gap_warning}
        </div>
      )}

      {/* ── Steps ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderTop: pathway.gap_warning ? "none" : "1px solid var(--border)",
        borderRadius: pathway.gap_warning ? "0" : "0",
      }}>
        {pathway.steps.map((step, i) => {
          const cat = CAT_STYLE[step.category] || CAT_STYLE.Org;
          const timing = TIMING_LABEL[step.timing] || TIMING_LABEL.now;
          const isLast = i === pathway.steps.length - 1;
          const isHorizon = step.horizon || step.timing === "horizon";

          return (
            <div key={i} style={{
              padding: "14px 18px",
              borderBottom: isLast ? "none" : "1px solid var(--border)",
              display: "flex", gap: 12,
              opacity: isHorizon ? 0.7 : 1,
              background: isHorizon ? "var(--bg-secondary)" : "var(--bg)",
            }}>
              {/* Step number / timeline */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 28, paddingTop: 2,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: isHorizon ? "var(--bg-tertiary)" : cat.bg,
                  border: `2px solid ${isHorizon ? "var(--border)" : cat.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800,
                  color: isHorizon ? "var(--text-tertiary)" : cat.color,
                }}>
                  {step.order}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20, marginTop: 4,
                    background: isHorizon ? "var(--border)" : "var(--bg-tertiary)",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Program name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)" }}>
                    {step.program_website ? (
                      <a href={step.program_website} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--green-mid)", textDecoration: "none" }}>
                        {step.program_name} ↗
                      </a>
                    ) : step.program_name}
                  </span>
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100,
                    background: cat.bg, color: cat.color,
                  }}>{cat.label}</span>
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100,
                    background: timing.bg, color: timing.color,
                  }}>{timing.label}</span>
                </div>

                {/* Action */}
                <div style={{
                  fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
                  lineHeight: 1.45, marginBottom: 3,
                }}>
                  {step.action}
                </div>

                {/* Why */}
                <div style={{
                  fontSize: "0.73rem", color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}>
                  {step.why}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Next stage note ───────────────────────────────────────────── */}
      {pathway.next_stage_note && (
        <div style={{
          padding: "10px 18px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          fontSize: "0.73rem", color: "var(--text-secondary)", lineHeight: 1.5,
        }}>
          <strong style={{ fontWeight: 700, color: "var(--text)" }}>Next stage ({SL[meta.nextStage] || meta.nextStage}):</strong>{" "}
          {pathway.next_stage_note}
        </div>
      )}

      {/* ── Actions bar ───────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap",
      }}>
        <button
          onClick={() => onChatFollowUp("Tell me more about the first step in my pathway. What exactly should I prepare before reaching out?")}
          style={{
            flex: "1 1 140px", padding: "10px 14px",
            background: "var(--green-mid)", color: "#fff", border: "none",
            borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.78rem",
          }}
        >Ask a follow-up question →</button>
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
            flex: "0 0 auto", padding: "10px 14px",
            background: "var(--bg-secondary)", color: "var(--text)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.78rem",
          }}
        >Copy link</button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
