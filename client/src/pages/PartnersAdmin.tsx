import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";

const C = {
  green: "#2D5A3D",
  greenDark: "#1B4332",
  gold: "#C4A052",
  bg: "#FAFAF7",
  bgWarm: "#F5F0E8",
  text: "#1A1A1A",
  muted: "#6B7C6B",
  soft: "#8B8A82",
  cardBg: "#fff",
  border: "#E8E5E0",
  red: "#C04A3D",
};
const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const AUTH_KEY = "trellis-admin-secret-v1";

interface OrgSummary {
  slug: string;
  display_name: string;
  theme_color: string;
  banner_text: string | null;
  tour_variant: string;
  people_count: string | number;
  people_active: string | number;
  views_total: string | number;
  views_7d: string | number;
  feedback_count: string | number;
  feature_count: string | number;
  priority_count: string | number;
  last_activity: string | null;
}

interface SummaryData {
  orgs: OrgSummary[];
  totals: {
    orgs: number;
    people: number;
    people_active: number;
    views_total: number;
    views_7d: number;
    feedback: number;
    features: number;
    priorities: number;
  };
  recentActivity: Array<{
    org: string;
    person: string;
    display_name: string;
    event_type: string;
    path: string | null;
    created_at: string;
    org_name: string;
    theme_color: string;
  }>;
  recentFeedback: Array<{
    id: number;
    org: string;
    person: string;
    display_name: string;
    topic: string;
    body: string;
    created_at: string;
    org_name: string;
    theme_color: string;
  }>;
}

