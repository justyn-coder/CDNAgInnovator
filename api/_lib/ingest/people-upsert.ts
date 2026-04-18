// People upsert — every capture's author gets a row, mentioned people too.
// Strategy: match by linkedin_handle first; fall back to trigram(name, organization).
// Always append role/org changes to history rather than overwriting silently.

import type { Sql } from "postgres";
import type { AuthorCanonical, MentionedPerson } from "./types.js";
import { normalizeLinkedInHandle, canonicalLinkedInUrl } from "./linkedin-normalize.js";

export interface UpsertPersonResult {
  person_id: number;
  action: "inserted" | "updated" | "skipped_excluded";
  was_author: boolean;
}

function getExcludedHandles(): Set<string> {
  const raw = process.env.PEOPLE_EXCLUSION_HANDLES || "";
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((h) => h.trim().toLowerCase().replace(/\/$/, ""))
      .filter(Boolean)
  );
}

function unionTags(existing: string[] | null, incoming: string[] | undefined): string[] {
  const set = new Set<string>();
  (existing || []).forEach((t) => set.add(t.toLowerCase().trim()));
  (incoming || []).forEach((t) => {
    if (t && t.trim()) set.add(t.toLowerCase().trim());
  });
  return Array.from(set).slice(0, 20); // soft cap
}

async function matchByHandle(sql: Sql, handle: string) {
  const rows = await sql`SELECT * FROM people WHERE linkedin_handle = ${handle} LIMIT 1`;
  return rows[0] || null;
}

async function matchByNameOrg(sql: Sql, name: string, organization: string | null) {
  if (!name || !organization) return null;
  // Only attempt fuzzy match when we have both fields and the match is strong.
  try {
    const rows = await sql`
      SELECT *,
        similarity(name, ${name}) AS sim_name,
        similarity(COALESCE(organization, ''), ${organization}) AS sim_org
      FROM people
      WHERE name % ${name} AND organization IS NOT NULL
      ORDER BY sim_name DESC, sim_org DESC
      LIMIT 1
    `;
    if (rows.length > 0 && (rows[0].sim_name as number) >= 0.85) {
      return rows[0];
    }
  } catch {
    // pg_trgm % operator requires default threshold; fall back silently.
  }
  return null;
}

interface UpsertInput {
  name: string;
  linkedin_url?: string | null;
  organization?: string | null;
  role_title?: string | null;
  location?: string | null;
  province?: string | null;
  bio_snippet?: string | null;
  topic_tags?: string[];
  seniority?: string;
  org_type?: string;
  capture_time: Date;
  is_author: boolean;
}

