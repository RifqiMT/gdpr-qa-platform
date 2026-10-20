# Product Requirements Document (PRD)  
## Regulation Q&A Platform

**Version:** 2.7  
**Last updated:** 2026-10-20  
**Aligned with:** Product documentation standard **v2.5** · `package.json` **1.2.6**

---

## 1. Product overview

### 1.1 Purpose

A web application for **browsing**, **searching**, and **asking questions** about:

**European Union**

1. **General Data Protection Regulation (EU) 2016/679** (GDPR) — `gdpr`  
2. **Artificial Intelligence Act (EU) 2024/1689** (EU AI Act) — `ai-act`  
3. **Data Act (EU) 2023/2854** (EU Data Act) — `data-act`  

**Indonesia**

4. **Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi** (UU PDP) — `id-pdp`  
5. **Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia** — `id-satu-data`  
6. **Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial** — `id-ai-ethics` (**soft law**)

Users optionally filter by **region**, then select the active instrument. The product provides:

| Capability | Description |
|------------|-------------|
| **Browse** | Chapters/articles (pasal) and recitals/considering/values; GDPR topic filters; reader; PDF; doc navigation. |
| **Ask** | `POST /api/answer` — BM25 + optional web + Groq/Tavily/extractive; `[S#]` citations; optional ISIC sector; BYOK; regulation-scoped prompts. |
| **Credible sources** | Regulation-scoped `meta.sources` (no cross-instrument GDPR fallback). |
| **News** | Shared crawl (EU + Indonesian hubs); **client relevance filters** per instrument. |
| **Shell** | Region + Regulation picker; Tools menu; credits bar. |

**Target users:** Legal, compliance, privacy, AI governance, data-economy, and Indonesian PDP / Satu Data / AI ethics professionals; DPOs; consultants; platform engineers.

### 1.2 Goals

| ID | Goal |
|----|------|
| G1 | Single interface for **six instruments** across **two jurisdictions** with consistent UX. |
| G2 | **Traceable** answers: corpus excerpts + citation ids. |
| G3 | **Official alignment** — EUR-Lex + readable EU mirrors; peraturan.go.id / JDIH for Indonesia. |
| G4 | **Credible news** from EU/UK supervisory sources **and** Indonesian state/media hubs. |
| G5 | **Operable** deployment (local + Vercel) with documented env and cron refresh for all six. |
| G6 | Honest **soft-law** framing for SE AI Ethics. |

### 1.3 Non-goals

- Legal advice or binding compliance opinions.  
- Full dedicated news wires per instrument (client-side filter only today).  
- Multi-tenant SaaS, SSO, or audit trails (future).  
- Automated conformity assessment, DPIA generation, or certification.  
- Equivalence claims between EU and Indonesian instruments (marketing analogues only).

---

## 2. Functional requirements

### 2.0 App shell and responsive chrome (FR-SHELL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SHELL-01 | Header exposes **region** filter (`all` / `eu` / `id`) and **regulation** select from `GET /api/regulations`. | P0 |
| FR-SHELL-02 | Regulation selection persists (`gdpr-qa-regulation-v1`). | P0 |
| FR-SHELL-03 | On viewports **≤899px**, **Tools** toggles toolbar (freshness, API keys, refresh). | P0 |
| FR-SHELL-04 | `#appChrome` sticky on ≤899px; reading pane respects `--app-chrome-height`. | P1 |
| FR-SHELL-05 | Toolbar live subtitles for freshness and API keys; no duplicate always-visible status strip. | P1 |
| FR-SHELL-06 | Tab bar: Browse / Ask / Sources / News with segmented active thumb. | P1 |
| FR-SHELL-07 | Logo resets Browse to welcome placeholder (`goToHome`). | P1 |
| FR-SHELL-08 | App credits bar with maintainer links. | P2 |

