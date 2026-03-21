import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const GROOMER_SYSTEM_PROMPT = `You are Justyn's task grooming assistant. Your job is to take raw intake tasks and flesh them out so Justyn can approve/reject them in the morning briefing without needing to think through the approach himself.

You will receive a JSON array of tasks. For each task, return a JSON array of groomed tasks with these fields:

- id: the task ID (pass through EXACTLY as received — do not modify)
- approach: numbered steps. Each step starts with who does it: "Claude Code: ...", "Claude Chat: ...", "Cowork: ...", "You: ...", "Chrome: ...". Be specific enough that Claude Code or Cowork could execute without additional context.
- tools: comma-separated list. Pick from: Claude Code, Claude Chat, Cowork, Chrome, Supabase, Gmail, Google Sheets, Skills
- effort: one of: 5min, 15min, 30min, 1hr, 2hr, half-day, full-day
- action_required: one sentence describing what Justyn needs to decide. Frame as yes/no or choice question when possible. If the task already has an existing_action_required that is specific and clear, you may keep it — but improve it if it's vague.
- due_date: ISO 8601 timestamp if a deadline is clearly implied by context (use 21:00:00Z as default time). null if no deadline.
- auto_approve: true if ALL of these conditions are met: effort is "5min" or "15min", all steps are autonomous (no "You:" steps), track is NOT "bis". Otherwise false.
- skip_reason: if the task is too vague to groom, explain why. null if groomed successfully.

CRITICAL: You MUST return exactly one entry per input task, with the same id. Never drop, merge, or reorder tasks.

Priority framework for ordering steps: revenue proximity > time sensitivity > blocking others > effort-to-impact.
Track priority: BIS >= Trellis > Winery > Kulture.

Respond ONLY with a JSON array. No markdown, no backticks, no preamble.`;

const RED_TEAM_PROMPT = `You are a critical reviewer of task execution plans. Your job is to find flaws BEFORE Justyn sees them.

You will receive a JSON array of groomed tasks — each with an approach (numbered steps), tools, and effort estimate. For each task, ruthlessly evaluate:

1. **Will this actually work?** Would Claude Code or Cowork be able to execute these steps right now without hitting a wall? Are there missing prerequisites, unclear references, or assumed access that might not exist?
2. **Is anything missing?** Are there steps that should be there but aren't? Does the approach skip over hard parts?
3. **Is the effort estimate realistic?** Based on what's being asked, is the time estimate honest or optimistic?
4. **Are the tools right?** Is this using the best tool for the job, or is there a simpler path?
5. **Can more be autonomous?** Are there "You:" steps that could actually be handled by Claude Code, Cowork, or another tool? Push every step toward autonomous execution. Only assign "You:" when it genuinely requires Justyn's judgment, physical action, or access Claude doesn't have.
6. **Is the action_required clear?** Would Justyn know exactly what to decide in under 10 seconds?

For each task, return the REVISED version with improvements applied. If the approach was already solid, return it unchanged but add a "red_team_notes" field set to "Approach validated — no issues found."

CRITICAL: You MUST return exactly one entry per input task, with the same id. Never drop, merge, or reorder tasks.

Return a JSON array with the same fields as the input, plus:
- red_team_notes: string — what you changed and why, or "Approach validated — no issues found." Keep it to 1-2 sentences.

If a task is fundamentally broken (vague goal, impossible to execute, missing critical context), set skip_reason to explain why and set red_team_notes to the same explanation.

Respond ONLY with a JSON array. No markdown, no backticks, no preamble.`;

// Call Claude API helper
async function callClaude(system: string, userMessage: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-20250514",
      max_tokens: 8192,
      temperature: 0,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    return { ok: false, error: `${apiRes.status}: ${errText.slice(0, 200)}` };
  }

  const data = (await apiRes.json()) as any;
  return { ok: true, text: data.content?.[0]?.text || "" };
}

