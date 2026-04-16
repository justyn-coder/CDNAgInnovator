import { cn } from "../lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  mode: "founder" | "operator";
  programCount?: number | null;
  onComplete: () => void;
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

// ── Visual Mockups (compact, non-interactive) ─────────────────────────────

function PathwayVisual() {
  return (
    <div className="w-full max-w-[280px] mx-auto pointer-events-none select-none" style={{ opacity: 0.9 }}>
      <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="text-[0.55rem] font-bold tracking-[0.1em] uppercase text-brand-gold/70 mb-0.5">Your Pathway</div>
          <div className="font-display text-[0.8rem] text-white leading-tight">3 steps to get started</div>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {[
            { timing: "Do now", name: "Ontario Agri-Food Innovation Alliance", cat: "Funding", color: "text-[#166534] bg-[#dcfce7]" },
            { timing: "This month", name: "Creative Destruction Lab", cat: "Accelerator", color: "text-[#92400e] bg-[#fef3c7]" },
            { timing: "Next quarter", name: "MaRS Discovery District", cat: "Industry Org", color: "text-[#1a5fb4] bg-[#dbeafe]" },
          ].map((step, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded px-2.5 py-1.5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn("text-[0.5rem] font-bold px-1.5 py-px rounded-full", step.color)}>{step.timing}</span>
                <span className="text-[0.5rem] text-white/50">{step.cat}</span>
              </div>
              <div className="text-[0.65rem] text-white/90 font-medium">{step.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GapMapVisual() {
  return (
    <div className="w-full max-w-[280px] mx-auto pointer-events-none select-none" style={{ opacity: 0.9 }}>
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-3 pt-2.5 pb-1.5 border-b border-border flex items-center justify-between">
          <span className="text-[0.68rem] font-semibold text-text">Gap Map</span>
          <div className="flex gap-1">
            {[
              { label: "Gap", bg: "bg-[#fde8e8]", color: "text-[#b91c1c]" },
              { label: "OK", bg: "bg-[#dcfce7]", color: "text-[#166534]" },
            ].map(l => (
              <span key={l.label} className={cn("text-[0.45rem] font-bold px-1.5 py-px rounded", l.bg, l.color)}>{l.label}</span>
            ))}
          </div>
        </div>
        <div className="p-2.5">
          <table className="w-full border-collapse text-[0.5rem]">
            <thead>
              <tr>
                <th className="py-0.5 px-1 text-left text-text-tertiary font-semibold">Prov</th>
                {["Fund", "Accel", "Pilot", "Event"].map(c => (
                  <th key={c} className="py-0.5 px-1 text-center text-text-tertiary font-semibold">{c}</th>
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
                  <td className="py-0.5 px-1 font-bold text-text">{row.prov}</td>
                  {row.vals.map((v, i) => {
                    const bg = v === 0 ? "bg-[#fde8e8]" : v === 1 ? "bg-[#fef9c3]" : v >= 3 ? "bg-[#d1fae5]" : "bg-[#dcfce7]";
                    const color = v === 0 ? "text-[#b91c1c]" : v === 1 ? "text-[#854d0e]" : "text-[#166534]";
                    return (
                      <td key={i} className={cn("py-0.5 px-1 text-center font-bold rounded-sm", bg, color)}>{v}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Trellis Logo SVG ──────────────────────────────────────────────────────
function TrellisLogo() {
  return (
    <svg viewBox="0 0 28 34" className="h-8" aria-hidden="true">
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
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ProductTour({ mode, programCount, onComplete }: Props) {
  const count = programCount ?? 500;
  const isFounder = mode === "founder";

  function finish() {
    dismissTour(mode);
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-[6px] animate-fade-in p-4">
      <div
        className="bg-bg rounded-xl shadow-xl border border-border w-full max-w-lg overflow-hidden animate-fade-in-up"
        style={{ maxHeight: "90vh" }}
      >
        {/* Content */}
        <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-4">
            <TrellisLogo />
          </div>

          {/* Heading */}
          <h2 className="font-display text-[1.4rem] text-text font-normal leading-[1.25] mb-2">
            Welcome to Trellis
          </h2>

          {/* Description */}
          <p className="text-[0.88rem] text-text-secondary leading-[1.6] mb-5 max-w-[380px]">
            {isFounder
              ? `Answer 4 quick questions. We'll build your personalized pathway through ${count}+ programs across Canada.`
              : "See where your programs appear in founder pathways, explore the gap map, and ask the ecosystem anything."
            }
          </p>

          {/* Visual mockup */}
          <div className="mb-6 w-full">
            {isFounder ? <PathwayVisual /> : <GapMapVisual />}
          </div>

          {/* Primary button */}
          <button
            onClick={finish}
            className={cn(
              "w-full max-w-[320px] py-3 rounded-lg border-none text-[0.9rem] font-semibold cursor-pointer font-sans transition-all",
              isFounder
                ? "bg-brand-gold text-brand-forest hover:brightness-95 shadow-gold"
                : "bg-brand-forest text-white hover:brightness-110 shadow-green"
            )}
          >
            {isFounder ? "Let's go \u2192" : "Explore the ecosystem \u2192"}
          </button>

          {/* Skip link */}
          <button
            onClick={finish}
            className="mt-3 mb-1 bg-transparent border-none text-[0.78rem] text-text-tertiary font-medium hover:text-text transition-colors cursor-pointer font-sans"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
