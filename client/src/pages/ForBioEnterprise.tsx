import { useEffect, useState } from "react";

const C = {
  green: "#2D5A3D",
  greenDark: "#1B4332",
  greenAccent: "#48B87A",
  chartreuse: "#8CC63F",
  gold: "#C4A052",
  goldDeep: "#D4A828",
  bg: "#FAFAF7",
  bgWarm: "#F5F0E8",
  text: "#1A1A1A",
  muted: "#6B7C6B",
  soft: "#8B8A82",
  cardBg: "#fff",
  border: "#E8E5E0",
  hairline: "#D9D4CB",
};

const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

function TrellisMarkSmall() {
  return (
    <svg viewBox="0 0 40 56" width={24} height={34} aria-label="Trellis" style={{ display: "block" }}>
      <g transform="translate(2, 4)">
        <line x1="6" y1="44" x2="6" y2="10" stroke={C.greenDark} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="44" x2="18" y2="10" stroke={C.greenDark} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="44" x2="30" y2="10" stroke={C.greenDark} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="1" y1="34" x2="35" y2="34" stroke={C.greenDark} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="22" x2="35" y2="22" stroke={C.greenDark} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="6" cy="34" r="2.6" fill={C.greenAccent} />
        <circle cx="18" cy="34" r="2.2" fill={C.greenAccent} opacity="0.9" />
        <circle cx="30" cy="34" r="1.9" fill={C.greenAccent} opacity="0.8" />
        <circle cx="6" cy="22" r="2.8" fill={C.chartreuse} />
        <circle cx="18" cy="22" r="2.4" fill={C.chartreuse} opacity="0.9" />
        <circle cx="30" cy="22" r="2" fill={C.chartreuse} opacity="0.7" />
        <circle cx="6" cy="10" r="2.4" fill={C.goldDeep} opacity="0.85" />
        <circle cx="18" cy="6" r="2" fill={C.goldDeep} opacity="0.65" />
        <circle cx="30" cy="2" r="1.6" fill={C.goldDeep} opacity="0.5" />
      </g>
    </svg>
  );
}

function Hairline({ accent = false }: { accent?: boolean }) {
  return (
    <div
      style={{
        height: 1,
        width: accent ? 56 : "100%",
        background: accent ? C.gold : C.hairline,
        margin: accent ? "0 auto" : "0",
      }}
    />
  );
}

function useFadeInOnMount(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

function Section({
  eyebrow,
  heading,
  children,
  delay = 0,
}: {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const visible = useFadeInOnMount(delay * 1000);

  return (
    <section
      style={{
        padding: "72px 28px 20px",
        maxWidth: 640,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(16px)",
        transition: `opacity 0.7s ease-out, transform 0.7s ease-out`,
      }}
    >
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 11,
          letterSpacing: "0.18em",
          fontWeight: 600,
          color: C.gold,
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(28px, 4.5vw, 40px)",
          color: C.greenDark,
          lineHeight: 1.15,
          margin: 0,
          marginBottom: 28,
          letterSpacing: "-0.005em",
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 17,
          lineHeight: 1.7,
          color: C.text,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        flexWrap: "wrap",
        padding: "48px 24px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TrellisMarkSmall />
        <span
          style={{
            fontFamily: F.serif,
            fontSize: 22,
            color: C.greenDark,
            letterSpacing: "0.005em",
          }}
        >
          Trellis
        </span>
      </div>
      <span style={{ color: C.hairline, fontFamily: F.sans, fontSize: 14 }}>×</span>
      <img
        src="/brand/bioenterprise-logo.svg"
        alt="BioEnterprise. Canada's Food and Agri-Tech Engine"
        style={{ height: 38, width: "auto", display: "block" }}
      />
      <span style={{ color: C.hairline, fontFamily: F.sans, fontSize: 14 }}>×</span>
      <img
        src="/brand/bestinshow-logo.png"
        alt="BestInShow. Trade Show Better."
        style={{ height: 42, width: "auto", display: "block" }}
      />
    </div>
  );
}

function Hero() {
  const visible = useFadeInOnMount(0);
  const v2 = useFadeInOnMount(250);
  const v3 = useFadeInOnMount(500);
  return (
    <div
      style={{
        padding: "80px 28px 24px",
        maxWidth: 820,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 11,
          letterSpacing: "0.24em",
          fontWeight: 600,
          color: C.muted,
          textTransform: "uppercase",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease-out",
          marginBottom: 32,
        }}
      >
        A working conversation · April 16, 2026
      </div>
      <h1
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(44px, 9vw, 86px)",
          color: C.greenDark,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          margin: 0,
          opacity: v2 ? 1 : 0,
          transform: v2 ? "none" : "translateY(18px)",
          transition: "opacity 0.9s ease-out, transform 0.9s ease-out",
        }}
      >
        Trellis,
        <br />
        <span style={{ color: C.gold }}>for BioEnterprise.</span>
      </h1>
      <p
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(18px, 2.2vw, 22px)",
          color: C.muted,
          lineHeight: 1.5,
          maxWidth: 560,
          margin: "32px auto 0",
          fontStyle: "italic",
          opacity: v3 ? 1 : 0,
          transition: "opacity 0.9s ease-out 0.2s",
        }}
      >
        A demo, a pressure-test, and an honest conversation
        about what Canada's food and agri-tech founders are actually trying to find.
      </p>
    </div>
  );
}

