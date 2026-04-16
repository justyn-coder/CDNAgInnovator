import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────
interface CellProgram {
  name: string;
  website: string | null;
  description: string | null;
  stage: string[];
}

interface Cell {
  count: number;
  programs: CellProgram[];
}

interface GapData {
  matrix: Record<string, Record<string, Cell>>;
  provinces: string[];
  categories: string[];
  summary: {
    totalCells: number;
    emptyCells: number;
    weakCells: number;
    coveredCells: number;
    stageFilter: string;
  };
}

interface GapExplanation {
  classification_label: string;
  why: string;
  action: string;
}

interface ExplainResponse {
  gapType: string;
  explanation: GapExplanation;
  meta: {
    unfilteredCount: number;
    nationalCount: number;
    neighborCounts: Record<string, number>;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────
const STAGES = ["All", "Idea", "MVP", "Pilot", "Comm", "Scale"];

const STAGE_LABELS: Record<string, string> = {
  All: "All", Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

const CAT_LABELS: Record<string, string> = {
  Fund:  "Funding",
  Accel: "Accelerator",
  Pilot: "Pilot Site",
  Event: "Event",
  Org:   "Industry Org",
  Train: "Training",
};

const PROV_LABELS: Record<string, string> = {
  BC: "BC", AB: "AB", SK: "SK", MB: "MB",
  ON: "ON", QC: "QC", NB: "NB", NS: "NS",
  PE: "PE", NL: "NL", National: "Natl",
};

// ── Color scale ────────────────────────────────────────────────────────────
function cellColorClasses(count: number): { bg: string; text: string; border: string; outlineBorder: string } {
  if (count === 0) return { bg: "bg-[#FEF2F2]", text: "text-[#991B1B]", border: "border-[#FECACA]", outlineBorder: "#991B1B" };
  if (count === 1) return { bg: "bg-[#FFFBEB]", text: "text-[#92400E]", border: "border-[#FDE68A]", outlineBorder: "#92400E" };
  if (count === 2) return { bg: "bg-[#F0FDF4]", text: "text-[#166534]", border: "border-[#BBF7D0]", outlineBorder: "#166534" };
  return              { bg: "bg-[#DCFCE7]", text: "text-[#064E3B]", border: "border-[#86EFAC]", outlineBorder: "#064E3B" };
}

// For inline-style contexts (badge borders etc.) we still need raw hex values
function cellColorRaw(count: number): { bg: string; text: string; border: string } {
  if (count === 0) return { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" };
  if (count === 1) return { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" };
  if (count === 2) return { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" };
  return            { bg: "#DCFCE7", text: "#064E3B", border: "#86EFAC" };
}

function gapLabel(count: number): string {
  if (count === 0) return "Gap";
  if (count === 1) return "Weak";
  if (count === 2) return "Fair";
  return "Strong";
}

const GAP_TYPE_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  structural:     { bg: "bg-[#fef3c7]", text: "text-[#92400e]", border: "border-[#fcd34d]" },
  market_failure: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", border: "border-[#fca5a5]" },
  coverage_gap:   { bg: "bg-[#e0e7ff]", text: "text-[#3730a3]", border: "border-[#a5b4fc]" },
  stage_mismatch: { bg: "bg-[#fce7f3]", text: "text-[#9d174d]", border: "border-[#f9a8d4]" },
  data_gap:       { bg: "bg-[#f3e8ff]", text: "text-[#6b21a8]", border: "border-[#c4b5fd]" },
  weak:           { bg: "bg-[#fef9c3]", text: "text-[#854d0e]", border: "border-[#fde047]" },
  adequate:       { bg: "bg-[#d1fae5]", text: "text-[#064e3b]", border: "border-[#34d399]" },
};

// ── Pre-cached AI analyses for key cells (instant load during demo) ────────
const EXPLAIN_CACHE: Record<string, ExplainResponse> = {
  "ON|Accel|Scale": {"gapType":"stage_mismatch","explanation":{"classification_label":"Stage Mismatch \u2014 Acceleration Ends at Early Stage","why":"Ontario's 24 catalogued accelerator-adjacent programs are concentrated at early and growth stages, leaving scaling agtech companies without structured acceleration support. The Bioenterprise roundtable flagged this directly: Ontario's dominant generalist ecosystem (MaRS, Communitech, etc.) runs on SaaS and deep-tech timelines that don't accommodate agricultural seasonality, hardware cycles, or regulatory pathways.","action":"This is a real opportunity for an Ontario-based operator to launch a scale-stage agtech cohort, potentially in partnership with existing infrastructure like Bioenterprise or Lakehead's NORCAT. Know something we don't? Use the buttons below to let us know."},"meta":{"unfilteredCount":24,"nationalCount":13,"neighborCounts":{"MB":1,"QC":1}}},
  "NB|Train|All": {"gapType":"market_failure","explanation":{"classification_label":"Possible Structural Gap","why":"New Brunswick has no catalogued agtech-specific training programs, which aligns with the Bioenterprise finding that the province lacks full-stack agtech support infrastructure entirely. With neighbors NS and PE also showing zero, this appears to be a regional market failure rather than a data blind spot.","action":"This is a greenfield opportunity for an operator willing to deliver agtech-calibrated training regionally \u2014 a Maritime cohort model partnering with ACOA and the existing QC program could be viable without building from scratch. Know something we don't? Use the buttons below to let us know."},"meta":{"unfilteredCount":0,"nationalCount":2,"neighborCounts":{"QC":1,"NS":0,"PE":0}}},
  "NL|Train|All": {"gapType":"market_failure","explanation":{"classification_label":"Possible Structural Gap (Low Priority Market)","why":"NL and NS both show zero catalogued agtech training programs, suggesting a regional pattern rather than an isolated omission. NL's minimal agricultural base means agtech-specific training likely lacks the founder density to justify dedicated programming.","action":"The two national programs are the most realistic entry point for Atlantic founders today. For operators, the opportunity may be a regionally-bundled Atlantic cohort model \u2014 partnering with NS, NB, and PEI to reach critical mass. Know something we don't? Use the buttons below to let us know."},"meta":{"unfilteredCount":0,"nationalCount":2,"neighborCounts":{"NS":0}}},
  "NS|Train|All": {"gapType":"market_failure","explanation":{"classification_label":"Structural Regional Gap","why":"NS shows zero agtech-specific training programs, mirroring NB and PEI \u2014 suggesting this isn't a Nova Scotia oversight but a systemic Atlantic-wide gap. General entrepreneurship training dominates the region, failing to address agtech-specific realities like seasonal producer sales cycles and regulatory pathways.","action":"The Atlantic cluster creates a compelling case for a shared regional agtech training cohort \u2014 Perennia Food and Agriculture or ACOA may be natural anchors. Know something we don't? Use the buttons below to let us know."},"meta":{"unfilteredCount":0,"nationalCount":2,"neighborCounts":{"NB":0,"PE":0}}},
  "BC|Event|Scale": {"gapType":"stage_mismatch","explanation":{"classification_label":"Stage Mismatch \u2014 Events Serve Early Stages","why":"BC's 4 catalogued agtech events appear oriented toward early-stage founders. Scaling companies need different rooms: customer introductions, investor syndication, and export market access. BC's fragmented ecosystem likely means no single convener has stepped up to program explicitly for scale-stage companies.","action":"This is a programming gap a convener like Innovate BC or BCAC could own \u2014 a curated scale-stage event or deal-flow dinner requires less infrastructure than a conference. Know something we don't? Use the buttons below to let us know."},"meta":{"unfilteredCount":4,"nationalCount":11,"neighborCounts":{"AB":5}}},
};

// ── AI Explain card ────────────────────────────────────────────────────────
function ExplainCard({
  prov, cat, stage, mode, autoFetch = false,
}: {
  prov: string; cat: string; stage: string; mode: string; autoFetch?: boolean;
}) {
  const cacheKey = `${prov}|${cat}|${stage}`;
  const cached = EXPLAIN_CACHE[cacheKey] || null;
  const [data, setData] = useState<ExplainResponse | null>(cached);
  const [loading, setLoading] = useState<boolean>(autoFetch && !cached);
  const [error, setError] = useState("");
  const hasFetched = useRef(!!cached);
  const [showMeta, setShowMeta] = useState(true);
  const [gapFeedback, setGapFeedback] = useState("");

  function submitGapFeedback(rating: string) {
    setGapFeedback(rating);
    fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programName: `FEEDBACK:GAP:${prov}:${cat}`,
        bestFor: `${rating} — AI analysis for ${prov} ${cat} (stage: ${stage})`,
        submitterName: "Gap Map user",
        submitterEmail: "gap-feedback@trellisag.ca",
      }),
    }).catch(() => {});
  }

  function fetchExplain() {
    if (data || loading) return;
    setLoading(true);
    setError("");
    fetch("/api/gaps/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ province: prov, category: cat, stage, mode }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ExplainResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load analysis.");
        setLoading(false);
      });
  }

