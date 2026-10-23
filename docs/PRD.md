# Product Requirements Document (PRD)  
## Regulation Q&A Platform

**Version:** 3.2  
**Last updated:** 2026-10-23  
**Audit date:** 2026-10-23  
**Aligned with:** Product documentation standard **v3.2** · `package.json` **1.3.0** · thirteen instruments (EU + Indonesia + United States + International) · `SEED_FILES` = 41 · `npm test` 58 pass / 24 suites

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

**United States (in-force analogues — not federal copies)**

7. **California Consumer Privacy Act / CPRA** (Cal. Civ. Code Title 1.81.5) — `us-ccpa`  
8. **OPEN Government Data Act**, Pub. L. 115-435 Title II — `us-open-data` (**not** the 2014 DATA Act)  
9. **Colorado ADMT Act**, SB 26-189 / C.R.S. 6-1-1701 et seq. — `us-admt`

**International (voluntary — not laws)**

10. **ISO/IEC 27701:2025** Privacy information management systems — `iso-27701` (GDPR analogue PIMS)  
11. **ISO/IEC 19941:2017** Cloud computing interoperability and portability — `iso-19941` (Data Act analogue)  
12. **ISO/IEC 23894:2023** AI risk-management guidance — `iso-23894` (AI Act analogue; related ISO/IEC 42001 noted only)  
13. **SOC 2** AICPA Trust Services Criteria (2017 / 2022 Points of Focus) — `soc2`

Users optionally filter by **region**, then select the active instrument. The product provides:

| Capability | Description |
|------------|-------------|
| **Browse** | Chapters/articles (pasal, sections) and recitals/considering/values/purpose notes; GDPR topic filters; reader (**Page \| Full**); PDF; doc navigation. |
| **Ask** | `POST /api/answer` — BM25 + optional web + Groq/Tavily/extractive; `[S#]` citations; optional ISIC sector; BYOK; regulation-scoped prompts. |
| **Credible sources** | Regulation-scoped `meta.sources` (no cross-instrument GDPR fallback). |
| **News** | Shared crawl (EU + Indonesian + US + ISO/AICPA official hubs); **client relevance filters** per instrument. |
| **Shell** | Region (All / EU / Indonesia / USA / INTL) + Regulation picker; Tools menu; credits bar. |

**Target users:** Legal, compliance, privacy, AI governance, data-economy, and Indonesian PDP / Satu Data / AI ethics professionals; California privacy counsel, Colorado ADMT / AI governance leads, and federal open-data stewards; ISO/IEC 27701 PIMS leads, cloud interoperability architects, AI risk managers, and SOC 2 auditors; DPOs; consultants; platform engineers.

### 1.2 Goals

| ID | Goal |
|----|------|
| G1 | Single interface for **thirteen instruments** across **four jurisdictions** (EU, Indonesia, United States, International) with consistent UX. |
| G2 | **Traceable** answers: corpus excerpts + citation ids. |
| G3 | **Official alignment** — EUR-Lex + readable EU mirrors; peraturan.go.id / JDIH for Indonesia; CPPA / leginfo, Colorado General Assembly, and govinfo for the United States. |
| G4 | **Credible news** from EU/UK supervisory sources, Indonesian state/media hubs, **and** U.S. official hubs (FTC, CPPA/CalPrivacy, California OAG, Colorado AG, data.gov / GSA / FDS). |
| G5 | **Operable** deployment (local + Vercel) with documented env and cron refresh for all thirteen. |
| G6 | Honest **soft-law** framing for SE AI Ethics. |
| G7 | Honest U.S. mapping: no federal GDPR / AI Act; OPEN Government Data Act, not the 2014 DATA Act. |
| G8 | Honest International mapping: ISO/SOC 2 are voluntary; educational overlays only; no paywalled ISO/AICPA clause text. |

### 1.3 Non-goals

