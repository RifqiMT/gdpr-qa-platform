# Changelog

All notable changes to the **EU Regulation Q&A Platform** (repository: `gdpr-qa-platform`) are documented in this file. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [1.2.2] — 2026-05-19

### Fixed

- **Citation sidebar (multi-regulation):** Browse detail panels (“Citations & official links”, “Related articles/recitals”) use **`citationsUi`** from `regulation-profiles.js` and **`syncCitationSidebarChrome()`** when the regulation selector changes (no longer hardcoded to GDPR / GDPR-Info).
- **Article display titles (AI Act & Data Act):** `getArticleDisplayTitle()` no longer replaces corpus titles longer than 120 characters with bare “Article N” (fixes Data Act Art. 4, Art. 33, and similar long official titles).
- **AI Act / Data Act ETL:** `<sup>N</sup>` paragraph markers, sequential top-level numbering across `<li>` elements (`topLevelParaNum`), and “in particular on:” + lettered sub-list reordering (e.g. Art. 96).
- **Article bodies:** Glued markers (`1In` → `1. In`) via guardrails; strip duplicate title lines from body text; `buildSearchIndex` uses regulation-specific recital URLs (no GDPR-Info pollution in AI/Data Act indexes).

### Changed

- **Browse chrome:** Document nav, chapter filter placeholders, and related-panel loading/badge ARIA labels follow the active regulation (`regulationFilterPlaceholder`, `relatedPanelBadgeAriaLabel`).
- **Documentation (standard v2.0):** Comprehensive audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.3, personas, user stories, VARIABLES (`citationsUi` + relationship charts), metrics, design, traceability (BR-B-11/12), guardrails, architecture, API contracts, feature catalog, operations runbook, source inventory, glossary, data schema examples, document formatting guardrails, docs hub.

---

## [1.2.1] — 2026-05-26

### Fixed

- **Browse reader titles (EU AI Act & EU Data Act):** `getArticleDisplayTitle()` in `public/app.js` now applies **`CANONICAL_ARTICLE_TITLES` only when GDPR is selected**. AI Act and Data Act use scraped `title` from `*-content.json` (fixes wrong headings such as GDPR Art. 10 title on Data Act Art. 10).
- **Recital titles:** Added **`getRecitalDisplayTitle()`** and improved **`parseRecitalTopicTitle()`** for regulation-agnostic topic lines in cards, reader, and Ask aside.
- **Regulation-aware labels:** Citation “back” links and chapter filter option labels use the active regulation name instead of hardcoded “GDPR”.

### Changed

- **Document formatting (AI Act & Data Act):** ETL preserves numbered paragraphs `(a)`/`(b)` and `1.` markers via shared `scraper.js` list handling, `joinBodyLines()` in regulation scrapers, `normalizeDsgvoLawParagraphMarkers`, and reader helpers (`renderManualNumberedParagraphs`, `renderManualParagraphBody`).
- **Documentation (standard v1.9):** Comprehensive audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.2, personas, user stories, VARIABLES (display-title variables + relationship charts), metrics, design, traceability, guardrails, architecture, API contracts, tech/business guidelines, feature catalog, operations runbook, source inventory, glossary, data schema examples, document formatting guardrails, docs hub, changelog.

---

## [1.2.0] — 2026-05-19

### Added

