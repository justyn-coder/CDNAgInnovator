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

// Simple markdown renderer
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
      margin: "0 16px 14px",
      padding: "8px 12px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      fontSize: "0.72rem",
    }}>
      {snapshot.stage && (
        <span style={{
          background: "var(--green-mid)", color: "#fff",
          padding: "2px 8px", borderRadius: 100, fontWeight: 700,
          fontSize: "0.65rem", letterSpacing: "0.02em",
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
      <button
        onClick={onReset}
        style={{
          background: "none", border: "none", padding: 0,
          fontSize: "0.65rem", color: "var(--text-tertiary)",
          cursor: "pointer", textDecoration: "underline",
          textDecorationColor: "var(--border)",
        }}
      >Start over</button>
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
        padding: "0 16px", height: 52, display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)", background: "var(--bg)", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>
          {loading ? "Loading…" : `${filtered.length} of ${data.length} programs`}
        </span>
        <button onClick={onClose} style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "5px 14px",
          fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
        }}>Done</button>
      </div>
      <div style={{
        padding: "10px 16px", display: "flex", gap: 8, flexWrap: "wrap",
        background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          style={{
            flex: "1 1 160px", padding: "7px 12px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", fontSize: "0.8rem", background: "var(--bg)",
            outline: "none",
          }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          padding: "7px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
          fontSize: "0.78rem", background: "var(--bg)", color: "var(--text)",
        }}>
          <option value="All">All Types</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
          padding: "7px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
          fontSize: "0.78rem", background: "var(--bg)", color: "var(--text)",
        }}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>Loading programs…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)", position: "sticky", top: 0 }}>
                {["Name", "Type", "Province", "Description"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, fontSize: "0.72rem", color: "var(--text-secondary)", letterSpacing: "0.03em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg)" : "var(--bg-secondary)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, verticalAlign: "top", color: "var(--text)" }}>
                    {p.website
                      ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-mid)", textDecoration: "underline", textDecorationColor: "rgba(45,80,22,0.3)" }}>{p.name}</a>
                      : p.name}
                  </td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}><CategoryPill cat={p.category} /></td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    {(p.province || []).filter(x => x !== "National").join(", ") || (p.province?.includes("National") ? "Nat'l" : "—")}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)", lineHeight: 1.45, verticalAlign: "top", maxWidth: 400 }}>
                    {p.description || "—"}
                    {p.stage && p.stage.length > 0 && (
                      <div style={{ marginTop: 4, display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {p.stage.map(st => (
                          <span key={st} style={{ fontSize: "0.6rem", background: "var(--bg-tertiary)", padding: "1px 6px", borderRadius: 4, color: "var(--text-secondary)" }}>{st}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SubmitForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ programName: "", bestFor: "", submitterName: "", submitterEmail: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.programName || !form.bestFor || !form.submitterName || !form.submitterEmail) { alert("Please fill in all fields."); return; }
    setBusy(true);
    try {
      await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setDone(true);
    } catch { alert("Something went wrong."); }
    setBusy(false);
  }

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)", fontSize: "0.8rem", marginTop: 4,
    outline: "none", background: "var(--bg)",
  };

  if (done) return (
    <div style={{ padding: "20px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>✓</div>
      <p style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 4 }}>Submitted — thanks!</p>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 16 }}>We'll review and add it to the database.</p>
      <button onClick={onClose} style={{ background: "var(--green-mid)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 20px", fontWeight: 600, fontSize: "0.8rem" }}>Done</button>
    </div>
  );

  return (
    <div style={{ padding: "14px 16px" }}>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>Know a program we're missing?</p>
      {[
        { key: "programName", label: "Program name *", placeholder: "e.g. Lakeland College Smart Farm" },
        { key: "bestFor", label: "Best for *", placeholder: "e.g. MVP-stage livestock tech in AB" },
        { key: "submitterName", label: "Your name *", placeholder: "" },
        { key: "submitterEmail", label: "Your email *", placeholder: "" },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</label>
          <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={submit} disabled={busy} style={{ flex: 1, background: "var(--green-mid)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px", fontWeight: 600, fontSize: "0.8rem" }}>
          {busy ? "Submitting…" : "Submit Program"}
        </button>
        <button onClick={onClose} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontWeight: 600, fontSize: "0.8rem", color: "var(--text)" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function Navigator() {
  const [mode] = useState<"e" | "ec">(() => { try { return (localStorage.getItem("ag_nav_mode") as "e" | "ec") || "e"; } catch { return "e"; } });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showGapMap, setShowGapMap] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [wizardSnapshot, setWizardSnapshot] = useState<WizardSnapshot | null>(null);
  const [wizardDescription, setWizardDescription] = useState("");
  const [showPathway, setShowPathway] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showBetaWelcome, setShowBetaWelcome] = useState(() => {
    try {
      // Skip welcome if returning via URL params or if already dismissed
      const params = new URLSearchParams(window.location.search);
      if (params.get("stage")) return false;
      return !sessionStorage.getItem("ag_beta_seen");
    } catch { return true; }
  });
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
        const snapshot = {
          stage: urlStage,
          provinces: urlProv.split(","),
          need: urlNeed || "all",
        };
        setWizardSnapshot(snapshot);
        setWizardDescription(params.get("desc") || "an agtech company");
        setShowWizard(false);
        setShowPathway(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isEco) {
      setMessages([{ role: "assistant", content: "Welcome — you're in **Ecosystem Operator** mode.\n\nI can help you analyze Canada's agtech support landscape. Here's what I'm most useful for:\n\n### Quick starts:\n- **\"Show me coverage gaps in Alberta\"** — where are founders underserved?\n- **\"What programs exist for MVP-stage companies in Ontario?\"** — filter by stage + province\n- **\"Compare Prairie provinces for pilot site availability\"** — cross-province analysis\n- **\"What's missing for biologicals companies nationally?\"** — product-type gap analysis\n\nYou can also click **Gap Map** above for a visual Province × Category heatmap, or **Browse All** to review the full program database.\n\nWhat would you like to explore?" }]);
    }
  }, [mode]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function handleWizardComplete(prompt: string, snapshot: WizardSnapshot) {
    setShowWizard(false);
    setWizardSnapshot(snapshot);
    // Extract description from the prompt (everything before "I'm at the")
    const descMatch = prompt.match(/I'm building (.+?)\. I'm at/);
    setWizardDescription(descMatch ? descMatch[1] : "an agtech company");
    setShowPathway(true);
    // Show feedback prompt after 8 seconds
    if (!feedbackSent) {
      setTimeout(() => setShowFeedback(true), 8000);
    }
  }

  function handlePathwayFollowUp(question: string) {
    // Transition from pathway view to chat with the follow-up question
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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
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
      <div style={{ position: "fixed", inset: 0, background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-text)" }}>

        {/* Top bar */}
        <div style={{
          height: 56, padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(250,250,248,0.88)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid var(--border)", flexShrink: 0, zIndex: 10,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 8L6 4M6 12l4-4" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div style={{
              width: 26, height: 26,
              background: "linear-gradient(135deg, var(--green-mid), var(--green-light))",
              borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(30,107,10,0.15)",
            }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C5 1.5 3 3 3 5.5c0 2 1.5 3.5 4 6 2.5-2.5 4-4 4-6 0-2.5-2-4-4-4z" fill="rgba(255,255,255,0.9)"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", letterSpacing: "-0.02em" }}>Navigator</span>
          </Link>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Browse All", onClick: () => setShowBrowse(true), active: false },
              { label: "Gap Map", onClick: () => setShowGapMap(true), active: false },
              { label: "+ Submit", onClick: () => setShowSubmit(s => !s), active: showSubmit },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick} style={{
                background: btn.active ? "var(--green-mid)" : "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "6px 14px",
                fontSize: "0.75rem", fontWeight: 600,
                color: btn.active ? "#fff" : "var(--text-secondary)",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)"; } }}
              onMouseLeave={e => { if (!btn.active) { (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; } }}
              >{btn.label}</button>
            ))}
          </div>
        </div>

        {/* Mode indicator */}
        <div style={{
          padding: "6px 18px", flexShrink: 0,
          background: isEco ? "linear-gradient(90deg, #0c1829, #132038)" : "linear-gradient(90deg, var(--green), var(--green-mid))",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isEco ? "#60a5fa" : "#4ade80",
            boxShadow: isEco ? "0 0 6px rgba(96,165,250,0.4)" : "0 0 6px rgba(74,222,128,0.4)",
          }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: isEco ? "rgba(96,165,250,0.7)" : "rgba(255,255,255,0.6)" }}>
            {isEco ? "Ecosystem Operator" : "Founder Mode"} · AI-Powered
          </span>
        </div>

        {/* Submit inline */}
        {showSubmit && (
          <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <SubmitForm onClose={() => setShowSubmit(false)} />
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 20, paddingBottom: 12 }}>

          {/* Beta welcome screen */}
          {!isEco && showBetaWelcome && (
            <div style={{
              margin: "16px", padding: "24px 22px",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)",
              animation: "fadeInUp 0.5s ease",
            }}>
              <div style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#fff", background: "var(--green-mid)", display: "inline-block",
                padding: "3px 10px", borderRadius: 100, marginBottom: 14,
              }}>Beta Preview</div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                Welcome — you're one of the first to try this.
              </h2>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                <p style={{ marginBottom: 10 }}>
                  This tool matches Canadian agtech companies to the accelerators, funding, pilot sites, and programs that actually fit their stage and province. It was born from real conversations with Bioenterprise, AgSphere, and dozens of founders who told us the same thing: <strong style={{ color: "var(--text)" }}>"I don't know what I don't know."</strong>
                </p>
                <p style={{ marginBottom: 10 }}>
                  We track <strong style={{ color: "var(--text)" }}>283 programs</strong> across every province, updated regularly. The AI generates a personalized pathway — not a list, but a sequenced plan with specific next steps.
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong style={{ color: "var(--text)" }}>Your honest feedback is what makes this better.</strong> If something's wrong, missing, or off-base — tell us. There's a quick feedback button after your results.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    try { sessionStorage.setItem("ag_beta_seen", "1"); } catch {}
                    setShowBetaWelcome(false);
                  }}
                  style={{
                    background: "var(--green-mid)", color: "#fff", border: "none",
                    borderRadius: "var(--radius-sm)", padding: "11px 24px",
                    fontWeight: 700, fontSize: "0.85rem",
                    boxShadow: "0 2px 8px rgba(30,107,10,0.2)",
                  }}
                >Let's go →</button>
                <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", alignSelf: "center" }}>
                  Takes about 30 seconds
                </div>
              </div>
            </div>
          )}

          {!isEco && !showBetaWelcome && showWizard && (
            <Wizard onComplete={handleWizardComplete} />
          )}

          {!isEco && !showWizard && wizardSnapshot && (
            <WizardSummary snapshot={wizardSnapshot} onReset={handleReset} />
          )}

          {/* Pathway Card — shown after wizard, before chat */}
          {!isEco && showPathway && wizardSnapshot && (
            <PathwayCard
              description={wizardDescription}
              stage={wizardSnapshot.stage}
              provinces={wizardSnapshot.provinces}
              need={wizardSnapshot.need}
              onChatFollowUp={handlePathwayFollowUp}
            />
          )}

          {(!showWizard || isEco) && messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
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

        {(!showWizard || isEco) && !showBetaWelcome && (
        <div style={{
          background: "var(--bg)", borderTop: "1px solid var(--border-strong)",
          padding: "14px 16px", flexShrink: 0,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
        }}>
          {/* Label */}
          <div style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--text-tertiary)", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {isEco ? "Ask about the ecosystem" : "Continue the conversation"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={isEco ? "e.g. What's the biggest gap in Prairie agtech support?" : "Ask anything about your pathway, programs, or next steps…"}
              rows={2}
              style={{
                flex: 1, resize: "none",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "10px 14px", fontSize: "0.85rem", lineHeight: 1.5, outline: "none",
                background: "var(--bg-secondary)",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-text)",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--green-mid)"; e.target.style.boxShadow = "0 0 0 3px rgba(30,107,10,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "var(--bg-tertiary)" : "linear-gradient(135deg, var(--green-mid), var(--green-light))",
                color: loading || !input.trim() ? "var(--text-tertiary)" : "#fff",
                border: "none", borderRadius: "var(--radius)",
                padding: "0 20px", fontWeight: 700, fontSize: "0.9rem",
                transition: "all 0.15s",
                minWidth: 48,
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

      {/* Feedback slide-up */}
      {showFeedback && !feedbackSent && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--bg)", borderTop: "1px solid var(--border)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          padding: "16px 20px", zIndex: 50,
          animation: "slideUp 0.4s ease",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", marginBottom: 2 }}>
              Was this useful? 🤔
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Quick reaction — help us improve
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { emoji: "🔥", label: "Nailed it", value: "great" },
              { emoji: "👍", label: "Decent", value: "ok" },
              { emoji: "🤷", label: "Off-base", value: "miss" },
            ].map(opt => (
              <button key={opt.value} onClick={() => {
                // Submit feedback
                fetch("/api/submissions", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    programName: `FEEDBACK: ${opt.value}`,
                    bestFor: `Stage: ${wizardSnapshot?.stage}, Prov: ${wizardSnapshot?.provinces.join(",")}, Need: ${wizardSnapshot?.need}`,
                    submitterName: "anonymous",
                    submitterEmail: `feedback-${Date.now()}@anon`,
                  }),
                }).catch(() => {});
                setFeedbackSent(true);
                setShowFeedback(false);
              }}
                style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", padding: "8px 14px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  transition: "transform 0.1s, border-color 0.1s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-mid)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: "1.2rem" }}>{opt.emoji}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-secondary)" }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowFeedback(false)} style={{
            background: "none", border: "none", fontSize: "0.75rem",
            color: "var(--text-tertiary)", padding: "4px",
          }}>✕</button>
        </div>
      )}
    </>
  );
}
