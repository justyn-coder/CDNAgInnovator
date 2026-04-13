import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

// ── Copy link button with inline toast ─────────────────────────────────────
function CopyLinkButton({ stage, provinces, need, sector }: { stage: string; provinces: string[]; need: string; sector?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 relative">
      <button onClick={() => {
        const url = new URL(window.location.origin + "/navigator");
        url.searchParams.set("stage", stage); url.searchParams.set("prov", provinces.join(",")); url.searchParams.set("need", need);
        if (sector) url.searchParams.set("sector", sector);
        navigator.clipboard.writeText(url.toString()).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }, () => {});
      }}
        className="self-start px-3.5 py-[7px] bg-transparent text-text-tertiary border border-border rounded-sm font-medium text-[0.72rem] transition-colors duration-150 hover:text-text"
      >{copied ? "✓ Link copied!" : "📋 Copy shareable link"}</button>
      {copied && (
        <span className="ml-2.5 text-[0.72rem] text-brand-green font-medium animate-fade-in-up">
          Share it with your advisor or team
        </span>
      )}
    </div>
  );
}

// ── Stage display labels ───────────────────────────────────────────────────
const SL: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "Customers", Scale: "Scale",
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
    deterministicGaps?: string[];
  };
}

interface Props {
  description: string;
  stage: string;
  provinces: string[];
  sector?: string;
  need: string;
  onChatFollowUp: (question: string) => void;
  onReset?: () => void;
  needLabel?: string;
  expansionProvinces?: string[];
  completedPrograms?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { label: string; colorClass: string; bgClass: string; icon: string }> = {
  Fund:  { label: "Funding",      colorClass: "text-[#1a5fb4]", bgClass: "bg-[#dbeafe]", icon: "💰" },
  Accel: { label: "Accelerator",  colorClass: "text-[#92400e]", bgClass: "bg-[#fef3c7]", icon: "🚀" },
  Pilot: { label: "Pilot Site",   colorClass: "text-[#166534]", bgClass: "bg-[#dcfce7]", icon: "🌾" },
  Event: { label: "Event",        colorClass: "text-[#9f1239]", bgClass: "bg-[#ffe4e6]", icon: "📅" },
  Org:   { label: "Industry Org", colorClass: "text-[#6b21a8]", bgClass: "bg-[#f3e8ff]", icon: "🏛" },
  Train: { label: "Training",     colorClass: "text-[#0e7490]", bgClass: "bg-[#cffafe]", icon: "📚" },
};

const TIMING_LABEL: Record<string, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: string }> = {
  now:          { label: "Do now",       colorClass: "text-[#166534]", bgClass: "bg-[#dcfce7]", borderClass: "border-[#16653422]", icon: "⚡" },
  next_month:   { label: "This month",   colorClass: "text-[#92400e]", bgClass: "bg-[#fef3c7]", borderClass: "border-[#92400e22]", icon: "📅" },
  next_quarter: { label: "Next quarter", colorClass: "text-[#1a5fb4]", bgClass: "bg-[#dbeafe]", borderClass: "border-[#1a5fb422]", icon: "📅" },
  horizon:      { label: "Future",       colorClass: "text-[#6b21a8]", bgClass: "bg-[#f3e8ff]", borderClass: "border-[#6b21a822]", icon: "🔭" },
};

const CONFIDENCE: Record<string, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: string }> = {
  high:        { label: "Strong fit",  colorClass: "text-[#166534]", bgClass: "bg-[#dcfce7]", borderClass: "border-[#16653444]", icon: "✓" },
  medium:      { label: "Likely fit",  colorClass: "text-[#92400e]", bgClass: "bg-[#fef3c7]", borderClass: "border-[#92400e44]", icon: "~" },
  exploratory: { label: "Exploratory", colorClass: "text-[#555560]", bgClass: "bg-[#f0f0ec]", borderClass: "border-[#55556044]", icon: "?" },
};

// ── Loading messages ────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Scanning programs across Canada\u2026",
  "Filtering by stage, province, and sector…",
  "Filtering by your primary need…",
  "Building your personalized pathway…",
];

