// Golden set for the LinkedIn capture classifier.
// 20 posts with manually-assigned ground-truth labels.
//
// Coverage rules:
//   - 6 program (varied categories, 1 non-Canadian as scope-filter test, 1 FR)
//   - 6 knowledge (varied provinces, 1 FR)
//   - 4 contact_signal (job changes, awards, speakers, milestones)
//   - 4 noise (self-promo, US-only, generic thought, unrelated)
//
// Distinct from the few-shot examples inside classifier.ts — these are held out
// so we can measure real generalization, not memorization.

export interface GoldenCase {
  id: string;
  expected_class: "program" | "knowledge" | "contact_signal" | "noise";
  expected_confidence_min: "low" | "medium" | "high";
  scope_filter?: "canadian" | "non_canadian";
  author_name: string;
  author_url?: string;
  source_url?: string;
  raw_text: string;
  notes?: string;
}

export const GOLDEN_SET: GoldenCase[] = [
  // =================== PROGRAM (6) ===================
  {
    id: "prog-01",
    expected_class: "program",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Jason Vander Veen",
    author_url: "https://www.linkedin.com/in/jason-vander-veen",
    source_url: "https://www.linkedin.com/posts/jason-vander-veen_agtech-activity-1",
    raw_text:
      "Great news for Canadian agtech innovators! The FCC AgriSpirit Fund is now accepting applications for 2026. Up to $25,000 in project grants for rural community initiatives including agricultural innovation hubs. Deadline is March 31. Apply at fcc.ca/agrispirit. Tag a founder who should apply.",
    notes: "Named Canadian fund, amount, deadline, URL",
  },
  {
    id: "prog-02",
    expected_class: "program",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Stephanie Walker",
    author_url: "https://www.linkedin.com/in/stephanie-walker-cfin",
    source_url: "https://www.linkedin.com/posts/stephanie-walker_cfin-agtech",
    raw_text:
      "Applications are now OPEN for the Canadian Food Innovation Network's (CFIN) Innovation Booster Program. Up to $250,000 in non-dilutive funding for Canadian food and agtech companies to accelerate commercialization. Stage: Pilot to early commercial. Rolling intake through 2026. https://cfin-rcia.ca/innovation-booster-program/",
    notes: "CFIN booster, national, funding amount, stage clear",
  },
  {
    id: "prog-03",
    expected_class: "program",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Geneviève Grossenbacher",
    author_url: "https://www.linkedin.com/in/genevieve-grossenbacher",
    source_url: "https://www.linkedin.com/posts/genevieve-grossenbacher_ecocert",
    raw_text:
      "L'appel à candidatures est ouvert pour l'Incubateur AgroBiotech du Québec, cohorte automne 2026. 10 places pour startups en agriculture durable, biotech agricole et alimentation. Financement de 50 000 $ non dilutif, accompagnement de 6 mois à Montréal. Date limite: 15 mai. incubateur-agrobiotech.ca",
    notes: "French Quebec accelerator cohort",
  },
  {
    id: "prog-04",
    expected_class: "program",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Mike Lake",
    author_url: "https://www.linkedin.com/in/mikelake-agriculture",
    source_url: "https://www.linkedin.com/posts/mikelake_lethbridge-pilots",
    raw_text:
      "The Alberta Precision Agriculture Pilot Site at Lethbridge Research Station is now taking applications from agtech companies for 2026 growing season. Free access to 500+ acre managed field trials, telemetry infrastructure, and research agronomy staff. Ideal for companies at MVP-to-Pilot stage. Email info@abpilots.ca to apply by April 30.",
    notes: "Field trial pilot site, Alberta, specific application window",
  },
  {
    id: "prog-05",
    expected_class: "program",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Darrell Petras",
    author_url: "https://www.linkedin.com/in/darrell-petras",
    source_url: "https://www.linkedin.com/posts/darrell-petras_agri-food-innovation",
    raw_text:
      "Saskatchewan agri-food innovators — Innovation Saskatchewan's Agri-Food Innovation Grant is open. Up to $100,000 in matching funds for Saskatchewan-based companies commercializing new agriculture and food technologies. Intake closes June 1, 2026. Full guidelines: innovationsask.ca/agrifood",
    notes: "SK provincial grant, clear amounts",
  },
  {
    id: "prog-06",
    expected_class: "program",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Leslie Tse",
    author_url: "https://www.linkedin.com/in/leslie-tse-mars",
    source_url: "https://www.linkedin.com/posts/leslie-tse_mars-agtech",
    raw_text:
      "MaRS Discovery District's CleanTech practice now includes a dedicated agtech vertical. Advisors working with Ontario founders on GTM, scale-up, and investor readiness. No funding directly — this is advisory services only. If you're an Ontario agtech company past MVP, DM to connect with the team.",
    notes: "MaRS agtech vertical — advisory org, no funding, medium confidence",
  },

  // =================== KNOWLEDGE (6) ===================
  {
    id: "know-01",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Garth Donald",
    author_url: "https://www.linkedin.com/in/garth-donald-agronomy",
    raw_text:
      "Reflecting on two decades agronomy in Saskatchewan. The biggest thing agtech companies get wrong: they assume growers want more data. Growers want FEWER decisions. The tech that wins on prairie farms is the kind that makes one call faster or removes one recurring question. Anything that adds another dashboard or another alert fails even if the underlying model is genuinely better.",
    notes: "Experienced agronomist sharing substantive adoption insight",
  },
  {
    id: "know-02",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Rob Saik",
    author_url: "https://www.linkedin.com/in/robsaik",
    raw_text:
      "Three patterns from reviewing 30+ Canadian agtech go-to-market plans this year: (1) Founders underestimate agronomist conservatism by about 18 months. Allow for it. (2) Quebec and Maritime markets have fundamentally different decision chains — your prairie sales playbook will not work. (3) The CFAA advisor channel is undervalued. Get into a CCA CE session and you'll learn more about distribution than any pitch deck can teach you.",
    notes: "Three substantive ecosystem patterns, non-promotional",
  },
  {
    id: "know-03",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Krista Thomas",
    author_url: "https://www.linkedin.com/in/krista-thomas-policy",
    raw_text:
      "For Canadian agtech founders trying to parse federal programs: the funding surface actually works in three layers. (1) Pre-commercial grants (CFIN, AAFC) — relatively easy to access if you're a Canadian corp. (2) Commercialization support (SDTC, Protein Industries) — much harder, usually requires consortium partners. (3) Export/scale (BDC, EDC) — requires proven revenue. Most founders fail at layer 2 because they didn't build consortium relationships at layer 1. Start those conversations EARLY.",
    notes: "Policy/funding ecosystem breakdown with strategic implication",
  },
  {
    id: "know-04",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Chantal Dubois",
    author_url: "https://www.linkedin.com/in/chantal-dubois-qc",
    raw_text:
      "Le marché agtech québécois a une logique qui lui est propre. Les coopératives (Sollio, Nutrinor) dominent la distribution d'intrants. Une startup qui veut vendre des produits ou technologies aux producteurs québécois sans passer par une coop se heurte à un mur. La meilleure stratégie: vendre À la coop, pas contourner la coop. C'est différent du reste du Canada et les fondateurs anglophones l'apprennent souvent trop tard.",
    notes: "French, Quebec-specific ecosystem pattern about co-operatives",
  },
  {
    id: "know-05",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Stuart Smyth",
    author_url: "https://www.linkedin.com/in/stuart-smyth-usask",
    raw_text:
      "Ran the numbers on Canadian agtech Series A outcomes 2020-2026. Of 42 funded companies, only 11 made it to Series B. Pattern in the failures: 8 of the 31 pivoted away from direct-to-grower once they hit the distribution wall. This supports what we already knew qualitatively — direct-to-grower as a GTM is structurally broken in Canada unless you partner with input retailers or coops early.",
    notes: "Research-backed pattern with specific numbers",
  },
  {
    id: "know-06",
    expected_class: "knowledge",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Julie Marcoux",
    author_url: "https://www.linkedin.com/in/julie-marcoux-maritimes",
    raw_text:
      "Observation from the last 6 months working with Atlantic agtech startups: the region's small-farm dominance means that software priced per-acre doesn't pencil out. 200-acre operations can't pay prairie-grain per-acre rates. The companies succeeding here price per-farm or per-outcome. This pricing mismatch explains why excellent prairie-born products fail in the Maritimes.",
    notes: "Atlantic pricing pattern observation",
  },

  // =================== CONTACT_SIGNAL (4) ===================
  {
    id: "cs-01",
    expected_class: "contact_signal",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Evan Fraser",
    author_url: "https://www.linkedin.com/in/evan-fraser-arrell",
    raw_text:
      "Personal news: after 8 wonderful years as Director of the Arrell Food Institute at the University of Guelph, I'm stepping into a new role as Chief Science Officer at Foodshed Ventures starting June. Excited to keep working at the intersection of food systems and innovation. Grateful to the Arrell team for everything.",
    notes: "Clear job change for a known Canadian food-system figure",
  },
  {
    id: "cs-02",
    expected_class: "contact_signal",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Mitchell Rubinsky",
    author_url: "https://www.linkedin.com/in/mitchell-rubinsky",
    raw_text:
      "Humbled and honoured to share that I've been named to the Globe and Mail's Report on Business Changemakers list for 2026, recognizing work in Canadian AgTech commercialization. Thanks to the team at Rubinsky Capital and every founder who's trusted us to partner with them over the past decade.",
    notes: "Award announcement for the author",
  },
  {
    id: "cs-03",
    expected_class: "contact_signal",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Michele Prevost",
    author_url: "https://www.linkedin.com/in/michele-prevost",
    raw_text:
      "Speaking at Canadian Agri-Food Summit next week in Calgary on the topic of 'Funding your agtech seed-to-series-A.' If you'll be in town DM me, always up for coffee with founders. Session is Thursday 2pm in the Glenbow Ballroom.",
    notes: "Speaking announcement — primary content is the person's appearance",
  },
  {
    id: "cs-04",
    expected_class: "contact_signal",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Samir Patel",
    author_url: "https://www.linkedin.com/in/samir-patel-agtech",
    raw_text:
      "Big congrats to my friend Tina Chen on being promoted to Head of Pilot Programs at Protein Industries Canada. Tina has been quietly running the best cohort operations in Canadian agtech for years, and it's great to see it formalized. The sector's in better hands.",
    notes: "Colleague's promotion — primary content is a named third party",
  },

  // =================== NOISE (4) ===================
  {
    id: "noise-01",
    expected_class: "noise",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Self-Promo Coach",
    author_url: "https://www.linkedin.com/in/self-promo-coach",
    raw_text:
      "The future belongs to those who MOVE. Most founders wait for permission. The best ones? They just ship. Who needs permission when you have vision? 🚀 DM me if you're ready to unlock your next level. Free 30-min strategy call this week only.",
    notes: "Generic thought-leadership self-promo, no ecosystem content",
  },
  {
    id: "noise-02",
    expected_class: "noise",
    expected_confidence_min: "high",
    scope_filter: "non_canadian",
    author_name: "Alexandra Lang",
    author_url: "https://www.linkedin.com/in/alexandra-lang-usda",
    raw_text:
      "Exciting news for US farmers! The USDA Natural Resources Conservation Service is opening a new $400M Climate-Smart Commodities pool specifically for US Midwest producers. Applications open May 1. Eligible states: IA, IL, IN, OH, WI. Details at usda.gov/climate-smart-commodities.",
    notes: "US-only program, no Canadian tie-in — should be filtered as noise",
  },
  {
    id: "noise-03",
    expected_class: "noise",
    expected_confidence_min: "high",
    scope_filter: "canadian",
    author_name: "Corporate Marketing Account",
    author_url: "https://www.linkedin.com/company/corporate-marketing",
    raw_text:
      "At BigAgCo, innovation is in our DNA. Every day, our team works tirelessly to bring next-generation agricultural solutions to farmers around the world. We believe in the power of technology to transform the future of food. Learn more about our commitment at bigagco.com",
    notes: "Corporate brand marketing, no specific program or insight",
  },
  {
    id: "noise-04",
    expected_class: "noise",
    expected_confidence_min: "medium",
    scope_filter: "canadian",
    author_name: "Local Business Owner",
    author_url: "https://www.linkedin.com/in/local-business-owner",
    raw_text:
      "Great coffee and chat with an old friend today at our favourite downtown spot. Amazing how things change over 10 years in this city. Grateful for the relationships we build. 🙏",
    notes: "Unrelated personal post, no agtech content",
  },
];
