import { useState } from "react";

interface Props {
  wizardSnapshot: any;
  pathwayData: any;
  journeyToken: string | null;
  /** Called when the user confirms a summary — parent can pass this into SaveJourney */
  onSummaryConfirmed?: (summary: string) => void;
}

type Mode = "empty" | "generating" | "review" | "saved" | "error";

export default function WrapUpSection({ wizardSnapshot, pathwayData, journeyToken, onSummaryConfirmed }: Props) {
  const [mode, setMode] = useState<Mode>("empty");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setError(null);
    setMode("generating");
    try {
      const r = await fetch("/api/navigator/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizardSnapshot, pathwayData, journeyToken }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      if (!data.summary) throw new Error("No summary returned");
      setSummary(data.summary);
      setMode("review");
    } catch (e: any) {
      setError(e.message || "Could not generate a summary right now.");
      setMode("error");
    }
  }

  async function confirmForSavedJourney() {
    if (!journeyToken) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/journey/${journeyToken}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      setMode("saved");
    } catch (e: any) {
      setError(e.message || "Could not save just now.");
    } finally {
      setSaving(false);
    }
  }

  function confirmForNewJourney() {
    // Hand the summary up to the parent so SaveJourney can include it in its save call.
    if (onSummaryConfirmed) onSummaryConfirmed(summary);
    setMode("saved");
  }

  const cardBase = "rounded-[10px] p-5 md:p-6 animate-fade-in-up";
  const cardStyle: React.CSSProperties = {
    background: "#FAFAF7",
    border: "1px solid #E8E5E0",
    borderLeft: "3px solid #D4A828",
    maxWidth: 760,
    marginLeft: "auto",
    marginRight: "auto",
  };
  const eyebrow = "font-sans text-[0.65rem] tracking-[0.22em] font-bold text-brand-gold uppercase";

  if (mode === "saved") {
    return (
      <div className={cardBase} style={cardStyle}>
        <div className={eyebrow}>Summary saved</div>
        <p className="font-display text-[1.05rem] text-brand-forest leading-[1.55] mt-2.5 m-0">
          {summary}
        </p>
        <div className="text-[0.75rem] text-text-tertiary mt-3">
          {journeyToken ? "Attached to your saved journey. You'll see it when you come back via your email link." : "We'll attach it when you save your pathway below."}
        </div>
      </div>
    );
  }

  if (mode === "generating") {
    return (
      <div className={cardBase} style={cardStyle}>
        <div className={eyebrow}>Thinking</div>
        <p className="font-display text-[1.05rem] text-brand-forest leading-[1.55] mt-2.5 m-0 italic">
          Reading your pathway and writing what I see.
        </p>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className={cardBase} style={cardStyle}>
        <div className={eyebrow}>Something went sideways</div>
        <p className="font-display text-[1rem] text-brand-forest leading-[1.5] mt-2.5 m-0">
          {error || "Could not generate the summary. Try again in a moment."}
        </p>
        <button
          onClick={generate}
          className="mt-3 px-4 py-2 bg-brand-forest text-white font-semibold text-[0.82rem] rounded-md border-none cursor-pointer font-sans"
        >
          Try again
        </button>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className={cardBase} style={cardStyle}>
        <div className={eyebrow}>Here is what I see. Edit or confirm.</div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          className="w-full mt-3 px-3.5 py-3 text-[0.92rem] font-sans border border-border rounded-md resize-y leading-[1.55] box-border"
          style={{ background: "#fff" }}
        />
        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {journeyToken ? (
            <button
              onClick={confirmForSavedJourney}
              disabled={saving}
              className="px-4 py-2 bg-brand-forest text-white font-semibold text-[0.82rem] rounded-md border-none cursor-pointer font-sans disabled:opacity-70"
            >
              {saving ? "Saving…" : "Save to my journey"}
            </button>
          ) : (
            <button
              onClick={confirmForNewJourney}
              className="px-4 py-2 bg-brand-forest text-white font-semibold text-[0.82rem] rounded-md border-none cursor-pointer font-sans"
            >
              Attach to my save, below
            </button>
          )}
          <button
            onClick={generate}
            disabled={saving}
            className="px-4 py-2 bg-transparent text-brand-forest font-semibold text-[0.82rem] rounded-md border border-border cursor-pointer font-sans"
          >
            Redo
          </button>
          <button
            onClick={() => { setMode("empty"); setSummary(""); }}
            disabled={saving}
            className="px-3 py-2 bg-transparent text-text-secondary font-medium text-[0.78rem] rounded-md border-none cursor-pointer font-sans"
          >
            Cancel
          </button>
        </div>
        {error && <div className="text-[0.78rem] text-red-600 mt-2">{error}</div>}
      </div>
    );
  }

  // Empty state
  return (
    <div className={cardBase} style={cardStyle}>
      <div className={eyebrow}>Summarize what we covered</div>
      <p className="font-display text-[1.05rem] text-brand-forest leading-[1.55] mt-2.5 m-0">
        Want a short wrap-up of your pathway and where Trellis thinks you should go next? Takes about ten seconds.
      </p>
      <div className="mt-3 flex gap-2 items-center flex-wrap">
        <button
          onClick={generate}
          className="px-4 py-2 bg-brand-forest text-white font-semibold text-[0.82rem] rounded-md border-none cursor-pointer font-sans"
        >
          Summarize this →
        </button>
        <span className="text-[0.75rem] text-text-tertiary">Save it or take it with you.</span>
      </div>
      {error && <div className="text-[0.78rem] text-red-600 mt-2">{error}</div>}
    </div>
  );
}
