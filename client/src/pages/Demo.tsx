import { useEffect, useRef, useState } from "react";

/* Inline Trellis logo SVG (replaces PNG asset from original demo) */
function TrellisLogoSvg({ width = 220 }: { width?: number }) {
  return (
    <svg viewBox="0 0 200 60" width={width} aria-label="Trellis" style={{ display: "block", margin: "0 auto" }}>
      <g transform="translate(4, 6)">
        <line x1="6" y1="44" x2="6" y2="10" stroke="#1B4332" strokeWidth="3" strokeLinecap="round"/>
        <line x1="18" y1="44" x2="18" y2="10" stroke="#1B4332" strokeWidth="3" strokeLinecap="round"/>
        <line x1="30" y1="44" x2="30" y2="10" stroke="#1B4332" strokeWidth="3" strokeLinecap="round"/>
        <line x1="1" y1="34" x2="35" y2="34" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="1" y1="22" x2="35" y2="22" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="34" r="3.2" fill="#48B87A"/>
        <circle cx="18" cy="34" r="2.8" fill="#48B87A" opacity="0.9"/>
        <circle cx="30" cy="34" r="2.4" fill="#48B87A" opacity="0.8"/>
        <circle cx="6" cy="22" r="3.5" fill="#8CC63F"/>
        <circle cx="18" cy="22" r="3" fill="#8CC63F" opacity="0.9"/>
        <circle cx="30" cy="22" r="2.5" fill="#8CC63F" opacity="0.7"/>
        <circle cx="6" cy="10" r="3" fill="#D4A828" opacity="0.85"/>
        <circle cx="18" cy="6" r="2.5" fill="#D4A828" opacity="0.65"/>
        <circle cx="30" cy="2" r="2" fill="#D4A828" opacity="0.5"/>
      </g>
      <text x="46" y="32" fontFamily="'DM Serif Display', Georgia, serif" fontSize="32" fontWeight="400" letterSpacing="0.01em" fill="#1a1a18">Trellis</text>
      <text x="46" y="46" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="8" fontWeight="500" letterSpacing="0.08em" fill="#999">CANADA'S AGTECH ECOSYSTEM</text>
    </svg>
  );
}

function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, visible: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [visible, target, duration]);
  return val;
}

const F = { serif: "'DM Serif Display', serif", sans: "'DM Sans', system-ui, sans-serif" };
const C = { green: "#2D5A3D", gold: "#C4A052", bg: "#FAFAF7", bgWarm: "#F5F0E8", text: "#1A1A1A", muted: "#6B7C6B", cardBg: "#fff", border: "#E8E5E0" };

// Detect ref for personalization (e.g., ?ref=bioenterprise)
function useRefParam() {
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRef(params.get("ref"));
    } catch {}
  }, []);
  return ref;
}

// Known organization lookup
const ORG_NAMES: Record<string, string> = {
  bioenterprise: "Bioenterprise",
  fcc: "FCC",
  goah: "GOAH",
  mars: "MaRS",
  communitech: "Communitech",
};
function orgFromRef(ref: string | null): string | null {
  if (!ref) return null;
  return ORG_NAMES[ref.toLowerCase()] || null;
}

function Tag({ children, color = C.green, bg = "#E8F5E9" }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 700, fontFamily: F.sans,
      padding: "3px 10px", borderRadius: 20, background: bg, color,
      letterSpacing: "0.02em", marginRight: 6, marginBottom: 4,
    }}>{children}</span>
  );
}

