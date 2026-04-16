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
      <text x="46" y="46" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="8" fontWeight="500" letterSpacing="0.08em" textTransform="uppercase" fill="#999">Canada's AgTech Ecosystem</text>
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
  const p497 = useCountUp(497, visible);
  const p167 = useCountUp(167, visible);
  return (
    <div ref={ref} style={{ padding: "48px 24px 56px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        margin: "0 auto 24px", maxWidth: 220,
        opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.92)",
        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
      }}>
        <TrellisLogoSvg width={220} />
      </div>
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
  const fullText = "Nanotechnology-enabled crop protection. Polymer delivery platform for biologicals.";
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
  const bottlenecks = ["Dealers & distribution", "Go-to-market strategy", "Growth capital", "Regulatory", "Talent"];

  return (
    <>
      <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontFamily: F.sans, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", color: C.gold, fontWeight: 600 }}>
          THE FOUNDER EXPERIENCE
        </p>
        <h2 style={{ fontFamily: F.serif, fontSize: "clamp(24px, 5vw, 36px)", color: C.green, marginTop: 6, marginBottom: 24, lineHeight: 1.2 }}>
          30 seconds. 4 questions. A personalized pathway.
        </h2>

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
                border: s === "Scaling" && selectedStage ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                background: s === "Scaling" && selectedStage ? "#FBF7ED" : "#fff",
                color: C.text, fontWeight: s === "Scaling" && selectedStage ? 600 : 400,
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
                background: b === "Growth capital" && selectedBottle ? C.green : "#fff",
                color: b === "Growth capital" && selectedBottle ? "#fff" : C.text,
                border: b === "Growth capital" && selectedBottle ? "none" : `1px solid ${C.border}`,
                fontWeight: b === "Growth capital" && selectedBottle ? 600 : 400,
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
            <img src={logo} alt="Trellis" style={{ width: "min(140px, 40%)", margin: "0 auto 28px", display: "block", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: "80%", maxWidth: 360, background: "#E8E5DD", borderRadius: 20, height: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.green, borderRadius: 20, width: `${progress}%`, transition: "width 0.08s linear" }} />
            </div>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginTop: 16 }}>
              {progress < 25 ? "Scanning programs across Canada..." : progress < 50 ? "Matching to your stage and province..." : progress < 75 ? "Filtering by growth capital needs..." : "Building your pathway..."}
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
    { num: 1, name: "BDC Industrial Innovation Venture Fund II", desc: "Apply for Series A+ funding from BDC's $200M fund targeting AgTech at scale stage.", tags: [{ label: "Funding", bg: "#E8F5E9" }, { label: "Do now", bg: "#FFF8E1" }, { label: "Strong fit", bg: "#E8F5E9" }] },
    { num: 2, name: "AAFC AgriInnovate", desc: "Secure up to $5M in non-dilutive, interest-free funding to accelerate commercialization.", tags: [{ label: "Funding", bg: "#E8F5E9" }, { label: "Do now", bg: "#FFF8E1" }] },
    { num: 3, name: "Canadian Association of Agri-Retailers (CAAR)", desc: "Build distribution partnerships through the national retailer network.", tags: [{ label: "Industry Org", bg: "#F3E8FF" }, { label: "This month", bg: "#FFF8E1" }, { label: "Strong fit", bg: "#E8F5E9" }] },
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
    </div>
  );
}

