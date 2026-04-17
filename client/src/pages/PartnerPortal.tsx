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
  blue: "#3E6B8C",
};

const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const PORTAL_PASSWORD = "bioenterprise2026";
const AUTH_KEY = "trellis-portal-auth-v1";
const TOUR_KEY = (org: string, person: string) => `trellis-portal-tour-${org}-${person}-v1`;

type View = "home" | "programs" | "feedback" | "priority" | "sandbox";

interface Identity {
  org: string;
  person: string;
  display_name: string;
  role: string | null;
  email: string | null;
  home_eyebrow: string | null;
  home_subheading: string | null;
  home_hero_callout: string | null;
  card_order: string[] | null;
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

const SANDBOX_EXAMPLES = [
  "A view that shows all programs from a specific funder side by side",
  "Email me when an Ontario accelerator program opens a new intake",
  "A chart of funding amounts by stage, by province",
  "Side-by-side comparison of two founders' pathways",
  "A one-pager I can drop into a grant proposal",
  "A heatmap of where our portfolio companies have been routed",
];

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
      try { localStorage.setItem(AUTH_KEY, "1"); } catch {}
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
          You should have received the password by email. One-time entry. We'll remember you after this.
        </div>
        <input autoFocus type="password" value={value} onChange={(e) => { setValue(e.target.value); setError(false); }} placeholder="password" style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
        <button type="submit" style={{ width: "100%", padding: "12px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 15, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>Enter</button>
        {error && <div style={{ fontSize: 13, color: C.red, marginTop: 12 }}>That's not quite right. Try again, or email Justyn.</div>}
      </form>
    </div>
  );
}

function Header({ identity, view, setView }: { identity: Identity; view: View; setView: (v: View) => void }) {
  const navItems: { key: View; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "programs", label: "Your programs" },
    { key: "sandbox", label: "Sandbox" },
    { key: "priority", label: "Priority" },
    { key: "feedback", label: "Feedback" },
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
            <button key={item.key} onClick={() => setView(item.key)} style={{ padding: "8px 14px", background: view === item.key ? C.bgWarm : "transparent", color: view === item.key ? C.greenDark : C.muted, fontFamily: F.sans, fontSize: 14, fontWeight: view === item.key ? 600 : 500, border: "none", borderRadius: 6, cursor: "pointer" }}>{item.label}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.muted }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bgWarm, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.greenDark, fontSize: 13 }}>
            {identity.display_name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
          </div>
          <div>{identity.display_name.split(" ")[0]}</div>
        </div>
      </div>
    </header>
  );
}

interface CardConfig { view: View; eyebrow: string; title: string; blurb: string; hero?: boolean; }
const CARDS: Record<string, CardConfig> = {
  programs: { view: "programs", eyebrow: "Audit", title: "Your programs", blurb: "Every Trellis entry that touches BioEnterprise. Corrections ship inside 24 hours." },
  sandbox: { view: "sandbox", eyebrow: "The wild one", title: "Feature sandbox", blurb: "Type a feature you wish Trellis had. Claude designs three takes in seconds. Endorse one, it goes on the roadmap your team can see and build on.", hero: true },
  priority: { view: "priority", eyebrow: "Focus", title: "Priority programs", blurb: "Pin the programs you care about most. Shared with the team." },
  feedback: { view: "feedback", eyebrow: "Observations", title: "Feedback thread", blurb: "Half-baked thoughts, questions, things you notice. Private by default. Share with the team if you want." },
};

