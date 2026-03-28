import { useState } from "react";

const SECTIONS = [
  {
    title: "Founder Pathway",
    icon: "🧭",
    items: [
      { label: "Build My Pathway", desc: "Answer 4 questions (stage, province, need, product) → get a sequenced pathway of programs tailored to you." },
      { label: "Chat follow-up", desc: "After your pathway loads, ask questions in the chat. It knows your context and can dig deeper." },
      { label: "Shareable link", desc: "Click 'Copy shareable link' on any pathway to send it to a co-founder or advisor." },
      { label: "Email capture", desc: "Drop your email on the pathway page to get notified when new programs match your profile." },
      { label: "Gap warnings", desc: "Orange badges flag provinces or categories where programs are thin — so you know where to look beyond your province." },
    ],
  },
  {
    title: "Ecosystem Operator View",
    icon: "📊",
    items: [
      { label: "Gap Matrix", desc: "See coverage across all provinces × categories. Click any cell for AI analysis of what's missing." },
      { label: "Browse Programs", desc: "Filter the full database by province, category, and stage. Find overlaps or whitespace." },
      { label: "Ecosystem Chat", desc: "Ask strategic questions: 'Where are the advisor gaps in the Prairies?' — backed by real data." },
      { label: "Correction form", desc: "Spot something wrong? Click 'Suggest correction' on any program to flag it for review." },
    ],
  },
  {
    title: "Data & Intelligence",
    icon: "🗄️",
    items: [
      { label: "480+ programs", desc: "Accelerators, funds, pilot sites, events, orgs, and training — verified against federal and provincial databases." },
      { label: "143 knowledge entries", desc: "Conference insights, ecosystem analysis, and sector intelligence from real events and research." },
      { label: "AI-powered pathways", desc: "Claude Sonnet 4 sequences programs by stage and province, with gap detection and next-step logic." },
      { label: "Community corrections", desc: "Every correction and suggestion feeds back into the database. The data gets better with use." },
    ],
  },
  {
    title: "Tally HQ (Your Cockpit)",
    icon: "🎛️",
    items: [
      { label: "Task dashboard", desc: "All your tasks in one view — grouped by status (intake → review → in_progress → done). Priority-sorted." },
      { label: "Morning view", desc: "Toggle ☀️ Morning to see only what needs your attention right now. Scan, decide, move." },
      { label: "Step tracking", desc: "Expanded cards show per-step status — green checks for done, blue pulse for in-progress, 'Your turn' badge when it's on you." },
      { label: "Deploy button", desc: "When Claude finishes code changes, a blue 'Copy deploy command' button gives you a one-paste terminal command." },
      { label: "Action buttons", desc: "Code, Work, Cowork, Chrome buttons on cards — one click copies the right prompt to clipboard." },
    ],
  },
  {
    title: "iPhone Shortcut",
    icon: "📱",
    items: [
      { label: "1-tap voice capture", desc: "Tap the Tally icon on your home screen → dictate a task → it lands in HQ intake automatically." },
      { label: "Back Tap trigger", desc: "Double-tap the back of your iPhone to start dictation. Settings → Accessibility → Touch → Back Tap → Tally." },
      { label: "Auto-routing", desc: "Say the project name ('trellis', 'best in show') and it auto-assigns the right track." },
      { label: "Claude voice widget", desc: "Add the Claude widget to your home screen for 1-tap voice conversations with AI." },
    ],
  },
  {
    title: "Chrome Extension",
    icon: "🌐",
    items: [
      { label: "Browser agent", desc: "Claude navigates, clicks, fills forms, and extracts data from web pages. Drag tabs into Claude's tab group for batch work." },
      { label: "Shortcuts", desc: "Record a workflow once, Claude repeats it. Schedule shortcuts to run recurring browser tasks." },
      { label: "Testing", desc: "Test Trellis in a real browser — Claude reads console errors, checks DOM state, verifies UI changes." },
      { label: "Research", desc: "Multi-site comparison, competitor monitoring, program page scraping for data enrichment." },
    ],
  },
  {
    title: "Claude Code (VS Code)",
    icon: "🔧",
    items: [
      { label: "Resume task", desc: "Say 'resume T-XX' — Claude pulls the HQ card, follows the approach steps, updates status when done." },
      { label: "Subagents", desc: "Claude spawns specialized agents for parallel work — one writes code, another tests, another researches." },
      { label: "Checkpoints", desc: "Auto-saves code state before changes. Press Esc-Esc or /rewind to go back. Safe to be ambitious." },
      { label: "Skills", desc: "Reusable instruction packages in .claude/skills/ — auto-loaded when relevant to your task." },
    ],
  },
  {
    title: "Cowork (Claude Desktop)",
    icon: "🤖",
    items: [
      { label: "Scheduled tasks", desc: "Morning briefings, intake grooming, weekly reviews — run automatically while you sleep." },
      { label: "Research tasks", desc: "Web scraping, competitor monitoring, grant research — Claude works while you're away." },
      { label: "File workspaces", desc: "Point Cowork at a folder, it reads/writes files there. Context persists between runs via files." },
      { label: "Tool scout", desc: "Biweekly scan for new Claude capabilities and automation patterns. Finds upgrades you'd miss." },
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
            <h2 className="font-display text-[1.3rem] font-normal text-text mb-0.5">Resource Center</h2>
            <p className="text-[0.75rem] text-text-secondary">Everything you've built — and how to use it</p>
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
            Built with Claude · Updated March 2026 · Ask Claude Code for details on any feature
          </p>
        </div>
      </div>
    </div>
  );
}