// ── Stage Journey Bar ───────────────────────────────────────────────────────
function StageJourney({ current, next }: { current: string; next: string }) {
  const currentIdx = STAGE_ORDER.indexOf(current);

  return (
    <div className="mt-4 max-w-full overflow-hidden">
      <div className="grid grid-cols-5">
        {STAGE_ORDER.map((s, i) => {
          const isCurrent = s === current;
          const isNext = s === next && s !== current;
          const isPast = i < currentIdx;
          const isFirst = i === 0;
          const isLast = i === STAGE_ORDER.length - 1;

          // Connector color for the segment leaving this cell (right half)
          const rightColor = i < currentIdx ? "bg-white/50"
            : i === currentIdx ? "bg-brand-chartreuse" : "bg-white/20";
          // Connector color for the segment entering this cell (left half)
          const leftColor = i <= currentIdx ? "bg-white/50"
            : i === currentIdx + 1 ? "bg-white/30" : "bg-white/20";

          return (
            <div key={s} className="flex flex-col items-center min-w-0">
              {/* Circle row with self-contained connector segments */}
              <div className="relative flex items-center justify-center w-full" style={{ height: 36 }}>
                {/* Left connector: from left edge to center */}
                {!isFirst && (
                  <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-1/2", leftColor)} />
                )}
                {/* Right connector: from center to right edge */}
                {!isLast && (
                  <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-1/2", rightColor)} />
                )}
                {/* Circle — on top of connectors */}
                <div className={cn(
                  "rounded-full flex items-center justify-center shrink-0 transition-all duration-300 relative z-10",
                  isCurrent && "w-9 h-9 bg-brand-green border-[2.5px] border-brand-chartreuse text-[0.85rem] shadow-[0_0_16px_rgba(140,198,63,0.35)] text-white/70",
                  isPast && "w-[26px] h-[26px] bg-white/35 border-2 border-white/50 text-[0.6rem] text-white/[0.87]",
                  isNext && "w-[26px] h-[26px] border-2 border-dashed border-white/60 text-[0.6rem] text-white/70 animate-stage-pulse bg-[#1B4332]",
                  !isCurrent && !isPast && !isNext && "w-[26px] h-[26px] border-2 border-white/30 text-[0.6rem] text-white/70 bg-[#1B4332]",
                )}>
                  {isCurrent ? STAGE_ICONS[s] : isPast ? "✓" : isNext ? STAGE_ICONS[s] : ""}
                </div>
              </div>
              {/* Label — centered in same grid column as circle */}
              <span className={cn(
                "text-[0.65rem] sm:text-[0.7rem] text-center leading-tight mt-1",
                isCurrent && "font-bold text-white",
                isNext && "font-semibold text-white/90",
                isPast && "font-normal text-white/[0.82]",
                !isCurrent && !isNext && !isPast && "font-normal text-white/70",
              )}>{SL[s] || s}</span>
            </div>
          );
        })}
      </div>
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
    <div
      className={cn(
        "px-3.5 md:px-[22px] py-4 flex gap-3.5 min-w-0",
        !isLast && "border-b border-border",
        isHorizon ? "opacity-75 bg-bg-secondary" : "bg-bg",
      )}
      style={{ animation: `fadeInUp 0.4s ease ${animDelay}s both` }}
    >
      <div className="flex flex-col items-center min-w-8 pt-0.5">
        <div className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.7rem] font-extrabold",
          isHorizon
            ? "bg-bg-tertiary border-border text-text-tertiary"
            : cn(cat.bgClass, cat.colorClass),
        )}
          style={!isHorizon ? { borderColor: "currentColor" } : undefined}
        >
          {step.order}
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 min-h-4 mt-1",
            isHorizon ? "bg-border" : "bg-bg-tertiary",
          )} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-[3px]">
          <span className="font-bold text-[0.88rem]">
            {step.program_website ? (
              <a href={step.program_website} target="_blank" rel="noopener noreferrer"
                className="text-brand-green no-underline border-b border-[rgba(45,122,79,0.2)] hover:border-brand-green">
                {step.program_name} ↗
              </a>
            ) : <span className="text-text">{step.program_name}</span>}
          </span>
        </div>

        <div className="flex gap-[5px] flex-wrap mb-2">
          <span className={cn(
            "text-[0.6rem] font-bold px-2 py-[2px] rounded-full",
            cat.bgClass, cat.colorClass,
          )}>{cat.icon} {cat.label}</span>
          <span className={cn(
            "text-[0.6rem] font-bold px-2 py-[2px] rounded-full border",
            timing.bgClass, timing.colorClass, timing.borderClass,
          )}>{timing.icon} {timing.label}</span>
          {conf && (
            <span className={cn(
              "text-[0.6rem] font-semibold px-2 py-[2px] rounded-full border border-dashed",
              conf.bgClass, conf.colorClass, conf.borderClass,
            )}>{conf.icon} {conf.label}</span>
          )}
        </div>

        <div className="text-[0.82rem] font-semibold text-text leading-[1.5] mb-1">
          {step.action}
        </div>

        <div className="text-[0.78rem] text-text-secondary leading-[1.55]">
          {step.why}
        </div>

        {step.prepare && (
          <div className={cn(
            "text-[0.72rem] text-text-tertiary leading-[1.45] mt-1.5 p-[6px_10px] rounded-sm border-l-2",
            isHorizon ? "bg-bg-tertiary border-l-border" : "bg-bg-secondary border-l-bg-tertiary",
          )}>
            <strong className="font-semibold text-text-secondary">Prepare:</strong> {step.prepare}
          </div>
        )}

        {step.order === 1 && !isHorizon && (
          <button
            onClick={() => onFollowUp(`Tell me more about ${step.program_name}. What exactly should I prepare before reaching out, and who should I contact?`)}
            className="mt-2 px-3 py-[5px] bg-transparent border border-brand-gold rounded-full text-[0.68rem] font-semibold text-brand-gold transition-all duration-150 hover:bg-brand-gold hover:text-brand-forest"
          >
            Tell me how to approach this →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Email Capture ───────────────────────────────────────────────────────────
function EmailCapture({ stage, provinces, description, productType }: {
  stage: string; provinces: string[]; description: string; productType?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem("trellis_email_asked"); } catch { return false; }
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed || submitted) return;
    const timer = setTimeout(() => setVisible(true), 20000);
    return () => clearTimeout(timer);
  }, [dismissed, submitted]);

  if (!visible || dismissed) return null;

  if (submitted) return (
    <div
      className="mt-4 animate-fade-in-up"
      style={{
        background: "#E8F5E9",
        border: "0.5px solid rgba(76,175,80,0.3)",
        borderRadius: 10,
        padding: "16px 16px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: "#2E7D32" }}>
        ✓ You're signed up! We'll notify you when new programs match your profile.
      </div>
    </div>
  );

  async function submit() {
    if (!email.trim()) return;
    try {
      const resp = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programName: "EMAIL_SIGNUP",
          bestFor: `Stage: ${stage}, Province: ${provinces.join(",")}, Product: ${productType || "unknown"}, Building: ${description}`,
          submitterName: "email-signup",
          submitterEmail: email.trim(),
        }),
      });
      if (!resp.ok) throw new Error();
      setSubmitted(true);
      try { localStorage.setItem("trellis_email_asked", "true"); } catch {}
    } catch { alert("Something went wrong — please try again."); }
  }

  return (
    <div
      className="mt-4 relative animate-fade-in-up"
      style={{
        background: "#FFF8E7",
        border: "0.5px solid rgba(212,168,40,0.2)",
        borderRadius: 10,
        padding: "16px 16px",
      }}
    >
      <button
        onClick={() => { setDismissed(true); try { localStorage.setItem("trellis_email_asked", "true"); } catch {} }}
        className="absolute top-3 right-3 bg-transparent border-none cursor-pointer"
        style={{ fontSize: 12, color: "#999" }}
      >✕</button>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18", marginBottom: 8 }}>
        Want updates when new programs match your profile?
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          type="email"
          className="outline-none font-sans flex-1 min-w-0"
          style={{
            border: "0.5px solid #E5E5E0",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            maxWidth: 200,
            background: "white",
          }}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
        />
        <button
          onClick={submit}
          style={{
            background: "#D4A828",
            color: "#1B4332",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            padding: "8px 16px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >Notify me</button>
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
        We check weekly. No spam. Unsubscribe anytime.
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PathwayCard({ description, stage, provinces, sector, need, onChatFollowUp, onReset, needLabel, expansionProvinces, completedPrograms }: Props) {
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
      body: JSON.stringify({ description, stage, provinces, need, sector }),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: PathwayResponse) => { timers.forEach(clearTimeout); setData(d); setLoading(false); })
      .catch(() => { timers.forEach(clearTimeout); setError("We hit a temporary issue generating your pathway. Your answers are saved — click below to try again."); setLoading(false); });

    return () => timers.forEach(clearTimeout);
  }, [description, stage, provinces.join(","), need, sector]);

  if (loading) {
    return (
      <div className="m-4 px-4 md:px-6 py-9 bg-bg border border-border rounded-lg shadow-md overflow-hidden box-border max-w-full" style={{ maxWidth: "calc(100% - 2rem)", overflowWrap: "break-word" }}>
        <div className="h-[3px] bg-bg-tertiary rounded-[2px] overflow-hidden mb-6">
          <div
            className="h-full bg-brand-green rounded-[2px] transition-[width] duration-2000 ease-in-out"
            style={{ width: `${Math.min(25 + loadingStep * 25, 95)}%` }}
          />
        </div>
        <div className="flex flex-col gap-2">
          {LOADING_MESSAGES.map((msg, i) => (
            <div key={i} className={cn(
              "flex items-center gap-2.5 transition-opacity duration-500",
              i <= loadingStep ? "opacity-100" : "opacity-25",
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all duration-300",
                i < loadingStep && "bg-brand-green",
                i === loadingStep && "bg-bg-tertiary border-2 border-brand-green",
                i > loadingStep && "bg-bg-secondary",
              )}>
                {i < loadingStep && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {i === loadingStep && <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-dot" />}
              </div>
              <span className={cn(
                "text-[0.82rem]",
                i <= loadingStep ? "font-semibold text-text" : "font-normal text-text-tertiary",
              )}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="m-4 px-4 md:px-6 py-7 bg-red-soft border border-[#fecaca] rounded-lg text-center" style={{ maxWidth: "calc(100% - 2rem)" }}>
        <div className="text-[0.88rem] text-[#991b1b] font-semibold mb-2.5">
          {error || "Something went wrong."}
        </div>
        <button
          onClick={() => { setError(""); setLoading(true); }}
          className="bg-brand-gold text-brand-forest border-none rounded-sm px-5 py-2.5 font-semibold text-[0.82rem]"
        >
          Try Again
        </button>
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
    <div className="mx-4 mt-3 flex flex-col animate-fade-in-up overflow-hidden max-w-full" style={{ maxWidth: "calc(100% - 2rem)", overflowWrap: "break-word", wordBreak: "break-word" }}>

      {/* ── Header with Stage Journey ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#122b1f] via-[#1B4332] to-[#245940] rounded-t-lg px-4 md:px-[22px] pt-6 pb-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[0.62rem] font-bold tracking-[0.12em] uppercase text-white/[0.82]">
              Your Innovation Pathway
            </div>
            {onReset && (
              <button onClick={onReset} className="bg-transparent border-none text-[0.68rem] text-white/50 underline cursor-pointer p-0">
                Start over
              </button>
            )}
          </div>
          <h2 className="font-display text-[1.35rem] font-normal tracking-tight text-white mb-2.5 leading-[1.2]">
            {titleOverride}
          </h2>
          <p className="text-[0.85rem] text-white/90 leading-[1.65] max-w-full md:max-w-[520px]">
            {pathway.summary}
          </p>
          <div className="flex gap-1.5 flex-wrap mt-3">
            <span className="text-[0.62rem] font-semibold px-2.5 py-[3px] rounded-full bg-white/15 text-white/[0.87]">
              {provinces.join(", ")} · {SL[stage] || stage}{needLabel ? ` · ${needLabel}` : ""}
            </span>
            <span className="text-[0.62rem] font-semibold px-2.5 py-[3px] rounded-full bg-white/15 text-white/[0.87]">
              {meta.programsConsidered} programs analyzed
            </span>
          </div>
          <StageJourney current={stage} next={meta.nextStage} />
        </div>
      </div>

      {/* ── Gap warnings (AI-generated + deterministic) ────────────── */}
      {pathway.gap_warning && (
        <div className="px-4 md:px-[22px] py-3 bg-[#fffbeb] border-l-[3px] border-l-amber text-[0.78rem] text-[#78350f] leading-[1.55]">
          <strong className="font-bold">⚠ Gap detected:</strong> {pathway.gap_warning}
        </div>
      )}
      {meta.deterministicGaps && (meta.deterministicGaps as string[]).length > 0 && !pathway.gap_warning && (
        <div className="px-4 md:px-[22px] py-3 bg-[#f0f9ff] border-l-[3px] border-l-[#0284c7] text-[0.78rem] text-[#0c4a6e] leading-[1.55]">
          <strong className="font-bold">Ecosystem note:</strong>{" "}
          {(meta.deterministicGaps as string[]).join(" ")}
        </div>
      )}

      {/* ── Current Stage Steps ───────────────────────────────────────── */}
      {currentSteps.length > 0 && (
        <div className="bg-bg border border-border border-t-0">
          <div className="px-4 md:px-[22px] py-2.5 bg-gradient-to-r from-green-soft to-bg border-b border-border flex items-center gap-2">
            <span className="text-[0.85rem]">🎯</span>
            <span className="text-[0.7rem] font-bold tracking-[0.06em] uppercase text-brand-green">Your next moves</span>
          </div>
          {currentSteps.map((step, i) => (
            <StepCard key={`c-${i}`} step={step} isLast={i === currentSteps.length - 1 && futureSteps.length === 0} isHorizon={false} animDelay={i * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Future Stage Steps ────────────────────────────────────────── */}
      {futureSteps.length > 0 && (
        <div className={cn("bg-bg-secondary border border-border", currentSteps.length > 0 && "border-t-0")}>
          <div className="px-4 md:px-[22px] py-2.5 bg-gradient-to-r from-[#f3e8ff] to-bg-secondary border-b border-border flex items-center gap-2">
            <span className="text-[0.85rem]">🔭</span>
            <span className="text-[0.7rem] font-bold tracking-[0.06em] uppercase text-[#6b21a8]">Looking ahead</span>
          </div>
          {futureSteps.map((step, i) => (
            <StepCard key={`f-${i}`} step={step} isLast={i === futureSteps.length - 1} isHorizon={true} animDelay={(currentSteps.length + i) * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Next stage note ───────────────────────────────────────────── */}
      {pathway.next_stage_note && (
        <div className="px-4 md:px-[22px] py-3 bg-bg-secondary border border-border border-t-0 rounded-b-lg text-[0.78rem] text-text-secondary leading-[1.55]">
          <strong className="font-bold text-text">When you reach {nextStageLabel}:</strong>{" "}
          {pathway.next_stage_note}
        </div>
      )}

      {/* ── Shareable link ─────────────────────────────────────────────── */}
      <CopyLinkButton stage={stage} provinces={provinces} need={need} sector={sector} />

      {/* ── Thin-pathway note (Scale stage, <4 strong fits) ──────────── */}
      {(() => {
        const strongFits = pathway.steps.filter(s => s.fit_confidence === "high" && !s.horizon);
        if (strongFits.length < 4 && (stage === "Scale" || stage === "Comm")) {
          const thinChips = [
            { label: "Pilot sites in other provinces", q: "What pilot sites and test facilities exist in provinces I'm not currently operating in?" },
            { label: "Later-stage funding in Canada", q: "What later-stage funding options exist for growth-stage agtech companies in Canada?" },
            { label: "International expansion programs", q: "What programs help Canadian agtech companies expand internationally?" },
            { label: "Who's funding agtech hardware?", q: "Who is actively investing in agtech hardware companies in Canada and globally?" },
          ];
          return (
            <div
              className="mt-4 mx-0"
              style={{ background: "#F5F3ED", border: "0.5px solid #E5E5E0", borderRadius: 12, padding: "16px 14px" }}
            >
              <div style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 12 }}>
                At your stage, structured programs thin out. But Trellis can still help — try asking:
              </div>
              <div className="flex gap-2 flex-wrap">
                {thinChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => onChatFollowUp(chip.q)}
                    className="transition-all duration-150 cursor-pointer"
                    style={{
                      background: "white",
                      border: "0.5px solid #E5E5E0",
                      borderRadius: 20,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#1B4332",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFF8E7"; e.currentTarget.style.borderColor = "#D4A828"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E5E5E0"; }}
                  >{chip.label}</button>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* ── Chat CTA (Kevin's #1 issue: didn't know chat existed) ──── */}
      {pathway.steps.length > 0 && (
        <div
          className="mt-5 mx-0 cursor-pointer group"
          style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D5A45 100%)", borderRadius: 12, padding: "18px 18px" }}
          onClick={() => onChatFollowUp("What should I focus on first from my pathway, and what should I prepare?")}
        >
          <div className="flex items-center gap-3">
            <span className="text-[1.5rem]">💬</span>
            <div>
              <div className="text-white font-bold text-[0.88rem] mb-0.5">Want to go deeper?</div>
              <div className="text-white/70 text-[0.78rem] leading-snug">
                Ask Trellis anything about these programs, your strategy, or what to prepare. The chat below knows your full profile.
              </div>
            </div>
            <span className="text-white/50 text-[1.2rem] ml-auto group-hover:text-white transition-colors">↓</span>
          </div>
        </div>
      )}

      {/* ── Email capture (only after successful pathway with steps) ── */}
      {pathway.steps.length > 0 && <EmailCapture stage={stage} provinces={provinces} description={description} />}
    </div>
  );
}
