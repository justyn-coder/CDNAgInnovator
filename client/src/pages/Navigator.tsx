import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { cn } from "../lib/cn";
import { SIGNAL_RESPONSES } from "../lib/signal-responses";

import Wizard from "../components/Wizard";
import GapMatrix from "../components/GapMatrix";
import PathwayCard from "../components/PathwayCard";
import CorrectionHintTooltip from "../components/CorrectionHintTooltip";
import DateFilter, { getDateBadge, DateBadge, type DateRange } from "../components/DateFilter";

interface Program {
  id: number; name: string; category: string;
  description: string | null; use_case: string[] | null;
  province: string[] | null; website: string | null;
  stage: string[] | null; status: string | null;
  fundingType: string | null; fundingMaxCad: number | null;
  mentorship: boolean | null; cohortBased: boolean | null;
  intakeFrequency: string | null; deadlineNotes: string | null;
  productionSystems: string[] | null; techDomains: string[] | null;
  featured: boolean | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  applicationDeadline?: string | null;
  eventLocation?: string | null;
  eventCity?: string | null;
  eventFormat?: string | null;
  registrationUrl?: string | null;
  registrationDeadline?: string | null;
  eventCostMin?: number | null;
  eventCostMax?: number | null;
  eventCostNote?: string | null;
}

interface Message { role: "user" | "assistant"; content: string; }

interface WizardSnapshot {
  stage: string;
  provinces: string[];
  sector?: string;
  need: string;
  companyUrl?: string;
  productType?: string;
  expansionProvinces?: string[];
  completedPrograms?: string[];
  otherPrograms?: string;
}

const CAT_META: Record<string, { label: string; textCls: string; bgCls: string }> = {
  Fund:  { label: "Funding",      textCls: "text-[#1a4b8c]", bgCls: "bg-[#e8f0fe]" },
  Accel: { label: "Accelerator",  textCls: "text-[#8c5a1a]", bgCls: "bg-[#fff3e0]" },
  Pilot: { label: "Pilot Site",   textCls: "text-[#1a6b2a]", bgCls: "bg-[#e8f5e9]" },
  Event: { label: "Event",        textCls: "text-[#8c1a3a]", bgCls: "bg-[#fce4ec]" },
  Org:   { label: "Industry Org", textCls: "text-[#6a1a8c]", bgCls: "bg-[#f3e5f5]" },
  Train: { label: "Training",     textCls: "text-[#1a6b7a]", bgCls: "bg-[#e0f7fa]" },
};
const CATEGORIES = Object.keys(CAT_META);
const STAGES = ["Idea", "MVP", "Pilot", "Comm", "Scale"];
const STAGE_LABELS: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

const PROVINCES_LIST = [
  { key: "AB", label: "Alberta" },
  { key: "SK", label: "Saskatchewan" },
  { key: "MB", label: "Manitoba" },
  { key: "ON", label: "Ontario" },
  { key: "BC", label: "British Columbia" },
  { key: "QC", label: "Quebec" },
  { key: "Atlantic", label: "Atlantic" },
  { key: "National", label: "National" },
];

const NEED_META: Record<string, { label: string; textCls: string; bgCls: string }> = {
  "non-dilutive-capital":        { label: "Funding",       textCls: "text-[#1a4b8c]", bgCls: "bg-[#e8f0fe]" },
  "validate-with-farmers":      { label: "Validation",    textCls: "text-[#1a6b2a]", bgCls: "bg-[#e8f5e9]" },
  "structured-program":         { label: "Program",       textCls: "text-[#8c5a1a]", bgCls: "bg-[#fff3e0]" },
  "pilot-site-field-validation": { label: "Pilot Site",   textCls: "text-[#1a6b2a]", bgCls: "bg-[#e8f5e9]" },
  "credibility-validation":     { label: "Credibility",   textCls: "text-[#0e7490]", bgCls: "bg-[#cffafe]" },
  "first-customers":             { label: "Customers",    textCls: "text-[#8c1a3a]", bgCls: "bg-[#fce4ec]" },
  "channel-distribution":        { label: "Distribution", textCls: "text-[#1a6b2a]", bgCls: "bg-[#e8f5e9]" },
  "go-to-market":                { label: "GTM Strategy", textCls: "text-[#1a4b8c]", bgCls: "bg-[#e8f0fe]" },
  "growth-capital":              { label: "Growth Capital",textCls: "text-[#6a1a8c]", bgCls: "bg-[#f3e5f5]" },
  "industry-connections":        { label: "Industry",     textCls: "text-[#8c5a1a]", bgCls: "bg-[#fff3e0]" },
  "accelerator":                 { label: "Program",      textCls: "text-[#8c5a1a]", bgCls: "bg-[#fff3e0]" },
  "market-expansion":            { label: "New Markets",  textCls: "text-[#1a4b8c]", bgCls: "bg-[#e8f0fe]" },
  "all":                         { label: "All Programs", textCls: "text-[#6a1a8c]", bgCls: "bg-[#f3e5f5]" },
};

// ── Eco operator quick-start prompts ────────────────────────────────────────
const ECO_SUGGESTIONS = [
  { label: "Where are founders getting stuck?", q: "Where are pilot-stage agtech companies getting stuck between validation and first revenue? What's the bottleneck by province?" },
  { label: "Advisor channel coverage", q: "Which provinces have the worst agronomist/CCA advisor channel coverage for farmer-facing agtech? Where are the named access points?" },
  { label: "Capital gaps by stage", q: "Show me where the capital gaps are between early-stage grants (RDAR, Alberta Innovates) and Series A readiness. What falls through the cracks?" },
  { label: "Programs missing in the West", q: "What types of agtech companies have no clear program pathway in Western Canada? Where would you invest if you were filling gaps?" },
  { label: "Biologicals ecosystem", q: "Map the biologicals/inputs ecosystem in Canada — who supports these companies at each stage and where are the holes?" },
];

// ── Markdown renderer ───────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(text: string): string {
  // Escape HTML first to prevent XSS, then apply markdown formatting
  let html = escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/(<\/h[123]>|<\/li>|<hr>)\n/g, '$1');

  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br>');

  return html || text;
}

function ChatBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end mb-2.5 px-4">
        <div className="max-w-[85%] md:max-w-[72%] bg-green-mid text-white rounded-[16px_16px_4px_16px] px-3.5 py-2.5 text-[0.82rem] leading-[1.55]">
          {msg.content}
        </div>
      </div>
    );
  }
  const html = renderMarkdown(msg.content);
  const isPlain = !msg.content.includes("###") && !msg.content.includes("**") && !msg.content.includes("##");
  const showCopy = msg.content.length > 200;
  return (
    <div className="flex justify-start mb-2.5 px-4">
      <div className="max-w-[92%] md:max-w-[84%] flex flex-col">
        <div className="bg-bg text-text rounded-[16px_16px_16px_4px] px-4 py-3 text-[0.82rem] leading-[1.6] border border-border shadow-sm overflow-hidden" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
          {isPlain
            ? <span className="whitespace-pre-wrap">{msg.content}</span>
            : <div className="md-body" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
          }
        </div>
        {showCopy && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(msg.content).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {});
            }}
            className={cn(
              "self-start mt-1 border border-border rounded-sm px-2.5 py-1 text-[0.7rem] font-semibold transition-all opacity-70 hover:opacity-100",
              copied ? "bg-brand-green text-white" : "bg-bg-secondary text-text-tertiary"
            )}
          >{copied ? "✓ Copied" : "📋 Copy"}</button>
        )}
      </div>
    </div>
  );
}



function CategoryPill({ cat }: { cat: string }) {
  const m = CAT_META[cat] || { label: cat, textCls: "text-[#555]", bgCls: "bg-[#eee]" };
  return (
    <span className={cn("text-[0.65rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]", m.bgCls, m.textCls)}>
      {m.label}
    </span>
  );
}

