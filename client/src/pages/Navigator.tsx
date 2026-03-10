import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

// ── types ──────────────────────────────────────────────────────────────────
interface Program {
  id: number;
  name: string;
  category: string;
  description: string | null;
  use_case: string[] | null;
  province: string[] | null;
  website: string | null;
  stage: string[] | null;
  status: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── constants ──────────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  Fund:  { label: "Funding",       color: "#1a4b8c", bg: "#e8f0fe" },
  Accel: { label: "Accelerator",   color: "#8c5a1a", bg: "#fff3e0" },
  Pilot: { label: "Pilot Site",    color: "#1a6b2a", bg: "#e8f5e9" },
  Event: { label: "Event",         color: "#8c1a3a", bg: "#fce4ec" },
  Org:   { label: "Industry Org",  color: "#6a1a8c", bg: "#f3e5f5" },
  Train: { label: "Training",      color: "#1a6b7a", bg: "#e0f7fa" },
};

const CATEGORIES = Object.keys(CAT_META);
const STAGES = ["Idea", "MVP", "Pilot", "Comm", "Scale"];

// ── sub-components ──────────────────────────────────────────────────────────
function CategoryPill({ cat }: { cat: string }) {
  const m = CAT_META[cat] || { label: cat, color: "#555", bg: "#eee" };
  return (
    <span style={{
      fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px",
      borderRadius: 12, background: m.bg, color: m.color,
      whiteSpace: "nowrap" as const,
    }}>{m.label}</span>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12, padding: "0 12px",
    }}>
      <div style={{
        maxWidth: "85%",
        background: isUser ? "var(--green-mid)" : "#fff",
        color: isUser ? "#fff" : "var(--text)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px",
        fontSize: "0.8rem",
        lineHeight: 1.6,
        border: isUser ? "none" : "1px solid #e5e0d5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        whiteSpace: "pre-wrap" as const,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ── Browse panel ────────────────────────────────────────────────────────────
function BrowsePanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((d: Program[]) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchText = !q || [p.name, p.description || "", (p.province || []).join(" "), (p.use_case || []).join(" ")]
      .some(f => f.toLowerCase().includes(q));
    const matchCat = catFilter === "All" || p.category === catFilter;
    const matchStage = stageFilter === "All" || (p.stage || []).includes(stageFilter);
    return matchText && matchCat && matchStage;
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--cream)", display: "flex", flexDirection: "column",
    }}>
      {/* header */}
      <div style={{
        background: "var(--green-dark)", padding: "10px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "3px solid var(--gold)", flexShrink: 0,
      }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
          {loading ? "Loading…" : `${filtered.length} / ${data.length} programs`}
        </span>
        <button onClick={onClose} style={{
          background: "var(--gold)", border: "none", borderRadius: 6,
          padding: "5px 14px", fontWeight: 700, fontSize: "0.8rem",
          color: "var(--green-dark)",
        }}>✕ Close</button>
      </div>

      {/* filters */}
      <div style={{
        padding: "8px 12px", display: "flex", gap: 8, flexWrap: "wrap",
        background: "#fff", borderBottom: "1px solid #e5e0d5", flexShrink: 0,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, description, province…"
          style={{
            flex: "1 1 180px", padding: "6px 10px", borderRadius: 6,
            border: "1px solid #ccc", fontSize: "0.78rem",
          }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc",
          fontSize: "0.78rem", background: "#fff",
        }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
          padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc",
          fontSize: "0.78rem", background: "#fff",
        }}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#999" }}>Loading programs…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ background: "var(--green-mid)", color: "#fff", position: "sticky", top: 0 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, width: 110 }}>Type</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, width: 80 }}>Province</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7", borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 600, verticalAlign: "top" }}>
                    {p.website
                      ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-dark)", textDecoration: "underline" }}>{p.name}</a>
                      : p.name}
                    {p.status === "unverified" && <span style={{ fontSize: "0.5rem", color: "#bbb", marginLeft: 4 }}>●</span>}
                  </td>
                  <td style={{ padding: "7px 10px", verticalAlign: "top" }}>
                    <CategoryPill cat={p.category} />
                  </td>
                  <td style={{ padding: "7px 10px", color: "#666", verticalAlign: "top" }}>
                    {(p.province || []).filter(x => x !== "National").join(", ") || (p.province?.includes("National") ? "National" : "—")}
                  </td>
                  <td style={{ padding: "7px 10px", color: "#444", lineHeight: 1.4, verticalAlign: "top" }}>
                    {p.description?.slice(0, 160) || "—"}
                    {p.stage && p.stage.length > 0 && (
                      <div style={{ marginTop: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {p.stage.map(st => (
                          <span key={st} style={{ fontSize: "0.6rem", background: "var(--cream-dark)", padding: "1px 5px", borderRadius: 4, color: "#555" }}>{st}</span>
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

// ── Submit form ─────────────────────────────────────────────────────────────
function SubmitForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ programName: "", bestFor: "", submitterName: "", submitterEmail: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.programName || !form.bestFor || !form.submitterName || !form.submitterEmail) {
      alert("Please fill in all fields."); return;
    }
    setBusy(true);
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDone(true);
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    border: "1px solid #ccc", fontSize: "0.8rem", marginTop: 4,
  };

  if (done) return (
    <div style={{ padding: "24px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>✓</div>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>Submitted — thanks!</p>
      <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: 16 }}>We'll review and add it to the database.</p>
      <button onClick={onClose} style={{ background: "var(--green-mid)", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 700 }}>Done</button>
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: 14 }}>Know a program we're missing? Submit it below.</p>
      {[
        { key: "programName", label: "Program name *", placeholder: "e.g. Lakeland College Smart Farm" },
        { key: "bestFor", label: "Best for *", placeholder: "e.g. MVP-stage livestock tech companies in AB" },
        { key: "submitterName", label: "Your name *", placeholder: "" },
        { key: "submitterEmail", label: "Your email *", placeholder: "" },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#444" }}>{label}</label>
          <input
            value={(form as any)[key]}
            onChange={e => update(key, e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={submit} disabled={busy} style={{
          flex: 1, background: "var(--green-mid)", color: "#fff", border: "none",
          borderRadius: 6, padding: "9px", fontWeight: 700, fontSize: "0.8rem",
        }}>
          {busy ? "Submitting…" : "Submit Program"}
        </button>
        <button onClick={onClose} style={{
          background: "#eee", border: "none", borderRadius: 6,
          padding: "9px 16px", fontWeight: 600, fontSize: "0.8rem",
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main Navigator ──────────────────────────────────────────────────────────
export default function Navigator() {
  const [mode] = useState<"e" | "ec">(() => {
    try { return (localStorage.getItem("ag_nav_mode") as "e" | "ec") || "e"; } catch { return "e"; }
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    const greeting = mode === "e"
      ? "Hi! I'm your Canadian Ag Innovation Navigator.\n\nTell me about your agtech company — what you're building, what stage you're at, and which province(s) you're targeting. I'll recommend the best programs for your situation."
      : "Welcome, ecosystem operator.\n\nI can help you analyze the Canadian agtech support landscape — coverage gaps, stage distribution, provincial blind spots, or strategic opportunities. What would you like to explore?";
    setMessages([{ role: "assistant", content: greeting }]);
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const isEco = mode === "ec";

  return (
    <>
      {showBrowse && <BrowsePanel onClose={() => setShowBrowse(false)} />}

      <div style={{
        position: "fixed", inset: 0,
        background: "var(--cream)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font)",
      }}>
        {/* top bar */}
        <div style={{
          background: "var(--green-dark)",
          borderBottom: "3px solid var(--gold)",
          padding: "9px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo-wordmark.png" alt="Navigator" style={{ height: 28, filter: "brightness(0) invert(1)" }} />
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowBrowse(true)}
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6, padding: "5px 12px", color: "#fff",
                fontSize: "0.75rem", fontWeight: 600,
              }}
            >Browse All</button>
            <button
              onClick={() => setShowSubmit(s => !s)}
              style={{
                background: showSubmit ? "var(--gold)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(197,165,90,0.4)",
                borderRadius: 6, padding: "5px 12px",
                color: showSubmit ? "var(--green-dark)" : "var(--gold)",
                fontSize: "0.75rem", fontWeight: 600,
              }}
            >+ Submit</button>
          </div>
        </div>

        {/* mode banner */}
        <div style={{
          background: isEco ? "#1a1a2e" : "var(--green-mid)",
          padding: "5px 14px",
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
          color: isEco ? "#a0b4ff" : "rgba(255,255,255,0.7)",
          textTransform: "uppercase" as const,
          flexShrink: 0,
        }}>
          {isEco ? "Ecosystem Operator Mode" : "Founder Mode"} — AI-powered · 225 programs
        </div>

        {/* submit form inline */}
        {showSubmit && (
          <div style={{
            background: "#fff", borderBottom: "1px solid #e5e0d5",
            flexShrink: 0, maxHeight: 400, overflowY: "auto",
          }}>
            <SubmitForm onClose={() => setShowSubmit(false)} />
          </div>
        )}

        {/* chat messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 16, paddingBottom: 8 }}>
          {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
          {loading && (
            <div style={{ padding: "4px 24px" }}>
              <div style={{
                display: "inline-block",
                background: "#fff", border: "1px solid #e5e0d5",
                borderRadius: "16px 16px 16px 4px",
                padding: "10px 16px", fontSize: "0.8rem", color: "#999",
              }}>Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input bar */}
        <div style={{
          background: "#fff", borderTop: "1px solid #e5e0d5",
          padding: "10px 12px", display: "flex", gap: 8, flexShrink: 0,
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isEco
              ? "e.g. What's the biggest gap in Prairie agtech support?"
              : "e.g. I'm building precision livestock monitoring software, pre-revenue, based in Manitoba…"}
            rows={2}
            style={{
              flex: 1, resize: "none", border: "1px solid #ddd", borderRadius: 8,
              padding: "8px 12px", fontSize: "0.8rem", lineHeight: 1.4,
              outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "#ccc" : "var(--green-mid)",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "0 18px", fontWeight: 700, fontSize: "0.85rem",
              transition: "background 0.15s",
            }}
          >→</button>
        </div>
      </div>
    </>
  );
}
