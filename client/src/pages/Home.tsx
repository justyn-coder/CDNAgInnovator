import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MapleLeaf } from "../components/TrellisLogo";


/** Inline trellis icon (no wordmark) for popup header */
function TrellisIcon({ size = 48 }: { size?: number }) {
  const s = size / 48; // scale factor
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g transform={`translate(${10 * s}, ${2 * s}) scale(${s})`}>
        {/* Vertical supports */}
        <line x1="4" y1="40" x2="4" y2="8" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="14" y1="40" x2="14" y2="8" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="40" x2="24" y2="8" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
        {/* Crossbars */}
        <line x1="0" y1="32" x2="28" y2="32" stroke="#1B4332" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="0" y1="20" x2="28" y2="20" stroke="#1B4332" strokeWidth="1.2" strokeLinecap="round" />
        {/* Bottom dots — green */}
        <circle cx="4" cy="32" r="3" fill="#48B87A" />
        <circle cx="14" cy="32" r="2.6" fill="#48B87A" opacity="0.9" />
        <circle cx="24" cy="32" r="2.2" fill="#48B87A" opacity="0.8" />
        {/* Middle dots — chartreuse */}
        <circle cx="4" cy="20" r="3.2" fill="#8CC63F" />
        <circle cx="14" cy="20" r="2.8" fill="#8CC63F" opacity="0.9" />
        <circle cx="24" cy="20" r="2.2" fill="#8CC63F" opacity="0.7" />
        {/* Top dots — gold */}
        <circle cx="4" cy="8" r="2.8" fill="#D4A828" opacity="0.85" />
        <circle cx="14" cy="4" r="2.2" fill="#D4A828" opacity="0.65" />
        <circle cx="24" cy="0" r="1.8" fill="#D4A828" opacity="0.5" />
      </g>
    </svg>
  );
}

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [urlMode, setUrlMode] = useState<"founder" | "operator">("founder");
  const [orgParam, setOrgParam] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then(r => r.json())
      .then((d: any[]) => {
        const hidden = new Set(["closed", "dissolved", "inactive", "announced"]);
        setCount(d.filter((p: any) => !hidden.has(p.status || "")).length);
      })
      .catch(() => {});

    // Read URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const rawMode = params.get("mode");
      const org = params.get("org");
      const ref = params.get("ref");

      // Auto-route ref tags to correct mode when ?mode= is missing
      const OPERATOR_REFS = [
        'chris', 'dave', 'frank', 'janice', 'leana', 'lewis', 'lisa',
        'marian', 'maris', 'marlise', 'matt', 'melissa', 'tom', 'virginia',
      ];
      const mode = rawMode
        || (ref && OPERATOR_REFS.includes(ref.toLowerCase()) ? "operator" : null);

      if (mode === "operator") setUrlMode("operator");
      if (org) setOrgParam(org);

      // Silent visitor tracking via ?ref= param (once per session)
      if (ref) {
        try { localStorage.setItem("trellis_ref", ref); } catch {}
        const refKey = `trellis_visit_logged_${ref}`;
        if (!sessionStorage.getItem(refKey)) {
          try { sessionStorage.setItem(refKey, "true"); } catch {}
          fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              programName: "VISIT",
              bestFor: `ref=${ref}, mode=${mode || "founder"}, org=${org || "none"}`,
              submitterName: ref,
              submitterEmail: `visit-${Date.now()}@track`,
            }),
          }).catch(() => {});
        }
      }

      // Show popup if not already welcomed
      const welcomed = localStorage.getItem("trellis_welcomed");
      if (!welcomed) {
        setShowPopup(true);
      } else if (mode === "operator" && org) {
        // Already welcomed but arriving via operator link — go straight to programs
        localStorage.setItem("ag_nav_mode", "ec");
        window.location.href = `/navigator?eco=true&org=${encodeURIComponent(org)}`;
      } else if (mode === "operator") {
        localStorage.setItem("ag_nav_mode", "ec");
        window.location.href = "/navigator?eco=true";
      }
    } catch {
      setShowPopup(true);
    }
  }, []);

  // Escape key dismisses popup
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closePopup(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPopup]);

  function closePopup() {
    try { localStorage.setItem("trellis_welcomed", "true"); } catch {}
    setShowPopup(false);
  }

  function dismissPopup(target: "pathway" | "browse" | "programs" | "founder-experience") {
    try {
      localStorage.setItem("trellis_welcomed", "true");
    } catch {}
    setShowPopup(false);

    if (target === "pathway") {
      localStorage.setItem("ag_nav_mode", "e");
      window.location.href = "/navigator";
    } else if (target === "browse") {
      localStorage.setItem("ag_nav_mode", "e");
      window.location.href = "/navigator?browse=true";
    } else if (target === "programs") {
      localStorage.setItem("ag_nav_mode", "ec");
      const url = orgParam
        ? `/navigator?eco=true&org=${encodeURIComponent(orgParam)}`
        : "/navigator?eco=true";
      window.location.href = url;
    } else if (target === "founder-experience") {
      localStorage.setItem("ag_nav_mode", "e");
      window.location.href = "/navigator";
    }
  }

  const programCount = count ?? 500;

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="px-6 h-20 md:h-24 flex items-center justify-between border-b border-border sticky top-0 bg-[rgba(250,250,248,0.92)] backdrop-blur-[20px] backdrop-saturate-[180%] z-[100]">
        <div className="w-8" /> {/* Spacer for centering */}
        <div className="grid items-center" style={{ gridTemplateColumns: "auto 1fr", gridTemplateRows: "auto auto", columnGap: 8 }}>
          {/* Icon — spans both rows */}
          <svg viewBox="0 0 28 34" className="h-10 md:h-12 row-span-2" aria-hidden="true">
            <g transform="translate(1, 1)">
              <line x1="4" y1="30" x2="4" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="30" x2="12" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="20" y1="30" x2="20" y2="6" stroke="#1B4332" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="24" x2="24" y2="24" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
              <line x1="0" y1="15" x2="24" y2="15" stroke="#1B4332" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="4" cy="24" r="2.2" fill="#48B87A"/>
              <circle cx="12" cy="24" r="1.9" fill="#48B87A" opacity="0.9"/>
              <circle cx="20" cy="24" r="1.6" fill="#48B87A" opacity="0.8"/>
              <circle cx="4" cy="15" r="2.4" fill="#8CC63F"/>
              <circle cx="12" cy="15" r="2.1" fill="#8CC63F" opacity="0.9"/>
              <circle cx="20" cy="15" r="1.7" fill="#8CC63F" opacity="0.7"/>
              <circle cx="4" cy="6" r="2.1" fill="#D4A828" opacity="0.85"/>
              <circle cx="12" cy="3" r="1.7" fill="#D4A828" opacity="0.65"/>
              <circle cx="20" cy="0" r="1.3" fill="#D4A828" opacity="0.5"/>
            </g>
          </svg>
          {/* Wordmark */}
          <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: "0.01em", color: "#1a1a18", lineHeight: 1 }}>
            Trellis
          </span>
          {/* Tagline */}
          <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#999", lineHeight: 1, marginTop: -1 }}>
            Canada's AgTech Ecosystem
          </span>
        </div>
        <div className="w-8" /> {/* Spacer for centering */}
      </nav>

      {/* Banner removed — tour on Navigator handles onboarding */}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 pt-14 pb-12">
        {/* Headline */}
        <h1
          className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-normal tracking-[-0.02em] leading-[1.15] text-text max-w-[640px] mb-4.5 text-center"
          style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
        >
          Canada's ag innovation ecosystem is powerful.{" "}
          <span className="text-brand-green">It's also a maze.</span>
        </h1>

        <p
          className="font-display text-[1.4rem] text-brand-gold max-w-[480px] leading-[1.3] mb-11 text-center font-normal"
          style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
        >
          We mapped it for you.
        </p>

        {/* ── Two clear CTA cards ─────────────────────────────── */}
        <div
          className="flex gap-3.5 flex-wrap justify-center max-w-[640px] w-full mb-8"
          style={{ animation: "fadeInUp 0.6s ease 0.3s both" }}
        >
          {/* Founder card */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
            className="flex-[1_1_280px] bg-brand-gold text-brand-forest rounded px-5.5 py-6 no-underline text-left shadow-[0_4px_24px_rgba(212,168,40,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,168,40,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-brand-forest/70 mb-2.5">For AgTech Companies</div>
            <div className="text-[1.05rem] font-bold mb-1.5 tracking-[-0.02em] leading-[1.3]">I'm building an agtech product</div>
            <div className="text-[0.8rem] text-brand-forest/80 leading-[1.55] mb-4.5">
              Answer 4 questions. Get a personalized pathway to the accelerators, funding, and pilot sites that match your stage and province.
            </div>
            <div className="inline-flex items-center gap-[5px] bg-brand-forest rounded-[7px] px-3.5 py-2 text-[0.78rem] font-bold text-white">
              Build My Pathway →
            </div>
          </Link>

          {/* Ecosystem operator card */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "ec"); } catch {} }}
            className="flex-[1_1_280px] bg-bg border-[1.5px] border-border-strong rounded px-5.5 py-6 no-underline text-left shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-text-tertiary mb-2.5">For Programs & Ecosystem</div>
            <div className="text-[1.05rem] font-bold text-text mb-1.5 tracking-[-0.02em] leading-[1.3]">I run a program, fund, or accelerator</div>
            <div className="text-[0.8rem] text-text-secondary leading-[1.55] mb-4.5">
              See where your programs appear in founder pathways — and where the gaps are.
            </div>
            <div className="inline-flex items-center gap-[5px] bg-brand-forest rounded-[7px] px-3.5 py-2 text-[0.78rem] font-bold text-white">
              Explore Ecosystem →
            </div>
          </Link>
        </div>

        {/* Value props — three pillars */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[760px] w-full mb-12"
          style={{ animation: "fadeInUp 0.6s ease 0.4s both" }}
        >
          {/* Personalized Pathway */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
            className="bg-gradient-to-br from-[#122b1f] to-[#1B4332] rounded-lg px-5 py-5 text-white relative overflow-hidden no-underline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer block">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-chartreuse/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8CC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-white/60">Personalized</span>
              </div>
              <div className="font-display text-[1.05rem] leading-[1.2] mb-2">Your pathway, not a directory</div>
              <div className="text-[0.72rem] text-white/75 leading-[1.5]">
                {programCount} programs filtered to your stage, province, and need. Sequenced in order. Start with #1.
              </div>
            </div>
          </Link>

          {/* AI Advisor */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); localStorage.setItem("trellis_skip_to", "chat"); } catch {} }}
            className="bg-[#FFF8E7] border border-[rgba(212,168,40,0.2)] rounded-lg px-5 py-5 relative no-underline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer block">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-gold/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="#8B6914" strokeWidth="1.3" fill="none"/>
                  <circle cx="5.5" cy="6.5" r="0.8" fill="#8B6914"/>
                  <circle cx="8" cy="6.5" r="0.8" fill="#8B6914"/>
                  <circle cx="10.5" cy="6.5" r="0.8" fill="#8B6914"/>
                </svg>
              </div>
              <span className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[#8B6914]/60">AI-powered</span>
            </div>
            <div className="font-display text-[1.05rem] text-text leading-[1.2] mb-2">Ask it anything</div>
            <div className="text-[0.72rem] text-text-secondary leading-[1.5]">
              "Who should I call first?" "What's the deadline?" An AI trained on the full ecosystem, not just program names.
            </div>
          </Link>

          {/* Ecosystem Intelligence */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "ec"); localStorage.setItem("trellis_skip_to", "gapmap"); } catch {} }}
            className="bg-bg-secondary border border-border rounded-lg px-5 py-5 relative no-underline transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer block">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <span className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-text-tertiary">Intelligence</span>
            </div>
            <div className="font-display text-[1.05rem] text-text leading-[1.2] mb-2">Gaps nobody talks about</div>
            <div className="text-[0.72rem] text-text-secondary leading-[1.5]">
              We flag where support disappears by stage and province. Real data, not pitch decks.
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="w-10 h-px bg-brand-gold mx-auto mt-4 md:mt-6 mb-4 md:mb-5" />
        <div className="text-center max-w-[480px] mx-auto px-4">
          <p className="text-[0.82rem] text-text-secondary leading-[1.65] mb-3">
            {programCount} programs. 10 provinces. AI-powered pathways built from public data — and one very stubborn spreadsheet.
          </p>
          <p className="text-[0.82rem] text-text-secondary leading-[1.65] mb-3">
            Verified. Sequenced by stage. Mapped by province. That's what makes this different from a search result. And it gets better every time someone flags what we're missing —{" "}
            <Link href="/navigator" className="text-brand-green font-medium underline">
              tell us
            </Link>.
          </p>
          <p className="text-[0.82rem] text-text-secondary leading-[1.65] mb-6">
            Want to help build a better tool for Canadian agtech?{" "}
            <a href="mailto:justyn@bestinshow.ag" className="text-brand-green font-medium underline">
              Let's talk
            </a>.
          </p>
          <p className="text-[0.76rem] text-text-secondary mb-1">
            Built by{" "}
            <a href="https://www.linkedin.com/in/justynszymczyk/" target="_blank" rel="noopener noreferrer" className="font-medium text-text hover:underline">
              Justyn Szymczyk
            </a>
            {" "}<MapleLeaf size={14} className="inline-block align-[-2px]" />
          </p>
          <p className="text-[0.7rem] text-text-tertiary">
            AgTech go-to-market · event performance ·{" "}
            <a href="https://www.bestinshow.ag" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: "#D4A843" }}>
              BestInShow.ag
            </a>
          </p>
        </div>
      </main>

    </div>
  );
}
