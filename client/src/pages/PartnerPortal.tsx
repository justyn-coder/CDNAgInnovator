import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";

const C = {
  green: "#2D5A3D",
  greenDark: "#1B4332",
  greenAccent: "#48B87A",
  chartreuse: "#8CC63F",
  gold: "#C4A052",
  goldDeep: "#D4A828",
  bg: "#FAFAF7",
  bgWarm: "#F5F0E8",
  text: "#1A1A1A",
  muted: "#6B7C6B",
  soft: "#8B8A82",
  cardBg: "#fff",
  border: "#E8E5E0",
  hairline: "#D9D4CB",
  red: "#C04A3D",
};

const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const PORTAL_PASSWORD = "bioenterprise2026";
const AUTH_KEY = "trellis-portal-auth-v1";

type View = "home" | "programs" | "feedback" | "priority" | "sandbox";

interface Identity {
  org: string;
  person: string;
  display_name: string;
  role: string | null;
  email: string | null;
}

interface TeamRow {
  person: string;
  display_name: string;
  views: string;
  feedback_count: string;
  feature_count: string;
  priority_count: string;
  last_seen: string | null;
}

interface YouSummary {
  your_feedback: string;
  your_features: string;
  your_priorities: string;
  last_visit: string | null;
}

function logEvent(org: string, person: string, event_type: string, path: string, metadata: Record<string, unknown> = {}) {
  fetch("/api/portal/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org, person, event_type, path, metadata }),
  }).catch(() => {});
}

function PasswordGate({ onPass }: { onPass: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().toLowerCase() === PORTAL_PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, "1");
      } catch {}
      onPass();
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <form onSubmit={submit} style={{ width: 360, padding: "40px 32px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 8px 24px -16px rgba(27,67,50,0.15)" }}>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: C.greenDark, marginBottom: 8, lineHeight: 1.15 }}>Partner portal</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>
          You should have received the password by email. One-time entry — we'll remember you after this.
        </div>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="password"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 15,
            fontFamily: F.sans,
            border: `1px solid ${error ? C.red : C.border}`,
            borderRadius: 6,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />
        <button type="submit" style={{
          width: "100%",
          padding: "12px",
          background: C.greenDark,
          color: "#fff",
          fontFamily: F.sans,
          fontSize: 15,
          fontWeight: 600,
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}>Enter</button>
        {error && <div style={{ fontSize: 13, color: C.red, marginTop: 12 }}>That's not quite right. Try again, or email Justyn.</div>}
      </form>
    </div>
  );
}

function Header({ identity, view, setView }: { identity: Identity; view: View; setView: (v: View) => void }) {
  const navItems: { key: View; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "programs", label: "Your programs" },
    { key: "feedback", label: "Feedback" },
    { key: "priority", label: "Priority programs" },
    { key: "sandbox", label: "Sandbox" },
  ];
  return (
    <header style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark }}>Trellis</div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, color: C.gold, textTransform: "uppercase" }}>
            · Partner portal
          </div>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              style={{
                padding: "8px 14px",
                background: view === item.key ? C.bgWarm : "transparent",
                color: view === item.key ? C.greenDark : C.muted,
                fontFamily: F.sans,
                fontSize: 14,
                fontWeight: view === item.key ? 600 : 500,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >{item.label}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.muted }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bgWarm, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.greenDark, fontSize: 13 }}>
            {identity.display_name.split(" ").map(s => s[0]).join("").slice(0, 2)}
          </div>
          <div>{identity.display_name.split(" ")[0]}</div>
        </div>
      </div>
    </header>
  );
}

