// Run the classifier against the golden set and report accuracy.
// Usage: ANTHROPIC_API_KEY=... tsx scripts/ingest-tests/run-classifier.ts
//
// Prints a per-case report plus aggregate accuracy. Target: >=18/20 (90%).

import { classifyCapture } from "../../api/_lib/ingest/classifier.js";
import { GOLDEN_SET } from "./golden-set.js";

function shortLabel(s: string, n = 32) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

interface Result {
  id: string;
  expected: string;
  got: string;
  confidence: string;
  correct: boolean;
  notes?: string;
  reasoning?: string;
  error?: string;
}

const CONF_ORDER: Record<string, number> = { low: 1, medium: 2, high: 3 };

async function runOne(c: (typeof GOLDEN_SET)[number]): Promise<Result> {
  try {
    const r = await classifyCapture({
      source_url: c.source_url,
      author_name: c.author_name,
      author_url: c.author_url,
      raw_text: c.raw_text,
      post_markdown: "",
    });
    if (!r.ok || !r.output) {
      return {
        id: c.id,
        expected: c.expected_class,
        got: "ERROR",
        confidence: "-",
        correct: false,
        error: r.error,
      };
    }
    const gotClass = r.output.classification;
    const gotConf = r.output.confidence;
    const classOk = gotClass === c.expected_class;
    const confOk = CONF_ORDER[gotConf] >= CONF_ORDER[c.expected_confidence_min];
    return {
      id: c.id,
      expected: c.expected_class,
      got: gotClass,
      confidence: gotConf,
      correct: classOk && confOk,
      reasoning: r.output.reasoning,
      notes: !classOk ? "wrong class" : !confOk ? "low confidence" : undefined,
    };
  } catch (e: any) {
    return {
      id: c.id,
      expected: c.expected_class,
      got: "EXCEPTION",
      confidence: "-",
      correct: false,
      error: String(e).slice(0, 200),
    };
  }
}

async function main() {
  console.log(`Running classifier against ${GOLDEN_SET.length} golden cases...\n`);

  const results: Result[] = [];
  // Run in small concurrency groups to avoid rate-limit walls
  const BATCH = 4;
  for (let i = 0; i < GOLDEN_SET.length; i += BATCH) {
    const slice = GOLDEN_SET.slice(i, i + BATCH);
    const batchResults = await Promise.all(slice.map(runOne));
    results.push(...batchResults);
    for (const r of batchResults) {
      const mark = r.correct ? "✓" : "✗";
      const note = r.notes ? ` (${r.notes})` : r.error ? ` (ERR: ${r.error})` : "";
      console.log(
        `${mark} ${r.id.padEnd(10)} expected=${r.expected.padEnd(14)} got=${r.got.padEnd(14)} conf=${r.confidence}${note}`
      );
      if (!r.correct && r.reasoning) {
        console.log(`    reasoning: ${shortLabel(r.reasoning, 120)}`);
      }
    }
  }

  // Aggregate
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const byClass: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    byClass[r.expected] = byClass[r.expected] || { correct: 0, total: 0 };
    byClass[r.expected].total += 1;
    if (r.correct) byClass[r.expected].correct += 1;
  }

  console.log(`\n=== ACCURACY ===`);
  console.log(`Overall: ${correct}/${total} (${Math.round((100 * correct) / total)}%)`);
  for (const [cls, r] of Object.entries(byClass)) {
    console.log(`  ${cls.padEnd(16)}: ${r.correct}/${r.total} (${Math.round((100 * r.correct) / r.total)}%)`);
  }

  const pct = (100 * correct) / total;
  if (pct >= 90) {
    console.log(`\nPASS: classifier met 90% target (${Math.round(pct)}%).`);
    process.exit(0);
  } else {
    console.log(`\nFAIL: classifier below 90% target (${Math.round(pct)}%). Iterate prompt/few-shots.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