function SectionGoDeeper() {
  const { ref, visible } = useFadeIn(0.15);
  const [typingIdx, setTypingIdx] = useState(0);
  const [showPrep, setShowPrep] = useState([false, false, false]);
  const responseTitle = "BDC Industrial Innovation Venture Fund II — How to Prepare";
  const preps = [
    { title: "Financial Package", detail: "Series A pitch deck with commercialization metrics and regulatory pathway clarity" },
    { title: "Technical Validation", detail: "Third-party efficacy data for your polymer delivery system across crop types" },
    { title: "Market Positioning", detail: "Competitive analysis showing differentiation from conventional crop protection" },
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
          Tell me how to approach the BDC fund &rarr;
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
        Not a directory. Not a chatbot. A system built on verified data.
      </h2>
      <p style={{
        fontFamily: F.sans, fontSize: 15, color: C.text, lineHeight: 1.7, marginTop: 12,
        opacity: visible ? 0.75 : 0, transform: visible ? "none" : "translateY(10px)",
        transition: "opacity 0.4s ease-out 0.2s, transform 0.4s ease-out 0.2s",
      }}>
        Every program verified against federal and provincial databases. Filtered to your stage, province, and sector.
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
    { title: "The Scale Cliff", body: "The ecosystem builds founders up through idea and pilot stages — then drops them. 51% drop in available programs between pilot and scale.", color: "#C62828" },
    { title: "Alberta's Paradox", body: "76 programs across the province. Only 1 specifically for scale-stage agtech companies.", color: "#E65100" },
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

  const [feedbackStep, setFeedbackStep] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setFeedbackStep(p => (p + 1) % 3), 2500);
    return () => clearInterval(id);
  }, [visible]);

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

      <div style={{
        marginTop: 24, background: C.cardBg, borderRadius: 8, padding: "18px 20px", border: `1px solid ${C.border}`,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.35s",
      }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: F.serif, fontSize: 16, color: C.green }}>BC Training </span>
          <Tag bg="#FFF3E0" color="#E65100">Weak · 1 program</Tag>
        </div>
        <div style={{ background: C.green, borderRadius: 8, padding: "16px 18px", color: "#fff" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.gold, fontWeight: 700, marginBottom: 8, fontFamily: F.sans }}>AI ANALYSIS</p>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, fontFamily: F.sans }}>WHY</p>
          <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6, marginBottom: 10, fontFamily: F.sans }}>
            BC relies entirely on the BC Institute of Agrologists for ag training — concentration risk. No agtech-specific training programs exist.
          </p>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, fontFamily: F.sans }}>OPPORTUNITY</p>
          <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6, fontFamily: F.sans }}>
            Strong opportunity to develop agtech-specific training leveraging BC's existing tech ecosystem.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button style={{ background: "#E8F5E9", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontFamily: F.sans, color: C.green, fontWeight: 600, cursor: "pointer" }}>Looks right</button>
          <button style={{ background: "#FFF3E0", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontFamily: F.sans, color: "#E65100", fontWeight: 600, cursor: "pointer" }}>Not quite</button>
        </div>
      </div>

      <div style={{
        marginTop: 20, textAlign: "center", minHeight: 48,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.5s",
      }}>
        <p style={{ fontFamily: F.sans, fontSize: 13, color: C.gold, fontStyle: "italic", marginBottom: 10 }}>
          This is how Trellis gets smarter. Operators flag what's right. We fix what's not.
        </p>
        <div style={{ position: "relative", height: 36, overflow: "hidden" }}>
          {[
            <span key={0} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ background: "#E8F5E9", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.sans, color: C.green, fontWeight: 600 }}>Looks right 👍</span>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: F.sans }}>clicked</span>
            </span>,
            <span key={1} style={{ fontSize: 12, fontFamily: F.sans, color: C.muted, fontStyle: "italic" }}>
              "Missing: SAIT AgTech program in AB"
            </span>,
            <span key={2} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ background: "#FFF3E0", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.sans, color: "#E65100", fontWeight: 600 }}>Not quite 👎</span>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: F.sans }}>correction sent</span>
            </span>,
          ].map((el, i) => (
            <div key={i} style={{
              position: "absolute", top: 0, left: 0, right: 0,
              display: "flex", alignItems: "center", justifyContent: "center", height: 36,
              opacity: feedbackStep === i ? 1 : 0,
              transform: feedbackStep === i ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}>{el}</div>
          ))}
        </div>
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

function SectionRoadmap() {
  const { ref, visible } = useFadeIn(0.1);
  return (
    <div ref={ref} style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: F.sans, fontSize: 14, color: C.gold, fontWeight: 600, marginBottom: 20,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out",
      }}>
        Getting better every week.
      </p>
      <RoadmapItem name="Company profiles" desc="Pre-researched data on 100+ Canadian agtech companies" delay={0} />
      <RoadmapItem name="Pilot-readiness scores" desc="Which programs are open, competitive, or oversubscribed" delay={150} />
      <RoadmapItem name="Practitioner interviews" desc="Anonymous founder feedback on what programs actually deliver" delay={300} />
    </div>
  );
}

function SectionCTA() {
  const { ref, visible } = useFadeIn(0.2);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const refParam = params.get("ref");
  const ctaUrl = refParam ? `https://trellisag.ca/?ref=${refParam}&mode=operator` : "https://trellisag.ca";
  const displayUrl = refParam ? `trellisag.ca/?ref=${refParam}&mode=operator` : "trellisag.ca";

  return (
    <div style={{ background: C.bg }}>
      <div ref={ref} style={{ padding: "56px 24px 80px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <img src={logo} alt="Trellis" style={{
          width: "min(180px, 50%)", margin: "0 auto 20px", display: "block",
          opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.92)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }} />
        <p style={{
          fontFamily: F.serif, fontSize: "clamp(20px, 5vw, 28px)", color: C.green, lineHeight: 1.35, marginBottom: 4,
          opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.15s",
        }}>
          See where your programs appear in founder pathways.
        </p>
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
        <SectionRoadmap />
      </div>
      <SectionCTA />
    </div>
  );
}

export default App;
