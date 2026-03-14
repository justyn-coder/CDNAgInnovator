import { useState } from "react";
import { cn } from "../lib/cn";

interface WizardResult {
  description: string;
  companyUrl: string;
  productTypes: string[];
  stage: string;
  provinces: string[];
  need: string;
}

interface Props {
  onComplete: (prompt: string, snapshot: { stage: string; provinces: string[]; need: string; companyUrl?: string; productType?: string }) => void;
}

const STAGES = [
  { key: "Idea", label: "Idea", sub: "Pre-product, validating the problem" },
  { key: "MVP", label: "MVP", sub: "Built something, need to test it" },
  { key: "Pilot", label: "Pilot", sub: "Testing with real farmers/operators" },
  { key: "Comm", label: "First Customers", sub: "Piloted, now selling" },
  { key: "Scale", label: "Scaling", sub: "Revenue, growing fast" },
];

const PROVINCES = [
  { key: "AB", label: "Alberta" },
  { key: "SK", label: "Saskatchewan" },
  { key: "MB", label: "Manitoba" },
  { key: "ON", label: "Ontario" },
  { key: "BC", label: "British Columbia" },
  { key: "QC", label: "Quebec" },
  { key: "Atlantic", label: "Atlantic" },
  { key: "National", label: "National" },
];

