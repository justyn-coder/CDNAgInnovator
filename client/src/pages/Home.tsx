import { useEffect, useState } from "react";
import { Link } from "wouter";
import { cn } from "../lib/cn";
import { TrellisLogo } from "../components/TrellisLogo";

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
    <div className="min-h-screen bg-bg flex flex-col font-sans">

      {/* ── Beta Welcome Modal ─────────────────────────────────── */}
      {showBetaModal && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-[8px] flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-bg rounded-lg max-w-[480px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up">
            {/* Header — tight, scannable */}
            <div className="bg-gradient-to-br from-[#122b1f] via-[#1B4332] to-[#245940] px-7 pt-7 pb-5.5 text-white">
              <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-white/60 mb-2.5">
                Early Access
              </div>
              <h2 className="font-display text-2xl font-normal leading-[1.15]">
                Canada's ag ecosystem,<br />mapped for you.
              </h2>
            </div>

            {/* Stats strip — scannable at a glance */}
            <div className="flex border-b border-border">
              {[
                { num: count || 283, label: "Programs" },
                { num: "10", label: "Provinces" },
                { num: "AI", label: "Personalized" },
              ].map((stat, i) => (
                <div key={i} className={cn(
                  "flex-1 py-3 text-center",
                  i < 2 && "border-r border-border"
                )}>
                  <div className="text-[1.1rem] font-extrabold text-brand-green">{stat.num}</div>
                  <div className="text-[0.62rem] font-semibold text-text-tertiary tracking-[0.04em] uppercase">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="px-7 pt-5 pb-6.5">
              <p className="text-[0.8rem] text-text-secondary leading-[1.6] mb-4.5">
                We built this because finding the right programs shouldn't require a spreadsheet and six phone calls.
                We're keeping it current — and we're counting on ecosystem partners like you to help us get it right for the founders and farmers who need it most.
              </p>

              {/* Two paths */}
              <div className="flex flex-col gap-2.5">
                <button onClick={() => dismissModal("e")}
                  className="bg-brand-gold text-brand-forest border-none rounded px-5 py-3.5 text-left shadow-gold transition-transform duration-[120ms] hover:-translate-y-px"
                >
                  <div className="font-bold text-[0.88rem] mb-0.5">I'm building an agtech company →</div>
                  <div className="text-[0.75rem] opacity-80">Get a personalized pathway in 30 seconds</div>
                </button>

                <button onClick={() => dismissModal("ec")}
                  className="bg-bg-secondary text-text border border-border-strong rounded px-5 py-3.5 text-left transition-transform duration-[120ms] hover:-translate-y-px"
                >
                  <div className="font-bold text-[0.88rem] mb-0.5">I run a program, accelerator, or funding body →</div>
                  <div className="text-[0.75rem] text-text-secondary">Review ecosystem data, check your listing, find gaps</div>
                </button>
              </div>

              <div className="mt-4 px-3 py-2 bg-green-soft rounded-sm text-[0.65rem] text-brand-green font-semibold text-center tracking-[0.01em]">
                Your feedback shapes the product
              </div>
              <div className="mt-3.5 pt-3 border-t border-border text-center">
                <div className="flex items-center justify-center gap-1.5 text-[0.6rem] text-text-tertiary tracking-[0.02em]">
                  <span>Powered by AI · Free, no signup · Beta v1.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="px-8 h-14 flex items-center justify-between border-b border-border sticky top-0 bg-[rgba(250,250,248,0.88)] backdrop-blur-[20px] backdrop-saturate-[180%] z-[100]">
        <div className="flex items-center gap-2.5">
          <TrellisLogo className="h-6" />
        </div>
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
