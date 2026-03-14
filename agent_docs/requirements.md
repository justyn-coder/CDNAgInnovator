# Requirements & Backlog

## North Star

### Why This Exists

CDNAgInnovator is a free public tool built to establish Justyn Szymczyk as a credible, trusted operator inside the Canadian AgTech ecosystem. The primary business goal is lead generation: founders and early-stage AgTech companies who find value in the tool are the exact profile that benefits from Best In Show (BIS) trade show consulting. The tool is the top of the funnel.

### Rollout Approach

1. Share V1 with a tight first ring: Calgary AgTech 2026 contacts, Marlise and ecosystem connectors, select accelerators and incubators
2. Gather feedback on accuracy, gaps, and missing programs before wider distribution
3. Use provider buy-in (gov bodies, investors, crop advisors, agrologists) to validate data and earn dissemination partners
4. Iterate publicly and visibly — the build process itself signals credibility

### The Bigger Goal

The aspirational purpose is to connect every facet of the Canadian ag innovation ecosystem — founders, funders, accelerators, universities, agrologists, farmers, and crop advisors — so they can work together more efficiently to ideate, build, test, and adopt Canadian-built technologies. The end state: Canadian farmers are more profitable, more efficient, and tread lighter on the land, while producing food that keeps Canadians healthy. This is the mission that earns trust from ecosystem partners beyond just the startup audience.

### Decision Filter

When scoping features, prioritize anything that: moves a founder faster through the ecosystem, surfaces a connection they wouldn't have found otherwise, or gives an ecosystem partner a reason to share the tool. Deprioritize anything that adds complexity without serving those three outcomes.

---

## Status Key
- ✅ Done
- 🔧 Known bug / needs fix
- 📋 Planned, not started
- 🔜 Next up

---

## Known Issues (Fix Queue)

### 🔧 Atlantic Province Expansion Bug
**Severity:** Medium — affects ~5% of users (Atlantic founders)
**What:** Wizard sends `"Atlantic"` as a province value. DB stores individual codes: `NB`, `NS`, `PE`, `NL`. Pathway API has expansion logic (line ~136) but it may not be fully wired through all code paths.
**Fix:** Verify expansion works in pathway API. Also check chat API and gaps API for same issue.

### 🔧 Pathway Quality Issues
**Severity:** High — directly affects the "holy shit" moment
**What:** Flagged during Vivid Machines usability test. Pathway recommendations can be generic or miss obvious matches.
**Fix needed:** Test pathway output across multiple province/stage/need combos. Tune the system prompt, category mapping, or program data as needed. Key test cases: AB/MVP/validate-with-farmers, ON/Idea/non-dilutive-capital, SK/Pilot/credibility-validation.

### 🔧 WizardSummary Missing Need Pill
**Severity:** Low — cosmetic
**What:** WizardSummary strip above chat shows stage and provinces but not the selected need(s).
**Fix:** Add need display to WizardSummary component in Navigator.tsx.

---

## Recently Completed

### ✅ Feedback Admin Endpoint (March 13, 2026)
- `/api/admin/feedback` with Bearer token auth via `ADMIN_SECRET` env var
- HTML table view for browser access, JSON for programmatic access
- Email notifications via nodemailer/Gmail SMTP on new submissions
- Env vars: `ADMIN_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFY_EMAIL`

### ✅ Knowledge Base Expansion (March 13, 2026)
- 127 entries (up from 65), verified against CFIN + CAPI/EMILI source reports
- Calgary conference insights processed (Matt Gosling, Chris Patterson, Garth Donald, etc.)
- BASF grower journey analysis entries (3 entries)

### ✅ V1 Feature Set (March 11-12, 2026)
- PathwayCard with phased loading, stage journey bar, section headers, drill-in
- Wizard with multi-select needs, Generate button
- GapMatrix with AI explain button and inline onboarding
- Feedback button with modal, email persistence, page context tagging
- Eco operator engagement CTA (floating amber, appears after 20s/2 messages)
- Browse All → "Explore All Programs" card-list with province filter
- Beta welcome modal, mode badge in nav
- Smart knowledge retrieval (tag matching)
- Copy button on chat responses
- Markdown bullet fix in chat

---

## Feature Backlog (Priority Order)

### 1. 📋 Pathway Quality Testing
Test pathway output across province/stage/need combos. Run as personas: Marlise (FCC, Manitoba), Chris (AgSphere, Alberta), Leanna (BDC, national). Fix prompt/data issues found.

### 2. 📋 Test Follow-Up Chat Flow from PathwayCard
Verify that clicking drill-in on a pathway step produces a useful, contextual chat response. The chat receives wizard context + the specific question.

### 3. 📋 Program Cards in Chat Responses
Chat responses mention program names in markdown. These should render as styled cards (matching the design language) with name, category badge, and link. Requires client-side parsing of program names in chat output and rendering as components.

### 4. 📋 Email Capture After Pathway Generation
Soft ask after pathway renders: "Want updates when new programs match your profile?" Not gated — user can dismiss. Captures email + wizard snapshot for future outreach. Store in a new table or extend submissions.

### 5. 📋 CCA/Agrologist Integration Deepening
Context exists in separate chat history. Pull CCA/agronomist channel insights into pathway and chat logic more deeply. Named access points: AgSphere, Farming Smarter Field-Tested program, ICAN, CCA networks, provincial agrologist institutes.

### 6. 📋 Cowork Space Scheduled Scraping
Automate periodic checks of coworking/incubator space availability. Low priority — manual updates sufficient for now.

### 7. 📋 Opportunity Brief Feature
AI-generated summary document for a specific founder profile: "Here's the landscape for your company." Could be a PDF or shareable link. Builds on PathwayCard output but is more comprehensive and downloadable.

### 8. 📋 Ecosystem Health Score
Aggregate metric per province: how well-served is the agtech ecosystem? Combines gap data, program density, funding availability, advisor channel presence. For operator mode.

### 9. 📋 ADT (Ag Data Transparent) Certification
Relevance for Opportunity Brief and future vendor directory features. Not V1.

### 10. 📋 Moosepath Branding
Name candidate for the product. Deferred as non-critical.

---

## Data Quality Tasks

### 📋 URL Audit
Run periodic check for broken/null URLs in programs table. One broken link during a demo kills trust. Query: `SELECT name, website FROM programs WHERE website IS NULL OR website = ''`.

### 📋 Program Freshness Cycle
Programs close intakes, change URLs, rebrand. Quarterly audit minimum, monthly for high-traffic programs. Could build a simple URL checker that flags 404s.

### 📋 Knowledge Entry Maintenance
Process feedback submissions into knowledge entries or program updates. Weekly 30-minute block. Source: submissions table + conference conversations + ecosystem newsletter monitoring.

---

## Persona-Based Usability Audit (Not Yet Done)

Run through both founder and operator paths as each target persona:

**Marlise (FCC Capital, Manitoba):** Farm credit background, knows every program, will test whether the tool surfaces things she doesn't already know. Key question: does Gap Map reveal something non-obvious?

**Chris Patterson (AgSphere, Alberta):** VC-adjacent, skeptical, concierge model operator. Will test founder path quality and whether operator chat gives analytical value beyond what he already knows.

**Leanna Kito (BDC Capital, national):** Government process-oriented, national perspective. Will test cross-province coverage and whether the tool helps her understand regional gaps.

Test protocol: Walk through both paths as each persona. Note what's broken, confusing, or missing. Pay attention to first 30 seconds — ecosystem operators decide fast.
