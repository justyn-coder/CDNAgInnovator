import { useState } from "react";

const SECTIONS = [
  {
    title: "Founder Pathway",
    icon: "🧭",
    items: [
      { label: "Build My Pathway", desc: "Answer 4 questions (stage, province, need, product) and get a sequenced pathway of programs tailored to you." },
      { label: "AI follow-up", desc: "After your pathway loads, ask questions in the chat below. It knows your context and can dig deeper into any program." },
      { label: "Shareable link", desc: "Click 'Copy shareable link' on any pathway to send it to a co-founder or advisor." },
      { label: "Track your progress", desc: "Mark programs as Interested, Applied, or Not for me to keep track of where you are." },
      { label: "Gap warnings", desc: "Orange badges flag provinces or categories where programs are thin, so you know where to look beyond your province." },
    ],
  },
  {
    title: "Ecosystem Operator View",
    icon: "📊",
    items: [
      { label: "Gap Matrix", desc: "See coverage across all provinces and categories. Click any cell for AI analysis of what's missing." },
      { label: "Browse Programs", desc: "Filter the full database by province, category, and stage. Find overlaps or whitespace in your region." },
      { label: "Ecosystem Chat", desc: "Ask strategic questions like 'Where are the advisor gaps in the Prairies?' backed by real program data." },
      { label: "Suggest corrections", desc: "Spot something wrong? Flag it for review. Every correction makes the data better for everyone." },
    ],
  },
  {
    title: "Data & Intelligence",
    icon: "🗄️",
    items: [
      { label: "490+ programs", desc: "Accelerators, funds, pilot sites, events, orgs, and training verified against federal and provincial databases." },
      { label: "Knowledge base", desc: "Conference insights, ecosystem analysis, and sector intelligence from real events and research across Canada." },
      { label: "AI-powered pathways", desc: "Programs are sequenced by stage and province with gap detection and next-step logic." },
      { label: "Community-driven", desc: "Every correction and suggestion feeds back into the database. The data gets better with use." },
    ],
  },
];

export default function ResourceCenter({ onClose }: { onClose: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Resource Center"
      style={{ background: "rgba(245, 243, 237, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-bg rounded-[16px] shadow-xl border border-border w-full max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-[1.3rem] font-normal text-text mb-0.5">How Trellis Works</h2>
            <p className="text-[0.75rem] text-text-secondary">What you can do here and how to get the most from it</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "thin" }}>
          {SECTIONS.map((section, i) => (
            <div key={i} className="mb-2">
              <button
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-secondary transition-colors"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                <span className="text-[1.1rem]">{section.icon}</span>
                <span className="font-bold text-[0.85rem] text-text flex-1">{section.title}</span>
                <span className="text-[0.7rem] text-text-tertiary">{section.items.length} items</span>
                <span className="text-text-secondary text-[0.7rem]">{expandedIdx === i ? "▲" : "▼"}</span>
              </button>
              {expandedIdx === i && (
                <div className="ml-10 mr-2 mb-3 mt-1 space-y-2">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex gap-2">
                      <span className="text-brand-green font-bold text-[0.7rem] mt-[3px] shrink-0">›</span>
                      <div>
                        <span className="font-semibold text-[0.78rem] text-text">{item.label}</span>
                        <span className="text-[0.75rem] text-text-secondary ml-1">— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border text-center">
          <p className="text-[0.7rem] text-text-tertiary">
            490+ programs across Canada · Updated weekly · AI-powered recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