  // Auto-fetch on mount for gap cells (count=0)
  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchExplain();
    }
  }, [autoFetch]);

  const typeClasses = data ? (GAP_TYPE_CLASSES[data.gapType] || GAP_TYPE_CLASSES.adequate) : null;

  if (!data && !loading && !error) {
    return (
      <button
        onClick={fetchExplain}
        className="w-full px-3.5 py-2.5 bg-gradient-to-br from-[#2D2438] to-[#3D3248] border border-[#4D4458] rounded-[10px] flex items-center gap-2 cursor-pointer mt-2.5 transition-all duration-150"
      >
        <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-[#5B4A6B] to-[#7A6A8A] flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="text-left">
          <div className="text-[0.72rem] font-bold text-[#EDE9F0]">Ask AI: why this gap?</div>
          <div className="text-[0.6rem] text-[#C0B8C8] mt-px">Our best guess — we're still learning this landscape</div>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="w-full p-3.5 bg-gradient-to-br from-[#2D2438] to-[#3D3248] border border-[#4D4458] rounded-[10px] mt-2.5 flex items-center gap-2">
        <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-[#5B4A6B] to-[#7A6A8A] flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <div>
          <div className="text-[0.72rem] font-bold text-[#EDE9F0]">Analyzing…</div>
          <div className="text-[0.6rem] text-[#C0B8C8] mt-px">Reasoning about this ecosystem gap</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2.5 px-3.5 py-2.5 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] text-[0.75rem] text-[#991b1b]">
        {error}{" "}
        <button
          onClick={() => { setError(""); setData(null); }}
          className="bg-transparent border-none underline cursor-pointer text-[#991b1b] text-[0.75rem]"
        >Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-2.5 bg-gradient-to-br from-[#2D2438] to-[#3D3248] border border-[#4D4458] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="px-3.5 pt-2.5 pb-2 flex items-center gap-2 border-b border-white/[0.08]">
        <div className="w-[18px] h-[18px] rounded-[5px] bg-gradient-to-br from-[#5B4A6B] to-[#7A6A8A] flex items-center justify-center shrink-0">
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-[0.68rem] font-bold text-[#EDE9F0]">AI Analysis</span>
        {typeClasses && (
          <span className={cn(
            "text-[0.58rem] font-bold px-[7px] py-[2px] rounded-full border ml-auto",
            typeClasses.bg, typeClasses.text, typeClasses.border,
          )}>{data.explanation.classification_label}</span>
        )}
      </div>

      {/* Why */}
      <div className="px-3.5 pt-2.5 pb-1.5">
        <div className="text-[0.6rem] font-bold text-[#8A7A9A] tracking-[0.06em] uppercase mb-1">Why</div>
        <div className="text-[0.73rem] text-[#D8D0E0] leading-[1.55]">{data.explanation.why}</div>
      </div>

      {/* Action */}
      <div className="px-3.5 pt-1.5 pb-3">
        <div className="text-[0.6rem] font-bold text-[#48B87A] tracking-[0.06em] uppercase mb-1">
          {mode === "ec" ? "Opportunity" : "What to do"}
        </div>
        <div className="text-[0.73rem] text-[#D8D0E0] leading-[1.55]">{data.explanation.action}</div>
      </div>

      {/* Meta */}
      <div className="px-3.5 pb-2.5">
        <button
          onClick={() => setShowMeta(!showMeta)}
          className="bg-transparent border-none p-0 text-[0.6rem] text-[#A098A8] cursor-pointer underline decoration-[#4D4458]"
        >{showMeta ? "Hide" : "Show"} context</button>
        {showMeta && (
          <div className="mt-1.5 px-2.5 py-1.5 bg-white/[0.06] rounded-[6px] text-[0.63rem] text-[#A098A8] leading-[1.6]">
            {Object.keys(data.meta.neighborCounts).length > 0 && (
              <div>Neighbors: {Object.entries(data.meta.neighborCounts).map(([p, c]) => `${p} ${c}`).join(" · ")}</div>
            )}
            <div>National programs: {data.meta.nationalCount}</div>
            {data.meta.unfilteredCount > 0 && <div>All stages: {data.meta.unfilteredCount} programs</div>}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="px-3.5 pb-3 flex items-center gap-2.5 border-t border-white/[0.08] pt-2.5">
        {gapFeedback ? (
          <span className="text-[0.68rem] text-[#A098A8]">Thanks — noted for {prov} · {cat}</span>
        ) : (
          <>
            <button
              onClick={() => submitGapFeedback("accurate")}
              className="bg-transparent border border-white/20 rounded-full px-2.5 py-1 text-[0.68rem] text-white/60 cursor-pointer hover:border-white/40 hover:text-white/80 transition-colors font-sans"
            >👍 Looks right</button>
            <button
              onClick={() => submitGapFeedback("inaccurate")}
              className="bg-transparent border border-white/20 rounded-full px-2.5 py-1 text-[0.68rem] text-white/60 cursor-pointer hover:border-white/40 hover:text-white/80 transition-colors font-sans"
            >👎 Not quite</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Drill-down panel ───────────────────────────────────────────────────────
function CellDetail({
  prov, cat, cell, stage, mode, onClose,
}: {
  prov: string; cat: string; cell: Cell; stage: string; mode: string; onClose: () => void;
}) {
  const rawColors = cellColorRaw(cell.count);
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/45 flex items-end"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-h-[75vh] overflow-y-auto bg-bg rounded-t-[16px] px-[18px] pt-5 pb-8"
      >
        <div className="w-9 h-1 bg-border rounded-sm mx-auto mb-4" />

        <div className="flex justify-between items-start mb-3.5">
          <div>
            <div className="flex gap-1.5 items-center mb-1">
              <span
                className="text-[0.65rem] font-bold px-2 py-[2px] rounded-full border"
                style={{ background: rawColors.bg, color: rawColors.text, borderColor: rawColors.border }}
              >{gapLabel(cell.count)}</span>
              <span className="text-[0.72rem] text-text-secondary font-semibold">
                {cell.count} program{cell.count !== 1 ? "s" : ""}
              </span>
              {stage !== "All" && (
                <span className="text-[0.6rem] px-[7px] py-[2px] rounded-[4px] bg-bg-tertiary text-text-secondary font-semibold">
                  {stage} stage
                </span>
              )}
            </div>
            <div className="font-bold text-[0.95rem] text-text">
              {prov === "National" ? "National" : prov} · {CAT_LABELS[cat]}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-bg-secondary border border-border rounded-sm px-3 py-1 text-[0.75rem] font-semibold text-text"
          >Close</button>
        </div>

        <ExplainCard prov={prov} cat={cat} stage={stage} mode={mode} autoFetch={cell.count === 0} />

        {cell.count === 0 ? (
          <div className="mt-3 px-4 py-4 bg-gradient-to-br from-[#FEF2F2] to-[#FFFBEB] rounded-lg border border-[#FECACA]/60">
            <div className="font-semibold text-[0.85rem] text-[#991B1B] mb-1">
              Uncovered gap: {prov === "National" ? "National" : prov} {(CAT_LABELS[cat] || cat).toLowerCase()}
            </div>
            <div className="text-[0.75rem] text-text-secondary leading-[1.5] mb-2.5">
              {stage !== "All"
                ? `No ${(CAT_LABELS[cat] || cat).toLowerCase()} programs catalogued for ${stage}-stage companies in ${prov}. This is either a real gap in the ecosystem or something we haven't found yet.`
                : `No ${(CAT_LABELS[cat] || cat).toLowerCase()} programs catalogued in ${prov}. This is either a real gap or something we're missing.`
              }
            </div>
            <div className="text-[0.72rem] text-brand-green font-semibold">
              Know a program that fills this? Use "Suggest a correction" in Browse Programs to tell us.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cell.programs.map((p, i) => (
              <div key={i} className="px-[13px] py-[11px] bg-bg-secondary rounded border border-border">
                <div className="font-semibold text-[0.82rem] mb-[3px]">
                  {p.website
                    ? <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="text-brand-green no-underline">{p.name} ↗</a>
                    : <span className="text-text">{p.name}</span>
                  }
                </div>
                {p.description && (
                  <div className="text-[0.73rem] text-text-secondary leading-[1.45] mb-[5px]">
                    {p.description}
                  </div>
                )}
                {p.stage.length > 0 && (
                  <div className="flex gap-[3px] flex-wrap">
                    {p.stage.map(st => (
                      <span key={st} className="text-[0.6rem] px-1.5 py-px rounded-[4px] bg-bg-tertiary text-text-secondary">
                        {st}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GapMatrix({ onClose, onFeedback, onAskAI, mode = "founder" }: { onClose: () => void; onFeedback?: () => void; onAskAI?: (question: string) => void; mode?: string }) {
  const [stage, setStage] = useState("All");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ prov: string; cat: string } | null>(null);
  const [bottomAnalysis, setBottomAnalysis] = useState<{ prov: string; cat: string } | null>(null);
  const [showGuide, setShowGuide] = useState(() => {
    try {
      if (sessionStorage.getItem("ag_gap_guided")) return false;
      if (localStorage.getItem("trellis_ref")) return false;
      return true;
    } catch { return true; }
  });

  // Push history entry so browser back closes the gap map
  useEffect(() => {
    window.history.pushState({ gapMap: true }, "");
    const handlePop = () => onClose();
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = stage === "All" ? "/api/gaps" : `/api/gaps?stage=${stage}`;
    fetch(url)
      .then(r => r.json())
      .then((d: GapData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load gap data."); setLoading(false); });
  }, [stage]);

  // Reset and preload the most interesting gap after a delay
  useEffect(() => {
    setSelected(null);
    setBottomAnalysis(null);
    if (!data) return;

    // Find the best gap to preload
    let preload: { prov: string; cat: string } | null = null;
    const onAccel = data.matrix["ON"]?.["Accel"];
    if (onAccel && onAccel.count === 0) {
      preload = { prov: "ON", cat: "Accel" };
    } else {
      for (const prov of data.provinces) {
        if (prov === "National") continue;
        for (const cat of data.categories) {
          if ((data.matrix[prov]?.[cat]?.count ?? 0) === 0) {
            preload = { prov, cat };
            break;
          }
        }
        if (preload) break;
      }
    }

    // Delay so the user can see the map first
    if (preload) {
      const timer = setTimeout(() => setBottomAnalysis(preload), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, stage]);

  // Dismiss guide on first cell click
  useEffect(() => {
    if (selected && showGuide) {
      setShowGuide(false);
      try { sessionStorage.setItem("ag_gap_guided", "1"); } catch {}
    }
  }, [selected]);

  const selectedCell = selected && data
    ? { prov: selected.prov, cat: selected.cat, cell: data.matrix[selected.prov][selected.cat] }
    : null;

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col">

      {/* ── Tutorial overlay — shows on first visit ──────────────── */}
      {showGuide && !loading && data && (
        <div
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-5 animate-fade-in"
          onClick={() => { setShowGuide(false); try { sessionStorage.setItem("ag_gap_guided", "1"); } catch {} }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-bg rounded-lg max-w-[400px] w-full shadow-lg overflow-hidden animate-slide-up"
          >
            <div className="px-6 pt-6 pb-4">
              <div className="text-[1.8rem] mb-2.5">🗺</div>
              <h3 className="font-display text-[1.15rem] font-normal text-text mb-2">
                How to read the Gap Map
              </h3>
              <div className="text-[0.82rem] text-text-secondary leading-[1.65]">
                <p className="mb-2.5">
                  Each cell shows how many programs we've found for that province and category.
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { label: "Gap (0)", bg: "bg-[#FEF2F2]", color: "text-[#991B1B]" },
                    { label: "Weak (1)", bg: "bg-[#FFFBEB]", color: "text-[#92400E]" },
                    { label: "Fair (2)", bg: "bg-[#F0FDF4]", color: "text-[#166534]" },
                    { label: "Strong (3+)", bg: "bg-[#DCFCE7]", color: "text-[#064E3B]" },
                  ].map(l => (
                    <span key={l.label} className={cn(
                      "text-[0.7rem] font-bold px-2.5 py-[3px] rounded-[6px]",
                      l.bg, l.color,
                    )}>{l.label}</span>
                  ))}
                </div>
                <p className="mb-2.5">
                  <strong className="text-text">Tap any cell</strong> to see the programs inside it — and get an AI perspective on why gaps exist.
                </p>
                <p className="text-[0.75rem] text-text-tertiary">
                  Scroll right to see all categories. Use the stage filter to narrow by company maturity.
                </p>
              </div>
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => { setShowGuide(false); try { sessionStorage.setItem("ag_gap_guided", "1"); } catch {} }}
                className="w-full py-3 bg-brand-gold text-brand-forest border-none rounded-sm font-bold text-[0.85rem] shadow-gold"
              >Got it — show me the map</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#122b1f] via-[#1B4332] to-[#245940] px-5 pt-4 pb-3 text-white relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-white/60 mb-1">Ecosystem Coverage</div>
            <h2 className="font-display text-[1.15rem] font-normal text-white leading-[1.2] mb-1.5">
              Where support exists — and where it doesn't
            </h2>
            {data && !loading && (
              <div className="text-[0.72rem] text-white/70 leading-[1.5]">
                {data.summary.emptyCells} gaps across {data.provinces.length} provinces. {data.summary.weakCells} cells with only 1 program.
                {stage !== "All" && <span className="text-brand-chartreuse font-semibold"> Filtered to {STAGE_LABELS[stage]} stage.</span>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 border-none rounded px-3 py-1.5 text-[0.72rem] font-semibold text-white/80 cursor-pointer transition-colors shrink-0 mt-1"
          >Done</button>
        </div>
      </div>

      {/* ── Filter + legend bar ─────────────────────────────── */}
      <div className="px-4 py-2.5 border-b border-border bg-bg shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] font-semibold text-text-secondary">Stage:</span>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="px-2.5 py-[5px] rounded-sm border-[1.5px] border-border text-[0.75rem] font-semibold bg-bg text-text font-sans"
          >
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 items-center ml-auto">
          {[
            { label: "Gap (0)", bg: "bg-[#FEF2F2]", text: "text-[#991B1B]" },
            { label: "Weak (1)", bg: "bg-[#FFFBEB]", text: "text-[#92400E]" },
            { label: "Fair (2)", bg: "bg-[#F0FDF4]", text: "text-[#166534]" },
            { label: "Strong (3+)", bg: "bg-[#DCFCE7]", text: "text-[#064E3B]" },
          ].map(l => (
            <span key={l.label} className={cn(
              "text-[0.58rem] font-bold px-1.5 py-[2px] rounded-[4px]",
              l.bg, l.text,
            )}>{l.label}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto px-4 pb-3">
        {loading && (
          <div className="p-12 text-center text-text-tertiary text-[0.85rem]">Loading gap data…</div>
        )}
        {error && (
          <div className="p-12 text-center text-[#b91c1c] text-[0.85rem]">{error}</div>
        )}
        {data && !loading && (
          <table className="border-collapse w-full min-w-[520px] rounded-lg overflow-hidden border border-border">
            <thead>
              <tr>
                <th className="px-3 py-2.5 text-left font-bold text-[0.65rem] text-text-secondary border-b-2 border-border bg-bg sticky top-0 left-0 z-[2] min-w-[52px]">
                  Province
                </th>
                {data.categories.map(cat => (
                  <th key={cat} className="px-2 py-2.5 text-center font-bold text-[0.62rem] text-text-secondary border-b-2 border-border bg-bg sticky top-0 z-[1] tracking-[0.02em]">
                    {CAT_LABELS[cat]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.provinces.map(prov => (
                <tr key={prov} className="border-b border-border/60 hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-bold text-[0.72rem] text-text bg-bg sticky left-0 z-[1] border-r border-border/60">
                    {PROV_LABELS[prov] || prov}
                  </td>
                  {data.categories.map(cat => {
                    const cell = data.matrix[prov][cat];
                    const colors = cellColorClasses(cell.count);
                    const isSelected = selected?.prov === prov && selected?.cat === cat;
                    const isAnalyzing = bottomAnalysis?.prov === prov && bottomAnalysis?.cat === cat;
                    return (
                      <td
                        key={cat}
                        onClick={() => {
                          setBottomAnalysis({ prov, cat });
                          if (cell.count > 0) setSelected({ prov, cat });
                        }}
                        className={cn(
                          "px-2 py-2.5 text-center cursor-pointer transition-all duration-100 hover:scale-[1.05]",
                          !isSelected && !isAnalyzing && colors.bg,
                        )}
                        style={isSelected ? {
                          background: cellColorRaw(cell.count).border,
                          outline: `2px solid ${colors.outlineBorder}`,
                          outlineOffset: -2,
                        } : isAnalyzing ? {
                          outline: `2.5px solid #7A6A8A`,
                          outlineOffset: -2,
                          background: cellColorRaw(cell.count).bg,
                        } : undefined}
                      >
                        <div className={cn("text-[0.88rem] font-extrabold leading-none", colors.text)}>
                          {cell.count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* AI analysis — below table, scrolls with it */}
        {!loading && data && (
          <div className="px-0 py-3">
          <div className="bg-gradient-to-br from-[#2D2438] to-[#3D3248] rounded-xl border border-[#4D4458] overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-[#5B4A6B] to-[#7A6A8A] flex items-center justify-center shrink-0">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[0.72rem] font-bold text-[#EDE9F0]">Ask AI: why this gap?</div>
                  <div className="text-[0.58rem] text-[#A098A8]">Our best guess — we're still learning this landscape</div>
                </div>
              </div>
            </div>

            {/* What's being analyzed */}
            {bottomAnalysis && (() => {
              const analysisCell = data.matrix[bottomAnalysis.prov]?.[bottomAnalysis.cat];
              const cellCount = analysisCell?.count ?? 0;
              const rawColors = cellColorRaw(cellCount);
              return (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[0.62rem] font-bold px-2 py-[2px] rounded-full border"
                      style={{ background: rawColors.bg, color: rawColors.text, borderColor: rawColors.border }}
                    >{gapLabel(cellCount)}</span>
                    <span className="text-[0.72rem] font-semibold text-white">
                      {bottomAnalysis.prov} · {CAT_LABELS[bottomAnalysis.cat] || bottomAnalysis.cat}
                      {stage !== "All" && ` · ${STAGE_LABELS[stage]} stage`}
                    </span>
                    <span className="text-[0.62rem] text-[#A098A8]">
                      {cellCount} program{cellCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[0.6rem] text-[#8A7A9A]">
                      Click any cell in the map to analyze a different gap
                    </span>
                    {cellCount > 0 && onAskAI && (
                      <button
                        onClick={() => {
                          // Close gap map and open browse with this province + category as search
                          onClose();
                          // Use localStorage to signal browse should open with filter
                          try { localStorage.setItem("trellis_browse_filter", JSON.stringify({ search: CAT_LABELS[bottomAnalysis.cat] || bottomAnalysis.cat, province: bottomAnalysis.prov })); } catch {}
                          window.location.href = "/navigator?eco=true&browse=true";
                        }}
                        className="text-[0.62rem] font-semibold text-[#48B87A] hover:text-[#8CC63F] transition-colors bg-transparent border-none cursor-pointer p-0"
                      >
                        View {cellCount} program{cellCount !== 1 ? "s" : ""} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {!bottomAnalysis && (
              <div className="px-4 pb-3 text-[0.7rem] text-[#A098A8]">
                Tap any cell in the map above to see our analysis
              </div>
            )}

            {/* Analysis content */}
            {bottomAnalysis && (
              <div key={`${bottomAnalysis.prov}-${bottomAnalysis.cat}-${stage}`} className="px-1 pb-1">
                <ExplainCard prov={bottomAnalysis.prov} cat={bottomAnalysis.cat} stage={stage} mode={mode} autoFetch={true} />
              </div>
            )}
          </div>

          {onFeedback && (
            <div className="mt-2 text-center">
              <button onClick={onFeedback} className="bg-transparent border-none text-text-tertiary text-[0.65rem] p-0 cursor-pointer hover:text-text-secondary transition-colors">
                Know a program we're missing? Tell us →
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {selectedCell && (
        <CellDetail
          prov={selectedCell.prov}
          cat={selectedCell.cat}
          cell={selectedCell.cell}
          stage={stage}
          mode={mode}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
