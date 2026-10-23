# Regulation Q&A Platform

**Product documentation · Multi-jurisdiction regulatory browse and Ask**  
**European Union:** GDPR (EU 2016/679), EU AI Act (EU 2024/1689), EU Data Act (EU 2023/2854)  
**Indonesia:** UU PDP (UU 27/2022), Satu Data Indonesia (Perpres 39/2019), AI Ethics (SE Menkominfo 9/2023)  
**United States (analogues, not federal copies):** CCPA/CPRA (Cal. Civ. Code Title 1.81.5), Colorado ADMT Act (SB 26-189), OPEN Government Data Act (Pub. L. 115-435 Title II)  
**International (voluntary standards, not laws):** ISO/IEC 27701:2025 (PIMS), ISO/IEC 19941:2017 (cloud interoperability/portability), ISO/IEC 23894:2023 (AI risk management), AICPA SOC 2 (Trust Services Criteria)

| Version | Node | Description |
|---------|------|-------------|
| **1.3.0** | ≥ 18 | **Thirteen instruments** across **EU**, **Indonesia**, the **United States**, and **International** standards. Region + Regulation picker (All / EU / Indonesia / USA / INTL); Browse hub with per-instrument `policySummary`; Ask via BM25 + Groq/Tavily with `[S#]` citations; BYOK; News (EU + Indonesian + US + ISO/AICPA official hubs) with **relevance filters for every instrument including GDPR** (regional feeds + primary hubs); Credible sources (ISO.org / AICPA — never GDPR-Info on `iso-*` / `soc2`); ETL (`id-law-scraper.js`, `us-law-scraper.js`, `iso-soc-scraper.js`); reader **Page \| Full**; PDF export follows mode; deep-link hashes; formatting guardrails; Vercel cron for all thirteen; `npm test` (Indo + US + ISO/SOC2 parity + browse routes + reader view). **Docs standard v3.2.** **Last doc audit:** 2026-10-23. |

---

## Table of contents

