import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { cn } from "../lib/cn";
import { TrellisLogo } from "../components/TrellisLogo";
import Wizard from "../components/Wizard";
import GapMatrix from "../components/GapMatrix";
import PathwayCard from "../components/PathwayCard";

interface Program {
  id: number; name: string; category: string;
  description: string | null; use_case: string[] | null;
  province: string[] | null; website: string | null;
  stage: string[] | null; status: string | null;
}

interface Message { role: "user" | "assistant"; content: string; }

interface WizardSnapshot {
  stage: string;
  provinces: string[];
  need: string;
  companyUrl?: string;
  productType?: string;
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
function renderMarkdown(text: string): string {
  let html = text
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
        <div className="max-w-[72%] bg-green-mid text-white rounded-[16px_16px_4px_16px] px-3.5 py-2.5 text-[0.82rem] leading-[1.55]">
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
      <div className="relative max-w-[84%] bg-bg text-text rounded-[16px_16px_16px_4px] px-4 py-3 text-[0.82rem] leading-[1.6] border border-border shadow-sm">
        {isPlain
          ? <span className="whitespace-pre-wrap">{msg.content}</span>
          : <div className="md-body" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
        }
        {showCopy && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(msg.content).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {});
            }}
            className={cn(
              "absolute top-2 right-2 border border-border rounded-sm px-2 py-0.5 text-[0.6rem] font-semibold transition-all opacity-70 hover:opacity-100",
              copied ? "bg-brand-green text-white" : "bg-bg-secondary text-text-tertiary"
            )}
          >{copied ? "✓ Copied" : "📋 Copy"}</button>
        )}
      </div>
    </div>
  );
}

function WizardSummary({ snapshot, onReset }: { snapshot: WizardSnapshot; onReset: () => void }) {
  const needMeta = snapshot.need ? NEED_META[snapshot.need] : null;
  return (
    <div className="mx-4 mb-3.5 px-3 py-2 bg-bg-secondary border border-border rounded flex items-center gap-1.5 flex-wrap text-[0.72rem]">
      {snapshot.stage && (
        <span className="bg-brand-green text-white px-2 py-0.5 rounded-full font-bold text-[0.65rem]">
          {STAGE_LABELS[snapshot.stage] || snapshot.stage}
        </span>
      )}
      {snapshot.provinces.map(p => (
        <span key={p} className="bg-bg-tertiary text-text-secondary px-[7px] py-0.5 rounded-full text-[0.65rem] font-semibold border border-border">
          {p}
        </span>
      ))}
      {needMeta && (
        <span className={cn("px-2 py-0.5 rounded-full text-[0.65rem] font-bold", needMeta.bgCls, needMeta.textCls)}>
          {needMeta.label}
        </span>
      )}
      <span className="flex-1" />
      <button onClick={onReset} className="bg-transparent border-none p-0 text-[0.65rem] text-text-tertiary cursor-pointer underline">
        Start over
      </button>
    </div>
  );
}

function CategoryPill({ cat }: { cat: string }) {
  const m = CAT_META[cat] || { label: cat, textCls: "text-[#555]", bgCls: "bg-[#eee]" };
  return (
    <span className={cn("text-[0.65rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", m.bgCls, m.textCls)}>
      {m.label}
    </span>
  );
}

