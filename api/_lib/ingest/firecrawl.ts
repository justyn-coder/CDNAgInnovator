// Firecrawl wrapper. Minimal API surface: fetch a URL, get clean markdown + metadata.
// Falls through gracefully if FIRECRAWL_API_KEY is unset (returns null).

export interface FirecrawlScrapeResult {
  markdown: string;
  title?: string;
  description?: string;
  ok: boolean;
  error?: string;
}

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";

export async function scrapeUrl(
  url: string,
  opts: { timeoutMs?: number; onlyMainContent?: boolean } = {}
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { markdown: "", ok: false, error: "FIRECRAWL_API_KEY not configured" };
  }

  const timeout = opts.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(FIRECRAWL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: opts.onlyMainContent ?? true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        markdown: "",
        ok: false,
        error: `firecrawl ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as any;
    const md = data?.data?.markdown || "";
    return {
      markdown: md,
      title: data?.data?.metadata?.title,
      description: data?.data?.metadata?.description,
      ok: typeof md === "string" && md.length > 0,
    };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "firecrawl timeout" : String(e).slice(0, 200);
    return { markdown: "", ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

// Light Firecrawl search wrapper — used when we need to resolve a program
// name to a website when the capture didn't include one.
export async function searchWeb(
  query: string,
  limit = 5,
  timeoutMs = 10000
): Promise<{ ok: boolean; results: Array<{ url: string; title?: string; description?: string }>; error?: string }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { ok: false, results: [], error: "FIRECRAWL_API_KEY not configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, results: [], error: `firecrawl-search ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as any;
    const results = Array.isArray(data?.data)
      ? data.data.map((r: any) => ({ url: r.url, title: r.title, description: r.description }))
      : [];
    return { ok: true, results };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "firecrawl-search timeout" : String(e).slice(0, 200);
    return { ok: false, results: [], error: msg };
  } finally {
    clearTimeout(timer);
  }
}
