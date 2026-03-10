import { useEffect, useState } from "react";
import { Link } from "wouter";

const s = {
  page: {
    minHeight: "100vh",
    background: "var(--green-dark)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    fontFamily: "var(--font)",
  },
  logo: { height: 48, marginBottom: 28 },
  tagline: {
    fontFamily: "var(--font-serif)",
    fontSize: "1.25rem",
    color: "var(--gold-light)",
    textAlign: "center" as const,
    maxWidth: 480,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  sub: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center" as const,
    marginBottom: 40,
  },
  cards: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
    justifyContent: "center",
    maxWidth: 700,
    width: "100%",
  },
  card: {
    flex: "1 1 280px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(197,165,90,0.3)",
    borderRadius: 12,
    padding: "24px 20px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.2s, border-color 0.2s",
  },
  cardLabel: {
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--gold)",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: 8,
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.5,
    marginBottom: 20,
  },
  btn: {
    display: "inline-block",
    background: "var(--gold)",
    color: "var(--green-dark)",
    fontWeight: 700,
    fontSize: "0.75rem",
    padding: "8px 16px",
    borderRadius: 6,
    textDecoration: "none",
  },
  count: {
    marginTop: 40,
    fontSize: "0.7rem",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center" as const,
  },
  footer: {
    marginTop: 48,
    fontSize: "0.65rem",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center" as const,
  },
};

export default function Home() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((d: any[]) => setCount(d.length))
      .catch(() => {});
  }, []);

  return (
    <div style={s.page}>
      <img src="/logo-wordmark.png" alt="Canadian Ag Innovation Navigator" style={s.logo} />
      <p style={s.tagline}>Find the right programs for your agtech company — faster.</p>
      <p style={s.sub}>Accelerators · Funding · Pilot Sites · Events · Industry Orgs</p>

      <div style={s.cards}>
        <Link
          href="/navigator"
          style={s.card}
          onClick={() => localStorage.setItem("ag_nav_mode", "e")}
        >
          <div style={s.cardLabel}>For Founders</div>
          <div style={s.cardTitle}>I'm building an agtech company</div>
          <div style={s.cardDesc}>
            Find accelerators, funding, pilot sites, and first-customer pathways matched to your stage and province.
          </div>
          <span style={s.btn}>Find My Fit →</span>
        </Link>

        <Link
          href="/navigator"
          style={s.card}
          onClick={() => localStorage.setItem("ag_nav_mode", "ec")}
        >
          <div style={s.cardLabel}>For Ecosystem Operators</div>
          <div style={s.cardTitle}>I work in ag innovation support</div>
          <div style={s.cardDesc}>
            Analyze ecosystem coverage, identify gaps, and understand the Canadian agtech support landscape.
          </div>
          <span style={s.btn}>Explore Ecosystem →</span>
        </Link>
      </div>

      {count !== null && (
        <p style={s.count}>{count} programs across Canada · updated regularly</p>
      )}

      <p style={s.footer}>
        A BestInShow project · <a href="mailto:justyn@bestinshow.ag" style={{ color: "inherit" }}>justyn@bestinshow.ag</a>
      </p>
    </div>
  );
}
