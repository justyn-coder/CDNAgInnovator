import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPortalPassword } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { org, password } = req.body || {};
  if (typeof org !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "org and password required" });
  }

  const ok = await verifyPortalPassword(org, password);
  if (!ok) return res.status(401).json({ ok: false });
  return res.status(200).json({ ok: true });
}
