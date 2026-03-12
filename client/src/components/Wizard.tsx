import { useState } from "react";

interface WizardResult {
  description: string;
  companyUrl: string;
  stage: string;
  provinces: string[];
  need: string;
}

interface Props {
  onComplete: (prompt: string, snapshot: { stage: string; provinces: string[]; need: string; companyUrl?: string }) => void;
}

const STAGES = [
  { key: "Idea", label: "Idea", sub: "Pre-product, validating the problem" },
  { key: "MVP", label: "MVP", sub: "Built something, need to test it" },
  { key: "Pilot", label: "Pilot", sub: "Testing with real farmers/operators" },
  { key: "Comm", label: "First Customers", sub: "Piloted, now selling" },
  { key: "Scale", label: "Scaling", sub: "Revenue, growing fast" },
];

const PROVINCES = ["AB", "SK", "MB", "ON", "BC", "QC", "Atlantic", "National"];

const NEEDS = [
  { key: "non-dilutive-capital", label: "Funding", icon: "💰" },
  { key: "pilot-site-field-validation", label: "Pilot Site", icon: "🌾" },
  { key: "first-customers", label: "First Customers", icon: "🤝" },
  { key: "accelerator", label: "Accelerator", icon: "🚀" },
  { key: "all", label: "Show me everything", icon: "✦" },
];

const btn = (active: boolean, small = false) => ({
  padding: small ? "7px 14px" : "10px 16px",
  borderRadius: 8,
  border: active ? "2px solid var(--green-mid)" : "1.5px solid var(--border)",
  background: active ? "var(--green-mid)" : "var(--bg)",
  color: active ? "#fff" : "var(--text)",
  fontWeight: 600,
  fontSize: small ? "0.78rem" : "0.82rem",
  cursor: "pointer",
  transition: "all 0.12s",
  fontFamily: "var(--font-text)",
  textAlign: "left" as const,
});

export default function Wizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardResult>({ description: "", companyUrl: "", stage: "", provinces: [], need: "" });

  function toggleProvince(p: string) {
    setData(d => ({
      ...d,
      provinces: d.provinces.includes(p) ? d.provinces.filter(x => x !== p) : [...d.provinces, p],
    }));
  }

  function finish(needKey: string) {
    const provinceStr = data.provinces.length > 0 ? data.provinces.join(" and ") : "Canada";
    const needStr = needKey  === "all"
      ? "I want to see all relevant programs across funding, pilot sites, accelerators, and first customer opportunities"
      : `My biggest need right now is ${NEEDS.find(n => n.key === needKey)?.label?.toLowerCase() || data.need}`;
    const stageLabel = STAGES.find(s => s.key === data.stage)?.label || data.stage;

    const prompt = `I'm building ${data.description}. I'm at the ${stageLabel} stage, based in ${provinceStr}. ${needStr}. What are the best programs for my situation?`;
    onComplete(prompt, { stage: data.stage, provinces: data.provinces, need: needKey, companyUrl: data.companyUrl || undefined });
  }

  const canProceed = [
    data.description.trim().length > 8,
    !!data.stage,
    data.provinces.length > 0,
    !!data.need,
  ][step];

  const steps = [
    // Step 0: What are you building?
    <div key="0">
      <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Step 1 of 4</p>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em" }}>What are you building?</h2>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 18 }}>A sentence is enough — product type, who it's for.</p>
      <textarea
        autoFocus
        value={data.description}
        onChange={e => setData(d => ({ ...d, description: e.target.value }))}
        placeholder="e.g. AI-powered soil sampling software for Prairie grain farmers"
        rows={3}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "1.5px solid var(--border)", fontSize: "0.85rem",
          lineHeight: 1.5, resize: "none", outline: "none",
          background: "var(--bg-secondary)",
          transition: "border-color 0.15s",
          fontFamily: "var(--font-text)",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--green-mid)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canProceed) { e.preventDefault(); setStep(1); } }}
      />
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
          Company website
          <span style={{ fontWeight: 400, fontStyle: "italic" }}>(optional — helps us personalize)</span>
        </label>
        <input
          value={data.companyUrl}
          onChange={e => setData(d => ({ ...d, companyUrl: e.target.value }))}
          placeholder="e.g. https://yourcompany.com"
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8, marginTop: 4,
            border: "1.5px solid var(--border)", fontSize: "0.82rem",
            outline: "none", background: "var(--bg-secondary)",
            transition: "border-color 0.15s",
            fontFamily: "var(--font-text)",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--green-mid)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
    </div>,

    // Step 1: Stage
    <div key="1">
      <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Step 2 of 4</p>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em" }}>What stage are you at?</h2>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 18 }}>Be honest — this determines which programs are actually open to you.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STAGES.map(s => (
          <button key={s.key} onClick={() => { setData(d => ({ ...d, stage: s.key })); setTimeout(() => setStep(2), 150); }}
            style={{ ...btn(data.stage === s.key), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{s.label}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 400, color: data.stage === s.key ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>{s.sub}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Province
    <div key="2">
      <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Step 3 of 4</p>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em" }}>Where are you operating?</h2>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 18 }}>Select all that apply — many programs are province-specific.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PROVINCES.map(p => (
          <button key={p} onClick={() => toggleProvince(p)} style={btn(data.provinces.includes(p), true)}>{p}</button>
        ))}
      </div>
    </div>,

    // Step 3: Need
    <div key="3">
      <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Step 4 of 4</p>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em" }}>What do you need most right now?</h2>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 18 }}>Pick one — this prioritizes your recommendations.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {NEEDS.map(n => (
          <button key={n.key} onClick={() => { setData(d => ({ ...d, need: n.key })); finish(n.key); }}
            style={{ ...btn(data.need === n.key), display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{
      margin: "16px", padding: "20px",
      background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)",
    }}>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? "var(--green-mid)" : "var(--bg-tertiary)",
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      {steps[step]}

      {/* Nav buttons — only show on steps that don't auto-advance */}
      {(step === 0 || step === 2) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {step > 0
            ? <button onClick={() => setStep(s => s - 1)} style={{ ...btn(false, true), color: "var(--text-secondary)" }}>← Back</button>
            : <div />}
          <button
            onClick={() => step === 2 ? setStep(3) : setStep(s => s + 1)}
            disabled={!canProceed}
            style={{
              ...btn(true, true),
              background: canProceed ? "var(--green-mid)" : "var(--bg-tertiary)",
              color: canProceed ? "#fff" : "var(--text-tertiary)",
              border: "none",
            }}
          >
            {step === 2 ? "Next →" : "Next →"}
          </button>
        </div>
      )}

      {/* Back button for stage/need steps */}
      {(step === 1 || step === 3) && (
        <button onClick={() => setStep(s => s - 1)} style={{ ...btn(false, true), marginTop: 16, color: "var(--text-secondary)" }}>← Back</button>
      )}
    </div>
  );
}
