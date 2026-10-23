# User Personas  
## Regulation Q&A Platform

Personas represent primary users of the platform across **European Union**, **Indonesian**, **United States**, and **International** instruments. They inform features, user stories, and documentation.

**Version:** 3.1 · **Last updated:** 2026-10-22 · Documentation standard **v3.1** · Product **1.3.0** · Audit date **2026-10-22** · Instruments: thirteen (EU + Indonesia + United States + International)

---

## Persona 1: Legal / Compliance Professional (Primary)

| Attribute | Description |
|-----------|-------------|
| **Name** | Alex (Legal / Compliance) |
| **Role** | In-house counsel or compliance officer working across privacy, AI, and data-access instruments. |
| **Goals** | Find the right Article/Pasal or Recital quickly; cite official publishers; compare EU, Indonesian, United States, and International (ISO / SOC 2) analogues without treating them as legally equivalent. |
| **Pain points** | Long PDFs; instrument overlap; no single searchable multi-jurisdiction workspace. |
| **Needs** | Region + regulation picker; Browse welcome hub; Ask with `[S#]` citations; PDF export; Credible sources; mobile Tools menu. |
| **Relevant features** | Region picker, Browse welcome, Browse, Ask, Sources, Export PDF, Refresh sources, responsive chrome. |

---

## Persona 2: Data Protection Officer (DPO) — EU

| Attribute | Description |
|-----------|-------------|
| **Name** | Sam (DPO) |
| **Role** | EU-focused DPO answering internal GDPR questions and tracking supervisory guidance. |
| **Goals** | Citation-grounded answers; EDPB/ICO/Commission news; point colleagues to official sources. |
| **Pain points** | Repeating lookups; blogs without article references. |
| **Needs** | Ask + Relevant provisions; News filters; GDPR suitable recitals; Credible sources. |
| **Relevant features** | Ask, News, Credible sources, Browse, Refresh sources. |

---

## Persona 3: Indonesian Personal Data Protection Lead

| Attribute | Description |
|-----------|-------------|
| **Name** | Dewi (PDP Lead) |
| **Role** | Privacy / compliance lead implementing **UU 27/2022** (Pelindungan Data Pribadi) for an Indonesian controller or processor. |
| **Goals** | Navigate pasal text quickly; ask grounded questions in Indonesian or English; follow Indonesian policy news on PDP. |
| **Pain points** | Fragmented JDIH PDFs; EU-centric tools that ignore UU PDP; unclear Soft-law vs statute. |
| **Needs** | Region = Indonesia → ID PDP Law; Browse pasal/considering; Ask with citations to UU PDP corpus; Indo-filtered News; Credible sources to peraturan.go.id / JDIH. |
| **Relevant features** | Region picker, `id-pdp` Browse/Ask/Sources/News filter, Refresh sources (`id-law-scraper`). |

---

## Persona 4: Satu Data / Open Government Data Steward

| Attribute | Description |
|-----------|-------------|
| **Name** | Bima (Data Steward) |
| **Role** | Government or enterprise data steward aligning datasets with **Satu Data Indonesia** (Perpres 39/2019). |
| **Goals** | Understand principles, roles, and interoperability obligations from the Perpres text; monitor Satu Data portal / policy news. |
| **Pain points** | Dense presidential regulation; confusion with EU Data Act “analogue” marketing. |
| **Needs** | `id-satu-data` browse; Ask grounded in Perpres corpus; News relevance for Satu Data; clear “not EU Data Act” copy. |
| **Relevant features** | Browse welcome card, Ask, News filter, Credible sources. |

---

## Persona 5: AI Ethics / Responsible AI Officer (Indonesia)

| Attribute | Description |
|-----------|-------------|
| **Name** | Sari (AI Ethics Officer) |
| **Role** | Leads responsible-AI policy using **SE Menkominfo 9/2023** ethical values (soft law). |
| **Goals** | Map organizational AI practices to the nine ethical values and SE sections; educate stakeholders that the SE is **guidance**, not a binding Act. |
| **Pain points** | Soft-law documents misquoted as hard law; EU AI Act tools that do not cover Indonesian circulars. |
| **Needs** | `id-ai-ethics` with soft-law framing in Ask prompts and UI; Browse sections/values; News on etika AI. |
| **Relevant features** | Soft-law Ask framing, Browse, News filter, Sources (JDIH Komdigi). |

---

## Persona 6: Privacy / Legal Consultant