// Parse Claude JSON response
function parseClaudeJson(raw: string): any[] | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// Validate that Pass 2 returned all expected IDs; fill gaps from Pass 1
function reconcilePasses(pass1: any[], pass2: any[]): any[] {
  const pass2Map = new Map(pass2.map((t: any) => [t.id, t]));
  return pass1.map((p1: any) => {
    const p2 = pass2Map.get(p1.id);
    if (p2) return p2;
    // Red team dropped this task — use Pass 1 version
    return { ...p1, red_team_notes: "Red team did not return this task — using original approach." };
  });
}

// Determine status based on auto-approval
function getStatus(groomed: any): string {
  return groomed.auto_approve === true ? "in_progress" : "review";
}

// Validate a due_date string is parseable
function isValidDate(d: any): boolean {
  if (!d || typeof d !== "string") return false;
  return !isNaN(Date.parse(d));
}

// Allow up to 300s for Opus generate + red-team passes across multiple batches
export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both POST (manual trigger) and GET (Vercel cron)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).end();
  }

  // Auth: Vercel crons send CRON_SECRET, manual calls use ADMIN_SECRET
  const authHeader = req.headers["authorization"] || "";
  const validCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = authHeader === `Bearer ${process.env.ADMIN_SECRET}`;
  if (!validCron && !validAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Mode: "groom" (default, nightly cron) or "redteam" (re-run existing tasks through red team only)
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  const mode = url.searchParams.get("mode") || "groom";

  if (mode !== "groom" && mode !== "redteam") {
    return res.status(400).json({ error: "Invalid mode. Use 'groom' or 'redteam'." });
  }

  try {
    // 1. Check recent task_log to calibrate (groom mode only)
    let calibrationContext = "";
    if (mode === "groom") {
      const recentLogs = await sql`
        SELECT tl.task_id, tl.event, tl.actual_effort, tl.notes,
               ht.title, ht.track, ht.effort AS estimated_effort
        FROM task_log tl
        JOIN hq_tasks ht ON ht.id = tl.task_id
        ORDER BY tl.timestamp DESC
        LIMIT 20
      `;
      if (recentLogs.length > 0) {
        calibrationContext = `\n\nRECENT TASK HISTORY (use to calibrate estimates):\n${recentLogs.map((l: any) =>
          `- ${l.task_id} "${l.title}" [${l.track}]: estimated ${l.estimated_effort}, actual ${l.actual_effort || "unknown"}, event: ${l.event}`
        ).join("\n")}`;
      }
    }

    // 2. Query tasks based on mode
    let tasks: any[];
    if (mode === "groom") {
      tasks = await sql`
        SELECT id, title, track, context, approach, tools, action_required,
               priority, review_notes, source, effort
        FROM hq_tasks
        WHERE status = 'intake'
          AND (approach IS NULL OR approach = '' OR approach = 'TBD')
        ORDER BY priority ASC NULLS LAST
      `;
    } else {
      // redteam mode: all non-done/killed tasks that HAVE an approach
      tasks = await sql`
        SELECT id, title, track, context, approach, tools, action_required,
               priority, review_notes, source, effort, status
        FROM hq_tasks
        WHERE status NOT IN ('done', 'killed')
          AND approach IS NOT NULL
          AND approach != ''
          AND approach != 'TBD'
        ORDER BY priority ASC NULLS LAST
      `;
    }

    if (tasks.length === 0) {
      await sql`
        INSERT INTO task_log (task_id, event, notes, timestamp)
        VALUES ('SYSTEM', ${mode === "groom" ? "groomer_run" : "redteam_run"}, ${`No tasks found for ${mode} mode`}, NOW())
      `;
      return res.status(200).json({ processed: 0, message: `No tasks to ${mode}` });
    }

    // 3. Batch tasks into groups of 10
    const BATCH_SIZE = 10;
    const allTaskPayloads = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      track: t.track,
      context: t.context,
      approach: t.approach || null,
      tools: t.tools || null,
      effort: t.effort || null,
      review_notes: t.review_notes,
      source: t.source,
      priority: t.priority,
      existing_action_required: t.action_required,
      current_status: t.status || "intake",
    }));

    const batches: any[][] = [];
    for (let i = 0; i < allTaskPayloads.length; i += BATCH_SIZE) {
      batches.push(allTaskPayloads.slice(i, i + BATCH_SIZE));
    }

    // 4. Process each batch
    let processedTasks: any[] = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      if (mode === "groom") {
        // --- Pass 1: Generate approaches ---
        const genMessage = `Groom these ${batch.length} intake tasks:${calibrationContext}

TASKS:
${JSON.stringify(batch, null, 2)}`;

        const genResult = await callClaude(GROOMER_SYSTEM_PROMPT, genMessage);

        if (!genResult.ok) {
          console.error("Groomer Pass 1 error:", genResult.error);
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'groomer_error', ${`Pass 1 failed on batch ${batchIdx + 1} of ${batches.length}: ${genResult.error}`}, NOW())
          `;
          continue;
        }

        const pass1Tasks = parseClaudeJson(genResult.text || "");
        if (!pass1Tasks) {
          console.error("Groomer Pass 1 parse failed:", (genResult.text || "").slice(0, 500));
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'groomer_parse_error', ${`Pass 1 parse failed batch ${batchIdx + 1}: ${(genResult.text || "").slice(0, 200)}`}, NOW())
          `;
          continue;
        }

        // --- Pass 2: Red team the approaches ---
        const rtMessage = `Red-team these ${pass1Tasks.length} groomed task plans. Fix what's broken, improve what's weak, push "You:" steps to autonomous where possible.

GROOMED TASKS:
${JSON.stringify(pass1Tasks, null, 2)}`;

        const rtResult = await callClaude(RED_TEAM_PROMPT, rtMessage);

        if (!rtResult.ok) {
          console.error("Groomer Pass 2 (red team) error:", rtResult.error);
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'groomer_warning', ${`Red team failed on batch ${batchIdx + 1}, using Pass 1 results: ${rtResult.error}`}, NOW())
          `;
          processedTasks = processedTasks.concat(pass1Tasks);
          continue;
        }

        const pass2Tasks = parseClaudeJson(rtResult.text || "");
        if (!pass2Tasks) {
          console.error("Groomer Pass 2 parse failed:", (rtResult.text || "").slice(0, 500));
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'groomer_warning', ${`Red team parse failed batch ${batchIdx + 1}, using Pass 1 results`}, NOW())
          `;
          processedTasks = processedTasks.concat(pass1Tasks);
          continue;
        }

        // Reconcile: ensure no tasks were dropped by red team
        const reconciled = reconcilePasses(pass1Tasks, pass2Tasks);
        processedTasks = processedTasks.concat(reconciled);

      } else {
        // redteam mode: skip Pass 1, send existing approaches directly to red team
        const rtMessage = `Red-team these ${batch.length} existing task plans. Fix what's broken, improve what's weak, push "You:" steps to autonomous where possible.

EXISTING TASKS:
${JSON.stringify(batch, null, 2)}`;

        const rtResult = await callClaude(RED_TEAM_PROMPT, rtMessage);

        if (!rtResult.ok) {
          console.error("Red team error:", rtResult.error);
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'redteam_error', ${`Red team failed on batch ${batchIdx + 1}: ${rtResult.error}`}, NOW())
          `;
          continue;
        }

        const rtTasks = parseClaudeJson(rtResult.text || "");
        if (!rtTasks) {
          console.error("Red team parse failed:", (rtResult.text || "").slice(0, 500));
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES ('SYSTEM', 'redteam_parse_error', ${`Parse failed batch ${batchIdx + 1}: ${(rtResult.text || "").slice(0, 200)}`}, NOW())
          `;
          continue;
        }

        // Reconcile against original batch to catch dropped tasks
        const reconciled = reconcilePasses(batch, rtTasks);
        processedTasks = processedTasks.concat(reconciled);
      }
    }

    // 5. Apply updates
    let updatedCount = 0;
    let skippedCount = 0;
    let autoApprovedCount = 0;
    const results: any[] = [];

    // Build a lookup of original task status so redteam mode doesn't override it
    const originalStatusMap = new Map(tasks.map((t: any) => [t.id, t.status || "intake"]));

    for (const g of processedTasks) {
      if (!g.id) continue;

      // Find original task to preserve fields we shouldn't overwrite
      const originalStatus = originalStatusMap.get(g.id) || "intake";

      if (g.skip_reason) {
        skippedCount++;
        await sql`
          INSERT INTO task_log (task_id, event, notes, timestamp)
          VALUES (${g.id}, 'groomer_skipped', ${g.skip_reason}, NOW())
        `;
        results.push({ id: g.id, action: "skipped", reason: g.skip_reason });
        continue;
      }

      try {
        if (mode === "groom") {
          // Full update: approach, tools, effort, action_required, status
          const newStatus = getStatus(g);
          await sql`
            UPDATE hq_tasks SET
              approach = ${g.approach || null},
              tools = ${g.tools || null},
              effort = ${g.effort || null},
              action_required = ${g.action_required || null},
              due_date = ${isValidDate(g.due_date) ? g.due_date : null},
              auto_approve = ${g.auto_approve || false},
              status = ${newStatus},
              updated_at = NOW()
            WHERE id = ${g.id}
          `;

          const event = g.auto_approve ? "auto_approved" : "groomed";
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES (${g.id}, ${event}, ${g.auto_approve ? `Auto-approved: effort=${g.effort}, all autonomous steps` : `Groomed: tools=${g.tools}, effort=${g.effort}`}, NOW())
          `;
          if (g.auto_approve) autoApprovedCount++;
        } else {
          // Redteam mode: only update approach, tools, effort, action_required — preserve status
          await sql`
            UPDATE hq_tasks SET
              approach = ${g.approach || null},
              tools = ${g.tools || null},
              effort = ${g.effort || null},
              action_required = ${g.action_required || null},
              updated_at = NOW()
            WHERE id = ${g.id}
          `;
        }

        // Log red team notes if the approach was revised
        const rtNotes = g.red_team_notes || "";
        if (rtNotes && rtNotes !== "Approach validated — no issues found.") {
          await sql`
            INSERT INTO task_log (task_id, event, notes, timestamp)
            VALUES (${g.id}, 'red_team_revised', ${rtNotes}, NOW())
          `;
        }

        updatedCount++;
        results.push({ id: g.id, action: mode === "redteam" ? "red_teamed" : (g.auto_approve ? "auto_approved" : "groomed"), red_team_notes: rtNotes || null });
      } catch (taskErr) {
        console.error(`Failed to update task ${g.id}:`, taskErr);
        await sql`
          INSERT INTO task_log (task_id, event, notes, timestamp)
          VALUES (${g.id}, 'groomer_task_error', ${`Update failed: ${String(taskErr).slice(0, 200)}`}, NOW())
        `;
        results.push({ id: g.id, action: "error", error: String(taskErr).slice(0, 100) });
      }
    }

    // 6. Log the overall run
    await sql`
      INSERT INTO task_log (task_id, event, notes, timestamp)
      VALUES ('SYSTEM', ${mode === "groom" ? "groomer_run" : "redteam_run"}, ${`${mode}: updated ${updatedCount}, auto-approved ${autoApprovedCount}, skipped ${skippedCount} of ${tasks.length} tasks`}, NOW())
    `;

    return res.status(200).json({
      mode,
      updated: updatedCount,
      auto_approved: autoApprovedCount,
      skipped: skippedCount,
      total_tasks: tasks.length,
      results,
    });
  } catch (e) {
    console.error("Groomer error:", e);
    return res.status(500).json({ error: "Groomer failed" });
  }
}