- Legal advice or binding compliance opinions.  
- Full dedicated news wires per instrument (client-side filter only today).  
- Multi-tenant SaaS, SSO, or audit trails (future).  
- Automated conformity assessment, DPIA generation, or certification.  
- Equivalence claims between EU, Indonesian, United States, and International instruments (marketing analogues only).  
- Implying a federal U.S. GDPR or AI Act exists (it does not), or treating the 2014 DATA Act (Digital Accountability and Transparency Act) as the EU Data Act analogue.  
- Other U.S. state privacy or AI statutes (for example Virginia, Texas, Colorado SB 24-205) beyond the three bundled instruments.  
- Reproducing paid ISO clause text or AICPA Points of Focus tables, or treating ISO / SOC 2 certification or attestation as legal compliance; ISO/IEC 42001 as a shipped instrument.

---

## 2. Functional requirements

### 2.0 App shell and responsive chrome (FR-SHELL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SHELL-01 | Header exposes **region** filter (**All · EU · Indonesia · USA · INTL**, ids `all` / `eu` / `id` / `us` / `intl`; persisted `gdpr-qa-region-v1`; client-only; INTL defaults the regulation to `iso-27701`) and **regulation** select from `GET /api/regulations`. | P0 |
| FR-SHELL-02 | Regulation selection persists (`gdpr-qa-regulation-v1`). | P0 |
| FR-SHELL-03 | On viewports **≤899px**, **Tools** toggles toolbar (freshness, API keys, refresh). | P0 |
| FR-SHELL-04 | `#appChrome` sticky on ≤899px; chrome resize keeps tab thumb aligned. | P1 |
| FR-SHELL-05 | Toolbar live subtitles for freshness and API keys; no duplicate always-visible status strip. | P1 |
| FR-SHELL-06 | Tab bar: Browse / Ask / Sources / News with segmented active thumb. | P1 |
| FR-SHELL-07 | Logo resets Browse to welcome placeholder (`goToHome`). | P1 |
| FR-SHELL-08 | App credits bar with maintainer links. | P2 |

### 2.1 Regulation selection (FR-REG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REG-01 | Dropdown lists thirteen instruments in `REGULATION_DISPLAY_ORDER`. | P0 |
| FR-REG-02 | Region filter narrows visible instruments without clearing persistence incorrectly. | P0 |
| FR-REG-03 | Browse, Ask, Sources, and API calls use active `regulation` id. | P0 |
| FR-REG-04 | **Refresh sources** runs ETL for the **selected** regulation only. | P0 |
| FR-REG-05 | UI chrome updates via `regulation-profiles.js` + `regulation-profiles-id.js` + `regulation-profiles-us.js` + `regulation-profiles-iso.js` and sync helpers. | P0 |
| FR-REG-06 | Citation sidebar updates via `citationsUi` / `syncCitationSidebarChrome`. | P0 |
| FR-REG-07 | Registry exposes `jurisdiction`, `jurisdictionLabel`, `hasArticleTopics`, `hasSuitableRecitals`. | P0 |

### 2.2 Browse (FR-BRW)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BRW-01 | Recitals / considering / values list; open full text in reader. | P0 |
| FR-BRW-02 | Chapters/articles (pasal) grouped list with filters. | P0 |
| FR-BRW-03 | GDPR: category + sub-category filters (`hasArticleTopics`). | P0 |
| FR-BRW-04 | Non-GDPR: hide topic filters; clear hidden GDPR filters on switch. | P0 |
| FR-BRW-05 | Prev/Next + jump search (Enter / suggestion pick); **Page \| Full** reader mode; PDF export follows active mode. | P1 |
| FR-BRW-05b | Deep-link hashes `#/{reg}/article\|recital/{n}` restore on first paint; regulation switch clears stale reader / Full cache. | P0 |
| FR-BRW-05c | Browse segment opens must not bounce back to the regulation home grid (hash/`hashchange` race). | P0 |
| FR-BRW-06 | GDPR: suitable recitals; others: in-text related only. | P1 |
| FR-BRW-07 | Chapter intros from `/api/chapter-summaries` per regulation (no GDPR blurbs for ID, US, or International). | P1 |
| FR-BRW-08 | Article/pasal display titles: GDPR may use canonical map; all others use full corpus `title`. | P0 |
| FR-BRW-09 | Reader body numbered/lettered layout per formatting guardrails. | P1 |
| FR-BRW-10 | Browse welcome: themed cards for all thirteen in four region rows; desktop grid; mobile solo. | P1 |
| FR-BRW-10b | US instruments label provisions **Section** / **Purpose note** (`CCPA § N`, `ADMT § N`, `OPEN Data § N`); never *Article* / *Recital*. | P0 |
| FR-BRW-10c | International instruments label provisions **Clause** / **Criterion** / **Purpose note** (`ISO 27701 clause N`, `ISO 19941 clause N`, `ISO 23894 clause N`, `SOC 2 criterion N`); never *Article* / *Recital*; no GDPR topic filters. | P0 |
| FR-BRW-11 | Quick actions: Chapters first, Recitals second. | P1 |
| FR-BRW-12 | `loadChapters` ignores stale responses on mid-flight regulation change. | P1 |
| FR-BRW-13 | Mobile collapsible Filters + empty-state differentiation. | P1 |
| FR-BRW-14 | Chapters/Recitals (and jurisdiction analogues) headers show a comprehensive `browseUi.policySummary` plus theme chips and a short how-to hint; summary panel is full-width (no 72ch content cap). | P1 |

