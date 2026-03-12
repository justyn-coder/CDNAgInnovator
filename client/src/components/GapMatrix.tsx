import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface CellProgram {
  name: string;
  website: string | null;
  description: string | null;
  stage: string[];
}

interface Cell {
  count: number;
  programs: CellProgram[];
}

interface GapData {
  matrix: Record<string, Record<string, Cell>>;
  provinces: string[];
  categories: string[];
  summary: {
    totalCells: number;
    emptyCells: number;
    weakCells: number;
    coveredCells: number;
    stageFilter: string;
  };
}

interface GapExplanation {
  classification_label: string;
  why: string;
  action: string;
}

interface ExplainResponse {
  gapType: string;
  explanation: GapExplanation;
  meta: {
    unfilteredCount: number;
    nationalCount: number;
    neighborCounts: Record<string, number>;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────
const STAGES = ["All", "Idea", "MVP", "Pilot", "Comm", "Scale"];

const STAGE_LABELS: Record<string, string> = {
  All: "All", Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

const CAT_LABELS: Record<string, string> = {
  Fund:  "Fund",
  Accel: "Accel",
  Pilot: "Pilot",
  Event: "Event",
  Org:   "Org",
  Train: "Train",
};

const PROV_LABELS: Record<string, string> = {
  BC: "BC", AB: "AB", SK: "SK", MB: "MB",
  ON: "ON", QC: "QC", NB: "NB", NS: "NS",
  PE: "PE", NL: "NL", National: "Natl",
};

// ── Color scale ────────────────────────────────────────────────────────────
function cellColor(count: number): { bg: string; text: string; border: string } {
  if (count === 0) return { bg: "#fde8e8", text: "#b91c1c", border: "#fca5a5" };
  if (count === 1) return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" };
  if (count === 2) return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
  return            { bg: "#d1fae5", text: "#064e3b", border: "#34d399" };
}

function gapLabel(count: number): string {
  if (count === 0) return "Gap";
  if (count === 1) return "Weak";
  if (count === 2) return "Fair";
  return "Strong";
}

const GAP_TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  structural:     { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  market_failure: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  coverage_gap:   { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
  stage_mismatch: { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  data_gap:       { bg: "#f3e8ff", text: "#6b21a8", border: "#c4b5fd" },
  weak:           { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  adequate:       { bg: "#d1fae5", text: "#064e3b", border: "#34d399" },
};

// ── AI Explain card ────────────────────────────────────────────────────────
function ExplainCard({
  prov, cat, stage, mode,
}: {
  prov: string; cat: string; stage: string; mode: string;
}) {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMeta, setShowMeta] = useState(false);

  function fetchExplain() {
    if (data || loading) return;
    setLoading(true);
    setError("");
    fetch("/api/gaps/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ province: prov, category: cat, stage, mode }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ExplainResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load analysis.");
        setLoading(false);
      });
  }

  const typeStyle = data ? (GAP_TYPE_STYLE[data.gapType] || GAP_TYPE_STYLE.adequate) : null;

  if (!data && !loading && !error) {
    return (
      <button
        onClick={fetchExplain}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          marginTop: 10,
          transition: "all 0.15s",
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#e2e8f0" }}>AI Gap Analysis</div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 1 }}>Why does this gap exist? What can be done?</div>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div style={{
        width: "100%", padding: "14px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid #334155", borderRadius: 10,
        marginTop: 10, display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <div style={{
            width: 10, height: 10, border: "2px solid rgba(255,255,255,0.3)",
            borderTop: "2px solid #fff", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#e2e8f0" }}>Analyzing…</div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 1 }}>Reasoning about this ecosystem gap</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        marginTop: 10, padding: "10px 14px",
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
        fontSize: "0.75rem", color: "#991b1b",
      }}>
        {error}{" "}
        <button onClick={() => { setError(""); setData(null); }} style={{
          background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
          color: "#991b1b", fontSize: "0.75rem",
        }}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      marginTop: 10,
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      border: "1px solid #334155",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px 8px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v6M8 15v-6M1 8h6M15 8H8M3 3l4 4M13 13l-4-4M3 13l4-4M13 3l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#e2e8f0" }}>AI Analysis</span>
        {typeStyle && (
          <span style={{
            fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px",
            borderRadius: 100, background: typeStyle.bg, color: typeStyle.text,
            border: `1px solid ${typeStyle.border}`, marginLeft: "auto",
          }}>{data.explanation.classification_label}</span>
        )}
      </div>

      {/* Why */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Why</div>
        <div style={{ fontSize: "0.73rem", color: "#cbd5e1", lineHeight: 1.55 }}>{data.explanation.why}</div>
      </div>

      {/* Action */}
      <div style={{ padding: "6px 14px 12px" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
          {mode === "ec" ? "Opportunity" : "What to do"}
        </div>
        <div style={{ fontSize: "0.73rem", color: "#cbd5e1", lineHeight: 1.55 }}>{data.explanation.action}</div>
      </div>

      {/* Meta */}
      <div style={{ padding: "0 14px 10px" }}>
        <button
          onClick={() => setShowMeta(!showMeta)}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: "0.6rem", color: "#64748b", cursor: "pointer",
            textDecoration: "underline", textDecorationColor: "#334155",
          }}
        >{showMeta ? "Hide" : "Show"} context</button>
        {showMeta && (
          <div style={{
            marginTop: 6, padding: "6px 10px",
            background: "rgba(255,255,255,0.04)", borderRadius: 6,
            fontSize: "0.63rem", color: "#64748b", lineHeight: 1.6,
          }}>
            {Object.keys(data.meta.neighborCounts).length > 0 && (
              <div>Neighbors: {Object.entries(data.meta.neighborCounts).map(([p, c]) => `${p} ${c}`).join(" · ")}</div>
            )}
            <div>National programs: {data.meta.nationalCount}</div>
            {data.meta.unfilteredCount > 0 && <div>All stages: {data.meta.unfilteredCount} programs</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drill-down panel ───────────────────────────────────────────────────────
function CellDetail({
  prov, cat, cell, stage, mode, onClose,
}: {
  prov: string; cat: string; cell: Cell; stage: string; mode: string; onClose: () => void;
}) {
  const colors = cellColor(cell.count);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxHeight: "75vh", overflowY: "auto",
          background: "var(--bg)", borderRadius: "16px 16px 0 0",
          padding: "20px 18px 32px",
        }}
      >
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px",
                borderRadius: 100, background: colors.bg, color: colors.text,
                border: `1px solid ${colors.border}`,
              }}>{gapLabel(cell.count)}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                {cell.count} program{cell.count !== 1 ? "s" : ""}
              </span>
              {stage !== "All" && (
                <span style={{
                  fontSize: "0.6rem", padding: "2px 7px", borderRadius: 4,
                  background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontWeight: 600,
                }}>{stage} stage</span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
              {prov === "National" ? "National" : prov} · {CAT_LABELS[cat]}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: "4px 12px",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text)",
          }}>Close</button>
        </div>

        {cell.count === 0 ? (
          <div style={{
            padding: "20px 16px", background: "var(--bg-secondary)",
            borderRadius: "var(--radius)", textAlign: "center",
            border: "1px dashed var(--border)",
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 6 }}>⚠️</div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", marginBottom: 4 }}>No programs found</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              This is a confirmed gap in the Canadian agtech support landscape.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cell.programs.map((p, i) => (
              <div key={i} style={{
                padding: "11px 13px", background: "var(--bg-secondary)",
                borderRadius: "var(--radius)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: 3 }}>
                  {p.website
                    ? <a href={p.website} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--green-mid)", textDecoration: "none" }}>{p.name} ↗</a>
                    : <span style={{ color: "var(--text)" }}>{p.name}</span>
                  }
                </div>
                {p.description && (
                  <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: 5 }}>
                    {p.description}
                  </div>
                )}
                {p.stage.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {p.stage.map(st => (
                      <span key={st} style={{
                        fontSize: "0.6rem", padding: "1px 6px", borderRadius: 4,
                        background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                      }}>{st}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ExplainCard prov={prov} cat={cat} stage={stage} mode={mode} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GapMatrix({ onClose, mode = "founder" }: { onClose: () => void; mode?: string }) {
  const [stage, setStage] = useState("All");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ prov: string; cat: string } | null>(null);
  const [showGuide, setShowGuide] = useState(() => {
    try { return !sessionStorage.getItem("ag_gap_guided"); } catch { return true; }
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = stage === "All" ? "/api/gaps" : `/api/gaps?stage=${stage}`;
    fetch(url)
      .then(r => r.json())
      .then((d: GapData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load gap data."); setLoading(false); });
  }, [stage]);

  useEffect(() => { setSelected(null); }, [stage]);

  // Dismiss guide on first cell click
  useEffect(() => {
    if (selected && showGuide) {
      setShowGuide(false);
      try { sessionStorage.setItem("ag_gap_guided", "1"); } catch {}
    }
  }, [selected]);

  const selectedCell = selected && data
    ? { prov: selected.prov, cat: selected.cat, cell: data.matrix[selected.prov][selected.cat] }
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{
        height: 56, padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
        background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.05rem", color: "var(--text)" }}>Gap Map</span>
        <button onClick={onClose} style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "6px 16px",
          fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
          transition: "all 0.12s",
        }}>Done</button>
      </div>

      {/* Compact filter + legend bar */}
      <div style={{
        padding: "8px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <select value={stage} onChange={e => setStage(e.target.value)} style={{
          padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)",
          fontSize: "0.75rem", fontWeight: 600, background: "var(--bg)", color: "var(--text)",
          fontFamily: "var(--font-text)",
        }}>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" }}>
          {[
            { label: "Gap", bg: "#fde8e8", text: "#b91c1c" },
            { label: "Weak", bg: "#fef9c3", text: "#854d0e" },
            { label: "OK", bg: "#dcfce7", text: "#166534" },
            { label: "Strong", bg: "#d1fae5", text: "#064e3b" },
          ].map(l => (
            <span key={l.label} style={{
              fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px",
              borderRadius: 4, background: l.bg, color: l.text,
            }}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Inline tip — one line */}
      {showGuide && !loading && data && (
        <div style={{
          padding: "7px 16px", borderBottom: "1px solid var(--border)",
          background: "#eff6ff", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: "0.72rem", color: "#1e40af",
        }}>
          <span>💡</span>
          <span style={{ flex: 1 }}>Tap any cell to see programs + AI analysis of the gap.</span>
          <button onClick={() => { setShowGuide(false); try { sessionStorage.setItem("ag_gap_guided", "1"); } catch {} }} style={{
            background: "none", border: "none", fontSize: "0.72rem", color: "#3b82f6", padding: "0 4px",
            fontWeight: 600, flexShrink: 0,
          }}>✕</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        {loading && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>Loading gap data…</div>
        )}
        {error && (
          <div style={{ padding: 48, textAlign: "center", color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
        )}
        {data && !loading && (
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{
                  padding: "8px 10px", textAlign: "left", fontWeight: 600,
                  fontSize: "0.65rem", color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)", position: "sticky", top: 0, left: 0, zIndex: 2, minWidth: 48,
                }}>Prov</th>
                {data.categories.map(cat => (
                  <th key={cat} style={{
                    padding: "8px 6px", textAlign: "center", fontWeight: 600,
                    fontSize: "0.62rem", color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 1, letterSpacing: "0.02em",
                  }}>{CAT_LABELS[cat]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.provinces.map(prov => (
                <tr key={prov} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{
                    padding: "7px 10px", fontWeight: 700, fontSize: "0.72rem",
                    color: "var(--text)", background: "var(--bg-secondary)",
                    position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--border)",
                  }}>{PROV_LABELS[prov] || prov}</td>
                  {data.categories.map(cat => {
                    const cell = data.matrix[prov][cat];
                    const colors = cellColor(cell.count);
                    const isSelected = selected?.prov === prov && selected?.cat === cat;
                    return (
                      <td key={cat}
                        onClick={() => setSelected({ prov, cat })}
                        style={{
                          padding: "6px 4px", textAlign: "center", cursor: "pointer",
                          background: isSelected ? colors.border : colors.bg,
                          transition: "background 0.1s",
                          outline: isSelected ? `2px solid ${colors.text}` : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: colors.text, lineHeight: 1 }}>{cell.count}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCell && (
        <CellDetail
          prov={selectedCell.prov}
          cat={selectedCell.cat}
          cell={selectedCell.cell}
          stage={stage}
          mode={mode}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
