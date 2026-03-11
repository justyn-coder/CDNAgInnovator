import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Wizard from "../components/Wizard";

interface Program {
  id: number; name: string; category: string;
  description: string | null; use_case: string[] | null;
  province: string[] | null; website: string | null;
  stage: string[] | null; status: string | null;
}

interface Message { role: "user" | "assistant"; content: string; }

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
      {/* Header */}
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

      {/* Filters */}
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
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
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
                  <td style={{ padding: "8px 12px", color: "var(--text-secondary)", lineHeight: 1.45, verticalAlign: "top" }}>
                    {p.description?.slice(0, 140) || "—"}
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
  const [showSubmit, setShowSubmit] = useState(false);
  const isEco = mode === "ec";
  const [showWizard, setShowWizard] = useState(!isEco);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const greeting = mode === "e"
      ? "Hi! I'm your Canadian Ag Innovation Navigator.\n\nTell me about your agtech company — what you're building, what stage you're at, and which province(s) you're targeting. I'll recommend the best programs for your situation."
      : "Welcome, ecosystem operator.\n\nI can help you analyze the Canadian agtech support landscape — coverage gaps, stage distribution, provincial blind spots, or strategic opportunities. What would you like to explore?";
    setMessages([{ role: "assistant", content: greeting }]);
  }, [mode]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleWizardComplete(prompt: string) {
    setShowWizard(false);
    setInput(prompt);
    setTimeout(() => {
      setInput("");
      const newMessages: Message[] = [...messages, { role: "user", content: prompt }];
      setMessages(newMessages);
      setLoading(true);
      fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, mode, history: [] }),
      })
        .then(r => r.json())
        .then(data => { setMessages(m => [...m, { role: "assistant", content: data.reply || "Something went wrong." }]); })
        .catch(() => { setMessages(m => [...m, { role: "assistant", content: "Network error — please try again." }]); })
        .finally(() => setLoading(false));
    }, 0);
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
      <div style={{ position: "fixed", inset: 0, background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-text)" }}>

        {/* Top bar */}
        <div style={{
          height: 52, padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)", flexShrink: 0, zIndex: 10,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 8L6 4M6 12l4-4" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div style={{
              width: 24, height: 24, background: "var(--green-mid)", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C5 1.5 3 3 3 5.5c0 2 1.5 3.5 4 6 2.5-2.5 4-4 4-6 0-2.5-2-4-4-4z" fill="rgba(255,255,255,0.9)"/>
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text)", letterSpacing: "-0.01em" }}>Navigator</span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowBrowse(true)} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "5px 12px",
              fontSize: "0.75rem", fontWeight: 500, color: "var(--text)",
            }}>Browse All</button>
            <button onClick={() => setShowSubmit(s => !s)} style={{
              background: showSubmit ? "var(--green-mid)" : "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "5px 12px",
              fontSize: "0.75rem", fontWeight: 500,
              color: showSubmit ? "#fff" : "var(--text)",
            }}>+ Submit</button>
          </div>
        </div>

        {/* Mode indicator */}
        <div style={{
          padding: "5px 16px", flexShrink: 0,
          background: isEco ? "#0f1923" : "var(--green-mid)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: isEco ? "#4a9eff" : "rgba(255,255,255,0.5)" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: isEco ? "rgba(74,158,255,0.8)" : "rgba(255,255,255,0.65)" }}>
            {isEco ? "Ecosystem Operator Mode" : "Founder Mode"} · AI-Powered · 225 Programs
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
          {/* Wizard — founder mode only, before any messages sent */}
          {!isEco && showWizard && messages.length === 0 && (
            <Wizard onComplete={handleWizardComplete} />
          )}
          {(!showWizard || messages.length > 0 || isEco) && messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
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

        {/* Input — hidden while wizard is active */}
        {(!showWizard || messages.length > 0 || isEco) && (
        <div style={{
          background: "var(--bg)", borderTop: "1px solid var(--border)",
          padding: "10px 12px", display: "flex", gap: 8, flexShrink: 0,
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={isEco ? "e.g. What's the biggest gap in Prairie agtech support?" : "e.g. I'm building precision livestock monitoring, pre-revenue, in Manitoba…"}
            rows={2}
            style={{
              flex: 1, resize: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: "9px 12px", fontSize: "0.82rem", lineHeight: 1.45, outline: "none",
              background: "var(--bg-secondary)",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--green-mid)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "var(--bg-tertiary)" : "var(--green-mid)",
              color: loading || !input.trim() ? "var(--text-tertiary)" : "#fff",
              border: "none", borderRadius: "var(--radius)",
              padding: "0 18px", fontWeight: 600, fontSize: "0.9rem",
              transition: "background 0.15s",
              minWidth: 44,
            }}
          >→</button>
        </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </>
  );
}