function HomeView({ identity, team, you, setView }: { identity: Identity; team: TeamRow[]; you: YouSummary | null; setView: (v: View) => void }) {
  const firstName = identity.display_name.split(" ")[0];
  const lastVisit = you?.last_visit ? new Date(you.last_visit) : null;
  const sinceText = lastVisit
    ? `Welcome back. Last time you were here: ${lastVisit.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}.`
    : "First time in. Take the tour below — it's a faster way in than me sending five more emails.";

  const cards = [
    { view: "programs" as View, eyebrow: "Audit", title: "Your programs", blurb: "The seven BioEnterprise entries in Trellis. Flag anything wrong — I'll update within 24 hours." },
    { view: "feedback" as View, eyebrow: "Observations", title: "Feedback thread", blurb: "Not formal corrections. Just things you notice, half-baked ideas, questions. I read everything." },
    { view: "priority" as View, eyebrow: "Focus", title: "Priority programs", blurb: "Out of 500+ entries, which do you want kept most accurate? Tag them and I'll watch those closely." },
    { view: "sandbox" as View, eyebrow: "What if", title: "Feature sandbox", blurb: "Describe something you wish Trellis did. Watch Claude design a mockup in the Trellis style. Endorse what should ship." },
  ];

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Welcome</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(40px, 6vw, 64px)", color: C.greenDark, lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
        {firstName}, this is yours.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: "clamp(18px, 2vw, 22px)", color: C.muted, fontStyle: "italic", lineHeight: 1.55, margin: "20px 0 0", maxWidth: 640 }}>
        {sinceText}
      </p>

      <div style={{ height: 1, background: C.hairline, margin: "56px 0 40px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {cards.map((c) => (
          <button
            key={c.view}
            onClick={() => setView(c.view)}
            style={{
              textAlign: "left",
              padding: "24px 22px",
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px -18px rgba(27,67,50,0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>{c.eyebrow}</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark, marginBottom: 8, letterSpacing: "-0.005em" }}>{c.title}</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{c.blurb}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 48, padding: "24px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Team activity</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: C.greenDark, marginBottom: 14 }}>
          What others on your team have been doing
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>
          Counters only — their content stays private to them. You just see they've been in, and on what.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {team.length === 0 ? (
            <div style={{ fontSize: 14, color: C.soft, fontStyle: "italic" }}>No team activity yet.</div>
          ) : team.map((t) => {
            const views = parseInt(t.views || "0", 10);
            const feedback = parseInt(t.feedback_count || "0", 10);
            const features = parseInt(t.feature_count || "0", 10);
            const priorities = parseInt(t.priority_count || "0", 10);
            const total = views + feedback + features + priorities;
            return (
              <div key={t.person} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: C.text }}>
                <div style={{ minWidth: 160, fontWeight: 600, color: C.greenDark }}>{t.display_name}</div>
                <div style={{ flex: 1, display: "flex", gap: 14, flexWrap: "wrap", color: C.muted }}>
                  {total === 0 ? <span style={{ fontStyle: "italic", color: C.soft }}>not in yet</span> : (
                    <>
                      {views > 0 && <span>{views} page view{views === 1 ? "" : "s"}</span>}
                      {feedback > 0 && <span>{feedback} feedback</span>}
                      {features > 0 && <span>{features} sandbox</span>}
                      {priorities > 0 && <span>{priorities} priorities</span>}
                    </>
                  )}
                </div>
                {t.last_seen && <div style={{ fontSize: 12, color: C.soft }}>
                  {new Date(t.last_seen).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/for/bioenterprise" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>
          About this tool →
        </a>
        <a href="/demo" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>
          The walkthrough →
        </a>
        <a href="/navigator" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>
          The live tool →
        </a>
      </div>
    </div>
  );
}

interface ProgramRow {
  id: number;
  name: string;
  category: string;
  province: string[];
  stage: string[] | null;
  status: string;
  description: string;
  website: string;
  notes: string | null;
  confidence: string;
  verified_at: string | null;
  ownership: string;
}

function ProgramsView({ identity }: { identity: Identity }) {
  const [programs, setPrograms] = useState<ProgramRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [field, setField] = useState("");
  const [suggested, setSuggested] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/portal/programs?org=${identity.org}&person=${identity.person}`)
      .then((r) => r.json())
      .then((d) => setPrograms(d.programs || []))
      .catch((e) => setError(String(e)));
  }, [identity.org, identity.person]);

  async function submitCorrection(programId: number) {
    setSubmitting(true);
    const resp = await fetch("/api/portal/correction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org: identity.org,
        person: identity.person,
        program_id: programId,
        field,
        suggested_value: suggested,
        note,
      }),
    });
    setSubmitting(false);
    if (resp.ok) {
      setSubmitted(programId);
      setField("");
      setSuggested("");
      setNote("");
      setTimeout(() => { setOpenId(null); setSubmitted(null); }, 2500);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Audit</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>
        Your programs in Trellis
      </h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 32px", maxWidth: 640 }}>
        These are the entries that mention BioEnterprise directly or show up through partnership. If any detail is wrong — wrong stage, wrong province, out-of-date URL, fictional program — flag it and I'll fix within 24 hours.
      </p>

      {error && <div style={{ padding: 16, background: "#FEE", border: `1px solid ${C.red}`, borderRadius: 6, color: C.red }}>Couldn't load: {error}</div>}
      {!programs && !error && <div style={{ fontSize: 14, color: C.muted }}>Loading…</div>}

      {programs && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {programs.map((p) => (
            <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${p.ownership === "direct" ? C.gold : C.border}`, borderRadius: 8, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: F.serif, fontSize: 20, color: C.greenDark }}>{p.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12, background: p.ownership === "direct" ? "#F5E9C7" : "#EEE", color: p.ownership === "direct" ? C.greenDark : C.muted, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      {p.ownership === "direct" ? "Yours" : "Partnership"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12, background: p.status === "verified" || p.status === "active" ? "#E7F2E7" : p.status === "unverified" ? "#FEF3DC" : "#F0F0F0", color: C.muted, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>{p.category}</span>
                    <span>{(p.province || []).join(", ")}</span>
                    <span>{(p.stage || []).join(", ") || "—"}</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 10 }}>{p.description}</div>
                  <a href={p.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.green, textDecoration: "none", borderBottom: `1px solid ${C.gold}`, paddingBottom: 1 }}>{p.website}</a>
                </div>
                <button
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  style={{ padding: "8px 14px", background: openId === p.id ? C.greenDark : "transparent", color: openId === p.id ? "#fff" : C.greenDark, fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: `1px solid ${C.greenDark}`, borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {openId === p.id ? "Close" : "Suggest correction"}
                </button>
              </div>
              {openId === p.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
                  {submitted === p.id ? (
                    <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>Thanks — I'll look at this within 24 hours.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Which field</label>
                        <select value={field} onChange={(e) => setField(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, background: "#fff" }}>
                          <option value="">Choose a field…</option>
                          <option value="name">Program name</option>
                          <option value="category">Category</option>
                          <option value="province">Province(s)</option>
                          <option value="stage">Stage(s)</option>
                          <option value="status">Status (active / closed / verified)</option>
                          <option value="description">Description</option>
                          <option value="website">Website URL</option>
                          <option value="other">Something else</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>What should it be</label>
                        <input type="text" value={suggested} onChange={(e) => setSuggested(e.target.value)} placeholder='e.g. "Pilot, Comm, Scale"' style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Context (optional)</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything that'd help me understand" style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => submitCorrection(p.id)} disabled={!field || !suggested || submitting} style={{ padding: "10px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: field && suggested ? "pointer" : "not-allowed", opacity: field && suggested ? 1 : 0.5 }}>
                          {submitting ? "Sending…" : "Submit correction"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FeedbackPost {
  id: number;
  topic: string;
  body: string;
  created_at: string;
}

function FeedbackView({ identity }: { identity: Identity }) {
  const [yours, setYours] = useState<FeedbackPost[]>([]);
  const [teamCounts, setTeamCounts] = useState<{ topic: string; cnt: string }[]>([]);
  const [topic, setTopic] = useState("General");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const resp = await fetch(`/api/portal/feedback?org=${identity.org}&person=${identity.person}`);
    const data = await resp.json();
    setYours(data.yours || []);
    setTeamCounts(data.teamCounts || []);
  }

  useEffect(() => { load(); }, [identity.org, identity.person]);

  async function submit() {
    if (body.trim().length < 4) return;
    setSending(true);
    await fetch("/api/portal/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: identity.org, person: identity.person, topic, body }),
    });
    setSending(false);
    setBody("");
    load();
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Observations</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Feedback thread</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 32px", maxWidth: 640 }}>
        Less formal than corrections. Observations, half-baked ideas, questions. Your posts are private to you — I'm the only other person who reads them.
      </p>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 22, marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {["Gap Map", "Your Programs", "Wizard / Pathway", "AI Analysis", "Sandbox", "General"].map((t) => (
            <button key={t} onClick={() => setTopic(t)} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, background: topic === t ? C.greenDark : "transparent", color: topic === t ? "#fff" : C.muted, border: `1px solid ${topic === t ? C.greenDark : C.border}`, borderRadius: 14, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What did you notice?" style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical", marginBottom: 12 }} />
        <button onClick={submit} disabled={body.trim().length < 4 || sending} style={{ padding: "10px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: body.trim().length >= 4 ? "pointer" : "not-allowed", opacity: body.trim().length >= 4 ? 1 : 0.5 }}>
          {sending ? "Sending…" : "Post"}
        </button>
      </div>

      {teamCounts.length > 0 && (
        <div style={{ marginBottom: 32, padding: "18px 22px", background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>What the team is looking at</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 1.55 }}>Others have been commenting on (content stays private):</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {teamCounts.map((t) => (
              <span key={t.topic} style={{ padding: "6px 12px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 13, color: C.text }}>
                <span style={{ fontWeight: 600 }}>{t.topic}</span> <span style={{ color: C.muted }}>· {t.cnt}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>Your posts</div>
        {yours.length === 0 ? (
          <div style={{ fontSize: 14, color: C.soft, fontStyle: "italic" }}>Nothing yet. First thought goes above.</div>
        ) : yours.map((p) => (
          <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.topic}</span>
              <span style={{ fontSize: 12, color: C.soft }}>{new Date(p.created_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityView({ identity }: { identity: Identity }) {
  const [yourVotes, setYourVotes] = useState<any[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  async function load() {
    const r = await fetch(`/api/portal/priority?org=${identity.org}&person=${identity.person}`);
    const d = await r.json();
    setYourVotes(d.yours || []);
    const counts: Record<number, number> = {};
    (d.teamCounts || []).forEach((t: any) => { counts[t.program_id] = parseInt(t.cnt, 10); });
    setTeamCounts(counts);
  }

  useEffect(() => { load(); }, [identity.org, identity.person]);

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/portal/search?q=${encodeURIComponent(search)}&limit=12`, { signal: ctrl.signal })
      .then((r) => r.ok ? r.json() : { results: [] })
      .then((d) => setSearchResults(d.results || []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [search]);

  async function vote(programId: number, action: "add" | "remove") {
    await fetch("/api/portal/priority", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: identity.org, person: identity.person, program_id: programId, vote: action }),
    });
    load();
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Focus</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Priority programs</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 24px", maxWidth: 640 }}>
        Trellis has 500+ programs. Some matter more to you than others. Tag the ones you want me to watch closely — I'll prioritize accuracy and re-verification on those.
      </p>

      <div style={{ marginBottom: 32 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Trellis programs to pin…"
          style={{ width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 8, boxSizing: "border-box", background: "#fff" }}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: 8, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 320, overflow: "auto" }}>
            {searchResults.map((r) => {
              const alreadyVoted = yourVotes.find((v) => v.program_id === r.id);
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: C.greenDark, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{r.category} · {(r.province || []).join(", ")}</div>
                  </div>
                  <button onClick={() => vote(r.id, alreadyVoted ? "remove" : "add")} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, background: alreadyVoted ? "#fff" : C.greenDark, color: alreadyVoted ? C.greenDark : "#fff", border: `1px solid ${C.greenDark}`, borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {alreadyVoted ? "Pinned" : "Pin"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Your pinned programs ({yourVotes.length})</div>
        {yourVotes.length === 0 ? (
          <div style={{ fontSize: 14, color: C.soft, fontStyle: "italic" }}>Nothing pinned yet. Search above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {yourVotes.map((v) => (
              <div key={v.program_id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, color: C.greenDark, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {v.category} · {(v.province || []).join(", ")}
                    {teamCounts[v.program_id] > 0 && <span style={{ marginLeft: 10, color: C.gold, fontWeight: 600 }}>· also pinned by {teamCounts[v.program_id]} teammate{teamCounts[v.program_id] === 1 ? "" : "s"}</span>}
                  </div>
                </div>
                <button onClick={() => vote(v.program_id, "remove")} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SandboxView({ identity }: { identity: Identity }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: number; html: string; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endorsed, setEndorsed] = useState(false);

  const examples = [
    "A way to see all programs from a specific funder side by side",
    "Email me when an Ontario accelerator program opens a new intake",
    "A chart showing how funding amounts change by stage across provinces",
    "A view that shows which programs best-fit a specific company we're advising",
  ];

  async function generate() {
    if (prompt.trim().length < 8) return;
    setGenerating(true);
    setError(null);
    setEndorsed(false);
    try {
      const resp = await fetch("/api/portal/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org: identity.org, person: identity.person, prompt }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }
      const data = await resp.json();
      setResult({ id: data.id, html: data.mockup_html, prompt });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function endorse() {
    if (!result) return;
    await fetch("/api/portal/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: identity.org, person: identity.person, id: result.id, action: "endorse" }),
    });
    setEndorsed(true);
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>What if</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Feature sandbox</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 32px", maxWidth: 640 }}>
        Describe something you wish Trellis did — even roughly. Claude will design what it might look like, in the Trellis style. Endorse the ones you'd want shipped and they go on the real roadmap.
      </p>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>What would make Trellis more useful for you?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="A feature, a workflow, a view…"
          style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.soft }}>Try: <span style={{ color: C.muted, fontStyle: "italic" }}>{examples[Math.floor(Math.random() * examples.length)]}</span></div>
          <button onClick={generate} disabled={prompt.trim().length < 8 || generating} style={{ padding: "12px 22px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: prompt.trim().length >= 8 ? "pointer" : "not-allowed", opacity: prompt.trim().length >= 8 ? 1 : 0.5 }}>
            {generating ? "Designing…" : "Design this →"}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: 16, background: "#FEE", border: `1px solid ${C.red}`, borderRadius: 6, color: C.red, marginBottom: 24 }}>Couldn't generate: {error}</div>}

      {generating && (
        <div style={{ padding: 40, background: C.bgWarm, border: `1px dashed ${C.gold}`, borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 20, color: C.greenDark, marginBottom: 8 }}>Claude is designing this…</div>
          <div style={{ fontSize: 13, color: C.muted }}>Usually takes 8-15 seconds.</div>
        </div>
      )}

      {result && !generating && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Generated from: "{result.prompt}"</div>
          <div style={{ background: C.cardBg, border: `2px solid ${C.gold}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
            <div dangerouslySetInnerHTML={{ __html: result.html }} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {endorsed ? (
              <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>
                ✓ Added to the roadmap. I'll ping you when it ships.
              </div>
            ) : (
              <>
                <button onClick={endorse} style={{ padding: "12px 22px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
                  Add to roadmap →
                </button>
                <button onClick={() => { setResult(null); setPrompt(result.prompt); }} style={{ padding: "12px 22px", background: "transparent", color: C.muted, fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartnerPortal() {
  const [, params] = useRoute("/for/:org/:person");
  const [, setLocation] = useLocation();
  const org = params?.org || "";
  const person = params?.person || "";

  const [authed, setAuthed] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [you, setYou] = useState<YouSummary | null>(null);
  const [view, setViewState] = useState<View>("home");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
    } catch {}
  }, []);

  const onPass = () => setAuthed(true);

  useEffect(() => {
    if (!authed || !org || !person) return;
    fetch(`/api/portal/me?org=${org}&person=${person}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setIdentity(d.identity);
        setTeam(d.team || []);
        setYou(d.you || null);
        logEvent(org, person, "view", "/portal/home");
      })
      .catch(() => {});
  }, [authed, org, person]);

  const setView = (v: View) => {
    setViewState(v);
    if (identity) logEvent(identity.org, identity.person, "view", `/portal/${v}`);
  };

  const pageTitle = useMemo(() => identity ? `${identity.display_name} · Trellis Portal` : "Trellis Partner Portal", [identity]);
  useEffect(() => { document.title = pageTitle; }, [pageTitle]);
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  if (!authed) return <PasswordGate onPass={onPass} />;

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans, padding: "120px 28px", textAlign: "center" }}>
        <div style={{ fontFamily: F.serif, fontSize: 40, color: C.greenDark, marginBottom: 12 }}>Not quite.</div>
        <div style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>This portal URL doesn't match anyone we have on file. Check the link or ping Justyn.</div>
        <button onClick={() => setLocation("/")} style={{ padding: "10px 20px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>Back to Trellis</button>
      </div>
    );
  }

  if (!identity) {
    return <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans, padding: "120px 28px", textAlign: "center", color: C.muted }}>Loading your portal…</div>;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Header identity={identity} view={view} setView={setView} />
      {view === "home" && <HomeView identity={identity} team={team} you={you} setView={setView} />}
      {view === "programs" && <ProgramsView identity={identity} />}
      {view === "feedback" && <FeedbackView identity={identity} />}
      {view === "priority" && <PriorityView identity={identity} />}
      {view === "sandbox" && <SandboxView identity={identity} />}
    </div>
  );
}
