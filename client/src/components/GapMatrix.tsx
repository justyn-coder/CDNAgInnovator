import { useEffect, useState } from "react";
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
  if (count === 0) return { bg: "bg-[#fde8e8]", text: "text-[#b91c1c]", border: "border-[#fca5a5]", outlineBorder: "#b91c1c" };
  if (count === 1) return { bg: "bg-[#fef9c3]", text: "text-[#854d0e]", border: "border-[#fde047]", outlineBorder: "#854d0e" };
  if (count === 2) return { bg: "bg-[#dcfce7]", text: "text-[#166534]", border: "border-[#86efac]", outlineBorder: "#166534" };
  return              { bg: "bg-[#d1fae5]", text: "text-[#064e3b]", border: "border-[#34d399]", outlineBorder: "#064e3b" };
}

// For inline-style contexts (badge borders etc.) we still need raw hex values
function cellColorRaw(count: number): { bg: string; text: string; border: string } {
  if (count === 0) return { bg: "#fde8e8", text: "#b91c1c", border: "#fca5a5" };
  if (count === 1) return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" };
  if (count === 2) return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
  return            { bg: "#d1fae5", text: "#064e3b", border: "#34d399" };
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

// ── AI Explain card ────────────────────────────────────────────────────────
function ExplainCard({
  prov, cat, stage, mode,
}: {
  prov: string; cat: string; stage: string; mode: string;
}) {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMeta, setShowMeta] = useState(false);
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

        <ExplainCard prov={prov} cat={cat} stage={stage} mode={mode} />

        {cell.count === 0 ? (
          <div className="px-4 py-5 bg-bg-secondary rounded text-center border border-dashed border-border">
            <div className="text-[1.2rem] mb-1.5">🤔</div>
            <div className="font-semibold text-[0.85rem] text-text mb-1">We didn't find any programs here</div>
            <div className="text-[0.75rem] text-text-secondary leading-[1.5]">
              This looks like a gap — but we might be missing something. If you know of a program that belongs here, we'd love to hear about it.
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
export default function GapMatrix({ onClose, onFeedback, mode = "founder" }: { onClose: () => void; onFeedback?: () => void; mode?: string }) {
  const [stage, setStage] = useState("All");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ prov: string; cat: string } | null>(null);
  const [showGuide, setShowGuide] = useState(() => {
    try {
      if (sessionStorage.getItem("ag_gap_guided")) return false;
      if (localStorage.getItem("trellis_ref")) return false;
      return true;
    } catch { return true; }
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = stage === "All" ? "/api/gaps" : `/api/gaps?stage=${stage}`;
    fetch(url)
      .then(r => r.json())
      .then((d: GapData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load gap data."); setLoading(false); });
  }, [stage]);

  useEffect(() => { setSelected(null); }, [stage]);

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
                    { label: "Gap (0)", bg: "bg-[#fde8e8]", color: "text-[#b91c1c]" },
                    { label: "Weak (1)", bg: "bg-[#fef9c3]", color: "text-[#854d0e]" },
                    { label: "Fair (2)", bg: "bg-[#dcfce7]", color: "text-[#166534]" },
                    { label: "Strong (3+)", bg: "bg-[#d1fae5]", color: "text-[#064e3b]" },
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
            { label: "Gap (0)", bg: "bg-[#fde8e8]", text: "text-[#b91c1c]" },
            { label: "Weak (1)", bg: "bg-[#fef9c3]", text: "text-[#854d0e]" },
            { label: "Fair (2)", bg: "bg-[#dcfce7]", text: "text-[#166534]" },
            { label: "Strong (3+)", bg: "bg-[#d1fae5]", text: "text-[#064e3b]" },
          ].map(l => (
            <span key={l.label} className={cn(
              "text-[0.58rem] font-bold px-1.5 py-[2px] rounded-[4px]",
              l.bg, l.text,
            )}>{l.label}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {loading && (
          <div className="p-12 text-center text-text-tertiary text-[0.85rem]">Loading gap data…</div>
        )}
        {error && (
          <div className="p-12 text-center text-[#b91c1c] text-[0.85rem]">{error}</div>
        )}
        {data && !loading && (
          <table className="border-collapse w-full min-w-[520px]">
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
                    return (
                      <td
                        key={cat}
                        onClick={() => setSelected({ prov, cat })}
                        className={cn(
                          "px-2 py-2.5 text-center cursor-pointer transition-all duration-100 hover:scale-[1.05]",
                          isSelected ? undefined : colors.bg,
                        )}
                        style={isSelected ? {
                          background: cellColorRaw(cell.count).border,
                          outline: `2px solid ${colors.outlineBorder}`,
                          outlineOffset: -2,
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
      </div>

      {/* Where we're light */}
      {!loading && data && (
        <div className="px-[18px] py-3 border-t border-border bg-bg-secondary shrink-0">
          <div className="text-[0.72rem] font-semibold text-text mb-0.5">
            Where we're light
          </div>
          <div className="text-[0.65rem] text-text-tertiary mb-2">
            Know a program we're missing? Flag it and we'll investigate.
          </div>
          <div className="flex gap-2 flex-wrap">
            {(() => {
              if (!data) return null;
              // Compute gaps dynamically from the matrix
              const provGaps: { prov: string; gap: string; severity: string; weakestCat: string }[] = [];
              for (const prov of data.provinces) {
                if (prov === "National") continue;
                const row = data.matrix[prov];
                if (!row) continue;
                const zeroCats: string[] = [];
                const oneCats: string[] = [];
                let minCount = Infinity;
                let weakest = data.categories[0];
                for (const cat of data.categories) {
                  const c = row[cat]?.count ?? 0;
                  if (c === 0) zeroCats.push(CAT_LABELS[cat] || cat);
                  else if (c === 1) oneCats.push(`1 ${(CAT_LABELS[cat] || cat).toLowerCase()}`);
                  if (c < minCount) { minCount = c; weakest = cat; }
                }
                if (zeroCats.length === 0 && oneCats.length === 0) continue;
                const parts: string[] = [];
                if (zeroCats.length > 0) parts.push(`0 ${zeroCats.map(c => c.toLowerCase() + "s").join(", 0 ")}`);
                if (oneCats.length > 0) parts.push(oneCats.join(", "));
                const severity = zeroCats.length >= 2 ? "high" : zeroCats.length >= 1 ? "high" : "medium";
                provGaps.push({ prov, gap: parts.join(", "), severity, weakestCat: weakest });
              }
              // Sort: most zeros first, then show top 4
              provGaps.sort((a, b) => (b.severity === "high" ? 1 : 0) - (a.severity === "high" ? 1 : 0));
              return provGaps.slice(0, 4).map((g, i) => (
                <div
                  key={i}
                  onClick={() => setSelected({ prov: g.prov, cat: g.weakestCat })}
                  className={`flex-[1_1_calc(50%-4px)] min-w-[130px] px-2.5 py-2 rounded-sm bg-bg border border-border cursor-pointer transition-all ${
                    g.severity === "high" ? "hover:border-[#ef4444]" : "hover:border-[#D4A828]"
                  }`}
                >
                  <div className="flex items-center gap-[5px] mb-[3px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      g.severity === "high" ? "bg-[#ef4444]" : "bg-[#D4A828]"
                    }`} />
                    <span className="font-bold text-[0.75rem] text-text">{g.prov}</span>
                  </div>
                  <div className="text-[0.65rem] text-text-secondary leading-[1.4]">{g.gap}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {onFeedback && (
        <div className="px-[18px] py-2.5 border-t border-border bg-gradient-to-r from-[#122b1f] to-[#1B4332] shrink-0 text-center">
          <button onClick={onFeedback} className="bg-transparent border-none text-white/90 text-[0.72rem] font-semibold p-0 cursor-pointer hover:text-white transition-colors">
            Know a program we're missing? Tell us and we'll investigate →
          </button>
        </div>
      )}

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
