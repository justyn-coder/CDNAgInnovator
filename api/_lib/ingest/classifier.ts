// Four-way classifier over a LinkedIn capture. Calls Claude with a structured
// JSON output contract and returns parsed CanonicalData.
//
// IMPORTANT: Trellis is Canadian-focused. The classifier's scope filter must
// reject non-Canadian programs as noise unless there is a Canadian tie-in.

import type { ClassifierOutput } from "./types.js";

const CLASSIFIER_SYSTEM_PROMPT = `You are Trellis's LinkedIn capture classifier. Trellis is a navigation layer for Canada's agtech ecosystem — it helps Canadian agtech founders find programs, funding, and insight that get them from idea to scale.

Your job: given a LinkedIn post (URL, text, optional screenshot OCR, author info), classify it into exactly one bucket and extract structured data for downstream ingestion.

BUCKETS:

- "program" — the PRIMARY TOPIC is a specific support mechanism a Canadian agtech founder could apply to or benefit from. Fund, accelerator/incubator, pilot site or field trial program, conference/event, industry organization, training program. Must have an identifiable name and be Canadian-available (Canadian-only OR international with a named Canadian cohort/tie-in).

- "knowledge" — the PRIMARY TOPIC is a substantive ecosystem insight, pattern, or analysis that would help a founder navigate. Must be specific and non-promotional. Examples: "Growers in AB distrust AI recs from non-agronomist sources", "60% of Canadian agtech pilots stall at commercialization due to distribution gaps". NOT knowledge: vague inspiration, marketing copy, corporate press statements.

- "contact_signal" — the PRIMARY TOPIC is a person update: job change, role announcement, award, speaking engagement, or similar personal news about someone in the Canadian agtech ecosystem. The person, not the content, is the story.

- "noise" — everything else. Self-promotion, generic thought leadership, unrelated topics, non-Canadian scope with no Canadian tie-in, corporate advertising that doesn't name a specific program.

CRITICAL RULES:

1. Canadian scope filter: if the post is about a US-only or non-Canadian program with no Canadian cohort, team, or availability, classify as "noise" — even if it's a great program. Trellis is for Canadian founders.

2. Bias toward "noise" when uncertain. Polluting programs/knowledge with marginal content is far more damaging than missing one signal. The author still gets upserted into people either way.

3. "contact_signal" is narrow. Most posts have a person as AUTHOR but a topic as SUBJECT — those are not contact_signal. Only use contact_signal when the post's primary content is the person themselves.

4. A post can mention a program in passing without being about that program. "Congrats to my friend on winning X Accelerator" is contact_signal (friend), not program (X), unless the post is specifically announcing X's intake or results.

5. Canonical data: extract what you can find, leave unknown fields null. Don't invent. Don't guess websites — only include a candidate_website if the post explicitly links or names a URL.

6. Province: use Canadian province codes only (BC, AB, SK, MB, ON, QC, NB, NS, PE, NL, YT, NT, NU) or "National". Do not use full names.

7. Author seniority: best guess from title and context. Mark as "unknown" if unclear.

OUTPUT FORMAT (strict JSON, no markdown):

{
  "classification": "program" | "knowledge" | "contact_signal" | "noise",
  "confidence": "high" | "medium" | "low",
  "reasoning": "<=200 chars, one sentence, why this bucket",
  "canonical_data": {
    "schema_version": 1,
    "program": { ... } | null,       // populated only if classification=program
    "knowledge": { ... } | null,     // populated only if classification=knowledge
    "author": { ... },               // always populated if any author info extractable
    "mentioned_people": [ ... ]      // people named in post with linkedin links (optional)
  }
}

PROGRAM schema:
{
  "name": "Exact program name (not company name)",
  "candidate_website": "URL from post or null",
  "category": "Fund" | "Accel" | "Pilot" | "Event" | "Org" | "Train",
  "province": ["AB"] | ["National"] | [...],
  "stage": ["Idea","MVP","Pilot","Comm","Scale"] subset or null,
  "description": "1-2 sentences pulled from the post",
  "funding_type": "grant" | "equity" | "loan" | "non-dilutive" | null,
  "funding_max_cad": integer or null,
  "deadline_notes": "Application window if mentioned, else null",
  "intake_frequency": "rolling" | "annual" | "one-time" | null,
  "language": "en" | "fr" | "bilingual"
}

KNOWLEDGE schema:
{
  "title": "Concise title you generate (8 words max)",
  "body": "1-3 paragraphs of the actual insight, cleaned of marketing language",
  "tags": ["3-8 semantic tags, lowercase, hyphen-separated"],
  "province": ["provinces this insight applies to"] or ["National"],
  "language": "en" | "fr" | "bilingual"
}

AUTHOR schema:
{
  "name": "Full name",
  "linkedin_url": "Profile URL if known",
  "organization": "Current org",
  "role_title": "Current role",
  "seniority": "founder" | "operator" | "investor" | "researcher" | "government" | "media" | "industry" | "unknown",
  "org_type": "program" | "startup" | "investor" | "govt" | "research" | "media" | "industry" | "unknown",
  "topic_tags": ["tags this person typically posts about"],
  "province": "single province code if known, else null",
  "location": "city, province"
}

MENTIONED_PEOPLE schema (each):
{
  "name": "Full name",
  "linkedin_url": "Profile URL if explicit",
  "organization": "Their org if mentioned",
  "role_title": "Their role if mentioned"
}

Respond ONLY with the JSON object. No markdown, no preamble, no trailing commentary.`;