// ── Inline Correction Form ──────────────────────────────────────────────────
function CorrectionForm({ programName, onClose }: { programName: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [email, setEmail] = useState(() => {
    try { return sessionStorage.getItem("ag_fb_email") || ""; } catch { return ""; }
  });
  const [name, setName] = useState(() => {
    try { return sessionStorage.getItem("ag_fb_name") || ""; } catch { return ""; }
  });
  const [hasIdentity] = useState(() => {
    try { return !!(sessionStorage.getItem("ag_fb_email") || sessionStorage.getItem("ag_fb_name")); } catch { return false; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const resp = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programName: `CORRECTION: ${programName}`,
          bestFor: text.trim() + ((() => { try { const r = localStorage.getItem("trellis_ref"); return r ? ` [ref:${r}]` : ""; } catch { return ""; } })()),
          submitterName: name.trim() || "operator",
          submitterEmail: email.trim() || `correction-${Date.now()}@anon`,
        }),
      });
      if (!resp.ok) throw new Error();
      try {
        if (email.trim()) sessionStorage.setItem("ag_fb_email", email.trim());
        if (name.trim()) sessionStorage.setItem("ag_fb_name", name.trim());
      } catch {}
      setDone(true);
      setTimeout(onClose, 3000);
    } catch {
      alert("Something went wrong — try again");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div
        className="mt-2.5 px-3 py-2.5 rounded-lg text-center"
        style={{ background: "#FFF8E7", border: "1px solid rgba(212,168,40,0.27)", fontSize: 13, color: "#6b6b6b" }}
      >
        🙏 Thanks — we'll review this shortly
      </div>
    );
  }

  return (
    <div
      className="mt-2.5 rounded-lg"
      style={{ background: "#FFF8E7", border: "1px solid rgba(212,168,40,0.27)", padding: 12 }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: "#8B6914", marginBottom: 8 }}>
        Correction for {programName}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder='e.g., Description should mention X'
        rows={2}
        className="w-full outline-none resize-none font-sans"
        style={{
          border: "1px solid #D0D0CA",
          borderRadius: 6,
          background: "white",
          fontSize: 13,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          padding: "8px 10px",
          marginBottom: 6,
        }}
      />
      {hasIdentity ? (
        <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
          Sending as <strong style={{ color: "#6b6b6b" }}>{name || email}</strong>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full outline-none font-sans"
              style={{
                border: "1px solid #D0D0CA",
                borderRadius: 6,
                background: "white",
                fontSize: 13,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                padding: "8px 10px",
                flex: 1,
              }}
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="w-full outline-none font-sans"
              style={{
                border: "1px solid #D0D0CA",
                borderRadius: 6,
                background: "white",
                fontSize: 13,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                padding: "8px 10px",
                flex: 1,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
            So we can follow up — only used for this.
          </div>
        </>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={submitting || !text.trim()}
          style={{
            background: "#D4A828",
            color: "#1B4332",
            fontSize: 12,
            fontWeight: 500,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: submitting ? "wait" : "pointer",
            opacity: !text.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Sending…" : "Submit correction"}
        </button>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer"
          style={{ fontSize: 12, color: "#999" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function getDomain(url: string): string | null {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return null; }
}

function isHomepageOnly(url: string): boolean {
  try { const path = new URL(url).pathname; return path === "/" || path === ""; } catch { return false; }
}

// ── Program Card with inline correction ─────────────────────────────────────
function ProgramCard({ p }: { p: Program }) {
  const [showCorrection, setShowCorrection] = useState(false);
  const provinces = (p.province || []).filter(x => x !== "National").join(", ") || (p.province?.includes("National") ? "National" : "—");

  const isInactive = ["closed", "dissolved", "inactive", "announced"].includes(p.status || "");
  const statusLabel = p.status === "dissolved" ? "Dissolved" : p.status === "announced" ? "Announced" : p.status === "inactive" ? "Archived" : "Closed";

  return (
    <div className={cn("px-[18px] py-3 border-b border-border transition-colors hover:bg-bg-secondary", isInactive ? "bg-bg opacity-60" : "bg-bg")}>
      <div className="mb-1">
        <div className="font-medium text-[0.94rem] md:text-[1rem] mb-1 flex items-center gap-2">
          {p.website
            ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-brand-green no-underline border-b border-[rgba(45,122,79,0.2)]">{p.name} ↗</a>
            : <span className="text-text">{p.name}</span>}
          {isInactive && (
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide bg-[rgba(180,50,50,0.08)] text-[#9a3030] px-1.5 py-px rounded shrink-0">
              {statusLabel}
            </span>
          )}
        </div>
        <div className="flex gap-[5px] flex-wrap items-center">
          <CategoryPill cat={p.category} />
          <span className="text-[0.65rem] text-text-tertiary">{provinces}</span>
          {p.stage && p.stage.length > 0 && p.stage.map(st => (
            <span key={st} className="text-[0.65rem] font-semibold bg-bg-tertiary px-[7px] py-px rounded text-text-tertiary">
              {STAGE_LABELS[st] || st}
            </span>
          ))}
          {(() => {
            const badge = getDateBadge(p);
            return badge ? <DateBadge badge={badge} /> : null;
          })()}
        </div>
      </div>
      {p.description && (
        <div className="text-[0.82rem] md:text-[0.875rem] text-text-secondary leading-[1.5]">
          {p.description}
        </div>
      )}

      {/* Metadata pills */}
      {(() => {
        const pills: { label: string; icon?: string }[] = [];
        if (p.fundingType) {
          let label = p.fundingType.charAt(0).toUpperCase() + p.fundingType.slice(1);
          if (p.fundingMaxCad && p.fundingMaxCad > 0) {
            const amt = p.fundingMaxCad >= 1_000_000
              ? `$${(p.fundingMaxCad / 1_000_000).toFixed(p.fundingMaxCad % 1_000_000 === 0 ? 0 : 1)}M`
              : `$${(p.fundingMaxCad / 1_000).toFixed(0)}K`;
            label += ` up to ${amt}`;
          }
          pills.push({ label, icon: "💰" });
        }
        if (p.mentorship) pills.push({ label: "Mentorship", icon: "🤝" });
        if (p.cohortBased) pills.push({ label: "Cohort-based", icon: "👥" });
        if (p.intakeFrequency) {
          const freq = p.intakeFrequency.charAt(0).toUpperCase() + p.intakeFrequency.slice(1);
          pills.push({ label: `${freq} intake`, icon: "📅" });
        }
        const domains = (p.techDomains || []).filter(d => d !== "agnostic");
        if (domains.length > 0) {
          const labels: Record<string, string> = {
            precision_ag: "Precision Ag", ai_ml: "AI/ML", robotics: "Robotics",
            biologicals: "Biologicals", carbon: "Carbon", water: "Water",
            food_processing: "Food Processing", supply_chain: "Supply Chain",
            genetics: "Genetics", soil: "Soil", energy: "Energy",
          };
          pills.push({ label: domains.map(d => labels[d] || d).join(", "), icon: "🔬" });
        }
        const systems = (p.productionSystems || []).filter(s => s !== "agnostic");
        if (systems.length > 0) {
          const labels: Record<string, string> = {
            crop: "Crop", livestock: "Livestock", greenhouse: "Greenhouse",
            aquaculture: "Aquaculture", apiculture: "Apiculture", vertical: "Vertical Farming",
          };
          pills.push({ label: systems.map(s => labels[s] || s).join(", "), icon: "🌾" });
        }
        if (pills.length === 0) return null;
        return (
          <div className="flex gap-x-3 gap-y-1 flex-wrap mt-1.5">
            {pills.map((pill, i) => (
              <span key={i} className="text-[0.7rem] text-text-tertiary">
                {pill.icon && <span className="mr-0.5">{pill.icon}</span>}
                {pill.label}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Actions row */}
      <div
        className="flex items-center gap-4 mt-2 pt-2"
        style={{ borderTop: "1px solid #E5E5E0" }}
      >
        <button
          data-correction-link
          onClick={() => setShowCorrection(!showCorrection)}
          className="bg-transparent border-none cursor-pointer flex items-center gap-1 py-1.5 px-1"
          style={{ fontSize: 12, color: "#2D7A4F" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 3v8M3 7h8" stroke="#2D7A4F" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Suggest a correction
        </button>
        {p.website ? (
          <div className="flex flex-col">
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline flex items-center gap-1"
              style={{ fontSize: 12, color: "#2D7A4F" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 9l4-4M9 5v4h-4" stroke="#2D7A4F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {getDomain(p.website) || "Visit program"} ↗
            </a>
            {isHomepageOnly(p.website) && (
              <span style={{ fontSize: 11, color: "#999", marginLeft: 18 }}>(organization homepage)</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#999" }}>No website</span>
        )}
      </div>

      {/* Inline correction form */}
      {showCorrection && (
        <CorrectionForm programName={p.name} onClose={() => setShowCorrection(false)} />
      )}
    </div>
  );
}

// ── Browse Panel ────────────────────────────────────────────────────────────
function BrowsePanel({
  onClose,
  onFeedback,
  initialSearch,
  orgLabel,
  totalCount,
  onOpenGapMap,
  onOpenChat,
}: {
  onClose: () => void;
  onFeedback?: () => void;
  initialSearch?: string;
  orgLabel?: string | null;
  totalCount?: number;
  onOpenGapMap?: () => void;
  onOpenChat?: (question?: string) => void;
}) {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch || "");
  const [catFilter, setCatFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [provFilter, setProvFilter] = useState("All");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [sortMode, setSortMode] = useState<"default" | "upcoming">("default");
  const [programsLoadedAt] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);

  // Feature-discovery banner (15s) + founder-pathway bridge (60s)
  const [showFeatureBanner, setShowFeatureBanner] = useState(false);
  const [showFounderBridge, setShowFounderBridge] = useState(false);

  const isOperatorView = !!orgLabel;

  useEffect(() => {
    fetch("/api/programs").then(r => r.json()).then((d: Program[]) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Feature-discovery banner — 15s after mount (operator only)
  useEffect(() => {
    if (!isOperatorView) return;
    const dismissed = localStorage.getItem("trellis_bridge_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowFeatureBanner(true), 15000);
    return () => clearTimeout(timer);
  }, [isOperatorView]);

  // Founder pathway bridge — 60s after mount (operator only)
  useEffect(() => {
    if (!isOperatorView) return;
    const dismissed = localStorage.getItem("trellis_founder_bridge_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowFounderBridge(true), 25000);
    return () => clearTimeout(timer);
  }, [isOperatorView]);

  const HIDDEN_STATUSES = ["closed", "dissolved", "inactive", "announced"];
  const isSearching = search.trim().length > 0;

  // Active programs (for count display and default browse)
  const activeData = data.filter(p => !HIDDEN_STATUSES.includes(p.status || ""));

  const filtered = data.filter(p => {
    // In default browse mode, hide closed/dissolved/inactive/announced
    // When searching, show everything so users can find known programs
    if (!isSearching && HIDDEN_STATUSES.includes(p.status || "")) return false;
    const q = search.toLowerCase();
    const qRe = q ? new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') : null;
    const matchText = !qRe || [p.name, p.description || "", (p.province || []).join(" ")].some(f => qRe.test(f));
    const matchCat = catFilter === "All" || p.category === catFilter;
    const matchStage = stageFilter === "All" || (p.stage || []).includes(stageFilter);
    const matchProv = provFilter === "All" || (p.province || []).includes(provFilter) || (p.province || []).includes("National");
    // Date filter: check if any date field falls within the selected range
    let matchDate = true;
    if (dateRange.from || dateRange.to) {
      const dates = [p.eventStartDate, p.eventEndDate, p.applicationDeadline].filter(Boolean) as string[];
      if (dates.length === 0) {
        matchDate = false;
      } else {
        matchDate = dates.some(d => {
          if (dateRange.from && d < dateRange.from) return false;
          if (dateRange.to && d > dateRange.to) return false;
          return true;
        });
      }
    }
    return matchText && matchCat && matchStage && matchProv && matchDate;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "upcoming") {
      // Programs with dates first, sorted chronologically
      const aDate = a.eventStartDate || a.applicationDeadline;
      const bDate = b.eventStartDate || b.applicationDeadline;
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      if (aDate && bDate) return aDate.localeCompare(bDate);
      return a.name.localeCompare(b.name);
    }
    // Default sort: featured first, then alphabetical
    const aFeat = a.featured ? 1 : 0;
    const bFeat = b.featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    // AAFC demotion
    const aFed = a.name.toLowerCase().includes("aafc") || a.name.toLowerCase().includes("agriculture and agri-food");
    const bFed = b.name.toLowerCase().includes("aafc") || b.name.toLowerCase().includes("agriculture and agri-food");
    if (aFed && !bFed) return 1;
    if (!aFed && bFed) return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label="Program Database" onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      {/* Header */}
      <div className="px-[18px] h-14 flex justify-between items-center border-b border-border bg-[rgba(250,250,248,0.92)] backdrop-blur-[12px] shrink-0">
        <div>
          <span className="font-display font-normal text-[1.05rem] text-text">
            Program Database
          </span>
          {!loading && (
            <span className="text-[0.72rem] text-text-tertiary ml-2.5">
              {filtered.length} of {activeData.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isOperatorView && onOpenGapMap && (
            <button
              onClick={onOpenGapMap}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[0.72rem] font-semibold text-brand-green bg-transparent border border-transparent hover:border-border hover:bg-bg-secondary transition-all"
              title="Coverage Gap Map"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="#D4A828"/>
                <rect x="9" y="1" width="6" height="6" rx="1" fill="#48B87A"/>
                <rect x="1" y="9" width="6" height="6" rx="1" fill="#48B87A"/>
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#D4A828" opacity="0.5"/>
              </svg>
              <span className="hidden sm:inline">Gap Map</span>
            </button>
          )}
          {isOperatorView && onOpenChat && (
            <button
              onClick={() => onOpenChat?.()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[0.72rem] font-semibold text-brand-green bg-transparent border border-transparent hover:border-border hover:bg-bg-secondary transition-all"
              title="Ask AI about the ecosystem"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="#2D7A4F" strokeWidth="1.3" fill="none"/>
                <circle cx="5.5" cy="6.5" r="0.8" fill="#2D7A4F"/>
                <circle cx="8" cy="6.5" r="0.8" fill="#2D7A4F"/>
                <circle cx="10.5" cy="6.5" r="0.8" fill="#2D7A4F"/>
              </svg>
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}
          <button onClick={onClose} className="bg-bg-secondary border border-border rounded-sm px-4 py-1.5 text-[0.78rem] font-semibold text-text">
            ← Back
          </button>
        </div>
      </div>

      {/* Operator org header bar */}
      {orgLabel && (
        <div className="px-3 md:px-[18px] py-2.5 flex justify-between items-center gap-2 flex-wrap border-b border-border bg-bg-secondary shrink-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-display text-[1rem] md:text-[1.1rem] text-text truncate">
              Your {orgLabel.toUpperCase()} programs
            </span>
            <span className="shrink-0" style={{ fontSize: 13, color: "#999" }}>
              · {filtered.length} results
            </span>
          </div>
          <button
            onClick={() => setSearch("")}
            className="bg-transparent border-none cursor-pointer shrink-0"
            style={{ fontSize: 13, color: "#2D7A4F" }}
          >
            View all {activeData.length} →
          </button>
        </div>
      )}

      {/* Feature-discovery banner — 15s */}
      {showFeatureBanner && (
        <div
          className="mx-3 md:mx-[18px] mt-2.5"
          style={{
            background: "linear-gradient(135deg, #122b1f, #1B4332)",
            borderRadius: 10,
            padding: "12px 14px",
            animation: "slideDown 0.3s ease both, fadeIn 0.3s ease both",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span style={{ fontSize: 13, color: "white", fontWeight: 600 }}>
              ✦ See the bigger picture
            </span>
            <button
              onClick={() => {
                setShowFeatureBanner(false);
                try { localStorage.setItem("trellis_bridge_dismissed", "true"); } catch {}
              }}
              className="bg-transparent border-none cursor-pointer px-2 py-1"
              style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            {onOpenGapMap && (
              <button
                onClick={onOpenGapMap}
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-sm px-3 py-2 transition-all cursor-pointer"
                style={{ fontSize: 12, color: "white", fontWeight: 500 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="#D4A828"/>
                  <rect x="9" y="1" width="6" height="6" rx="1" fill="#48B87A"/>
                  <rect x="1" y="9" width="6" height="6" rx="1" fill="#48B87A"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="#D4A828" opacity="0.5"/>
                </svg>
                Coverage Gaps
              </button>
            )}
            {onOpenChat && (
              <button
                onClick={() => onOpenChat?.()}
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-sm px-3 py-2 transition-all cursor-pointer"
                style={{ fontSize: 12, color: "white", fontWeight: 500 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="white" strokeWidth="1.3" fill="none"/>
                  <circle cx="5.5" cy="6.5" r="0.8" fill="white"/>
                  <circle cx="8" cy="6.5" r="0.8" fill="white"/>
                  <circle cx="10.5" cy="6.5" r="0.8" fill="white"/>
                </svg>
                Ask AI
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            Where is coverage thin? What are founders struggling with? Get answers.
          </div>
        </div>
      )}

      {/* Founder pathway bridge — 60s */}
      {showFounderBridge && (
        <div
          className="mx-3 md:mx-[18px] mt-2.5 flex items-center justify-between gap-2 flex-wrap"
          style={{
            background: "#1B4332",
            borderRadius: 10,
            padding: "10px 14px",
            animation: "slideDown 0.3s ease both, fadeIn 0.3s ease both",
          }}
        >
          <span style={{ fontSize: 13, color: "white" }}>
            🌱 Curious how founders discover these programs?
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/navigator"
              onClick={() => {
                try { localStorage.setItem("ag_nav_mode", "e"); } catch {}
              }}
              className="no-underline"
              style={{ fontSize: 13, color: "#D4A828", fontWeight: 500 }}
            >
              Try the founder pathway →
            </a>
            <button
              onClick={() => {
                setShowFounderBridge(false);
                try { localStorage.setItem("trellis_founder_bridge_dismissed", "true"); } catch {}
              }}
              className="bg-transparent border-none cursor-pointer px-2 py-1.5"
              style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Founder pathway bridge — visible immediately for non-operator users */}
      {!isOperatorView && (
        <div
          className="mx-3 md:mx-[18px] mt-2.5 flex items-center justify-between gap-2 flex-wrap"
          style={{
            background: "#1B4332",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <span style={{ fontSize: 13, color: "white" }}>
            🌱 <strong>See what founders experience.</strong> 4 quick questions and we match them to programs for their stage.
          </span>
          <a
            href="/navigator"
            onClick={(e) => {
              e.preventDefault();
              try { localStorage.setItem("ag_nav_mode", "e"); } catch {}
              window.location.href = "/navigator";
            }}
            className="no-underline shrink-0"
            style={{ fontSize: 13, color: "#D4A828", fontWeight: 500 }}
          >
            Build founder pathway →
          </a>
        </div>
      )}

      {/* Filters */}
      <div className="px-[18px] py-2.5 flex gap-2 flex-wrap bg-bg-secondary border-b border-border shrink-0">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
          className="flex-[1_1_180px] px-3.5 py-2 rounded-sm border-[1.5px] border-border text-[0.82rem] bg-bg outline-none font-sans focus:border-brand-green"
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-sm border-[1.5px] border-border text-[0.78rem] bg-bg text-text font-sans">
          <option value="All">All Types</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-sm border-[1.5px] border-border text-[0.78rem] bg-bg text-text font-sans">
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
        </select>
        <select value={provFilter} onChange={e => setProvFilter(e.target.value)}
          className="px-3 py-2 rounded-sm border-[1.5px] border-border text-[0.78rem] bg-bg text-text font-sans">
          <option value="All">All Provinces</option>
          {PROVINCES_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <DateFilter onChange={(range) => { setDateRange(range); }} />
        <select value={sortMode} onChange={e => setSortMode(e.target.value as "default" | "upcoming")}
          className="px-3 py-2 rounded-sm border-[1.5px] border-border text-[0.78rem] bg-bg text-text font-sans">
          <option value="default">Sort: Default</option>
          <option value="upcoming">Sort: Upcoming dates</option>
        </select>
      </div>

      {/* Program list */}
      <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden py-2 relative">
        {loading ? (
          <div className="p-12 text-center text-text-tertiary">🌾 Loading programs…</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary">🔍 No programs match those filters — try broadening your search.</div>
        ) : (
          <div className="flex flex-col gap-px">
            {sorted.map(p => (
              <ProgramCard key={p.id} p={p} />
            ))}
          </div>
        )}
        {/* Explore More — discovery card at bottom of list (operator only) */}
        {isOperatorView && !loading && sorted.length > 0 && (
          <div
            className="mx-3 md:mx-[18px] my-4 rounded-lg overflow-hidden border border-border"
            style={{ animation: "fadeIn 0.3s ease both" }}
          >
            <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] px-4 py-3">
              <div className="text-[0.65rem] font-bold tracking-[0.1em] uppercase text-brand-gold/60 mb-1">
                Beyond the list
              </div>
              <div className="text-[0.92rem] font-display text-white leading-[1.3]">
                You've seen the programs. Now see the gaps.
              </div>
            </div>
            <div className="bg-bg p-3 flex gap-2">
              {onOpenGapMap && (
                <button
                  onClick={onOpenGapMap}
                  className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 bg-bg-secondary border border-border rounded-sm transition-all hover:border-brand-green hover:-translate-y-px cursor-pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1" y="1" width="6" height="6" rx="1" fill="#D4A828"/>
                    <rect x="9" y="1" width="6" height="6" rx="1" fill="#48B87A"/>
                    <rect x="1" y="9" width="6" height="6" rx="1" fill="#48B87A"/>
                    <rect x="9" y="9" width="6" height="6" rx="1" fill="#D4A828" opacity="0.5"/>
                  </svg>
                  <span className="text-[0.75rem] font-semibold text-text">Gap Map</span>
                  <span className="text-[0.65rem] text-text-tertiary leading-[1.4] text-center">
                    Province × category coverage
                  </span>
                </button>
              )}
              {onOpenChat && (
                <button
                  onClick={() => onOpenChat?.()}
                  className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 bg-bg-secondary border border-border rounded-sm transition-all hover:border-brand-green hover:-translate-y-px cursor-pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="#2D7A4F" strokeWidth="1.3" fill="none"/>
                    <circle cx="5.5" cy="6.5" r="0.8" fill="#2D7A4F"/>
                    <circle cx="8" cy="6.5" r="0.8" fill="#2D7A4F"/>
                    <circle cx="10.5" cy="6.5" r="0.8" fill="#2D7A4F"/>
                  </svg>
                  <span className="text-[0.75rem] font-semibold text-text">Ask AI</span>
                  <span className="text-[0.65rem] text-text-tertiary leading-[1.4] text-center">
                    Ecosystem intelligence queries
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        {isOperatorView && !loading && sorted.length > 0 && (
          <CorrectionHintTooltip containerRef={listRef} />
        )}
      </div>

      {/* Feedback prompt */}
      {onFeedback && (
        <div className="px-[18px] py-2 border-t border-border bg-brand-gold shrink-0 text-center">
          <button onClick={onFeedback} className="bg-transparent border-none text-white text-[0.72rem] font-semibold p-0">
            💬 See something missing? Tell us →
          </button>
        </div>
      )}

    </div>
  );
}

// ── Feedback Modal (replaces old Submit form) ───────────────────────────────
function FeedbackModal({ onClose, isEco, pageContext }: { onClose: () => void; isEco: boolean; pageContext?: string }) {
  const [hasIdentity] = useState(() => {
    try { return !!sessionStorage.getItem("ag_fb_email"); } catch { return false; }
  });
  const [form, setForm] = useState(() => {
    let email = "", name = "";
    try {
      email = sessionStorage.getItem("ag_fb_email") || "";
      name = sessionStorage.getItem("ag_fb_name") || "";
    } catch {}
    return { feedback: "", email, name };
  });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.feedback.trim()) { alert("Please share some feedback."); return; }
    try {
      if (form.email) sessionStorage.setItem("ag_fb_email", form.email);
      if (form.name) sessionStorage.setItem("ag_fb_name", form.name);
    } catch {}
    setBusy(true);
    try {
      const resp = await fetch("/api/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programName: `FEEDBACK: ${isEco ? "operator" : "founder"}${pageContext ? ` [${pageContext}]` : ""}${(() => { try { const r = localStorage.getItem("trellis_ref"); return r ? ` [ref:${r}]` : ""; } catch { return ""; } })()}`,
          bestFor: form.feedback,
          submitterName: form.name || "anonymous",
          submitterEmail: form.email || `anon-${Date.now()}@feedback`,
        }),
      });
      if (!resp.ok) throw new Error();
      setDone(true);
    } catch { alert("Something went wrong."); }
    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] flex items-center justify-center p-5 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Beta Feedback"
      onClick={onClose}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
    >
      <div onClick={e => e.stopPropagation()} className="bg-bg rounded-lg max-w-[440px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up">
        {/* Amber header */}
        <div className="bg-gradient-to-br from-[#8B6914] via-[#D4A828] to-[#BF9624] px-4 md:px-6 py-[18px] flex items-center gap-2.5">
          <span className="text-[1.3rem]">⚠️</span>
          <div>
            <div className="font-bold text-[0.92rem] text-white">
              Beta Feedback
            </div>
            <div className="text-[0.72rem] text-white/90">
              {pageContext ? `Feedback on: ${pageContext}` : "Help us build the tool you actually need"}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pt-5 pb-6">
          {done ? (
            <div className="text-center py-3">
              <div className="text-[1.4rem] mb-2">✓</div>
              <p className="font-bold text-[0.88rem] mb-1">Thanks — that's genuinely helpful.</p>
              <p className="text-[0.78rem] text-text-secondary mb-4">We'll reach out if we have questions.</p>
              <button onClick={onClose} className="bg-brand-green text-white border-none rounded-sm px-5 py-2 font-semibold text-[0.82rem]">Close</button>
            </div>
          ) : (
            <>
              <div className="mb-3.5">
                <label className="text-[0.72rem] font-semibold text-text-secondary">
                  What's working? What's wrong? What's missing? *
                </label>
                <textarea value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                  placeholder={isEco ? "e.g. My program isn't listed, the gap data is wrong for SK, I'd use this if it had…" : "e.g. The pathway was great but missed X, the loading took too long, I wish it showed…"}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-sm border-[1.5px] border-border text-[0.82rem] mt-1 outline-none bg-bg-secondary resize-none font-sans focus:border-brand-gold"
                />
              </div>
              {!hasIdentity && (
                <div className="flex gap-2.5 mb-4">
                  <div className="flex-1">
                    <label className="text-[0.68rem] font-semibold text-text-tertiary">Your name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Optional"
                      className="w-full px-2.5 py-2 rounded-sm border border-border text-[0.8rem] mt-[3px] outline-none bg-bg-secondary font-sans"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[0.68rem] font-semibold text-text-tertiary">Email <span className="text-brand-gold">(so we can follow up)</span></label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com"
                      type="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                      className="w-full px-2.5 py-2 rounded-sm border border-border text-[0.8rem] mt-[3px] outline-none bg-bg-secondary font-sans"
                    />
                  </div>
                </div>
              )}
              {hasIdentity && (
                <div className="text-[0.68rem] text-text-tertiary mb-3.5">
                  Sending as <strong className="text-text-secondary">{form.name || form.email}</strong>
                </div>
              )}
              <button onClick={submit} disabled={busy}
                className="w-full py-[11px] bg-brand-gold text-brand-forest border-none rounded-sm font-bold text-[0.85rem] shadow-gold"
              >{busy ? "Sending…" : "Send Feedback"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading Messages ─────────────────────────────────────────────────────────
function LoadingMessages({ programCount }: { programCount?: number | null }) {
  const LOADING_MSGS = [
    `Searching across ${programCount ?? 410} programs…`,
    "This usually takes 10–15 seconds — hang tight.",
    "Cross-referencing with ecosystem insights…",
    "Almost there…",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setIdx(1), 4000),
      setTimeout(() => setIdx(2), 8000),
      setTimeout(() => setIdx(3), 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="px-4 pb-1">
      <div className="inline-flex items-center gap-2 bg-bg border border-border rounded-[16px_16px_16px_4px] px-4 py-2.5 shadow-sm">
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-[5px] h-[5px] rounded-full bg-text-tertiary animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
        <span className="text-[0.75rem] text-text-secondary font-sans font-medium transition-opacity duration-300">
          {LOADING_MSGS[idx]}
        </span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Navigator() {
  const [mode] = useState<"e" | "ec">(() => { try { return (localStorage.getItem("ag_nav_mode") as "e" | "ec") || "e"; } catch { return "e"; } });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatFocused, setChatFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showGapMap, setShowGapMap] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wizardSnapshot, setWizardSnapshot] = useState<WizardSnapshot | null>(null);
  const [wizardDescription, setWizardDescription] = useState("");
  const [showPathway, setShowPathway] = useState(false);
  const [ecoMsgCount, setEcoMsgCount] = useState(0);
  // showEcoCta removed — was set but never used in JSX
  const [showNudgeBanner, setShowNudgeBanner] = useState(false);
  const isEco = mode === "ec";
  const [showWizard, setShowWizard] = useState(!isEco);
  const bottomRef = useRef<HTMLDivElement>(null);
  const feedbackFooterRef = useRef<HTMLButtonElement>(null);
  const feedbackBounceCount = useRef(0);

  function nudgeFeedbackFooter() {
    if (feedbackBounceCount.current >= 3) return;
    feedbackBounceCount.current += 1;
    const el = feedbackFooterRef.current;
    if (!el) return;
    el.style.transition = "transform 0.3s ease";
    el.style.transform = "translateY(-4px)";
    setTimeout(() => { el.style.transform = "translateY(0)"; }, 300);
  }

  // Restored journey state (Save My Journey)
  const [restoredPathwayData, setRestoredPathwayData] = useState<any>(null);
  const [restoredName, setRestoredName] = useState<string | null>(null);
  const [restoredSavedAt, setRestoredSavedAt] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  // Dynamic counts for operator dashboard
  const [programCount, setProgramCount] = useState<number | null>(null);

  // Operator params: ?eco=true&org=fcc or ?browse=true
  const [orgParam, setOrgParam] = useState<string | null>(null);
  const [browseInitialSearch, setBrowseInitialSearch] = useState<string>("");

  // Fetch dynamic counts for operator dashboard
  useEffect(() => {
    fetch("/api/programs").then(r => r.json()).then((d: any[]) => {
      const hidden = new Set(["closed", "dissolved", "inactive", "announced"]);
      setProgramCount(d.filter((p: any) => !hidden.has(p.status || "")).length);
    }).catch(() => {});
  }, []);

  // Read URL params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eco = params.get("eco");
      const org = params.get("org");
      const browse = params.get("browse");
      const ref = params.get("ref");

      // Store ref for attribution if present
      if (ref) {
        try { localStorage.setItem("trellis_ref", ref); } catch {}
      }

      // Operator arriving with org filter → open BrowsePanel immediately
      if (eco === "true" && org) {
        setOrgParam(org);
        setBrowseInitialSearch(org);
        setShowBrowse(true);
        try { sessionStorage.setItem("ag_eco_onboarded", "1"); } catch {}
      } else if (eco === "true") {
        // Operator without org — show normal eco dashboard
      } else if (browse === "true") {
        // Founder chose "browse all programs"
        setShowBrowse(true);
      }

      // Handle saved journey restore
      const journeyToken = params.get("journey");
      if (journeyToken) {
        setRestoreLoading(true);
        setShowWizard(false);
        fetch(`/api/journey/restore?token=${encodeURIComponent(journeyToken)}`)
          .then(r => {
            if (!r.ok) throw new Error("not found");
            return r.json();
          })
          .then(data => {
            const ws = data.wizardSnapshot;
            setWizardSnapshot({
              stage: ws.stage,
              provinces: ws.provinces,
              need: ws.need,
              sector: ws.sector || undefined,
              companyUrl: ws.companyUrl || undefined,
              productType: ws.productType || undefined,
              expansionProvinces: ws.expansionProvinces || undefined,
              completedPrograms: ws.completedPrograms || undefined,
            });
            setWizardDescription(ws.description);
            setRestoredPathwayData(data.pathwayData);
            setRestoredName(data.name);
            setRestoredSavedAt(data.savedAt);
            setIsRestored(true);
            setShowPathway(true);
            setRestoreLoading(false);
          })
          .catch(() => {
            setRestoreError("This link is no longer valid.");
            setRestoreLoading(false);
          });
        return; // Don't process other URL params when restoring
      }

      // Handle shared pathway links
      const urlStage = params.get("stage");
      const urlProv = params.get("prov");
      const urlNeed = params.get("need");
      const urlSector = params.get("sector");
      if (urlStage && urlProv) {
        const snapshot = { stage: urlStage, provinces: urlProv.split(","), sector: urlSector || undefined, need: urlNeed || "all" };
        setWizardSnapshot(snapshot);
        setWizardDescription(params.get("desc") || "an agtech company");
        setShowWizard(false);
        setShowPathway(true);
      }
    } catch {}
  }, []);

  // Feedback tooltip — 3s after mount, auto-dismiss after 8s
  useEffect(() => {
    const nudged = localStorage.getItem("trellis_feedback_nudged");
    if (nudged) return;
    const show = setTimeout(() => setShowNudgeBanner(true), 3000);
    return () => clearTimeout(show);
  }, []);

  // Auto-dismiss tooltip after 8s
  useEffect(() => {
    if (!showNudgeBanner) return;
    const auto = setTimeout(() => {
      setShowNudgeBanner(false);
      try { localStorage.setItem("trellis_feedback_nudged", "true"); } catch {}
    }, 15000);
    return () => clearTimeout(auto);
  }, [showNudgeBanner]);

  useEffect(() => {
    // eco CTA tracking (reserved for future use)
  }, [ecoMsgCount]);

  const lastMsgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (loading) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [messages.length, loading]);

  function handleWizardComplete(prompt: string, snapshot: WizardSnapshot) {
    setShowWizard(false);
    setWizardSnapshot(snapshot);
    const descMatch = prompt.match(/I'm building (.+?)\.(?:\s*My product is|\s*I'm at)/);
    setWizardDescription(descMatch ? descMatch[1] : "an agtech company");
    setShowPathway(true);
    nudgeFeedbackFooter();
  }

  function handlePathwayFollowUp(question: string) {
    const newMessages: Message[] = [{ role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);
    const context = wizardSnapshot
      ? `Context: I'm building ${wizardDescription}. Stage: ${wizardSnapshot.stage}. Province: ${wizardSnapshot.provinces.join(", ")}. Sector: ${wizardSnapshot.sector || "not specified"}. Need: ${wizardSnapshot.need}.\n\n${question}`
      : question;
    fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: context, mode, history: [] }),
    })
      .then(r => r.json())
      .then(data => { setMessages(m => [...m, { role: "assistant", content: data.reply || "Something went wrong." }]); })
      .catch(() => { setMessages(m => [...m, { role: "assistant", content: "Network error — please try again." }]); })
      .finally(() => setLoading(false));
  }

  function handleReset() {
    setShowWizard(true);
    setShowPathway(false);
    setWizardSnapshot(null);
    setMessages([]);
    setInput("");
  }

  async function send(overrideText?: string) {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    if (isEco) setEcoMsgCount(c => c + 1);

    // Check for pre-baked signal card responses (instant, no API call)
    const normalized = text.toLowerCase().replace(/[?.!]+$/, "");
    const cachedKey = Object.keys(SIGNAL_RESPONSES).find(
      k => k.toLowerCase().replace(/[?.!]+$/, "") === normalized
    );
    if (cachedKey) {
      setMessages(m => [...m, { role: "assistant", content: SIGNAL_RESPONSES[cachedKey] }]);
      setLoading(false);
      return;
    }

    let contextPrefix = "";
    if (wizardSnapshot && !isEco) {
      const parts = [`Stage: ${wizardSnapshot.stage}`, `Province: ${wizardSnapshot.provinces.join(", ")}`, `Need: ${wizardSnapshot.need}`];
      if (wizardDescription) parts.unshift(`Building: ${wizardDescription}`);
      if (wizardSnapshot.sector) parts.push(`Sector: ${wizardSnapshot.sector}`);
      if (wizardSnapshot.productType) parts.push(`Product type: ${wizardSnapshot.productType}`);
      if (wizardSnapshot.companyUrl) parts.push(`Website: ${wizardSnapshot.companyUrl}`);
      if (wizardSnapshot.expansionProvinces?.length) parts.push(`Expanding into: ${wizardSnapshot.expansionProvinces.join(", ")}`);
      if (wizardSnapshot.completedPrograms?.length) parts.push(`Already completed: ${wizardSnapshot.completedPrograms.join(", ")}`);

      // Stage-aware guidance
      let stageGuidance = "";
      if (wizardSnapshot.stage === "Idea" || wizardSnapshot.stage === "MVP") {
        stageGuidance = ' The founder may be a farmer-entrepreneur. Use plain language: say "grants" not "non-dilutive funding," say "programs that help you get started" not "pre-seed accelerators." Don\'t assume they know what a pitch deck or term sheet is.';
      } else if ((wizardSnapshot.stage === "Pilot" || wizardSnapshot.stage === "Comm") && wizardSnapshot.completedPrograms?.length) {
        stageGuidance = ` This founder has already completed: ${wizardSnapshot.completedPrograms.join(", ")}. Don't recommend these. Focus on programs they likely haven't encountered: province-specific, newer programs, niche funding, and pilot site networks. Surface the second tier.`;
      } else if (wizardSnapshot.stage === "Scale") {
        stageGuidance = " The founder is at Scale stage. Focus on: programs in new provinces, later-stage and growth capital, international expansion pathways, strategic connections, and new market opportunities. Don't just list programs — provide strategic context.";
      }

      contextPrefix = `[Founder context: ${parts.join(". ")}${stageGuidance}]\n\n`;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextPrefix + text,
          mode,
          history: newMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply || "Something went wrong." }]);
      nudgeFeedbackFooter();
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {showBrowse && (
        <BrowsePanel
          onClose={() => { setShowBrowse(false); setOrgParam(null); }}
          onFeedback={() => { setShowBrowse(false); setShowFeedback(true); }}
          initialSearch={browseInitialSearch}
          orgLabel={orgParam}
          onOpenGapMap={() => { setShowBrowse(false); setOrgParam(null); setShowGapMap(true); }}
          onOpenChat={(question) => { setShowBrowse(false); setOrgParam(null); if (question) send(question); }}
        />
      )}
      {showGapMap && <GapMatrix onClose={() => setShowGapMap(false)} onFeedback={() => { setShowGapMap(false); setShowFeedback(true); }} mode={mode === "ec" ? "ec" : "founder"} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isEco={isEco} pageContext={showPathway ? "pathway results" : showWizard ? "wizard" : isEco ? "ecosystem chat" : "chat"} />}

      <div className="fixed inset-0 bg-bg flex flex-col font-sans overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="h-16 md:h-[72px] px-4 md:px-6 flex justify-between items-center bg-[rgba(250,250,248,0.92)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border shrink-0 z-10">
          <Link href="/" className="no-underline grid items-center" style={{ gridTemplateColumns: "auto 1fr", gridTemplateRows: "auto auto", columnGap: 6 }}>
            {/* Icon — spans both rows */}
            <svg viewBox="0 0 28 34" className="h-8 md:h-9 row-span-2" aria-hidden="true">
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
            {/* Wordmark */}
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: "0.01em", color: "#1a1a18", lineHeight: 1 }}>
              Trellis
            </span>
            {/* Tagline */}
            <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#999", lineHeight: 1, marginTop: -1 }}>
              Canada's AgTech Ecosystem
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            {isEco && messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.78rem", color: "#2D7A4F", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                ← Back to start
              </button>
            )}
            <button
              onClick={() => {
                localStorage.setItem("ag_nav_mode", isEco ? "e" : "ec");
                window.location.href = "/navigator";
              }}
              className={cn(
                "rounded-full px-3.5 py-1 text-[0.72rem] font-semibold tracking-[0.02em] cursor-pointer transition-all hover:brightness-95 active:brightness-90 border-none",
                isEco
                  ? "bg-eco-pill-bg text-eco-pill-text"
                  : "bg-founder-pill-bg text-founder-pill-text"
              )}
              title={isEco ? "Switch to founder view" : "Switch to partner view"}
            >
              {isEco ? "Partners" : "Founders"}
              <span className="ml-1 opacity-60">▾</span>
            </button>
          </div>
        </div>


        {/* ── Messages area ────────────────────────────────────────── */}
        <div data-scroll-container className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-4 pb-3" role="log" aria-live="polite">

          {/* Eco operator welcome */}
          {isEco && messages.length === 0 && !loading && (
            <div className="px-4 py-5 animate-fade-in-up flex flex-col gap-3.5">

              {/* First-visit onboarding tip */}
              {!orgParam && (() => { try { return !sessionStorage.getItem("ag_eco_onboarded"); } catch { return true; } })() && (
                <div className="bg-gradient-to-br from-eco-accent-bg to-[#d8e5db] border border-[#b8ccbc] rounded px-4 py-3.5 flex gap-2.5 items-start">
                  <span className="text-[1.1rem] shrink-0">👋</span>
                  <div className="flex-1">
                    <div className="font-bold text-[0.82rem] text-brand-forest mb-1">
                      Welcome — start by finding yourself
                    </div>
                    <div className="text-[0.75rem] text-brand-green leading-[1.55] mb-2.5">
                      Search for your organization below. See how you appear to founders — then tell us what we got wrong. We built this from public data and we know we're missing things.
                    </div>
                    <button onClick={() => { setShowBrowse(true); try { sessionStorage.setItem("ag_eco_onboarded", "1"); } catch {} }}
                      className="bg-brand-forest text-white border-none rounded-sm px-3.5 py-[7px] text-[0.75rem] font-semibold">
                      Search programs →
                    </button>
                  </div>
                  <button onClick={() => { try { sessionStorage.setItem("ag_eco_onboarded", "1"); } catch {} }}
                    className="bg-transparent border-none text-[0.72rem] text-brand-green px-2 py-1.5 font-semibold shrink-0"
                    aria-label="Dismiss">
                    ✕
                  </button>
                </div>
              )}

              {/* Main welcome card */}
              <div className="bg-bg border border-border rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] px-4 md:px-6 pt-[22px] pb-[18px]">
                  <div className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-brand-gold/70 mb-2">
                    Ecosystem Intelligence
                  </div>
                  <h2 className="font-display text-[1.2rem] font-normal text-white leading-[1.2] mb-1.5">
                    What do you want to know?
                  </h2>
                  <p className="text-[0.82rem] text-white/80 leading-[1.6]">
                    We've catalogued what we could find — ask a question, or poke holes in our data. Seriously, we need that.
                  </p>

                  {/* Stats strip */}
                  <div className="flex mt-4 bg-white/[0.06] rounded-[8px] overflow-hidden">
                    {[
                      { num: programCount !== null ? String(programCount) : "…", label: "Programs" },
                      { num: "10", label: "Provinces" },
                      { num: "6", label: "Categories" },
                    ].map((s, i) => (
                      <div key={i} className={cn(
                        "flex-1 py-2.5 text-center",
                        i < 2 && "border-r border-white/[0.08]"
                      )}>
                        <div className="text-base font-extrabold text-brand-gold">{s.num}</div>
                        <div className="text-[0.62rem] font-semibold text-white/55 tracking-[0.08em] uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons — Search Programs + View Gap Map */}
                <div className="px-4 py-3 flex gap-2 border-b border-border">
                  <button
                    onClick={() => { setBrowseInitialSearch(""); setOrgParam(null); setShowBrowse(true); nudgeFeedbackFooter(); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-bg border border-border rounded-sm text-[0.82rem] font-semibold text-text transition-all hover:border-brand-green hover:-translate-y-px shadow-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="5" stroke="#1B4332" strokeWidth="1.5"/>
                      <path d="M11 11l3 3" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Search Programs
                  </button>
                  <button
                    onClick={() => { setShowGapMap(true); nudgeFeedbackFooter(); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-bg border border-border rounded-sm text-[0.82rem] font-semibold text-text transition-all hover:border-brand-green hover:-translate-y-px shadow-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="1" y="1" width="6" height="6" rx="1" fill="#D4A828"/>
                      <rect x="9" y="1" width="6" height="6" rx="1" fill="#48B87A"/>
                      <rect x="1" y="9" width="6" height="6" rx="1" fill="#48B87A"/>
                      <rect x="9" y="9" width="6" height="6" rx="1" fill="#D4A828" opacity="0.5"/>
                    </svg>
                    View Gap Map
                  </button>
                </div>

                {/* Ecosystem Signals */}
                <div className="px-4 py-4 bg-bg-secondary border-b border-border">
                  <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-text-tertiary mb-1">
                    What the data shows
                  </div>
                  <div className="text-[0.65rem] text-text-tertiary mb-3">
                    Pre-computed from {programCount !== null ? programCount : "…"} programs across 10 provinces
                  </div>

                  {/* Asymmetric grid: featured left, stacked right */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

                    {/* Featured: Scale Cliff */}
                    <div className="md:col-span-3 bg-[#F0EDE6] rounded-sm px-4 py-4">
                      <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-[#B45309] mb-2">
                        The Scale Cliff
                      </div>
                      <div className="font-display text-[1.1rem] md:text-[1.25rem] text-text leading-[1.2] mb-1">
                        The ecosystem builds founders up, then drops them.
                      </div>

                      {/* Stage funnel sparkline */}
                      <div className="flex items-end gap-1 mt-3 mb-1" style={{ height: 64 }}>
                        {[
                          { label: "Idea", count: 154 },
                          { label: "MVP", count: 280 },
                          { label: "Pilot", count: 235 },
                          { label: "Comm", count: 240 },
                          { label: "Scale", count: 117 },
                        ].map((s) => {
                          const barH = Math.round((s.count / 280) * 48);
                          const isScale = s.label === "Scale";
                          return (
                            <div key={s.label} className="flex flex-col items-center justify-end flex-1" style={{ height: "100%" }}>
                              <div
                                className="w-full rounded-sm"
                                style={{
                                  height: barH,
                                  backgroundColor: isScale ? "#B45309" : "#2D5A3D",
                                  opacity: isScale ? 1 : s.label === "Idea" ? 0.3 : s.label === "MVP" ? 0.6 : 0.45,
                                }}
                              />
                              <span className={cn(
                                "text-[0.55rem] mt-0.5",
                                isScale ? "text-[#B45309] font-semibold" : "text-text-tertiary"
                              )}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[0.72rem] text-text-secondary leading-[1.5] mb-3 max-w-[380px]">
                        240 programs help at commercialization. By the time a founder needs to scale, 117 remain. A 51% drop.
                      </div>
                      <button
                        onClick={() => send("Where does support disappear between pilot and scale stage?")}
                        className="group bg-transparent border-none p-0 cursor-pointer flex items-center gap-1.5 text-[0.72rem] text-brand-green hover:underline"
                        style={{ textUnderlineOffset: "3px" }}
                      >
                        <span>Where does support disappear at scale?</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                          className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Right column: stacked */}
                    <div className="md:col-span-2 flex flex-col">

                      {/* Alberta's Paradox */}
                      <div className="pb-3 mb-3 border-b border-border">
                        <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-text-tertiary mb-1.5">
                          Alberta's Paradox
                        </div>
                        <div className="font-display text-[1rem] md:text-[1.1rem] text-text leading-[1.2] mb-1.5">
                          76 programs. 1 for scale-stage ag.
                        </div>
                        <div className="text-[0.72rem] text-text-secondary leading-[1.5] mb-2.5">
                          Alberta has more programs than any province. But only 12% are ag-food specific. For a scale-stage agtech company, there's exactly one dedicated option.
                        </div>
                        <button
                          onClick={() => send("What's actually available for a scale-stage agtech company in Alberta?")}
                          className="group bg-transparent border-none p-0 cursor-pointer flex items-center gap-1.5 text-[0.72rem] text-brand-green hover:underline"
                          style={{ textUnderlineOffset: "3px" }}
                        >
                          <span>What's available for scale-stage ag in Alberta?</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Funding Valley */}
                      <div>
                        <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-text-tertiary mb-1.5">
                          The Funding Valley
                        </div>
                        <div className="font-display text-[1rem] md:text-[1.1rem] text-text leading-[1.2] mb-1.5">
                          6 programs in the $500K-$1M band.
                        </div>
                        <div className="text-[0.72rem] text-text-secondary leading-[1.5] mb-2.5">
                          23 programs fund under $150K. 20 fund over $1M. Founders who've outgrown grants but aren't ready for venture have almost nowhere to go.
                        </div>
                        <button
                          onClick={() => send("What funding options exist between $500K and $1M for agtech companies with revenue?")}
                          className="group bg-transparent border-none p-0 cursor-pointer flex items-center gap-1.5 text-[0.72rem] text-brand-green hover:underline"
                          style={{ textUnderlineOffset: "3px" }}
                        >
                          <span>What's in the $500K-$1M funding gap?</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Correction escape valve */}
                  <div className="text-right mt-2">
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="bg-transparent border-none cursor-pointer text-[0.68rem] text-text-tertiary hover:text-brand-green transition-colors"
                      style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
                    >
                      See something off? Help us get it right
                    </button>
                  </div>
                </div>


              </div>
            </div>
          )}

          {/* Restore loading state */}
          {restoreLoading && (
            <div className="m-4 px-4 md:px-6 py-9 bg-bg border border-border rounded-lg shadow-md text-center animate-fade-in-up">
              <div className="text-[0.88rem] text-text font-semibold mb-2">Restoring your pathway...</div>
              <div className="text-[0.78rem] text-text-tertiary">Just a moment.</div>
            </div>
          )}

          {/* Restore error state */}
          {restoreError && (
            <div className="m-4 px-4 md:px-6 py-7 bg-bg border border-border rounded-lg text-center animate-fade-in-up">
              <div className="text-[0.88rem] text-text font-semibold mb-2">{restoreError}</div>
              <button
                onClick={() => { setRestoreError(""); setShowWizard(true); }}
                className="bg-brand-gold text-brand-forest border-none rounded-sm px-5 py-2.5 font-semibold text-[0.82rem] mt-2"
              >
                Start a new pathway
              </button>
            </div>
          )}

          {/* Welcome-back banner (restored journeys) */}
          {isRestored && showPathway && wizardSnapshot && (
            <div
              className="mx-4 mt-3 px-4 py-3 rounded-lg flex items-center justify-between gap-3 flex-wrap animate-fade-in-up"
              style={{ background: "#E8F5E9", border: "0.5px solid rgba(76,175,80,0.3)" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#2E7D32" }}>
                  Welcome back{restoredName ? `, ${restoredName}` : ""}.
                </div>
                {restoredSavedAt && (
                  <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>
                    Saved on {new Date(restoredSavedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}. Programs may have changed since then.
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setIsRestored(false);
                  setRestoredPathwayData(null);
                  setShowPathway(false);
                  setShowWizard(true);
                }}
                className="shrink-0 px-3 py-1.5 bg-transparent text-[#2E7D32] border border-[rgba(76,175,80,0.3)] rounded-sm font-medium text-[0.72rem] transition-colors hover:bg-[rgba(76,175,80,0.1)]"
              >
                Edit profile
              </button>
            </div>
          )}

          {!isEco && showWizard && !restoreLoading && (
            <Wizard onComplete={handleWizardComplete} programCount={programCount} />
          )}

          {!isEco && showPathway && wizardSnapshot && (
            <PathwayCard
              description={wizardDescription}
              stage={wizardSnapshot.stage}
              provinces={wizardSnapshot.provinces}
              sector={wizardSnapshot.sector}
              need={wizardSnapshot.need}
              onChatFollowUp={handlePathwayFollowUp}
              onReset={handleReset}
              needLabel={wizardSnapshot.need ? (NEED_META[wizardSnapshot.need]?.label || wizardSnapshot.need) : undefined}
              expansionProvinces={wizardSnapshot.expansionProvinces}
              completedPrograms={wizardSnapshot.completedPrograms}
              companyUrl={wizardSnapshot.companyUrl}
              productType={wizardSnapshot.productType}
              initialData={restoredPathwayData || undefined}
              isRestored={isRestored}
            />
          )}

          {/* Chat messages */}
          {((!showWizard && !isEco) || (isEco && messages.length > 0)) && messages.map((m, i) => (
            <div key={i} ref={i === messages.length - 1 ? lastMsgRef : undefined}><ChatBubble msg={m} /></div>
          ))}
          {loading && <LoadingMessages programCount={programCount} />}
          <div ref={bottomRef} />
        </div>

        {/* ── Chat input ───────────────────────────────────────────── */}
        {(!showWizard || isEco) && (
        <div className="shrink-0 border-t border-border-strong shadow-[0_-2px_12px_rgba(0,0,0,0.04)] max-w-full overflow-hidden box-border">
          {/* Eco suggestion chips — above input */}
          {isEco && messages.length < 4 && (() => {
            const chips = ECO_SUGGESTIONS.filter(s => !messages.some(m => m.content === s.q));
            if (chips.length === 0) return null;
            return (
              <div
                className="flex gap-1.5 px-4 md:px-6 pt-2 pb-1 overflow-x-auto md:flex-wrap [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
              >
                {chips.slice(0, messages.length === 0 ? 5 : 3).map((s, i) => (
                  <button key={i} onClick={() => send(s.q)}
                    className="shrink-0 cursor-pointer font-sans transition-all bg-bg-secondary border border-border text-text-secondary hover:border-brand-green hover:text-text hover:bg-bg-tertiary"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: "0.68rem",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >{s.label}</button>
                ))}
              </div>
            );
          })()}

          {/* Input row */}
          <div className="px-4 md:px-6 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
            <div className="flex-1 min-w-0 relative">
              {!input && !chatFocused && (
                <div className="absolute inset-0 flex flex-col justify-center pointer-events-none pl-3 md:pl-3.5">
                  <div className="text-[0.82rem] md:text-[0.85rem] text-text-tertiary leading-tight">
                    <span className="font-semibold">AI Chat:</span> Ask me anything.
                  </div>
                  <div className="text-[0.65rem] text-text-tertiary/60 mt-0.5">
                    Built from public data · Still learning
                  </div>
                </div>
              )}
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                onFocus={() => setChatFocused(true)}
                onBlur={() => setChatFocused(false)}
                placeholder=""
                rows={1}
                style={{ minHeight: "44px" }}
                className="w-full resize-none border-[1.5px] border-border rounded-lg px-3 py-2 md:px-3.5 md:py-2.5 text-[16px] md:text-[0.85rem] leading-[1.4] outline-none bg-white transition-all font-sans focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(45,122,79,0.08)]"
              />
            </div>
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className={cn(
                "border-none rounded-lg px-4 font-bold text-[0.9rem] transition-all min-w-[44px]",
                loading || !input.trim()
                  ? "bg-bg-tertiary text-text-tertiary"
                  : "bg-brand-green text-white shadow-green"
              )}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
        )}

        {/* ── Feedback tooltip — first visit only ──────── */}
        {showNudgeBanner && (
          <div className="shrink-0 px-3 pb-1 z-[250] animate-[slideUp_0.3s_ease-out_both]">
            <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] rounded-lg px-4 py-3 shadow-lg relative">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[0.78rem] text-white/90 leading-[1.55]">
                  🌱 You're testing Trellis early — if something's off, let us know below!
                </div>
                <button
                  onClick={() => {
                    setShowNudgeBanner(false);
                    try { localStorage.setItem("trellis_feedback_nudged", "true"); } catch {}
                  }}
                  className="shrink-0 text-[0.72rem] font-semibold text-brand-chartreuse hover:text-white transition-colors cursor-pointer"
                  style={{ border: "none", background: "none", padding: "2px 0" }}
                >
                  Got it
                </button>
              </div>
              {/* Triangle pointing down to feedback bar */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1B4332] rotate-45" />
            </div>
          </div>
        )}

        {/* ── Feedback bar — tappable, always visible ──────── */}
        <button
          ref={feedbackFooterRef}
          onClick={() => {
            setShowFeedback(true);
            if (showNudgeBanner) {
              setShowNudgeBanner(false);
              try { localStorage.setItem("trellis_feedback_nudged", "true"); } catch {}
            }
          }}
          className="shrink-0 w-full flex items-center justify-center gap-2 bg-bg-secondary cursor-pointer hover:bg-bg-tertiary transition-colors h-7 md:h-[38px]"
          style={{ border: "none", borderTop: "1px solid var(--color-border, #E5E5E0)" }}
        >
          <span className="text-[0.68rem] md:text-xs" style={{ color: "#2D7A4F", fontWeight: 600 }}>
            💬 Something wrong or missing? Tell us →
          </span>
        </button>
      </div>

    </>
  );
}
