# Trellis Domain: Learnings

## Purpose
Trellis-specific research rules discovered during calibration and production runs. Every rule has a failure story or observation from a real research run.

**Status:** Empty. Will be populated during calibration runs.

Core principles (universal rules) live in `~/Documents/GitHub/bis_ops/skills/intelligence-engine/core-principles.md`. Read those first, always.

---

## Calibration Log

*Entries will be added after each calibration run following the format in `calibration-protocol.md`.*

---

## Domain-Specific Rules

*Rules will be added here as they are discovered. Format:*

```
### TL[N]: [Rule title]
[Description]
> *Discovery: [date]. [What happened and what we learned.]*
```

---

## Exceptions to Core Principles

*If a core principle doesn't apply in the Trellis domain, document the exception here:*

```
### Exception to CP[N]: [Core principle name]
**Why it doesn't apply:** [reason]
**What to do instead:** [alternative approach]
> *Discovered: [date] during [calibration run / production run]*
```

---

## Technique Promotions Validated Here

*When a technique from another domain (e.g., BIS) is tested during Trellis calibration and works, log it here:*

```
### [Technique name] - validated in Trellis
**Origin:** [domain, date]
**Trellis test:** [calibration run #, date, entity]
**Result:** [worked / adapted / failed]
**Promote to core?** [yes / needs more testing / no, domain-specific]
```
