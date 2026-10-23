# Product documentation standard  
## Regulation Q&A Platform

**Version:** 3.1  
**Status:** Active — governance checklist for product, design, compliance, engineering, and operations.  
**Product release:** `package.json` **1.3.0**.  
**Latest doc audit:** **2026-10-22** (full body + satellite lockstep for **thirteen** instruments — EU + Indonesia + United States + International; `SEED_FILES` = **41**; region All/EU/Indonesia/USA/INTL; ISO/SOC2 ETL env; copyright-safe voluntary corpora).

**Scope:** All material under **`gdpr-qa-platform/`** describing the product, behavior, configuration, verification, and release history.

**Canonical product name:** **Regulation Q&A Platform** (UI title). Repository / npm package name remains `gdpr-qa-platform` for historical continuity.

---

## 1. Documentation index (authoritative map)

| Document | Audience | Purpose |
|----------|----------|---------|
| [README.md](README.md) | All | **Primary handbook:** overview, benefits, features, logic, business/tech guidelines, stack, structure, API summary, configuration, quick start, disclaimer. |
| [CHANGELOG.md](CHANGELOG.md) | Engineering, release managers | Dated, semantic record of user-visible and operational changes ([Keep a Changelog](https://keepachangelog.com/)). |
| [docs/README.md](docs/README.md) | All | Documentation hub: reading order, map, conventions. |
| [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) | Product, legal | Positioning, thirteen instruments, credible sources, News policy (EU + Indonesia + United States + International). |
| [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md) | Engineering, DevOps | Multi-regulation APIs, thirteen ETL paths, Ask pipeline, BYOK, security, performance. |
| [docs/PRD.md](docs/PRD.md) | Product, engineering | Formal requirements — region picker, thirteen instruments, Page \| Full, Indo/US/INTL news/ETL, voluntary-standard honesty, BYOK, Vercel. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | Product, UX | Personas for EU, Indonesian, US, and International (ISO/SOC 2) users. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | Product, QA | Epics and acceptance-oriented stories traceable to PRD. |
| [docs/VARIABLES.md](docs/VARIABLES.md) | Engineering, support | Data dictionary + **Mermaid relationship diagrams** (configuration, corpus, Ask, News, jurisdictions). |
| [docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md) | Integrators | Sample JSON for corpora (EU + ID + US + ISO/SOC2), Ask, news. |
| [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) | Product leadership | Product metrics and OKRs (incl. Indo + US + International parity). |
| [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) | Design, frontend | Tokens, **thirteen regulation theme accents**, region picker (incl. INTL), News hero, components. |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | QA, compliance-oriented orgs | BR → PRD → stories → code → verification. |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | All | Business (**BG-***) and technical (**TG-***) limitations. |
| [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) | Engineering | Binding ETL ↔ JSON ↔ reader contract (all corpora). |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Integrators | REST shapes; `regulation` enum of **thirteen** ids. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engineering | Context, layers, sequence diagrams (thirteen ETL paths). |
| [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) | Product, QA | Feature inventory **F-*** by area and regulation. |
| [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) | DevOps | Start, refresh (EU + ID + US + INTL), Vercel, smoke tests. |
| [docs/SOURCE_CODE_INVENTORY.md](docs/SOURCE_CODE_INVENTORY.md) | Engineering | File map and dependency sketch. |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | All | Acronyms and product terms (all four jurisdictions). |
| [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) | DevOps | Serverless deploy and cron (all thirteen instruments). |
| [.env.example](.env.example) | DevOps | Commented configuration template (no secrets). |
| [public/regulation-profiles.js](public/regulation-profiles.js) | Frontend | EU UI profiles. |
| [public/regulation-profiles-id.js](public/regulation-profiles-id.js) | Frontend | Indonesian UI profiles. |
| [public/regulation-profiles-us.js](public/regulation-profiles-us.js) | Frontend | United States analogue UI profiles. |
| [public/regulation-profiles-iso.js](public/regulation-profiles-iso.js) | Frontend | International ISO/SOC 2 UI profiles. |
| [lib/regulations.js](lib/regulations.js) | Backend | Registry: thirteen instruments, jurisdictions (`eu`/`id`/`us`/`intl`), paths, feature flags. |
| [lib/paths.js](lib/paths.js) | Backend | `getDataDir()`, Vercel `SEED_FILES` (**41** JSON files). |

---

## 2. Product overview (summary)

**Canonical detail:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and **Ask** over **thirteen** instruments (EU + Indonesia + United States analogues + International voluntary standards) with official / catalogue links; BM25 + Groq/Tavily; optional ISIC sector; regulation-scoped **Credible sources**; **News** with client relevance filters; **PDF** export. |
| **Target users** | Legal, compliance, privacy, AI governance, data-economy, Indonesian PDP / Satu Data / AI ethics, US CCPA / ADMT / open-data, and ISO/SOC 2 practitioners; DPOs; consultants; engineers. |
| **Regulations (EU)** | **GDPR** · **EU AI Act** · **EU Data Act**. |
| **Regulations (Indonesia)** | **UU PDP** · **Satu Data** · **AI Ethics** (soft law). |
| **Regulations (United States)** | **CCPA/CPRA** · **Colorado ADMT** · **OPEN Government Data Act** (analogues; not federal GDPR/AI Act; not 2014 DATA Act). |
| **International (voluntary)** | **ISO/IEC 27701:2025** · **ISO/IEC 19941:2017** · **ISO/IEC 23894:2023** · **AICPA SOC 2** — **not laws**; copyright-safe educational overlays (no paywalled body scrape). |
| **Core concepts** | `lib/regulations.js`; `*-content.json`; `regulation` param; region filter (`all`/`eu`/`id`/`us`/`intl`); profile files (EU/ID/US/ISO); shared News corpus. |
| **Journey** | Select region → select instrument → Browse or Ask → follow citations → refresh corpus or news when needed. |

---

## 3. Product benefits

**Canonical detail:** [README §2 – Product benefits](README.md#2-product-benefits)

- **Single interface** for thirteen instruments across four jurisdictions.  
- **Traceability** to official / catalogue publishers (EUR-Lex, JDIH, CPPA, govinfo, ISO.org, AICPA).  
- **Grounded synthesis** with citation repair and extractive fallback.  
- **Honest mapping** — soft law, US analogues, and voluntary ISO/SOC 2 clearly labeled.  
- **Copyright-safe International corpora** — catalogue abstracts / public criterion names; ping-only ETL.  
- **Sector-aware Ask**, BYOK, curated multi-region News, Page \| Full reader + mode-aware PDF.

---

## 4. Features (summary)

| Area | Highlights |
|------|------------|
| **Shell** | Region thumb All / EU / Indonesia / USA / **INTL**; regulation picker; Tools; BYOK; refresh; credits; segmented tabs. |
| **Browse** | Welcome hub (four jurisdiction rows); Page \| Full; jump Enter; deep links; citation sidebar; mode-aware PDF. |
| **Ask** | `POST /api/answer` only; Groq → Tavily → extractive; soft-law / US / voluntary-standard framing. |
| **Sources** | `GET /api/meta?regulation=` — never GDPR-Info for non-GDPR (incl. `iso-*` / `soc2`). |
| **News** | EU + Indo + US + ISO.org / AICPA hubs; client relevance filters per instrument. |
| **ETL** | EU scrapers + `id-law-scraper.js` + `us-law-scraper.js` + **`iso-soc-scraper.js`**; guardrails; cron all thirteen. |

---

## 5. Logic and data model

| Corpus file | Regulation | ETL |
|-------------|------------|-----|
| `gdpr-content.json` | GDPR | `scraper.js` |
| `ai-act-content.json` | EU AI Act | `ai-act-scraper.js` |
| `data-act-content.json` | EU Data Act | `data-act-scraper.js` |
| `id-*-content.json` | UU PDP / Satu Data / AI Ethics | `id-law-scraper.js` |
| `us-*-content.json` | CCPA / ADMT / OPEN Data | `us-law-scraper.js` |
| `iso-*-content.json` / `soc2-content.json` | ISO 27701 / 19941 / 23894 / SOC 2 | `iso-soc-scraper.js` |

All corpora pass through **`document-formatting-guardrails.js`**. News: **`gdpr-news.json`**. Vercel seed: **`SEED_FILES` = 41**.

**Display titles:** `CANONICAL_ARTICLE_TITLES` is GDPR-only.  
**Citation sidebar:** must sync via profiles — never hardcode GDPR-Info.  
**Removed in 1.2.6:** `/api/categories`, `/api/chapters/:number`, `/api/ask`, `/api/summarize`.

---

## 6. Business guidelines

- Reference only — **not legal advice**.  
- Soft law / US analogues / voluntary ISO/SOC 2 must not be presented as binding EU/US federal statutes.  
- International corpora must remain **copyright-safe** (no paywalled ISO/AICPA body scrape).  
- National EU DPAs other than ICO (UK) excluded from News/Sources (**BG-07**).  
- Canonical: [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md).

---

## 7. Tech guidelines

Node ≥ 18, Express, vanilla frontend, writable `data/`, CORS, optional Groq/Tavily. No end-user auth; cron via `CRON_SECRET`. Do not bypass `normalizeCorpus`. Canonical: [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md).

---

## 8. Tech stack (summary)

Node.js, Express, node-cron, axios/cheerio, HTML/CSS/JS, DM Sans, browser print PDF export, Groq + Tavily, JSON in `data/`, Vercel serverless. Tests: `node --test` (`indo-parity`, `us-parity`, `iso-parity`, `browse-routes`, `reader-view`) — baseline **58 pass / 24 suites**.

---

## 9. Documentation governance

| Rule | Rationale |
|------|-----------|
| **Code wins** | Docs updated in lockstep when behavior changes. |
| **Instrument count** | Registry length (13) must match API contracts, README catalogue, VARIABLES enum, SEED_FILES coverage. |
| **Honesty** | Soft law, analogues, and voluntary standards labeled in every user-facing surface and Ask prompt. |
| **Copyright** | International ETL remains ping/catalogue-overlay only. |
| **No dead APIs** | Do not document removed 1.2.6 endpoints as live. |
| **Version alignment** | Bump `package.json` + CHANGELOG; refresh doc stamps and SEED count on material releases. |

---

## 10. README table of contents (mirror)

1. Product overview · 2. Product benefits · 3. Features · 4. Logic and data flow · 5. Business guidelines · 6. Tech guidelines · 7. Tech stack · 8. Project structure · 9. API reference · 10. Configuration · 11. Quick start · 12. License and disclaimer  

---

## 11. Documentation revision history (standard)

| Standard version | Date | Highlights |
|------------------|------|------------|
| **3.1** | 2026-10-22 | Full body + satellite lockstep for **1.3.0** / thirteen instruments; SEED **41**; region `intl`; ISO/SOC2 ETL env in VARIABLES + `.env.example`; inventory `regulation-profiles-iso.js` / `iso-soc-scraper.js`; test baseline 58/24. |
| **3.0** | 2026-10-22 | International jurisdiction (ISO 27701 / 19941 / 23894 / SOC 2); copyright-safe corpora; INTL region. |
| **2.9** | 2026-10-22 | USA nine-instrument satellite lockstep; SEED 29. |
| **2.6** | 2026-10-21 | Reader Page \| Full; Go removed; deep links; bounce fix. |
| **2.5** | 2026-10-20 | EU + Indonesia six instruments. |
| **2.0–2.4** | 2026-05–07 | See CHANGELOG / prior rows. |

---

## References

- [README.md](README.md)  
- [docs/PRD.md](docs/PRD.md)  
- [docs/README.md](docs/README.md)  
- [docs/GUARDRAILS.md](docs/GUARDRAILS.md)  
- [CHANGELOG.md](CHANGELOG.md)
