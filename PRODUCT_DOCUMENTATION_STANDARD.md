# Product documentation standard  
## GDPR Q&A Platform

**Version:** 1.1  
**Status:** Active — this document is the **governance checklist** for product, design, compliance, engineering, and operations stakeholders.

**Scope:** All material under **`gdpr-qa-platform/`** that describes what the product is, how it behaves, how it is configured, and how it is verified.

---

## 1. Documentation index (authoritative map)

| Document | Audience | Purpose |
|----------|----------|---------|
| [README.md](README.md) | All | Primary handbook: overview, benefits, features, logic, business/tech guidelines, tech stack, structure, API summary, configuration, quick start, disclaimer. |
| [CHANGELOG.md](CHANGELOG.md) | Engineering, release managers | Semantic, dated record of user-visible and operational changes. |
| [docs/README.md](docs/README.md) | All | Hub page: reading order, document map, conventions. |
| [docs/PRD.md](docs/PRD.md) | Product, engineering | Product Requirements Document: goals, functional/non-functional requirements, data model, success criteria, out of scope. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | Product, UX, content | Personas, goals, pain points, feature fit. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | Product, QA, engineering | User stories by epic, traceable to PRD. |
| [docs/VARIABLES.md](docs/VARIABLES.md) | Engineering, DevOps, support | Data dictionary: env vars, JSON fields, Ask/refresh variables, **relationship diagrams** (data flow + configuration). |
| [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) | Product leadership | Product metrics and example OKRs. |
| [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) | Design, frontend | Visual system: palette, typography, layout tokens, components, responsive breakpoints, print/PDF. |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | Quality, compliance-oriented orgs | Business requirements ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | All | Business and technical limitations (legal, LLM, ETL, news, frontend, privacy). |
| [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) | Engineering | **Binding** contract: ETL ↔ JSON ↔ reader; mandatory refresh pipeline; citation and list rules. |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Engineering, integrators | REST request/response shapes. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engineering | System context, layers, sequence diagrams. |
| [.env.example](.env.example) | DevOps | Commented template for configuration (no secrets committed). |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | All | Acronyms and product terms (BM25, ETL, GDPR-Info, …). |

---

## 2. Product overview (summary)

**Canonical detail:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and search **Regulation (EU) 2016/679** with official links; **Ask** with BM25-grounded excerpts, optional web snippets, and **Groq** / **Tavily** / extractive synthesis; optional **industry sector** framing; **Credible sources**; curated **News**; **PDF** export. |
| **Target users** | Legal, compliance, DPOs, consultants, sector specialists, and occasional professional users (see personas). |
| **Core concepts** | Local corpus **`gdpr-content.json`**, **`normalizeCorpus`** on every refresh and read, **`POST /api/answer`**, citation ids **`[S1]`**, cross-references (**`gdpr-crossrefs.js`**), chapter summaries, news merge. |
| **High-level journey** | Open app → Browse or Ask → follow citations → refresh regulation or news from authoritative sources when needed. |

---

## 3. Product benefits

**Canonical detail:** [README §2 – Product benefits](README.md#2-product-benefits)

Traceability to Articles/Recitals, grounded answers with citations, efficient browse and Ask flows, sector-aware prompts, credible news aggregation, offline-capable corpus after refresh, PDF export, topic filters, document navigation, post-refresh UI consistency.

---

## 4. Features (summary)

**Canonical detail:** [README §3 – Features](README.md#3-features)

| Area | Highlights |
|------|------------|
| **Browse** | Recitals and chapters/articles; filters; reader; Prev/Next/Go; related articles/recitals; chapter intros; Export PDF; homepage via logo. |
| **Ask** | **`POST /api/answer`**; Groq → Tavily → extractive; optional web; industry sector; relevant provisions; **`[Sn]`** chips. |
| **Sources & News** | **`/api/meta`** sources; news by source/topic; **`POST /api/news/refresh`**. |
| **Refresh** | Regulation ETL with **document formatting guardrails**; server cache reload; client meta/lists/doc reopen; daily cron; CLI **`npm run refresh`**. |

---

## 5. Logic and data model

**Canonical detail:** [README §4 – Logic and data flow](README.md#4-logic-and-data-flow) · [docs/VARIABLES.md](docs/VARIABLES.md)

| Element | Description |
|--------|--------------|
| **Corpus** | **`gdpr-content.json`** from **`scraper.js`**; always passed through **`document-formatting-guardrails.js`** before index build and disk write; **`loadContent()`** re-normalizes on read. |
| **Ask** | **`buildLocalContext`** (BM25, sector expansion), optional **`fetchWebSnippets`**, Groq/Tavily/extractive path. |
| **Crossrefs** | **`article-suitable-recitals.json`** + recital text citation extraction. |
| **News** | Static JSON + crawler merge by URL; timeouts and caps via env. |

---

## 6. Business guidelines

**Canonical detail:** [README §5 – Business guidelines](README.md#5-business-guidelines) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md)

Reference only; no legal advice; verify on EUR-Lex and publisher sites; attribute sources; respect privacy when instrumenting (see metrics doc).

---

## 7. Tech guidelines

**Canonical detail:** [README §6 – Tech guidelines](README.md#6-tech-guidelines)

Node ≥ 18, Express, no frontend build, writable **`data/`**, CORS, optional LLM keys, accessibility patterns on tabs and filters. **Do not** bypass **`normalizeCorpus`** on any new corpus write path (**TG-E05** in guardrails).

---

## 8. Tech stack (summary)

**Canonical detail:** [README §7 – Tech stack](README.md#7-tech-stack)

Node.js, Express, node-cron, axios/cheerio (scraper and news), vanilla HTML/CSS/JS, DM Sans / DM Serif Text, html2pdf.js, fetch-based LLM calls.

---

## 9. Documentation governance

| Rule | Rationale |
|------|-----------|
| **Single source of truth** | Behavior is described first in **code**; docs must match shipped behavior. |
| **Update in lockstep** | API or env changes require **VARIABLES**, **API_CONTRACTS**, **README §10**, and **CHANGELOG** in the same change set when user-visible. |
| **Formatting contract** | Any change to **`document-formatting-guardrails.js`** or reader formatters requires **DOCUMENT_FORMATTING_GUARDRAILS.md** and traceability rows where applicable. |
| **Version alignment** | Release bumps **`package.json`** version and **CHANGELOG** `[Unreleased]` → dated section. |
| **Legal tone** | User-facing assurance remains “reference only”; do not imply legal advice in docs. |

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

## References

- [README.md](README.md)  
- [docs/PRD.md](docs/PRD.md)  
- [docs/README.md](docs/README.md)  
- [docs/GUARDRAILS.md](docs/GUARDRAILS.md)
