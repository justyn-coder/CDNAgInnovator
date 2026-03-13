import { useState } from "react";

interface WizardResult {
  description: string;
  companyUrl: string;
  productType: string;
  stage: string;
  provinces: string[];
  need: string;
}

interface Props {
  onComplete: (prompt: string, snapshot: { stage: string; provinces: string[]; need: string; companyUrl?: string; productType?: string }) => void;
}

const STAGES = [
  { key: "Idea", label: "Idea", sub: "Pre-product, validating the problem" },
  { key: "MVP", label: "MVP", sub: "Built something, need to test it" },
  { key: "Pilot", label: "Pilot", sub: "Testing with real farmers/operators" },
  { key: "Comm", label: "First Customers", sub: "Piloted, now selling" },
  { key: "Scale", label: "Scaling", sub: "Revenue, growing fast" },
];

const PROVINCES = [
  { key: "AB", label: "Alberta" },
  { key: "SK", label: "Saskatchewan" },
  { key: "MB", label: "Manitoba" },
  { key: "ON", label: "Ontario" },
  { key: "BC", label: "British Columbia" },
  { key: "QC", label: "Quebec" },
  { key: "Atlantic", label: "Atlantic" },
  { key: "National", label: "National" },
];

const EARLY_NEEDS = [
  { key: "non-dilutive-capital", label: "Money to build", sub: "Grants, vouchers, pre-seed — non-dilutive capital to get started", icon: "💰" },
  { key: "validate-with-farmers", label: "Prove it works", sub: "Access to farms, research stations, or growers willing to test", icon: "🌾" },
  { key: "structured-program", label: "Structure & mentorship", sub: "Accelerator, incubator, or cohort — someone to keep you honest", icon: "🚀" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

const MID_NEEDS = [
  { key: "non-dilutive-capital", label: "Funding for trials", sub: "Grants, vouchers, pilot-stage capital", icon: "💰" },
  { key: "pilot-site-field-validation", label: "Pilot site access", sub: "Commercial farms, applied research orgs, or controlled trial environments", icon: "🌾" },
  { key: "credibility-validation", label: "Build credibility", sub: "Third-party validation, advisor endorsement, proof points buyers trust", icon: "✅" },
  { key: "first-customers", label: "Find first buyers", sub: "Events, intros, and advisor channels to reach actual growers", icon: "🤝" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

const GROWTH_NEEDS = [
  { key: "channel-distribution", label: "Dealers & distribution", sub: "Resellers, equipment dealers, channel partners, installers", icon: "🤝" },
  { key: "go-to-market", label: "Go-to-market strategy", sub: "Market entry, positioning, commercial packaging, new segments", icon: "🎯" },
  { key: "growth-capital", label: "Growth capital", sub: "Series A+, growth debt, strategic investment", icon: "📈" },
  { key: "industry-connections", label: "Industry access", sub: "Associations, trade events, policy networks, export programs", icon: "🏛" },
  { key: "all", label: "Show me everything", sub: "I'll sort through it myself", icon: "✦" },
];

function getNeedsForStage(stage: string) {
  if (stage === "Scale" || stage === "Comm") return GROWTH_NEEDS;
  if (stage === "Pilot") return MID_NEEDS;
  return EARLY_NEEDS;
}

const ALL_NEEDS = [...EARLY_NEEDS, ...MID_NEEDS, ...GROWTH_NEEDS];

const PRODUCT_TYPES = [
  { key: "software/SaaS", label: "Software / SaaS", icon: "💻" },
  { key: "hardware/equipment", label: "Hardware / Equipment", icon: "🔧" },
  { key: "biologicals/inputs", label: "Biologicals / Inputs", icon: "🧬" },
  { key: "services/consulting", label: "Services", icon: "📋" },
];

export default function Wizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardResult>({ description: "", companyUrl: "", productType: "", stage: "", provinces: [], need: "" });

  function toggleProvince(p: string) {
    setData(d => ({
      ...d,
      provinces: d.provinces.includes(p) ? d.provinces.filter(x => x !== p) : [...d.provinces, p],
    }));
  }

  function finish(needKey: string) {
    const provinceStr = data.provinces.length > 0 ? data.provinces.join(" and ") : "Canada";
    const needStr = needKey === "all"
      ? "I want to see all relevant programs across funding, pilot sites, accelerators, and first customer opportunities"
      : `My biggest need right now is ${ALL_NEEDS.find(n => n.key === needKey)?.label?.toLowerCase() || data.need}`;
    const stageLabel = STAGES.find(s => s.key === data.stage)?.label || data.stage;
    const productTypeStr = data.productType ? ` My product is ${data.productType}.` : "";

    const prompt = `I'm building ${data.description}.${productTypeStr} I'm at the ${stageLabel} stage, based in ${provinceStr}. ${needStr}. What are the best programs for my situation?`;
    onComplete(prompt, { stage: data.stage, provinces: data.provinces, need: needKey, companyUrl: data.companyUrl || undefined, productType: data.productType || undefined });
  }

  const canProceed = [
    data.description.trim().length > 8,
    !!data.stage,
    data.provinces.length > 0,
    !!data.need,
  ][step];

  // Shared option button style
  const optBtn = (active: boolean) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)" as const,
    border: active ? "2px solid var(--green-mid)" : "1.5px solid var(--border)" as const,
    background: active ? "var(--green-mid)" : "var(--bg)" as const,
    color: active ? "#fff" : "var(--text)" as const,
    fontWeight: 600 as const,
    fontSize: "0.85rem" as const,
    cursor: "pointer" as const,
    transition: "all 0.12s" as const,
    fontFamily: "var(--font-text)" as const,
    textAlign: "left" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "12px" as const,
    boxShadow: active ? "0 2px 8px rgba(30,107,10,0.15)" : "var(--shadow-sm)" as const,
  });

  const stepContent = [
    // ── Step 0: What are you building? ──
    <div key="0" style={{ animation: "fadeInUp 0.3s ease" }}>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 400,
        color: "var(--text)", marginBottom: 6,
      }}>What are you building?</h2>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
        A sentence is enough — product type, who it's for.
      </p>
      <textarea
        value={data.description}
        onChange={e => setData(d => ({ ...d, description: e.target.value }))}
        placeholder="e.g. AI-powered soil sampling software for Prairie grain farmers"
        rows={3}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)",
          border: "1.5px solid var(--border)", fontSize: "0.88rem",
          lineHeight: 1.5, resize: "none", outline: "none",
          background: "var(--bg-secondary)",
          transition: "border-color 0.15s, box-shadow 0.15s",
          fontFamily: "var(--font-text)",
        }}
        onFocus={e => { e.target.style.borderColor = "var(--green-mid)"; e.target.style.boxShadow = "0 0 0 3px rgba(30,107,10,0.06)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canProceed) { e.preventDefault(); setStep(1); } }}
      />

      {/* Product type */}
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, display: "block" }}>
          Product type
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRODUCT_TYPES.map(pt => (
            <button key={pt.key}
              onClick={() => setData(d => ({ ...d, productType: d.productType === pt.key ? "" : pt.key }))}
              style={{
                padding: "7px 14px", borderRadius: "var(--radius-sm)",
                border: data.productType === pt.key ? "2px solid var(--green-mid)" : "1.5px solid var(--border)",
                background: data.productType === pt.key ? "var(--green-mid)" : "var(--bg)",
                color: data.productType === pt.key ? "#fff" : "var(--text-secondary)",
                fontWeight: 600, fontSize: "0.78rem",
                fontFamily: "var(--font-text)",
                transition: "all 0.12s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{pt.icon}</span>
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company URL */}
      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
          Company website
          <span style={{ fontWeight: 400, fontStyle: "italic" }}>(optional)</span>
        </label>
        <input
          value={data.companyUrl}
          onChange={e => setData(d => ({ ...d, companyUrl: e.target.value }))}
          placeholder="https://yourcompany.com"
          style={{
            width: "100%", padding: "9px 14px", borderRadius: "var(--radius-sm)", marginTop: 4,
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

    // ── Step 1: Stage ──
    <div key="1" style={{ animation: "fadeInUp 0.3s ease" }}>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 400,
        color: "var(--text)", marginBottom: 6,
      }}>What stage are you at?</h2>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
        Be honest — this determines which programs are actually open to you.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STAGES.map(s => (
          <button key={s.key}
            onClick={() => { setData(d => ({ ...d, stage: s.key })); setTimeout(() => setStep(2), 150); }}
            style={{
              ...optBtn(data.stage === s.key),
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{s.label}</span>
            <span style={{
              fontSize: "0.72rem", fontWeight: 400,
              color: data.stage === s.key ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)",
            }}>{s.sub}</span>
          </button>
        ))}
      </div>
    </div>,

    // ── Step 2: Province ──
    <div key="2" style={{ animation: "fadeInUp 0.3s ease" }}>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 400,
        color: "var(--text)", marginBottom: 6,
      }}>Where are you operating?</h2>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
        Select all that apply — many programs are province-specific.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PROVINCES.map(p => (
          <button key={p.key}
            onClick={() => toggleProvince(p.key)}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: data.provinces.includes(p.key) ? "2px solid var(--green-mid)" : "1.5px solid var(--border)",
              background: data.provinces.includes(p.key) ? "var(--green-mid)" : "var(--bg)",
              color: data.provinces.includes(p.key) ? "#fff" : "var(--text)",
              fontWeight: 600, fontSize: "0.82rem",
              fontFamily: "var(--font-text)",
              transition: "all 0.12s",
              textAlign: "left" as const,
              boxShadow: data.provinces.includes(p.key) ? "0 2px 8px rgba(30,107,10,0.15)" : "var(--shadow-sm)",
            }}
          >
            <div style={{ fontWeight: 700 }}>{p.key}</div>
            <div style={{
              fontSize: "0.68rem", fontWeight: 400, marginTop: 1,
              color: data.provinces.includes(p.key) ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)",
            }}>{p.label}</div>
          </button>
        ))}
      </div>
    </div>,

    // ── Step 3: Need ──
    <div key="3" style={{ animation: "fadeInUp 0.3s ease" }}>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 400,
        color: "var(--text)", marginBottom: 6,
      }}>What's the biggest thing holding you back?</h2>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
        Pick the bottleneck — we'll build your pathway around it.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {getNeedsForStage(data.stage).map(n => (
          <button key={n.key}
            onClick={() => { setData(d => ({ ...d, need: n.key })); finish(n.key); }}
            style={optBtn(data.need === n.key)}
          >
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{n.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{n.label}</div>
              {n.sub && (
                <div style={{
                  fontSize: "0.72rem", fontWeight: 400, marginTop: 2,
                  color: data.need === n.key ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)",
                }}>{n.sub}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{
      margin: "16px", padding: "24px",
      background: "var(--bg)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)",
    }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? "var(--green-mid)" : "var(--bg-tertiary)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{
        fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 18,
      }}>Step {step + 1} of 4</div>

      {stepContent[step]}

      {/* Navigation */}
      {(step === 0 || step === 2) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)",
              fontFamily: "var(--font-text)", transition: "all 0.12s",
            }}>← Back</button>
          ) : <div />}
          <button
            onClick={() => step === 2 ? setStep(3) : setStep(s => s + 1)}
            disabled={!canProceed}
            style={{
              background: canProceed ? "linear-gradient(135deg, var(--green-mid), var(--green-light))" : "var(--bg-tertiary)",
              color: canProceed ? "#fff" : "var(--text-tertiary)",
              border: "none", borderRadius: "var(--radius-sm)",
              padding: "10px 24px", fontSize: "0.85rem", fontWeight: 700,
              fontFamily: "var(--font-text)", transition: "all 0.15s",
              boxShadow: canProceed ? "0 2px 8px rgba(30,107,10,0.2)" : "none",
            }}
          >Next →</button>
        </div>
      )}

      {(step === 1 || step === 3) && (
        <button onClick={() => setStep(s => s - 1)} style={{
          marginTop: 16, background: "none", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "8px 16px",
          fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)",
          fontFamily: "var(--font-text)", transition: "all 0.12s",
        }}>← Back</button>
      )}
    </div>
  );
}
