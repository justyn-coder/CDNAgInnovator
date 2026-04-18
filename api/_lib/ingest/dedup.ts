// Program dedup cascade. Runs in tiers — first match wins — to avoid
// inserting duplicates when a LinkedIn post references an already-known program.

import type { Sql } from "postgres";
import type { ProgramCanonical } from "./types.js";
import { extractDomain } from "./linkedin-normalize.js";

export type DedupTier =
  | "exact_name"
  | "website_domain"
  | "normalized_name_province"
  | "trigram"
  | "no_match";

export interface DedupMatch {
  tier: DedupTier;
  program_id?: number;
  program_name?: string;
  similarity?: number;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|program|programme|fund|initiative|cohort)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function dedupProgram(
  sql: Sql,
  candidate: ProgramCanonical
): Promise<DedupMatch> {
  if (!candidate.name) return { tier: "no_match" };

  // Tier 1: exact name match (case-insensitive)
  const exact = await sql`
    SELECT id, name FROM programs
    WHERE lower(trim(name)) = lower(trim(${candidate.name}))
    LIMIT 1
  `;
  if (exact.length > 0) {
    return {
      tier: "exact_name",
      program_id: exact[0].id as number,
      program_name: exact[0].name as string,
    };
  }

  // Tier 2: website domain match
  const domain = extractDomain(candidate.candidate_website || "");
  if (domain) {
    const domainMatches = await sql`
      SELECT id, name, website FROM programs
      WHERE website ILIKE ${`%${domain}%`}
      LIMIT 5
    `;
    if (domainMatches.length > 0) {
      // Prefer exact domain match over substring
      const exact_domain = domainMatches.find((r: any) => {
        const d = extractDomain(r.website);
        return d === domain;
      });
      if (exact_domain) {
        return {
          tier: "website_domain",
          program_id: exact_domain.id as number,
          program_name: exact_domain.name as string,
        };
      }
    }
  }

  // Tier 3: normalized name + province overlap
  const normalized = normalizeName(candidate.name);
  if (normalized && candidate.province && candidate.province.length > 0) {
    const provinceArr = candidate.province;
    const normMatches = await sql`
      SELECT id, name, province FROM programs
      WHERE province && ${provinceArr}::text[]
      LIMIT 500
    `;
    for (const row of normMatches) {
      if (normalizeName(row.name as string) === normalized) {
        return {
          tier: "normalized_name_province",
          program_id: row.id as number,
          program_name: row.name as string,
        };
      }
    }
  }

  // Tier 4: trigram similarity on name (>0.7)
  try {
    const trig = await sql`
      SELECT id, name, similarity(name, ${candidate.name}) AS sim
      FROM programs
      WHERE name % ${candidate.name}
      ORDER BY sim DESC
      LIMIT 3
    `;
    if (trig.length > 0 && (trig[0].sim as number) > 0.7) {
      return {
        tier: "trigram",
        program_id: trig[0].id as number,
        program_name: trig[0].name as string,
        similarity: trig[0].sim as number,
      };
    }
  } catch {
    // pg_trgm operator may not work without SET pg_trgm.similarity_threshold;
    // fall through to no_match.
  }

  return { tier: "no_match" };
}

export function hasRequiredProgramFields(p: ProgramCanonical | undefined): boolean {
  if (!p) return false;
  if (!p.name || p.name.trim().length < 3) return false;
  if (!p.candidate_website) return false;
  if (!p.category) return false;
  if (!p.province || p.province.length === 0) return false;
  return true;
}
