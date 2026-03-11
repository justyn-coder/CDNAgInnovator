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

// ── Constants ──────────────────────────────────────────────────────────────
const STAGES = ["All", "Idea", "MVP", "Pilot", "Comm", "Scale"];

const CAT_LABELS: Record<string, string> = {
  Fund:  "Funding",
  Accel: "Accelerator",
  Pilot: "Pilot Site",
  Event: "Event",
  Org:   "Industry Org",
  Train: "Training",
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

// ── Drill-down panel ───────────────────────────────────────────────────────
function CellDetail({
  prov, cat, cell, onClose,
}: {
  prov: string; cat: string; cell: Cell; onClose: () => void;
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
          width: "100%", maxHeight: "65vh", overflowY: "auto",
          background: "var(--bg)", borderRadius: "16px 16px 0 0",
          padding: "20px 18px 32px",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Header */}
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

        {/* Programs */}
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
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GapMatrix({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState("All");
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ prov: string; cat: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = stage === "All" ? "/api/gaps" : `/api/gaps?stage=${stage}`;
    fetch(url)
      .then(r => r.json())
      .then((d: GapData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load gap data."); setLoading(false); });
  }, [stage]);

  const selectedCell = selected && data
    ? { prov: selected.prov, cat: selected.cat, cell: data.matrix[selected.prov][selected.cat] }
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        height: 52, padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>Ecosystem Gap Map</span>
        <button onClick={onClose} style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "5px 14px",
          fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
        }}>Done</button>
      </div>

      {/* Stage filter + legend */}
      <div style={{
        padding: "10px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)", flexShrink: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        {/* Stage pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {STAGES.map(s => (
            <button key={s} onClick={() => setStage(s)} style={{
              padding: "4px 11px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600,
              border: "1px solid",
              borderColor: stage === s ? "var(--green-mid)" : "var(--border)",
              background: stage === s ? "var(--green-mid)" : "var(--bg)",
              color: stage === s ? "#fff" : "var(--text-secondary)",
              transition: "all 0.12s",
            }}>{s}</button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[
            { label: "Gap", bg: "#fde8e8", text: "#b91c1c", border: "#fca5a5" },
            { label: "Weak", bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
            { label: "Fair", bg: "#dcfce7", text: "#166534", border: "#86efac" },
            { label: "Strong", bg: "#d1fae5", text: "#064e3b", border: "#34d399" },
          ].map(l => (
            <span key={l.label} style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
              borderRadius: 100, background: l.bg, color: l.text,
              border: `1px solid ${l.border}`,
            }}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {data && !loading && (
        <div style={{
          padding: "7px 16px", borderBottom: "1px solid var(--border)",
          background: "var(--bg)", flexShrink: 0,
          display: "flex", gap: 16, alignItems: "center",
        }}>
          {[
            { label: "gaps", value: data.summary.emptyCells, color: "#b91c1c" },
            { label: "weak", value: data.summary.weakCells, color: "#854d0e" },
            { label: "covered", value: data.summary.coveredCells, color: "#166534" },
          ].map(s => (
            <span key={s.label} style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              <strong style={{ color: s.color, fontWeight: 700 }}>{s.value}</strong> {s.label}
            </span>
          ))}
          <span style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginLeft: "auto" }}>
            Tap a cell to drill down
          </span>
        </div>
      )}

      {/* Matrix */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        {loading && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
            Loading gap data…
          </div>
        )}
        {error && (
          <div style={{ padding: 48, textAlign: "center", color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
        )}
        {data && !loading && (
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
            <thead>
              <tr>
                {/* Province label col */}
                <th style={{
                  padding: "8px 10px", textAlign: "left", fontWeight: 600,
                  fontSize: "0.65rem", color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)", position: "sticky", top: 0, left: 0, zIndex: 2,
                  minWidth: 48,
                }}>Prov</th>
                {data.categories.map(cat => (
                  <th key={cat} style={{
                    padding: "8px 6px", textAlign: "center", fontWeight: 600,
                    fontSize: "0.62rem", color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 1,
                    letterSpacing: "0.02em",
                  }}>{CAT_LABELS[cat]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.provinces.map((prov, pi) => (
                <tr key={prov} style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Province label */}
                  <td style={{
                    padding: "7px 10px", fontWeight: 700, fontSize: "0.72rem",
                    color: "var(--text)", background: "var(--bg-secondary)",
                    position: "sticky", left: 0, zIndex: 1,
                    borderRight: "1px solid var(--border)",
                  }}>{PROV_LABELS[prov] || prov}</td>

                  {/* Cells */}
                  {data.categories.map(cat => {
                    const cell = data.matrix[prov][cat];
                    const colors = cellColor(cell.count);
                    const isSelected = selected?.prov === prov && selected?.cat === cat;
                    return (
                      <td key={cat}
                        onClick={() => setSelected({ prov, cat })}
                        style={{
                          padding: "5px 4px", textAlign: "center",
                          cursor: "pointer",
                          background: isSelected ? colors.border : colors.bg,
                          transition: "background 0.1s",
                          outline: isSelected ? `2px solid ${colors.text}` : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <div style={{
                          fontSize: "0.75rem", fontWeight: 700,
                          color: colors.text, lineHeight: 1,
                          marginBottom: 1,
                        }}>{cell.count}</div>
                        <div style={{
                          fontSize: "0.5rem", fontWeight: 600,
                          color: colors.text, opacity: 0.75, letterSpacing: "0.03em",
                        }}>{gapLabel(cell.count)}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drill-down panel */}
      {selectedCell && (
        <CellDetail
          prov={selectedCell.prov}
          cat={selectedCell.cat}
          cell={selectedCell.cell}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