function SectionOpening() {
  const { ref, visible } = useFadeIn(0.1);
  const { ref: ref2, visible: vis2 } = useFadeIn(0.1);
  return (
    <>
      <div ref={ref} style={{ padding: "100px 24px 20px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{
          fontFamily: F.serif, fontSize: "clamp(32px, 7vw, 52px)", color: C.green, lineHeight: 1.15,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}>
          Canada's ag innovation ecosystem is powerful.
        </h1>
        <p style={{
          fontFamily: F.serif, fontSize: "clamp(28px, 6vw, 48px)", color: C.green, lineHeight: 1.15, marginTop: 20,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s",
        }}>
          It's also a <span style={{ color: C.gold }}>maze</span>.
        </p>
        <div style={{
          marginTop: 48, fontSize: 24, color: C.muted,
          opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.6s",
        }} className="bounce-arrow">&#8595;</div>
      </div>
      <div ref={ref2} style={{ padding: "40px 24px 48px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <p style={{
          fontFamily: F.serif, fontSize: "clamp(28px, 6vw, 44px)", color: C.gold, lineHeight: 1.2,
          opacity: vis2 ? 1 : 0, transform: vis2 ? "none" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}>
          We mapped it.
        </p>
      </div>
    </>
  );
}

function SectionReveal() {
  const { ref, visible } = useFadeIn(0.2);
  const p497 = useCountUp(483, visible);
  const p167 = useCountUp(172, visible);
  const refParam = useRefParam();
  const orgName = orgFromRef(refParam);
  return (
    <div ref={ref} style={{ padding: "48px 24px 56px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        margin: "0 auto 24px", maxWidth: 220,
        opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.92)",
        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
      }}>
        <TrellisLogoSvg width={220} />
      </div>
      {orgName && (
        <p style={{
          fontFamily: F.sans, fontSize: 12, color: C.gold, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
          opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.15s",
        }}>
          Built for operators like {orgName}
        </p>
      )}
      <p style={{
        fontFamily: F.serif, fontSize: "clamp(20px, 5vw, 26px)", color: C.green, lineHeight: 1.4,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s",
      }}>
        {p497} programs. {p167} ecosystem intelligence entries.
      </p>
      <p style={{
        fontFamily: F.serif, fontSize: "clamp(20px, 5vw, 26px)", color: C.green, lineHeight: 1.4, marginTop: 4,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease-out 0.35s, transform 0.5s ease-out 0.35s",
      }}>
        All 10 provinces. <span style={{ color: C.gold }}>Free</span>.
      </p>
      <div style={{
        marginTop: 36, fontSize: 24, color: C.muted,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.5s",
      }} className="bounce-arrow">&#8595;</div>
    </div>
  );
}

function WizardStep({ step, question, children, delay }: { step: number; question: string; children: React.ReactNode; delay: number }) {
  const { ref, visible } = useFadeIn(0.1);
  return (
    <div ref={ref} style={{
      background: C.cardBg, borderRadius: 8, border: `1px solid ${C.border}`,
      padding: "20px 24px", marginBottom: 16, maxWidth: 320, marginLeft: "auto", marginRight: "auto",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: `opacity 0.4s ease-out ${delay}ms, transform 0.4s ease-out ${delay}ms`,
    }}>
      <p style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        Step {step} of 4
      </p>
      <p style={{ fontFamily: F.serif, fontSize: 18, color: C.green, marginBottom: 12 }}>{question}</p>
      {children}
    </div>
  );
}

function SectionFounder() {
  const { ref, visible } = useFadeIn(0.1);
  const pathwayRef = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(0);
  const fullText = "Precision soil biology testing platform for Ontario crop farmers. MVP built, need to validate with real growers.";
  useEffect(() => {
    if (!visible) return;
    if (typing >= fullText.length) return;
    const t = setTimeout(() => setTyping(p => p + 1), 25);
    return () => clearTimeout(t);
  }, [visible, typing, fullText.length]);

  const [selectedStage, setSelectedStage] = useState(false);
  const [selectedProv, setSelectedProv] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timers = [
      setTimeout(() => setSelectedStage(true), 1400),
      setTimeout(() => setSelectedProv(true), 2200),
      setTimeout(() => setSelectedBottle(true), 3000),
      setTimeout(() => setShowButton(true), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  useEffect(() => {
    if (!processing) return;
    if (progress >= 100) { setDone(true); return; }
    const t = setTimeout(() => setProgress(p => Math.min(p + 2, 100)), 40);
    return () => clearTimeout(t);
  }, [processing, progress]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      pathwayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);
    return () => clearTimeout(t);
  }, [done]);

  const stages = ["Idea", "MVP", "Pilot", "Customers", "Scaling"];
  const provinces = ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"];
  const bottlenecks = ["Non-dilutive capital", "Validate with farmers", "Structured program", "Credibility", "Industry connections"];

  return (
    <>
      <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600 }}>
          THE FOUNDER EXPERIENCE
        </p>
        <h2 style={{ fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 36px)", color: C.green, marginTop: 6, marginBottom: 24, lineHeight: 1.2 }}>
          30 seconds. 4 questions. A personalized pathway.
        </h2>

        {/* Trust banner */}
        <div style={{
          maxWidth: 320, marginLeft: "auto", marginRight: "auto", marginBottom: 16,
          padding: "10px 14px", background: "linear-gradient(to right, #f0f5f0, #f8faf8)",
          border: `1px solid ${C.border}`, borderRadius: 10,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, lineHeight: 1.45 }}>
            <strong style={{ color: C.text }}>Your information stays with you.</strong> We never share your data with programs or third parties.
          </p>
        </div>

        <WizardStep step={1} question="What are you building?" delay={0}>
          <div style={{
            background: "#F7F6F3", borderRadius: 6, padding: "10px 12px",
            fontFamily: F.sans, fontSize: 13, color: C.text, minHeight: 36, border: `1px solid ${C.border}`,
          }}>
            {fullText.substring(0, typing)}
            <span style={{ opacity: typing < fullText.length ? 1 : 0, animation: "blink 1s step-end infinite" }}>|</span>
          </div>
        </WizardStep>

        <WizardStep step={2} question="What stage are you at?" delay={100}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stages.map(s => (
              <div key={s} style={{
                padding: "8px 12px", borderRadius: 6, fontFamily: F.sans, fontSize: 13,
                border: s === "MVP" && selectedStage ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                background: s === "MVP" && selectedStage ? "#FBF7ED" : "#fff",
                color: C.text, fontWeight: s === "MVP" && selectedStage ? 600 : 400,
                transition: "all 0.3s ease",
              }}>{s}</div>
            ))}
          </div>
        </WizardStep>

        <WizardStep step={3} question="Where are you operating?" delay={200}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {provinces.map(p => (
              <div key={p} style={{
                padding: "8px 0", borderRadius: 6, textAlign: "center",
                fontFamily: F.sans, fontSize: 12, fontWeight: 600,
                background: p === "ON" && selectedProv ? C.gold : "#F5F3EE",
                color: p === "ON" && selectedProv ? "#fff" : C.muted,
                transition: "all 0.3s ease",
              }}>{p}</div>
            ))}
          </div>
        </WizardStep>

        <WizardStep step={4} question="What's holding you back?" delay={300}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bottlenecks.map(b => (
              <div key={b} style={{
                padding: "8px 12px", borderRadius: 6, fontFamily: F.sans, fontSize: 13,
                background: b === "Validate with farmers" && selectedBottle ? C.green : "#fff",
                color: b === "Validate with farmers" && selectedBottle ? "#fff" : C.text,
                border: b === "Validate with farmers" && selectedBottle ? "none" : `1px solid ${C.border}`,
                fontWeight: b === "Validate with farmers" && selectedBottle ? 600 : 400,
                transition: "all 0.3s ease",
              }}>{b}</div>
            ))}
          </div>
        </WizardStep>

        {showButton && !processing && !done && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => setProcessing(true)} className="cta-pulse" style={{
              background: C.green, color: "#fff", border: "none", borderRadius: 8,
              padding: "14px 36px", fontFamily: F.sans, fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              Generate my pathway &rarr;
            </button>
          </div>
        )}

        {processing && !done && (
          <div style={{
            textAlign: "center", padding: "80px 0", minHeight: "60vh",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.4s ease",
          }}>
            <div style={{ width: "min(140px, 40%)", margin: "0 auto 28px", animation: "pulse 1.5s ease-in-out infinite" }}><TrellisLogoSvg width={140} /></div>
            <div style={{ width: "80%", maxWidth: 360, background: "#E8E5DD", borderRadius: 20, height: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.green, borderRadius: 20, width: `${progress}%`, transition: "width 0.08s linear" }} />
            </div>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginTop: 16 }}>
              {progress < 25 ? "Scanning 483 programs across Canada..." : progress < 50 ? "Matching to MVP stage in Ontario..." : progress < 75 ? "Filtering by farmer validation..." : "Building your personalized pathway..."}
            </p>
          </div>
        )}
      </div>
      <div ref={pathwayRef} />
    </>
  );
}

