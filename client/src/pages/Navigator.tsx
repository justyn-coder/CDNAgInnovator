import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
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
}

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  Fund:  { label: "Funding",      color: "#1a4b8c", bg: "#e8f0fe" },
  Accel: { label: "Accelerator",  color: "#8c5a1a", bg: "#fff3e0" },
  Pilot: { label: "Pilot Site",   color: "#1a6b2a", bg: "#e8f5e9" },
  Event: { label: "Event",        color: "#8c1a3a", bg: "#fce4ec" },
  Org:   { label: "Industry Org", color: "#6a1a8c", bg: "#f3e5f5" },
  Train: { label: "Training",     color: "#1a6b7a", bg: "#e0f7fa" },
};
const CATEGORIES = Object.keys(CAT_META);
const STAGES = ["Idea", "MVP", "Pilot", "Comm", "Scale"];
const STAGE_LABELS: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

const NEED_META: Record<string, { label: string; color: string; bg: string }> = {
  "non-dilutive-capital":        { label: "Funding",      color: "#1a4b8c", bg: "#e8f0fe" },
  "pilot-site-field-validation": { label: "Pilot Site",   color: "#1a6b2a", bg: "#e8f5e9" },
  "accelerator":                 { label: "Accelerator",  color: "#8c5a1a", bg: "#fff3e0" },
  "first-customers":             { label: "Customers",    color: "#8c1a3a", bg: "#fce4ec" },
  "channel-distribution":        { label: "Distribution",  color: "#1a6b2a", bg: "#e8f5e9" },
  "market-expansion":            { label: "New Markets",   color: "#1a4b8c", bg: "#e8f0fe" },
  "growth-capital":              { label: "Growth Capital",   color: "#6a1a8c", bg: "#f3e5f5" },
  "industry-connections":        { label: "Industry",     color: "#8c5a1a", bg: "#fff3e0" },
  "all":                         { label: "All Programs", color: "#6a1a8c", bg: "#f3e5f5" },
};

// ── Eco operator quick-start prompts ────────────────────────────────────────
const ECO_SUGGESTIONS = [
  { label: "Coverage gaps in Alberta", q: "Show me coverage gaps in Alberta — where are founders underserved?" },
  { label: "MVP programs in Ontario", q: "What programs exist for MVP-stage companies in Ontario?" },
  { label: "Prairie pilot site comparison", q: "Compare Prairie provinces for pilot site availability" },
  { label: "Missing for biologicals", q: "What's missing for biologicals companies nationally?" },
  { label: "National funding landscape", q: "Give me an overview of the national funding landscape for early-stage agtech" },
];

// ── Markdown renderer ───────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l|h])/gm, '')
    .replace(/(<\/h[123]>|<\/li>|<hr>)\n/g, '$1')
    || text;
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, padding: "0 16px" }}>
        <div style={{
          maxWidth: "72%", background: "var(--green-mid)", color: "#fff",
          borderRadius: "16px 16px 4px 16px", padding: "10px 14px",
          fontSize: "0.82rem", lineHeight: 1.55,
        }}>{msg.content}</div>
      </div>
    );
  }
  const html = renderMarkdown(msg.content);
  const isPlain = !msg.content.includes("###") && !msg.content.includes("**") && !msg.content.includes("##");
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10, padding: "0 16px" }}>
      <div style={{
        maxWidth: "84%", background: "var(--bg)", color: "var(--text)",
        borderRadius: "16px 16px 16px 4px", padding: "12px 16px",
        fontSize: "0.82rem", lineHeight: 1.6,
        border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
      }}>
        {isPlain
          ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          : <div className="md-body" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
        }
      </div>
    </div>
  );
}

