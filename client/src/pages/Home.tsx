import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);

  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((d: any[]) => setCount(d.length))
      .catch(() => {});

    // Show beta modal if ?beta=1 in URL or first visit
    try {
      const params = new URLSearchParams(window.location.search);
      const isBeta = params.get("beta") === "1";
      const seen = sessionStorage.getItem("ag_home_seen");
      if (isBeta || !seen) {
        setShowBetaModal(true);
      }
    } catch { setShowBetaModal(true); }
  }, []);

  function dismissModal(mode: "e" | "ec") {
    try {
      sessionStorage.setItem("ag_home_seen", "1");
      localStorage.setItem("ag_nav_mode", mode);
    } catch {}
    setShowBetaModal(false);
    window.location.href = "/navigator";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font)" }}>

      {/* ── Beta Welcome Modal ─────────────────────────────────── */}
      {showBetaModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
          animation: "fadeIn 0.3s ease",
        }}>
          <div style={{
            background: "var(--bg)", borderRadius: "var(--radius-lg)",
            maxWidth: 520, width: "100%",
            boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            overflow: "hidden",
            animation: "slideUp 0.4s ease",
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(145deg, #0a1f08, #14330c, #1e5510)",
              padding: "24px 28px 20px",
              color: "#fff",
            }}>
              <div style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)", marginBottom: 8,
              }}>Beta Preview</div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem", fontWeight: 400, lineHeight: 1.2, marginBottom: 8,
              }}>Welcome — you're one of the first to try this.</h2>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                This tool matches Canadian agtech companies to the right programs — accelerators, funding, pilot sites — based on stage and province.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 28px 28px" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                <p style={{ marginBottom: 10 }}>
                  We track <strong style={{ color: "var(--text)" }}>{count || 283} programs</strong> across every province, updated regularly. Born from conversations with Bioenterprise, AgSphere, and dozens of founders who said: <strong style={{ color: "var(--text)" }}>"I don't know what I don't know."</strong>
                </p>
                <p>
                  <strong style={{ color: "var(--text)" }}>Your honest feedback is what makes this better.</strong> If something's wrong, missing, or off-base — tell us.
                </p>
              </div>

              {/* Two clear paths */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => dismissModal("e")}
                  style={{
                    background: "linear-gradient(135deg, var(--green-mid), var(--green-light))",
                    color: "#fff", border: "none", borderRadius: "var(--radius)",
                    padding: "14px 20px", textAlign: "left",
                    boxShadow: "0 4px 16px rgba(30,107,10,0.25)",
                    transition: "transform 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 3 }}>I'm building an agtech company →</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Get a personalized pathway in 30 seconds</div>
                </button>

                <button onClick={() => dismissModal("ec")}
                  style={{
                    background: "var(--bg-secondary)", color: "var(--text)",
                    border: "1px solid var(--border-strong)", borderRadius: "var(--radius)",
                    padding: "14px 20px", textAlign: "left",
                    transition: "transform 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 3 }}>I run a program, accelerator, or funding body →</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Review ecosystem data, check your listing, find gaps</div>
                </button>
              </div>

              <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: 14, textAlign: "center" }}>
                No signup required · Free during beta
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0,
        background: "rgba(250,250,248,0.88)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, var(--green-mid), var(--green-light))",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(30,107,10,0.2)",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C5 1.5 3 3 3 5.5c0 2 1.5 3.5 4 6 2.5-2.5 4-4 4-6 0-2.5-2-4-4-4z" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)", letterSpacing: "-0.02em" }}>
            CDN Ag Innovator
          </span>
        </div>
        <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: "0.02em" }}>
          🇨🇦 Canada
        </span>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "56px 24px 48px",
      }}>
        {/* Status pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "var(--green-soft)", border: "1px solid rgba(30,107,10,0.12)",
          borderRadius: 100, padding: "5px 16px", marginBottom: 28,
          animation: "fadeInUp 0.6s ease",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-accent)", boxShadow: "0 0 8px rgba(61,204,26,0.4)" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--green-mid)", letterSpacing: "0.01em" }}>
            {count !== null ? `${count} programs tracked across Canada` : "Loading…"}
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 5vw, 3.4rem)",
          fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.12,
          color: "var(--text)", maxWidth: 640, marginBottom: 18,
          textAlign: "center",
          animation: "fadeInUp 0.6s ease 0.1s both",
        }}>
          Your agtech company<br />
          <span style={{ color: "var(--green-mid)" }}>deserves a roadmap.</span>
        </h1>

        <p style={{
          fontSize: "1.05rem", color: "var(--text-secondary)",
          maxWidth: 480, lineHeight: 1.65, marginBottom: 44,
          textAlign: "center", fontWeight: 400,
          animation: "fadeInUp 0.6s ease 0.2s both",
        }}>
          Tell us your stage, province, and biggest need.
          Get a personalized pathway to the programs that actually fit.
        </p>

        {/* ── Two clear CTA cards ─────────────────────────────── */}
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center",
          maxWidth: 640, width: "100%", marginBottom: 56,
          animation: "fadeInUp 0.6s ease 0.3s both",
        }}>
          {/* Founder card */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
            style={{
              flex: "1 1 280px", background: "linear-gradient(135deg, var(--green-mid), var(--green-light))",
              borderRadius: "var(--radius)",
              padding: "24px 22px", textDecoration: "none", textAlign: "left",
              boxShadow: "0 4px 24px rgba(30,107,10,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: "transform 0.15s, box-shadow 0.15s",
              color: "#fff",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>For AgTech Companies</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em", lineHeight: 1.3 }}>I'm building an agtech product</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 18 }}>
              Answer 4 questions. Get a personalized pathway to the accelerators, funding, and pilot sites that match your stage and province.
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.18)", borderRadius: 7, padding: "8px 14px",
              fontSize: "0.78rem", fontWeight: 700, color: "#fff",
            }}>
              Build My Pathway →
            </div>
          </Link>

          {/* Ecosystem operator card */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "ec"); } catch {} }}
            style={{
              flex: "1 1 280px", background: "var(--bg)",
              border: "1.5px solid var(--border-strong)",
              borderRadius: "var(--radius)", padding: "24px 22px",
              textDecoration: "none", textAlign: "left",
              boxShadow: "var(--shadow-md)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
          >
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>For Programs & Ecosystem</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em", lineHeight: 1.3 }}>I run a program, fund, or accelerator</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 18 }}>
              Review your listing, explore coverage gaps, check how you appear in founder pathways, and submit updates.
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--green-mid)", borderRadius: 7, padding: "8px 14px",
              fontSize: "0.78rem", fontWeight: 700, color: "#fff",
            }}>
              Explore Ecosystem →
            </div>
          </Link>
        </div>

        {/* Value props */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16, maxWidth: 700, width: "100%", marginBottom: 48,
          animation: "fadeInUp 0.6s ease 0.4s both",
        }}>
          {[
            { icon: "🎯", title: "Matched to you", desc: "Programs filtered by your stage, province, product type, and actual needs" },
            { icon: "🗺", title: "Ordered pathway", desc: "Not a list — a sequence of what to do first, next, and later" },
            { icon: "⚠️", title: "Gap warnings", desc: "We flag when your province is missing critical support" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "18px 16px",
            }}>
              <div style={{ fontSize: "1.2rem", marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Category tags */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
          {["Accelerators", "Funding", "Pilot Sites", "Events", "Industry Orgs", "Training"].map(cat => (
            <span key={cat} style={{
              fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500,
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: 100, padding: "4px 12px",
            }}>{cat}</span>
          ))}
        </div>

        <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 12 }}>
          Built by{" "}
          <a href="https://bestinshow.ag" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-mid)", fontWeight: 600 }}>BestInShow</a>
          {" "}· Powered by AI · Free during beta
        </p>
      </main>
    </div>
  );
}