function renderFewShotExamples(): string {
  // Few-shot examples are inlined in the user message so the classifier sees
  // canonical (post → output) pairs. Five per bucket, 20 total. These are
  // synthetic but representative. Real-world golden set is in scripts/.
  const examples: Array<{ label: string; post: string; output: any }> = [
    // --- PROGRAM (5) ---
    {
      label: "program — PIC cohort announcement",
      post: `Author: Kelly Cheung, Director of Programs, Protein Industries Canada
Post: "Applications are now open for Protein Industries Canada's next cohort of plant-protein innovators. Up to $5M in matching grants available per consortium. Deadline: June 15, 2026. Canadian applicants only. Apply at proteinindustriescanada.ca/programs."`,
      output: {
        classification: "program",
        confidence: "high",
        reasoning: "PIC explicitly announcing new cohort with deadline, funding amount, and URL.",
        canonical_data: {
          schema_version: 1,
          program: {
            name: "Protein Industries Canada Cohort",
            candidate_website: "https://www.proteinindustriescanada.ca/programs",
            category: "Fund",
            province: ["National"],
            stage: ["Pilot", "Comm"],
            description: "Matching grants up to $5M per consortium for plant-protein innovators. Canadian applicants only.",
            funding_type: "grant",
            funding_max_cad: 5000000,
            deadline_notes: "Applications close June 15, 2026",
            intake_frequency: "annual",
            language: "en",
          },
          author: {
            name: "Kelly Cheung",
            organization: "Protein Industries Canada",
            role_title: "Director of Programs",
            seniority: "operator",
            org_type: "program",
            topic_tags: ["funding", "plant-protein", "accelerator"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "program — Bioenterprise",
      post: `Author: Dave Smardon, CEO, Bioenterprise Canada
Post: "The Bioenterprise Seed Fund is accepting applications from pre-revenue agri-food ventures. Non-dilutive grants from $25K to $100K. Rolling intake. Focus on ag-tech, food-tech, and bio-industrial. Canadian companies. https://bioenterprise.ca/seed"`,
      output: {
        classification: "program",
        confidence: "high",
        reasoning: "Named fund with amounts, intake type, URL, Canadian scope.",
        canonical_data: {
          schema_version: 1,
          program: {
            name: "Bioenterprise Seed Fund",
            candidate_website: "https://bioenterprise.ca/seed",
            category: "Fund",
            province: ["National"],
            stage: ["Idea", "MVP"],
            description: "Non-dilutive seed grants from $25K to $100K for pre-revenue Canadian agri-food ventures.",
            funding_type: "grant",
            funding_max_cad: 100000,
            deadline_notes: null,
            intake_frequency: "rolling",
            language: "en",
          },
          author: {
            name: "Dave Smardon",
            organization: "Bioenterprise Canada",
            role_title: "CEO",
            seniority: "operator",
            org_type: "program",
            topic_tags: ["funding", "agri-food", "seed"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "program — Emmertech pitch event",
      post: `Author: Conrad Farago, Managing Partner, Emmertech
Post: "Emmertech's annual AgTech Showcase is back. Pitching slots for 12 Canadian agtech startups, May 8 in Saskatoon. Demo your product to 200+ investors and growers. Applications close April 22. https://emmertech.ca/showcase-2026"`,
      output: {
        classification: "program",
        confidence: "high",
        reasoning: "Specific pitch event with location, date, slots, and URL.",
        canonical_data: {
          schema_version: 1,
          program: {
            name: "Emmertech AgTech Showcase",
            candidate_website: "https://emmertech.ca/showcase-2026",
            category: "Event",
            province: ["SK", "National"],
            stage: ["MVP", "Pilot"],
            description: "Annual pitch event in Saskatoon where 12 Canadian agtech startups present to investors and growers.",
            funding_type: null,
            funding_max_cad: null,
            deadline_notes: "Applications close April 22, 2026. Event May 8, 2026",
            intake_frequency: "annual",
            language: "en",
          },
          author: {
            name: "Conrad Farago",
            organization: "Emmertech",
            role_title: "Managing Partner",
            seniority: "investor",
            org_type: "investor",
            topic_tags: ["agtech", "venture", "pitch-events"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "program — Ontario grant",
      post: `Author: Alisha Reddy, Ag Programs Lead, OMAFRA
Post: "The Ontario Agri-Food Innovation Initiative is now open. Up to $150,000 in cost-shared funding for Ontario agri-food businesses commercializing new products or processes. Intake closes May 31, 2026. Details: ontario.ca/agri-food-innovation"`,
      output: {
        classification: "program",
        confidence: "high",
        reasoning: "Named Ontario program with funding ceiling, deadline, and URL.",
        canonical_data: {
          schema_version: 1,
          program: {
            name: "Ontario Agri-Food Innovation Initiative",
            candidate_website: "https://www.ontario.ca/agri-food-innovation",
            category: "Fund",
            province: ["ON"],
            stage: ["Comm", "Scale"],
            description: "Cost-shared grants up to $150K for Ontario agri-food businesses commercializing new products or processes.",
            funding_type: "grant",
            funding_max_cad: 150000,
            deadline_notes: "Intake closes May 31, 2026",
            intake_frequency: "annual",
            language: "en",
          },
          author: {
            name: "Alisha Reddy",
            organization: "OMAFRA",
            role_title: "Ag Programs Lead",
            seniority: "government",
            org_type: "govt",
            topic_tags: ["ontario", "funding", "agri-food"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "program — French-language",
      post: `Author: Marc-André Deslauriers, Directeur, Créneau AgriBio Québec
Post: "Nous lançons l'appel à projets 2026 du Créneau AgriBio. Soutien financier jusqu'à 75 000 $ pour les entreprises québécoises en agriculture biologique et agrotech. Date limite: 30 avril. creneaubio.ca/appel-2026"`,
      output: {
        classification: "program",
        confidence: "high",
        reasoning: "Named Quebec program with funding amount, deadline, and URL. French-language.",
        canonical_data: {
          schema_version: 1,
          program: {
            name: "Créneau AgriBio — Appel à projets 2026",
            candidate_website: "https://creneaubio.ca/appel-2026",
            category: "Fund",
            province: ["QC"],
            stage: ["MVP", "Pilot", "Comm"],
            description: "Soutien financier jusqu'à 75 000 $ pour les entreprises québécoises en agriculture biologique et agrotech.",
            funding_type: "grant",
            funding_max_cad: 75000,
            deadline_notes: "Date limite: 30 avril 2026",
            intake_frequency: "annual",
            language: "fr",
          },
          author: {
            name: "Marc-André Deslauriers",
            organization: "Créneau AgriBio Québec",
            role_title: "Directeur",
            seniority: "operator",
            org_type: "program",
            topic_tags: ["quebec", "agriculture-biologique", "financement"],
          },
          mentioned_people: [],
        },
      },
    },

    // --- KNOWLEDGE (5) ---
    {
      label: "knowledge — adoption insight",
      post: `Author: Chris Patterson, Independent Agronomist, Alberta
Post: "After 15 years in the field, here's what I keep seeing: Alberta growers do not trust AI recommendations when they come from a source the grower has no relationship with. It doesn't matter how good the model is. If the recommendation isn't routed through their trusted agronomist or input dealer, it gets ignored. Any ag-tech company targeting prairie growers needs to either partner with advisors or plan for a 3-4 year trust-building curve."`,
      output: {
        classification: "knowledge",
        confidence: "high",
        reasoning: "Substantive ecosystem insight about grower trust patterns, non-promotional, backed by named practitioner.",
        canonical_data: {
          schema_version: 1,
          knowledge: {
            title: "Alberta grower AI adoption runs through agronomists",
            body: "Alberta growers do not trust AI recommendations from sources they have no relationship with. Model quality does not override this — if a recommendation isn't routed through a trusted agronomist or input dealer, it gets ignored. Ag-tech targeting prairie growers must either partner with advisors or plan for a 3-4 year trust-building curve.",
            tags: ["adoption", "alberta", "agronomist", "advisor-channel", "prairie", "ai"],
            province: ["AB"],
            language: "en",
          },
          author: {
            name: "Chris Patterson",
            organization: "Independent",
            role_title: "Agronomist",
            seniority: "researcher",
            org_type: "industry",
            topic_tags: ["agronomy", "alberta", "adoption"],
            province: "AB",
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "knowledge — commercialization gap",
      post: `Author: Virginia Mulligan, Investor, Prairie Capital
Post: "Reviewing 40+ Canadian agtech decks this quarter. The pattern is undeniable: pilots are easy, commercialization is where they die. Founders can get farm trials funded through 4-5 programs, but once they need to move from 'trial works' to 'pay us for it,' the funding landscape basically disappears. This is our biggest structural problem and no existing program addresses it cleanly."`,
      output: {
        classification: "knowledge",
        confidence: "high",
        reasoning: "Structural observation about Canadian agtech funding gap, backed by named investor's deal flow.",
        canonical_data: {
          schema_version: 1,
          knowledge: {
            title: "Canadian agtech commercialization gap after pilots",
            body: "Across 40+ Canadian agtech decks, pilots are easy to fund (4-5 programs available), but commercialization — moving from trial works to paid product — is where funding disappears. Founders transition from well-supported pilots to a structural gap with no program addressing it cleanly.",
            tags: ["commercialization", "funding-gap", "pilots", "scaling", "investor-perspective"],
            province: ["National"],
            language: "en",
          },
          author: {
            name: "Virginia Mulligan",
            organization: "Prairie Capital",
            role_title: "Investor",
            seniority: "investor",
            org_type: "investor",
            topic_tags: ["agtech", "venture", "commercialization"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "knowledge — Maritimes",
      post: `Author: Matt Gosling, Managing Director, Bioenterprise Atlantic
Post: "Atlantic Canada agtech has a specific shape: small farm sizes (median 200 acres vs prairie 1500), high crop diversity, proximity to fisheries and aquaculture means lots of cross-sector opportunity. The winning plays here are not the same as SK/AB. Companies building for large-field commodity ag often don't fit. Companies building modular, multi-crop, or aquaculture-adjacent tools do very well."`,
      output: {
        classification: "knowledge",
        confidence: "high",
        reasoning: "Regional ecosystem analysis with specific data points and strategic implications.",
        canonical_data: {
          schema_version: 1,
          knowledge: {
            title: "Atlantic Canada agtech favours modular multi-crop plays",
            body: "Atlantic Canada agtech differs structurally from prairie markets: small farm sizes (median 200 acres vs 1500 on prairies), high crop diversity, and proximity to fisheries/aquaculture. Large-field commodity ag tools often don't fit; modular, multi-crop, or aquaculture-adjacent tools perform much better here.",
            tags: ["atlantic", "regional", "small-farms", "aquaculture", "diversification"],
            province: ["NB", "NS", "PE", "NL"],
            language: "en",
          },
          author: {
            name: "Matt Gosling",
            organization: "Bioenterprise Atlantic",
            role_title: "Managing Director",
            seniority: "operator",
            org_type: "program",
            topic_tags: ["atlantic", "agtech", "regional-strategy"],
            province: "NS",
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "knowledge — intermediary layer",
      post: `Author: Mark Redmond, Former Head of Digital, BASF Agriculture
Post: "Most founders think the decision-maker is the grower. It's not. In any field >500 acres the decision chain goes: grower → trusted agronomist → input retailer → distributor. If your product doesn't fit a workflow one of those intermediaries already runs, you will lose the sale regardless of how the grower feels about it. Sell to the intermediary layer first."`,
      output: {
        classification: "knowledge",
        confidence: "high",
        reasoning: "Specific insight about decision-chain in ag sales with actionable implication.",
        canonical_data: {
          schema_version: 1,
          knowledge: {
            title: "Ag decision chain runs through the intermediary layer",
            body: "In field operations >500 acres, the decision chain is grower → trusted agronomist → input retailer → distributor, not grower-direct. Products that don't fit an intermediary's existing workflow lose the sale regardless of grower preference. Sell to the intermediary layer first.",
            tags: ["sales", "decision-chain", "agronomist", "distribution", "go-to-market"],
            province: ["National"],
            language: "en",
          },
          author: {
            name: "Mark Redmond",
            organization: "Independent",
            role_title: "Former Head of Digital, BASF Agriculture",
            seniority: "industry",
            org_type: "industry",
            topic_tags: ["go-to-market", "channel", "sales"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "knowledge — pilot design",
      post: `Author: Lewis Baarda, Director of Innovation, Olds College
Post: "Something most agtech founders get wrong: a pilot that succeeds in a single growing season on a single farm is not product-market fit evidence. Our research farms routinely see promising results in year 1 that evaporate in year 2 due to weather, pest pressure, or soil variation. If you're planning GTM off a one-season trial, you have year-long exposure to a null result you haven't seen yet. Two-season minimum before commercialization."`,
      output: {
        classification: "knowledge",
        confidence: "high",
        reasoning: "Research-backed insight on pilot design and evidence standards specific to agtech.",
        canonical_data: {
          schema_version: 1,
          knowledge: {
            title: "Single-season pilots are not product-market fit evidence",
            body: "A pilot that succeeds in a single growing season on a single farm is not product-market fit evidence in agtech. Year-1 results often evaporate in year 2 due to weather, pest pressure, or soil variation. Founders planning GTM off one-season trials have year-long exposure to null results they haven't seen. Two-season minimum before commercialization.",
            tags: ["pilots", "evidence", "product-market-fit", "research-farms", "commercialization"],
            province: ["National"],
            language: "en",
          },
          author: {
            name: "Lewis Baarda",
            organization: "Olds College",
            role_title: "Director of Innovation",
            seniority: "researcher",
            org_type: "research",
            topic_tags: ["pilots", "research", "agtech", "alberta"],
            province: "AB",
          },
          mentioned_people: [],
        },
      },
    },

    // --- CONTACT_SIGNAL (5) ---
    {
      label: "contact_signal — job change",
      post: `Author: Sarah Chen, previously Head of Product at Farmers Edge
Post: "After 6 incredible years at Farmers Edge, I'm thrilled to share that I'm joining Emmertech as Partner. Super excited to back the next generation of Canadian agtech founders. If you're raising or thinking about raising, let's talk."`,
      output: {
        classification: "contact_signal",
        confidence: "high",
        reasoning: "Post's primary content is a named person's role change from Farmers Edge to Emmertech.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Sarah Chen",
            organization: "Emmertech",
            role_title: "Partner",
            seniority: "investor",
            org_type: "investor",
            topic_tags: ["agtech", "venture", "career-transition"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "contact_signal — award",
      post: `Author: Thomas Bergmann, CEO of SkyView Technologies
Post: "Humbled to share that I've been named to Western Canada's 40 Under 40 in Agriculture this year. Huge thanks to my team, our investors at Avrio Capital, and every grower who's piloted with us."`,
      output: {
        classification: "contact_signal",
        confidence: "high",
        reasoning: "Post is about the author receiving an award — personal milestone, not a program or insight.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Thomas Bergmann",
            organization: "SkyView Technologies",
            role_title: "CEO",
            seniority: "founder",
            org_type: "startup",
            topic_tags: ["agtech", "drones", "awards"],
          },
          mentioned_people: [
            { name: "Avrio Capital", organization: "Avrio Capital" },
          ],
        },
      },
    },
    {
      label: "contact_signal — speaking announcement",
      post: `Author: Amanda Nowak, Policy Director, CFIN
Post: "Excited to be speaking at AgTech Summit Toronto next month on Canada's federal funding pipeline for pre-commercial agtech. If you'll be there, DM me — would love to connect."`,
      output: {
        classification: "contact_signal",
        confidence: "medium",
        reasoning: "Primary content is speaker's personal announcement; the event exists but isn't the focus of the post.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Amanda Nowak",
            organization: "CFIN",
            role_title: "Policy Director",
            seniority: "operator",
            org_type: "program",
            topic_tags: ["policy", "federal-funding", "agtech"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "contact_signal — milestone",
      post: `Author: Priya Singh, Founder of CropPulse
Post: "Three years ago today I quit my job in Toronto and moved to Lethbridge to start CropPulse. We now have 14 staff, $8M raised, 200 farms running our platform. Grateful to every single person who believed early. More to come."`,
      output: {
        classification: "contact_signal",
        confidence: "high",
        reasoning: "Post's primary content is the founder's anniversary reflection; CropPulse details are context, not announcement of a program.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Priya Singh",
            organization: "CropPulse",
            role_title: "Founder",
            seniority: "founder",
            org_type: "startup",
            topic_tags: ["agtech", "founder-story", "alberta"],
            province: "AB",
            location: "Lethbridge, AB",
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "contact_signal — congrats",
      post: `Author: David Turner, Managing Director at Telus Ag
Post: "Huge congrats to my friend Jessica Park on joining Semios as VP Product. The Canadian agtech community is lucky to have her. Can't wait to see what she builds."`,
      output: {
        classification: "contact_signal",
        confidence: "high",
        reasoning: "Post is the author publicly recognizing another person's role change; the subject is the person, not the company.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "David Turner",
            organization: "Telus Ag",
            role_title: "Managing Director",
            seniority: "industry",
            org_type: "industry",
            topic_tags: ["agtech", "telco-ag", "community"],
          },
          mentioned_people: [
            {
              name: "Jessica Park",
              organization: "Semios",
              role_title: "VP Product",
            },
          ],
        },
      },
    },

    // --- NOISE (5) ---
    {
      label: "noise — generic thought leadership",
      post: `Author: Generic Consultant
Post: "The future of agriculture is data. And data is the new soil. If you're not leveraging digital tools, you will be left behind. DM me to learn how my advisory practice can help."`,
      output: {
        classification: "noise",
        confidence: "high",
        reasoning: "Generic thought-leadership with no specific program, insight, or person-news. Self-promotional.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Generic Consultant",
            organization: null,
            role_title: "Consultant",
            seniority: "unknown",
            org_type: "industry",
            topic_tags: ["advisory"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "noise — US program",
      post: `Author: Jane Doe, USDA Iowa
Post: "The USDA Climate-Smart Commodities Fund is accepting applications from Iowa and Nebraska producers. $25K-$500K grants. Apply by May 1 at usda.gov."`,
      output: {
        classification: "noise",
        confidence: "high",
        reasoning: "US-only program, no Canadian tie-in. Trellis Canadian scope filter excludes this.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Jane Doe",
            organization: "USDA",
            role_title: null,
            seniority: "government",
            org_type: "govt",
            topic_tags: ["usda", "usa"],
            province: null,
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "noise — corporate self-promo",
      post: `Author: BigAgCorp Marketing
Post: "At BigAgCorp, we believe in innovation. Our new platform helps farms grow better. Learn more about what makes us different at bigagcorp.com"`,
      output: {
        classification: "noise",
        confidence: "high",
        reasoning: "Corporate marketing with no specific program or insight. No actionable content for founders.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "BigAgCorp Marketing",
            organization: "BigAgCorp",
            role_title: null,
            seniority: "unknown",
            org_type: "industry",
            topic_tags: ["marketing"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "noise — unrelated",
      post: `Author: Local Politician
Post: "Honoured to speak at the Kiwanis Club luncheon today about small business in our riding. Such a welcoming group."`,
      output: {
        classification: "noise",
        confidence: "high",
        reasoning: "Politician community event, unrelated to agtech ecosystem.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Local Politician",
            organization: null,
            role_title: null,
            seniority: "government",
            org_type: "govt",
            topic_tags: ["politics", "community"],
          },
          mentioned_people: [],
        },
      },
    },
    {
      label: "noise — vague inspiration",
      post: `Author: Motivational Speaker
Post: "Every farm is a startup. Every farmer is a founder. Remember: the seeds you plant today are the harvest of tomorrow. Keep going. 🌱"`,
      output: {
        classification: "noise",
        confidence: "high",
        reasoning: "Vague motivational content with no specific insight, program, or actionable claim.",
        canonical_data: {
          schema_version: 1,
          author: {
            name: "Motivational Speaker",
            organization: null,
            role_title: "Speaker",
            seniority: "unknown",
            org_type: "media",
            topic_tags: ["motivation"],
          },
          mentioned_people: [],
        },
      },
    },
  ];

  return examples
    .map(
      (e, i) =>
        `### Example ${i + 1} (${e.label})\n\nINPUT:\n${e.post}\n\nOUTPUT:\n${JSON.stringify(e.output, null, 2)}`
    )
    .join("\n\n---\n\n");
}

export interface ClassifyInput {
  source_url?: string;
  author_name?: string;
  author_url?: string;
  raw_text?: string;
  post_markdown?: string; // from Firecrawl
  image_base64?: string;  // base64-encoded image for vision model
}

export interface ClassifyResult {
  ok: boolean;
  output?: ClassifierOutput;
  model?: string;
  error?: string;
  raw?: string;
}

/**
 * Classify a LinkedIn capture with Claude. Returns parsed ClassifierOutput or
 * structured error. Uses Claude 4.6 Sonnet by default (cost/quality balance).
 */
export async function classifyCapture(input: ClassifyInput): Promise<ClassifyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not configured" };

  const model = process.env.INGEST_CLASSIFIER_MODEL || "claude-sonnet-4-6";

  const bodyParts: string[] = [];
  if (input.source_url) bodyParts.push(`POST URL: ${input.source_url}`);
  if (input.author_name) bodyParts.push(`AUTHOR NAME: ${input.author_name}`);
  if (input.author_url) bodyParts.push(`AUTHOR LINKEDIN: ${input.author_url}`);
  if (input.raw_text) bodyParts.push(`RAW TEXT FROM SHARE SHEET:\n${input.raw_text}`);
  if (input.post_markdown) bodyParts.push(`POST CONTENT (fetched):\n${input.post_markdown}`);

  const few = renderFewShotExamples();
  const userText = `Here are 20 labeled examples showing the exact output format:

${few}

---

Now classify this capture. Return only the JSON object, no markdown, no preamble.

${bodyParts.join("\n\n")}`;

  // Build content array. If we have an image, include it so Claude vision can read it.
  const content: any[] = [];
  if (input.image_base64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: input.image_base64,
      },
    });
  }
  content.push({ type: "text", text: userText });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        temperature: 0,
        system: CLASSIFIER_SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, model, error: `claude ${res.status}: ${errText.slice(0, 300)}` };
    }

    const data = (await res.json()) as any;
    const raw: string = data?.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: ClassifierOutput;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, model, error: "json parse failed", raw };
    }

    // Shape validation
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !["program", "knowledge", "contact_signal", "noise"].includes(parsed.classification) ||
      !["high", "medium", "low"].includes(parsed.confidence) ||
      !parsed.canonical_data ||
      parsed.canonical_data.schema_version !== 1
    ) {
      return { ok: false, model, error: "invalid classifier output shape", raw };
    }

    return { ok: true, model, output: parsed };
  } catch (e: any) {
    return { ok: false, model, error: String(e).slice(0, 300) };
  }
}