function CTA() {
  const visible = useFadeInOnMount(900);
  return (
    <div
      style={{
        padding: "96px 28px 40px",
        maxWidth: 640,
        margin: "0 auto",
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Hairline accent />
      </div>
      <p
        style={{
          fontFamily: F.serif,
          fontSize: "clamp(24px, 3.8vw, 32px)",
          color: C.greenDark,
          lineHeight: 1.25,
          margin: 0,
          marginBottom: 36,
        }}
      >
        Shall we?
      </p>
      <div
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <a
          href="/demo"
          style={{
            display: "inline-block",
            padding: "16px 28px",
            background: C.greenDark,
            color: "#fff",
            fontFamily: F.sans,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.01em",
            borderRadius: 6,
            textDecoration: "none",
            boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -10px rgba(27,67,50,0.35)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "none";
          }}
        >
          Start the walkthrough →
        </a>
        <a
          href="/navigator"
          style={{
            display: "inline-block",
            padding: "16px 28px",
            background: "transparent",
            color: C.greenDark,
            fontFamily: F.sans,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.01em",
            borderRadius: 6,
            textDecoration: "none",
            border: `1px solid ${C.border}`,
          }}
        >
          Or jump into the tool
        </a>
      </div>
    </div>
  );
}

function Colophon() {
  return (
    <footer
      style={{
        padding: "56px 28px 80px",
        maxWidth: 640,
        margin: "0 auto",
        textAlign: "center",
        borderTop: `1px solid ${C.hairline}`,
        marginTop: 40,
      }}
    >
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 11,
          letterSpacing: "0.22em",
          fontWeight: 600,
          color: C.muted,
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        In the room
      </div>
      <p
        style={{
          fontFamily: F.serif,
          fontSize: 18,
          lineHeight: 1.7,
          color: C.text,
          margin: 0,
          marginBottom: 24,
        }}
      >
        Dave Smardon&nbsp;·&nbsp;Carla Berquo&nbsp;·&nbsp;Alexis Aram<br />
        Tabitha Caswell&nbsp;·&nbsp;Laura Millson
      </p>
      <p
        style={{
          fontFamily: F.sans,
          fontSize: 13,
          color: C.soft,
          margin: 0,
          lineHeight: 1.7,
        }}
      >
        Justyn Szymczyk&nbsp;·&nbsp;TrellisAg.ca&nbsp;·&nbsp;BestInShow.ag<br />
        <span style={{ color: C.hairline }}>trellisag.ca/for/bioenterprise</span>
      </p>
    </footer>
  );
}

export default function ForBioEnterprise() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = "Trellis, for BioEnterprise";
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: F.sans,
        color: C.text,
        paddingBottom: 40,
      }}
    >
      <LogoStrip />
      <Hero />

      <div style={{ padding: "0 28px", maxWidth: 640, margin: "56px auto 0" }}>
        <Hairline accent />
      </div>

      <Section eyebrow="Who's talking" heading="A few words about the builder.">
        <p style={{ margin: "0 0 18px" }}>
          <strong style={{ color: C.greenDark, fontWeight: 700 }}>Justyn Szymczyk.</strong>{" "}
          Engineer by training. Twenty years in wine and viticulture. Revenue
          operations, DTC, the desk work that makes a vineyard actually make money.
          Plenty of time in cellars and fields too, rarely as the expert in them.
          My in-laws run a farm. You're the experts in the room today, not me.
        </p>
        <p style={{ margin: "0 0 18px" }}>
          A client engagement pulled me into agtech last year. I walked the floors
          at Ag Days in Brandon and World Ag Expo in California and watched founders
          burn real money on booths that weren't converting. So I started a
          practice called BestInShow.ag, helping early-stage agtech companies
          turn trade shows into pipeline. That's the paid work. Trellis is not.
        </p>
      </Section>

      <Section eyebrow="How this happened" heading="I built it for one customer. Then I kept going." delay={0.05}>
        <p style={{ margin: "0 0 18px" }}>
          The first version of Trellis was built for exactly one person:
          Kevin Shearer at StoneSite. He wanted help finding grants for a
          soil biology platform. I wrote a small matching tool so he'd stop
          losing evenings to Google. He used it, said roughly "holy shit,
          this is good," and that was the tell.
        </p>
        <p style={{ margin: "0 0 0" }}>
          I took a rough beta to the Calgary AgTech Summit in February to
          pressure-test it. The reaction was consistent: the tool needs to
          exist, it's too hard, nobody will build it. Which made me want to
          build it more. Meanwhile, everyone was calling for it on paper.
          BioEnterprise's National Roundtable flagged navigation as a top
          unsolved problem. RBC's agtech report said the same thing in more
          polite language. So I built it. No funding, no team, no mandate.
          Working hypothesis: if it should exist, it should be free, and it
          should be done by someone who doesn't need to monetize the founders
          using it.
        </p>
      </Section>

      <Section eyebrow="What today is" heading="Three things, roughly in order." delay={0.05}>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontFamily: F.serif,
              fontSize: 22,
              color: C.greenDark,
              marginBottom: 6,
            }}
          >
            1. A walkthrough.
          </div>
          <p style={{ margin: 0, color: C.muted, fontSize: 16, lineHeight: 1.65 }}>
            I'll run the founder experience the way a real founder runs it,
            then flip to the operator view, where I think BioEnterprise
            specifically will have opinions. Fifteen minutes.
          </p>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontFamily: F.serif,
              fontSize: 22,
              color: C.greenDark,
              marginBottom: 6,
            }}
          >
            2. A pressure-test.
          </div>
          <p style={{ margin: 0, color: C.muted, fontSize: 16, lineHeight: 1.65 }}>
            Trellis is built on public sources, and it is not perfect.
            Some programs are miscategorized. Some are missing. Some of what
            the AI concludes about Ontario, you'll disagree with. I'd rather
            hear it today than read about it later. Every correction you see
            in the tool works in real time.
          </p>
        </div>
        <div>
          <div
            style={{
              fontFamily: F.serif,
              fontSize: 22,
              color: C.greenDark,
              marginBottom: 6,
            }}
          >
            3. A conversation.
          </div>
          <p style={{ margin: 0, color: C.muted, fontSize: 16, lineHeight: 1.65 }}>
            Not a pitch for a partnership. A conversation about whether any
            of this is useful enough to keep talking about.
          </p>
        </div>
      </Section>

      <Section eyebrow="One ground rule" heading="This is closed beta. Please try to break it." delay={0.05}>
        <p style={{ margin: "0 0 18px" }}>
          About a dozen people have used Trellis so far. A few founders,
          a couple of operators, one agronomist with strong opinions and
          a very sharp eye. You're the first accelerator. That matters,
          because the places Trellis still gets wrong are exactly the
          places people like you will see first.
        </p>
        <p
          style={{
            margin: 0,
            padding: "20px 24px",
            background: C.bgWarm,
            borderLeft: `3px solid ${C.gold}`,
            fontFamily: F.serif,
            fontSize: 19,
            fontStyle: "italic",
            color: C.greenDark,
            lineHeight: 1.55,
            borderRadius: 2,
          }}
        >
          If you see something that looks wrong, say so.
          I would rather be embarrassed by each of you today
          than be embarrassed by someone public tomorrow.
        </p>
      </Section>

      <CTA />
      <Colophon />
    </div>
  );
}
