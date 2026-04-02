# Product documentation standard

This document defines the **product documentation standard** for the GDPR Q&A Platform. Use it as a **checklist and index** for product, design, compliance, and engineering stakeholders.

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Primary documentation: overview, benefits, features, logic, business/tech guidelines, tech stack, structure, API summary, configuration, disclaimer. |
| [CHANGELOG.md](CHANGELOG.md) | Historical development log and release notes. |
| [docs/README.md](docs/README.md) | Hub page listing all `docs/` files with short descriptions. |
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document: goals, requirements, data model, success criteria, out of scope. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | Personas, goals, pain points, and feature fit. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | User stories by epic (Browse, Ask, Sources, News, Refresh, Navigation, Export, Accessibility). |
| [docs/VARIABLES.md](docs/VARIABLES.md) | Variable and field dictionary: names, definitions, formulas, locations, examples, relationship diagram. |
| [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) | Product metrics and OKR examples for the product team. |
| [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) | Visual design system: palette, typography, layout tokens, components, print/PDF. |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | Enterprise traceability: business requirements ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | Business and technical guardrails and limitations. |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | REST API contracts (request/response shapes). |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | High-level architecture and sequence flows. |
| [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) | JSON ↔ scraper ↔ `app.js` reader contract; numbered paragraphs, citations, ETL verification. |

---

## 1. Overview

**Location:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and search Regulation (EU) 2016/679 (recitals and articles) with official links; **Ask** with BM25-grounded excerpts, optional web snippets, and Groq/Tavily synthesis; industry sector framing; Credible sources; curated news; PDF export. |
| **Target users** | Legal, compliance, DPOs, consultants, and professionals who need traceable GDPR references. |
| **Key concepts** | Corpus in `gdpr-content.json`, `POST /api/answer`, citation chips `[S1]`, crossrefs (`gdpr-crossrefs.js`), chapter summaries, news merge, EUR-Lex refresh. |
| **High-level flow** | Open app → Browse or Ask → follow citations → optionally refresh content or news from authoritative sources. |

---

## 2. Product benefits

**Location:** [README §2 – Product benefits](README.md#2-product-benefits)

Traceability to Articles/Recitals, reduced unsourced claims via grounding + citations, efficient browse/ask flows, optional sector-aware answers, credible news aggregation, offline-capable corpus after refresh, PDF export, topic filters, document navigation.

---

## 3. Features

**Location:** [README §3 – Features](README.md#3-features)

| Area | Contents |
|------|----------|
| **Browse** | Recitals and chapters/articles; filters; detail reader; Prev/Next/Go; related articles/recitals; chapter intro blurbs; Export PDF. |
| **Ask** | `POST /api/answer`; Groq primary; Tavily fallback; extractive fallback; optional web context; industry sector combobox; relevant provisions list; clickable `[Sn]` chips. |
| **Sources & News** | `/api/meta` sources; news by source/topic; `POST /api/news/refresh`. |
| **Refresh** | Regulation ETL; daily cron; optional chapter summary regeneration (Groq). |

---

## 4. Logics and data model

**Location:** [README §4 – Logic and data flow](README.md#4-logic-and-data-flow) · [docs/VARIABLES.md](docs/VARIABLES.md)

| Element | Description |
|--------|--------------|
| **Corpus** | `gdpr-content.json` from `scraper.js`; `searchIndex` for BM25 and legacy search. |
| **Ask** | `buildLocalContext` (BM25, sector expansion), optional `fetchWebSnippets`, Groq/Tavily/extractive path. |
| **Crossrefs** | `article-suitable-recitals.json` + recital text citation extraction (`gdpr-crossrefs.js`). |
| **News** | Static JSON + crawler merge by URL; timeouts and caps via env. |

---

## 5. Business guidelines

**Location:** [README §5 – Business guidelines](README.md#5-business-guidelines) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md)

Reference only; no legal advice; verify on EUR-Lex and publisher sites; attribute sources.

---

## 6. Tech guidelines

**Location:** [README §6 – Tech guidelines](README.md#6-tech-guidelines)

Node ≥18, Express, no frontend build, writable `data/`, CORS, optional LLM keys, accessibility patterns on tabs and filters.

---

## 7. Tech stack (summary)

**Location:** [README §7 – Tech stack](README.md#7-tech-stack)

Node.js, Express, node-cron, axios/cheerio (scraper and news), vanilla HTML/CSS/JS, DM Sans / DM Serif Text, html2pdf.js, Groq/Tavily/fetch-based LLM calls.

---

## 8. Other important elements

| Element | Location |
|--------|----------|
| **Variables & metrics** | [docs/VARIABLES.md](docs/VARIABLES.md), [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) |
| **Design** | [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) |
| **Traceability** | [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) |
| **API detail** | [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) |
| **Architecture** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Changelog** | [CHANGELOG.md](CHANGELOG.md) |
| **Reader/ETL contract** | [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) |

---

## Quick reference: README table of contents

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

**Related:** [README.md](README.md) · [docs/PRD.md](docs/PRD.md) · [docs/README.md](docs/README.md)
