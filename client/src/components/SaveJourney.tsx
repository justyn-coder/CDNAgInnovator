import { useState } from "react";

interface Props {
  stage: string;
  provinces: string[];
  description: string;
  need: string;
  sector?: string;
  companyUrl?: string;
  productType?: string;
  expansionProvinces?: string[];
  completedPrograms?: string[];
  pathwayData: unknown;
  /** If the journey was already saved, show the "already saved" state */
  alreadySaved?: boolean;
}

export default function SaveJourney({
  stage, provinces, description, need, sector,
  companyUrl, productType, expansionProvinces, completedPrograms,
  pathwayData, alreadySaved,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(alreadySaved || false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(() => {
    try { return !!sessionStorage.getItem("trellis_save_dismissed"); } catch { return false; }
  });

  if (dismissed && !saved) return null;

  if (saved) {
    return (
      <div
        className="mt-4 animate-fade-in-up"
        style={{
          background: "#E8F5E9",
          border: "0.5px solid rgba(76,175,80,0.3)",
          borderRadius: 10,
          padding: "16px 16px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: "#2E7D32" }}>
          {isUpdate
            ? "Your pathway has been updated. Same link, fresh data."
            : "Your pathway is saved. Check your email for a link to come back anytime."
          }
        </div>
      </div>
    );
  }

  async function submit() {
    if (!email.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const resp = await fetch("/api/journey/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          wizardSnapshot: {
            description,
            stage,
            provinces,
            need,
            sector: sector || null,
            companyUrl: companyUrl || null,
            productType: productType || null,
            expansionProvinces: expansionProvinces || null,
            completedPrograms: completedPrograms || null,
          },
          pathwayData,
          notifyNewPrograms: notify,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      const data = await resp.json();
      setIsUpdate(data.isUpdate || false);
      setSaved(true);
      try { sessionStorage.removeItem("trellis_save_dismissed"); } catch {}
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div
      className="mt-4 relative animate-fade-in-up"
      style={{
        background: "#FFF8E7",
        border: "0.5px solid rgba(212,168,40,0.2)",
        borderRadius: 10,
        padding: "16px 16px",
      }}
    >
      <button
        onClick={() => {
          setDismissed(true);
          try { sessionStorage.setItem("trellis_save_dismissed", "true"); } catch {}
        }}
        className="absolute top-3 right-3 bg-transparent border-none cursor-pointer"
        style={{ fontSize: 12, color: "#999" }}
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="flex items-center gap-2 mb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a18" }}>
          Save your pathway
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#6b6b6b", marginBottom: 10 }}>
        Get a personal link to come back to this anytime, no account needed.
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          type="email"
          className="outline-none font-sans flex-1 min-w-0"
          style={{
            border: "0.5px solid #E5E5E0",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            background: "white",
          }}
          onKeyDown={e => { if (e.key === "Enter" && email.trim()) submit(); }}
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="outline-none font-sans flex-1 min-w-0"
          style={{
            border: "0.5px solid #E5E5E0",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            background: "white",
          }}
          onKeyDown={e => { if (e.key === "Enter" && email.trim()) submit(); }}
        />
      </div>

      <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={notify}
          onChange={e => setNotify(e.target.checked)}
          className="accent-[#D4A828]"
          style={{ width: 14, height: 14 }}
        />
        <span style={{ fontSize: 12, color: "#6b6b6b" }}>
          Notify me when new programs match my profile
        </span>
      </label>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={submit}
          disabled={submitting || !email.trim()}
          style={{
            background: "#D4A828",
            color: "#1B4332",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            padding: "8px 20px",
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
            opacity: !email.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        {error && (
          <span style={{ fontSize: 12, color: "#c0392b" }}>{error}</span>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
        We'll email you a private link. No spam. No account needed.
      </div>
    </div>
  );
}
