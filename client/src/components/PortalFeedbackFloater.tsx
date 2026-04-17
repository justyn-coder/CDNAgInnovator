import { useEffect, useState } from "react";

const C = {
  greenDark: "#1B4332",
  gold: "#C4A052",
  bg: "#FAFAF7",
  muted: "#6B7C6B",
  border: "#E8E5E0",
  cardBg: "#fff",
  text: "#1A1A1A",
  soft: "#8B8A82",
  green: "#2D5A3D",
};
const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const TOPIC_KEY = "trellis-floater-topic-v1";
const IDENTITY_KEY = "trellis-portal-identity-v1";

// Detects if a user is an authenticated partner-portal user. We store their
// org+person in localStorage on portal visit so we can recognize them on
// non-portal Trellis pages (demo, navigator, gap map) and offer a persistent
// feedback widget.
export default function PortalFeedbackFloater() {
  const [identity, setIdentity] = useState<{ org: string; person: string; display_name: string } | null>(null);
  const [open, setOpen] = useState(false);
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
        }),
      });
      setSent(true);
      setBody("");
      setTimeout(() => setSent(false), 3500);
      try { localStorage.setItem(TOPIC_KEY, topic); } catch {}
    } finally {
      setSending(false);
    }
  }

  if (!identity) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open portal feedback"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 60,
            padding: "12px 18px", display: "flex", alignItems: "center", gap: 10,
            background: C.greenDark, color: "#fff",
            fontFamily: F.sans, fontSize: 14, fontWeight: 600,
            border: "none", borderRadius: 999,
            boxShadow: "0 12px 28px -10px rgba(27,67,50,0.5)",
            cursor: "pointer",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
          {identity.display_name.split(" ")[0]}, flag something →
        </button>
      )}
      {open && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 60,
          width: 380, background: C.cardBg,
          border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: "0 24px 56px -16px rgba(27,67,50,0.35)",
          fontFamily: F.sans, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, color: C.gold, textTransform: "uppercase" }}>Quick feedback</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>stays private to you + Justyn</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "transparent", border: "none", color: C.muted, fontSize: 20, cursor: "pointer", padding: 0, width: 28, height: 28, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 16 }}>
            {sent ? (
              <div style={{ fontSize: 14, color: C.green, padding: "14px 0", textAlign: "center", fontWeight: 600 }}>
                Noted. Thanks, {identity.display_name.split(" ")[0]}.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {["Gap Map", "Wizard / Pathway", "AI Analysis", "General"].map((t) => (
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
      )}
    </>
  );
}