### 2.1 Regulation selection (FR-REG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REG-01 | Dropdown lists six instruments in `REGULATION_DISPLAY_ORDER`. | P0 |
| FR-REG-02 | Region filter narrows visible instruments without clearing persistence incorrectly. | P0 |
| FR-REG-03 | Browse, Ask, Sources, and API calls use active `regulation` id. | P0 |
| FR-REG-04 | **Refresh sources** runs ETL for the **selected** regulation only. | P0 |
| FR-REG-05 | UI chrome updates via `regulation-profiles.js` + `regulation-profiles-id.js` and sync helpers. | P0 |
| FR-REG-06 | Citation sidebar updates via `citationsUi` / `syncCitationSidebarChrome`. | P0 |
| FR-REG-07 | Registry exposes `jurisdiction`, `jurisdictionLabel`, `hasArticleTopics`, `hasSuitableRecitals`. | P0 |

### 2.2 Browse (FR-BRW)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BRW-01 | Recitals / considering / values list; open full text in reader. | P0 |
| FR-BRW-02 | Chapters/articles (pasal) grouped list with filters. | P0 |
| FR-BRW-03 | GDPR: category + sub-category filters (`hasArticleTopics`). | P0 |
| FR-BRW-04 | Non-GDPR: hide topic filters; clear hidden GDPR filters on switch. | P0 |
| FR-BRW-05 | Prev/Next/Go navigation; PDF export. | P1 |
| FR-BRW-06 | GDPR: suitable recitals; others: in-text related only. | P1 |
| FR-BRW-07 | Chapter intros from `/api/chapter-summaries` per regulation (no GDPR blurbs for ID). | P1 |
| FR-BRW-08 | Article/pasal display titles: GDPR may use canonical map; all others use full corpus `title`. | P0 |
| FR-BRW-09 | Reader body numbered/lettered layout per formatting guardrails. | P1 |
| FR-BRW-10 | Browse welcome: themed cards for all six; desktop grid; mobile solo. | P1 |
| FR-BRW-11 | Quick actions: Chapters first, Recitals second. | P1 |
| FR-BRW-12 | `loadChapters` ignores stale responses on mid-flight regulation change. | P1 |
| FR-BRW-13 | Mobile collapsible Filters + empty-state differentiation. | P1 |

### 2.3 Ask (FR-ASK)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ASK-01 | `POST /api/answer` with `query`, `includeWeb`, `industrySectorId`, `regulation`, optional `apiKeys`. | P0 |
| FR-ASK-02 | Regulation-aware prompts and web/Tavily context. | P0 |
| FR-ASK-03 | Soft-law framing when `regulation === id-ai-ethics`. | P0 |
| FR-ASK-04 | Citation chips `[S#]` → Browse or external URLs. | P0 |
| FR-ASK-05 | Relevant provisions panel with regulation labels. | P0 |
| FR-ASK-06 | BYOK via body `apiKeys` + `POST /api/validate-api-keys`. | P1 |
| FR-ASK-07 | Sector combobox from `/api/industry-sectors`. | P1 |
| FR-ASK-08 | No dependency on removed `/api/ask` or `/api/summarize`. | P0 |

### 2.4 Credible sources (FR-SRC)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SRC-01 | `GET /api/meta?regulation=` returns `sources[]`. | P0 |
| FR-SRC-02 | GDPR: EDPB, EDPS, Commission, ICO, GDPR-Info, EUR-Lex, etc. | P0 |
| FR-SRC-03 | AI Act / Data Act: instrument-specific publishers + EUR-Lex. | P0 |
| FR-SRC-04 | Indonesian instruments: JDIH / peraturan.go.id sources from structure/content — **never** GDPR-Info fallback. | P0 |

### 2.5 News (FR-NEWS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NEWS-01 | Shared crawl into `gdpr-news.json`; `GET /api/news`, `POST /api/news/refresh`. | P0 |
| FR-NEWS-02 | EU sources: EDPB, EDPS, ICO, Commission, CoE (policy BG-07). | P0 |
| FR-NEWS-03 | Indonesian sources: Antara, Setkab, Komdigi (best-effort), Satu Data portal. | P0 |
| FR-NEWS-04 | Client relevance filters for `ai-act`, `data-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`. | P0 |
| FR-NEWS-05 | Topic taxonomy + source/topic/search filters; dedupe URL + semantic. | P1 |
| FR-NEWS-06 | Attachments APIs; hide Attachments when count is 0. | P2 |
| FR-NEWS-07 | Empty Indo-filtered states guide users to Refresh news. | P1 |

