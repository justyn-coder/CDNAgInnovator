---
name: resume-task
description: Resume an HQ task by ID. Fetches the task card from Supabase hq_tasks, follows the approach steps, executes autonomously where marked, pauses for human steps, and updates the card status when done. Trigger when user says "resume T-XX", "work on T-XX", "pick up T-XX", or references an HQ task ID.
---

# Resume HQ Task

When the user references an HQ task (e.g., "resume T-05", "work on B-02", "pick up G-14"), follow this protocol exactly.

## Step 1: Fetch the task card

Query Supabase (project `slttpknnuthbttjuzrnz`) for the task:

```sql
SELECT id, title, status, approach, context, tools, action_required, depends_on, review_notes
FROM hq_tasks WHERE id = '{TASK_ID}';
```

If the task is `done` or `killed`, tell the user and stop.
If the task is `blocked`, show what it's blocked on (`depends_on`) and ask if they want to override.

## Step 2: Display a brief status line

Format:
```
[T-05] URL audit via Chrome extension | Status: in_progress
Context: {first sentence of context}
Steps: {count} | Claude auto: {count} | Human: {count}
```

Do NOT dump the full card contents. The user has already seen it in HQ.

## Step 3: Parse the approach into steps

Split the `approach` field on `\n`. Each numbered line is a step. Classify each:

- **Claude auto**: line contains "Claude", "autonomous", "auto", or "Claude Code"
- **Human**: line contains "You", "manual", "review", "approve", or "Open"
- **Hybrid**: line contains "You +" or references both human and tool

If approach contains a `---` separator followed by a prompt (like "CLAUDE CODE PROMPT:"), that's the execution instruction for the autonomous steps.

## Step 4: Execute

For each step in order:

### Claude auto steps:
- Execute immediately without asking permission
- Use available tools: Supabase MCP for DB operations, Bash for scripts, WebSearch for research, etc.
- Report progress briefly: "Step 2 complete: built and ran URL checker, 410 programs scanned."

### Human steps:
- State clearly what the user needs to do
- Format as an actionable instruction, not a question
- Pause and wait for user confirmation before proceeding to next step
- Example: "Step 3 is yours: Open the CSV at link-audit/url-audit-results.csv, filter to low-confidence rows. Let me know when you've identified the bad URLs."

### Hybrid steps:
- Do the Claude part, then tell the user what remains for them

## Step 5: Close the task

When all steps are complete (or the user says to mark it done), update the card:

```sql
UPDATE hq_tasks SET
  status = 'done',
  completed_at = NOW(),
  deliverable_summary = '{what was accomplished, tools used, key numbers}'
WHERE id = '{TASK_ID}';
```

If there's a deliverable URL (deployed site, CSV file, etc.), also set `deliverable_url`.

Report: "[T-05] marked done. Summary: {one line}."

## Step tracking (Tier 3)

As you work through steps, update the `steps` JSONB column so the HQ dashboard shows real-time progress:

```sql
UPDATE hq_tasks SET steps = '[
  {"text": "Step 1 description", "who": "Claude", "status": "done", "auto": true},
  {"text": "Step 2 description", "who": null, "status": "in_progress", "auto": false},
  {"text": "Step 3 description", "who": "You", "status": "pending", "auto": false}
]'::jsonb WHERE id = '{TASK_ID}';
```

Update after completing each Claude step. The dashboard will show:
- Green checkmark for done steps
- Blue pulse for in_progress steps
- "Your turn" badge on the first pending human step

If the task requires a git push to deploy, also set `deploy_command`:
```sql
UPDATE hq_tasks SET deploy_command = 'cd ~/Documents/GitHub/{repo} && git add -A && git commit -m "{message}" && git push' WHERE id = '{TASK_ID}';
```

## Rules

1. **Never ask what to do when the card already says.** The approach IS the plan.
2. **Never summarize options.** Execute the next step.
3. **Brief progress, not narration.** "Step 2 done: 97 URLs fixed." not a paragraph.
4. **If a step fails, try to fix it.** Only escalate to the user if you're genuinely stuck.
5. **If the approach is empty or vague, propose steps** based on the title/context, then execute after brief user confirmation.
6. **Always update the card at the end.** No orphaned in_progress tasks.
7. **Always update steps JSONB as you go.** The dashboard is the user's visibility into your progress.