### 2.3 Ask (FR-ASK)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ASK-01 | `POST /api/answer` with `query`, `includeWeb`, `industrySectorId`, `regulation`, optional `apiKeys`. | P0 |
| FR-ASK-02 | Regulation-aware prompts and web/Tavily context. | P0 |
| FR-ASK-03 | Soft-law framing when `regulation === id-ai-ethics`. | P0 |
| FR-ASK-03b | **Jurisdiction** framing for `us-*`: no federal GDPR / AI Act; the 2014 DATA Act is not the instrument; BM25 layperson expansion uses CCPA / ADMT / OPEN Data vocabulary, not GDPR controller / processor. | P0 |
| FR-ASK-03c | **Legal-force** framing for `iso-*` / `soc2`: voluntary standard / attestation, not a law; no invented paid clause text; BM25 layperson expansion uses PIMS, cloud portability, AI risk-management, or Trust Services Criteria vocabulary, not GDPR controller / processor. | P0 |
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
| FR-SRC-05 | United States instruments: CPPA / Colorado session laws / govinfo sources — **never** GDPR-Info or 2014 DATA Act fallback. | P0 |
| FR-SRC-06 | International instruments: ISO.org / JTC 1 / AICPA & CIMA sources — **never** GDPR-Info / EUR-Lex fallback. | P0 |

### 2.5 News (FR-NEWS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NEWS-01 | Shared crawl into `gdpr-news.json`; `GET /api/news`, `POST /api/news/refresh`. | P0 |
| FR-NEWS-02 | EU sources: EDPB, EDPS, ICO, Commission, CoE (policy BG-07). | P0 |
| FR-NEWS-03 | Indonesian sources: Antara, Setkab, Komdigi (best-effort), Satu Data portal. | P0 |
| FR-NEWS-03b | United States sources: FTC, CPPA/CalPrivacy, California OAG, Colorado AG (ADAI/ADMT), data.gov / Federal Data Strategy / GSA. | P0 |
| FR-NEWS-03c | International sources: ISO news, ISO Insights, AICPA SOC for Service Organizations (catalogue seed + best-effort live search; `scripts/seed-iso-soc-news.js`). | P0 |
| FR-NEWS-04 | Client relevance filters for **all thirteen** instruments including `gdpr`: regional credible-source pool, primary-hub pass-through, then instrument regex/category; hero metrics reflect the scoped set. | P0 |
| FR-NEWS-04b | News sidebar lists all credible feeds for the regulation’s jurisdiction; headlines never leave that regional pool (no ID/US/INTL leakage into EU AI Act / Data Act, and vice versa). | P0 |
| FR-NEWS-05 | Topic taxonomy + source/topic/search filters; dedupe URL + semantic. | P1 |
| FR-NEWS-06 | Attachments APIs; hide Attachments when count is 0. | P2 |
| FR-NEWS-07 | Empty Indo- and USA-filtered states guide users to Refresh news. | P1 |

