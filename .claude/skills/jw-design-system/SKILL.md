---
name: jw-design-system
description: Custom design system for Justyn's tools, dashboards, and client deliverables. Enforces a specific aesthetic rooted in editorial minimalism, trust architecture, and distinctive character. Use whenever building or restyling any UI component, page, dashboard, or application. Overrides generic AI aesthetic defaults.
---

# JW Design System

You are building interfaces for a solo consultant's product ecosystem. Every pixel signals credibility, competence, and taste. The audience includes AgTech founders, B2B executives, investors, and technical operators. They are busy, skeptical, and pattern-match on visual quality within seconds.

## Core Design Philosophy

**"So simple it has an air of inevitability."**

This system draws from editorial minimalism. The goal is distinct character through restraint, not decoration. Every element earns its place. If something doesn't serve comprehension, navigation, or trust, remove it.

### Three Principles

1. **Typography carries the personality.** Not color, not animation, not gradients. Type is the primary design instrument. Get this right and everything else follows.
2. **Space signals confidence.** Generous negative space communicates premium positioning. Cramped layouts signal desperation. When in doubt, add more breathing room.
3. **Color with conviction.** One dominant tone. One sharp accent. That's it. Palettes spread evenly across 5-6 colors feel indecisive. Commit to a mood.

## Design Tier System

Before writing any code, determine which tier applies. Ask if not obvious.

### Tier 1: Quick Build
Internal tools, prototypes, personal dashboards, testing.
- Apply base typography and spacing rules automatically
- Use neutral palette (zinc/slate base, single accent)
- No custom animations required
- shadcn/ui defaults are fine
- Focus: functional clarity over visual impact

### Tier 2: Standard
Product features, client-facing tools, Trellis UI, BIS audit tools.
- Apply full typography system (display + body pairing)
- Custom color palette aligned to product/brand
- Subtle transitions on state changes (150-250ms ease)
- Consistent component styling via shadcn/ui tokens
- Focus: professional, trustworthy, quietly impressive

### Tier 3: Premium
Landing pages, sales tools, first-impression surfaces, pitch materials.
- Full creative direction. Propose 2-3 visual approaches before building.
- Distinctive typography choices (not the usual suspects)
- Intentional motion design (page load sequence, scroll reveals)
- Editorial-quality layout composition
- Focus: memorable, distinctive, "who built this?"

## Typography Rules

### Hierarchy
- **Display/H1**: Large, confident, with clear personality. This is the voice of the product.
- **H2-H3**: Same family or a harmonious pair. Reduce weight, not just size.
- **Body**: Highly readable at 14-16px. Comfortable line-height (1.5-1.7).
- **Captions/Labels**: Smaller, lighter weight. Consider letter-spacing for ALL CAPS labels.
- **Monospace** (for data, code, metrics): Use a quality mono like JetBrains Mono, IBM Plex Mono, or Berkeley Mono.

### Font Selection Rules
**NEVER use:** Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Poppins. These are the statistical center of AI-generated design. They signal "template."

**Good choices for display:** Instrument Serif, Fraunces, Newsreader, Outfit, Sora, Satoshi, Cabinet Grotesk, General Sans, Clash Display, Switzer, Erode, Zodiak, Boska.

**Good choices for body:** Instrument Sans, Geist Sans, Plus Jakarta Sans, DM Sans, Manrope, Wix Madefor Text, Source Serif Pro.

**Pairing strategy:** Contrast display and body. Serif display + sans body. Geometric display + humanist body. The pairing creates tension that feels intentional.

**Do not repeat font choices across projects.** Each product should have its own typographic identity.

### Sizing Scale (8pt grid)
Use a modular scale. Suggested: 12 / 14 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80px.
Never use arbitrary sizes. Stick to the scale.

## Color System

### Structure
```
--color-bg:          /* dominant background */
--color-bg-subtle:   /* secondary surface */
--color-fg:          /* primary text */
--color-fg-muted:    /* secondary text */
--color-accent:      /* single strong accent */
--color-accent-soft: /* accent at 10-15% opacity for backgrounds */
--color-border:      /* subtle borders, dividers */
--color-success:     /* green family, use sparingly */
--color-warning:     /* amber family, use sparingly */
--color-error:       /* red family, use sparingly */
```

### Rules
- **Two-color dominance.** Background + foreground carry 85% of the visual weight. Accent is a punctuation mark, not a paragraph.
- **Dark mode is not an inversion.** It requires its own palette tuning. Reduce contrast slightly. Warm up pure blacks.
- **Semantic color only for status.** Green/amber/red are reserved for success/warning/error. Never decorative.
- **No gradients unless Tier 3.** And even then, gradients should be subtle and atmospheric, not the hero element.

### Palette Direction by Product
- **Tally**: Warm neutral base (stone/zinc), deep teal or forest accent. Calm, focused, "command center" energy.
- **Trellis**: Earth tones. Greens that reference agriculture without being literal. Sophisticated, not farmer-y.
- **BIS**: Sharp, professional. Dark base or crisp white. Single bold accent (orange, electric blue). Signals authority.
- **Client deliverables**: Neutral and deferential. The client's brand leads. System provides structure, not personality.

## Spacing and Layout

### 8pt Grid
All spacing derives from an 8px base unit: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128px.
Component internal padding: 12-16px minimum.
Section gaps: 48-96px for breathing room.
Card padding: 24px minimum. 32px for Tier 2+.

