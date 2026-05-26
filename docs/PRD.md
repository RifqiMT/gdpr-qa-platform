# Product Requirements Document (PRD)  
## EU Regulation Q&A Platform

**Version:** 2.1  
**Last updated:** 2026-05-19  
**Aligned with:** Product documentation standard **v1.8** · `package.json` **1.2.0**

---

## 1. Product overview

### 1.1 Purpose

A web application for **browsing**, **searching**, and **asking questions** about:

1. **General Data Protection Regulation (EU) 2016/679** (GDPR)  
2. **Artificial Intelligence Act (EU) 2024/1689** (EU AI Act)  
3. **Data Act (EU) 2023/2854** (EU Data Act)

Users select the active regulation in the header. The product provides:

| Capability | Description |
|------------|-------------|
| **Browse** | Recitals and chapters/articles with filters (GDPR: category/sub-category; AI Act / Data Act: chapter/article), reader, PDF export, doc navigation. |
| **Ask** | `POST /api/answer` — BM25 + optional web + Groq/Tavily/extractive; `[S#]` citations; optional ISIC sector; BYOK keys; regulation-scoped prompts. |
| **Credible sources** | Regulation-scoped `meta.sources` from structure files (GDPR-Info, AI Act Law, Data Act Law, EUR-Lex, Commission policy pages). |
| **News** | GDPR/data-protection feeds; **relevance filters** when EU AI Act or EU Data Act is selected. |
| **Shell** | App **credits** bar (maintainer attribution with LinkedIn and website links). |

**Target users:** Legal, compliance, privacy, AI governance, and data-economy professionals; DPOs; consultants; internal platform engineers.

### 1.2 Goals

| ID | Goal |
|----|------|
| G1 | Single interface for **GDPR, EU AI Act, and EU Data Act** with consistent UX. |
| G2 | **Traceable** answers: corpus excerpts + citation ids. |
| G3 | **Official alignment** — EUR-Lex + readable mirrors (GDPR-Info, AI Act Law, Data Act Law). |
| G4 | **Credible news** from EU/UK supervisory and Commission sources. |
| G5 | **Operable** deployment (local + Vercel) with documented env and cron refresh. |

### 1.3 Non-goals

- Legal advice or binding compliance opinions.  
- Full AI Act– or Data Act–only news wires (client-side filter only today).  
- Multi-tenant SaaS, SSO, or audit trails (future).  
- Automated conformity assessment or DPIA generation.

---

## 2. Functional requirements

### 2.1 Regulation selection (FR-REG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REG-01 | Header dropdown lists regulations from `GET /api/regulations`. | P0 |
| FR-REG-02 | Selection persists in `localStorage` (`gdpr-qa-regulation-v1`). | P0 |
| FR-REG-03 | Browse, Ask, Sources, and API calls use active `regulation` id. | P0 |
| FR-REG-04 | **Refresh sources** runs ETL for the **selected** regulation only. | P0 |
| FR-REG-05 | UI chrome (titles, placeholders, links) updates via `regulation-profiles.js`. | P0 |

### 2.2 Browse (FR-BRW)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BRW-01 | Recitals list with search; open full text in reader. | P0 |
| FR-BRW-02 | Chapters/articles grouped list with filters. | P0 |
| FR-BRW-03 | GDPR: category + sub-category filters (`hasArticleTopics`). | P0 |
| FR-BRW-04 | AI Act: hide sub-category filter (`hasArticleTopics: false`). | P0 |
| FR-BRW-05 | Prev/Next/Go navigation; PDF export. | P1 |
| FR-BRW-06 | GDPR: related articles/recitals + suitable recitals. | P1 |
| FR-BRW-07 | AI Act: no suitable-recital crossrefs (`hasSuitableRecitals: false`). | P1 |
| FR-BRW-08 | Chapter intro from `/api/chapter-summaries` per regulation. | P1 |

### 2.3 Ask (FR-ASK)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ASK-01 | `POST /api/answer` with `query`, `includeWeb`, `industrySectorId`, `regulation`. | P0 |
| FR-ASK-02 | Regulation-aware prompts and Tavily/DuckDuckGo context. | P0 |
| FR-ASK-03 | Citation chips `[S#]` → Browse or external URLs. | P0 |
| FR-ASK-04 | Relevant provisions panel with regulation labels. | P0 |
| FR-ASK-05 | BYOK: `apiKeys` in body; `POST /api/validate-api-keys`. | P1 |
| FR-ASK-06 | Sector combobox from `/api/industry-sectors` (shared). | P1 |
| FR-ASK-07 | Legacy `POST /api/ask` simple search (regulation-scoped). | P2 |

