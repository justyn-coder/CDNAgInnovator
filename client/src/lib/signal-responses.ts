// PRE-BAKED SIGNAL RESPONSES
// Served instantly when a user clicks a signal card CTA on the operator landing page.
// Last verified against programs DB: March 27, 2026
//
// REVIEW CHECKLIST (add to Friday review):
// - Do program names still match the DB exactly?
// - Are the program counts still accurate?
// - Have any referenced programs been closed/archived?
// - Do dollar figures still match?
//
// When updating: also verify the question strings match the
// signal card onClick send() calls in Navigator.tsx exactly.

export const SIGNAL_RESPONSES: Record<string, string> = {

  "Where does support disappear between pilot and scale stage?": `**The ecosystem builds founders up, then drops them.**

Canada has world-class pilot infrastructure and strong scale-stage support, but founders are falling through the cracks during commercial validation. The most critical phase for startup survival has almost no dedicated programming.

**The structural problem:** The ecosystem has two separate stacks. Early-stage support (accelerators + micro-grants + pilot sites) caps at roughly $200K total. Scale-stage support (superclusters + large VC funds + regional agencies) starts at $5M+. The "Valley of Death" sits between $0 and $1M ARR, where founders need $250K to $2M for sales, marketing, and customer success over 12-24 months post-pilot.

**What's missing in the middle:**

Customer Acquisition Bridge Programs:
- No procurement facilitation to convert pilots into paying customers
- No "first customer guarantee" programs
- No structured customer introduction services
- No sales acceleration support

Commercial Validation Funding:
- Gap between $200K early-stage grants and $1M+ scale programs
- No dedicated $250K to $750K commercialization funds
- Limited bridge financing for the 6-18 month customer acquisition period

**What does exist at pilot stage:**
- 20 AAFC Research Centres providing free/low-cost pilot infrastructure
- Living Labs program for on-farm co-development
- Provincial pilot sites (Olds College Smart Farm, Vineland, MBFI, Discovery Farm)
- Research partnerships through universities and applied research organizations

**What does exist at scale stage:**
- PIC Investment Group and Digital Technology Supercluster for expansion
- Export support (AAFC \u2014 AgriMarketing Program)
- Large infrastructure investments (AAFC \u2014 Dairy Processing Investment Fund (DPIF))
- BDC Industrial Innovation Venture Fund II and BDC Climate Tech Fund

**Strategic recommendations:**

For ecosystem operators:
1. Create customer acquisition bridge programs between pilot and scale funding
2. Establish procurement facilitation services to convert pilots into sales
3. Develop $500K commercialization funds specifically for the pilot-to-scale gap
4. Build structured customer introduction programs leveraging existing pilot site relationships

For policy makers:
1. Mandate customer pathway planning in all pilot programs
2. Create "anchor customer" incentives for early adopters
3. Establish agtech procurement targets for government and crown corporations
4. Bridge the $250K to $2M funding gap with dedicated commercialization vehicles`,


  "What's actually available for a scale-stage agtech company in Alberta?": `**Alberta's real challenge isn't funding. It's the absence of commercialization infrastructure.**

Scale-stage companies will likely need to build their own customer acquisition channels. The province has 9+ pilot sites and 39+ funding programs, but virtually no programming to convert successful pilots into paying customers. There's no procurement facilitation, no customer introduction programs, no first-customer guarantees.

**What you should do first:**

1. **Use agronomist networks for distribution**: Matt Gosling manages 200,000 acres through his agronomist network. Products that pass through the agronomist filter get rapid word-of-mouth distribution.
2. **Attend Uniting the Prairies**: This Saskatoon event draws 90+ active investors and is the best single event for Prairie founders seeking capital connections.
3. **Work with Tall Grass Ventures early**: They use time as the primary de-risking tool and want to know founders 1-2 years before investing.

**Available scale-stage programs:**

Provincial Options:
- **Alberta Innovates \u2014 Scaleup Growth Accelerator Program**: Connects scaling Alberta companies with global accelerator partners (e.g., SVG Ventures/THRIVE)
- **AFSC (Agriculture Financial Services Corporation)**: Traditional farm loans and equipment financing for expansion capital
- **Accelerate Fund IV**: Alberta fund-of-funds investing in VC funds active in the province

National Programs Accessible from Alberta:
- **AAFC \u2014 AgriCompetitiveness Program**: Up to $1M/year for capacity building and business management tools
- **AAFC \u2014 AgriInnovate**: Interest-free repayable contributions for commercializing market-ready ag innovations
- **AAFC \u2014 AgriMarketing Program**: Export market development funding covering marketing activities and trade
- **BDC Industrial Innovation Venture Fund II**: $200M fund targeting Series A+ industrial innovation including agtech
- **BDC Climate Tech Fund**: $500M fund for climate technology companies including ag sustainability
- **Ag Capital Canada**: Private equity fund for Canadian ag and food innovation growth

**The gaps that matter:**

No Customer Acquisition Support:
Alberta has no procurement facilitation, customer introduction programs, or first-customer guarantees. As the intelligence notes: "a successful pilot at Olds College does not automatically generate sales."

No Go-to-Market Programming:
The 39 funding programs overwhelmingly fund research, development, and trials, not sales or go-to-market.

Limited Livestock Tech Support:
Despite Alberta having approximately 40% of Canada's beef cattle, there are almost no programs targeting livestock technology at scale.`,


  "What funding options exist between $500K and $1M for agtech companies with revenue?": `**This gap is the single highest-leverage problem to solve in Canadian agtech.**

Of 417 catalogued programs, only 6 operate in the $500K to $1M funding band. Below $150K, there are 23 programs. Above $1M, there are 20. In between: a valley. The founders exist, the technology works, the pilots succeed. They just can't afford to sell.

**What founders in this gap actually need:**

The $500K to $1M range typically funds: first sales hires, initial marketing spend, regulatory compliance for market entry, bridge inventory for first orders, and customer success infrastructure. These are operational costs that don't fit the "innovation" criteria of most government programs and are too small for institutional VC.

**Strategic options for founders stuck here:**

1. **Stack programs**: Combine a $150K grant + $200K angel round + $150K revenue + provincial voucher programs to assemble $500K+ without a single $500K check.
2. **Revenue-based financing**: BDC and FCC both offer revenue-based lending that doesn't require the growth metrics VCs demand.
3. **Target 519 Growth Fund (RHA Ventures) or Emmertech directly**: Both explicitly invest in this range and understand ag timelines.
4. **Use AAFC programs as bridge**: AAFC \u2014 AgriInnovate and AAFC \u2014 AgriCompetitiveness Program can fill portions of this gap, though application timelines are 6-12 months.

**The 6 programs that do exist:**

Venture Capital:
- **Emmertech**: SK/National, ag-specific VC, invests in MVP-to-Pilot stage companies. One of the few funds that explicitly understands agricultural timelines.
- **519 Growth Fund (RHA Ventures)**: ON, Fund II targets $30M, investing $200K to $1M in pre-seed and seed-stage ag/food companies. Founders-for-founders model.

Government Programs:
- **AAFC \u2014 AgriInnovate**: Interest-free repayable contributions for commercializing market-ready innovations. Can reach the $500K to $1M range but process is slow.
- **AAFC \u2014 AgriCompetitiveness Program**: Non-repayable contributions up to $1M/year for capacity building.

Provincial:
- **Bioenterprise SmartGrowth Program**: ON, specifically designed for pilot-to-commercialization transition.
- **Alberta Innovates \u2014 Product Demonstration Program**: AB, funds commercial demonstration of proven technologies.

**Why this gap exists:**

The Canadian agtech ecosystem was built in two separate waves. The first wave (2010-2018) created early-stage support: accelerators, micro-grants, and pilot access programs capping at $150K to $200K. The second wave (2019-present) brought institutional capital: superclusters, large VC funds, and crown corporation vehicles starting at $1M+. Nobody built the bridge.

**For ecosystem operators:**
A dedicated $500K commercialization fund, even a small $10M pilot, would serve a founder population that currently has almost nowhere to turn.`

};