| Attribute | Description |
|-----------|-------------|
| **Name** | Jordan (Consultant) |
| **Role** | External consultant advising multi-national clients on EU, Indonesian, and/or United States compliance documentation. |
| **Goals** | Client-ready answers with exact references; export provisions; show freshness. |
| **Pain points** | Generic LLMs without article/pasal references; manual copying from EUR-Lex/JDIH. |
| **Needs** | Ask with citations; View in app; Export PDF; BYOK for client-controlled keys; multi-instrument switch. |
| **Relevant features** | Ask, Browse, Export PDF, Credible sources, BYOK validation. |

---

## Persona 7: Industry specialist (sector framing)

| Attribute | Description |
|-----------|-------------|
| **Name** | Riley (Industry specialist) |
| **Role** | Sector privacy/compliance lead (utilities, health, HR, etc.). |
| **Goals** | Sector-named answers grounded in cited text; no invented sector statutes. |
| **Pain points** | Generic “organizations must…” answers. |
| **Needs** | ISIC sector combobox on Ask; Browse for verification. |
| **Relevant features** | Ask (sector), Browse, Credible sources. |

---

## Persona 8: AI governance / compliance lead (EU AI Act)

| Attribute | Description |
|-----------|-------------|
| **Name** | Quinn (AI Governance) |
| **Role** | Owns EU AI Act readiness (risk tiers, GPAI, transparency). |
| **Goals** | Jump to AI Act articles/recitals; Ask with AI Act–scoped retrieval; filter News for AI relevance. |
| **Pain points** | Privacy-only tools; GDPR bleed into AI Act filters. |
| **Relevant features** | `ai-act` Browse/Ask/Sources, News AI Act filter, theme accent indigo. |

---

## Persona 9: Data economy / interoperability lead (EU Data Act)

| Attribute | Description |
|-----------|-------------|
| **Name** | Taylor (Data Economy) |
| **Role** | Product/legal lead on IoT data access, cloud switching, B2B sharing under the Data Act. |
| **Goals** | Locate Data Act articles; Ask with Data Act corpus; News filter for interoperability / data sharing. |
| **Pain points** | Mixed GDPR/Data Act confusion. |
| **Relevant features** | `data-act` Browse/Ask/Sources, News Data Act filter, sky theme. |

---

## Persona 10: General Professional (Developer / Product / Policy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Casey (General Professional) |
| **Role** | Developer, PM, or policy generalist checking wording occasionally. |
| **Goals** | Quick “what does the instrument say about X?” with links to verify. |
| **Pain points** | Not knowing article/pasal numbers; fear of outdated text. |
| **Needs** | Simple Ask; Browse; extractive fallback without API keys. |
| **Relevant features** | Ask, Browse, Credible sources, Homepage logo reset. |

---

## Persona 11: Stakeholder / Reviewer (Read-heavy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Morgan (Stakeholder) |
| **Role** | Manager or auditor verifying compliance materials. |
| **Goals** | Confirm citations exist; open official links; review PDF exports. |
| **Pain points** | Unsourced decks. |
| **Needs** | Credible sources; citation chips; PDF; News as awareness only. |
| **Relevant features** | Sources, Browse, Ask (read), Export PDF. |

---

## Persona 12: California privacy counsel (CCPA / CPRA)

| Attribute | Description |
|-----------|-------------|
| **Name** | Cameron (CCPA Counsel) |
| **Role** | In-house or outside counsel advising businesses on the **California Consumer Privacy Act** as amended by the **CPRA** (Cal. Civ. Code Title 1.81.5, §§ 1798.100–1798.199.95) and CPPA / CalPrivacy rulemaking. |
| **Goals** | Cite the exact Civil Code section for notice-at-collection, opt-out of sale/sharing, sensitive personal information, and enforcement; follow CPPA and California OAG announcements; explain to EU colleagues that CCPA is a **state-level analogue**, not a federal GDPR. |
| **Pain points** | Fragmented U.S. landscape; EU-centric tools that force "controller / processor / data subject" vocabulary; no federal omnibus privacy law to anchor answers. |
| **Needs** | Region = USA → `us-ccpa`; Browse **Sections** and **Purpose notes**; Ask with `[S#]` citations to CCPA text and CPPA / leginfo links; CCPA-filtered News (CPPA/CalPrivacy, California OAG, FTC privacy items); Credible sources (CPPA compilation, leginfo, OAG). |
| **Relevant features** | Region picker USA, `us-ccpa` Browse / Ask / Sources / News filter, US jurisdiction answer rule (F-ASK-14), `refresh-us-ccpa`. |

---

## Persona 13: Colorado ADMT / AI governance lead