function WizardSummary({ snapshot, onReset }: { snapshot: WizardSnapshot; onReset: () => void }) {
  const needMeta = snapshot.need ? NEED_META[snapshot.need] : null;
  return (
    <div style={{
      margin: "0 16px 14px", padding: "8px 12px",
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.72rem",
    }}>
      {snapshot.stage && (
        <span style={{
          background: "var(--green-mid)", color: "#fff",
          padding: "2px 8px", borderRadius: 100, fontWeight: 700, fontSize: "0.65rem",
        }}>{STAGE_LABELS[snapshot.stage] || snapshot.stage}</span>
      )}
      {snapshot.provinces.map(p => (
        <span key={p} style={{
          background: "var(--bg-tertiary)", color: "var(--text-secondary)",
          padding: "2px 7px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600,
          border: "1px solid var(--border)",
        }}>{p}</span>
      ))}
      {needMeta && (
        <span style={{
          background: needMeta.bg, color: needMeta.color,
          padding: "2px 8px", borderRadius: 100, fontSize: "0.65rem", fontWeight: 700,
        }}>{needMeta.label}</span>
      )}
      <span style={{ flex: 1 }} />
      <button onClick={onReset} style={{
        background: "none", border: "none", padding: 0,
        fontSize: "0.65rem", color: "var(--text-tertiary)",
        cursor: "pointer", textDecoration: "underline",
      }}>Start over</button>
    </div>
  );
}

function CategoryPill({ cat }: { cat: string }) {
  const m = CAT_META[cat] || { label: cat, color: "#555", bg: "#eee" };
  return (
    <span style={{
      fontSize: "0.65rem", fontWeight: 600, padding: "2px 8px",
      borderRadius: 100, background: m.bg, color: m.color, whiteSpace: "nowrap",
    }}>{m.label}</span>
  );
}

function BrowsePanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  useEffect(() => {
    fetch("/api/programs").then(r => r.json()).then((d: Program[]) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchText = !q || [p.name, p.description || "", (p.province || []).join(" ")].some(f => f.toLowerCase().includes(q));
    const matchCat = catFilter === "All" || p.category === catFilter;
    const matchStage = stageFilter === "All" || (p.stage || []).includes(stageFilter);
    return matchText && matchCat && matchStage;
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "0 18px", height: 56, display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)", background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", flexShrink: 0,
      }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.05rem", color: "var(--text)" }}>
            Program Database
          </span>
          {!loading && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginLeft: 10 }}>
              {filtered.length} of {data.length}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "6px 16px",
          fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
        }}>Done</button>
      </div>
      <div style={{
        padding: "10px 18px", display: "flex", gap: 8, flexWrap: "wrap",
        background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
          style={{
            flex: "1 1 180px", padding: "8px 14px", borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)", fontSize: "0.82rem", background: "var(--bg)",
            outline: "none", fontFamily: "var(--font-text)",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--green-mid)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)",
          fontSize: "0.78rem", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-text)",
        }}>
          <option value="All">All Types</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
          padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)",
          fontSize: "0.78rem", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-text)",
        }}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>Loading programs…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>No programs match your filters.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                padding: "12px 18px", background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
                display: "flex", gap: 12, transition: "background 0.1s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
              >
                <div style={{ flex: "0 0 240px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>
                    {p.website
                      ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-mid)", textDecoration: "none", borderBottom: "1px solid rgba(30,107,10,0.2)" }}>{p.name} ↗</a>
                      : <span style={{ color: "var(--text)" }}>{p.name}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    <CategoryPill cat={p.category} />
                    <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>
                      {(p.province || []).filter(x => x !== "National").join(", ") || (p.province?.includes("National") ? "National" : "—")}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {p.description || "—"}
                  </div>
                  {p.stage && p.stage.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 5 }}>
                      {p.stage.map(st => (
                        <span key={st} style={{
                          fontSize: "0.58rem", fontWeight: 600, background: "var(--bg-tertiary)",
                          padding: "1px 7px", borderRadius: 4, color: "var(--text-tertiary)",
                        }}>{STAGE_LABELS[st] || st}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedback Modal (replaces old Submit form) ───────────────────────────────
function FeedbackModal({ onClose, isEco, pageContext }: { onClose: () => void; isEco: boolean; pageContext?: string }) {
  const [form, setForm] = useState(() => {
    // Load saved identity from sessionStorage
    let email = "", name = "";
    try {
      email = sessionStorage.getItem("ag_fb_email") || "";
      name = sessionStorage.getItem("ag_fb_name") || "";
    } catch {}
    return { feedback: "", email, name };
  });
  const hasIdentity = !!form.email;
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.feedback.trim()) { alert("Please share some feedback."); return; }
    // Save identity for next time
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "var(--radius-lg)",
        maxWidth: 440, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        overflow: "hidden", animation: "slideUp 0.3s ease",
      }}>
        {/* Amber header */}
        <div style={{
          background: "linear-gradient(135deg, #92400e, #b45309, #d97706)",
          padding: "18px 24px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>
              Beta Feedback
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>
              {pageContext ? `Feedback on: ${pageContext}` : "Help us build the tool you actually need"}
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>✓</div>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>Thanks — that's genuinely helpful.</p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 16 }}>We'll reach out if we have questions.</p>
              <button onClick={onClose} style={{ background: "var(--green-mid)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 20px", fontWeight: 600, fontSize: "0.82rem" }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  What's working? What's wrong? What's missing? *
                </label>
                <textarea value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                  autoFocus
                  placeholder={isEco ? "e.g. My program isn't listed, the gap data is wrong for SK, I'd use this if it had…" : "e.g. The pathway was great but missed X, the loading took too long, I wish it showed…"}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                    border: "1.5px solid var(--border)", fontSize: "0.82rem", marginTop: 4,
                    outline: "none", background: "var(--bg-secondary)", resize: "none",
                    fontFamily: "var(--font-text)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#d97706")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              {/* Show identity fields only if we don't have them yet */}
              {!hasIdentity && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-tertiary)" }}>Your name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Optional"
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)", fontSize: "0.8rem", marginTop: 3,
                        outline: "none", background: "var(--bg-secondary)", fontFamily: "var(--font-text)",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-tertiary)" }}>Email <span style={{ color: "#d97706" }}>(so we can follow up)</span></label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com"
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)", fontSize: "0.8rem", marginTop: 3,
                        outline: "none", background: "var(--bg-secondary)", fontFamily: "var(--font-text)",
                      }}
                    />
                  </div>
                </div>
              )}
              {hasIdentity && (
                <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginBottom: 14 }}>
                  Sending as <strong style={{ color: "var(--text-secondary)" }}>{form.name || form.email}</strong>
                </div>
              )}
              <button onClick={submit} disabled={busy} style={{
                width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #d97706, #b45309)",
                color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
                fontWeight: 700, fontSize: "0.85rem",
                boxShadow: "0 2px 8px rgba(217,119,6,0.3)",
              }}>{busy ? "Sending…" : "Send Feedback"}</button>
            </>
          )}
        </div>
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
  // Partner engagement: show CTA after they've sent 2+ messages or been idle 20s
  const [ecoMsgCount, setEcoMsgCount] = useState(0);
  const [showEcoCta, setShowEcoCta] = useState(false);
  const isEco = mode === "ec";
  const [showWizard, setShowWizard] = useState(!isEco);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check for shareable URL params on mount
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

  // Eco operator: show engagement CTA after 20s
  useEffect(() => {
    if (isEco) {
      const timer = setTimeout(() => setShowEcoCta(true), 20000);
      return () => clearTimeout(timer);
    }
  }, [isEco]);

  // Show eco CTA after 2 messages
  useEffect(() => {
    if (isEco && ecoMsgCount >= 2 && !showEcoCta) setShowEcoCta(true);
  }, [ecoMsgCount]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function handleWizardComplete(prompt: string, snapshot: WizardSnapshot) {
    setShowWizard(false);
    setWizardSnapshot(snapshot);
    const descMatch = prompt.match(/I'm building (.+?)\. I'm at/);
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
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode, history: newMessages.slice(-8).map(m => ({ role: m.role, content: m.content })) }),
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
      {showBrowse && <BrowsePanel onClose={() => setShowBrowse(false)} />}
      {showGapMap && <GapMatrix onClose={() => setShowGapMap(false)} mode={mode === "ec" ? "ec" : "founder"} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isEco={isEco} pageContext={showPathway ? "pathway results" : showWizard ? "wizard" : isEco ? "ecosystem chat" : "chat"} />}

      <div style={{ position: "fixed", inset: 0, background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-text)" }}>

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div style={{
          height: 52, padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(250,250,248,0.92)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid var(--border)", flexShrink: 0, zIndex: 10,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 26, height: 26,
              background: "linear-gradient(135deg, var(--green-mid), var(--green-light))",
              borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(30,107,10,0.15)",
            }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C5 1.5 3 3 3 5.5c0 2 1.5 3.5 4 6 2.5-2.5 4-4 4-6 0-2.5-2-4-4-4z" fill="rgba(255,255,255,0.9)"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)", letterSpacing: "-0.02em" }}>
              {isEco ? "Ecosystem View" : "Navigator"}
            </span>
            <span style={{
              fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4,
              background: isEco ? "#dbeafe" : "var(--green-soft)",
              color: isEco ? "#1e40af" : "var(--green-mid)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>{isEco ? "Partner" : "Founder"}</span>
          </Link>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Browse — founders get descriptive label, partners get both buttons */}
            <button onClick={() => setShowBrowse(true)} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "6px 12px",
              fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)",
              transition: "all 0.12s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
            >{isEco ? "Browse All" : "Explore All Programs"}</button>

            {/* Gap Map — only for eco operators */}
            {isEco && (
              <button onClick={() => setShowGapMap(true)} style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "6px 12px",
                fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)",
                transition: "all 0.12s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
              >Gap Map</button>
            )}

            {/* Feedback — amber, prominent */}
            <button onClick={() => setShowFeedback(true)} style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "none", borderRadius: "var(--radius-sm)", padding: "6px 14px",
              fontSize: "0.72rem", fontWeight: 700, color: "#fff",
              boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
              transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 4,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <span style={{ fontSize: "0.8rem" }}>💬</span> Feedback
            </button>
          </div>
        </div>

        {/* ── Messages area ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 16, paddingBottom: 12 }}>

          {/* Eco operator welcome — clean, scannable, with visual hierarchy */}
          {isEco && messages.length === 0 && !loading && (
            <div style={{ padding: "24px 20px", animation: "fadeInUp 0.4s ease" }}>
              <div style={{
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)",
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  background: "linear-gradient(145deg, #0c1829, #1a2940)",
                  padding: "22px 24px 18px",
                }}>
                  <div style={{
                    fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(96,165,250,0.5)", marginBottom: 8,
                  }}>Ecosystem Intelligence</div>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 400,
                    color: "#fff", lineHeight: 1.2, marginBottom: 6,
                  }}>What do you want to know?</h2>
                  <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    Ask anything about Canada's agtech support landscape — or try a quick start below.
                  </p>
                </div>
                {/* Quick-start grid */}
                <div style={{ padding: "14px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ECO_SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => send(s.q)} style={{
                      flex: "1 1 calc(50% - 4px)", minWidth: 160,
                      padding: "10px 14px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)", background: "var(--bg)",
                      fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
                      textAlign: "left", transition: "all 0.12s",
                      boxShadow: "var(--shadow-sm)",
                    }}
                      onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "#60a5fa"; t.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.borderColor = "var(--border)"; t.style.transform = "translateY(0)"; }}
                    >{s.label}</button>
                  ))}
                </div>
                {/* Tools pointer */}
                <div style={{
                  padding: "10px 20px 14px", borderTop: "1px solid var(--border)",
                  fontSize: "0.72rem", color: "var(--text-tertiary)",
                  display: "flex", gap: 12,
                }}>
                  <span onClick={() => setShowGapMap(true)} style={{ cursor: "pointer", color: "var(--green-mid)", fontWeight: 600 }}>📊 Gap Map</span>
                  <span onClick={() => setShowBrowse(true)} style={{ cursor: "pointer", color: "var(--green-mid)", fontWeight: 600 }}>📋 Browse {283} Programs</span>
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

          {/* Chat messages — only show after eco welcome or wizard done */}
          {((!showWizard && !isEco) || (isEco && messages.length > 0)) && messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
          {loading && (
            <div style={{ padding: "0 16px 4px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "16px 16px 16px 4px",
                padding: "10px 16px", boxShadow: "var(--shadow-sm)",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--text-tertiary)",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Chat input ───────────────────────────────────────────── */}
        {(!showWizard || isEco) && (
        <div style={{
          background: "var(--bg)", borderTop: "1px solid var(--border-strong)",
          padding: "12px 16px", flexShrink: 0,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
        }}>
          {/* Eco suggestion chips above input when no messages yet */}
          {isEco && messages.length > 0 && messages.length < 4 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {ECO_SUGGESTIONS.filter(s => !messages.some(m => m.content.includes(s.label))).slice(0, 3).map((s, i) => (
                <button key={i} onClick={() => send(s.q)} style={{
                  padding: "5px 12px", borderRadius: 100,
                  border: "1px solid var(--border)", background: "var(--bg-secondary)",
                  fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)",
                  transition: "all 0.1s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-mid)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >{s.label}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={isEco ? "Ask about the ecosystem…" : "Ask about your pathway, programs, or next steps…"}
              rows={2}
              style={{
                flex: 1, resize: "none",
                border: "1.5px solid var(--border)", borderRadius: "var(--radius)",
                padding: "10px 14px", fontSize: "0.85rem", lineHeight: 1.5, outline: "none",
                background: "var(--bg-secondary)",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-text)",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--green-mid)"; e.target.style.boxShadow = "0 0 0 3px rgba(30,107,10,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "var(--bg-tertiary)" : "linear-gradient(135deg, var(--green-mid), var(--green-light))",
                color: loading || !input.trim() ? "var(--text-tertiary)" : "#fff",
                border: "none", borderRadius: "var(--radius)",
                padding: "0 20px", fontWeight: 700, fontSize: "0.9rem",
                transition: "all 0.15s", minWidth: 48,
                boxShadow: loading || !input.trim() ? "none" : "0 2px 8px rgba(30,107,10,0.2)",
              }}
            >→</button>
          </div>
        </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* ── Quick feedback slide-up (founder) ──────────────────────── */}
      {showQuickFeedback && !quickFeedbackSent && !isEco && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--bg)", borderTop: "2px solid #f59e0b",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          padding: "14px 20px", zIndex: 50,
          animation: "slideUp 0.4s ease",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", marginBottom: 2 }}>
              Was this useful?
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              Quick reaction — we're still in beta
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { emoji: "🔥", label: "Nailed it", value: "great" },
              { emoji: "👍", label: "Decent", value: "ok" },
              { emoji: "🤷", label: "Off-base", value: "miss" },
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
                style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", padding: "8px 14px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  transition: "transform 0.1s, border-color 0.1s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d97706"; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: "1.2rem" }}>{opt.emoji}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-secondary)" }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowQuickFeedback(false)} style={{
            background: "none", border: "none", fontSize: "0.75rem",
            color: "var(--text-tertiary)", padding: "4px",
          }}>✕</button>
        </div>
      )}

      {/* ── Eco operator engagement CTA ─────────────────────────────── */}
      {isEco && showEcoCta && !showFeedback && (
        <div style={{
          position: "fixed", bottom: 80, right: 16, zIndex: 40,
          animation: "slideUp 0.5s ease, pulse-border 2s ease infinite",
        }}>
          <button onClick={() => { setShowFeedback(true); setShowEcoCta(false); }} style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            border: "none", borderRadius: "var(--radius)",
            padding: "12px 18px", color: "#fff",
            boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
            display: "flex", alignItems: "center", gap: 8,
            transition: "transform 0.12s",
            animation: "glow 2s ease-in-out infinite alternate",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem" }}>Share your feedback</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.75 }}>Help us get this right</div>
            </div>
          </button>
          <style>{`
            @keyframes glow {
              from { box-shadow: 0 4px 20px rgba(245,158,11,0.3); }
              to { box-shadow: 0 4px 30px rgba(245,158,11,0.6); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