function PathwayCard({ num, name, desc, tags, highlight }: {
  num: number; name: string; desc: string; tags: { label: string; bg: string }[]; highlight: boolean;
}) {
  const { ref, visible } = useFadeIn(0.1);
  return (
    <div ref={ref} style={{
      display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: C.green, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F.sans, fontSize: 16, fontWeight: 700, flexShrink: 0,
      }}>{num}</div>
      <div style={{
        flex: 1, background: C.cardBg, borderRadius: 8, padding: "20px 24px",
        border: highlight ? `1.5px solid ${C.gold}` : `1px solid ${C.border}`,
      }}>
        <p style={{ fontFamily: F.serif, fontSize: 17, color: C.green, marginBottom: 8 }}>{name}</p>
        <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tags.map((t, j) => <Tag key={j} bg={t.bg} color={C.green}>{t.label}</Tag>)}
        </div>
        <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function SectionPathway() {
  const { ref, visible } = useFadeIn();
  const programs = [
    { num: 1, name: "Bioenterprise Canada", desc: "Start here. Ontario's agtech concierge — connects you to farmers, advisors, and applied research for validation before you build more.", tags: [{ label: "Accelerator", bg: "#FFF3E0" }, { label: "Do now", bg: "#FFF8E1" }, { label: "Strong fit", bg: "#E8F5E9" }] },
    { num: 2, name: "Grow Ontario Accelerator Hub (GOAH)", desc: "Ontario-anchored cohort program for commercializing agtech. Applications close June 3.", tags: [{ label: "Accelerator", bg: "#FFF3E0" }, { label: "This month", bg: "#FFF8E1" }, { label: "Strong fit", bg: "#E8F5E9" }] },
    { num: 3, name: "AAFC AgriInnovate", desc: "Up to $5M in non-dilutive capital for commercialization. Best paired with validated pilot data from a program partner.", tags: [{ label: "Funding", bg: "#E8F5E9" }, { label: "Next quarter", bg: "#FFF8E1" }] },
  ];
  return (
    <div ref={ref} style={{
      padding: "48px 24px", maxWidth: 480, margin: "0 auto",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
      transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
    }}>
      <h2 style={{ fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 24, lineHeight: 1.2 }}>
        Your pathway. Built around what's actually blocking you.
      </h2>
      {programs.map((p, i) => (
        <PathwayCard key={i} num={p.num} name={p.name} desc={p.desc} tags={p.tags} highlight={i === 0} />
      ))}
      <p style={{ fontFamily: F.serif, fontSize: 18, color: C.green, textAlign: "center", marginTop: 12 }}>
        Prioritized. Sequenced. With prep steps for each one.
      </p>
      <p style={{ fontFamily: F.sans, fontSize: 13, color: C.muted, textAlign: "center", marginTop: 8 }}>
        ... and 3 more programs in your pipeline
      </p>

      {/* Save your pathway mockup */}
      <div style={{
        marginTop: 28, padding: "16px 18px",
        background: "#FFF8E7", border: "0.5px solid rgba(212,168,40,0.3)",
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, color: "#1a1a18" }}>
            Save your pathway
          </span>
        </div>
        <p style={{ fontFamily: F.sans, fontSize: 12, color: "#6b6b6b", marginBottom: 10 }}>
          Get a personal link. Come back anytime. No account needed.
        </p>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{
            flex: 1, background: "#fff", border: "0.5px solid #E5E5E0",
            borderRadius: 6, padding: "7px 10px", fontFamily: F.sans, fontSize: 12, color: "#999",
          }}>
            your@email.com
          </div>
          <div style={{
            background: "#D4A828", color: "#1B4332",
            fontFamily: F.sans, fontSize: 12, fontWeight: 600,
            borderRadius: 6, padding: "7px 16px",
          }}>
            Save
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionGoDeeper() {
  const { ref, visible } = useFadeIn(0.15);
  const [typingIdx, setTypingIdx] = useState(0);
  const [showPrep, setShowPrep] = useState([false, false, false]);
  const responseTitle = "Bioenterprise Canada — How to approach them";
  const preps = [
    { title: "Problem statement", detail: "One-page description of the soil biology problem you're solving and the grower you've identified as the end user" },
    { title: "Pilot readiness", detail: "What you'd test with farmers first — methodology, number of sites, what success looks like" },
    { title: "Why you, why now", detail: "Your technical background and what makes this the right moment for this approach in Ontario agriculture" },
  ];
  const fullResponse = responseTitle;

  useEffect(() => {
    if (!visible) return;
    if (typingIdx >= fullResponse.length) {
      const t1 = setTimeout(() => setShowPrep([true, false, false]), 200);
      const t2 = setTimeout(() => setShowPrep([true, true, false]), 500);
      const t3 = setTimeout(() => setShowPrep([true, true, true]), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    const t = setTimeout(() => setTypingIdx(p => p + 1), 18);
    return () => clearTimeout(t);
  }, [visible, typingIdx, fullResponse.length]);

  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 24, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        Ask follow-ups. Get preparation checklists.
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          alignSelf: "flex-end", maxWidth: "80%",
          background: C.green, color: "#fff", borderRadius: "14px 14px 4px 14px",
          padding: "12px 16px", fontFamily: F.sans, fontSize: 14, cursor: "pointer",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(12px)",
          transition: "opacity 0.4s ease-out 0.15s, transform 0.4s ease-out 0.15s",
        }}>
          How do I approach Bioenterprise? What should I bring to the first call? &rarr;
        </div>

        <div style={{
          alignSelf: "flex-start",
          background: C.cardBg, borderRadius: "14px 14px 14px 4px",
          padding: "18px 20px", border: `1px solid ${C.border}`,
          fontFamily: F.sans, fontSize: 14, color: C.text, lineHeight: 1.6,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(8px)",
          transition: "opacity 0.4s ease-out 0.5s, transform 0.4s ease-out 0.5s",
        }}>
          <p style={{ fontWeight: 700, color: C.green, fontSize: 14, marginBottom: 12 }}>
            {fullResponse.substring(0, typingIdx)}
            {typingIdx < fullResponse.length && <span style={{ animation: "blink 1s step-end infinite" }}>|</span>}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {preps.map((item, i) => (
              <div key={i} style={{
                borderLeft: `3px solid ${C.gold}`, paddingLeft: 12,
                opacity: showPrep[i] ? 1 : 0, transform: showPrep[i] ? "none" : "translateY(8px)",
                transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
                maxHeight: showPrep[i] ? 200 : 0, overflow: "hidden",
              }}>
                <p style={{ fontWeight: 600, color: C.green, fontSize: 13, marginBottom: 2 }}>{item.title}</p>
                <p style={{ color: C.muted, fontSize: 13 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTransition() {
  const { ref, visible } = useFadeIn(0.15);
  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(22px, 5vw, 28px)", color: C.green, lineHeight: 1.3,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out",
      }}>
        Not a directory. Not a chatbot. A system built on public data — getting sharper every week.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 15, color: C.text, lineHeight: 1.7, marginTop: 12,
        opacity: visible ? 0.75 : 0, transform: visible ? "none" : "translateY(10px)",
        transition: "opacity 0.4s ease-out 0.2s, transform 0.4s ease-out 0.2s",
      }}>
        Built from federal and provincial databases. Filtered to your stage, province, and sector. Cross-referenced with ecosystem intelligence we keep adding to.
      </p>

      {/* What's done vs. coming */}
      <div style={{
        marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(10px)",
        transition: "opacity 0.5s ease-out 0.35s, transform 0.5s ease-out 0.35s",
      }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            ✓ Live today
          </p>
          <ul style={{ fontFamily: F.sans, fontSize: 12, color: C.text, lineHeight: 1.6, listStyle: "none", padding: 0 }}>
            <li>• 483 programs verified</li>
            <li>• Pathways by stage + province</li>
            <li>• AI gap analysis</li>
            <li>• Daily scraping engine</li>
          </ul>
        </div>
        <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Coming soon
          </p>
          <ul style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, lineHeight: 1.6, listStyle: "none", padding: 0 }}>
            <li>• Operator verification</li>
            <li>• Founder testimonials</li>
            <li>• Agronomist insights</li>
            <li>• Pilot-readiness scores</li>
          </ul>
        </div>
      </div>
      <p style={{
        fontFamily: F.sans, fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 14, fontStyle: "italic", textAlign: "center",
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.5s",
      }}>
        The promise to founders: trust the data because it's been through the people who know it best.
      </p>
    </div>
  );
}

function SectionOperatorPivot() {
  const { ref, visible } = useFadeIn(0.2);
  return (
    <div ref={ref} style={{
      padding: "40px 24px", maxWidth: 480, margin: "0 auto",
      background: C.green, borderRadius: 8, textAlign: "center", color: "#fff",
    }}>
      <p style={{
        fontFamily: F.serif, fontSize: "clamp(22px, 5vw, 32px)", lineHeight: 1.3,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.1s",
      }}>
        That's what founders see.
      </p>
      <p style={{
        fontFamily: F.serif, fontSize: "clamp(22px, 5vw, 32px)", marginTop: 20, lineHeight: 1.3,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.5s",
      }}>
        Here's what <span style={{ color: C.gold }}>you</span> see.
      </p>
    </div>
  );
}

function SectionOperatorDashboard() {
  const { ref, visible } = useFadeIn(0.1);
  const insights = [
    { title: "The Scale Cliff", body: "The ecosystem builds founders up through commercialization — then drops them. 314 programs at Customers stage. 149 at Scale. A 53% drop.", color: "#C62828" },
    { title: "Alberta's Paradox", body: "85 programs across the province. Only 24 serve scale-stage companies — and most weren't built for agtech.", color: "#E65100" },
    { title: "The Funding Valley", body: "20 programs fund under $150K. 21 fund over $1M. Only 13 in the $500K-$1M band where real agtech ventures live.", color: "#B45309" },
  ];
  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>ECOSYSTEM INTELLIGENCE</p>

      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(22px, 5vw, 28px)", color: C.green, marginTop: 8, marginBottom: 12, lineHeight: 1.3,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s",
      }}>
        See what no single organization can see alone.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 15, color: C.text, lineHeight: 1.7, opacity: visible ? 0.75 : 0, marginBottom: 24,
        transition: "opacity 0.4s ease-out 0.2s",
      }}>
        Pre-computed coverage analysis across every province and program category. Gaps, patterns, and opportunities surfaced automatically.
      </p>

      <div style={{
        background: C.green, borderRadius: 8, padding: "28px 24px", color: "#fff",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.4s ease-out 0.3s, transform 0.4s ease-out 0.3s",
      }}>
        <p style={{ fontFamily: F.sans, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.gold, fontWeight: 700, marginBottom: 14 }}>
          WHAT THE DATA SHOWS
        </p>
        {insights.map((ins, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "16px 18px",
            marginBottom: i < insights.length - 1 ? 12 : 0, borderLeft: `3px solid ${ins.color}`,
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(10px)",
            transition: `opacity 0.4s ease-out ${0.4 + i * 0.2}s, transform 0.4s ease-out ${0.4 + i * 0.2}s`,
          }}>
            <p style={{ fontFamily: F.serif, fontSize: 17, marginBottom: 4 }}>{ins.title}</p>
            <p style={{ fontFamily: F.sans, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionGapMap() {
  const { ref, visible } = useFadeIn(0.1);
  const refParam = useRefParam();
  const orgName = orgFromRef(refParam);
  const provinces = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "NL", "Natl"];
  const categories = ["Funding", "Accel.", "Advisory", "Training"];
  type Level = "strong" | "ok" | "weak" | "gap";
  const colors: Record<Level, string> = { strong: "#4CAF50", ok: "#8BC34A", weak: "#FFB74D", gap: "#EF5350" };
  const data: Level[][] = [
    ["ok", "weak", "ok", "weak"],
    ["strong", "ok", "weak", "weak"],
    ["ok", "weak", "gap", "gap"],
    ["weak", "weak", "gap", "gap"],
    ["strong", "strong", "ok", "ok"],
    ["ok", "weak", "weak", "weak"],
    ["weak", "gap", "gap", "gap"],
    ["weak", "weak", "gap", "gap"],
    ["weak", "gap", "gap", "gap"],
    ["strong", "strong", "ok", "ok"],
  ];

  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 6, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        Where the ecosystem is strong. Where it's not.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.1s",
      }}>
        The first bird's-eye coverage map of Canada's agtech ecosystem.
      </p>
      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(30px)",
        transition: "opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 11, tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 4px", textAlign: "left", color: C.muted, fontWeight: 600, width: 44 }} />
              {categories.map(c => (
                <th key={c} style={{ padding: "6px 4px", textAlign: "center", color: C.muted, fontWeight: 600, fontSize: 11 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {provinces.map((p, pi) => (
              <tr key={p}>
                <td style={{ padding: "4px 4px", fontWeight: 600, color: C.green, fontSize: 12 }}>{p}</td>
                {data[pi].map((level, ci) => (
                  <td key={ci} style={{ padding: "3px 4px", textAlign: "center" }}>
                    <div style={{
                      width: "100%", maxWidth: 32, height: 24, borderRadius: 4, margin: "0 auto",
                      background: colors[level], opacity: 0.85,
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {(["strong", "ok", "weak", "gap"] as Level[]).map(l => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.muted, fontFamily: F.sans }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[l], opacity: 0.85 }} />
              {l === "strong" ? "Strong" : l === "ok" ? "OK" : l === "weak" ? "Weak" : "Gap"}
            </div>
          ))}
        </div>
      </div>

      {orgName === "Bioenterprise" && (
        <div style={{
          marginTop: 20, padding: "14px 16px", background: "#FBF7ED",
          border: `1.5px solid ${C.gold}`, borderRadius: 10,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
          transition: "opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s",
        }}>
          <p style={{ fontFamily: F.sans, fontSize: 11, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            FOR BIOENTERPRISE
          </p>
          <p style={{ fontFamily: F.serif, fontSize: 17, color: C.green, lineHeight: 1.35 }}>
            This is the gap your programs already fill.
          </p>
        </div>
      )}

      <div style={{
        marginTop: orgName === "Bioenterprise" ? 14 : 24, background: C.cardBg, borderRadius: 8, padding: "18px 20px", border: `1px solid ${C.border}`,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.35s",
      }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: F.serif, fontSize: 16, color: C.green }}>Ontario · Accelerator · Scale </span>
          <Tag bg="#FEF2F2" color="#991B1B">Gap · 0 programs</Tag>
        </div>
        <div style={{ background: "linear-gradient(135deg, #2D2438, #3D3248)", borderRadius: 10, padding: "16px 18px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #5B4A6B, #7A6A8A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.sans, letterSpacing: "0.05em" }}>AI ANALYSIS</span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#fef3c7", color: "#92400e", fontFamily: F.sans }}>Stage Mismatch</span>
          </div>
          <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, fontFamily: F.sans, color: "#8A7A9A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Why</p>
          <p style={{ fontSize: 12, color: "#D8D0E0", lineHeight: 1.55, marginBottom: 10, fontFamily: F.sans }}>
            Ontario's 24 accelerator programs are concentrated at early stages — SaaS and deep-tech timelines that don't fit agricultural seasonality. Scaling agtech falls into a structural blind spot.
          </p>
          <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, fontFamily: F.sans, color: "#8CC63F", textTransform: "uppercase", letterSpacing: "0.08em" }}>Opportunity</p>
          <p style={{ fontSize: 12, color: "#D8D0E0", lineHeight: 1.55, fontFamily: F.sans }}>
            Real opportunity for an Ontario operator to launch a scale-stage agtech cohort — in partnership with Bioenterprise or through a new program.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button style={{ background: "#E8F5E9", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontFamily: F.sans, color: C.green, fontWeight: 600, cursor: "pointer" }}>Looks right</button>
          <button style={{ background: "#FFF3E0", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontFamily: F.sans, color: "#E65100", fontWeight: 600, cursor: "pointer" }}>Not quite</button>
        </div>
      </div>

    </div>
  );
}

function SectionCommunity() {
  const { ref, visible } = useFadeIn(0.1);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % 4), 2200);
    return () => clearInterval(id);
  }, [visible]);

  const touchpoints = [
    {
      label: "Suggest a correction",
      sub: "on every program page",
      mockup: (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: F.sans }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 3 }}>Bioenterprise Canada</div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>ON · Accelerator</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.gold, fontWeight: 600, background: "#FFF8E7", padding: "3px 8px", borderRadius: 12 }}>
            + Suggest a correction
          </div>
        </div>
      ),
    },
    {
      label: "Interest tracking",
      sub: "per program in the pathway",
      mockup: (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: F.sans }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 6 }}>AAFC AgriInnovate</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "★ Interested", bg: "#fef3c7", color: "#92400e" },
              { label: "✓ Applied", bg: "#dcfce7", color: "#166534" },
              { label: "✕ Not for me", bg: "#f0f0ec", color: "#555560" },
            ].map((b, i) => (
              <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: b.bg, color: b.color, fontWeight: 600 }}>{b.label}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "AI analysis feedback",
      sub: "on every gap explanation",
      mockup: (
        <div style={{ background: "linear-gradient(135deg, #2D2438, #3D3248)", borderRadius: 8, padding: "10px 12px", fontFamily: F.sans, color: "#fff" }}>
          <div style={{ fontSize: 10, color: "#8CC63F", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 5 }}>AI ANALYSIS</div>
          <div style={{ fontSize: 10, color: "#D8D0E0", marginBottom: 7, lineHeight: 1.45 }}>Is this analysis accurate?</div>
          <div style={{ display: "flex", gap: 5 }}>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#D8D0E0", border: "1px solid rgba(255,255,255,0.2)" }}>👍 Looks right</span>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#D8D0E0", border: "1px solid rgba(255,255,255,0.2)" }}>👎 Not quite</span>
          </div>
        </div>
      ),
    },
    {
      label: "Something wrong or missing?",
      sub: "fixed feedback bar on every page",
      mockup: (
        <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: F.sans, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
            💬 Something wrong or missing? Tell us →
          </div>
        </div>
      ),
    },
  ];

  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600, marginBottom: 8,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        BUILT WITH OPERATORS
      </p>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 12, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
      }}>
        This is how Trellis gets smarter.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.25s",
      }}>
        Operators flag what's right. We fix what's not. Every page has a way to tell us.
      </p>

      {/* Active feedback surface (cycles) */}
      <div style={{
        background: "#fff", border: `2px solid ${C.gold}`, borderRadius: 12,
        padding: "18px 18px", marginBottom: 20, minHeight: 140,
        boxShadow: "0 4px 20px rgba(196,160,82,0.15)",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
        transition: "opacity 0.5s ease-out 0.35s, transform 0.5s ease-out 0.35s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.gold, animation: "pulse 1.2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, color: C.gold, fontWeight: 700, fontFamily: F.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {touchpoints[activeIdx].label}
          </span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: F.sans, marginLeft: "auto" }}>
            {touchpoints[activeIdx].sub}
          </span>
        </div>
        <div key={activeIdx} style={{ animation: "fadeIn 0.4s ease" }}>
          {touchpoints[activeIdx].mockup}
        </div>
      </div>

      {/* Dots showing which surface is active */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 6,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.5s",
      }}>
        {touchpoints.map((_, i) => (
          <div key={i} style={{
            width: i === activeIdx ? 20 : 6, height: 6, borderRadius: 3,
            background: i === activeIdx ? C.gold : C.border,
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

function RoadmapItem({ name, desc, delay }: { name: string; desc: string; delay: number }) {
  const { ref, visible } = useFadeIn(0.1);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setExpanded(true), 600);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <div ref={ref} style={{
      marginBottom: 16,
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
      transition: `opacity 0.4s ease-out ${delay}ms, transform 0.4s ease-out ${delay}ms`,
    }}>
      <p style={{
        fontFamily: F.serif, fontSize: expanded ? 17 : 24, color: C.green,
        transition: "font-size 0.4s ease",
      }}>{name}</p>
      <p style={{
        fontFamily: F.sans, fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 4,
        opacity: expanded ? 0.8 : 0, maxHeight: expanded ? 60 : 0, overflow: "hidden",
        transition: "opacity 0.4s ease 0.2s, max-height 0.4s ease",
      }}>{desc}</p>
    </div>
  );
}

function SectionCalling() {
  const { ref, visible } = useFadeIn(0.1);
  const roles = [
    { emoji: "🏛", label: "Program operators", sub: "Tell us what we got wrong about your program" },
    { emoji: "🌱", label: "Scrappy founders", sub: "What got you through the gap nobody funded?" },
    { emoji: "🌾", label: "Agronomists & CCAs", sub: "The advisor channel we can't map without you" },
    { emoji: "🚜", label: "Program alumni", sub: "Was it worth the paperwork? Tell the next cohort" },
  ];
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % roles.length), 2000);
    return () => clearInterval(id);
  }, [visible, roles.length]);

  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600, marginBottom: 8,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        CURRENTLY IN BETA
      </p>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 12, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
      }}>
        Kick the tires. Tell us where it breaks.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.25s",
      }}>
        We built it from public data. You know what's missing. We need honest eyes across the ecosystem.
      </p>

      <div style={{
        background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "24px 20px", minHeight: 180,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
        transition: "opacity 0.5s ease-out 0.35s, transform 0.5s ease-out 0.35s",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {roles.map((r, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                opacity: i === activeIdx ? 1 : 0.35,
                transform: i === activeIdx ? "scale(1.1)" : "scale(1)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 4 }}>{r.emoji}</div>
              <div style={{
                fontFamily: F.sans, fontSize: 9, color: i === activeIdx ? C.green : C.muted,
                fontWeight: i === activeIdx ? 700 : 500, lineHeight: 1.3,
              }}>
                {r.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", minHeight: 50 }}>
          <div key={activeIdx} style={{ animation: "fadeIn 0.4s ease" }}>
            <p style={{ fontFamily: F.serif, fontSize: 18, color: C.green, marginBottom: 6 }}>
              {roles[activeIdx].label}
            </p>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: C.muted, lineHeight: 1.5, fontStyle: "italic" }}>
              "{roles[activeIdx].sub}"
            </p>
          </div>
        </div>
      </div>

      <p style={{
        fontFamily: F.sans, fontSize: 12, color: C.muted, textAlign: "center", marginTop: 16, lineHeight: 1.6, fontStyle: "italic",
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out 0.5s",
      }}>
        Every correction, every conversation, makes the next founder's pathway sharper.
      </p>
    </div>
  );
}

function IntelligenceEngineCard({ visible }: { visible: boolean }) {
  const sources = [
    { type: "Podcast", label: "RealAg Radio — April 14", finding: "New Alberta Innovates voucher batch opening May 2026" },
    { type: "Press", label: "OMAFRA announcement", finding: "GOAH cohort 7 applications close June 3" },
    { type: "Website", label: "Bioenterprise Canada", finding: "SmartGrowth Program intake confirmed for Q3" },
    { type: "Conference", label: "Canadian AgTech Hub 2026", finding: "3 new Scale-stage investor partnerships flagged" },
    { type: "Roundtable", label: "Bioenterprise National Series", finding: "Advisor channel gap confirmed across Atlantic region" },
  ];
  const [idx, setIdx] = useState(0);
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    if (!visible) return;
    const scanTimer = setInterval(() => {
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        setIdx(i => (i + 1) % sources.length);
      }, 1100);
    }, 3400);
    return () => clearInterval(scanTimer);
  }, [visible, sources.length]);

  const current = sources[idx];
  return (
    <div style={{
      background: "linear-gradient(135deg, #2D2438, #3D3248)",
      borderRadius: 12, padding: "18px 20px", border: "1px solid #4D4458",
      marginBottom: 28, color: "#fff",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #5B4A6B, #7A6A8A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ animation: scanning ? "pulse 1.2s ease-in-out infinite" : "none" }}>
            <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#8CC63F" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: F.sans, color: "#EDE9F0", letterSpacing: "0.03em" }}>
            Intelligence Engine
          </div>
          <div style={{ fontSize: 10, fontFamily: F.sans, color: "#8CC63F", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "#8CC63F", animation: "pulse 1.2s ease-in-out infinite" }} />
            {scanning ? "Scanning…" : "New insight captured"}
          </div>
        </div>
      </div>

      <div style={{ minHeight: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, opacity: scanning ? 0.4 : 1, transition: "opacity 0.3s ease" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "#5B4A6B", color: "#EDE9F0", fontFamily: F.sans, textTransform: "uppercase", letterSpacing: "0.05em" }}>{current.type}</span>
          <span style={{ fontSize: 11, fontFamily: F.sans, color: "#A098A8" }}>{current.label}</span>
        </div>
        <p style={{ fontSize: 13, fontFamily: F.sans, color: "#D8D0E0", lineHeight: 1.55, opacity: scanning ? 0.3 : 1, transition: "opacity 0.3s ease" }}>
          {current.finding}
        </p>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontFamily: F.sans, color: "#8A7A9A", lineHeight: 1.5 }}>
        Daily scraping across podcasts, press releases, conferences, and program websites. Every finding feeds the database.
      </div>
    </div>
  );
}

