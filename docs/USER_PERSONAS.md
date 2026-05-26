# User Personas  
## EU Regulation Q&A Platform

Personas represent primary users of the platform (**GDPR**, **EU AI Act**, and **EU Data Act**). They inform features, user stories, and documentation.

**Version:** 1.4 · **Last updated:** 2026-05-19 · Documentation standard **v2.0**

---

## Persona 1: Legal / Compliance Professional (Primary)

| Attribute | Description |
|-----------|-------------|
| **Name** | Alex (Legal / Compliance) |
| **Role** | In-house counsel or compliance officer; needs accurate EU regulation text and citations across privacy, AI, and data-access law. |
| **Goals** | Find the right Article or Recital quickly; cite official sources (EUR-Lex, GDPR-Info, AI Act Law, Data Act Law); avoid unsourced interpretations. |
| **Pain points** | Long PDFs; confusion between overlapping instruments (GDPR vs AI Act vs Data Act); no single searchable workspace. |
| **Needs** | Regulation switcher; Browse with filters; Ask with **`[S#]`** citations; sector framing when relevant; PDF export; credible sources tab. |
| **Relevant features** | Browse, Ask, Credible sources, Export PDF, Refresh sources, regulation profiles. |

---

## Persona 2: Data Protection Officer (DPO)

| Attribute | Description |
|-----------|-------------|
| **Name** | Sam (DPO) |
| **Role** | DPO; answers internal questions on GDPR and tracks supervisory guidance. |
| **Goals** | Citation-grounded answers; stay updated on EDPB/ICO/Commission news; point colleagues to official sources. |
| **Pain points** | Repeating lookups; ensuring answers trace to regulation text, not blogs. |
| **Needs** | Ask + Relevant provisions; News filters by source/topic; Credible sources; GDPR suitable recitals where available. |
| **Relevant features** | Ask, News, Credible sources, Browse, Refresh sources. |

---

## Persona 3: Privacy / Legal Consultant

| Attribute | Description |
|-----------|-------------|
| **Name** | Jordan (Consultant) |
| **Role** | External consultant advising clients on EU compliance documentation. |
| **Goals** | Client-ready answers with exact references; export provisions; show “as of” freshness. |
| **Pain points** | Generic LLMs without article references; manual EUR-Lex copying. |
| **Needs** | Ask with citations; View in app; Export PDF; regulation-scoped credible sources. |
| **Relevant features** | Ask, Browse, Export PDF, Credible sources, BYOK validation. |

---

## Persona 4: Industry specialist (e.g. utilities, health, HR)

| Attribute | Description |
|-----------|-------------|
| **Name** | Riley (Industry specialist) |
| **Role** | Sector privacy/compliance lead needing GDPR explained in industry context. |
| **Goals** | Sector-named answers grounded in cited text; no invented sector statutes. |
| **Pain points** | Generic “organizations must…” answers. |
| **Needs** | ISIC sector combobox on Ask; Browse for verification. |
| **Relevant features** | Ask (sector), Browse, Credible sources. |

---

## Persona 5: General Professional (Developer / Product / Policy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Casey (General Professional) |
| **Role** | Developer, PM, or policy generalist checking regulation wording occasionally. |
| **Goals** | Quick “what does the law say about X?” with links to verify. |
| **Pain points** | Not knowing article numbers; fear of outdated text. |
| **Needs** | Simple Ask; Browse; extractive fallback without API keys. |
| **Relevant features** | Ask, Browse, Credible sources, Homepage (logo reset). |

---

## Persona 6: Stakeholder / Reviewer (Read-heavy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Morgan (Stakeholder) |
| **Role** | Manager or auditor verifying compliance materials. |
| **Goals** | Confirm cited Articles/Recitals match in-app text and official links. |
| **Pain points** | Multi-site verification. |
| **Needs** | Browse doc nav; citations panel; Export PDF. |
| **Relevant features** | Browse, Credible sources, Export PDF. |

---

## Persona 7: Engineering / DevOps

| Attribute | Description |
|-----------|-------------|
| **Name** | Taylor (Engineering / DevOps) |
| **Role** | Deploys and operates the app; owns ETL, env, and observability. |
| **Goals** | Keep **three** corpora current and formatting-consistent; safe BYOK; predictable cron. |
| **Pain points** | Wrong regulation overwritten on refresh; stale cache after ETL; long news crawls. |
| **Needs** | [VARIABLES.md](VARIABLES.md); `POST /api/refresh` per regulation; `npm run refresh-data-act`; Vercel cron; BYOK + validate-api-keys. |
| **Relevant features** | Refresh pipeline, guardrails, BYOK, `.env.example`, OPERATIONS_RUNBOOK. |

---

## Persona 8: AI governance / compliance lead (EU AI Act)

| Attribute | Description |
|-----------|-------------|
| **Name** | Avery (AI governance) |
| **Role** | Leads AI Act readiness — high-risk systems, GPAI, transparency. |
| **Goals** | Official AI Act text; scoped Ask; Commission AI framework links; relevant news. |
| **Pain points** | GDPR vs AI Act confusion; PDF-only workflows. |
| **Needs** | Select **EU AI Act**; Browse 113/180; AI-filtered News; `npm run refresh-ai-act`. |
| **Relevant features** | Regulation switcher, AI Act Browse/Ask/Sources, News banner + filter. |

---

## Persona 9: Data economy / interoperability lead (EU Data Act)

| Attribute | Description |
|-----------|-------------|
| **Name** | Dana (Data Act lead) |
| **Role** | Owns Data Act readiness — data access, switching, IoT product data, B2B sharing, cloud contracts. |
| **Goals** | Read official Data Act articles/recitals; Ask with citations; link to Data Act Law and EUR-Lex 2023/2854. |
| **Pain points** | Data Act text scattered; overlap with GDPR and sector rules; generic search results. |
| **Needs** | Select **EU Data Act**; Browse 50/119; Ask with Data Act corpus; Credible sources (Data Act Law, Commission data-act policy); Data Act–filtered News. |
| **Relevant features** | Regulation switcher, Data Act Browse/Ask/Sources, News filter, `npm run refresh-data-act`. |

---

## Summary matrix

| Persona | Primary use | Key features |
|---------|-------------|--------------|
| Legal / Compliance | Multi-regulation lookup | Switcher, Browse, Ask, Sources |
| DPO | GDPR Q&A + news | Ask, News, Sources |
| Consultant | Sourced client work | Ask, PDF, Sources |
| Industry specialist | Sector Ask | Ask + ISIC, Browse |
| General Professional | Quick check | Ask, Browse |
| Stakeholder | Verify citations | Browse, PDF |
| Engineering / DevOps | Operate three ETL paths | Refresh, cron, BYOK, env |
| AI governance lead | AI Act obligations | `ai-act`, Browse/Ask, News filter |
| Data Act lead | Data Act obligations | `data-act`, Browse/Ask, News filter |

For user stories, see [USER_STORIES.md](USER_STORIES.md). For the product handbook, see [README.md](../README.md).
