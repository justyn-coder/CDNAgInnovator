export type InterestStatus = "interested" | "applied" | "dismissed";

export interface InterestEntry {
  status: InterestStatus;
  programName: string;
  updatedAt: string; // ISO timestamp
}

export type InterestMap = Record<string, InterestEntry>; // keyed by program_id (string)

const STORAGE_KEY = "trellis_program_interest";

export function readInterests(): InterestMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeInterest(
  programId: number,
  programName: string,
  status: InterestStatus | null,
): InterestMap {
  const map = readInterests();
  const key = String(programId);
  if (status === null) {
    delete map[key];
  } else {
    map[key] = { status, programName, updatedAt: new Date().toISOString() };
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
  return map;
}

/**
 * Merge local and remote interests. Most recent updatedAt wins per program.
 */
export function mergeInterests(
  local: InterestMap,
  remote: InterestMap,
): InterestMap {
  const merged: InterestMap = { ...local };
  for (const [key, remoteEntry] of Object.entries(remote)) {
    const localEntry = merged[key];
    if (!localEntry || new Date(remoteEntry.updatedAt) > new Date(localEntry.updatedAt)) {
      merged[key] = remoteEntry;
    }
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
  return merged;
}

/** Count interests by status */
export function countInterests(map: InterestMap): { interested: number; applied: number; dismissed: number; total: number } {
  let interested = 0, applied = 0, dismissed = 0;
  for (const entry of Object.values(map)) {
    if (entry.status === "interested") interested++;
    else if (entry.status === "applied") applied++;
    else if (entry.status === "dismissed") dismissed++;
  }
  return { interested, applied, dismissed, total: interested + applied + dismissed };
}