### 2.4 Credible sources (FR-SRC)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SRC-01 | `GET /api/meta?regulation=` returns `sources[]`. | P0 |
| FR-SRC-02 | GDPR: EDPB, EDPS, Commission, ICO, GDPR-Info, EUR-Lex, etc. | P0 |
| FR-SRC-03 | AI Act: AI Act Law, EUR-Lex 2024/1689, Commission AI framework. | P0 |

### 2.5 News (FR-NEWS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NEWS-01 | `GET /api/news` returns feeds, items, `topicTaxonomy`. | P0 |
| FR-NEWS-02 | `POST /api/news/refresh` crawls and persists JSON. | P0 |
| FR-NEWS-03 | Source/topic filters; By source / All views. | P1 |
| FR-NEWS-04 | Attachments summary hides button when count=0. | P1 |
| FR-NEWS-05 | When `ai-act` or `data-act` selected: filter + banner for regulation-relevant items. | P1 |
| FR-NEWS-06 | Topic taxonomy includes **EU Artificial Intelligence Act** group. | P2 |

### 2.6 ETL & refresh (FR-ETL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ETL-01 | GDPR: `scraper.js` → `gdpr-content.json`. | P0 |
| FR-ETL-02 | AI Act: `ai-act-scraper.js` → `ai-act-content.json`. | P0 |
| FR-ETL-02b | Data Act: `data-act-scraper.js` → `data-act-content.json`. | P0 |
| FR-ETL-03 | `normalizeCorpus` on GDPR refresh/write paths. | P0 |
| FR-ETL-04 | Daily cron refreshes **all** regulations on Vercel. | P1 |
| FR-ETL-05 | `npm run refresh-ai-act` CLI for AI Act only. | P1 |
| FR-ETL-05b | `npm run refresh-data-act` CLI for Data Act only. | P1 |

---

## 3. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Browse API < 500 ms p95 on warm local server. |
| NFR-02 | Availability | `GET /health` for probes. |
| NFR-03 | Security | No secrets in repo; BYOK client-only storage. |
| NFR-04 | Accessibility | Tabs, filters, doc nav with ARIA roles. |
| NFR-05 | Maintainability | New regulation = registry + scraper + JSON + profile. |
| NFR-06 | Deploy | Vercel serverless with bundled `data/` seed. |

---

## 4. Data model (summary)

| File | Regulation | Contents |
|------|------------|----------|
| `gdpr-content.json` | GDPR | articles, recitals, searchIndex, meta |
| `ai-act-content.json` | AI Act | articles, recitals, searchIndex, meta |
| `data-act-content.json` | Data Act | articles, recitals, searchIndex, meta |
| `gdpr-structure.json` / `ai-act-structure.json` / `data-act-structure.json` | All | chapters, credible sources fallback |
| `gdpr-news.json` | News (shared) | newsFeeds, items |
| `chapter-summaries.json` / `chapter-summaries-ai-act.json` | Per reg | Chapter blurbs |

See [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) and [VARIABLES.md](VARIABLES.md).

---

## 5. Success criteria

| Metric | Target (pilot) |
|--------|----------------|
| Corpus completeness | GDPR ≥99 art / ≥173 rec; AI Act ≥113 art / ≥180 rec after refresh |
| Ask citation rate | ≥90% of LLM answers include `[S#]` on test suite |
| Regulation switch | Zero cross-regulation wrong corpus on 20 manual tests |
| News refresh | Completes within `NEWS_REFRESH_TIMEOUT_MS` without crash |

See [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md).

---

## 6. Out of scope (v2.0)

- Additional EU regulations without new ETL + registry entry.  
- CNIL and other national DPAs in News (except ICO UK).  
- Real-time collaborative annotations.  
- Mobile native apps.

---

## 7. Traceability

Requirements map to [USER_STORIES.md](USER_STORIES.md) and [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## 8. References

- [README.md](../README.md)  
- [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md)  
- [TECH_GUIDELINES.md](TECH_GUIDELINES.md)  
- [GUARDRAILS.md](GUARDRAILS.md)
