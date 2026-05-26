# Product documentation standard  
## EU Regulation Q&A Platform

**Version:** 2.0  
**Status:** Active — governance checklist for product, design, compliance, engineering, and operations.  
**Product release:** `package.json` **1.2.2** (GDPR + EU AI Act + EU Data Act). **Latest doc audit:** 2026-05-19 (citation sidebar regulation chrome, long article titles, AI/Data Act ETL formatting, full doc set alignment).

**Scope:** All material under **`gdpr-qa-platform/`** describing the product, behavior, configuration, verification, and release history.

---

## 1. Documentation index (authoritative map)

| Document | Audience | Purpose |
|----------|----------|---------|
| [README.md](README.md) | All | **Primary handbook:** overview, benefits, features, logic, business/tech guidelines, stack, structure, API summary, configuration, quick start, disclaimer. |
| [CHANGELOG.md](CHANGELOG.md) | Engineering, release managers | Dated, semantic record of user-visible and operational changes ([Keep a Changelog](https://keepachangelog.com/)). |
| [docs/README.md](docs/README.md) | All | Documentation hub: reading order, map, conventions. |
| [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) | Product, legal | Positioning, regulation scope (GDPR, AI Act, Data Act), credible sources, News policy. |
| [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md) | Engineering, DevOps | Multi-regulation APIs, ETL, Ask pipeline, BYOK, security, performance. |
| [docs/PRD.md](docs/PRD.md) | Product, engineering | Formal requirements **v2.2** — three regulations, BYOK, News filters, reader titles, Vercel. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | Product, UX | Eight personas including AI governance and **data economy / Data Act** leads. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | Product, QA | Epics and acceptance-oriented stories traceable to PRD. |
| [docs/VARIABLES.md](docs/VARIABLES.md) | Engineering, support | Data dictionary + **Mermaid relationship diagrams** (configuration, corpus, Ask, News). |
| [docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md) | Integrators | Sample JSON for corpora, Ask, news (illustrative). |
| [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) | Product leadership | Product metrics definitions and example OKRs. |
| [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) | Design, frontend | Tokens, components, breakpoints, **app credits** bar, regulation chrome. |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | QA, compliance-oriented orgs | BR → PRD → stories → code → verification. |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | All | Business (**BG-***) and technical (**TG-***) limitations. |
| [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) | Engineering | Binding ETL ↔ JSON ↔ reader contract (all corpora). |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Integrators | REST request/response shapes. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engineering | Context, layers, sequence diagrams (three ETL paths). |
| [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) | Product, QA | Feature inventory **F-*** by area and regulation. |
| [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) | DevOps | Start, refresh, Vercel, smoke tests, incidents. |
| [docs/SOURCE_CODE_INVENTORY.md](docs/SOURCE_CODE_INVENTORY.md) | Engineering | File map and dependency sketch. |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | All | Acronyms and product terms. |
| [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) | DevOps | Serverless deploy and cron. |
| [.env.example](.env.example) | DevOps | Commented configuration template (no secrets). |
| [public/regulation-profiles.js](public/regulation-profiles.js) | Frontend | Per-regulation UI copy (`askUi`, `sourcesUi`, `newsUi`, **`citationsUi`**). |

---

## 2. Product overview (summary)

**Canonical detail:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and **Ask** over **GDPR**, **EU AI Act**, and **EU Data Act** with official links; BM25 + Groq/Tavily; optional ISIC sector framing; regulation-scoped **Credible sources**; **News** with relevance filters when AI Act or Data Act is selected; **PDF** export. |
| **Target users** | Legal, compliance, privacy, **AI governance**, **data economy / interoperability** professionals, DPOs, consultants, engineers (see personas). |
| **Regulations** | **GDPR** (EU 2016/679) — 99 articles, 173 recitals · **EU AI Act** (EU 2024/1689) — 113 / 180 · **EU Data Act** (EU 2023/2854) — 50 / 119. |
| **Core concepts** | `lib/regulations.js` registry; per-regulation `*-content.json`; API `regulation` param; `POST /api/answer` with `[S1]` citations; `regulation-profiles.js`; shared News corpus with client filters. |
| **Journey** | Select regulation → Browse or Ask → follow citations → refresh corpus or news from authoritative sources when needed. |

---

## 3. Product benefits

**Canonical detail:** [README §2 – Product benefits](README.md#2-product-benefits)

- **Single interface** for three EU regulations with consistent UX.  
- **Traceability** — citations map to local corpus and official publishers.  
- **Grounded synthesis** — LLM uses retrieved excerpts; repair and extractive fallback.  
- **Efficient navigation** — structure browse, doc nav, Ask cross-links, PDF export.  
- **Offline-capable corpora** after refresh.  
- **Sector-aware Ask** (optional ISIC).  
- **Curated news** from EU/UK supervisory sources with deduplication and topic taxonomy.  
- **BYOK** — browser-stored Groq/Tavily keys per request.

---

## 4. Features (summary)

**Canonical detail:** [README §3 – Features](README.md#3-features) · [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md)

| Area | Highlights |
|------|------------|
| **Browse** | Recitals; chapters/articles; GDPR topic filters; reader with **regulation-correct article/recital titles** (full long titles on AI/Data Act); **regulation-aware citation sidebar**; numbered/lettered paragraph layout (all corpora); Prev/Next/Go; chapter intros; PDF; GDPR suitable recitals. |
| **Ask** | `POST /api/answer`; Groq → Tavily → extractive; web snippets; sector; BYOK; regulation-scoped prompts. |
| **Sources** | `GET /api/meta?regulation=` credible org list per regulation. |
| **News** | Multi-source crawl; filters; By source / All; attachments when present; **AI Act** / **Data Act** relevance filter + banner. |
| **ETL** | `scraper.js`, `ai-act-scraper.js`, `data-act-scraper.js`; formatting guardrails; daily cron (all three). |
| **Shell** | Regulation switcher; **app credits** bar (maintainer attribution + LinkedIn / website icons). |

---

## 5. Logic and data model

**Canonical detail:** [README §4](README.md#4-logic-and-data-flow) · [docs/VARIABLES.md](docs/VARIABLES.md)

| Corpus file | Regulation | ETL |
|-------------|------------|-----|
| `gdpr-content.json` | GDPR | `scraper.js` |
| `ai-act-content.json` | EU AI Act | `ai-act-scraper.js` |
| `data-act-content.json` | EU Data Act | `data-act-scraper.js` |

All corpora pass through **`document-formatting-guardrails.js`** before index build and on **`loadContent()`** read. News uses **`gdpr-news.json`** + **`news-crawler.js`** + **`news-topics.js`** (shared, not per-regulation).

**Display titles (critical):** `CANONICAL_ARTICLE_TITLES` in `public/app.js` is **GDPR-only**. EU AI Act and EU Data Act must use each article’s **full** **`title`** from `ai-act-content.json` / `data-act-content.json` (no 120-character fallback to “Article N”). See **`getArticleDisplayTitle()`**, **`getRecitalDisplayTitle()`**, and [DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md).

**Citation sidebar (critical):** Browse detail **`citationsUi`** in `regulation-profiles.js` + **`syncCitationSidebarChrome()`** in `public/app.js` must update panel titles, leads, and publisher links when the regulation changes — never hardcode “GDPR” or GDPR-Info for all regulations.

---

## 6. Business guidelines

**Canonical detail:** [README §5](README.md#5-business-guidelines) · [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md)

- Reference only — **not legal advice**.  
- Verify on EUR-Lex and publisher sites.  
- National DPAs other than **ICO (UK)** excluded from News/Sources by policy (**BG-07**).  
- News is not a complete press monitor for AI Act or Data Act alone.

---

## 7. Tech guidelines

**Canonical detail:** [README §6](README.md#6-tech-guidelines) · [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md)

Node ≥ 18, Express, vanilla frontend, writable `data/`, CORS, optional LLM keys. Do not bypass **`normalizeCorpus`** on corpus writes (**TG-E05**).

---

## 8. Tech stack (summary)

**Canonical detail:** [README §7](README.md#7-tech-stack)

Node.js, Express, node-cron, axios/cheerio, HTML/CSS/JS, DM Sans / DM Serif Text, html2pdf.js, fetch-based LLM APIs, JSON in `data/`.

---

## 9. Documentation governance

| Rule | Rationale |
|------|-----------|
| **Single source of truth** | Shipped **code** wins; docs updated in the same change set when behavior changes. |
| **Update in lockstep** | API/env changes → **VARIABLES**, **API_CONTRACTS**, **README §10**, **CHANGELOG**. |
| **Formatting contract** | Guardrail or reader changes → **DOCUMENT_FORMATTING_GUARDRAILS** + traceability rows. |
| **Version alignment** | Release bumps **`package.json`** and **CHANGELOG**; doc “Last updated” when material. |
| **Legal tone** | Never imply legal advice. |
| **Comprehensive audit** | Major releases (e.g. new regulation) trigger full doc set review per this standard. |

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
| **2.0** | 2026-05-19 | Citation sidebar `citationsUi`; long-title display fix; ETL sup/`<li>` numbering; full doc audit; PRD v2.3; traceability BR-B-11/12. |
| **1.9** | 2026-05-26 | Reader title fix (GDPR-only canonical); AI/Data Act formatting; VARIABLES relationship charts; PRD v2.2. |
| **1.8** | 2026-05-19 | EU Data Act; app credits bar; three-regulation docs. |
| **1.5–1.7** | 2026-05 | BYOK, Vercel, AI Act integration (see [CHANGELOG.md](CHANGELOG.md)). |

---

## References

- [README.md](README.md)  
- [docs/PRD.md](docs/PRD.md)  
- [docs/README.md](docs/README.md)  
- [docs/GUARDRAILS.md](docs/GUARDRAILS.md)  
- [CHANGELOG.md](CHANGELOG.md)