1. [Product overview](#1-product-overview)  
2. [Product benefits](#2-product-benefits)  
3. [Features](#3-features)  
4. [Logic and data flow](#4-logic-and-data-flow)  
5. [Business guidelines](#5-business-guidelines)  
6. [Tech guidelines](#6-tech-guidelines)  
7. [Tech stack](#7-tech-stack)  
8. [Project structure](#8-project-structure)  
9. [API reference](#9-api-reference-summary)  
10. [Configuration](#10-configuration)  
11. [Quick start](#11-quick-start)  
12. [License and disclaimer](#12-license-and-disclaimer)  

**Documentation index:** [PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md) (**v3.2**) · [docs/README.md](docs/README.md) · [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) · [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) · [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) · [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md).

**Deep dives:** [docs/VARIABLES.md](docs/VARIABLES.md) · [docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md) · [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) · [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) · [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) · [docs/GLOSSARY.md](docs/GLOSSARY.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md) · [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/SOURCE_CODE_INVENTORY.md](docs/SOURCE_CODE_INVENTORY.md) · [CHANGELOG.md](CHANGELOG.md).

**Source refresh & reader formatting:** [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md).

---

## 1. Product overview

The **Regulation Q&A Platform** is a web application for **browsing** and **asking questions** about selected EU, Indonesian, United States, and international instruments using **local corpora**, **official links**, and **grounded LLM synthesis**. Users optionally filter by **region** (All / European Union / Indonesia / United States / International), then select an instrument; Browse, Ask, and Credible sources follow that selection. **Ask** retrieves corpus excerpts (BM25), optionally fetches **web snippets**, and synthesizes answers with **Groq** (primary) or **Tavily** (fallback), with citations **`[S1]`, `[S2]`, …**. Optional **industry / sector** (ISIC) framing applies. **News** aggregates supervisory and policy headlines with **client-side relevance filters** per instrument. There is **no end-user authentication**. This product is **not legal advice**. U.S. instruments are **in-force analogues**, not federal copies of the GDPR, AI Act, or Data Act. International instruments are **voluntary standards / attestation criteria**, not laws; ISO and AICPA full text is copyrighted and is not reproduced here.

| Aspect | Description |
|--------|-------------|
| **Purpose** | Reference and Q&A over thirteen instruments with credible official text (or public catalogue overlays for ISO/SOC 2); curated news; traceable citations. |
| **Users** | Legal, compliance, privacy, AI governance, data-economy, and Indonesian PDP / Satu Data / AI ethics professionals; DPOs; ISO/SOC 2 implementers; consultants; operators. |
| **EU instruments** | **GDPR** — 173 recitals, 99 articles ([gdpr-info.eu](https://gdpr-info.eu/), EUR-Lex 2016/679). **EU AI Act** — 180 / 113 ([ai-act-law.eu](https://ai-act-law.eu/), EUR-Lex 2024/1689). **EU Data Act** — 119 / 50 ([data-act-law.eu](https://data-act-law.eu/), EUR-Lex 2023/2854). |
| **Indonesian instruments** | **UU PDP** — 76 pasal, 4 considering (peraturan.go.id / JDIH Komdigi). **Satu Data** — ~44 pasal (Perpres 39/2019). **AI Ethics** — soft-law SE Menkominfo 9/2023 (7 sections, 9 values). |
| **United States analogues** | **CCPA/CPRA** — Cal. Civ. Code §§ 1798.100–1798.199.95 (CPPA Jan 2025 compilation / leginfo). **Colorado ADMT** — SB 26-189, 2026 Sess. Laws ch. 131; C.R.S. 6-1-1701 et seq. (duties generally 1 Jan 2027). **OPEN Government Data Act** — Title II of Pub. L. 115-435 (govinfo / data.gov). **Not** the 2014 DATA Act. |
| **International analogues** | **ISO/IEC 27701:2025** — standalone PIMS (ISO.org catalogue; 2019 withdrawn). **ISO/IEC 19941:2017** — cloud interoperability/portability (replacement ISO/IEC 19941-1 forthcoming ~Nov 2026). **ISO/IEC 23894:2023** — AI risk-management guidance (ISO 31000 overlay; related ISO/IEC 42001 AIMS not shipped as a fifth instrument). **SOC 2** — AICPA 2017 Trust Services Criteria with 2022 Points of Focus. Educational overlays only — buy full text from ISO/AICPA. |
| **Deployment** | Node.js locally (port **3847**); **Vercel** serverless — [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md). |
| **News scope** | EU: EDPB, EDPS, ICO (UK), European Commission, Council of Europe, EU Digital Strategy. Indonesia: Antara, Setkab, Komdigi (best-effort), Satu Data / data.go.id. United States: FTC, CPPA/CalPrivacy, California OAG, Colorado AG (ADAI/ADMT hub), data.gov / Federal Data Strategy / GSA. International: ISO.org news/insights, AICPA SOC/TSC pages. |

### Instrument catalogue

| Id | Short name | Jurisdiction | Binding? | Theme accent |
|----|------------|--------------|----------|--------------|
| `gdpr` | GDPR | EU | Binding regulation | Teal `#0f766e` |
| `ai-act` | EU AI Act | EU | Binding regulation | Indigo `#4f46e5` |
| `data-act` | EU Data Act | EU | Binding regulation | Sky `#0369a1` |
| `id-pdp` | ID PDP Law | Indonesia | Binding statute | Red `#c8102e` |
| `id-satu-data` | ID Satu Data | Indonesia | Binding presidential regulation | Emerald `#047857` |
| `id-ai-ethics` | ID AI Ethics | Indonesia | **Soft law** (circular) | Amber `#b45309` |
| `us-ccpa` | US CCPA | United States (California) | Binding California statute | Blue `#1d4ed8` |
| `us-open-data` | US OPEN Data | United States (federal) | Binding federal statute (public-sector open data) | Teal `#0f766e` |
| `us-admt` | US CO ADMT | United States (Colorado) | Binding Colorado statute (duties generally 1 Jan 2027) | Violet `#6d28d9` |
| `iso-27701` | ISO 27701 | International | **Voluntary** PIMS standard (ISO/IEC 27701:2025) | Teal `#0f766e` |
| `iso-19941` | ISO 19941 | International | **Voluntary** cloud interoperability standard (ISO/IEC 19941:2017) | Sky `#0369a1` |
| `iso-23894` | ISO 23894 | International | **Voluntary** AI risk-management guidance (ISO/IEC 23894:2023) | Violet `#5b21b6` |
| `soc2` | SOC 2 | International | **Attestation** (AICPA Trust Services Criteria) — not a law | Amber `#b45309` |

### Knowledge sources (illustrative)

| Source | Role |
|--------|------|
| GDPR-Info / AI Act Law / Data Act Law | Readable EU regulation layouts |
| EUR-Lex | Official EU publication |
| EDPB, EDPS, European Commission, ICO (UK), Council of Europe | Supervisory / policy (News + Sources for GDPR) |
| peraturan.go.id, JDIH Komdigi, JDIH Kemenko Infra | Indonesian official publication |
| Antara, Setkab, Komdigi, Satu Data portal | Indonesian news / policy hubs |
| CPPA, California leginfo, California OAG | CCPA/CPRA official text |
| Colorado General Assembly, Colorado AG | SB 26-189 / ADMT official text |
| govinfo, Congress.gov, data.gov, GSA | OPEN Government Data Act official text and Federal data catalogue |
| ISO.org catalogues (27701, 19941, 23894, 42001, 31000) | Official International Standard catalogue pages (not paid clause text) |
| AICPA TSC / SOC for Service Organizations | Official Trust Services Criteria download and SOC 2 landing pages |

---

## 2. Product benefits

- **Multi-jurisdiction workspace** — One UI for EU privacy/AI/data-economy law, Indonesian PDP / Satu Data / AI ethics guidance, and in-force U.S. analogues (CCPA/CPRA, Colorado ADMT, OPEN Government Data Act).  
- **Traceability** — Ask returns `sources` with stable ids (`S1`…) aligned with citation chips; Browse links to the active instrument’s official and readable publishers.  
- **Grounded synthesis** — LLM prompts require use of provided excerpts; repair passes and extractive fallback reduce empty or non-compliant formatting.  
- **Data refresh without duplication** — Deduplication by provision number; merge with existing JSON; search index deduped by id.  
- **Efficiency** — Browse by structure or ask in natural language; jump from Ask to full provision and back.  
- **Offline-capable content** — After refresh, corpora live under `data/` and can be searched without calling external sites on each request.  
- **Export** — Export the currently viewed article/pasal or recital as PDF via the browser print dialog (`window.print()` + `#pdfPrintMount`).  
- **Topic-based drill-down (GDPR)** — Category / Sub-category filters; cleared on switch away from GDPR so other instruments never show a false empty list.  
- **Document navigation** — Prev/Next, “Article N of M”, jump field (Enter or list pick; Page | Full aware).  
- **Sector-aware Ask** — Optional ISIC framing with verbatim sector phrase rules (illustrative, not sector-law replacement).  
- **Cross-references** — GDPR suitable recitals map; other instruments use in-text citation extraction.  
- **News from credible sources** — EU/UK + Indonesian hubs; URL + semantic dedupe; topic taxonomy; Refresh news.  
- **BYOK** — Browser-stored Groq/Tavily keys override server env per Ask request.  
- **Soft-law honesty** — ID AI Ethics prompts and copy state that the instrument is guidance, not a binding regulation.

---

## 3. Features

### 3.0 App shell and responsive chrome

- **`#appChrome`** — Sticky header + tab bar on viewports **≤899px**; resize repositions the segmented-tab thumb.  
- **Region + Regulation picker** — Unified chrome: region thumb (All / EU / Indonesia / USA / INTL), jurisdiction chip, custom regulation select; selection persists in **`localStorage`** (`gdpr-qa-regulation-v1`).  
- **Tools menu** — On **≤899px**: Source freshness, API keys (BYOK), Refresh sources.  
- **Tabs** — Segmented track with sliding active thumb: Browse / Ask / Sources / News.  
- **Credits bar** — Maintainer attribution (LinkedIn + website).

### 3.1 Browse

- **Welcome hub** — Desktop: regulation overview cards (EU, Indonesia, and United States sections in `REGULATION_DISPLAY_ORDER`); mobile: solo card for active regulation. Copy/themes from **`browseUi`** in `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js`.  
- **Segments** — Chapters & articles (first), Recitals / considering / values (second).  
- **Filters** — GDPR: Category + Sub-category + Chapter + Article. Others: Chapter + Article (topic filters hidden / cleared). Mobile: collapsible Filters.  
- **Detail reader** — Official titles via `getArticleDisplayTitle` / `getRecitalDisplayTitle`; numbered/lettered paragraphs per formatting guardrails; **Page \| Full** view mode (preference in `localStorage` `gdprQaReaderViewMode`); Prev/Next + jump search (**Enter** or pick from suggestions — no separate Go button); PDF export follows Page vs Full; citation sidebar (`citationsUi`); Full mode hides Related panels. Deep links `#/{reg}/article|recital/{n}` restore on boot; switching regulation clears a stale open document.  
- **Suitable recitals** — GDPR only (`hasSuitableRecitals`).

### 3.2 Ask

- **API** — UI calls **`POST /api/answer`** only (`query`, `includeWeb`, `industrySectorId`, `regulation`, optional `apiKeys`).  
- **Pipeline** — BM25 local context → optional web snippets → **Groq** → **Tavily** → extractive fallback.  
- **Citations** — `[S#]` chips; Relevant provisions aside; View in app / Back to question.  
- **Sector** — ISIC combobox from `/api/industry-sectors`.  
- **BYOK** — `localStorage` `gdpr-qa-byok-v1`; validate via `POST /api/validate-api-keys`.

### 3.3 Credible sources

- **`GET /api/meta?regulation=`** returns `meta.sources` for the active instrument (content → structure → **empty**; never GDPR-Info fallback for `id-*`, `us-*`, AI Act, or Data Act).

### 3.4 Content refresh (ETL)

| Regulation | Script | Output |
|------------|--------|--------|
| GDPR | `scraper.js` | `gdpr-content.json` |
| EU AI Act | `ai-act-scraper.js` | `ai-act-content.json` |
| EU Data Act | `data-act-scraper.js` | `data-act-content.json` |
| ID PDP / Satu Data / AI Ethics | `id-law-scraper.js <id>` | `id-*-content.json` |
| US CCPA / ADMT / OPEN Data | `us-law-scraper.js <id>` | `us-*-content.json` |
| ISO 27701 / 19941 / 23894 / SOC 2 | `iso-soc-scraper.js <id>` | `iso-*-content.json` / `soc2-content.json` |

- **`POST /api/refresh`** with `regulation` runs ETL for the selected instrument only.  
- Always runs **`document-formatting-guardrails.js`** normalize + validate.  
- Daily cron (local + Vercel) refreshes **all thirteen**.  
- CLI: `npm run refresh`, `refresh-ai-act`, `refresh-data-act`, `refresh-id-*`, `refresh-us-*`, `refresh-iso-27701`, `refresh-iso-19941`, `refresh-iso-23894`, `refresh-soc2`.

### 3.5 News

- Shared corpus `data/gdpr-news.json`; crawl via `news-crawler.js` (EU + Indonesian + US + **ISO.org / AICPA** hubs).  
- Client relevance filters for AI Act, Data Act, UU PDP, Satu Data, AI Ethics, CCPA, ADMT, OPEN Data, **ISO 27701 / 19941 / 23894 / SOC 2**.  
- Filters: source, topic, search; By source / All; attachments APIs; Refresh news.  
- Komdigi HTML may be WAF-blocked — Indo news is best-effort; empty states prompt Refresh news.

---

## 4. Logic and data flow

### 4.1 Data sources and storage

| File / module | Role |
|---------------|------|
| `*-structure.json` / `*-content.json` | Per-instrument structure + corpus + searchIndex |
| `lib/regulations.js` | Registry, jurisdictions, flags, paths |
| `lib/regulation-content.js` | loadContent, cache, ETL orchestration |
| `lib/paths.js` | `getDataDir()`, Vercel seed (**41** files in `SEED_FILES`) |
| `gdpr-news.json` | Shared news cache |
| `article-suitable-recitals.json` | GDPR editorial map |
| `chapter-summaries*.json` | Per-instrument chapter intros |
| `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js` / `regulation-profiles-iso.js` | UI copy |

### 4.2 ETL summary

- **GDPR:** GDPR-Info (default) or EUR-Lex; Map-by-number merge; guardrails; search index.  
- **AI / Data Act:** Readable law sites; shared body extraction helpers; guardrails.  
- **Indonesian laws:** `id-law-scraper.js` from official PDFs/HTML; min counts via `MIN_ID_*` env; force-write flags.  
- **United States analogues:** `us-law-scraper.js` from CPPA / Colorado GA / govinfo corpora; min counts via `MIN_US_*`; force-write flags.  
- **International voluntary:** `iso-soc-scraper.js` — copyright-safe overlays + official ping; `MIN_ISO_*` / `MIN_SOC2_*`; never scrape paywalled ISO/AICPA body text.  
- **All writes:** `normalizeCorpus` → `validateCorpusFormatting` → `buildSearchIndex` → disk.

### 4.3 Ask pipeline

1. Parse `regulation` → load corpus → BM25 top excerpts (US layperson/sector expansions for `us-*`).  
2. Optional DuckDuckGo + page excerpts (regulation-biased).  
3. Groq chat with grounded prompt (soft-law framing for `id-ai-ethics`; US Section/Purpose-note nouns + jurisdiction honesty).  
4. On failure → Tavily search+answer.  
5. On failure → extractive summary from excerpts.  
6. Return `{ answer, sources, llm, regulationId, note? }`.

### 4.4 Frontend flows

- **Browse:** welcome → chapters/recitals → filters → reader → sidebar / PDF.  
- **Ask:** submit → `/api/answer` → citation chips + relevant provisions.  
- **Sources / News:** meta + news APIs; client filters by regulation scope.

---

## 5. Business guidelines

- **Reference only — not legal advice.** Users must verify on official publishers.  
- **Credible sources only** for News and Sources tabs (see BUSINESS_GUIDELINES / GUARDRAILS).  
- **National EU DPAs** other than ICO (UK) are out of scope for News/Sources (**BG-07**).  
- **Soft law:** SE AI Ethics must not be presented as a binding regulation.  
- **Sector framing** is illustrative, not a substitute for sector-specific law.  
- Full policy: [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md).

---

## 6. Tech guidelines

- Node.js ≥ 18; no frontend build step.  
- Secrets only via `.env` / Vercel env / BYOK localStorage — never commit keys.  
- Writable `data/` (or `/tmp/gdpr-qa-data` on Vercel).  
- CORS enabled; open APIs (no end-user auth); protect cron with `CRON_SECRET`.  
- Do not bypass formatting guardrails on corpus write/read.  
- Ask uses Groq/Tavily only (removed multi-provider summarize path in 1.2.6).  
- Full standards: [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md).

---

## 7. Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥ 18 |
| Backend | Express 4.x, CORS, dotenv |
| Scheduling | node-cron (local); Vercel cron |
| Scraping / news | axios, cheerio |
| Frontend | HTML5, CSS3, vanilla JS |
| Fonts | DM Sans (UI + display) |
| PDF | Browser print / Save as PDF (`#pdfPrintMount`) |
| LLM | Groq (primary), Tavily (fallback), extractive |
| Data | JSON files in `data/` |
| Deploy | Vercel (`api/index.js`) |
| Tests | `node --test` (`test/indo-parity.test.js`) |

### Dependencies (`package.json`)

| Package | Purpose |
|---------|---------|
| express | HTTP server |
| cors | Cross-origin |
| axios | HTTP client |
| cheerio | HTML parsing |
| node-cron | Daily refresh |
| dotenv | Env loading |

---

## 8. Project structure

```
gdpr-qa-platform/
├── server.js                      # Express APIs, BM25, Ask, news, refresh, cron, static
├── lib/
│   ├── regulations.js             # Thirteen-instrument registry (eu/id/us/intl)
│   ├── regulation-content.js      # loadContent, ETL orchestration
│   └── paths.js                   # getDataDir(); SEED_FILES (41)
├── scraper.js / ai-act-scraper.js / data-act-scraper.js
├── id-law-scraper.js              # Indonesian instruments
├── us-law-scraper.js              # United States analogues (CCPA, ADMT, OPEN Data)
├── iso-soc-scraper.js             # International ISO/SOC 2 (copyright-safe ping ETL)
├── document-formatting-guardrails.js
├── gdpr-crossrefs.js
├── news-crawler.js / news-topics.js / news-article-attachments.js
├── api/
│   ├── index.js
│   └── cron/daily-regulation-refresh.js   # All thirteen + CRON_SECRET
├── public/
│   ├── index.html / styles.css / app.js
│   ├── regulation-profiles.js
│   ├── regulation-profiles-id.js
│   ├── regulation-profiles-us.js
│   ├── regulation-profiles-iso.js
│   ├── news-dedupe.js
│   ├── industry-sectors.json / industry-sector-tree.json
│   └── article-suitable-recitals.json
├── data/                          # EU + ID + US + ISO/SOC2 corpora, news, summaries
├── scripts/                       # Indo/US/ISO corpus builders, ISIC, suitable recitals
├── test/                          # indo/us/iso-parity, browse-routes, reader-view
├── package.json                   # version 1.3.0
├── vercel.json
├── .env.example
├── README.md / CHANGELOG.md / PRODUCT_DOCUMENTATION_STANDARD.md
└── docs/                          # Full professional documentation set
```

### Key source files

| File | Responsibility |
|------|----------------|
| `server.js` | REST surface, BM25, Ask, news, refresh |
| `lib/regulations.js` | Registry + `listRegulations()` / `ID_` / `US_` / `INTL_REGULATION_IDS` |
| `lib/paths.js` | Data dir + Vercel seed (**41** files) |
| `id-law-scraper.js` | Indonesian ETL |
| `us-law-scraper.js` | United States analogue ETL |
| `iso-soc-scraper.js` | International voluntary ETL (ping + overlay) |
| `public/app.js` | SPA (Browse / Ask / Sources / News / BYOK / region picker) |
| `public/styles.css` | Design tokens + thirteen browse/news/sources themes |
| `api/cron/daily-regulation-refresh.js` | Authenticated daily ETL for all thirteen |

---

## 9. API reference (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness (`ok`) |
| GET | `/api/regulations` | List thirteen instruments + flags + jurisdictions |
| GET | `/api/meta` | Freshness, BYOK flags, `sources[]` — `?regulation=` |
| POST | `/api/validate-api-keys` | Validate Groq/Tavily (not stored) |
| GET | `/api/news` | Feeds + items (+ optional `?live=1`) |
| POST | `/api/news/refresh` | Full crawl + persist |
| GET/POST | `/api/news/article-attachments` | Attachment links for one URL |
| POST | `/api/news/attachments-summary` | Batch attachment counts |
| GET | `/api/chapters` | Chapters — `?regulation=` |
| GET | `/api/chapter-summaries` | Chapter intros — `?regulation=` |
| POST | `/api/chapter-summaries/regenerate` | Groq regenerate summaries |
| GET | `/api/articles` / `/api/articles/:number` | Articles / pasal |
| GET | `/api/recitals` / `/api/recitals/:number` | Recitals / considering / values |
| GET | `/api/industry-sectors` | ISIC sectors + tree |
| POST | `/api/answer` | Grounded Ask |
| POST | `/api/refresh` | ETL for one `regulation` |
| GET | `/article-suitable-recitals.json` | GDPR editorial map |
| GET | `*` (non-file) | SPA → `index.html` |

**Removed in 1.2.6 (not available):** `/api/categories`, `/api/chapters/:number`, `/api/ask`, `/api/summarize`.

Full contracts: [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md).

---

## 10. Configuration

### 10.1 Environment variables (active)

See **[.env.example](.env.example)** and **[docs/VARIABLES.md](docs/VARIABLES.md)** for the authoritative dictionary.

| Area | Examples |
|------|----------|
| Server / deploy | `PORT`, `HOST`, `GDPR_DATA_DIR`, `CRON_SECRET`, `VERCEL` |
| GDPR ETL | `GDPR_ETL_PRIMARY`, `MIN_GDPR_INFO_*`, `GDPR_*_CONCURRENCY`, `GDPR_FORCE_CORPUS_WRITE` |
| AI / Data Act ETL | `MIN_AI_ACT_*`, `AI_ACT_*`, `MIN_DATA_ACT_*`, `DATA_ACT_*` |
| Indonesian ETL | `MIN_ID_PDP_*`, `MIN_ID_SATU_DATA_*`, `MIN_ID_AI_ETHICS_*`, `ID_*_FORCE_CORPUS_WRITE` |
| United States ETL | `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, `MIN_US_OPEN_DATA_*`, `US_*_FORCE_CORPUS_WRITE` |
| International ETL | `MIN_ISO_27701_*`, `MIN_ISO_19941_*`, `MIN_ISO_23894_*`, `MIN_SOC2_*`, `ISO_*_FORCE_CORPUS_WRITE`, `SOC2_FORCE_CORPUS_WRITE` |
| Ask web | `WEB_TIMEOUT_MS`, `WEB_MAX_RESULTS`, `WEB_MAX_PAGES`, `WEB_SNIPPET_CHARS` |
| LLM | `GROQ_API_KEY`, `GROQ_MODEL`, `TAVILY_*` |
| News | `NEWS_CRAWL_TIMEOUT_MS`, `NEWS_REFRESH_TIMEOUT_MS`, `NEWS_MERGE_CAP`, `NEWS_*` depth knobs |

**Not used (removed 1.2.6):** `OPENAI_*`, `ANTHROPIC_*`, `GOOGLE_GEMINI_*`, `MISTRAL_*`, `OPENROUTER_*`, `LLM_PROVIDER`.

**BYOK (browser):** `localStorage` key `gdpr-qa-byok-v1` — never commit secrets.

### 10.2 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Copy suitable-recitals map; start server |
| `npm test` | Indo + US + ISO/SOC2 parity, browse routes, reader view (**58** tests) |
| `npm run refresh` | GDPR ETL only |
| `npm run refresh-ai-act` / `refresh-data-act` | EU Act ETL |
| `npm run refresh-id-pdp` / `refresh-id-satu-data` / `refresh-id-ai-ethics` | Indonesian ETL |
| `npm run refresh-us-ccpa` / `refresh-us-admt` / `refresh-us-open-data` | United States analogue ETL |
| `npm run refresh-iso-27701` / `refresh-iso-19941` / `refresh-iso-23894` / `refresh-soc2` | International voluntary ETL |
| `npm run fetch-suitable-recitals` | GDPR editorial map refresh |
| `npm run vercel-build` | Pre-deploy copy for Vercel |

### 10.3 Deploy to Vercel

1. Import project (root = this folder).  
2. Set `GROQ_API_KEY`, `CRON_SECRET`, optional `TAVILY_API_KEY`.  
3. Deploy; cron hits `/api/cron/daily-regulation-refresh` for all thirteen instruments.

Details: [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md).

---

## 11. Quick start

```bash
cd gdpr-qa-platform
npm install
npm start
```

1. Open **http://localhost:3847**.  
2. Optionally set region to **EU** or **Indonesia**, then pick an instrument.  
3. **Refresh sources** to update the selected corpus (bundled JSON works until then).  
4. **Browse** chapters/articles or recitals; use Prev/Next, jump field (Enter), **Page \| Full**, and Export PDF.  
5. **Ask** grounded questions with `[S#]` citations (set Groq/Tavily via `.env` or BYOK).  
6. Open **Credible sources** and **News**; use **Refresh news** if Indo/EU lists look sparse.  
7. Run **`npm test`** before release when touching registry, Indo corpora, or news helpers.

---

## 12. License and disclaimer

This project is for **reference only**. Regulation text is sourced from official publications and widely used readable layouts. Always verify against the official instruments (EU Regulations cited above; Indonesian UU / Perpres / SE as published on peraturan.go.id and JDIH). **SE Menkominfo 9/2023 is soft law.** The maintainers do not provide legal advice.

**Attribution:** Application credits bar — **Rifqi Tjahyono** ([LinkedIn](https://www.linkedin.com/in/rifqi-tjahjono/), [rifqi-tjahyono.com](https://rifqi-tjahyono.com/)).
