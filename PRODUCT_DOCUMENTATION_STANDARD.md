# Product documentation standard  
## Regulation Q&A Platform

**Version:** 2.9  
**Status:** Active — governance checklist for product, design, compliance, engineering, and operations.  
**Product release:** `package.json` **1.2.9**.  
**Latest doc audit:** **2026-10-22** (full satellite lockstep for **nine** instruments — EU + Indonesia + United States; `SEED_FILES` = **29**; API enum; US ETL env; inventory/tests; region All/EU/Indonesia/USA).

**Scope:** All material under **`gdpr-qa-platform/`** describing the product, behavior, configuration, verification, and release history.

**Canonical product name:** **Regulation Q&A Platform** (UI title). Repository / npm package name remains `gdpr-qa-platform` for historical continuity.

---

## 1. Documentation index (authoritative map)

| Document | Audience | Purpose |
|----------|----------|---------|
| [README.md](README.md) | All | **Primary handbook:** overview, benefits, features, logic, business/tech guidelines, stack, structure, API summary, configuration, quick start, disclaimer. |
| [CHANGELOG.md](CHANGELOG.md) | Engineering, release managers | Dated, semantic record of user-visible and operational changes ([Keep a Changelog](https://keepachangelog.com/)). |
| [docs/README.md](docs/README.md) | All | Documentation hub: reading order, map, conventions. |
| [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) | Product, legal | Positioning, nine instruments, credible sources, News policy (EU + Indonesia + United States). |
| [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md) | Engineering, DevOps | Multi-regulation APIs, nine ETL paths, Ask pipeline, BYOK, security, performance. |
| [docs/PRD.md](docs/PRD.md) | Product, engineering | Formal requirements — region picker, nine instruments, Page \| Full reader, deep links, Indo/US news/ETL, soft-law AI ethics, US jurisdiction honesty, BYOK, Vercel. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | Product, UX | Personas for EU, Indonesian, and United States privacy / data / AI governance users. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | Product, QA | Epics and acceptance-oriented stories traceable to PRD. |
| [docs/VARIABLES.md](docs/VARIABLES.md) | Engineering, support | Data dictionary + **Mermaid relationship diagrams** (configuration, corpus, Ask, News, jurisdictions). |
| [docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md) | Integrators | Sample JSON for corpora (EU + ID + US), Ask, news. |
| [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) | Product leadership | Product metrics definitions and example OKRs (incl. Indo + US parity). |
| [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) | Design, frontend | Tokens, **nine regulation theme accents**, region picker chrome, News hero, components. |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | QA, compliance-oriented orgs | BR → PRD → stories → code → verification. |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | All | Business (**BG-***) and technical (**TG-***) limitations. |
| [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) | Engineering | Binding ETL ↔ JSON ↔ reader contract (all corpora). |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Integrators | REST request/response shapes; `regulation` enum of nine ids. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engineering | Context, layers, sequence diagrams (nine ETL paths). |
| [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) | Product, QA | Feature inventory **F-*** by area and regulation. |
| [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) | DevOps | Start, refresh (EU + ID + US), Vercel, smoke tests, incidents. |
| [docs/SOURCE_CODE_INVENTORY.md](docs/SOURCE_CODE_INVENTORY.md) | Engineering | File map and dependency sketch. |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | All | Acronyms and product terms (EU + Indonesia + United States). |
| [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) | DevOps | Serverless deploy and cron (all nine instruments). |
| [.env.example](.env.example) | DevOps | Commented configuration template (no secrets). |
| [public/regulation-profiles.js](public/regulation-profiles.js) | Frontend | EU per-regulation UI copy (`askUi`, `sourcesUi`, `newsUi`, `browseUi`, **`citationsUi`**). |
| [public/regulation-profiles-id.js](public/regulation-profiles-id.js) | Frontend | Indonesian instrument UI profiles. |
| [public/regulation-profiles-us.js](public/regulation-profiles-us.js) | Frontend | United States analogue UI profiles (CCPA, OPEN Data, Colorado ADMT). |
| [lib/regulations.js](lib/regulations.js) | Backend | Registry: nine instruments, jurisdictions, paths, feature flags. |
| [lib/paths.js](lib/paths.js) | Backend | `getDataDir()`, Vercel `SEED_FILES` (**29** JSON files). |

---

## 2. Product overview (summary)

**Canonical detail:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and **Ask** over **nine** regulatory instruments (EU + Indonesia + United States analogues) with official links; BM25 + Groq/Tavily; optional ISIC sector framing; regulation-scoped **Credible sources**; **News** with client relevance filters; **PDF** export. |
| **Target users** | Legal, compliance, privacy, AI governance, data-economy, Indonesian PDP / Satu Data / AI ethics, and US CCPA / ADMT / open-data professionals; DPOs; consultants; engineers (see personas). |
| **Regulations (EU)** | **GDPR** (EU 2016/679) — 99 articles, 173 recitals · **EU AI Act** (EU 2024/1689) — 113 / 180 · **EU Data Act** (EU 2023/2854) — 50 / 119. |
| **Regulations (Indonesia)** | **UU PDP** (UU 27/2022) — 76 pasal / 4 considering · **Satu Data** (Perpres 39/2019) — ~44 pasal · **AI Ethics** (SE Menkominfo 9/2023) — soft law, 7 sections / 9 values. |
| **Regulations (United States)** | **CCPA/CPRA** (`us-ccpa`) · **Colorado ADMT** (`us-admt`, SB 26-189) · **OPEN Government Data Act** (`us-open-data`, Pub. L. 115-435 Title II). **Not** federal GDPR/AI Act copies; **not** the 2014 DATA Act. |
| **Core concepts** | `lib/regulations.js` registry; per-regulation `*-content.json`; API `regulation` param; region filter (`eu` / `id` / `us` / `all`); `POST /api/answer` with `[S1]` citations; profile files (EU / ID / US); shared News corpus with client filters. |
| **Journey** | Select region (optional) → select regulation → Browse or Ask → follow citations → refresh corpus or news from authoritative sources when needed. |

---

## 3. Product benefits

**Canonical detail:** [README §2 – Product benefits](README.md#2-product-benefits)

- **Single interface** for nine instruments across three jurisdictions with consistent UX.  
- **Traceability** — citations map to local corpus and official publishers (EUR-Lex / JDIH / peraturan.go.id / CPPA / Colorado GA / govinfo).  
- **Grounded synthesis** — LLM uses retrieved excerpts; repair and extractive fallback.  
- **Efficient navigation** — structure browse, doc nav, Ask cross-links, PDF export.  
- **Offline-capable corpora** after refresh.  
- **Sector-aware Ask** (optional ISIC).  
- **Curated news** from EU/UK supervisory sources, Indonesian state/media hubs, **and** US official hubs (FTC, CPPA, OAG, Colorado AG, data.gov / FDS), with deduplication and topic taxonomy.  
- **BYOK** — browser-stored Groq/Tavily keys per request.  
- **Soft-law clarity** — ID AI Ethics framed as circular / guidance, not binding statute.  
- **US jurisdiction honesty** — analogues only; no claim of a federal GDPR or AI Act; OPEN Data ≠ 2014 DATA Act.

---

## 4. Features (summary)

**Canonical detail:** [README §3 – Features](README.md#3-features) · [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md)

| Area | Highlights |
|------|------------|
| **Shell** | Region + Regulation unified picker; Tools menu (≤899px); freshness; BYOK; refresh; credits bar; segmented tabs. |
| **Browse** | Welcome hub (EU + ID + US cards); chapters before recitals; GDPR topic filters only; collapsible mobile Filters; reader **Page \| Full**; jump Enter (no Go button); deep links; citation sidebar; mode-aware PDF; suitable recitals (GDPR only). |
| **Ask** | `POST /api/answer` only; Groq → Tavily → extractive; web snippets; sector; BYOK; regulation-scoped prompts (incl. soft-law for ID AI Ethics; US jurisdiction honesty). |
| **Sources** | `GET /api/meta?regulation=` credible org list per instrument (no GDPR fallback for non-GDPR). |
| **News** | Multi-source crawl (EU + Indo + US); filters; relevance filters for AI Act, Data Act, UU PDP, Satu Data, AI Ethics, CCPA, ADMT, OPEN Data. |
| **ETL** | `scraper.js`, `ai-act-scraper.js`, `data-act-scraper.js`, `id-law-scraper.js`, `us-law-scraper.js`; formatting guardrails; daily cron (all nine). |

---

## 5. Logic and data model

**Canonical detail:** [README §4](README.md#4-logic-and-data-flow) · [docs/VARIABLES.md](docs/VARIABLES.md)

| Corpus file | Regulation | ETL |
|-------------|------------|-----|
| `gdpr-content.json` | GDPR | `scraper.js` |
| `ai-act-content.json` | EU AI Act | `ai-act-scraper.js` |
| `data-act-content.json` | EU Data Act | `data-act-scraper.js` |
| `id-pdp-content.json` | UU PDP | `id-law-scraper.js id-pdp` |
| `id-satu-data-content.json` | Satu Data | `id-law-scraper.js id-satu-data` |
| `id-ai-ethics-content.json` | AI Ethics | `id-law-scraper.js id-ai-ethics` |
| `us-ccpa-content.json` | US CCPA/CPRA | `us-law-scraper.js us-ccpa` |
| `us-admt-content.json` | Colorado ADMT | `us-law-scraper.js us-admt` |
| `us-open-data-content.json` | OPEN Government Data Act | `us-law-scraper.js us-open-data` |

All corpora pass through **`document-formatting-guardrails.js`** before index build and on **`loadContent()`** read. News uses **`gdpr-news.json`** + **`news-crawler.js`** + **`news-topics.js`** (shared, not per-regulation).

**Display titles (critical):** `CANONICAL_ARTICLE_TITLES` in `public/app.js` is **GDPR-only**. All other instruments must use each article’s **full** **`title`** from their content JSON. See **`getArticleDisplayTitle()`**, **`getRecitalDisplayTitle()`**, and [DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md).

**Citation sidebar (critical):** Browse detail **`citationsUi`** in regulation profiles + **`syncCitationSidebarChrome()`** must update panel titles, leads, and publisher links when the regulation changes — never hardcode “GDPR” or GDPR-Info for all regulations.

**Removed in 1.2.6 (do not document as live):** `GET /api/categories`, `GET /api/chapters/:number`, `POST /api/ask`, `POST /api/summarize`, and OpenAI/Anthropic/Gemini/Mistral/OpenRouter summarize helpers.

---

## 6. Business guidelines

**Canonical detail:** [README §5](README.md#5-business-guidelines) · [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md)

- Reference only — **not legal advice**.  
- Verify on official publishers (EUR-Lex, JDIH, peraturan.go.id).  
- National EU DPAs other than **ICO (UK)** excluded from News/Sources by policy (**BG-07**).  
- News is not a complete press monitor for any single instrument.  
- Indonesian Komdigi HTML crawl may be WAF-blocked (best-effort).  
- SE AI Ethics is **soft law** — product copy and Ask prompts must not imply binding regulation force.

---

## 7. Tech guidelines

**Canonical detail:** [README §6](README.md#6-tech-guidelines) · [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md)

Node ≥ 18, Express, vanilla frontend, writable `data/`, CORS, optional Groq/Tavily keys. Do not bypass **`normalizeCorpus`** on corpus writes (**TG-E05**). No end-user authentication; cron protected by **`CRON_SECRET`** on Vercel only.

---

## 8. Tech stack (summary)

**Canonical detail:** [README §7](README.md#7-tech-stack)

Node.js, Express, node-cron, axios/cheerio, HTML/CSS/JS, DM Sans, browser print PDF export, Groq + Tavily (fetch), JSON in `data/`, Vercel serverless.

---

## 9. Documentation governance

| Rule | Rationale |
|------|-----------|
| **Single source of truth** | Shipped **code** wins; docs updated in the same change set when behavior changes. |
| **Update in lockstep** | API/env changes → **VARIABLES**, **API_CONTRACTS**, **README §10**, **CHANGELOG**. |
| **Formatting contract** | Guardrail or reader changes → **DOCUMENT_FORMATTING_GUARDRAILS** + traceability rows. |
| **Version alignment** | Release bumps **`package.json`** and **CHANGELOG**; doc “Last updated” when material. |
| **Legal tone** | Never imply legal advice; flag soft-law instruments explicitly. |
| **Comprehensive audit** | Major releases (e.g. new jurisdiction) trigger full doc set review per this standard. |
| **Module public API** | When trimming or adding `module.exports`, update **SOURCE_CODE_INVENTORY**, **VARIABLES**, **TECH_GUIDELINES**, and **GUARDRAILS** in the same change set. |
| **No dead APIs** | Do not document removed 1.2.6 endpoints or removed LLM providers as live. |

---

## 10. README table of contents (mirror)

1. Product overview  
2. Product benefits  
3. Features  
4. Logic and data flow  
5. Business guidelines  
6. Tech guidelines  
7. Tech stack  
8. Project structure  
9. API reference (summary)  
10. Configuration  
11. Quick start  
12. License and disclaimer  

---

## 11. Documentation revision history (standard)

| Standard version | Date | Highlights |
|------------------|------|------------|
| **2.9** | 2026-10-22 | Full satellite lockstep for product **1.2.9** — nine instruments (EU + ID + US); API_CONTRACTS enum; VARIABLES + `.env.example` US ETL; inventory/ops/tests (`us-parity`); SEED_FILES = 29; region All/EU/Indonesia/USA. |
| **2.8** | 2026-10-22 | USA feature parity notes (Ask expansions, Sources no GDPR fallback, US news hubs). |
| **2.6** | 2026-10-21 | Product **1.2.7**/1.2.8 reader UX lockstep (Page \| Full, Go removed, deep links, bounce fix); DM Sans–only; browse/reader tests. |
| **2.5** | 2026-10-20 | Multi-jurisdiction (EU + Indonesia, six instruments); remove dead APIs/LLM providers from docs; SEED_FILES = 20; Indo personas/stories/OKRs. |
| **2.4** | 2026-07-22 | Product **1.2.5** version alignment; browse welcome epic (US-W*); DESIGN_GUIDELINES regulation theme rgba tokens; METRICS O10; USER_STORIES Epic 0c. |
| **2.3** | 2026-07-06 | Module public API documentation; Vercel `SEED_FILES` manifest; dead-code cleanup record. |
| **2.2** | 2026-05-19 | Browse welcome hub (`browseUi`); desktop cards; chapters filter reset. |
| **2.1** | 2026-05-19 | Responsive app chrome; News hero; toolbar hints. |
| **2.0** | 2026-05-19 | Citation sidebar `citationsUi`; ETL formatting; full doc audit. |
| **1.9** | 2026-05-26 | Reader title fix; VARIABLES relationship charts. |
| **1.8** | 2026-05-19 | EU Data Act; app credits bar; three-regulation docs. |
| **1.5–1.7** | 2026-05 | BYOK, Vercel, AI Act integration (see [CHANGELOG.md](CHANGELOG.md)). |

---

## References

- [README.md](README.md)  
- [docs/PRD.md](docs/PRD.md)  
- [docs/README.md](docs/README.md)  
- [docs/GUARDRAILS.md](docs/GUARDRAILS.md)  
- [CHANGELOG.md](CHANGELOG.md)