### Layout Principles
- **Content width**: Max 1200px for dashboards. Max 720px for reading content. Max 480px for forms.
- **Left-align by default.** Center alignment is for hero sections only.
- **Visual hierarchy through weight, not size alone.** A bold 16px label beats a light 24px one for drawing attention.
- **Group related items tightly. Separate unrelated items generously.** Proximity is the strongest visual grouping cue.
- **Asymmetry with purpose.** Don't center everything. Offset layouts feel editorial. But never random. Every position should have a reason.

### Responsive Behavior
- Mobile-first is mandatory
- Cards stack single-column below 640px
- Navigation collapses to hamburger below 768px
- Font sizes reduce by ~85% on mobile (not a hard rule, use judgment)
- Touch targets: 44px minimum

## Component Patterns (shadcn/ui)

When using shadcn/ui components, apply these overrides:

### Buttons
- Primary: solid accent color, sufficient contrast (4.5:1 minimum)
- Secondary: ghost or outline style, subtle
- Destructive: red family, used only for irreversible actions
- Button text: sentence case, not ALL CAPS (except very specific UI patterns)
- Border-radius: 6-8px for Tier 1-2. Explore 2px (sharp) or 12px+ (soft) for Tier 3.

### Cards
- Subtle border (1px, low contrast) preferred over heavy shadows
- Consistent padding (24-32px)
- No nested cards. If you need hierarchy inside a card, use spacing and typography.
- Hover state: slight elevation or border color shift. Nothing dramatic.

### Tables and Data
- Alternating row colors only if >10 rows
- Right-align numbers. Left-align text. Always.
- Monospace for financial/metric data
- Sort indicators should be visible but not dominant
- Empty states need actual design, not just "No data found"

### Forms
- Labels above inputs, not beside (except very short forms)
- Placeholder text is not a label. Labels are required.
- Error messages appear below the field, in red, immediately on blur
- Success feedback is green checkmark or subtle border change
- Required fields: mark optional fields instead of required ones (fewer marks)

## Trust Architecture

These are not style preferences. These are psychological principles that affect whether someone trusts your tool.

### Consistency = Trust
- Same spacing, same colors, same type sizes across every view
- If a button is blue on page 1, it's blue on page 5
- Inconsistency triggers unconscious "something is off" responses

### Typography Readability = Competence
- Poor line-height, tiny text, or low-contrast type signals amateur
- Strong hierarchy (clear H1 > H2 > body) signals organized thinking
- Monospace for data signals precision

### White Space = Premium
- Cramped layouts signal "budget" or "desperate"
- Generous space signals "we have room because we're confident"
- This is the single most impactful trust signal in dashboard/tool design

### Loading and Empty States = Care
- Skeleton loading states (not spinners) signal polish
- Empty states with helpful copy signal thoughtfulness
- Error messages that are human-readable signal empathy

### Restrained Animation = Confidence
- Over-animation signals insecurity ("look at me!")
- Subtle, purposeful transitions signal competence
- Page loads should feel snappy, not theatrical (except Tier 3 landing pages)

## Anti-Patterns (Hard Rules)

NEVER do any of the following:

- Purple gradients on white backgrounds
- Card grids with identical padding and rounded corners and subtle shadows (the "SaaS starter kit" look)
- Rainbow color schemes or more than 3 non-semantic colors
- Bouncing/pulsing animations on buttons or CTAs
- "Hero section with centered text over stock photo" layout
- Drop shadows darker than 0.08 opacity (on light themes)
- More than 2 font families in a single interface
- Borders AND shadows on the same element (pick one)
- Icon + label + description pattern repeated 3+ times in a grid (the "features section" cliche)
- Decorative illustrations that don't serve comprehension
- Lorem ipsum or placeholder content in delivered work
- Using brand colors at full saturation for large background areas (always desaturate/lighten for backgrounds)

## Working with This Skill

### When you receive a design request:
1. Determine the tier (1/2/3). Ask if unclear.
2. If no design brief was provided, ask before building. For Tier 1: ask these 5 questions: (a) What are you building? (b) Who sees it? (c) Mood in 1-2 words? (d) Must-include elements? (e) Any reference or example? For Tier 2-3: ask these 9 questions: (a) What are you building? (b) Who is the audience and what do they care about? (c) Where does this live and what surrounds it? (d) What should someone feel in the first 3 seconds? (e) 2-3 references that are in the right direction? (f) Framework, responsive, dark mode, accessibility constraints? (g) What actual content goes in this? (h) What should this NOT look like? (i) How will you know the design worked?
3. For Tier 2-3: propose the aesthetic direction in 2-3 sentences before writing code. Get approval.
4. Select typography pairing. State your choice and reasoning.
5. Define color palette using CSS variables. Show the palette.
6. Build the interface. Apply all rules above.
7. For Tier 3: generate 2-3 variants if asked.

### For existing codebases:
- Read the existing styles before making changes
- Match the established palette and type system
- Enhance, don't overhaul (unless specifically asked to redesign)
- Flag inconsistencies you notice but don't fix them unsolicited

### Quality Check
Before delivering, verify:
- [ ] Typography hierarchy is clear and uses approved fonts
- [ ] Color palette uses max 2 dominant + 1 accent
- [ ] Spacing follows 8pt grid
- [ ] Mobile responsive
- [ ] Empty/loading/error states designed (not just happy path)
- [ ] No anti-patterns present
- [ ] Feels like a human designed it, not an AI

---

*This skill is maintained by Justyn and should be updated as preferences evolve. Last updated: March 2026.*