function HomeView({ identity, team, you, setView }: { identity: Identity; team: TeamRow[]; you: YouSummary | null; setView: (v: View) => void }) {
  const firstName = identity.display_name.split(" ")[0];
  const lastVisit = you?.last_visit ? new Date(you.last_visit) : null;
  const sinceText = lastVisit
    ? `Welcome back. Last time you were here: ${lastVisit.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}.`
    : "First time in. The tour started automatically, or skip it and poke around on your own.";

  const eyebrow = identity.home_eyebrow || "Welcome";
  const subheading = identity.home_subheading || sinceText;
  const heroCallout = identity.home_hero_callout;
  const order = identity.card_order && identity.card_order.length > 0
    ? identity.card_order
    : ["programs", "sandbox", "priority", "feedback"];
  const cards = order.map((k) => CARDS[k]).filter(Boolean);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>{eyebrow}</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(40px, 6vw, 64px)", color: C.greenDark, lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
        {firstName}, this is yours.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: "clamp(18px, 2vw, 22px)", color: C.muted, fontStyle: "italic", lineHeight: 1.55, margin: "20px 0 0", maxWidth: 680 }}>
        {subheading}
      </p>
      <p style={{ fontFamily: F.sans, fontSize: 15, color: C.soft, lineHeight: 1.6, margin: "12px 0 0" }}>
        {sinceText}
      </p>

      {heroCallout && (
        <div style={{ marginTop: 36, padding: "22px 26px", background: C.bgWarm, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, maxWidth: 720 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 8 }}>Your lead</div>
          <div style={{ fontFamily: F.serif, fontSize: 19, color: C.greenDark, lineHeight: 1.5 }}>{heroCallout}</div>
        </div>
      )}

      <div style={{ height: 1, background: C.hairline, margin: "56px 0 40px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {cards.map((c) => {
          const isHero = !!c.hero;
          return (
            <button key={c.view} onClick={() => setView(c.view)}
              className={isHero ? "trellis-hero-card" : undefined}
              style={{
                textAlign: "left", padding: "24px 22px",
                background: isHero ? "linear-gradient(135deg, #F5E9C7 0%, #FAFAF7 90%)" : C.cardBg,
                border: `${isHero ? 2 : 1}px solid ${isHero ? C.gold : C.border}`,
                borderRadius: 10, cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                boxShadow: isHero ? "0 10px 30px -16px rgba(212,168,40,0.45)" : "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = isHero ? "0 18px 44px -14px rgba(212,168,40,0.6)" : "0 12px 32px -18px rgba(27,67,50,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = isHero ? "0 10px 30px -16px rgba(212,168,40,0.45)" : "none"; (e.currentTarget as HTMLButtonElement).style.borderColor = isHero ? C.gold : C.border; }}>
              {isHero && (
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 9, padding: "3px 8px", borderRadius: 12, background: C.goldDeep, color: "#fff", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Start here</div>
              )}
              <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: isHero ? C.goldDeep : C.gold, textTransform: "uppercase", marginBottom: 10 }}>{c.eyebrow}</div>
              <div style={{ fontFamily: F.serif, fontSize: isHero ? 26 : 22, color: C.greenDark, marginBottom: 8, letterSpacing: "-0.005em" }}>{c.title}</div>
              <div style={{ fontSize: 14, color: isHero ? C.text : C.muted, lineHeight: 1.55 }}>{c.blurb}</div>
              {isHero && (
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: C.greenDark, display: "flex", alignItems: "center", gap: 6 }}>
                  Open the sandbox <span style={{ transform: "translateY(-1px)" }}>→</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 48, padding: "24px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Team activity (last 30 days)</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: C.greenDark, marginBottom: 14 }}>
          What others on your team have been doing
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
                      {priorities > 0 && <span>{priorities} pinned</span>}
                    </>
                  )}
                </div>
                {t.last_seen && <div style={{ fontSize: 12, color: C.soft }}>{new Date(t.last_seen).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/for/bioenterprise" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>About this tool →</a>
        <a href="/demo" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>The walkthrough →</a>
        <a href="/navigator" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>The live tool →</a>
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
      body: JSON.stringify({ org: identity.org, person: identity.person, program_id: programId, field, suggested_value: suggested, note }),
    });
    setSubmitting(false);
    if (resp.ok) {
      setSubmitted(programId);
      setField(""); setSuggested(""); setNote("");
      setTimeout(() => { setOpenId(null); setSubmitted(null); }, 2500);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Audit</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Your programs in Trellis</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 32px", maxWidth: 640 }}>
        These are the entries that mention BioEnterprise directly (gold border) or show up through partnership (grey border). If any detail is wrong, flag it and I'll fix within 24 hours.
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
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12, background: p.status === "verified" || p.status === "active" ? "#E7F2E7" : p.status === "unverified" ? "#FEF3DC" : "#F0F0F0", color: C.muted, letterSpacing: "0.03em", textTransform: "uppercase" }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>{p.category}</span>
                    <span>{(p.province || []).join(", ")}</span>
                    <span>{(p.stage || []).join(", ") || "-"}</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 10 }}>{p.description}</div>
                  <a href={p.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.green, textDecoration: "none", borderBottom: `1px solid ${C.gold}`, paddingBottom: 1 }}>{p.website}</a>
                </div>
                <button onClick={() => setOpenId(openId === p.id ? null : p.id)} style={{ padding: "8px 14px", background: openId === p.id ? C.greenDark : "transparent", color: openId === p.id ? "#fff" : C.greenDark, fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: `1px solid ${C.greenDark}`, borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {openId === p.id ? "Close" : "Suggest correction"}
                </button>
              </div>
              {openId === p.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
                  {submitted === p.id ? (
                    <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>Thanks. I'll look at this within 24 hours.</div>
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
                          <option value="status">Status</option>
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

interface FeedbackReply { id: number; body: string; created_at: string; }
interface FeedbackPost {
  id: number;
  topic: string;
  body: string;
  visibility: string;
  created_at: string;
  replies?: FeedbackReply[];
  author_name?: string;
  author_person?: string;
}

function FeedbackView({ identity }: { identity: Identity }) {
  const [yours, setYours] = useState<FeedbackPost[]>([]);
  const [teamPublic, setTeamPublic] = useState<FeedbackPost[]>([]);
  const [teamPrivateCounts, setTeamPrivateCounts] = useState<{ topic: string; cnt: string }[]>([]);
  const [topic, setTopic] = useState("General");
  const [body, setBody] = useState("");
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [sending, setSending] = useState(false);

  async function load() {
    const resp = await fetch(`/api/portal/feedback?org=${identity.org}&person=${identity.person}`);
    const data = await resp.json();
    setYours(data.yours || []);
    setTeamPublic(data.teamPublic || []);
    setTeamPrivateCounts(data.teamPrivateCounts || []);
  }

  useEffect(() => { load(); }, [identity.org, identity.person]);

  async function submit() {
    if (body.trim().length < 4) return;
    setSending(true);
    await fetch("/api/portal/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: identity.org, person: identity.person, topic, body, visibility: shareWithTeam ? "team" : "private" }),
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
        Less formal than corrections. Observations, half-baked ideas, questions. Private by default. Tick the share-with-team box if you want it visible to your colleagues.
      </p>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 22, marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {["Gap Map", "Your Programs", "Wizard / Pathway", "AI Analysis", "Sandbox", "General"].map((t) => (
            <button key={t} onClick={() => setTopic(t)} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, background: topic === t ? C.greenDark : "transparent", color: topic === t ? "#fff" : C.muted, border: `1px solid ${topic === t ? C.greenDark : C.border}`, borderRadius: 14, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What did you notice?" style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical", marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={shareWithTeam} onChange={(e) => setShareWithTeam(e.target.checked)} />
            <span>Share with teammates (default: private, just you + Justyn)</span>
          </label>
          <button onClick={submit} disabled={body.trim().length < 4 || sending} style={{ padding: "10px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: body.trim().length >= 4 ? "pointer" : "not-allowed", opacity: body.trim().length >= 4 ? 1 : 0.5 }}>
            {sending ? "Sending…" : "Post"}
          </button>
        </div>
      </div>

      {teamPublic.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>What your team is saying publicly</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {teamPublic.map((p) => (
              <div key={p.id} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.greenDark }}>{p.author_name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.topic}</span>
                    <span style={{ fontSize: 11, color: C.soft }}>{new Date(p.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamPrivateCounts.length > 0 && (
        <div style={{ marginBottom: 32, padding: "14px 18px", background: "#F5F5F0", border: `1px dashed ${C.border}`, borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
            <strong style={{ color: C.greenDark }}>Private posts this month:</strong>{" "}
            {teamPrivateCounts.map((t, i) => (
              <span key={t.topic}>{i > 0 && " · "}{t.topic} ({t.cnt})</span>
            ))}
            {" "}<span style={{ color: C.soft }}>Content stays with the author.</span>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>Your posts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {yours.length === 0 ? (
          <div style={{ fontSize: 14, color: C.soft, fontStyle: "italic" }}>Nothing yet. First thought goes above.</div>
        ) : yours.map((p) => (
          <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.topic}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: p.visibility === "team" ? "#E7F2E7" : "#F5F5F0", color: p.visibility === "team" ? C.green : C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {p.visibility === "team" ? "shared" : "private"}
                </span>
              </div>
              <span style={{ fontSize: 12, color: C.soft }}>{new Date(p.created_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.body}</div>
            {p.replies && p.replies.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
                {p.replies.map((r) => (
                  <div key={r.id} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: C.greenDark, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>J</div>
                    <div>
                      <div style={{ fontSize: 12, color: C.soft, marginBottom: 2 }}>Justyn · {new Date(r.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</div>
                      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{r.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      .then((r) => (r.ok ? r.json() : { results: [] }))
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
        Trellis has 500+ programs. Some matter more to you than others. Pin the ones you want me to watch closely. Your picks are shared with your team.
      </p>

      <div style={{ marginBottom: 32 }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Trellis programs to pin…" style={{ width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 8, boxSizing: "border-box", background: "#fff" }} />
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

interface SandboxVariant { id: number; angle: string; html: string; }
interface RoadmapMockup { id: number; person: string; prompt: string; mockup_html: string; status: string; created_at: string; author_name: string; }

function SandboxView({ identity }: { identity: Identity }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<SandboxVariant[] | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [endorsedId, setEndorsedId] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapMockup[]>([]);
  const [placeholder] = useState(SANDBOX_EXAMPLES[Math.floor(Math.random() * SANDBOX_EXAMPLES.length)]);
  const [expandedMockup, setExpandedMockup] = useState<{ html: string; title: string; author: string } | null>(null);

  async function loadRoadmap() {
    const r = await fetch(`/api/portal/roadmap-feed?org=${identity.org}&person=${identity.person}`);
    const d = await r.json();
    setRoadmap(d.mockups || []);
  }
  useEffect(() => { loadRoadmap(); }, [identity.org, identity.person]);

  async function generate() {
    if (prompt.trim().length < 8) return;
    setGenerating(true);
    setError(null);
    setEndorsedId(null);
    setVariants(null);
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
      setVariants(data.variants || []);
      setLastPrompt(data.prompt || prompt);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function endorse(id: number) {
    await fetch("/api/portal/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: identity.org, person: identity.person, id, action: "endorse" }),
    });
    setEndorsedId(id);
    loadRoadmap();
  }

  function buildOn(m: RoadmapMockup) {
    const basePrompt = m.prompt.replace(/\s*\[variant \d+:[^\]]*\]\s*$/, "").replace(/\s*\[seed from meeting:[^\]]*\]\s*$/, "");
    setPrompt(`Like ${m.author_name}'s "${basePrompt.slice(0, 120)}${basePrompt.length > 120 ? "…" : ""}", but `);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setVariants(null);
    setEndorsedId(null);
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Co-pilot</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Feature sandbox</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 8px", maxWidth: 720 }}>
        You are a co-product-manager on Trellis, not a user. Describe something you wish it did. Claude designs three takes in the Trellis style. Pick the one closest. It goes on the roadmap your team can see and build on.
      </p>
      <p style={{ fontFamily: F.sans, fontSize: 14, color: C.soft, lineHeight: 1.55, margin: "0 0 32px", maxWidth: 720, fontStyle: "italic" }}>
        I've seeded the roadmap with three ideas based on what came up in our first meeting. Add on to them, or start fresh below.
      </p>

      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 24, maxWidth: 860 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>What would make Trellis more useful for you?</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 14, gap: 12 }}>
          <button onClick={generate} disabled={prompt.trim().length < 8 || generating} style={{ padding: "12px 22px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: prompt.trim().length >= 8 ? "pointer" : "not-allowed", opacity: prompt.trim().length >= 8 ? 1 : 0.5 }}>
            {generating ? "Designing three takes…" : "Design this →"}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: 16, background: "#FEE", border: `1px solid ${C.red}`, borderRadius: 6, color: C.red, marginBottom: 24 }}>Couldn't generate: {error}</div>}

      {generating && (
        <div style={{ padding: 40, background: C.bgWarm, border: `1px dashed ${C.gold}`, borderRadius: 10, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: F.serif, fontSize: 20, color: C.greenDark, marginBottom: 8 }}>Claude is designing three takes…</div>
          <div style={{ fontSize: 13, color: C.muted }}>Usually 20-40 seconds for three variants.</div>
        </div>
      )}

      {variants && !generating && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            Three takes on: "{lastPrompt}"
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {variants.map((v, i) => {
              const isEndorsed = endorsedId === v.id;
              const isAnyEndorsed = endorsedId !== null;
              return (
                <div key={v.id} style={{ background: C.cardBg, border: `2px solid ${isEndorsed ? C.gold : isAnyEndorsed ? C.hairline : C.border}`, borderRadius: 10, padding: 18, opacity: isAnyEndorsed && !isEndorsed ? 0.5 : 1, transition: "opacity 0.2s ease, border-color 0.2s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, color: C.gold, textTransform: "uppercase" }}>Take {i + 1}</div>
                    <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>{v.angle}</div>
                  </div>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 14, background: C.bg, minHeight: 200, overflow: "auto" }}>
                    <div dangerouslySetInnerHTML={{ __html: v.html }} />
                  </div>
                  {isEndorsed ? (
                    <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Added to the team roadmap</div>
                  ) : (
                    <button onClick={() => endorse(v.id)} disabled={isAnyEndorsed} style={{ width: "100%", padding: "10px 14px", background: isAnyEndorsed ? C.hairline : C.greenDark, color: isAnyEndorsed ? C.muted : "#fff", fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: isAnyEndorsed ? "not-allowed" : "pointer" }}>
                      This one →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button onClick={() => { setVariants(null); setEndorsedId(null); setPrompt(lastPrompt); }} style={{ padding: "10px 18px", background: "transparent", color: C.muted, fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>
              Try again with the same prompt
            </button>
          </div>
        </div>
      )}

      {roadmap.length > 0 && (
        <div>
          <div style={{ height: 1, background: C.hairline, margin: "48px 0 32px" }} />
          <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Team roadmap</div>
          <h2 style={{ fontFamily: F.serif, fontSize: "clamp(24px, 3vw, 32px)", color: C.greenDark, lineHeight: 1.2, margin: "0 0 10px", letterSpacing: "-0.005em" }}>
            What the team has on the roadmap
          </h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 28, maxWidth: 680 }}>
            Mockups the team endorsed, plus three starters I seeded based on what came up in the meeting. Click <strong style={{ color: C.greenDark }}>Build on this</strong> to riff off one. The sandbox picks up the thread.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {roadmap.map((m) => {
              const cleanPrompt = m.prompt.replace(/\s*\[variant \d+:[^\]]*\]\s*$/, "").replace(/\s*\[seed from meeting:[^\]]*\]\s*$/, "");
              const isSeed = m.prompt.includes("[seed from meeting:");
              const seedTag = isSeed ? (m.prompt.match(/\[seed from meeting: ([^\]]+)\]/) || [])[1] : null;
              return (
                <div key={m.id} style={{ background: C.cardBg, border: `1px solid ${isSeed ? C.gold : m.status === "endorsed" ? C.gold : C.border}`, borderRadius: 10, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>{m.author_name}</div>
                    <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: isSeed ? "#F5E9C7" : m.status === "endorsed" ? "#F5E9C7" : "#F5F5F0", color: isSeed ? C.greenDark : m.status === "endorsed" ? C.greenDark : C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {isSeed ? (seedTag || "Seed") : m.status === "endorsed" ? "On roadmap" : "Draft"}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>"{cleanPrompt}"</div>
                  <button
                    onClick={() => setExpandedMockup({ html: m.mockup_html, title: cleanPrompt, author: m.author_name })}
                    style={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      border: `1px solid ${C.border}`, borderRadius: 6,
                      background: C.bg,
                      padding: 0,
                      marginBottom: 12,
                      cursor: "zoom-in",
                      overflow: "hidden",
                      height: 220,
                    }}
                  >
                    <div style={{
                      transform: "scale(0.48)",
                      transformOrigin: "top left",
                      width: "210%",
                      pointerEvents: "none",
                      padding: 14,
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: m.mockup_html }} />
                    </div>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "32px 12px 10px 12px",
                      background: "linear-gradient(to top, rgba(250,250,247,0.98) 40%, rgba(250,250,247,0))",
                      display: "flex", justifyContent: "flex-end",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.greenDark, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M6 2H2v4m8-4h4v4m0 4v4h-4m-4 0H2v-4" stroke={C.greenDark} strokeWidth="1.6" strokeLinecap="round"/></svg>
                        Click to expand
                      </span>
                    </div>
                  </button>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <button onClick={() => buildOn(m)} style={{ padding: "8px 14px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
                      Build on this →
                    </button>
                    <div style={{ fontSize: 11, color: C.soft }}>{new Date(m.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {expandedMockup && (
        <div
          onClick={() => setExpandedMockup(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(27,67,50,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflow: "auto" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.cardBg, borderRadius: 12, maxWidth: 1000, width: "100%", maxHeight: "calc(100vh - 48px)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, background: C.bg }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>From {expandedMockup.author}</div>
                <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 1.5 }}>"{expandedMockup.title}"</div>
              </div>
              <button onClick={() => setExpandedMockup(null)} aria-label="Close" style={{ background: "transparent", border: "none", color: C.muted, fontSize: 24, cursor: "pointer", padding: 0, width: 32, height: 32, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 32, overflow: "auto", flex: 1, display: "flex", justifyContent: "center" }}>
              <div dangerouslySetInnerHTML={{ __html: expandedMockup.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuidedTour({ identity, onDone, onJumpToSandbox }: { identity: Identity; onDone: () => void; onJumpToSandbox: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Hi ${identity.display_name.split(" ")[0]}. Thirty seconds of context first.`,
      body: "Trellis is the public-facing navigation layer for Canadian agtech. 500+ programs, a wizard that builds pathways, and a gap-map that shows where the ecosystem is thin. This portal is your way in. Five minutes here on day one is worth more than any email I could send.",
      art: "welcome",
    },
    {
      title: "A real founder's path, as an anchor.",
      body: "CropMind, NB-based precision agtech. Their actual path: NBIF seed, then Energia Ventures (verified alumnus), then left Canada for a US accelerator (Reservoir), then Google for Startups. Trellis would have suggested NBIF and Energia for an MVP-stage NB soil-tech founder. Both were right. The Scale step we couldn't suggest because it doesn't exist in Canada, and that is precisely what the Gap Map shows.",
      art: "cropmind",
    },
    {
      title: "Your portal has five surfaces.",
      body: "Home (this one) is tailored to you specifically. Tabitha sees a grant-writer angle, Dave sees strategic, Carla sees Engine-adjacent. Your programs is audit. Priority programs is where you flag what to keep accurate. Feedback is where you tell me what feels off. The wild one gets its own step.",
      art: "cards",
    },
    {
      title: "The Sandbox is where you stop being a user and start being a co-product-manager.",
      body: "You type a feature you wish Trellis did. Claude designs three takes in the Trellis style in about 30 seconds. Pick the one closest to what you imagined. It goes on the team roadmap, and your colleagues can riff on it. I already seeded three starters based on what came up in our meeting. Go play with it first. Seriously.",
      art: "sandbox",
    },
    {
      title: "One ground rule before you go.",
      body: "This is in closed beta. If something looks wrong, say so. That signal is the most valuable thing you can give me. Every correction you flag, every feature you endorse, every pin you drop makes Trellis sharper. Okay: go.",
      art: "end",
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,67,50,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, fontFamily: F.sans }}>
      <div style={{ width: "100%", maxWidth: 640, background: C.bg, borderRadius: 12, overflow: "hidden", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "40px 40px 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Guided tour · {step + 1} of {steps.length}</div>
          <h2 style={{ fontFamily: F.serif, fontSize: "clamp(26px, 3.4vw, 36px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>{s.title}</h2>
          <p style={{ fontSize: 15.5, color: C.text, lineHeight: 1.7, margin: "18px 0 0" }}>{s.body}</p>
        </div>
        {s.art === "sandbox" && (
          <div style={{ padding: "0 40px" }}>
            <div style={{ background: "linear-gradient(135deg, #F5E9C7 0%, #FAFAF7 100%)", border: `1.5px solid ${C.gold}`, borderRadius: 10, padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 10, background: C.greenDark, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.goldDeep, textTransform: "uppercase", marginBottom: 6 }}>How it works</div>
                  <ol style={{ margin: 0, padding: "0 0 0 20px", fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                    <li>Type a feature. Something like <em>"Show me all programs from FedDev Ontario, stacked by stage."</em></li>
                    <li>Claude designs <strong>three</strong> different takes on it, in the Trellis visual style.</li>
                    <li>Pick the one closest to what you imagined. The other two fade. The one you picked lands on the team roadmap.</li>
                    <li>Your colleagues see it, click <strong>Build on this</strong>, and riff. It's a shared design session that never ends.</li>
                  </ol>
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 13, color: C.muted, fontStyle: "italic", paddingTop: 14, borderTop: `1px dashed ${C.hairline}` }}>
                Three starters are already in the roadmap, tailored to things that came up in our meeting. Worth looking at first to see the shape of what's possible.
              </div>
            </div>
          </div>
        )}
        {s.art === "cropmind" && (
          <div style={{ padding: "0 40px" }}>
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.greenDark }}>CropMind, NB precision agtech</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Actual path vs Trellis-suggested</div>
                </div>
                <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: C.bgWarm, color: C.greenDark, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Real company</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>What they did</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ padding: "6px 10px", background: "#F1F7F1", borderRadius: 4, color: C.green, fontWeight: 600 }}>✓ NBIF seed</div>
                    <div style={{ padding: "6px 10px", background: "#F1F7F1", borderRadius: 4, color: C.green, fontWeight: 600 }}>✓ Energia Ventures</div>
                    <div style={{ padding: "6px 10px", background: "#FEF3DC", borderRadius: 4, color: "#8B6B1F", fontWeight: 600 }}>→ Reservoir (US)</div>
                    <div style={{ padding: "6px 10px", background: "#FEF3DC", borderRadius: 4, color: "#8B6B1F", fontWeight: 600 }}>→ Google for Startups</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>What Trellis would have suggested</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ padding: "6px 10px", background: "#E7F2E7", borderRadius: 4, color: C.greenDark, fontWeight: 600 }}>✓ NBIF</div>
                    <div style={{ padding: "6px 10px", background: "#E7F2E7", borderRadius: 4, color: C.greenDark, fontWeight: 600 }}>✓ Energia Ventures</div>
                    <div style={{ padding: "6px 10px", background: "#FAEAE7", borderRadius: 4, color: C.red, fontWeight: 600, fontStyle: "italic" }}>Scale gap. No suggestion.</div>
                    <div style={{ padding: "6px 10px", background: "#F5F5F0", borderRadius: 4, color: C.muted, fontStyle: "italic" }}>(US gap, can't fill)</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.border}`, lineHeight: 1.5 }}>
                The Gap Map reveals this before the founder hits the wall. That's the whole point.
              </div>
            </div>
          </div>
        )}
        <div style={{ padding: "24px 40px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button onClick={onDone} style={{ padding: "10px 18px", background: "transparent", color: C.muted, fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
            Skip the tour
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>
                Back
              </button>
            )}
            {s.art === "sandbox" && (
              <button onClick={() => { onJumpToSandbox(); onDone(); }} style={{ padding: "10px 18px", background: C.goldDeep, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer" }}>
                Take me there now →
              </button>
            )}
            <button onClick={() => { if (isLast) onDone(); else setStep(step + 1); }} style={{ padding: "10px 22px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
              {isLast ? "Start exploring →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
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
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(AUTH_KEY) === "1") setAuthed(true); } catch {}
  }, []);

  const onPass = () => setAuthed(true);

  useEffect(() => {
    if (!authed || !org || !person) return;
    fetch(`/api/portal/me?org=${org}&person=${person}`)
      .then(async (r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        setIdentity(d.identity);
        setTeam(d.team || []);
        setYou(d.you || null);
        logEvent(org, person, "view", "/portal/home");
        // Stash identity for the cross-site floating feedback button.
        try {
          localStorage.setItem(
            "trellis-portal-identity-v1",
            JSON.stringify({ org, person, display_name: d.identity.display_name })
          );
          const seen = localStorage.getItem(TOUR_KEY(org, person));
          if (!seen) setShowTour(true);
        } catch {}
      })
      .catch(() => {});
  }, [authed, org, person]);

  const setView = (v: View) => {
    setViewState(v);
    if (identity) logEvent(identity.org, identity.person, "view", `/portal/${v}`);
  };

  function endTour() {
    try { localStorage.setItem(TOUR_KEY(org, person), "1"); } catch {}
    setShowTour(false);
  }

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
      {showTour && <GuidedTour identity={identity} onDone={endTour} onJumpToSandbox={() => setView("sandbox")} />}
    </div>
  );
}
