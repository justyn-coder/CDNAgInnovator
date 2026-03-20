import { type JSX, useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

interface WizardResult {
  description: string;
  companyUrl: string;
  productTypes: string[];
  stage: string;
  provinces: string[];
  need: string;
  expansionProvinces: string[];
  completedPrograms: string[];
  otherPrograms: string;
}

interface Props {
  onComplete: (prompt: string, snapshot: {
    stage: string;
    provinces: string[];
    need: string;
    companyUrl?: string;
    productType?: string;
    expansionProvinces?: string[];
    completedPrograms?: string[];
    otherPrograms?: string;
  }) => void;
  programCount?: number | null;
}

const STAGES = [
  { key: "Idea", label: "Idea", sub: "Pre-product, validating the problem", clarify: "You have the idea but haven't built it yet" },
  { key: "MVP", label: "MVP", sub: "Built something, need to test it", clarify: "You have a working version but limited users" },
  { key: "Pilot", label: "Pilot", sub: "Testing with real farmers/operators" },
  { key: "Comm", label: "First Customers", sub: "Piloted, now selling", clarify: "You have paying customers" },
  { key: "Scale", label: "Scaling", sub: "Revenue, growing fast", clarify: "Significant traction, expanding markets" },
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

// Placeholder rotation for description input
const PLACEHOLDERS = [
  "e.g., App to help farmers track grain bins, contracts, and spraying records",
  "e.g., Soil moisture sensor for canola and wheat fields",
  "e.g., AI-powered soil sampling software for Prairie grain farmers",
];

/** Back button classes */
const backBtnCls = "bg-transparent border border-border rounded-sm px-4 py-2 text-[0.82rem] font-semibold text-text-secondary font-sans transition-all duration-100 hover:border-border-strong";

export default function Wizard({ onComplete, programCount }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardResult & { needs: string[] }>({
    description: "", companyUrl: "", productTypes: [], stage: "", provinces: [], need: "", needs: [],
    expansionProvinces: [], completedPrograms: [], otherPrograms: "",
  });
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  // For step 3c program search
  const [programList, setProgramList] = useState<string[]>([]);
  const [programSearch, setProgramSearch] = useState("");
  const wizardRef = useRef<HTMLDivElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    wizardRef.current?.closest("[class*='overflow-y']")?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step]);

  // Rotate placeholder every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch program names for step 3c
  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((progs: { name: string }[]) => setProgramList(progs.map(p => p.name)))
      .catch(() => {});
  }, []);

  function toggleProvince(p: string) {
    setData(d => ({
      ...d,
      provinces: d.provinces.includes(p) ? d.provinces.filter(x => x !== p) : [...d.provinces, p],
    }));
  }

  function toggleExpansionProvince(p: string) {
    setData(d => ({
      ...d,
      expansionProvinces: d.expansionProvinces.includes(p) ? d.expansionProvinces.filter(x => x !== p) : [...d.expansionProvinces, p],
    }));
  }

  function toggleCompletedProgram(name: string) {
    setData(d => ({
      ...d,
      completedPrograms: d.completedPrograms.includes(name)
        ? d.completedPrograms.filter(x => x !== name)
        : [...d.completedPrograms, name],
    }));
  }

  function toggleNeed(key: string) {
    setData(d => {
      if (key === "all") {
        return { ...d, needs: d.needs.includes("all") ? [] : ["all"], need: "all" };
      }
      const without = d.needs.filter(n => n !== "all");
      const updated = without.includes(key)
        ? without.filter(n => n !== key)
        : [...without, key];
      return { ...d, needs: updated, need: updated[0] || "" };
    });
  }

  // Determine sub-steps between province (step 2) and need (step 3)
  const hasExpansionStep = data.stage === "Comm" || data.stage === "Scale";
  const hasCompletedStep = data.stage === "Pilot" || data.stage === "Comm";

  // Step flow: 0 (what), 1 (stage), 2 (province), 3b (expansion, optional), 3c (completed, optional), 3 (need)
  // We use a sub-step system within the wizard
  type WizardStep = "what" | "stage" | "province" | "expansion" | "completed" | "need";
  const stepFlow: WizardStep[] = ["what", "stage", "province"];
  if (hasExpansionStep) stepFlow.push("expansion");
  if (hasCompletedStep) stepFlow.push("completed");
  stepFlow.push("need");

  const currentStepName = stepFlow[step] || "what";

  // Progress bar always shows 4 segments
  const progressFraction = (() => {
    // Map current step to 0-3 range for the 4-segment progress bar
    const idx = stepFlow.indexOf(currentStepName);
    if (currentStepName === "what") return 0;
    if (currentStepName === "stage") return 1;
    if (currentStepName === "province") return 2;
    if (currentStepName === "expansion" || currentStepName === "completed") return 2; // sub-steps of step 3
    if (currentStepName === "need") return 3;
    return idx;
  })();

  const stepLabel = (() => {
    if (currentStepName === "expansion") return "Step 3b of 4";
    if (currentStepName === "completed") return "Step 3c of 4";
    const mainStep = currentStepName === "what" ? 1 : currentStepName === "stage" ? 2 : currentStepName === "province" ? 3 : 4;
    return `Step ${mainStep} of 4`;
  })();

  function goNext() {
    if (step < stepFlow.length - 1) setStep(s => s + 1);
  }
  function goBack() {
    if (step > 0) setStep(s => s - 1);
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

    let completedStr = "";
    if (data.completedPrograms.length > 0) {
      completedStr = ` I've already been through: ${data.completedPrograms.join(", ")}. Focus on programs I haven't done.`;
    }

    const otherProgsStr = data.otherPrograms.trim()
      ? ` I've previously been through these programs: ${data.otherPrograms.trim()}.`
      : "";

    let expansionStr = "";
    if (data.expansionProvinces.length > 0) {
      expansionStr = ` I'm also looking to expand into ${data.expansionProvinces.join(", ")}.`;
    }

    const prompt = `I'm building ${data.description}.${productTypeStr} I'm at the ${stageLabel} stage, based in ${provinceStr}.${expansionStr}${completedStr}${otherProgsStr} ${needStr}. What are the best programs for my situation?`;
    onComplete(prompt, {
      stage: data.stage,
      provinces: data.provinces,
      need: primaryNeed,
      companyUrl: data.companyUrl || undefined,
      productType: data.productTypes.length > 0 ? data.productTypes.join(", ") : undefined,
      expansionProvinces: data.expansionProvinces.length > 0 ? data.expansionProvinces : undefined,
      completedPrograms: data.completedPrograms.length > 0 ? data.completedPrograms : undefined,
      otherPrograms: data.otherPrograms.trim() || undefined,
    });
  }

  const canProceedMap: Record<WizardStep, boolean> = {
    what: data.description.trim().length > 8,
    stage: !!data.stage,
    province: data.provinces.length > 0,
    expansion: true, // optional step
    completed: true, // optional step
    need: data.needs.length > 0,
  };
  const canProceed = canProceedMap[currentStepName];

  // Filtered programs for step 3c search
  const filteredPrograms = programSearch.trim()
    ? programList.filter(name => name.toLowerCase().includes(programSearch.toLowerCase())).slice(0, 8)
    : [];

  const stepContent: Record<WizardStep, JSX.Element> = {
    // ── Step 0: What are you building? ──
    what: (
      <div key="what" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
          What are you building?
        </h2>
        <p className="text-[0.82rem] text-text-secondary mb-4">
          A sentence is enough — what it does and who it's for. No pitch required.
        </p>
        <textarea
          value={data.description}
          onChange={e => setData(d => ({ ...d, description: e.target.value }))}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={3}
          className={cn(
            "w-full px-3.5 py-3 rounded-sm",
            "text-[0.88rem] leading-relaxed resize-none outline-none",
            "bg-white transition-all duration-150 font-sans",
            "focus:border-brand-gold focus:shadow-[0_0_0_3px_rgba(212,168,40,0.08)]"
          )}
          style={{ border: "0.5px solid #E5E5E0" }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canProceed) { e.preventDefault(); goNext(); } }}
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
                    "font-sans transition-all duration-100 flex items-center gap-1.5",
                    active
                      ? "bg-brand-forest text-white"
                      : "bg-white text-text-secondary hover:bg-bg-secondary"
                  )}
                  style={{ border: active ? "none" : "0.5px solid #E5E5E0" }}
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
              "text-[0.82rem]",
              "outline-none bg-white transition-all duration-150 font-sans",
              "focus:border-brand-gold"
            )}
            style={{ border: "0.5px solid #E5E5E0" }}
          />
        </div>
      </div>
    ),

    // ── Step 1: Stage ──
    stage: (
      <div key="stage" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
          What stage are you at?
        </h2>
        <p className="text-[0.82rem] text-text-secondary mb-4">
          This determines which programs are actually open to you.
        </p>
        <div className="flex flex-col gap-2 max-w-[480px]">
          {STAGES.map(s => {
            const active = data.stage === s.key;
            return (
              <button key={s.key}
                onClick={() => { setData(d => ({ ...d, stage: s.key })); setTimeout(goNext, 150); }}
                className={cn(
                  "w-full px-4 py-3 rounded-sm font-semibold text-[0.85rem] cursor-pointer",
                  "transition-all duration-100 font-sans text-left",
                  "flex flex-col items-start gap-0.5",
                )}
                style={active
                  ? { borderLeft: "3px solid #D4A828", background: "#FFF8E7", border: "0.5px solid #E5E5E0", borderLeftWidth: 3, borderLeftColor: "#D4A828" }
                  : { border: "0.5px solid #E5E5E0", background: "white" }
                }
              >
                <span className="font-bold">{s.label}</span>
                <span className={cn(
                  "text-[0.72rem] font-normal",
                  active ? "text-text-secondary" : "text-text-tertiary"
                )}>{s.sub}</span>
                {s.clarify && (
                  <span className="text-[0.65rem] font-normal text-text-tertiary italic">{s.clarify}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ),

    // ── Step 2: Province ──
    province: (
      <div key="province" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
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
                className="px-3.5 py-2.5 rounded-sm font-semibold text-[0.82rem] font-sans transition-all duration-100 text-left"
                style={active
                  ? { borderLeft: "3px solid #D4A828", background: "#FFF8E7", border: "0.5px solid #E5E5E0", borderLeftWidth: 3, borderLeftColor: "#D4A828" }
                  : { border: "0.5px solid #E5E5E0", background: "white" }
                }
              >
                <div className="font-bold">{p.key}</div>
                <div className={cn(
                  "text-[0.68rem] font-normal mt-px",
                  active ? "text-text-secondary" : "text-text-tertiary"
                )}>{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    ),

    // ── Step 3b: Expansion Provinces (FC/Scale only) ──
    expansion: (
      <div key="expansion" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
          Expanding into new territory?
        </h2>
        <p className="text-[0.82rem] text-text-secondary mb-4">
          If you're looking to test in new provinces or reach new markets, select them below. We'll include relevant pilot sites and connections.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROVINCES.map(p => {
            const isHome = data.provinces.includes(p.key);
            const isExpansion = data.expansionProvinces.includes(p.key);
            return (
              <button key={p.key}
                onClick={() => !isHome && toggleExpansionProvince(p.key)}
                disabled={isHome}
                className={cn(
                  "px-3.5 py-2.5 rounded-sm font-semibold text-[0.82rem] font-sans transition-all duration-100 text-left",
                  isHome && "opacity-50 cursor-default"
                )}
                style={isHome
                  ? { border: "0.5px solid #E5E5E0", background: "#F5F3ED" }
                  : isExpansion
                    ? { borderLeft: "3px solid #D4A828", background: "#FFF8E7", border: "0.5px solid #E5E5E0", borderLeftWidth: 3, borderLeftColor: "#D4A828" }
                    : { border: "0.5px solid #E5E5E0", background: "white" }
                }
              >
                <div className="font-bold flex items-center gap-1.5">
                  {p.key}
                  {isHome && <span className="text-[0.55rem] font-normal text-text-tertiary">(home)</span>}
                </div>
                <div className="text-[0.68rem] font-normal mt-px text-text-tertiary">{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    ),

    // ── Step 3c: Completed Programs (Pilot/FC only) ──
    completed: (
      <div key="completed" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
          Been through any Canadian programs already?
        </h2>
        <p className="text-[0.82rem] text-text-secondary mb-4">
          Search our database of {programCount ?? 410}+ Canadian programs. Helps us skip what you've already done.
        </p>

        {/* Search input */}
        <input
          value={programSearch}
          onChange={e => setProgramSearch(e.target.value)}
          placeholder="Search programs…"
          className="w-full px-3.5 py-2.5 rounded-sm text-[0.82rem] outline-none bg-white font-sans focus:border-brand-gold mb-2"
          style={{ border: "0.5px solid #E5E5E0" }}
        />

        {/* Search results */}
        {programSearch.trim() && (
          <div
            className="mb-3 max-h-[180px] overflow-y-auto rounded-sm"
            style={{ border: "0.5px solid #E5E5E0" }}
          >
            {filteredPrograms.length === 0 ? (
              <div className="px-3 py-2 text-[0.78rem] text-text-tertiary">No programs found</div>
            ) : (
              filteredPrograms.map(name => {
                const selected = data.completedPrograms.includes(name);
                return (
                  <button key={name}
                    onClick={() => { toggleCompletedProgram(name); setProgramSearch(""); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[0.78rem] font-sans transition-colors border-b border-border last:border-b-0",
                      selected ? "bg-bg-secondary text-text-tertiary" : "bg-white text-text hover:bg-bg-secondary"
                    )}
                  >
                    {selected ? "✓ " : ""}{name}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Selected pills */}
        {data.completedPrograms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.completedPrograms.map(name => (
              <span key={name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-bg-secondary text-text-secondary border border-border"
              >
                {name}
                <button
                  onClick={() => toggleCompletedProgram(name)}
                  className="bg-transparent border-none text-text-tertiary cursor-pointer text-[0.65rem] p-0 ml-0.5"
                >✕</button>
              </span>
            ))}
          </div>
        )}

        <p className="text-[0.72rem] text-text-tertiary italic">
          Optional — skip this if you haven't been through any programs yet.
        </p>

        {/* Freetext for programs not in our database */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--color-text)", marginBottom: 6, fontWeight: 600 }}>
            Been through a non-Canadian program?
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--color-text-tertiary)", marginBottom: 8 }}>
            e.g., TechStars, Y Combinator, Reservoir, IndieBio
          </p>
          <input
            value={data.otherPrograms}
            onChange={e => setData(d => ({ ...d, otherPrograms: e.target.value }))}
            placeholder="Program names, separated by commas"
            className="w-full px-3.5 py-2.5 rounded-sm text-[0.82rem] outline-none bg-white font-sans focus:border-brand-gold"
            style={{ border: "0.5px solid #E5E5E0", boxSizing: "border-box" }}
          />
        </div>
      </div>
    ),

    // ── Step 3: Need (MULTI-SELECT) ──
    need: (
      <div key="need" className="animate-fade-in-up">
        <h2 className="font-display text-[1.25rem] md:text-[1.5rem] font-normal text-text mb-1.5">
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
                className={cn(
                  "w-full px-4 py-3 rounded-sm font-semibold text-[0.85rem] cursor-pointer",
                  "transition-all duration-100 font-sans text-left",
                  "flex items-center gap-3 relative",
                  isActive
                    ? "border-brand-green bg-brand-green text-white shadow-[0_2px_8px_rgba(45,122,79,0.15)]"
                    : "bg-bg text-text shadow-sm hover:border-border-strong"
                )}
                style={isActive ? { border: "2px solid var(--color-brand-green)" } : { border: "2px solid var(--color-border)" }}
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
      </div>
    ),
  };

  return (
    <div ref={wizardRef} className="m-4 p-4 md:p-6 bg-bg border border-border rounded-lg shadow-md overflow-hidden">
      {/* Progress — always 4 segments */}
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn(
            "flex-1 h-[3px] rounded-full transition-colors duration-300",
            i <= progressFraction ? "bg-brand-gold" : "bg-[#E5E5E0]"
          )} />
        ))}
      </div>
      <div className="text-[0.65rem] font-semibold tracking-widest uppercase text-text-tertiary mb-4.5">
        {stepLabel}
      </div>

      {stepContent[currentStepName]}

      {/* Navigation — shown for what, province, expansion, completed steps */}
      {(currentStepName === "what" || currentStepName === "province" || currentStepName === "expansion" || currentStepName === "completed") && (
        <div className="flex justify-between mt-5.5">
          {step > 0 ? (
            <button onClick={goBack} className={backBtnCls}>
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={goNext}
            disabled={!canProceed}
            className={cn(
              "border-none rounded-sm px-6 py-2.5 text-[0.85rem] font-bold",
              "font-sans transition-all duration-150",
              canProceed
                ? "bg-brand-gold text-brand-forest shadow-gold hover:brightness-110"
                : "bg-bg-tertiary text-text-tertiary"
            )}
          >
            {(currentStepName === "expansion" || currentStepName === "completed")
              ? (currentStepName === "expansion" && data.expansionProvinces.length === 0
                ? "Skip this"
                : currentStepName === "completed" && data.completedPrograms.length === 0 && !data.otherPrograms.trim()
                  ? "Skip this"
                  : "Next →")
              : "Next →"
            }
          </button>
        </div>
      )}

      {/* Back button for stage and need steps */}
      {(currentStepName === "stage" || currentStepName === "need") && (
        <button onClick={goBack} className={cn(backBtnCls, "mt-4")}>
          ← Back
        </button>
      )}
    </div>
  );
}