const EARLY_NEEDS = [
  { key: "non-dilutive-capital", label: "Money to build", sub: "Grants, vouchers, pre-seed — non-dilutive capital to get started", icon: "💰" },
  { key: "validate-with-farmers", label: "Prove it works", sub: "Access to farms, research stations, or growers willing to test", icon: "🌾" },
  { key: "structured-program", label: "Structure & mentorship", sub: "Accelerator, incubator, or cohort — someone to keep you honest", icon: "🚀" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

const MID_NEEDS = [
  { key: "non-dilutive-capital", label: "Funding for trials", sub: "Grants, vouchers, pilot-stage capital", icon: "💰" },
  { key: "pilot-site-field-validation", label: "Pilot site access", sub: "Commercial farms, applied research orgs, or controlled trial environments", icon: "🌾" },
  { key: "credibility-validation", label: "Build credibility", sub: "Third-party validation, advisor endorsement, proof points buyers trust", icon: "✅" },
  { key: "first-customers", label: "Find first buyers", sub: "Events, intros, and advisor channels to reach actual growers", icon: "🤝" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

const GROWTH_NEEDS = [
  { key: "channel-distribution", label: "Dealers & distribution", sub: "Resellers, equipment dealers, channel partners, installers", icon: "🤝" },
  { key: "go-to-market", label: "Go-to-market strategy", sub: "Market entry, positioning, commercial packaging, new segments", icon: "🎯" },
  { key: "growth-capital", label: "Growth capital", sub: "Series A+, growth debt, strategic investment", icon: "📈" },
  { key: "industry-connections", label: "Industry access", sub: "Associations, trade events, policy networks, export programs", icon: "🏛" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

function getNeedsForStage(stage: string) {
  if (stage === "Scale" || stage === "Comm") return GROWTH_NEEDS;
  if (stage === "Pilot") return MID_NEEDS;
  return EARLY_NEEDS;
}

const ALL_NEEDS = [...EARLY_NEEDS, ...MID_NEEDS, ...GROWTH_NEEDS];

const PRODUCT_TYPES = [
  { key: "software/SaaS", label: "Software / SaaS", icon: "💻" },
  { key: "hardware/equipment", label: "Hardware / Equipment", icon: "🔧" },
  { key: "biologicals/inputs", label: "Biologicals / Inputs", icon: "🧬" },
  { key: "services/consulting", label: "Services", icon: "📋" },
];

/** Shared classes for option buttons */
const optBtnCls = (active: boolean) =>
  cn(
    "w-full px-4 py-3 rounded-sm font-semibold text-[0.85rem] cursor-pointer",
    "transition-all duration-100 font-sans text-left",
    "flex items-center gap-3 border-2",
    active
      ? "border-brand-green bg-brand-green text-white shadow-[0_2px_8px_rgba(45,122,79,0.15)]"
      : "border-border bg-bg text-text shadow-sm hover:border-border-strong"
  );

/** Back button classes */
const backBtnCls = "bg-transparent border border-border rounded-sm px-4 py-2 text-[0.82rem] font-semibold text-text-secondary font-sans transition-all duration-100 hover:border-border-strong";

export default function Wizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardResult & { needs: string[] }>({
    description: "", companyUrl: "", productTypes: [], stage: "", provinces: [], need: "", needs: [],
  });

  function toggleProvince(p: string) {
    setData(d => ({
      ...d,
      provinces: d.provinces.includes(p) ? d.provinces.filter(x => x !== p) : [...d.provinces, p],
    }));
  }

  function toggleNeed(key: string) {
    setData(d => {
      // "Show me everything" is exclusive — clears others
      if (key === "all") {
        return { ...d, needs: d.needs.includes("all") ? [] : ["all"], need: "all" };
      }
      // Selecting a specific need removes "all"
      const without = d.needs.filter(n => n !== "all");
      const updated = without.includes(key)
        ? without.filter(n => n !== key)
        : [...without, key];
      return { ...d, needs: updated, need: updated[0] || "" };
    });
  }

  function finish() {
    const needs = data.needs;
    const primaryNeed = needs.includes("all") ? "all" : needs[0] || "all";
    const provinceStr = data.provinces.length > 0 ? data.provinces.join(" and ") : "Canada";
    const stageLabel = STAGES.find(s => s.key === data.stage)?.label || data.stage;
    const productTypeStr = data.productTypes.length > 0
      ? ` My product type${data.productTypes.length > 1 ? 's are' : ' is'} ${data.productTypes.join(", ")}.`
      : "";

    let needStr: string;
    if (primaryNeed === "all") {
      needStr = "I want to see all relevant programs across funding, pilot sites, accelerators, and first customer opportunities";
    } else if (needs.length === 1) {
      needStr = `My biggest need right now is ${ALL_NEEDS.find(n => n.key === primaryNeed)?.label?.toLowerCase() || primaryNeed}`;
    } else {
      const needLabels = needs.map(n => ALL_NEEDS.find(x => x.key === n)?.label?.toLowerCase() || n);
      needStr = `My needs are: ${needLabels.join(", ")}. My primary bottleneck is ${ALL_NEEDS.find(n => n.key === primaryNeed)?.label?.toLowerCase() || primaryNeed}`;
    }

    const prompt = `I'm building ${data.description}.${productTypeStr} I'm at the ${stageLabel} stage, based in ${provinceStr}. ${needStr}. What are the best programs for my situation?`;
    onComplete(prompt, {
      stage: data.stage,
      provinces: data.provinces,
      need: primaryNeed,
      companyUrl: data.companyUrl || undefined,
      productType: data.productTypes.length > 0 ? data.productTypes.join(", ") : undefined,
    });
  }

  const canProceed = [
    data.description.trim().length > 8,
    !!data.stage,
    data.provinces.length > 0,
    data.needs.length > 0,
  ][step];

  const stepContent = [
    // ── Step 0: What are you building? ──
    <div key="0" className="animate-fade-in-up">
      <h2 className="font-display text-[1.25rem] font-normal text-text mb-1.5">
        What are you building?
      </h2>
      <p className="text-[0.82rem] text-text-secondary mb-4">
        A sentence is enough — product type, who it's for.
      </p>
      <textarea
        value={data.description}
        onChange={e => setData(d => ({ ...d, description: e.target.value }))}
        placeholder="e.g. AI-powered soil sampling software for Prairie grain farmers"
        rows={3}
        className={cn(
          "w-full px-3.5 py-3 rounded-sm border-[1.5px] border-border",
          "text-[0.88rem] leading-relaxed resize-none outline-none",
          "bg-bg-secondary transition-all duration-150 font-sans",
          "focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(45,122,79,0.08)]"
        )}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canProceed) { e.preventDefault(); setStep(1); } }}
      />

      {/* Product type */}
      <div className="mt-4">
        <label className="text-[0.72rem] font-semibold text-text-tertiary mb-2 block">
          Product type
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {PRODUCT_TYPES.map(pt => {
            const active = data.productTypes.includes(pt.key);
            return (
              <button key={pt.key}
                onClick={() => setData(d => ({
                  ...d,
                  productTypes: d.productTypes.includes(pt.key)
                    ? d.productTypes.filter(t => t !== pt.key)
                    : [...d.productTypes, pt.key],
                }))}
                className={cn(
                  "px-3.5 py-1.5 rounded-sm font-semibold text-[0.78rem]",
                  "font-sans transition-all duration-100 flex items-center gap-1.5 border-2",
                  active
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-border bg-bg text-text-secondary hover:border-border-strong"
                )}
              >
                <span className="text-[0.9rem]">{pt.icon}</span>
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company URL */}
      <div className="mt-3.5">
        <label className="text-[0.72rem] font-semibold text-text-tertiary flex items-center gap-1">
          Company website
          <span className="font-normal italic">(optional)</span>
        </label>
        <input
          value={data.companyUrl}
          onChange={e => setData(d => ({ ...d, companyUrl: e.target.value }))}
          placeholder="https://yourcompany.com"
          type="url" autoComplete="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className={cn(
            "w-full px-3.5 py-2 rounded-sm mt-1",
            "border-[1.5px] border-border text-[0.82rem]",
            "outline-none bg-bg-secondary transition-all duration-150 font-sans",
            "focus:border-brand-green"
          )}
        />
      </div>
    </div>,

    // ── Step 1: Stage ──
    <div key="1" className="animate-fade-in-up">
      <h2 className="font-display text-[1.25rem] font-normal text-text mb-1.5">
        What stage are you at?
      </h2>
      <p className="text-[0.82rem] text-text-secondary mb-4">
        Be honest — this determines which programs are actually open to you.
      </p>
      <div className="flex flex-col gap-2 max-w-[480px]">
        {STAGES.map(s => (
          <button key={s.key}
            onClick={() => { setData(d => ({ ...d, stage: s.key })); setTimeout(() => setStep(2), 150); }}
            className={cn(
              optBtnCls(data.stage === s.key),
              "flex-col items-start gap-0.5"
            )}
          >
            <span className="font-bold">{s.label}</span>
            <span className={cn(
              "text-[0.72rem] font-normal",
              data.stage === s.key ? "text-white/80" : "text-text-tertiary"
            )}>{s.sub}</span>
          </button>
        ))}
      </div>
    </div>,

    // ── Step 2: Province ──
    <div key="2" className="animate-fade-in-up">
      <h2 className="font-display text-[1.25rem] font-normal text-text mb-1.5">
        Where are you operating?
      </h2>
      <p className="text-[0.82rem] text-text-secondary mb-4">
        Select all that apply — many programs are province-specific.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PROVINCES.map(p => {
          const active = data.provinces.includes(p.key);
          return (
            <button key={p.key}
              onClick={() => toggleProvince(p.key)}
              className={cn(
                "px-3.5 py-2.5 rounded-sm font-semibold text-[0.82rem]",
                "font-sans transition-all duration-100 text-left border-2",
                active
                  ? "border-brand-green bg-brand-green text-white shadow-[0_2px_8px_rgba(45,122,79,0.15)]"
                  : "border-border bg-bg text-text shadow-sm hover:border-border-strong"
              )}
            >
              <div className="font-bold">{p.key}</div>
              <div className={cn(
                "text-[0.68rem] font-normal mt-px",
                active ? "text-white/80" : "text-text-tertiary"
              )}>{p.label}</div>
            </button>
          );
        })}
      </div>
    </div>,

    // ── Step 3: Need (MULTI-SELECT) ──
    <div key="3" className="animate-fade-in-up">
      <h2 className="font-display text-[1.25rem] font-normal text-text mb-1.5">
        What's holding you back?
      </h2>
      <p className="text-[0.82rem] text-text-secondary mb-4">
        Select all that apply — we'll build your pathway around the biggest bottlenecks.
      </p>
      <div className="flex flex-col gap-2">
        {getNeedsForStage(data.stage).map(n => {
          const isActive = data.needs.includes(n.key);
          const isFirst = data.needs.length > 0 && data.needs[0] === n.key && data.needs.length > 1;
          return (
            <button key={n.key}
              onClick={() => toggleNeed(n.key)}
              className={cn(optBtnCls(isActive), "relative")}
            >
              <span className="text-[1.2rem] shrink-0">{n.icon}</span>
              <div className="flex-1">
                <div className="font-bold">{n.label}</div>
                {n.sub && (
                  <div className={cn(
                    "text-[0.72rem] font-normal mt-0.5",
                    isActive ? "text-white/80" : "text-text-tertiary"
                  )}>{n.sub}</div>
                )}
              </div>
              {isFirst && (
                <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white tracking-wide uppercase shrink-0">
                  Primary
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Generate button */}
      {data.needs.length > 0 && (
        <button
          onClick={finish}
          className={cn(
            "w-full mt-4.5 border-none rounded-sm px-6 py-3.5",
            "text-[0.92rem] font-bold font-sans",
            "bg-brand-gold text-brand-forest",
            "transition-all duration-150",
            "shadow-gold",
            "animate-fade-in-up hover:brightness-110"
          )}
        >
          Generate my pathway →
        </button>
      )}
    </div>,
  ];

  return (
    <div className="m-4 p-6 bg-bg border border-border rounded-lg shadow-md">
      {/* Progress */}
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn(
            "flex-1 h-[3px] rounded-full transition-colors duration-300",
            i <= step ? "bg-brand-green" : "bg-bg-tertiary"
          )} />
        ))}
      </div>
      <div className="text-[0.65rem] font-semibold tracking-widest uppercase text-text-tertiary mb-4.5">
        Step {step + 1} of 4
      </div>

      {stepContent[step]}

      {/* Navigation — shown for steps 0 and 2 */}
      {(step === 0 || step === 2) && (
        <div className="flex justify-between mt-5.5">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className={backBtnCls}>
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={() => step === 2 ? setStep(3) : setStep(s => s + 1)}
            disabled={!canProceed}
            className={cn(
              "border-none rounded-sm px-6 py-2.5 text-[0.85rem] font-bold",
              "font-sans transition-all duration-150",
              canProceed
                ? "bg-brand-gold text-brand-forest shadow-gold hover:brightness-110"
                : "bg-bg-tertiary text-text-tertiary"
            )}
          >Next →</button>
        </div>
      )}

      {/* Back button for steps 1 and 3 */}
      {(step === 1 || step === 3) && (
        <button onClick={() => setStep(s => s - 1)} className={cn(backBtnCls, "mt-4")}>
          ← Back
        </button>
      )}
    </div>
  );
}
