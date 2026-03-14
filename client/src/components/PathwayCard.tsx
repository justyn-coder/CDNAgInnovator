import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

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
  "Scanning programs across Canada…",
  "Matching to your stage and province…",
  "Filtering by your primary need…",
  "Building your personalized pathway…",
];

// ── Stage Journey Bar ───────────────────────────────────────────────────────
function StageJourney({ current, next }: { current: string; next: string }) {
  const currentIdx = STAGE_ORDER.indexOf(current);

  return (
    <div className="flex items-start px-1 mt-4">
      {STAGE_ORDER.map((s, i) => {
        const isCurrent = s === current;
        const isNext = s === next && s !== current;
        const isPast = i < currentIdx;

        return (
          <div key={s} className={cn("flex items-start", i < STAGE_ORDER.length - 1 ? "flex-1" : "flex-none")}>
            {/* Stage dot */}
            <div className={cn(
              "flex flex-col items-center gap-[3px]",
              isCurrent ? "pt-0" : "pt-[5px]"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center transition-all duration-300",
                isCurrent && "w-9 h-9 bg-brand-green border-[2.5px] border-brand-chartreuse text-[0.85rem] shadow-[0_0_16px_rgba(140,198,63,0.35)] text-white/70",
                isPast && "w-[26px] h-[26px] bg-white/35 border-2 border-white/50 text-[0.6rem] text-white/[0.87]",
                isNext && "w-[26px] h-[26px] bg-transparent border-2 border-dashed border-white/60 text-[0.6rem] text-white/70 animate-stage-pulse",
                !isCurrent && !isPast && !isNext && "w-[26px] h-[26px] bg-white/10 border-2 border-white/30 text-[0.6rem] text-white/70",
              )}>
                {isCurrent ? STAGE_ICONS[s] : isPast ? "✓" : isNext ? STAGE_ICONS[s] : ""}
              </div>
              <span className={cn(
                "whitespace-nowrap text-[0.65rem]",
                isCurrent && "font-bold text-white",
                isNext && "font-semibold text-white/90",
                isPast && "font-normal text-white/[0.82]",
                !isCurrent && !isNext && !isPast && "font-normal text-white/70",
              )}>{SL[s] || s}</span>
              {isCurrent && (
                <span className="text-[0.55rem] font-bold text-brand-chartreuse tracking-[0.1em] uppercase -mt-0.5">
                  YOU ARE HERE
                </span>
              )}
            </div>
            {/* Connector line */}
            {i < STAGE_ORDER.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-2 mt-[17px]",
                i < currentIdx && "bg-white/50",
                i === currentIdx && "bg-gradient-to-r from-brand-chartreuse to-white/30",
                i > currentIdx && "bg-white/20",
              )} />
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
    <div
      className={cn(
        "px-[22px] py-4 flex gap-3.5",
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
      <div className="m-4 px-6 py-9 bg-bg border border-border rounded-lg shadow-md">
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
      <div className="m-4 px-6 py-7 bg-red-soft border border-[#fecaca] rounded-lg text-center">
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
    <div className="mx-4 mt-3 flex flex-col animate-fade-in-up">

      {/* ── Header with Stage Journey ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#122b1f] via-[#1B4332] to-[#245940] rounded-t-lg px-[22px] pt-6 pb-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <div className="text-[0.62rem] font-bold tracking-[0.12em] uppercase text-white/[0.82] mb-1.5">
            Your Innovation Pathway
          </div>
          <h2 className="font-display text-[1.35rem] font-normal tracking-tight text-white mb-2.5 leading-[1.2]">
            {titleOverride}
          </h2>
          <p className="text-[0.85rem] text-white/90 leading-[1.65] max-w-[520px]">
            {pathway.summary}
          </p>
          <div className="flex gap-1.5 flex-wrap mt-3">
            {provinces.map(p => (
              <span key={p} className="text-[0.62rem] font-semibold px-2.5 py-[3px] rounded-full bg-white/15 text-white/[0.87]">
                {p}
              </span>
            ))}
            <span className="text-[0.62rem] font-semibold px-2.5 py-[3px] rounded-full bg-white/15 text-white/[0.87]">
              {meta.programsConsidered} programs analyzed
            </span>
          </div>
          <StageJourney current={stage} next={meta.nextStage} />
        </div>
      </div>

      {/* ── Gap warning ───────────────────────────────────────────────── */}
      {pathway.gap_warning && (
        <div className="px-[22px] py-3 bg-[#fffbeb] border-l-[3px] border-l-amber text-[0.78rem] text-[#78350f] leading-[1.55]">
          <strong className="font-bold">⚠ Gap detected:</strong> {pathway.gap_warning}
        </div>
      )}

      {/* ── Current Stage Steps ───────────────────────────────────────── */}
      {currentSteps.length > 0 && (
        <div className="bg-bg border border-border border-t-0">
          <div className="px-[22px] py-2.5 bg-gradient-to-r from-green-soft to-bg border-b border-border flex items-center gap-2">
            <span className="text-[0.85rem]">🎯</span>
            <span className="text-[0.7rem] font-bold tracking-[0.06em] uppercase text-brand-green">Your next moves</span>
            <span className="text-[0.6rem] text-text-tertiary font-medium">— {stageLabel} stage</span>
          </div>
          {currentSteps.map((step, i) => (
            <StepCard key={`c-${i}`} step={step} isLast={i === currentSteps.length - 1 && futureSteps.length === 0} isHorizon={false} animDelay={i * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Future Stage Steps ────────────────────────────────────────── */}
      {futureSteps.length > 0 && (
        <div className={cn("bg-bg-secondary border border-border", currentSteps.length > 0 && "border-t-0")}>
          <div className="px-[22px] py-2.5 bg-gradient-to-r from-[#f3e8ff] to-bg-secondary border-b border-border flex items-center gap-2">
            <span className="text-[0.85rem]">🔭</span>
            <span className="text-[0.7rem] font-bold tracking-[0.06em] uppercase text-[#6b21a8]">Looking ahead</span>
            <span className="text-[0.6rem] text-text-tertiary font-medium">— {nextStageLabel} stage</span>
          </div>
          {futureSteps.map((step, i) => (
            <StepCard key={`f-${i}`} step={step} isLast={i === futureSteps.length - 1} isHorizon={true} animDelay={(currentSteps.length + i) * 0.08} onFollowUp={onChatFollowUp} />
          ))}
        </div>
      )}

      {/* ── Next stage note ───────────────────────────────────────────── */}
      {pathway.next_stage_note && (
        <div className="px-[22px] py-3 bg-bg-secondary border border-border border-t-0 rounded-b-lg text-[0.78rem] text-text-secondary leading-[1.55]">
          <strong className="font-bold text-text">When you reach {nextStageLabel}:</strong>{" "}
          {pathway.next_stage_note}
        </div>
      )}

      {/* ── Follow-up chips ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-2.5">
        <div className="text-[0.68rem] font-bold text-text-tertiary tracking-[0.08em] uppercase">
          Continue the conversation
        </div>
        <div className="flex gap-2 flex-wrap">
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
              <button
                key={i}
                onClick={() => onChatFollowUp(chip.q)}
                className="bg-bg border border-border rounded-sm px-3.5 py-2 text-[0.78rem] font-medium text-text transition-all duration-150 shadow-sm hover:border-brand-green hover:shadow-md hover:-translate-y-px"
              >{chip.label}</button>
            ));
          })()}
        </div>

        <button onClick={() => {
          const url = new URL(window.location.origin + "/navigator");
          url.searchParams.set("stage", stage); url.searchParams.set("prov", provinces.join(",")); url.searchParams.set("need", need);
          navigator.clipboard.writeText(url.toString()).then(() => alert("Link copied! Share it with your advisor or team."), () => alert("Couldn't copy — try manually."));
        }}
          className="self-start px-3.5 py-[7px] bg-transparent text-text-tertiary border border-border rounded-sm font-medium text-[0.72rem] transition-colors duration-150 hover:text-text"
        >📋 Copy shareable link</button>

        <div className="text-[0.65rem] text-text-tertiary leading-[1.5] mt-1 italic">
          Built from public data — we're probably missing things. If a recommendation looks off, that's useful feedback too.
        </div>
      </div>
    </div>
  );
}