- **EU Data Act regulation:** Browse and Ask over Regulation (EU) 2023/2854 — **50 articles** and **119 recitals** from [data-act-law.eu](https://data-act-law.eu/), with header switcher option **`data-act`**, `?regulation=data-act` API parameter, `npm run refresh-data-act`, bundled `data/data-act-content.json`, and profile in `public/regulation-profiles.js`.
- **Ask / Sources / News integration for Data Act:** Regulation-aware Ask copy and web search context; credible sources from `data-act-structure.json`; News relevance filter and banner when EU Data Act is selected; **EU Data Act** topic group in `news-topics.js`.
- **Daily cron:** `api/cron/daily-regulation-refresh.js` refreshes GDPR, AI Act, and Data Act corpora.

### Changed

- **Multi-regulation product:** Header regulation dropdown now lists **GDPR**, **EU AI Act**, and **EU Data Act** (`package.json` **1.2.0**).
- **App shell:** Replaced legal-reference page footer with **app credits** bar (maintainer attribution, LinkedIn and website icon links).
- **Documentation (standard v1.8):** Full audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.1, personas (incl. Data Act lead), user stories, VARIABLES (Data Act env + relationship charts), metrics, design (app credits), traceability, guardrails, architecture, API contracts, tech guidelines, data schema examples, operations runbook, glossary, feature catalog, changelog.

---

## [1.1.0] — 2026-05-25

### Added

- **EU AI Act regulation:** Browse and Ask over Regulation (EU) 2024/1689 — 113 articles and 180 recitals from [ai-act-law.eu](https://ai-act-law.eu/), with regulation switcher in the header, `?regulation=ai-act` API parameter, `npm run refresh-ai-act`, bundled `data/ai-act-content.json`, and shared UI via `public/regulation-profiles.js` (reader, chapter list, citations, PDF export).
- **Ask / Sources / News integration for AI Act:** Regulation-aware Ask copy, Tavily/web search context, credible sources from `ai-act-structure.json`, News AI-relevance filter and banner when EU AI Act is selected; **EU Artificial Intelligence Act** topic group in `news-topics.js`.
- **Vercel production deployment:** `vercel.json`, `api/index.js` (Express serverless entry), `api/cron/daily-regulation-refresh.js`, `lib/paths.js` (bundled `data/` + `/tmp` on Vercel), `npm run vercel-build`, `.vercelignore`, and **[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)**.
- **BYOK (Bring Your Own Key):** Header **API keys** dialog stores Groq/Tavily credentials in **browser `localStorage`** (`gdpr-qa-byok-v1`); optional override of server `.env` keys on **`POST /api/answer`** and **`POST /api/chapter-summaries/regenerate`** via request body **`apiKeys`**.
- **`POST /api/validate-api-keys`:** Validates Groq (models API) and Tavily (minimal search) without persisting secrets; powers **Check validity** with animated result cards in the dialog.
- **Ask LLM status line:** Shows server vs BYOK key state on the Ask tab (`updateAskLlmKeysStatus`).

### Changed

- **News & Credible sources scope:** Removed **CNIL** and other **country-based** national DPA feeds from News and **`meta.sources`**; **ICO (UK)** remains the only national supervisory authority in-app. See **BG-07** in [docs/GUARDRAILS.md](docs/GUARDRAILS.md).
- **News UI:** Added a segmented **view toggle** to switch between **By source** and a blended **All sources** chronological feed (newest-first), keeping card chrome consistent across both views.
- **News UI:** Filter dropdown panels now include in-panel **search** to quickly narrow Source and Topic options.
- **News UI:** **Attachments** action is displayed **only when** the batch summary confirms at least one downloadable file for the article URL.
- **News ingestion:** Increased default `NEWS_MERGE_CAP` to **6000** to retain more historical items in the API response.
- **News ingestion:** Added bounded topic enrichment knobs (`NEWS_TOPIC_ENRICH_*`) and `NEWS_FROM_YEAR` (best-effort) to improve coverage without uncontrolled crawl expansion.

### Documentation

- **Product documentation audit (standard v1.5):** BYOK, validate-api-keys, News UI (see git history for v1.4–v1.5 iterations).

### Removed

- **Docker / Render web porting artifacts:** Removed **`Dockerfile`**, **`.dockerignore`**, and **`render.yaml`**. **`GET /health`** retained.

### Notes (1.1.0 development)

- Added enterprise product documentation set: `docs/VARIABLES.md`, `docs/METRICS_AND_OKRS.md`, `docs/DESIGN_GUIDELINES.md`, `docs/TRACEABILITY_MATRIX.md`, `docs/GUARDRAILS.md`, `docs/API_CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/README.md`.
- Expanded `PRODUCT_DOCUMENTATION_STANDARD.md` and root `README.md` to reflect current Ask (`POST /api/answer`), BM25 retrieval, industry sectors, Groq/Tavily, chapter summaries, and news APIs.

---

## [1.0.0] — 2024-2026 baseline

### Summary

Initial packaged release: browse GDPR recitals and articles from a local corpus, Ask with grounded LLM pipeline and fallbacks, credible sources hub, curated/crawled news, EUR-Lex refresh via scraper, PDF export, and cross-references between articles and recitals.

### Added (high level)

- **Server (`server.js`):** Express API; `loadContent`; `POST /api/answer` with `buildLocalContext` (BM25), optional DuckDuckGo web excerpts, Groq synthesis, Tavily fallback, extractive fallback; `POST /api/ask` simple search; `POST /api/summarize` multi-provider; news merge and `POST /api/news/refresh`; chapter summary regeneration; static SPA fallback; daily cron refresh.
- **ETL (`scraper.js`):** EUR-Lex fetch and merge into `gdpr-content.json` with search index.
- **News (`news-crawler.js`):** EDPB, ICO, Commission, Council of Europe sources with timeouts.
- **Crossrefs (`gdpr-crossrefs.js`):** Editorial suitable recitals + text-derived citations.
- **Client (`public/`):** Browse with filters and doc navigation; Ask with sector combobox and citation chips; Sources and News tabs; html2pdf export.
- **Data:** `gdpr-structure.json`, `article-suitable-recitals.json`, `chapter-summaries.json`, `industry-sectors.json`, optional `gdpr-news.json`.
- **Scripts:** `prestart` copy of suitable-recitals to `public/`; `fetch-suitable-recitals` helper.

### Dependencies

- `express`, `cors`, `axios`, `cheerio`, `node-cron`, `dotenv` (see `package.json`).

---

## Earlier development

Changes prior to `1.0.0` were not tracked in this changelog; refer to git history for granular commits.
