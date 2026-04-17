import { useEffect, useState } from "react";
import { useRoute } from "wouter";

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

export default function PartnersAdmin() {
  const [, params] = useRoute("/admin/partners/:org");
  const org = params?.org || "";
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) { setSecret(stored); setAuthed(true); }
  }, []);

  useEffect(() => {
    if (!authed || !secret || !org) return;
    setLoading(true);
    fetch(`/api/admin/partners?org=${org}`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
      .then(async (r) => {
        if (!r.ok) { throw new Error(r.status === 401 ? "Wrong secret" : `Error ${r.status}`); }
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); setError(null); })
      .catch((e) => {
        setError(e.message);
        setAuthed(false);
        setData(null);
        setLoading(false);
        localStorage.removeItem(AUTH_KEY);
      });
  }, [authed, secret, org]);

  useEffect(() => { document.title = `Admin: ${org}`; }, [org]);

  function resetAuth() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setData(null);
    setSecret("");
    setError(null);
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
        <form onSubmit={(e) => { e.preventDefault(); localStorage.setItem(AUTH_KEY, secret); setAuthed(true); setError(null); }} style={{ width: 380, padding: "40px 32px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <div style={{ fontFamily: F.serif, fontSize: 26, color: C.greenDark, marginBottom: 8 }}>Admin · {org}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>Paste the value of your <code style={{ background: C.bgWarm, padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>ADMIN_SECRET</code> env var.</div>
          <input type="password" autoFocus value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Paste secret value" style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: F.sans, border: `1px solid ${error ? C.red : C.border}`, borderRadius: 6, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <button type="submit" style={{ width: "100%", padding: 12, background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 15, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>Enter</button>
          {error && <div style={{ fontSize: 13, color: C.red, marginTop: 12 }}>{error}</div>}
        </form>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, fontFamily: F.sans, color: C.muted }}>Loading…</div>;

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: F.serif, fontSize: 24, color: C.greenDark }}>Something went sideways.</div>
        <div style={{ fontSize: 14, color: C.muted }}>{error || "No data returned."}</div>
        <button onClick={resetAuth} style={{ padding: "10px 20px", background: C.greenDark, color: "#fff", fontFamily: F.sans, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer" }}>Reset and try again</button>
      </div>
    );
  }

  const { people, activity, feedback, features, priorities } = data;

  // Group activity by person and date
  const byPerson: Record<string, any[]> = {};
  (people || []).forEach((p: any) => { byPerson[p.person] = []; });
  (activity || []).forEach((a: any) => {
    if (!byPerson[a.person]) byPerson[a.person] = [];
    byPerson[a.person].push(a);
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F.sans, color: C.text, paddingBottom: 80 }}>
      <header style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 28, color: C.greenDark, letterSpacing: "-0.005em" }}>Partner engagement · {org}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{people.length} people · {activity.length} events logged (last 300)</div>
          </div>
          <button onClick={() => { localStorage.removeItem(AUTH_KEY); setAuthed(false); }} style={{ padding: "8px 14px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Log out</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
                <div style={{ fontSize: 11, color: C.soft, marginTop: 6 }}>{new Date(f.created_at).toLocaleString()}</div>
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