### 2.5b United States jurisdiction (FR-US)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-US-01 | Registry contains `us-ccpa` (33 sections / 5 purpose notes / 7 chapters), `us-admt` (14 / 5 / 7), `us-open-data` (10 / 4 / 5) with `jurisdiction: 'us'` and `jurisdictionLabel: 'United States'`; `US_REGULATION_IDS` exported. | P0 |
| FR-US-02 | `GET /api/meta` for `us-*` never returns GDPR-Info / EUR-Lex GDPR sources (`resolveCredibleSourcesForRegulation`). | P0 |
| FR-US-03 | `us-open-data` is Title II of Pub. L. 115-435 (OPEN Government Data Act) and its `fullName` must not name the Digital Accountability and Transparency Act. | P0 |
| FR-US-04 | USA News excludes EU/ICO feeds; `unitedStatesNewsItemIsOnScope` gates FTC / OAG / GSA behind topic keywords and trusts CPPA / data.gov URLs. | P0 |
| FR-US-05 | Default News feeds use live URLs (Colorado press room, data.gov home, California OAG, GSA, Federal Data Strategy), not `data.gov/meta/`. | P1 |
| FR-US-06 | Per-instrument theme accents: `us-ccpa` `#1d4ed8`, `us-open-data` `#0f766e`, `us-admt` `#6d28d9`. | P2 |
| FR-US-07 | `SOURCE_SUMMARIES` covers CPPA, FTC, California OAG, Colorado AG, govinfo, data.gov, GSA, Federal Data Strategy. | P1 |
| FR-US-08 | `test/us-parity.test.js` passes (registry, corpora/sources, news helpers, persisted US headlines, Ask retrieval, UI blurbs). | P0 |

### 2.5c International jurisdiction (FR-INTL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INTL-01 | Registry contains `iso-27701` (14 clauses / 5 purpose notes / 4 chapters), `iso-19941` (11 / 4 / 4), `iso-23894` (12 / 5 / 5), `soc2` (20 criteria / 6 / 5) with `jurisdiction: 'intl'`; `INTL_REGULATION_IDS` exported. | P0 |
| FR-INTL-02 | `GET /api/meta` for `iso-*` / `soc2` never returns GDPR-Info / EUR-Lex GDPR sources. | P0 |
| FR-INTL-03 | Corpora are educational overlays from ISO.org catalogues and AICPA TSC **names** only — no paid ISO or Points of Focus body text. | P0 |
| FR-INTL-04 | Copy states instruments are voluntary / attestation, not laws; 27701:2025 standalone (2019 withdrawn); 19941-1 forthcoming; 23894 ≠ 42001 ≠ EU AI Act. | P0 |
| FR-INTL-05 | International News uses ISO.org and AICPA feeds; client filters per instrument. | P0 |
| FR-INTL-06 | Theme accents: `iso-27701` `#0f766e`, `iso-19941` `#0369a1`, `iso-23894` `#5b21b6`, `soc2` `#b45309`. | P2 |
| FR-INTL-07 | `test/iso-parity.test.js` passes. | P0 |
| FR-INTL-08 | Duplicate user mention of ISO 23894 is one instrument; ISO/IEC 42001 is a related note only, not a separately shipped corpus. | P1 |
| FR-INTL-09 | Region **INTL** thumb is slate (`#64748b` → `#334155` at `165deg`); chip reads **International**; default regulation for `intl` is `iso-27701`. | P1 |
| FR-INTL-10 | ETL env derived from `etlEnvPrefix` (`ISO_27701`, `ISO_19941`, `ISO_23894`, `SOC2`): `MIN_*_ARTICLES` / `MIN_*_RECITALS` (14/5, 11/4, 12/5, 20/6) and `*_FORCE_CORPUS_WRITE`; ETL never writes paywalled body text. | P1 |
| FR-INTL-11 | UI profiles live in `public/regulation-profiles-iso.js` and extend `REGULATION_PROFILES`; `jurisdiction: 'intl'` with Clause / Criterion / Purpose-note headings. | P1 |