function PasswordForm({ value, onChange, onSubmit, error }: { value: string; onChange: (v: string) => void; onSubmit: () => void; error: string | null }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        style={{ width: 380, padding: "40px 32px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}
      >
        <div style={{ fontFamily: F.serif, fontSize: 26, color: C.greenDark, marginBottom: 8 }}>Admin</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
          Paste the value of your <code style={{ background: C.bgWarm, padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>ADMIN_SECRET</code> env var.
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste secret value"
          style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
        />
        <button type="submit" style={{ width: "100%", padding: 12, background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 15, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>Enter</button>
        {error && <div style={{ fontSize: 13, color: C.red, marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
}

function AdminNav({ orgs, currentOrg, onLogout }: { orgs: OrgSummary[]; currentOrg: string | null; onLogout: () => void }) {
  return (
    <header style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}`, padding: "16px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: C.greenDark, letterSpacing: "-0.005em" }}>Admin</div>
          <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Link
              href="/admin/partners"
              style={{
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: currentOrg === null ? 700 : 500,
                color: currentOrg === null ? C.greenDark : C.muted,
                background: currentOrg === null ? C.bgWarm : "transparent",
                borderRadius: 6,
                textDecoration: "none",
                border: "none",
                fontFamily: F.sans,
              }}
            >
              Overview
            </Link>
            {orgs.map((o) => {
              const active = currentOrg === o.slug;
              return (
                <Link
                  key={o.slug}
                  href={`/admin/partners/${o.slug}`}
                  style={{
                    padding: "7px 14px",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#fff" : C.muted,
                    background: active ? o.theme_color : "transparent",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontFamily: F.sans,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#fff" : o.theme_color, opacity: active ? 0.6 : 1 }} />
                  {o.display_name}
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={onLogout} style={{ padding: "7px 14px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: F.sans }}>Log out</button>
      </div>
    </header>
  );
}

function StatTile({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 34, color: C.greenDark, marginTop: 6, lineHeight: 1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: C.soft, marginTop: 6 }}>{sublabel}</div>}
    </div>
  );
}

function OverviewView({ data }: { data: SummaryData }) {
  const { orgs, totals, recentActivity, recentFeedback } = data;
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px 80px" }}>
      <div style={{ fontFamily: F.serif, fontSize: 30, color: C.greenDark, marginBottom: 6 }}>All portals</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>
        {totals.orgs} active org{totals.orgs === 1 ? "" : "s"}. {totals.people_active} of {totals.people} people have visited at least once.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 36 }}>
        <StatTile label="People" value={totals.people} sublabel={`${totals.people_active} active`} />
        <StatTile label="Views 7d" value={totals.views_7d} sublabel={`${totals.views_total} total`} />
        <StatTile label="Feedback" value={totals.feedback} />
        <StatTile label="Feature ideas" value={totals.features} />
        <StatTile label="Pins" value={totals.priorities} />
      </div>

      <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Portals</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 36 }}>
        {orgs.map((o) => (
          <Link
            key={o.slug}
            href={`/admin/partners/${o.slug}`}
            style={{ display: "block", textDecoration: "none", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: o.theme_color }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, marginTop: 2 }}>
              <div style={{ fontFamily: F.serif, fontSize: 19, color: C.greenDark }}>{o.display_name}</div>
              <div style={{ fontSize: 11, color: C.soft, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{o.tour_variant}</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>/for/{o.slug}/*</div>
            <div style={{ display: "flex", gap: 14, fontSize: 13, color: C.text, flexWrap: "wrap" }}>
              <span><b>{o.people_active}</b>/<span style={{ color: C.soft }}>{o.people_count}</span> active</span>
              <span><b>{o.views_7d}</b> views 7d</span>
              <span><b>{o.feedback_count}</b> feedback</span>
              <span><b>{o.feature_count}</b> ideas</span>
            </div>
            <div style={{ fontSize: 11, color: C.soft, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span>{o.last_activity ? `Last activity: ${new Date(o.last_activity).toLocaleString()}` : "No activity yet"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`/for/${o.slug}/justyn`, "_blank", "noopener,noreferrer"); }}
                style={{ fontSize: 11, color: o.theme_color, fontWeight: 700, background: "transparent", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap", fontFamily: F.sans }}
              >
                Preview as you ↗
              </button>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Recent activity</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 520, overflow: "auto" }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: 20, fontSize: 13, color: C.soft }}>Nothing yet.</div>
            ) : recentActivity.map((a, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.theme_color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: C.greenDark, whiteSpace: "nowrap" }}>{a.display_name || a.person}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{a.org_name}</span>
                  <span style={{ color: C.soft, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.path || ""}</span>
                </div>
                <span style={{ color: C.soft, fontSize: 11, whiteSpace: "nowrap" }}>{new Date(a.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Recent feedback</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 520, overflow: "auto" }}>
            {recentFeedback.length === 0 ? (
              <div style={{ padding: 20, fontSize: 13, color: C.soft }}>No feedback yet.</div>
            ) : recentFeedback.map((f) => (
              <div key={f.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.theme_color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: C.greenDark, fontSize: 12 }}>{f.display_name || f.person}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{f.org_name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>{f.topic}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{f.body}</div>
                <div style={{ fontSize: 11, color: C.soft, marginTop: 4 }}>{new Date(f.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgDetailView({ org, data }: { org: string; data: any }) {
  const { people, activity, feedback, features, priorities } = data;

  const byPerson: Record<string, any[]> = {};
  (people || []).forEach((p: any) => { byPerson[p.person] = []; });
  (activity || []).forEach((a: any) => {
    if (!byPerson[a.person]) byPerson[a.person] = [];
    byPerson[a.person].push(a);
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px 80px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: F.serif, fontSize: 30, color: C.greenDark, letterSpacing: "-0.005em" }}>Partner engagement · {org}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{people.length} people · {activity.length} events logged (last 300)</div>
        </div>
        <a
          href={`/for/${org}/justyn`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "9px 16px", background: C.greenDark, color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: 6, textDecoration: "none", fontFamily: F.sans, whiteSpace: "nowrap" }}
        >
          Preview as you ↗
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>People</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {people.map((p: any) => {
              const myActivity = byPerson[p.person] || [];
              const views = myActivity.filter((a) => a.event_type === "view").length;
              return (
                <div key={p.person} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px" }}>
                  <div style={{ fontFamily: F.serif, fontSize: 18, color: C.greenDark }}>{p.display_name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{p.role || "-"}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                    <span><b style={{ color: C.text }}>{views}</b> views</span>
                    <span>URL: /for/{org}/{p.person}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.soft, marginTop: 8 }}>
                    {p.first_seen_at ? `First: ${new Date(p.first_seen_at).toLocaleString()}` : "Not in yet"}
                    {p.last_seen_at && ` · Last: ${new Date(p.last_seen_at).toLocaleString()}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Activity timeline (last 300)</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 600, overflow: "auto" }}>
            {activity.length === 0 ? <div style={{ padding: 20, fontSize: 13, color: C.soft }}>No activity yet.</div> : activity.map((a: any, i: number) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: C.greenDark, minWidth: 80 }}>{a.person}</span>
                  <span style={{ color: C.muted }}>{a.event_type}</span>
                  <span style={{ color: C.soft, fontSize: 11 }}>{a.path || ""}</span>
                </div>
                <span style={{ color: C.soft, fontSize: 11 }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Feedback ({feedback.length})</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 600, overflow: "auto" }}>
            {feedback.length === 0 ? <div style={{ padding: 20, fontSize: 13, color: C.soft }}>No feedback yet.</div> : feedback.map((f: any) => (
              <div key={f.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>{f.person}</span>
                  <span style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>{f.topic}</span>
                </div>
                <div style={{ fontSize: 14, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{f.body}</div>
                <div style={{ fontSize: 11, color: C.soft, marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span>{new Date(f.created_at).toLocaleString()}</span>
                  {f.page_path && <span style={{ fontFamily: "monospace", color: C.muted }}>on {f.page_path}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Feature requests ({features.length})</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 400, overflow: "auto" }}>
            {features.length === 0 ? <div style={{ padding: 20, fontSize: 13, color: C.soft }}>No requests yet.</div> : features.map((f: any) => (
              <div key={f.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark }}>{f.person}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: f.status === "endorsed" ? "#E7F2E7" : "#F5F0E8", borderRadius: 10, fontWeight: 600, color: C.muted }}>{f.status}</span>
                </div>
                <div style={{ fontSize: 14, color: C.text, fontStyle: "italic" }}>"{f.prompt}"</div>
                <div style={{ fontSize: 11, color: C.soft, marginTop: 4 }}>{new Date(f.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: C.gold, textTransform: "uppercase", marginBottom: 12 }}>Pinned programs ({priorities.length})</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 400, overflow: "auto" }}>
            {priorities.length === 0 ? <div style={{ padding: 20, fontSize: 13, color: C.soft }}>No priorities pinned yet.</div> : priorities.map((p: any, i: number) => (
              <div key={i} style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span><b style={{ color: C.greenDark }}>{p.person}</b> pinned <b>{p.name}</b></span>
                  <span style={{ fontSize: 11, color: C.soft }}>{new Date(p.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.category} · {(p.province || []).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnersAdmin() {
  const [matchOrg, orgParams] = useRoute<{ org: string }>("/admin/partners/:org");
  const [matchOverview] = useRoute("/admin/partners");
  const [, setLocation] = useLocation();
  const org = matchOrg ? orgParams?.org || "" : "";

  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [orgData, setOrgData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) { setSecret(stored); setAuthed(true); }
  }, []);

  // Always fetch the summary when authed so the nav has the full org list.
  useEffect(() => {
    if (!authed || !secret) return;
    fetch("/api/admin/partners-summary", { headers: { Authorization: `Bearer ${secret}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Wrong secret" : `Error ${r.status}`);
        return r.json();
      })
      .then((d) => { setSummary(d); setError(null); })
      .catch((e) => {
        setError(e.message);
        setAuthed(false);
        setSummary(null);
        localStorage.removeItem(AUTH_KEY);
      });
  }, [authed, secret]);

  // Fetch org-specific data when viewing an org.
  useEffect(() => {
    if (!authed || !secret || !org) { setOrgData(null); return; }
    setLoading(true);
    fetch(`/api/admin/partners?org=${org}`, { headers: { Authorization: `Bearer ${secret}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Wrong secret" : `Error ${r.status}`);
        return r.json();
      })
      .then((d) => { setOrgData(d); setLoading(false); setError(null); })
      .catch((e) => {
        setError(e.message);
        setAuthed(false);
        setOrgData(null);
        setLoading(false);
        localStorage.removeItem(AUTH_KEY);
      });
  }, [authed, secret, org]);

  useEffect(() => {
    document.title = org ? `Admin: ${org}` : "Admin: All portals";
    const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]'));
    const prev = iconLinks.map((l) => ({ link: l, href: l.href }));
    iconLinks.forEach((l) => { l.href = "/brand/trellis-favicon-portal.svg?v=1"; });
    return () => { prev.forEach(({ link, href }) => { link.href = href; }); };
  }, [org]);

  function submitAuth() {
    localStorage.setItem(AUTH_KEY, secret);
    setAuthed(true);
    setError(null);
  }
  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setSummary(null);
    setOrgData(null);
    setSecret("");
    setError(null);
    setLocation("/admin/partners");
  }

  if (!matchOrg && !matchOverview) return null;

  if (!authed) {
    return <PasswordForm value={secret} onChange={setSecret} onSubmit={submitAuth} error={error} />;
  }

  if (!summary) {
    return <div style={{ padding: 40, fontFamily: F.sans, color: C.muted }}>Loading…</div>;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F.sans, color: C.text, paddingBottom: 40 }}>
      <AdminNav orgs={summary.orgs} currentOrg={org || null} onLogout={logout} />

      {!org && <OverviewView data={summary} />}
      {org && loading && <div style={{ padding: 40, fontFamily: F.sans, color: C.muted }}>Loading {org}…</div>}
      {org && !loading && orgData && <OrgDetailView org={org} data={orgData} />}
      {org && !loading && !orgData && (
        <div style={{ padding: 40, fontFamily: F.sans, color: C.muted }}>
          {error || `No data for ${org}`}
        </div>
      )}
    </div>
  );
}