function SectionRoadmap() {
  const { ref, visible } = useFadeIn(0.1);
  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600, marginBottom: 8,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        GETTING BETTER EVERY WEEK
      </p>
      <h2 style={{
        fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 32px)", color: C.green, marginBottom: 24, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
      }}>
        A database that learns while you sleep.
      </h2>

      <IntelligenceEngineCard visible={visible} />

      <p style={{
        fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600, marginTop: 40, marginBottom: 8,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.3s",
      }}>
        ON THE ROADMAP
      </p>
      <h3 style={{
        fontFamily: F.serif, fontSize: "clamp(20px, 4.5vw, 26px)", color: C.green, marginBottom: 20, lineHeight: 1.2,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.4s",
      }}>
        What's next? Tell us.
      </h3>
      <RoadmapItem name="Company profiles" desc="Pre-researched data on 100+ Canadian agtech companies" delay={0} />
      <RoadmapItem name="Pilot-readiness scores" desc="Which programs are open, competitive, or oversubscribed" delay={150} />
      <RoadmapItem name="Practitioner interviews" desc="Anonymous founder feedback on what programs actually deliver" delay={300} />
      <RoadmapItem name="Advisor channel directory" desc="The agronomists and CCAs who actually move the needle on adoption" delay={450} />
    </div>
  );
}

