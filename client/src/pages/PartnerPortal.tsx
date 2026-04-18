import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import FarmLoader from "../components/FarmLoader";

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

const AUTH_KEY = (org: string) => `trellis-portal-auth-${org}-v1`;
const TOUR_KEY = (org: string, person: string) => `trellis-portal-tour-${org}-${person}-v1`;
const PATHWAY_KEY = (org: string, person: string) => `trellis-portal-pathway-${org}-${person}-v1`;

interface OrgConfig {
  slug: string;
  display_name: string;
  theme_color: string;
  logo_url: string | null;
  banner_text: string | null;
  tour_variant: "partner" | "advisor";
}

type View = "home" | "programs" | "feedback" | "priority" | "sandbox";

interface FounderProfile {
  description?: string;
  stage?: string;
  provinces?: string[];
  sector?: string;
  product_type?: string;
  needs?: string[];
  primary_need?: string;
}

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
  portal_type: string;
  founder_profile: FounderProfile | null;
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

function PasswordGate({ org, onPass }: { org: string; onPass: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org, password: value.trim() }),
      });
      if (r.ok) {
        try { localStorage.setItem(AUTH_KEY(org), "1"); } catch {}
        onPass();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <form onSubmit={submit} style={{ width: 360, padding: "40px 32px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 8px 24px -16px rgba(27,67,50,0.15)" }}>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: C.greenDark, marginBottom: 8, lineHeight: 1.15 }}>Portal</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>
          You should have received the password by email. One-time entry. We'll remember you after this.
        </div>
        <input autoFocus type="password" value={value} onChange={(e) => { setValue(e.target.value); setError(false); }} placeholder="password" style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
        <button type="submit" disabled={busy} style={{ width: "100%", padding: "12px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 15, fontWeight: 600, border: "none", borderRadius: 6, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Checking…" : "Enter"}</button>
        {error && <div style={{ fontSize: 13, color: C.red, marginTop: 12 }}>That's not quite right. Try again, or email Justyn.</div>}
      </form>
    </div>
  );
}

function PortalBanner({ orgConfig }: { orgConfig: OrgConfig }) {
  if (!orgConfig.banner_text) return null;
  return (
    <div style={{ background: orgConfig.theme_color, color: "#fff", fontFamily: F.sans, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", padding: "7px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {orgConfig.logo_url && (
        <img src={orgConfig.logo_url} alt="" style={{ height: 14, width: "auto", display: "block" }} />
      )}
      <span>{orgConfig.banner_text}</span>
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
      <div className="portal-header-row" style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark }}>Trellis</div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, color: C.gold, textTransform: "uppercase" }}>
            · Partner portal
          </div>
        </div>
        <nav className="portal-header-nav" style={{ display: "flex", gap: 4 }}>
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
  programs: { view: "programs", eyebrow: "Audit", title: "Your programs", blurb: "Every Trellis entry tagged to your world. Corrections ship inside 24 hours." },
  sandbox: { view: "sandbox", eyebrow: "The wild one", title: "Feature sandbox", blurb: "Type a feature you wish Trellis had. Claude designs three takes in seconds. Endorse one, it goes on the roadmap your team can see and build on.", hero: true },
  priority: { view: "priority", eyebrow: "Focus", title: "Priority programs", blurb: "Pin the programs you care about most. Shared with the team." },
  feedback: { view: "feedback", eyebrow: "Observations", title: "Feedback thread", blurb: "Half-baked thoughts, questions, things you notice. Private by default. Share with the team if you want." },
};

interface PathwayStep {
  id: string;
  label: string;
  body: string;
  cta: string;
  href?: string;
  onClickView?: View;
  external?: boolean;
}

