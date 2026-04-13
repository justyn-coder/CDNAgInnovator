const ACRONYMS = new Set([
  "BASF", "CFIN", "OCI", "AAFC", "BDC", "EDC", "FCC", "NRC", "IRAP",
  "RBC", "CAPI", "EMILI", "NPF", "PMRA", "CAAIN",
]);

export function formatSource(source: string, date?: string): string {
  // If source already contains spaces, it's human-readable — use as-is
  const name = source.includes(" ")
    ? source
    : source
        .split("-")
        .map((w) =>
          ACRONYMS.has(w.toUpperCase())
            ? w.toUpperCase()
            : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(" ");

  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const month = d.toLocaleString("en-CA", { month: "long" });
      return `From ${name} (${month} ${d.getFullYear()})`;
    }
  }
  return `From ${name}`;
}
