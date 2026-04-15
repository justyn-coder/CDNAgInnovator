import { useState } from "react";
import { cn } from "../lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  mode: "founder" | "operator";
  programCount?: number | null;
  onComplete: () => void;
}

interface Slide {
  tag: string;
  heading: string;
  description: string;
  visual: React.ReactNode;
}

// ── localStorage keys ──────────────────────────────────────────────────────
const FOUNDER_KEY = "trellis_tour_founder";
const OPERATOR_KEY = "trellis_tour_operator";

export function shouldShowTour(mode: "founder" | "operator"): boolean {
  try {
    const key = mode === "founder" ? FOUNDER_KEY : OPERATOR_KEY;
    return !localStorage.getItem(key);
  } catch {
    return false;
  }
}

export function dismissTour(mode: "founder" | "operator"): void {
  try {
    const key = mode === "founder" ? FOUNDER_KEY : OPERATOR_KEY;
    localStorage.setItem(key, "1");
  } catch {}
}

// ── SVG Illustrations ──────────────────────────────────────────────────────
// Clean, styled HTML mockups that match the brand. Not screenshots.

function WizardVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-bg-secondary">
          <div className="h-full w-1/4 bg-brand-gold rounded-r-full" />
        </div>
        <div className="px-5 py-4">
          <div className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-text-tertiary mb-2">Step 1 of 4</div>
          <div className="font-display text-[0.95rem] text-text mb-3">What are you building?</div>
          {/* Mock input */}
          <div className="border border-border rounded-sm px-3 py-2.5 text-[0.78rem] text-text-tertiary mb-3">
            e.g., Soil moisture sensor for canola fields...
          </div>
          {/* Mock stage pills */}
          <div className="flex gap-2 flex-wrap">
            {["Idea", "MVP", "Pilot"].map(s => (
              <div key={s} className={cn(
                "px-3 py-1.5 rounded-sm text-[0.72rem] font-semibold border",
                s === "MVP" ? "bg-brand-gold/15 border-brand-gold text-brand-forest" : "bg-bg-secondary border-border text-text-secondary"
              )}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PathwayVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3">
          <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-brand-gold/70 mb-1">Your Pathway</div>
          <div className="font-display text-[0.9rem] text-white leading-tight">3 steps to get started in Ontario</div>
          {/* Stage journey mock */}
          <div className="flex items-center gap-1 mt-3 mb-2">
            {["Idea", "MVP", "Pilot", "Scale"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem]",
                  i === 1 ? "bg-brand-green border-2 border-brand-chartreuse text-white" : "border border-white/30 text-white/50"
                )}>{i === 1 ? "o" : ""}</div>
                {i < 3 && <div className={cn("w-3 h-px", i < 1 ? "bg-white/40" : "bg-white/20")} />}
              </div>
            ))}
          </div>
        </div>
        {/* Mock pathway cards */}
        <div className="px-3 pb-4 flex flex-col gap-2">
          {[
            { timing: "Do now", name: "Ontario Agri-Food Innovation Alliance", cat: "Funding", color: "text-[#166534] bg-[#dcfce7]" },
            { timing: "This month", name: "Creative Destruction Lab", cat: "Accelerator", color: "text-[#92400e] bg-[#fef3c7]" },
            { timing: "Next quarter", name: "MaRS Discovery District", cat: "Industry Org", color: "text-[#1a5fb4] bg-[#dbeafe]" },
          ].map((step, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded px-3 py-2 border border-white/10">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("text-[0.55rem] font-bold px-1.5 py-px rounded-full", step.color)}>{step.timing}</span>
                <span className="text-[0.55rem] text-white/50">{step.cat}</span>
              </div>
              <div className="text-[0.72rem] text-white/90 font-medium">{step.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIChatVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="#2D7A4F" strokeWidth="1.3" fill="none"/>
            </svg>
          </div>
          <span className="text-[0.75rem] font-semibold text-text">AI Advisor</span>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="bg-brand-green text-white rounded-[12px_12px_2px_12px] px-3 py-1.5 text-[0.68rem] max-w-[80%]">
              What grants am I missing?
            </div>
          </div>
          {/* AI bubble */}
          <div className="flex justify-start">
            <div className="bg-bg-secondary border border-border rounded-[12px_12px_12px_2px] px-3 py-2 text-[0.68rem] text-text max-w-[85%] leading-[1.5]">
              Based on your profile, there are <strong>3 grants</strong> you haven't explored yet. The RDAR Applied Research program is accepting applications until May...
            </div>
          </div>
          {/* Chip suggestions */}
          <div className="flex gap-1.5 flex-wrap">
            {["Compare provinces", "Upcoming deadlines"].map(c => (
              <div key={c} className="px-2.5 py-1 rounded-full border border-border text-[0.6rem] text-text-secondary bg-bg">
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBaseVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <span className="text-[0.75rem] font-semibold text-text">Program Database</span>
          <span className="text-[0.6rem] text-text-tertiary ml-2">490+ programs</span>
        </div>
        <div className="px-3 py-2.5 flex flex-col gap-2">
          {/* Filter pills */}
          <div className="flex gap-1.5">
            {["Funding", "Accelerator", "Events"].map((f, i) => (
              <div key={f} className={cn(
                "px-2 py-1 rounded-full text-[0.58rem] font-semibold",
                i === 0 ? "bg-[#e8f0fe] text-[#1a4b8c]" : "bg-bg-secondary text-text-tertiary"
              )}>{f}</div>
            ))}
          </div>
          {/* Mock program cards */}
          {[
            { name: "Alberta Innovates", cat: "Funding", prov: "AB" },
            { name: "Thrive Accelerator", cat: "Accelerator", prov: "National" },
          ].map((p, i) => (
            <div key={i} className="px-3 py-2 border border-border rounded">
              <div className="text-[0.72rem] font-medium text-brand-green mb-0.5">{p.name}</div>
              <div className="flex gap-1.5">
                <span className="text-[0.55rem] font-semibold px-1.5 py-px rounded-full bg-[#e8f0fe] text-[#1a4b8c]">{p.cat}</span>
                <span className="text-[0.55rem] text-text-tertiary">{p.prov}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GapMapVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border flex items-center justify-between">
          <span className="text-[0.75rem] font-semibold text-text">Gap Map</span>
          <div className="flex gap-1">
            {[
              { label: "Gap", bg: "bg-[#fde8e8]", color: "text-[#b91c1c]" },
              { label: "OK", bg: "bg-[#dcfce7]", color: "text-[#166534]" },
            ].map(l => (
              <span key={l.label} className={cn("text-[0.5rem] font-bold px-1.5 py-px rounded", l.bg, l.color)}>{l.label}</span>
            ))}
          </div>
        </div>
        {/* Mock matrix */}
        <div className="p-3">
          <table className="w-full border-collapse text-[0.55rem]">
            <thead>
              <tr>
                <th className="py-1 px-1.5 text-left text-text-tertiary font-semibold">Prov</th>
                {["Fund", "Accel", "Pilot", "Event"].map(c => (
                  <th key={c} className="py-1 px-1.5 text-center text-text-tertiary font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { prov: "ON", vals: [5, 3, 2, 4] },
                { prov: "AB", vals: [4, 2, 1, 2] },
                { prov: "SK", vals: [2, 1, 0, 1] },
                { prov: "NB", vals: [1, 0, 0, 0] },
              ].map(row => (
                <tr key={row.prov}>
                  <td className="py-1 px-1.5 font-bold text-text">{row.prov}</td>
                  {row.vals.map((v, i) => {
                    const bg = v === 0 ? "bg-[#fde8e8]" : v === 1 ? "bg-[#fef9c3]" : v >= 3 ? "bg-[#d1fae5]" : "bg-[#dcfce7]";
                    const color = v === 0 ? "text-[#b91c1c]" : v === 1 ? "text-[#854d0e]" : "text-[#166534]";
                    return (
                      <td key={i} className={cn("py-1 px-1.5 text-center font-bold rounded-sm", bg, color)}>{v}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* AI explain hint */}
          <div className="mt-2 px-2.5 py-1.5 bg-[#2D2438] rounded text-[0.55rem] text-[#EDE9F0] flex items-center gap-1.5">
            <span className="text-[0.6rem]">*</span>
            Tap any cell for AI analysis
          </div>
        </div>
      </div>
    </div>
  );
}

function EcoDashboardVisual() {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3">
          <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-brand-gold/70 mb-1">Ecosystem Intelligence</div>
          <div className="font-display text-[0.9rem] text-white leading-tight mb-3">What do you want to know?</div>
          {/* Mock stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { n: "490+", label: "Programs" },
              { n: "10", label: "Provinces" },
              { n: "6", label: "Categories" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded px-2 py-2 text-center">
                <div className="text-[0.85rem] font-bold text-white">{s.n}</div>
                <div className="text-[0.5rem] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Mock suggestion chips */}
          <div className="flex flex-col gap-1.5">
            {["Where are founders stuck?", "Capital gaps by stage"].map(q => (
              <div key={q} className="bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-[0.6rem] text-white/80">
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slide Content ──────────────────────────────────────────────────────────

function getFounderSlides(programCount: number): Slide[] {
  return [
    {
      tag: "How it works",
      heading: "Answer 4 questions, get a plan",
      description: `Tell us your stage, province, and what you need. In under a minute, you'll get a personalized pathway through ${programCount}+ programs.`,
      visual: <PathwayVisual />,
    },
    {
      tag: "AI-powered",
      heading: "Then talk to your AI advisor",
      description: "Ask follow-up questions, compare provinces, find deadlines, or get advice on your specific situation.",
      visual: <AIChatVisual />,
    },
    {
      tag: "Full access",
      heading: "Browse the entire knowledge base",
      description: "Search, filter, and explore every program we've mapped. Flag anything we got wrong.",
      visual: <KnowledgeBaseVisual />,
    },
  ];
}

function getOperatorSlides(programCount: number): Slide[] {
  return [
    {
      tag: "Your programs",
      heading: "See how founders discover you",
      description: `We've mapped ${programCount}+ programs. Find yours, see how they appear in founder pathways, and flag what we got wrong.`,
      visual: <EcoDashboardVisual />,
    },
    {
      tag: "Intelligence",
      heading: "Find the gaps in the ecosystem",
      description: "Province-by-province, category-by-category. See where programs are strong, weak, or missing entirely.",
      visual: <GapMapVisual />,
    },
    {
      tag: "AI-powered",
      heading: "Ask the ecosystem anything",
      description: "Where are founders getting stuck? Which provinces need more support? Get AI-powered answers from real program data.",
      visual: <AIChatVisual />,
    },
  ];
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ProductTour({ mode, programCount, onComplete }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const count = programCount ?? 490;
  const slides = mode === "founder" ? getFounderSlides(count) : getOperatorSlides(count);
  const isLast = currentSlide === slides.length - 1;

  function goTo(index: number) {
    setCurrentSlide(index);
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      goTo(currentSlide + 1);
    }
  }

  function prev() {
    if (currentSlide > 0) goTo(currentSlide - 1);
  }

  function finish() {
    dismissTour(mode);
    onComplete();
  }

  const slide = slides[currentSlide];
  const isFounder = mode === "founder";

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-bg animate-fade-in" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Top bar with skip */}
      <div className="h-14 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 28 34" className="h-7" aria-hidden="true">
            <g transform="translate(1, 1)">
              <line x1="4" y1="30" x2="4" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="30" x2="12" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="20" y1="30" x2="20" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="24" x2="24" y2="24" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
              <line x1="0" y1="15" x2="24" y2="15" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="4" cy="24" r="2.2" fill="#48B87A"/>
              <circle cx="12" cy="24" r="1.9" fill="#48B87A" opacity="0.9"/>
              <circle cx="20" cy="24" r="1.6" fill="#48B87A" opacity="0.8"/>
              <circle cx="4" cy="15" r="2.4" fill="#8CC63F"/>
              <circle cx="12" cy="15" r="2.1" fill="#8CC63F" opacity="0.9"/>
              <circle cx="20" cy="15" r="1.7" fill="#8CC63F" opacity="0.7"/>
              <circle cx="4" cy="6" r="2.1" fill="#D4A828" opacity="0.85"/>
              <circle cx="12" cy="3" r="1.7" fill="#D4A828" opacity="0.65"/>
              <circle cx="20" cy="0" r="1.3" fill="#D4A828" opacity="0.5"/>
            </g>
          </svg>
          <span className="font-display text-[1rem] text-text">Trellis</span>
        </div>
        <button
          onClick={finish}
          className="text-[0.78rem] text-text-tertiary font-medium hover:text-text transition-colors bg-transparent border-none cursor-pointer font-sans"
        >
          Skip tour
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 overflow-y-auto">
        <div
          key={currentSlide}
          className="w-full max-w-[420px] flex flex-col items-center gap-6 animate-fade-in-up"
        >
          {/* Tag */}
          <div className={cn(
            "text-[0.65rem] font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full",
            isFounder
              ? "bg-brand-gold/15 text-brand-forest"
              : "bg-eco-accent-bg text-brand-forest"
          )}>
            {slide.tag}
          </div>

          {/* Visual — pointer-events disabled so mockups don't feel interactive */}
          <div className="w-full pointer-events-none select-none" style={{ opacity: 0.92 }}>
            {slide.visual}
          </div>

          {/* Text */}
          <div className="text-center max-w-[360px]">
            <h2 className="font-display text-[1.3rem] text-text font-normal leading-[1.25] mb-2">
              {slide.heading}
            </h2>
            <p className="text-[0.85rem] text-text-secondary leading-[1.6]">
              {slide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0 px-5 pb-6 pt-4">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300 border-none cursor-pointer",
                i === currentSlide
                  ? (isFounder ? "w-6 h-2 bg-brand-gold" : "w-6 h-2 bg-brand-forest")
                  : "w-2 h-2 bg-border-strong hover:bg-text-tertiary"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 max-w-[420px] mx-auto">
          {currentSlide > 0 && (
            <button
              onClick={prev}
              className="flex-1 py-3 rounded-sm border border-border text-[0.85rem] font-semibold text-text bg-bg hover:bg-bg-secondary transition-colors cursor-pointer font-sans"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className={cn(
              "flex-[2] py-3 rounded-sm border-none text-[0.85rem] font-semibold cursor-pointer font-sans transition-all",
              isFounder
                ? "bg-brand-gold text-brand-forest hover:brightness-95 shadow-gold"
                : "bg-brand-forest text-white hover:brightness-110 shadow-green"
            )}
          >
            {isLast ? (isFounder ? "Build my pathway" : "Explore the ecosystem") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