function PathwayChecklist({ identity, setView }: { identity: Identity; setView: (v: View) => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PATHWAY_KEY(identity.org, identity.person));
      if (raw) setDone(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [identity.org, identity.person]);

  const steps: PathwayStep[] = [
    {
      id: "poke",
      label: "Poke around Trellis. See what a founder sees.",
      body: "Five minutes of browsing. Skim the home page, click Browse Programs, glance at the Gap Map. No pressure to finish.",
      cta: "Open Trellis",
      href: "/",
      external: true,
    },
    {
      id: "wizard-early",
      label: "Run the wizard with an early-stage partner.",
      body: "Pick a real partner company you worked with in the last year. Something MVP or Pilot stage. Run them through the wizard and see the pathway Trellis suggests. Note what matches their reality and what doesn't.",
      cta: "Launch the founder wizard",
      href: "/navigator",
      external: true,
    },
    {
      id: "wizard-scale",
      label: "Run the wizard with a later-stage partner.",
      body: "Same wizard, but pick a partner at Comm or Scale stage. This is where the Gap Map pattern shows up most: the tool tends to run out of Canadian answers, which is exactly the 'Scale Cliff' Tabitha's kind of narrative wants to cite.",
      cta: "Open the wizard again",
      href: "/navigator",
      external: true,
    },
    {
      id: "audit",
      label: "Come back here and audit your programs.",
      body: "The Your Programs tab lists every Trellis entry that touches BioEnterprise. If a stage, province, status, or description is wrong, flag it. I ship corrections within 24 hours.",
      cta: "Go to Your programs",
      onClickView: "programs",
    },
    {
      id: "shape",
      label: "Shape what comes next.",
      body: "Pin the programs you want me watching closely. Try the Sandbox and endorse a mockup. Drop one piece of feedback. Any of these lets me know where to focus.",
      cta: "Open the Sandbox",
      onClickView: "sandbox",
    },
  ];

  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try {
      localStorage.setItem(PATHWAY_KEY(identity.org, identity.person), JSON.stringify(next));
    } catch {}
  }

  const completedCount = steps.filter((s) => done[s.id]).length;
  const allDone = completedCount === steps.length;

  if (!ready) return null;

  return (
    <div style={{ marginTop: 36, padding: "28px 30px", background: C.cardBg, border: `1.5px solid ${C.gold}`, borderRadius: 12, maxWidth: 820, boxShadow: "0 10px 30px -18px rgba(212,168,40,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.goldDeep, textTransform: "uppercase" }}>Your suggested pathway</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{completedCount} of {steps.length} done</div>
      </div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark, lineHeight: 1.3, marginBottom: 6, letterSpacing: "-0.005em" }}>
        {allDone ? "You did the tour. Thank you." : "Take these in order. 15 minutes end to end."}
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 20 }}>
        {allDone
          ? "Everything below is still yours to come back to whenever."
          : "Each step opens either the live Trellis site (new tab) or a panel here. Check them off as you go."}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((s, i) => {
          const checked = !!done[s.id];
          return (
            <div key={s.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", background: checked ? "#F5F5F0" : C.bg, borderRadius: 8, border: `1px solid ${C.border}`, opacity: checked ? 0.6 : 1, transition: "opacity 0.2s ease, background 0.2s ease" }}>
              <button onClick={() => toggle(s.id)} aria-label={`Mark step ${i + 1} done`} style={{ flexShrink: 0, marginTop: 2, width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? C.green : C.hairline}`, background: checked ? C.green : "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.serif, fontSize: 17, color: C.greenDark, lineHeight: 1.35, marginBottom: 4, textDecoration: checked ? "line-through" : "none" }}>
                  {i + 1}. {s.label}
                </div>
                <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55, marginBottom: 8 }}>{s.body}</div>
                <div>
                  {s.external && s.href ? (
                    <a href={s.href} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, borderRadius: 6, textDecoration: "none" }}>
                      {s.cta} <span>↗</span>
                    </a>
                  ) : s.onClickView ? (
                    <button onClick={() => s.onClickView && setView(s.onClickView)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
                      {s.cta} →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PathwayProgram {
  id: number;
  name: string;
  category: string;
  province: string[] | null;
  stage: string[] | null;
  description: string | null;
  website: string | null;
  tags?: string[];
  why?: string | null;
}

const STAGE_OPTIONS = ["Idea", "MVP", "Pilot", "Comm", "Scale"];
const PROVINCE_OPTIONS = ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK", "Atlantic", "National"];
const SECTOR_OPTIONS = [
  { key: "crops", label: "Crops" },
  { key: "livestock", label: "Livestock" },
  { key: "mixed", label: "Mixed" },
  { key: "agnostic", label: "Not sector-specific" },
];
const NEED_OPTIONS = [
  { key: "non-dilutive-capital", label: "Money to build" },
  { key: "validate-with-farmers", label: "Prove it works" },
  { key: "structured-program", label: "Structure and mentorship" },
  { key: "pilot-site-field-validation", label: "Pilot site access" },
  { key: "first-customers", label: "Find first buyers" },
  { key: "channel-distribution", label: "Dealers and distribution" },
  { key: "go-to-market", label: "Go-to-market strategy" },
  { key: "growth-capital", label: "Growth capital" },
  { key: "all", label: "Show me everything" },
];

function FounderHome({ identity, setView }: { identity: Identity; setView: (v: View) => void }) {
  const [profile, setProfile] = useState<FounderProfile>(() => identity.founder_profile || {});
  const [pathway, setPathway] = useState<PathwayProgram[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function runPathway(p: FounderProfile) {
    if (!p.stage || !p.description) {
      setError("Need at least a stage and description to run.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: p.description,
          stage: p.stage,
          provinces: p.provinces || [],
          need: p.primary_need || (p.needs && p.needs[0]) || "all",
          sector: p.sector,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Pathway call failed (${resp.status})`);
      }
      const data = await resp.json();
      const programs = (data.programs || []).slice(0, 5);
      setPathway(programs);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (identity.founder_profile) runPathway(identity.founder_profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.org, identity.person]);

  const firstName = identity.display_name.split(" ")[0];

  function updateProfile(patch: Partial<FounderProfile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  return (
    <div className="portal-page" style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>
        {identity.home_eyebrow || "Your pathway"}
      </div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(40px, 6vw, 56px)", color: C.greenDark, lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
        {firstName}, I ran the wizard for you.
      </h1>
      <p style={{ fontFamily: F.serif, fontSize: "clamp(18px, 2vw, 22px)", color: C.muted, fontStyle: "italic", lineHeight: 1.55, margin: "20px 0 0", maxWidth: 720 }}>
        {identity.home_subheading || "Here is what Trellis thinks your path looks like. Tell me where I got it wrong, and we will re-run."}
      </p>

      <div style={{ marginTop: 36, padding: "22px 26px", background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: 12, maxWidth: 860 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase" }}>What I assumed about you</div>
          <button onClick={() => setEditing((e) => !e)} style={{ fontSize: 12, fontWeight: 600, color: C.greenDark, background: "transparent", border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
            {editing ? "Done editing" : "Edit"}
          </button>
        </div>
        {editing ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <FieldSelect label="Stage" value={profile.stage || ""} options={STAGE_OPTIONS.map((s) => ({ key: s, label: s }))} onChange={(v) => updateProfile({ stage: v })} />
            <FieldSelect label="Province" value={(profile.provinces || [])[0] || ""} options={PROVINCE_OPTIONS.map((p) => ({ key: p, label: p }))} onChange={(v) => updateProfile({ provinces: [v] })} />
            <FieldSelect label="Sector" value={profile.sector || ""} options={SECTOR_OPTIONS} onChange={(v) => updateProfile({ sector: v })} />
            <FieldSelect label="Primary need" value={profile.primary_need || ""} options={NEED_OPTIONS} onChange={(v) => updateProfile({ primary_need: v })} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>What you're building</label>
              <textarea value={profile.description || ""} onChange={(e) => updateProfile({ description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => { setEditing(false); runPathway(profile); }} style={{ padding: "10px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
                Re-run with these changes →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, fontSize: 13.5 }}>
            <Fact label="Stage" value={profile.stage || "—"} />
            <Fact label="Province" value={(profile.provinces || []).join(", ") || "—"} />
            <Fact label="Sector" value={SECTOR_OPTIONS.find((s) => s.key === profile.sector)?.label || profile.sector || "—"} />
            <Fact label="Primary need" value={NEED_OPTIONS.find((n) => n.key === profile.primary_need)?.label || profile.primary_need || "—"} />
            <div style={{ gridColumn: "1 / -1", fontSize: 13, color: C.muted, fontStyle: "italic", paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
              "{profile.description || "(no description yet)"}"
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.hairline, margin: "48px 0 28px" }} />

      <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Your pathway</div>
      <h2 style={{ fontFamily: F.serif, fontSize: "clamp(26px, 3.4vw, 34px)", color: C.greenDark, lineHeight: 1.2, margin: "0 0 24px", letterSpacing: "-0.005em" }}>
        {pathway && pathway.length > 0 ? `${pathway.length} programs to start` : loading ? "Reading the land…" : "Nothing yet"}
      </h2>

      {loading && <FarmLoader kind="pathway" />}
      {error && <div style={{ padding: 16, background: "#FEE", border: `1px solid ${C.red}`, borderRadius: 6, color: C.red, marginBottom: 20 }}>Couldn't run: {error}</div>}
      {pathway && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pathway.map((p, i) => (
            <div key={p.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "0.1em" }}>{i + 1}.</span>
                <a href={p.website || "#"} target="_blank" rel="noreferrer" style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark, textDecoration: "none", borderBottom: `2px solid ${C.gold}` }}>{p.name}</a>
                <span style={{ fontSize: 12, color: C.muted }}>{p.category} · {(p.province || []).join(", ")}</span>
              </div>
              {p.description && <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginTop: 8 }}>{p.description}</div>}
              {p.why && <div style={{ fontSize: 13, color: C.gold, fontStyle: "italic", marginTop: 8 }}>Why: {p.why}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/navigator" target="_blank" rel="noreferrer" style={{ padding: "10px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none" }}>Go deeper on the live site ↗</a>
        <button onClick={() => setView("sandbox")} style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>Shape what Trellis could do for you →</button>
        <button onClick={() => setView("feedback")} style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer" }}>Tell me what's off →</button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: C.greenDark, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: { key: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, background: "#fff" }}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface SummaryResult {
  summary: string;
  facts: {
    stage: string | null;
    provinces: string[];
    sector: string | null;
    primary_need: string | null;
    description: string | null;
  };
}

function WrapUpCard({ identity, onProfileUpdated }: { identity: Identity; onProfileUpdated: (p: FounderProfile) => void }) {
  const profile = identity.founder_profile || {};
  const lastSummary = (profile as any).last_summary_text as string | undefined;
  const lastSummaryAt = (profile as any).last_summary_at as string | undefined;

  const [mode, setMode] = useState<"saved" | "empty" | "generating" | "review">(
    lastSummary ? "saved" : "empty"
  );
  const [freeText, setFreeText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setError(null);
    setMode("generating");
    try {
      const r = await fetch("/api/portal/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org: identity.org, person: identity.person, freeText: freeText.trim() }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setResult({ summary: data.summary, facts: data.facts });
      setMode("review");
    } catch (e: any) {
      setError(e.message || "Could not generate a summary right now.");
      setMode(lastSummary ? "saved" : "empty");
    }
  }

  async function confirm() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...result.facts,
        last_summary_text: result.summary,
        source: "wrap-up",
      };
      const r = await fetch("/api/portal/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org: identity.org, person: identity.person, profile: payload }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      onProfileUpdated(data.profile);
      setResult(null);
      setFreeText("");
      setMode("saved");
    } catch (e: any) {
      setError(e.message || "Could not save just now.");
    } finally {
      setSaving(false);
    }
  }

  function updateResultFact<K extends keyof SummaryResult["facts"]>(key: K, value: SummaryResult["facts"][K]) {
    if (!result) return;
    setResult({ ...result, facts: { ...result.facts, [key]: value } });
  }

  const accentStyle = { fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase" as const };

  if (mode === "saved") {
    return (
      <div style={{ marginTop: 32, padding: "22px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 6, maxWidth: 760 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={accentStyle}>Last time, this is where I had you</div>
            <p style={{ fontFamily: F.serif, fontSize: 17, color: C.greenDark, lineHeight: 1.5, margin: "10px 0 0" }}>{lastSummary}</p>
            {lastSummaryAt && (
              <div style={{ fontSize: 12, color: C.soft, marginTop: 8 }}>
                Captured {new Date(lastSummaryAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { setMode("empty"); setFreeText(""); setResult(null); }} style={{ padding: "8px 14px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
            Update this →
          </button>
          <div style={{ fontSize: 12, color: C.soft, alignSelf: "center" }}>or scroll down and keep poking.</div>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
      </div>
    );
  }

  if (mode === "generating") {
    return (
      <div style={{ marginTop: 32, padding: "22px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 6, maxWidth: 760 }}>
        <div style={accentStyle}>Thinking</div>
        <p style={{ fontFamily: F.serif, fontSize: 17, color: C.greenDark, lineHeight: 1.5, margin: "10px 0 0", fontStyle: "italic" }}>Reading your portal activity and writing what I think I see.</p>
      </div>
    );
  }

  if (mode === "review" && result) {
    return (
      <div style={{ marginTop: 32, padding: "22px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 6, maxWidth: 760 }}>
        <div style={accentStyle}>Here is what I got. Edit or confirm.</div>
        <textarea
          value={result.summary}
          onChange={(e) => setResult({ ...result, summary: e.target.value })}
          rows={4}
          style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, marginTop: 10, boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 12 }}>
          <FactField label="Stage" value={result.facts.stage || ""} onChange={(v) => updateResultFact("stage", v || null)} placeholder="MVP, Pilot, Comm, Scale" />
          <FactField label="Provinces" value={(result.facts.provinces || []).join(", ")} onChange={(v) => updateResultFact("provinces", v.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="ON, SK" />
          <FactField label="Sector" value={result.facts.sector || ""} onChange={(v) => updateResultFact("sector", v || null)} placeholder="Precision ag / soil" />
          <FactField label="Primary need" value={result.facts.primary_need || ""} onChange={(v) => updateResultFact("primary_need", v || null)} placeholder="Pilot site intros" />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={confirm} disabled={saving} style={{ padding: "9px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button onClick={generate} disabled={saving} style={{ padding: "9px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, cursor: saving ? "default" : "pointer" }}>
            Redo
          </button>
          <button onClick={() => { setMode(lastSummary ? "saved" : "empty"); setResult(null); }} disabled={saving} style={{ padding: "9px 14px", background: "transparent", color: C.muted, fontFamily: F.sans, fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, cursor: saving ? "default" : "pointer" }}>
            Cancel
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
      </div>
    );
  }

  // Empty state
  return (
    <div style={{ marginTop: 32, padding: "22px 24px", background: C.cardBg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 6, maxWidth: 760 }}>
      <div style={accentStyle}>Wrap this up</div>
      <p style={{ fontFamily: F.serif, fontSize: 17, color: C.greenDark, lineHeight: 1.5, margin: "10px 0 0" }}>
        Before you leave, let me summarize what I learned about you. You edit or confirm, and I remember it for next time.
      </p>
      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder="Optional. Anything specific you want me to capture? Where you are stuck, what you are looking for, what I probably missed."
        rows={2}
        style={{ width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, marginTop: 14, boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={generate} style={{ padding: "9px 18px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>
          Wrap this up →
        </button>
        <span style={{ fontSize: 12, color: C.soft }}>Takes about ten seconds.</span>
      </div>
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

function FactField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 5, boxSizing: "border-box" }}
      />
    </div>
  );
}

function HomeView({ identity, team, you, setView, onProfileUpdated }: { identity: Identity; team: TeamRow[]; you: YouSummary | null; setView: (v: View) => void; onProfileUpdated: (p: FounderProfile) => void }) {
  const firstName = identity.display_name.split(" ")[0];
  const lastVisit = you?.last_visit ? new Date(you.last_visit) : null;
  const welcomeBack = lastVisit
    ? `Welcome back. Last time you were here: ${lastVisit.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}.`
    : null;

  const eyebrow = identity.home_eyebrow || "Welcome";
  const subheading = identity.home_subheading || welcomeBack;
  const heroCallout = identity.home_hero_callout;
  const order = identity.card_order && identity.card_order.length > 0
    ? identity.card_order
    : ["programs", "sandbox", "priority", "feedback"];
  const cards = order.map((k) => CARDS[k]).filter(Boolean);

  return (
    <div className="portal-page" style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>{eyebrow}</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(40px, 6vw, 64px)", color: C.greenDark, lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
        {firstName}, this is yours.
      </h1>
      {subheading && (
        <p style={{ fontFamily: F.serif, fontSize: "clamp(18px, 2vw, 22px)", color: C.muted, fontStyle: "italic", lineHeight: 1.55, margin: "20px 0 0", maxWidth: 680 }}>
          {subheading}
        </p>
      )}

      {heroCallout && (
        <div style={{ marginTop: 32, padding: "18px 22px", background: C.bgWarm, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, maxWidth: 720 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 8 }}>Why you're here</div>
          <div style={{ fontFamily: F.serif, fontSize: 17, color: C.greenDark, lineHeight: 1.5 }}>{heroCallout}</div>
        </div>
      )}

      {identity.portal_type !== "operator" && (
        <WrapUpCard identity={identity} onProfileUpdated={onProfileUpdated} />
      )}

      <PathwayChecklist identity={identity} setView={setView} />

      <div style={{ height: 1, background: C.hairline, margin: "56px 0 28px" }} />
      <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>Or jump straight in</div>

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
        <a href="/for/bioenterprise" target="_blank" rel="noreferrer" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>About this tool ↗</a>
        <a href="/demo" target="_blank" rel="noreferrer" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>The walkthrough ↗</a>
        <a href="/navigator" target="_blank" rel="noreferrer" style={{ padding: "10px 18px", background: "transparent", color: C.greenDark, fontFamily: F.sans, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", border: `1px solid ${C.border}` }}>The live tool ↗</a>
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
    <div className="portal-page" style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Audit</div>
      <h1 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4.5vw, 44px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>Your programs in Trellis</h1>
      <p style={{ fontFamily: F.sans, fontSize: 16, color: C.muted, lineHeight: 1.6, margin: "20px 0 32px", maxWidth: 640 }}>
        These are the entries that mention BioEnterprise directly (gold border) or show up through partnership (grey border). If any detail is wrong, flag it and I'll fix within 24 hours.
      </p>

      {error && <div style={{ padding: 16, background: "#FEE", border: `1px solid ${C.red}`, borderRadius: 6, color: C.red }}>Couldn't load: {error}</div>}
      {!programs && !error && <div style={{ padding: "12px 0" }}><FarmLoader kind="generic" inline compact /></div>}

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
    <div className="portal-page" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 28px 80px" }}>
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
    <div className="portal-page" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 28px 80px" }}>
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
    <div className="portal-page" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 28px 80px" }}>
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
          <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark, marginBottom: 14 }}>Claude is drawing up three takes.</div>
          <FarmLoader kind="sandbox" />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 14 }}>Usually 20-40 seconds for three variants.</div>
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

type TourStep = { title: string; body: string; art: string };

function buildPartnerTourSteps(identity: Identity): TourStep[] {
  return [
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
}

function buildAdvisorTourSteps(identity: Identity): TourStep[] {
  const first = identity.display_name.split(" ")[0];
  return [
    {
      title: `Hey ${first}. You are here to break things.`,
      body: "Trellis is a navigation layer for Canadian agtech. 500+ programs, a wizard that builds pathways for founders, a gap map for operators. You are not a customer. You are the person I trust to tell me what is wrong with it before a real user does.",
      art: "welcome",
    },
    {
      title: "The short version of what it does.",
      body: "Founders answer four questions and get a personalized pathway. Operators (accelerators, investors) see where the ecosystem is thin. Everything you see in the main app is live and in front of real people. This portal is the backstage.",
      art: "cards",
    },
    {
      title: "Five views in this portal.",
      body: "Home is this screen. Your programs is where you audit the program cards tied to your world. Priority is where you pin the ones you care about most. Feedback is a running thread where you tell me what feels off. The fifth one gets its own step.",
      art: "cards",
    },
    {
      title: "Sandbox is the one to try first.",
      body: "Type a feature you wish Trellis did. Claude designs three takes on it in the Trellis visual style, in about 30 seconds. Pick the closest one. It lands on a roadmap the rest of the circle can riff on. Go do this before anything else. Seriously.",
      art: "sandbox",
    },
    {
      title: "Rip it apart. That is the whole job.",
      body: "No hedging, no politeness tax. If copy reads weird, say so. If a flow feels slow, flag it. If a feature is obviously missing, tell me. Your first instincts are the signal I cannot get anywhere else. Okay, go.",
      art: "end",
    },
  ];
}

function GuidedTour({ identity, orgConfig, onDone, onJumpToSandbox }: { identity: Identity; orgConfig: OrgConfig; onDone: () => void; onJumpToSandbox: () => void }) {
  const [step, setStep] = useState(0);

  const steps: TourStep[] = orgConfig.tour_variant === "advisor"
    ? buildAdvisorTourSteps(identity)
    : buildPartnerTourSteps(identity);

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,67,50,0.85)", zIndex: 100, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: 24, fontFamily: F.sans }}>
      <div style={{ minHeight: "calc(100vh - 48px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640, background: C.bg, borderRadius: 12, overflow: "hidden", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)", position: "relative" }}>
        <button onClick={onDone} aria-label="Close tour" style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: C.muted, fontSize: 28, cursor: "pointer", padding: 0, width: 36, height: 36, lineHeight: 1, zIndex: 1 }}>×</button>
        <div className="tour-card-pad-top" style={{ padding: "40px 40px 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 16 }}>Guided tour · {step + 1} of {steps.length}</div>
          <h2 style={{ fontFamily: F.serif, fontSize: "clamp(26px, 3.4vw, 36px)", color: C.greenDark, lineHeight: 1.15, margin: 0, letterSpacing: "-0.005em" }}>{s.title}</h2>
          <p style={{ fontSize: 15.5, color: C.text, lineHeight: 1.7, margin: "18px 0 0" }}>{s.body}</p>
        </div>
        {s.art === "sandbox" && (
          <div className="tour-section-pad" style={{ padding: "0 40px" }}>
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
          <div className="tour-section-pad" style={{ padding: "0 40px" }}>
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.greenDark }}>CropMind, NB precision agtech</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Actual path vs Trellis-suggested</div>
                </div>
                <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: C.bgWarm, color: C.greenDark, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Real company</div>
              </div>
              <div className="tour-cropmind-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
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
        <div className="tour-buttons-pad" style={{ padding: "24px 40px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
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
  const [orgConfig, setOrgConfig] = useState<OrgConfig | null>(null);
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [you, setYou] = useState<YouSummary | null>(null);
  const [view, setViewState] = useState<View>("home");
  const [notFound, setNotFound] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!org) return;
    try { if (localStorage.getItem(AUTH_KEY(org)) === "1") setAuthed(true); } catch {}
  }, [org]);

  const onPass = () => setAuthed(true);

  useEffect(() => {
    if (!authed || !org || !person) return;
    fetch(`/api/portal/me?org=${org}&person=${person}`)
      .then(async (r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        setIdentity(d.identity);
        setOrgConfig(d.orgConfig || null);
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
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Dynamic favicon tinted with the org's theme color so every portal tab looks visibly different.
  useEffect(() => {
    const color = orgConfig?.theme_color || "#1B4332";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${color}"/><path d="M10 22V10M16 22V10M22 22V10M7 18h18M7 12h18" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]'));
    const prev = iconLinks.map((l) => ({ link: l, href: l.href }));
    iconLinks.forEach((l) => { l.href = dataUrl; });
    return () => {
      prev.forEach(({ link, href }) => { link.href = href; });
    };
  }, [orgConfig?.theme_color]);

  if (!authed) return <PasswordGate org={org} onPass={onPass} />;

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
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F.sans, padding: "140px 28px", textAlign: "center" }}>
        <FarmLoader kind="generic" />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {orgConfig && <PortalBanner orgConfig={orgConfig} />}
      <Header identity={identity} view={view} setView={setView} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 28px 0", display: "flex", justifyContent: "flex-end" }}>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 20px", background: C.goldDeep, color: "#fff",
            fontFamily: F.sans, fontSize: 14.5, fontWeight: 700,
            letterSpacing: "0.01em",
            borderRadius: 8, textDecoration: "none",
            boxShadow: "0 8px 20px -8px rgba(212,168,40,0.55)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 28px -10px rgba(212,168,40,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "none";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 20px -8px rgba(212,168,40,0.55)";
          }}
        >
          Visit live site <span style={{ fontSize: 16 }}>↗</span>
        </a>
      </div>
      {view === "home" && (identity.portal_type === "founder"
        ? <FounderHome identity={identity} setView={setView} />
        : <HomeView identity={identity} team={team} you={you} setView={setView} onProfileUpdated={(p) => setIdentity({ ...identity, founder_profile: p })} />
      )}
      {view === "programs" && <ProgramsView identity={identity} />}
      {view === "feedback" && <FeedbackView identity={identity} />}
      {view === "priority" && <PriorityView identity={identity} />}
      {view === "sandbox" && <SandboxView identity={identity} />}
      {showTour && orgConfig && <GuidedTour identity={identity} orgConfig={orgConfig} onDone={endTour} onJumpToSandbox={() => setView("sandbox")} />}
    </div>
  );
}
