// LinkedIn URL / handle normalization.
// Two canonical URLs for the same person must collapse to the same handle,
// or our people upsert creates duplicates.

export function normalizeLinkedInHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./i, ""))) return null;
    const match = u.pathname.match(/\/in\/([^/?#]+)/i);
    if (!match) return null;
    return decodeURIComponent(match[1]).toLowerCase().replace(/\/+$/, "").trim();
  } catch {
    // Try a regex fallback for bare paths (/in/handle) or non-URL strings that contain one
    const m = url.match(/linkedin\.com\/in\/([^\s/?#]+)/i);
    if (m) return decodeURIComponent(m[1]).toLowerCase().replace(/\/+$/, "").trim();
    return null;
  }
}

export function canonicalLinkedInUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return `https://www.linkedin.com/in/${handle}`;
}

export function isLinkedInPostUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      /linkedin\.com$/i.test(u.hostname.replace(/^www\./i, "")) &&
      /\/(posts|feed\/update|pulse)\//i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

// eTLD+1-ish extraction. Good enough for program website dedup where we
// compare domains across captures (proteinindustriescanada.ca vs www.proteinindustriescanada.ca).
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Used to build the idempotency key: source_url + captured_by + UTC hour.
// Kept application-side because Postgres wouldn't accept date_trunc in a unique index.
export function buildIdempotencyKey(
  sourceUrl: string | null | undefined,
  capturedBy: string,
  now: Date = new Date()
): string | null {
  if (!sourceUrl) return null;
  const iso = now.toISOString(); // 2026-04-18T14:27:31.123Z
  const hour = iso.slice(0, 13); // 2026-04-18T14
  return `${sourceUrl}|${capturedBy}|${hour}`;
}