export async function upsertPerson(sql: Sql, input: UpsertInput): Promise<UpsertPersonResult | null> {
  const excluded = getExcludedHandles();

  const handle = normalizeLinkedInHandle(input.linkedin_url || undefined);

  if (handle && excluded.has(handle)) {
    return null;
  }

  // Use a fresh URL from handle if we got a messy one
  const canonicalUrl = handle ? canonicalLinkedInUrl(handle) : input.linkedin_url || null;

  const existing = handle
    ? await matchByHandle(sql, handle)
    : await matchByNameOrg(sql, input.name, input.organization || null);

  if (existing) {
    const existingId = existing.id as number;
    const historyEntries: any[] = [];

    if (
      input.organization &&
      existing.organization &&
      String(existing.organization).trim() !== String(input.organization).trim()
    ) {
      historyEntries.push({
        at: input.capture_time.toISOString(),
        field: "organization",
        from: existing.organization,
        to: input.organization,
      });
    }
    if (
      input.role_title &&
      existing.role_title &&
      String(existing.role_title).trim() !== String(input.role_title).trim()
    ) {
      historyEntries.push({
        at: input.capture_time.toISOString(),
        field: "role_title",
        from: existing.role_title,
        to: input.role_title,
      });
    }

    const mergedTags = unionTags(existing.topic_tags as string[] | null, input.topic_tags);
    const postCount = (existing.post_count as number) + (input.is_author ? 1 : 0);

    // Only overwrite non-null incoming values to avoid clobbering good existing data with nulls.
    await sql`
      UPDATE people SET
        linkedin_url = COALESCE(${canonicalUrl}, linkedin_url),
        linkedin_handle = COALESCE(${handle}, linkedin_handle),
        organization = COALESCE(${input.organization || null}, organization),
        role_title = COALESCE(${input.role_title || null}, role_title),
        location = COALESCE(${input.location || null}, location),
        province = COALESCE(${input.province || null}, province),
        bio_snippet = COALESCE(${input.bio_snippet || null}, bio_snippet),
        topic_tags = ${mergedTags},
        seniority = CASE WHEN ${input.seniority || null}::text IS NOT NULL AND ${input.seniority || null}::text != 'unknown' THEN ${input.seniority || null}::text ELSE seniority END,
        org_type = CASE WHEN ${input.org_type || null}::text IS NOT NULL AND ${input.org_type || null}::text != 'unknown' THEN ${input.org_type || null}::text ELSE org_type END,
        post_count = ${postCount},
        last_post_at = CASE WHEN ${input.is_author} THEN ${input.capture_time.toISOString()}::timestamptz ELSE last_post_at END,
        history = CASE WHEN ${historyEntries.length} > 0 THEN (history || ${sql.json(historyEntries)}) ELSE history END
      WHERE id = ${existingId}
    `;

    // Link to contacts if possible
    await linkToContacts(sql, existingId, canonicalUrl);

    return { person_id: existingId, action: "updated", was_author: input.is_author };
  }

  // Insert new person
  const topicTags = input.topic_tags || [];
  const rows = await sql`
    INSERT INTO people (
      name, linkedin_url, linkedin_handle, organization, role_title,
      location, province, bio_snippet, topic_tags, seniority, org_type,
      post_count, last_post_at, status
    ) VALUES (
      ${input.name},
      ${canonicalUrl},
      ${handle},
      ${input.organization || null},
      ${input.role_title || null},
      ${input.location || null},
      ${input.province || null},
      ${input.bio_snippet || null},
      ${topicTags}::text[],
      ${input.seniority || "unknown"},
      ${input.org_type || "unknown"},
      ${input.is_author ? 1 : 0},
      ${input.is_author ? input.capture_time.toISOString() : null},
      'observed'
    )
    RETURNING id
  `;
  const newId = rows[0].id as number;
  await linkToContacts(sql, newId, canonicalUrl);
  return { person_id: newId, action: "inserted", was_author: input.is_author };
}

async function linkToContacts(sql: Sql, personId: number, linkedinUrl: string | null) {
  if (!linkedinUrl) return;
  const handle = normalizeLinkedInHandle(linkedinUrl);
  if (!handle) return;
  // Match on handle inside contacts.linkedin (some rows may have the full URL)
  const matches = await sql`
    SELECT id FROM contacts
    WHERE linkedin ILIKE ${`%${handle}%`}
    LIMIT 1
  `;
  if (matches.length > 0) {
    const contactId = matches[0].id as number;
    await sql`
      UPDATE people SET contact_id = ${contactId}
      WHERE id = ${personId} AND contact_id IS NULL
    `;
  }
}

export function authorToUpsertInput(
  author: AuthorCanonical | undefined,
  captureTime: Date,
  fallbackName?: string,
  fallbackUrl?: string
): UpsertInput | null {
  const name = (author?.name || fallbackName || "").trim();
  if (!name) return null;
  return {
    name,
    linkedin_url: author?.linkedin_url || fallbackUrl || null,
    organization: author?.organization || null,
    role_title: author?.role_title || null,
    location: author?.location || null,
    province: author?.province || null,
    bio_snippet: author?.bio_snippet || null,
    topic_tags: author?.topic_tags || [],
    seniority: author?.seniority || "unknown",
    org_type: author?.org_type || "unknown",
    capture_time: captureTime,
    is_author: true,
  };
}

export function mentionedToUpsertInput(m: MentionedPerson, captureTime: Date): UpsertInput | null {
  const name = (m.name || "").trim();
  if (!name) return null;
  return {
    name,
    linkedin_url: m.linkedin_url || null,
    organization: m.organization || null,
    role_title: m.role_title || null,
    topic_tags: [],
    capture_time: captureTime,
    is_author: false,
  };
}
