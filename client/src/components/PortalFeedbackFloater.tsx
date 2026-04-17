import { useEffect, useState } from "react";

const C = {
  greenDark: "#1B4332",
  gold: "#C4A052",
  goldDeep: "#D4A828",
  bg: "#FAFAF7",
  bgWarm: "#F5F0E8",
  muted: "#6B7C6B",
  border: "#E8E5E0",
  cardBg: "#fff",
  text: "#1A1A1A",
  soft: "#8B8A82",
  green: "#2D5A3D",
};
const F = {
  sans: "'DM Sans', system-ui, sans-serif",
};

const TOPIC_KEY = "trellis-floater-topic-v1";
const IDENTITY_KEY = "trellis-portal-identity-v1";
const SESSION_DISMISSED_KEY = "trellis-floater-dismissed-session-v1";

// Floating feedback widget. Once a user has visited their partner portal and
// we have their identity cached in localStorage, this shows on every non-portal
// Trellis page (demo, navigator, home). Pinned top-right, auto-opens on each
// session, can be dismissed per-session. Posts stay private to them + Justyn.
export default function PortalFeedbackFloater() {
  const [identity, setIdentity] = useState<{ org: string; person: string; display_name: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [topic, setTopic] = useState<string>("General");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      if (raw) setIdentity(JSON.parse(raw));
      const prevTopic = localStorage.getItem(TOPIC_KEY);
      if (prevTopic) setTopic(prevTopic);
      // Session dismissal lives in sessionStorage so it resets every new tab/visit.
      const wasDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
      setDismissed(wasDismissed);
      if (!wasDismissed) setOpen(true);
    } catch {}
  }, []);

  async function submit() {
    if (!identity || body.trim().length < 4) return;
    setSending(true);
    try {
      await fetch("/api/portal/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org: identity.org,
          person: identity.person,
          topic,
          body,
          visibility: "private",
          page_path: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        }),
      });
      setSent(true);
      setBody("");
      setTimeout(() => {
        setSent(false);
        // Collapse back to the pill once the "noted" beat plays
        setOpen(false);
      }, 2000);
      try { localStorage.setItem(TOPIC_KEY, topic); } catch {}
    } finally {
      setSending(false);
    }
  }

  function dismiss() {
    setOpen(false);
    setDismissed(true);
    try { sessionStorage.setItem(SESSION_DISMISSED_KEY, "1"); } catch {}
  }

  function reopen() {
    setOpen(true);
    setDismissed(false);
    try { sessionStorage.removeItem(SESSION_DISMISSED_KEY); } catch {}
  }

  if (!identity) return null;

  const firstName = identity.display_name.split(" ")[0];

  // Collapsed state: a personalized green pill in the top-right. Below page header.
  if (dismissed || !open) {
    return (
      <button
        onClick={reopen}
        aria-label="Open feedback panel"
        style={{
          position: "fixed", top: 96, right: 24, zIndex: 60,
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          background: C.greenDark, color: "#fff",
          fontFamily: F.sans, fontSize: 13.5, fontWeight: 600,
          border: "none", borderRadius: 999,
          boxShadow: "0 10px 24px -10px rgba(27,67,50,0.5)",
          cursor: "pointer",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.goldDeep }} />
        {firstName}, flag something →
      </button>
    );
  }

  // Expanded panel: fixed top-right, offset below the page header so it never hides under a sticky nav.
  return (
    <div
      role="complementary"
      aria-label="Portal feedback"
      style={{
        position: "fixed", top: 96, right: 24, zIndex: 60,
        width: 360, maxHeight: "calc(100vh - 112px)", overflow: "auto",
        background: C.cardBg,
        border: `1.5px solid ${C.gold}`, borderRadius: 12,
        boxShadow: "0 24px 56px -16px rgba(27,67,50,0.35)",
        fontFamily: F.sans,
      }}
    >
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(135deg, #F5E9C7 0%, #FAFAF7 100%)", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, color: C.goldDeep, textTransform: "uppercase" }}>
            {identity.display_name.split(" ")[0]}, this is your feedback channel
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3, lineHeight: 1.45 }}>Anything you flag from here stays private to you + Justyn. Use it to drive direction.</div>
        </div>
        <button onClick={dismiss} aria-label="Close" style={{ flexShrink: 0, background: "transparent", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", padding: 0, width: 28, height: 28, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: 16 }}>
        {sent ? (
          <div style={{ fontSize: 14, color: C.green, padding: "14px 0", textAlign: "center", fontWeight: 600 }}>
            Noted. Thanks, {identity.display_name.split(" ")[0]}.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {["Gap Map", "Wizard", "AI Analysis", "General"].map((t) => (
                <button key={t} onClick={() => setTopic(t)} style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  background: topic === t ? C.greenDark : "transparent",
                  color: topic === t ? "#fff" : C.muted,
                  border: `1px solid ${topic === t ? C.greenDark : C.border}`,
                  borderRadius: 12, cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="What did you notice on this page?"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: F.sans, border: `1px solid ${C.border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical", marginBottom: 10 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: C.soft }}>Signed in as <strong>{identity.display_name}</strong></div>
              <button onClick={submit} disabled={body.trim().length < 4 || sending} style={{
                padding: "8px 14px", background: C.greenDark, color: "#fff",
                fontFamily: F.sans, fontSize: 13, fontWeight: 600,
                border: "none", borderRadius: 6,
                cursor: body.trim().length >= 4 ? "pointer" : "not-allowed",
                opacity: body.trim().length >= 4 ? 1 : 0.5,
              }}>{sending ? "Sending…" : "Send"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
