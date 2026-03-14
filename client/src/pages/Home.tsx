import { useEffect, useState } from "react";
import { Link } from "wouter";
import { TrellisLogo, MapleLeaf } from "../components/TrellisLogo";

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
      .then((d: any[]) => setCount(d.length))
      .catch(() => {});

    // Read URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const org = params.get("org");
      const ref = params.get("ref");
      if (mode === "operator") setUrlMode("operator");
      if (org) setOrgParam(org);

      // Silent visitor tracking via ?ref= param
      if (ref) {
        try { localStorage.setItem("trellis_ref", ref); } catch {}
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

  const programCount = count || 350;

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">

      {/* ── First-Visit Popup ───────────────────────────────────── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-5"
          style={{ background: "#F5F3ED" }}
        >
          <div
            className="bg-white w-full max-w-[460px] animate-slide-up"
            style={{
              borderRadius: 16,
              padding: "40px 32px 28px",
              border: "0.5px solid #E5E5E0",
            }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <TrellisIcon size={48} />
            </div>

            {urlMode === "founder" ? (
              /* ── VARIANT A: Founder ──────────────────────── */
              <>
                <h2
                  className="font-display font-normal text-center leading-[1.2] mb-4 popup-headline"
                  style={{ fontSize: 28, color: "#1a1a18" }}
                >
                  Find your path through<br />Canada's ag ecosystem.
                </h2>

                <p
                  className="text-center leading-[1.6] mb-6"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "#6b6b6b" }}
                >
                  Answer 4 quick questions. Get a personalized pathway to the accelerators, funding, and pilot sites that match your stage and province.
                </p>

                {/* CTA */}
                <button
                  onClick={() => dismissPopup("pathway")}
                  className="w-full font-medium transition-colors"
                  style={{
                    background: "#D4A828",
                    color: "#1B4332",
                    fontSize: 15,
                    fontWeight: 500,
                    padding: 14,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#BF9624")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#D4A828")}
                >
                  Build My Pathway →
                </button>
                <div className="text-center mt-1.5" style={{ fontSize: 12, color: "#999" }}>
                  Takes about 30 seconds
                </div>

                {/* Footer stats */}
                <div
                  className="text-center mt-4"
                  style={{ fontSize: 13, color: "#999", borderTop: "0.5px solid #E5E5E0", paddingTop: 12 }}
                >
                  {programCount} programs · 10 provinces · Updated weekly
                </div>

                {/* Secondary link */}
                <div className="text-center mt-3">
                  <button
                    onClick={() => dismissPopup("browse")}
                    className="bg-transparent border-none cursor-pointer hover:underline"
                    style={{ fontSize: 13, color: "#2D7A4F" }}
                  >
                    Or: Browse all programs →
                  </button>
                </div>
              </>
            ) : (
              /* ── VARIANT B: Operator ─────────────────────── */
              <>
                <h2
                  className="font-display font-normal text-center leading-[1.2] mb-4 popup-headline"
                  style={{ fontSize: 28, color: "#1a1a18" }}
                >
                  Your programs are already<br />in Trellis.
                </h2>

                <p
                  className="text-center leading-[1.6] mb-4"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "#6b6b6b" }}
                >
                  We've mapped {programCount} programs across 10 provinces — including yours. Before we share this with founders, we want to make sure we got it right.
                </p>

                {/* Highlight box */}
                <div
                  className="mb-5"
                  style={{
                    background: "#FFF8E7",
                    borderLeft: "3px solid #D4A828",
                    borderRadius: "0 8px 8px 0",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#6b6b6b",
                    lineHeight: 1.5,
                  }}
                >
                  You can review your listing, flag corrections, and see where founders in your province have coverage gaps.
                </div>

                {/* CTA */}
                <button
                  onClick={() => dismissPopup("programs")}
                  className="w-full font-medium transition-colors"
                  style={{
                    background: "#1B4332",
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 500,
                    padding: 14,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2D7A4F")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1B4332")}
                >
                  Check Your Programs →
                </button>
                <div className="text-center mt-1.5" style={{ fontSize: 12, color: "#999" }}>
                  No signup · Takes 2 minutes
                </div>

                {/* Footer credit */}
                <div
                  className="text-center mt-4"
                  style={{ fontSize: 12, color: "#999", borderTop: "0.5px solid #E5E5E0", paddingTop: 12 }}
                >
                  Built by Justyn Szymczyk · BestInShow.ag
                </div>

                {/* Secondary link */}
                <div className="text-center mt-3">
                  <button
                    onClick={() => dismissPopup("founder-experience")}
                    className="bg-transparent border-none cursor-pointer hover:underline"
                    style={{ fontSize: 13, color: "#2D7A4F" }}
                  >
                    Or: See the founder experience →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="px-6 md:px-6 h-11 md:h-14 flex items-center justify-between border-b border-border sticky top-0 bg-[rgba(250,250,248,0.88)] backdrop-blur-[20px] backdrop-saturate-[180%] z-[100]">
        <TrellisLogo className="h-6 md:h-7" />
        <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
          className="flex items-center gap-1.5 no-underline text-text-secondary hover:text-text transition-colors">
          <MapleLeaf size={14} className="md:w-4 md:h-4" />
          <span className="text-[0.72rem] md:text-[0.78rem] font-semibold">
            <span className="hidden md:inline">All Programs</span>
            <span className="md:hidden">Programs</span>
          </span>
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 pt-14 pb-12">
        {/* Status pill */}
        <div className="inline-flex items-center gap-[7px] bg-green-soft border border-[rgba(45,122,79,0.12)] rounded-full px-4 py-[5px] mb-7 animate-fade-in-up">
          <div className="w-[7px] h-[7px] rounded-full bg-brand-chartreuse shadow-[0_0_8px_rgba(140,198,63,0.4)]" />
          <span className="text-[0.72rem] font-semibold text-brand-green tracking-[0.01em]">
            {count !== null ? `${count} programs tracked across Canada` : "Loading…"}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-normal tracking-[-0.02em] leading-[1.15] text-text max-w-[640px] mb-4.5 text-center"
          style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
        >
          Canada's ag innovation ecosystem is powerful.{" "}
          <span className="text-brand-green">It's also a maze.</span>
        </h1>

        <p
          className="text-[1.1rem] text-text-secondary max-w-[480px] leading-[1.65] mb-11 text-center font-normal"
          style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
        >
          Guiding your path to farm.
        </p>

        {/* ── Two clear CTA cards ─────────────────────────────── */}
        <div
          className="flex gap-3.5 flex-wrap justify-center max-w-[640px] w-full mb-14"
          style={{ animation: "fadeInUp 0.6s ease 0.3s both" }}
        >
          {/* Founder card */}
          <Link href="/navigator" onClick={() => { try { localStorage.setItem("ag_nav_mode", "e"); } catch {} }}
            className="flex-[1_1_280px] bg-brand-gold text-brand-forest rounded px-5.5 py-6 no-underline text-left shadow-[0_4px_24px_rgba(212,168,40,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,168,40,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-white/60 mb-2.5">For AgTech Companies</div>
            <div className="text-[1.05rem] font-bold mb-1.5 tracking-[-0.02em] leading-[1.3]">I'm building an agtech product</div>
            <div className="text-[0.8rem] text-white/80 leading-[1.55] mb-4.5">
              Answer 4 questions. Get a personalized pathway to the accelerators, funding, and pilot sites that match your stage and province.
            </div>
            <div className="inline-flex items-center gap-[5px] bg-white/18 rounded-[7px] px-3.5 py-2 text-[0.78rem] font-bold text-white">
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
              Review your listing, explore coverage gaps, check how you appear in founder pathways, and submit updates.
            </div>
            <div className="inline-flex items-center gap-[5px] bg-brand-forest rounded-[7px] px-3.5 py-2 text-[0.78rem] font-bold text-white">
              Explore Ecosystem →
            </div>
          </Link>
        </div>

        {/* Value props */}
        <div
          className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 max-w-[700px] w-full mb-12"
          style={{ animation: "fadeInUp 0.6s ease 0.4s both" }}
        >
          {[
            { icon: "🎯", title: "Matched to you", desc: "Programs filtered by your stage, province, product type, and actual needs" },
            { icon: "🗺", title: "Ordered pathway", desc: "Not a list — a sequence of what to do first, next, and later" },
            { icon: "⚠️", title: "Gap warnings", desc: "We flag when your province is missing critical support" },
          ].map((item, i) => (
            <div key={i} className="bg-bg-secondary border border-border rounded px-4 py-4.5">
              <div className="text-[1.2rem] mb-2">{item.icon}</div>
              <div className="font-bold text-[0.82rem] text-text mb-1">{item.title}</div>
              <div className="text-[0.75rem] text-text-secondary leading-[1.5]">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Category tags */}
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          {["Accelerators", "Funding", "Pilot Sites", "Events", "Industry Orgs", "Training"].map(cat => (
            <span key={cat} className="text-[0.7rem] text-text-tertiary font-medium bg-bg-secondary border border-border rounded-full px-3 py-1">
              {cat}
            </span>
          ))}
        </div>

        <p className="text-[0.72rem] text-text-tertiary mt-3">
          Powered by AI · Free during beta
        </p>
      </main>
    </div>
  );
}