### 2.6 ETL & refresh (FR-ETL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ETL-01 | GDPR / AI Act / Data Act scrapers as today. | P0 |
| FR-ETL-02 | `id-law-scraper.js` for `id-pdp`, `id-satu-data`, `id-ai-ethics`. | P0 |
| FR-ETL-02b | `us-law-scraper.js` for `us-ccpa`, `us-admt`, `us-open-data` (bundled official extracts; source reachability ping only). | P0 |
| FR-ETL-02c | npm scripts `refresh-us-ccpa`, `refresh-us-admt`, `refresh-us-open-data`; `scripts/build-us-corpora.py` builds corpora offline. | P1 |
| FR-ETL-02d | `iso-soc-scraper.js` ping-only ETL for `iso-27701`, `iso-19941`, `iso-23894`, `soc2`; `scripts/build-iso-soc-corpora.js` builds educational overlays. | P0 |
| FR-ETL-03 | Every write/read path runs formatting guardrails. | P0 |
| FR-ETL-04 | Daily cron (local + Vercel) refreshes **all thirteen**. | P0 |
| FR-ETL-05 | Vercel cron authenticated with `CRON_SECRET`. | P0 |
| FR-ETL-06 | `SEED_FILES` includes EU + ID + US + International corpora, structures, chapter summaries, news, suitable recitals (**41** files). | P0 |
| FR-ETL-07 | Force-write and min-count env vars per instrument (see VARIABLES): `MIN_ID_*`, `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, `MIN_US_OPEN_DATA_*`, `US_*_FORCE_CORPUS_WRITE`, `MIN_ISO_27701_*`, `MIN_ISO_19941_*`, `MIN_ISO_23894_*`, `MIN_SOC2_*`, `ISO_*_FORCE_CORPUS_WRITE`, `SOC2_FORCE_CORPUS_WRITE`. | P1 |
| FR-ETL-08 | `vercel.json` `includeFiles` for `api/index.js` and the cron function lists `iso-soc-scraper.js` (with the other scrapers) so Vercel refreshes work for International instruments. | P0 |

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
| NFR-07 | `npm test` covers Indo, US, and International registry/corpus/news parity, browse routes, and reader view (**58 pass / 24 suites** at the 2026-10-23 1.3.0 audit). |
| NFR-08 | Documentation standard **v3.2** kept in lockstep with releases across every satellite document (including Unreleased News/Browse UX). |
| NFR-09 | Reader view mode persists as `gdprQaReaderViewMode` (`page` \| `full`); no Go button. |

---

## 4. Data model (summary)

| Entity | Storage | Notes |
|--------|---------|-------|
| Regulation registry | `lib/regulations.js` | Thirteen ids; jurisdictions `eu` / `id` / `us` / `intl`; flags |
| Corpus | `data/*-content.json` | articles/pasal, recitals, searchIndex |
| Structure | `data/*-structure.json` | chapters, sources fallback |
| News | `data/gdpr-news.json` | Shared feeds + items |
| Chapter summaries | `data/chapter-summaries*.json` | Per instrument |
| Suitable recitals | `data/article-suitable-recitals.json` | GDPR only |
| Client prefs | `localStorage` | regulation, region, reader view mode, BYOK |
| Vercel seed | `lib/paths.js` `SEED_FILES` | 41 files |

---

## 5. Success criteria

| Criterion | Measure |
|-----------|---------|
| Multi-instrument parity | All thirteen selectable; Browse/Ask/Sources scoped correctly |
| Citation quality | Ask answers include `[S#]` when sources exist |
| Corpus integrity | Guardrail validation passes after refresh |
| Indo news usability | Non-empty Indo-filtered news after successful refresh (best-effort sources) |
| US news usability | Non-empty USA-filtered news (CPPA/CalPrivacy, Colorado ADMT rulemaking, OPEN Data / FDS) from the persisted store; no EU leakage |
| US honesty | No US surface claims a federal GDPR / AI Act or equates the 2014 DATA Act with the EU Data Act |
| International honesty | No International surface presents ISO/IEC 27701 / 19941 / 23894 or SOC 2 as a law; no paid ISO / AICPA body text is shipped or scraped |
| Soft-law clarity | ID AI Ethics UI/Ask does not claim binding regulation force |
| Ops | Cron refreshes thirteen instruments; `/health` returns `ok` |
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
| EM-04 | Indo parity tests in `test/indo-parity.test.js`; US parity tests in `test/us-parity.test.js`; International parity tests in `test/iso-parity.test.js`. |

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