| Attribute | Description |
|-----------|-------------|
| **Name** | Devon (ADMT / AI Governance) |
| **Role** | Responsible-AI, product-legal, or procurement lead preparing for the **Colorado Automated Decision-Making Technology Act** (SB 26-189; C.R.S. 6-1-1701 et seq.; duties from 1 Jan 2027). |
| **Goals** | Locate definitions (adverse outcome, consequential decision), developer / deployer duties, disclosure and meaningful human review provisions; track Colorado AG (ADAI) rulemaking; contrast with the EU AI Act without implying equivalence. |
| **Pain points** | Confusing ADMT with a general AI Act; no federal AI statute; rapidly moving state rulemaking. |
| **Needs** | `us-admt` Browse; Ask scoped to consequential decisions (never GDPR controller/processor wording); ADMT-filtered News (Colorado AG ADAI hub, FTC AI items); Credible sources (Colorado General Assembly, session laws, coag.gov/ai). |
| **Relevant features** | `us-admt` Browse / Ask / Sources / News filter, F-NEWS-16 / F-NEWS-17, `refresh-us-admt`, theme accent violet `#6d28d9`. |

---

## Persona 14: Federal open-data steward (OPEN Government Data Act)

| Attribute | Description |
|-----------|-------------|
| **Name** | Priya (Federal Open-Data Steward) |
| **Role** | Agency data officer, contractor, or civic-tech analyst implementing the **OPEN Government Data Act** (Title II of the Foundations for Evidence-Based Policymaking Act, Pub. L. 115-435; 44 U.S.C. § 3511 et seq.). |
| **Goals** | Understand machine-readable, open-license, and comprehensive data inventory duties; monitor data.gov, GSA, and Federal Data Strategy updates; explain to EU and Indonesian peers how it differs from the EU Data Act and Satu Data. |
| **Pain points** | **False friend:** the 2014 **DATA Act** (Digital Accountability and Transparency Act, federal spending transparency) is **not** this instrument and **not** the EU Data Act analogue; no private-sector data-sharing mandate exists federally. |
| **Needs** | `us-open-data` Browse; Ask grounded in Title II text; OPEN Data-filtered News (data.gov, GSA, Federal Data Strategy); Credible sources (govinfo, Congress.gov, data.gov). |
| **Relevant features** | `us-open-data` Browse / Ask / Sources / News filter, Business honesty copy, `refresh-us-open-data`, theme accent teal `#0f766e`. |

---

## Persona 15: Privacy programme lead (ISO/IEC 27701)

| Attribute | Description |
|-----------|-------------|
| **Name** | Noor (PIMS programme lead) |
| **Role** | Implements a Privacy Information Management System against **ISO/IEC 27701:2025** (standalone PIMS; 2019 withdrawn). |
| **Goals** | Understand PII controller vs processor roles, relationship to ISO/IEC 27001, and how a PIMS can *help demonstrate* GDPR-style accountability without replacing the GDPR. |
| **Pain points** | Paywalled ISO clause text; confusion with GDPR articles; treating certification as legal compliance. |
| **Needs** | `iso-27701` Browse/Ask/Sources (ISO.org catalogue); educational clause map; News from ISO.org; explicit “not a law” copy. |
| **Relevant features** | `iso-27701` Browse / Ask / Sources / News filter, `refresh-iso-27701`, theme teal `#0f766e`. |

---

## Persona 16: Cloud architect (ISO/IEC 19941)

| Attribute | Description |
|-----------|-------------|
| **Name** | Mateo (Cloud interoperability architect) |
| **Role** | Specifies cloud switching and multi-cloud portability using **ISO/IEC 19941:2017** vocabulary (CSC/CSP/CSN). |
| **Goals** | Distinguish interoperability vs portability types; watch ISO/IEC 19941-1 replacement; contrast with the EU Data Act’s binding switching rules. |
| **Pain points** | Confusing a technical standard with a switching statute; lock-in discussions without shared terminology. |
| **Needs** | `iso-19941` Browse/Ask; ISO.org catalogue links; 19941-1 life-cycle note. |
| **Relevant features** | `iso-19941` Browse / Ask / Sources / News filter, theme sky `#0369a1`. |

---

## Persona 17: AI risk officer (ISO/IEC 23894)

| Attribute | Description |
|-----------|-------------|
| **Name** | Hana (AI risk manager) |
| **Role** | Runs AI risk management using **ISO/IEC 23894:2023** (guidance overlaying ISO 31000) alongside EU AI Act readiness work. |
| **Goals** | Map the AI risk process (establish context, identify, analyse, evaluate, treat, monitor, re-assess); know that **ISO/IEC 42001** is the related certifiable AI management system (a *related note only*, never the same instrument); explain to EU colleagues that 23894 is voluntary guidance, not the AI Act. |
| **Pain points** | Equating 23894 with the EU AI Act or with ISO/IEC 42001; paywalled clause text; duplicate or conflicting requests for "the AI risk standard". |
| **Needs** | `iso-23894` Browse / Ask / Sources (ISO.org catalogue, JTC 1/SC 42); educational clause map and purpose notes; ISO-scoped News; explicit "voluntary guidance, not a law" copy. A repeated ISO 23894 request resolves to **one** instrument. |
| **Relevant features** | `iso-23894` Browse / Ask / Sources / News filter, LEGAL FORCE answer rule (see [API_CONTRACTS.md](API_CONTRACTS.md)), `refresh-iso-23894`, theme violet `#5b21b6`. |

