import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((d: any[]) => setCount(d.length))
      .catch(() => {});
  }, []);

  const cardHover = (e: React.MouseEvent, enter: boolean) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = enter ? "translateY(-2px)" : "translateY(0)";
    el.style.boxShadow = enter ? "var(--shadow-lg)" : "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font)" }}>
      {/* Nav */}
      <nav style={{
        padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: "var(--green-mid)", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C5 1.5 3 3 3 5.5c0 2 1.5 3.5 4 6 2.5-2.5 4-4 4-6 0-2.5-2-4-4-4z" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", letterSpacing: "-0.01em" }}>
            Ag Innovation Navigator
          </span>
        </div>
        <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 500 }}>Canada</span>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "72px 24px 56px", textAlign: "center",
      }}>
        {/* Status pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 100, padding: "4px 14px", marginBottom: 32,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34c759" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.01em" }}>
            {count !== null ? `${count} programs · updated regularly` : "Loading…"}
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font)",
          fontSize: "clamp(1.9rem, 4.5vw, 3rem)",
          fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1,
          color: "var(--text)", maxWidth: 580, marginBottom: 18,
        }}>
          Find the right programs<br />
          <span style={{ color: "var(--green-mid)" }}>for your agtech company.</span>
        </h1>

        <p style={{
          fontSize: "1rem", color: "var(--text-secondary)",
          maxWidth: 440, lineHeight: 1.65, marginBottom: 52, fontWeight: 400,
        }}>
          Accelerators, funding, pilot sites, and industry organizations — matched to your stage and province.
        </p>

        {/* Mode cards */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 660, width: "100%", marginBottom: 64 }}>

          {/* Founder */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
            style={{
              flex: "1 1 280px", background: "var(--green-mid)", borderRadius: "var(--radius)",
              padding: "26px 22px", textDecoration: "none", textAlign: "left",
              boxShadow: "0 4px 20px rgba(45,80,22,0.25)", transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => cardHover(e, true)}
            onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>For Founders</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.3 }}>I'm building an agtech company</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 22 }}>
              Get matched to accelerators, funding, and pilot sites for your stage and region.
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.18)", borderRadius: 7, padding: "7px 13px",
              fontSize: "0.78rem", fontWeight: 600, color: "#fff",
            }}>
              Find My Fit
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </Link>

          {/* Ecosystem */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "ec"); } catch {} }}
            style={{
              flex: "1 1 280px", background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "26px 22px",
              textDecoration: "none", textAlign: "left",
              boxShadow: "var(--shadow-sm)", transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => cardHover(e, true)}
            onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>For Ecosystem Operators</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.3 }}>I work in ag innovation support</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 22 }}>
              Analyze coverage gaps, stage distribution, and strategic opportunities across Canada.
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--green-mid)", borderRadius: 7, padding: "7px 13px",
              fontSize: "0.78rem", fontWeight: 600, color: "#fff",
            }}>
              Explore Ecosystem
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </Link>
        </div>

        {/* Category tags */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
          {["Accelerators", "Funding", "Pilot Sites", "Events", "Industry Orgs", "Training"].map(cat => (
            <span key={cat} style={{
              fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500,
              background: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: 100, padding: "3px 10px",
            }}>{cat}</span>
          ))}
        </div>

        <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 8 }}>
          A <a href="mailto:justyn@bestinshow.ag" style={{ color: "var(--green-mid)", fontWeight: 500 }}>BestInShow</a> project
        </p>
      </main>
    </div>
  );
}