function SectionCTA() {
  const { ref, visible } = useFadeIn(0.2);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const refParam = params.get("ref");
  const orgName = orgFromRef(refParam);
  const ctaUrl = refParam ? `https://trellisag.ca/?ref=${refParam}&mode=operator` : "https://trellisag.ca";
  const displayUrl = refParam ? `trellisag.ca/?ref=${refParam}&mode=operator` : "trellisag.ca";

  return (
    <div style={{ background: C.bg }}>
      <div ref={ref} style={{ padding: "56px 24px 80px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: "min(180px, 50%)", margin: "0 auto 20px",
          opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.92)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}><TrellisLogoSvg width={180} /></div>
        {orgName && (
          <p style={{
            fontFamily: F.sans, fontSize: 12, color: C.gold, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.1s",
          }}>
            A note for {orgName}
          </p>
        )}
        <p style={{
          fontFamily: F.serif, fontSize: "clamp(20px, 5vw, 28px)", color: C.green, lineHeight: 1.35, marginBottom: 4,
          opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.15s",
        }}>
          {orgName ? `See where ${orgName}'s programs appear in founder pathways.` : "See where your programs appear in founder pathways."}
        </p>
        {orgName && (
          <p style={{
            fontFamily: F.sans, fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 10, marginBottom: 4,
            opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.2s",
          }}>
            We built this because Canada's agtech ecosystem deserves better navigation. Your feedback makes it sharper.
          </p>
        )}
        <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="cta-pulse" style={{
          display: "inline-block", marginTop: 20, background: C.green, color: "#fff",
          borderRadius: 8, padding: "16px 40px", fontFamily: F.sans, fontWeight: 600,
          fontSize: 17, textDecoration: "none",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(8px)",
          transition: "opacity 0.4s ease-out 0.25s, transform 0.4s ease-out 0.25s",
        }}>
          Try it yourself &rarr;
        </a>
        <p style={{
          fontFamily: F.sans, fontSize: 13, color: C.muted, marginTop: 14,
          opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.4s",
        }}>
          Your link: {displayUrl}
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", fontFamily: F.sans }}>
      <div style={{ background: C.bg }}>
        <SectionOpening />
        <SectionReveal />
        <SectionFounder />
        <SectionPathway />
        <SectionGoDeeper />
        <SectionTransition />
        <SectionOperatorPivot />
      </div>
      <div style={{ background: C.bgWarm, transition: "background 0.5s ease" }}>
        <SectionOperatorDashboard />
        <SectionGapMap />
        <SectionCommunity />
        <SectionCalling />
        <SectionRoadmap />
      </div>
      <SectionCTA />
    </div>
  );
}

export default App;
