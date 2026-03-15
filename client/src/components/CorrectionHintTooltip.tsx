import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

const TOOLTIP_DELAY = 1500;
const AUTO_DISMISS = 8000;

export default function CorrectionHintTooltip({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number; above: boolean } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    try { localStorage.setItem("trellis_correction_hint_seen", "true"); } catch {}
    // Remove pulse class from target
    targetRef.current?.classList.remove("correction-pulse");
  }, []);

  // Check if already seen
  useEffect(() => {
    try {
      if (localStorage.getItem("trellis_correction_hint_seen") === "true") {
        setDismissed(true);
        return;
      }
    } catch {}

    const delay = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const target = container.querySelector<HTMLButtonElement>("[data-correction-link]");
      if (!target) return;
      targetRef.current = target;

      // Scroll into view if needed
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (targetRect.bottom > containerRect.bottom || targetRect.top < containerRect.top) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        // Wait for scroll to settle
        setTimeout(() => positionAndShow(target, container), 500);
      } else {
        positionAndShow(target, container);
      }
    }, TOOLTIP_DELAY);

    return () => clearTimeout(delay);
  }, [containerRef, dismiss]);

  function positionAndShow(target: HTMLElement, container: HTMLElement) {
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const spaceAbove = targetRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - targetRect.bottom;
    const above = spaceAbove > spaceBelow && spaceAbove > 120;

    // Position relative to container
    const top = above
      ? targetRect.top - containerRect.top - 12 // 12px gap + tooltip will use bottom positioning
      : targetRect.bottom - containerRect.top + 12;
    const left = Math.max(12, Math.min(
      targetRect.left - containerRect.left + targetRect.width / 2 - 140,
      containerRect.width - 292 // 280 + 12 padding
    ));
    const arrowLeft = targetRect.left - containerRect.left + targetRect.width / 2 - left;

    setPos({ top, left, arrowLeft, above });
    setVisible(true);

    // Add pulse to target
    target.classList.add("correction-pulse");

    // Auto-dismiss
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS);
  }

  // Scroll dismiss
  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => dismiss();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [visible, containerRef, dismiss]);

  // Click outside dismiss
  useEffect(() => {
    if (!visible) return;
    function onClick(e: MouseEvent) {
      const tooltip = tooltipRef.current;
      if (tooltip && !tooltip.contains(e.target as Node)) {
        dismiss();
      }
    }
    // Delay listener so the tooltip's own render click doesn't dismiss
    const t = setTimeout(() => document.addEventListener("click", onClick), 50);
    return () => { clearTimeout(t); document.removeEventListener("click", onClick); };
  }, [visible, dismiss]);

  // Click on correction link dismiss
  useEffect(() => {
    if (!visible || !targetRef.current) return;
    const target = targetRef.current;
    const onClick = () => dismiss();
    target.addEventListener("click", onClick);
    return () => target.removeEventListener("click", onClick);
  }, [visible, dismiss]);

  // Cleanup timer
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (dismissed || !visible || !pos) return null;

  return (
    <>
      {/* Pulse animation styles */}
      <style>{`
        @keyframes correctionPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0); }
          50% { box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.3); }
        }
        .correction-pulse {
          animation: correctionPulse 1.2s ease-in-out 3;
          border-radius: 4px;
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          ...(pos.above ? { bottom: `calc(100% - ${pos.top}px)` } : { top: pos.top }),
          left: pos.left,
          maxWidth: 280,
          background: "#FFFBEB",
          border: "1px solid #D4A843",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "12px 14px",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 14,
          color: "#2D3A2E",
          lineHeight: 1.5,
          zIndex: 300,
          animation: "tooltipFadeIn 0.2s ease-out both",
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#999",
            lineHeight: 1,
            padding: "2px 4px",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div style={{ fontWeight: 600, marginBottom: 4 }}>See something off?</div>
        <div>
          Every program has a "Suggest a correction" link.
          Help us get your data right before founders see it.
        </div>

        {/* Arrow/caret */}
        <div
          style={{
            position: "absolute",
            ...(pos.above
              ? { bottom: -6, borderTop: "6px solid #D4A843" }
              : { top: -6, borderBottom: "6px solid #D4A843" }),
            left: pos.arrowLeft,
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
          }}
        />
        {/* Inner arrow (background color fill) */}
        <div
          style={{
            position: "absolute",
            ...(pos.above
              ? { bottom: -5, borderTop: "5px solid #FFFBEB" }
              : { top: -5, borderBottom: "5px solid #FFFBEB" }),
            left: pos.arrowLeft + 1,
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
          }}
        />
      </div>
    </>
  );
}