---

## Persona 18: SOC 2 assurance auditor / report reviewer

| Attribute | Description |
|-----------|-------------|
| **Name** | Sasha (SOC 2 auditor / assurance buyer) |
| **Role** | CPA-adjacent auditor, vendor-risk analyst, or security lead who prepares for or reviews **SOC 2** reports built on the **AICPA 2017 Trust Services Criteria** (with Revised Points of Focus, 2022). |
| **Goals** | Navigate TSC categories (Security / Common Criteria CC; optional Availability A, Processing Integrity PI, Confidentiality C, Privacy P); distinguish **Type 1** (design at a point in time) from **Type 2** (operating effectiveness over a period); cite AICPA & CIMA sources. |
| **Pain points** | Treating SOC 2 as a privacy law, an ISO certificate, or a GDPR substitute; paywalled or copyrighted Points of Focus tables. |
| **Needs** | `soc2` Browse / Ask / Sources (AICPA TSC download page, SOC for Service Organizations hub); criterion-name map and purpose notes (copyright-safe educational overlay); AICPA-scoped News; explicit "attestation criteria, not a law" copy. |
| **Relevant features** | `soc2` Browse / Ask / Sources / News filter, LEGAL FORCE answer rule, `refresh-soc2`, theme amber `#b45309`. |

---

## Persona 19: Engineering / DevOps

| Attribute | Description |
|-----------|-------------|
| **Name** | Avery (Platform Engineer) |
| **Role** | Operates Node/Vercel deployment, cron, env, corpora. |
| **Goals** | Reliable refresh for thirteen instruments; seed on cold start (`SEED_FILES` = 41); green `npm test`; documented env (`MIN_US_*`, `MIN_ISO_*`, `US_*_FORCE_CORPUS_WRITE`). |
| **Pain points** | Stale docs listing removed APIs; Indo WAF blocking news; `/tmp` ephemerality on Vercel; ISO copyright (must not scrape paid text). |
| **Needs** | OPERATIONS_RUNBOOK; VARIABLES; VERCEL_DEPLOY; CRON_SECRET; Indonesian, US, and International refresh scripts (`refresh-id-*`, `refresh-us-*`, `refresh-iso-*`, `refresh-soc2`); parity tests (58 pass / 24 suites). |
| **Relevant features** | ETL CLI, cron, `/health`, Refresh sources/news, documentation set. |

---

## Summary matrix

| Persona | Primary jurisdiction | Primary instruments | Top jobs |
|---------|---------------------|---------------------|----------|
| Alex | EU / ID / US / INTL | All thirteen | Switch, browse, cite |
| Noor | International | ISO 27701 | PIMS clause map, GDPR analogue honesty |
| Mateo | International | ISO 19941 | Cloud portability vocabulary |
| Hana | International | ISO 23894 | AI risk-management guidance; 42001 related note |
| Sasha | International | SOC 2 | TSC categories; Type 1 vs Type 2 attestation |
| Sam | EU | GDPR | Ask, News, suitable recitals |
| Dewi | ID | UU PDP | Pasal browse, Ask, Indo news |
| Bima | ID | Satu Data | Perpres browse, Ask |
| Sari | ID | AI Ethics (soft law) | Values browse, soft-law Ask |
| Jordan | EU / ID / US | Client-dependent | Citations, PDF, BYOK |
| Riley | Any | Active + sector | Sector Ask |
| Quinn | EU | AI Act | AI Act Ask + News filter |
| Taylor | EU | Data Act | Data Act Ask + News filter |
| Casey | Any | Any | Quick Ask |
| Morgan | Any | Any | Verify sources |
| Cameron | US (California) | CCPA/CPRA | Cite Civil Code sections; CPPA / OAG news |
| Devon | US (Colorado) | ADMT | Consequential-decision duties; ADAI rulemaking news |
| Priya | US (federal) | OPEN Data Act | Data inventory / open-data duties; avoid the 2014 DATA Act false friend |
| Avery | Ops | All thirteen (ETL) | Refresh, deploy, test |

---

## See also

- [USER_STORIES.md](USER_STORIES.md)  
- [PRD.md](PRD.md)  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)
