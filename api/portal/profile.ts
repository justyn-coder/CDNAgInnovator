import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

const ALLOWED_STAGES = new Set(["MVP", "Pilot", "Comm", "Scale"]);

function sanitizeProfile(incoming: any): Record<string, any> | null {
  if (!incoming || typeof incoming !== "object") return null;
  const out: Record<string, any> = {};
  if (typeof incoming.description === "string" && incoming.description.trim()) {
    out.description = incoming.description.trim().slice(0, 1200);
  }
  if (typeof incoming.stage === "string" && ALLOWED_STAGES.has(incoming.stage)) {
    out.stage = incoming.stage;
  } else if (incoming.stage === null) {
    out.stage = null;
  }
  if (Array.isArray(incoming.provinces)) {
    out.provinces = incoming.provinces
      .filter((p: any) => typeof p === "string")
      .map((p: string) => p.trim().toUpperCase().slice(0, 3))
      .filter((p: string) => p.length >= 2 && p.length <= 3);
  }
  if (typeof incoming.sector === "string") {
    out.sector = incoming.sector.trim().slice(0, 80) || null;
  }
  if (typeof incoming.primary_need === "string") {
    out.primary_need = incoming.primary_need.trim().slice(0, 120) || null;
  }
  if (typeof incoming.last_summary_text === "string") {
    out.last_summary_text = incoming.last_summary_text.trim().slice(0, 2000);
  }
  if (typeof incoming.source === "string") {
    out.source = incoming.source.trim().slice(0, 40);
  }
  out.last_summary_at = new Date().toISOString();
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST" && req.method !== "PATCH") return res.status(405).end();

  const { org, person, profile } = req.body || {};
  if (typeof org !== "string" || typeof person !== "string") {
    return res.status(400).json({ error: "org and person required" });
  }
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  const cleaned = sanitizeProfile(profile);
  if (!cleaned) return res.status(400).json({ error: "profile payload missing or invalid" });

  const existing = (identity.founder_profile || {}) as Record<string, any>;
  const merged = { ...existing, ...cleaned };

  await sql`
    UPDATE portal_people
    SET founder_profile = ${JSON.stringify(merged)}::jsonb
    WHERE org = ${org} AND person = ${person}
  `;

  await logEvent({
    req, org, person,
    event_type: "profile_update",
    path: "/portal/home",
    metadata: { source: cleaned.source || "manual", fields: Object.keys(cleaned) },
  });

  return res.status(200).json({ ok: true, profile: merged });
}