### 2.6 ETL & refresh (FR-ETL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ETL-01 | GDPR / AI Act / Data Act scrapers as today. | P0 |
| FR-ETL-02 | `id-law-scraper.js` for `id-pdp`, `id-satu-data`, `id-ai-ethics`. | P0 |
| FR-ETL-03 | Every write/read path runs formatting guardrails. | P0 |
| FR-ETL-04 | Daily cron (local + Vercel) refreshes **all six**. | P0 |
| FR-ETL-05 | Vercel cron authenticated with `CRON_SECRET`. | P0 |
| FR-ETL-06 | `SEED_FILES` includes EU + ID corpora, structures, chapter summaries, news, suitable recitals. | P0 |
| FR-ETL-07 | Force-write and min-count env vars per instrument (see VARIABLES). | P1 |

---

## 3. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Node ≥ 18; no frontend bundler required. |
| NFR-02 | Extractive Ask fallback when LLM keys absent. |
| NFR-03 | No end-user accounts; operators may front with network controls. |
| NFR-04 | Secrets never committed; BYOK stays in browser storage. |
| NFR-05 | Responsive layout ≤640 / ≤899 / ≥900 / widescreen. |
| NFR-06 | Accessible tab roles and labeled controls. |
| NFR-07 | `npm test` covers Indo registry/corpus/news parity. |
| NFR-08 | Documentation standard v2.5 kept in lockstep with releases. |

---

## 4. Data model (summary)

| Entity | Storage | Notes |
|--------|---------|-------|
| Regulation registry | `lib/regulations.js` | Six ids; jurisdictions; flags |
| Corpus | `data/*-content.json` | articles/pasal, recitals, searchIndex |
| Structure | `data/*-structure.json` | chapters, sources fallback |
| News | `data/gdpr-news.json` | Shared feeds + items |
| Chapter summaries | `data/chapter-summaries*.json` | Per instrument |
| Suitable recitals | `data/article-suitable-recitals.json` | GDPR only |
| Client prefs | `localStorage` | regulation + BYOK |
| Vercel seed | `lib/paths.js` `SEED_FILES` | 20 files |

---

## 5. Success criteria

| Criterion | Measure |
|-----------|---------|
| Multi-instrument parity | All six selectable; Browse/Ask/Sources scoped correctly |
| Citation quality | Ask answers include `[S#]` when sources exist |
| Corpus integrity | Guardrail validation passes after refresh |
| Indo news usability | Non-empty Indo-filtered news after successful refresh (best-effort sources) |
| Soft-law clarity | ID AI Ethics UI/Ask does not claim binding regulation force |
| Ops | Cron refreshes six instruments; `/health` returns `ok` |
| Docs | README/PRD/VARIABLES/API contracts match live routes |

---

## 6. Out of scope (current release)

- User authentication, RBAC, multi-tenant tenancy.  
- Product analytics SDK (metrics remain definitional in METRICS_AND_OKRS).  
- Automated legal advice or certification workflows.  
- Restoring removed 1.2.6 summarize/ask/categories endpoints.

---

## 7. Engineering maintainability (non-functional)

| ID | Requirement |
|----|-------------|
| EM-01 | Public `module.exports` documented in SOURCE_CODE_INVENTORY. |
| EM-02 | Dead routes/providers removed from docs when removed from code. |
| EM-03 | Feature flags live on registry entries (`hasArticleTopics`, `hasSuitableRecitals`). |
| EM-04 | Indo parity tests in `test/indo-parity.test.js`. |

---

## 8. Traceability

Requirements in this PRD map to business rules, user stories, code, and verification in [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## 9. References

- [../README.md](../README.md)  
- [USER_STORIES.md](USER_STORIES.md)  
- [USER_PERSONAS.md](USER_PERSONAS.md)  
- [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)  
- [../CHANGELOG.md](../CHANGELOG.md)