function BrowsePanel({ onClose, onFeedback }: { onClose: () => void; onFeedback?: () => void }) {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [provFilter, setProvFilter] = useState("All");

  useEffect(() => {
    fetch("/api/programs").then(r => r.json()).then((d: Program[]) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchText = !q || [p.name, p.description || "", (p.province || []).join(" ")].some(f => f.toLowerCase().includes(q));
    const matchCat = catFilter === "All" || p.category === catFilter;
    const matchStage = stageFilter === "All" || (p.stage || []).includes(stageFilter);
    const matchProv = provFilter === "All" || (p.province || []).includes(provFilter) || (p.province || []).includes("National");
    return matchText && matchCat && matchStage && matchProv;
  });

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col">
      {/* Header */}
      <div className="px-[18px] h-14 flex justify-between items-center border-b border-border bg-[rgba(250,250,248,0.92)] backdrop-blur-[12px] shrink-0">
        <div>
          <span className="font-display font-normal text-[1.05rem] text-text">
            Program Database
          </span>
          {!loading && (
            <span className="text-[0.72rem] text-text-tertiary ml-2.5">
              {filtered.length} of {data.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="bg-bg-secondary border border-border rounded-sm px-4 py-1.5 text-[0.78rem] font-semibold text-text">
          Done
        </button>
      </div>

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
      </div>

      {/* Program list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="p-12 text-center text-text-tertiary">Loading programs…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary">No programs match your filters.</div>
        ) : (
          <div className="flex flex-col gap-px">
            {filtered.map(p => (
              <div key={p.id}
                className="px-[18px] py-3 bg-bg border-b border-border transition-colors hover:bg-bg-secondary"
              >
                <div className="mb-1">
                  <div className="font-bold text-[0.85rem] mb-1">
                    {p.website
                      ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-brand-green no-underline border-b border-[rgba(45,122,79,0.2)]">{p.name} ↗</a>
                      : <span className="text-text">{p.name}</span>}
                  </div>
                  <div className="flex gap-[5px] flex-wrap items-center">
                    <CategoryPill cat={p.category} />
                    <span className="text-[0.65rem] text-text-tertiary">
                      {(p.province || []).filter(x => x !== "National").join(", ") || (p.province?.includes("National") ? "National" : "—")}
                    </span>
                    {p.stage && p.stage.length > 0 && p.stage.map(st => (
                      <span key={st} className="text-[0.58rem] font-semibold bg-bg-tertiary px-[7px] py-px rounded text-text-tertiary">
                        {STAGE_LABELS[st] || st}
                      </span>
                    ))}
                  </div>
                </div>
                {p.description && (
                  <div className="text-[0.78rem] text-text-secondary leading-[1.5]">
                    {p.description}
                  </div>
                )}
              </div>
            ))}
          </div>
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
      await fetch("/api/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programName: `FEEDBACK: ${isEco ? "operator" : "founder"}${pageContext ? ` [${pageContext}]` : ""}`,
          bestFor: form.feedback,
          submitterName: form.name || "anonymous",
          submitterEmail: form.email || `anon-${Date.now()}@feedback`,
        }),
      });
      setDone(true);
    } catch { alert("Something went wrong."); }
    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] flex items-center justify-center p-5 animate-fade-in"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="bg-bg rounded-lg max-w-[440px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up">
        {/* Amber header */}
        <div className="bg-gradient-to-br from-[#8B6914] via-[#D4A828] to-[#BF9624] px-6 py-[18px] flex items-center gap-2.5">
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

        <div className="px-6 pt-5 pb-6">
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
const LOADING_MSGS = [
  "Searching across 347 programs…",
  "This usually takes 10–15 seconds — hang tight.",
  "Cross-referencing with ecosystem insights…",
  "Almost there…",
];
function LoadingMessages() {
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
  const [loading, setLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showGapMap, setShowGapMap] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wizardSnapshot, setWizardSnapshot] = useState<WizardSnapshot | null>(null);
  const [wizardDescription, setWizardDescription] = useState("");
  const [showPathway, setShowPathway] = useState(false);
  const [quickFeedbackSent, setQuickFeedbackSent] = useState(false);
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const [ecoMsgCount, setEcoMsgCount] = useState(0);
  const [showEcoCta, setShowEcoCta] = useState(false);
  const [feedbackMinimized, setFeedbackMinimized] = useState(false);
  const isEco = mode === "ec";
  const [showWizard, setShowWizard] = useState(!isEco);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlStage = params.get("stage");
      const urlProv = params.get("prov");
      const urlNeed = params.get("need");
      if (urlStage && urlProv) {
        const snapshot = { stage: urlStage, provinces: urlProv.split(","), need: urlNeed || "all" };
        setWizardSnapshot(snapshot);
        setWizardDescription(params.get("desc") || "an agtech company");
        setShowWizard(false);
        setShowPathway(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isEco) {
      const timer = setTimeout(() => setShowEcoCta(true), 20000);
      return () => clearTimeout(timer);
    }
  }, [isEco]);

  useEffect(() => {
    if (isEco && ecoMsgCount >= 2 && !showEcoCta) setShowEcoCta(true);
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
    if (!quickFeedbackSent) setTimeout(() => setShowQuickFeedback(true), 8000);
  }

  function handlePathwayFollowUp(question: string) {
    const newMessages: Message[] = [{ role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);
    const context = wizardSnapshot
      ? `Context: I'm building ${wizardDescription}. Stage: ${wizardSnapshot.stage}. Province: ${wizardSnapshot.provinces.join(", ")}. Need: ${wizardSnapshot.need}.\n\n${question}`
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

    let contextPrefix = "";
    if (wizardSnapshot && !isEco) {
      const parts = [`Stage: ${wizardSnapshot.stage}`, `Province: ${wizardSnapshot.provinces.join(", ")}`, `Need: ${wizardSnapshot.need}`];
      if (wizardDescription) parts.unshift(`Building: ${wizardDescription}`);
      if (wizardSnapshot.productType) parts.push(`Product type: ${wizardSnapshot.productType}`);
      if (wizardSnapshot.companyUrl) parts.push(`Website: ${wizardSnapshot.companyUrl}`);
      contextPrefix = `[Founder context: ${parts.join(". ")}]\n\n`;
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
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  }

  return (
    <>
      {showBrowse && <BrowsePanel onClose={() => setShowBrowse(false)} onFeedback={() => { setShowBrowse(false); setShowFeedback(true); }} />}
      {showGapMap && <GapMatrix onClose={() => setShowGapMap(false)} mode={mode === "ec" ? "ec" : "founder"} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isEco={isEco} pageContext={showPathway ? "pathway results" : showWizard ? "wizard" : isEco ? "ecosystem chat" : "chat"} />}

      <div className="fixed inset-0 bg-bg flex flex-col font-sans">

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="h-12 px-4 flex justify-between items-center bg-[rgba(250,250,248,0.92)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border shrink-0 z-10">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <TrellisLogo className="h-5" />
            <span className={cn(
              "text-[0.5rem] font-bold px-[5px] py-px rounded-[3px] tracking-[0.04em] uppercase",
              isEco ? "bg-eco-pill-bg text-eco-pill-text" : "bg-founder-pill-bg text-founder-pill-text"
            )}>{isEco ? "Partner" : "Founder"}</span>
          </Link>
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setShowBrowse(true)} className="bg-transparent border-none px-2.5 py-1.5 text-[0.72rem] font-semibold text-text-secondary">
              {isEco ? "Programs" : "All Programs"}
            </button>
            {isEco && (
              <button onClick={() => setShowGapMap(true)} className="bg-transparent border-none px-2.5 py-1.5 text-[0.72rem] font-semibold text-text-secondary">
                Gap Map
              </button>
            )}
          </div>
        </div>

        {/* ── Messages area ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pt-4 pb-3">

          {/* Eco operator welcome */}
          {isEco && messages.length === 0 && !loading && (
            <div className="px-4 py-5 animate-fade-in-up flex flex-col gap-3.5">

              {/* First-visit onboarding tip */}
              {(() => { try { return !sessionStorage.getItem("ag_eco_onboarded"); } catch { return true; } })() && (
                <div className="bg-gradient-to-br from-eco-accent-bg to-[#d8e5db] border border-[#b8ccbc] rounded px-4 py-3.5 flex gap-2.5 items-start">
                  <span className="text-[1.1rem] shrink-0">👋</span>
                  <div className="flex-1">
                    <div className="font-bold text-[0.82rem] text-brand-forest mb-1">
                      Welcome — start by finding yourself
                    </div>
                    <div className="text-[0.75rem] text-brand-green leading-[1.55] mb-2.5">
                      Tap <strong>Programs</strong> above and search your organization's name. See how you appear to founders — then hit the feedback button to tell us what we got wrong. We built this from public data and we know we're missing things.
                    </div>
                    <button onClick={() => { setShowBrowse(true); try { sessionStorage.setItem("ag_eco_onboarded", "1"); } catch {} }}
                      className="bg-brand-forest text-white border-none rounded-sm px-3.5 py-[7px] text-[0.75rem] font-semibold">
                      Search programs →
                    </button>
                  </div>
                  <button onClick={() => { try { sessionStorage.setItem("ag_eco_onboarded", "1"); } catch {} }}
                    className="bg-transparent border-none text-[0.72rem] text-brand-green px-1 font-semibold shrink-0">
                    ✕
                  </button>
                </div>
              )}

              {/* Main welcome card */}
              <div className="bg-bg border border-border rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] px-6 pt-[22px] pb-[18px]">
                  <div className="text-[0.55rem] font-bold tracking-[0.12em] uppercase text-brand-gold/70 mb-2">
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
                      { num: "347", label: "Programs" },
                      { num: "127", label: "Insights" },
                      { num: "10", label: "Provinces" },
                      { num: "6", label: "Categories" },
                    ].map((s, i) => (
                      <div key={i} className={cn(
                        "flex-1 py-2.5 text-center",
                        i < 3 && "border-r border-white/[0.08]"
                      )}>
                        <div className="text-base font-extrabold text-brand-gold">{s.num}</div>
                        <div className="text-[0.5rem] font-semibold text-white/55 tracking-[0.08em] uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gap insight preview cards */}
                <div className="px-4 py-3 bg-bg-secondary border-b border-border">
                  <div className="text-[0.6rem] font-bold tracking-[0.06em] uppercase text-text-tertiary mb-2">
                    Live coverage gaps
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { prov: "NB", gap: "0 pilot sites, 0 events", severity: "high" },
                      { prov: "NL", gap: "0 pilot sites, 0 events, 0 orgs", severity: "high" },
                      { prov: "QC", gap: "0 events, 1 industry org", severity: "medium" },
                      { prov: "BC", gap: "1 training, 2 events", severity: "medium" },
                    ].map((g, i) => (
                      <div key={i} onClick={() => send(`Show me the full coverage analysis for ${g.prov} — what's missing and what would you recommend?`)}
                        className={cn(
                          "flex-[1_1_calc(50%-4px)] min-w-[130px] px-2.5 py-2 rounded-sm bg-bg border border-border cursor-pointer transition-all",
                          g.severity === "high" ? "hover:border-[#ef4444]" : "hover:border-amber"
                        )}
                      >
                        <div className="flex items-center gap-[5px] mb-[3px]">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            g.severity === "high" ? "bg-[#ef4444]" : "bg-amber"
                          )} />
                          <span className="font-bold text-[0.75rem] text-text">{g.prov}</span>
                        </div>
                        <div className="text-[0.65rem] text-text-secondary leading-[1.4]">{g.gap}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick-start grid */}
                <div className="p-4 flex gap-2 flex-wrap">
                  {ECO_SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => send(s.q)}
                      className="flex-[1_1_calc(50%-4px)] min-w-[140px] px-3.5 py-2.5 rounded-sm border border-border bg-bg text-[0.78rem] font-semibold text-text text-left transition-all shadow-sm hover:border-brand-green hover:-translate-y-px"
                    >{s.label}</button>
                  ))}
                </div>

                {/* Tools pointer */}
                <div className="px-5 py-2.5 pb-3.5 border-t border-border text-[0.72rem] text-text-tertiary flex gap-3">
                  <span onClick={() => setShowGapMap(true)} className="cursor-pointer text-brand-green font-semibold">📊 Gap Map</span>
                  <span onClick={() => setShowBrowse(true)} className="cursor-pointer text-brand-green font-semibold">📋 Browse All Programs</span>
                </div>
              </div>
            </div>
          )}

          {!isEco && showWizard && (
            <Wizard onComplete={handleWizardComplete} />
          )}

          {!isEco && !showWizard && wizardSnapshot && (
            <WizardSummary snapshot={wizardSnapshot} onReset={handleReset} />
          )}

          {!isEco && showPathway && wizardSnapshot && (
            <PathwayCard
              description={wizardDescription}
              stage={wizardSnapshot.stage}
              provinces={wizardSnapshot.provinces}
              need={wizardSnapshot.need}
              onChatFollowUp={handlePathwayFollowUp}
            />
          )}

          {/* Chat messages */}
          {((!showWizard && !isEco) || (isEco && messages.length > 0)) && messages.map((m, i) => (
            <div key={i} ref={i === messages.length - 1 ? lastMsgRef : undefined}><ChatBubble msg={m} /></div>
          ))}
          {loading && <LoadingMessages />}
          <div ref={bottomRef} />
        </div>

        {/* ── Chat input ───────────────────────────────────────────── */}
        {(!showWizard || isEco) && (
        <div className="bg-bg border-t border-border-strong px-4 pt-3 pb-4 shrink-0 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
          {/* Eco suggestion chips above input when messages exist */}
          {isEco && messages.length > 0 && messages.length < 4 && (
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {ECO_SUGGESTIONS.filter(s => !messages.some(m => m.content === s.q)).slice(0, 3).map((s, i) => (
                <button key={i} onClick={() => send(s.q)}
                  className="px-3 py-[5px] rounded-full border border-border bg-bg-secondary text-[0.7rem] font-semibold text-text-secondary transition-all hover:border-brand-green"
                >{s.label}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={isEco ? "e.g., What's missing for biologicals companies in Saskatchewan?" : "Ask about your pathway, programs, or next steps…"}
              rows={2}
              className="flex-1 resize-none border-[1.5px] border-border rounded px-3.5 py-2.5 text-[0.85rem] leading-[1.5] outline-none bg-bg-secondary transition-all font-sans focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(45,122,79,0.08)]"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className={cn(
                "border-none rounded px-5 font-bold text-[0.9rem] transition-all min-w-[48px]",
                loading || !input.trim()
                  ? "bg-bg-tertiary text-text-tertiary"
                  : "bg-brand-gold text-brand-forest shadow-gold"
              )}
            >→</button>
          </div>
        </div>
        )}
      </div>

      {/* ── Quick feedback (founder) — compact, auto-collapses ──────── */}
      {showQuickFeedback && !quickFeedbackSent && !isEco && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-[4] animate-slide-up px-4 pointer-events-none">
          <div className="bg-bg border-[1.5px] border-amber rounded-full px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.12)] inline-flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[0.7rem] font-semibold text-text-secondary px-1.5 whitespace-nowrap">Useful?</span>
            {[
              { emoji: "🔥", value: "great" },
              { emoji: "👍", value: "ok" },
              { emoji: "🤷", value: "miss" },
            ].map(opt => (
              <button key={opt.value} onClick={() => {
                fetch("/api/submissions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    programName: `FEEDBACK: ${opt.value}`,
                    bestFor: `Stage: ${wizardSnapshot?.stage}, Prov: ${wizardSnapshot?.provinces.join(",")}, Need: ${wizardSnapshot?.need}`,
                    submitterName: "anonymous",
                    submitterEmail: `feedback-${Date.now()}@anon`,
                  }),
                }).catch(() => {});
                setQuickFeedbackSent(true);
                setShowQuickFeedback(false);
              }}
                className="w-9 h-9 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-base transition-transform hover:scale-[1.15]"
              >{opt.emoji}</button>
            ))}
            <button onClick={() => setShowQuickFeedback(false)} className="bg-transparent border-none text-[0.7rem] text-text-tertiary px-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Persistent feedback button — small, out of the way ──────── */}
      {!showFeedback && !showQuickFeedback && !feedbackMinimized && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-20 right-4 z-[4] bg-brand-gold text-white border-none rounded-full px-3.5 py-2 text-[0.7rem] font-bold shadow-gold flex items-center gap-[5px] animate-fade-in"
        >
          <span>💬</span> Feedback
          <span
            onClick={(e) => { e.stopPropagation(); setFeedbackMinimized(true); }}
            className="ml-1 opacity-70 text-[0.65rem]"
          >✕</span>
        </button>
      )}
    </>
  );
}
