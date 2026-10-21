# User Personas  
## Regulation Q&A Platform

Personas represent primary users of the platform across **European Union** and **Indonesian** instruments. They inform features, user stories, and documentation.

**Version:** 2.0 · **Last updated:** 2026-10-21 · Documentation standard **v2.6** · Product **1.2.7**

---

## Persona 1: Legal / Compliance Professional (Primary)

| Attribute | Description |
|-----------|-------------|
| **Name** | Alex (Legal / Compliance) |
| **Role** | In-house counsel or compliance officer working across privacy, AI, and data-access instruments. |
| **Goals** | Find the right Article/Pasal or Recital quickly; cite official publishers; compare EU and Indonesian analogues without treating them as legally equivalent. |
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
| **Role** | External consultant advising multi-national clients on EU and/or Indonesian compliance documentation. |
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

## Persona 12: Engineering / DevOps

| Attribute | Description |
|-----------|-------------|
| **Name** | Avery (Platform Engineer) |
| **Role** | Operates Node/Vercel deployment, cron, env, corpora. |
| **Goals** | Reliable refresh for six instruments; seed on cold start; green `npm test`; documented env. |
| **Pain points** | Stale docs listing removed APIs; Indo WAF blocking news; `/tmp` ephemerality on Vercel. |
| **Needs** | OPERATIONS_RUNBOOK; VARIABLES; VERCEL_DEPLOY; CRON_SECRET; Indo refresh scripts; parity tests. |
| **Relevant features** | ETL CLI, cron, `/health`, Refresh sources/news, documentation set. |

---

## Summary matrix

| Persona | Primary jurisdiction | Primary instruments | Top jobs |
|---------|---------------------|---------------------|----------|
| Alex | Both | All six | Switch, browse, cite |
| Sam | EU | GDPR | Ask, News, suitable recitals |
| Dewi | ID | UU PDP | Pasal browse, Ask, Indo news |
| Bima | ID | Satu Data | Perpres browse, Ask |
| Sari | ID | AI Ethics (soft law) | Values browse, soft-law Ask |
| Jordan | Both | Client-dependent | Citations, PDF, BYOK |
| Riley | Either | Active + sector | Sector Ask |
| Quinn | EU | AI Act | AI Act Ask + News filter |
| Taylor | EU | Data Act | Data Act Ask + News filter |
| Casey | Either | Any | Quick Ask |
| Morgan | Either | Any | Verify sources |
| Avery | Ops | All (ETL) | Refresh, deploy, test |

---

## See also

- [USER_STORIES.md](USER_STORIES.md)  
- [PRD.md](PRD.md)  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)
