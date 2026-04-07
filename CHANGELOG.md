# Changelog

All notable changes to the **GDPR Q&A Platform** are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

---

## [Unreleased]

### Changed

- **News & Credible sources scope:** Removed **CNIL** and other **country-based** national DPA feeds from News and **`meta.sources`**; **ICO (UK)** remains the only national supervisory authority in-app. See **BG-07** in [docs/GUARDRAILS.md](docs/GUARDRAILS.md).
- **News UI:** Added a segmented **view toggle** to switch between **By source** and a blended **All sources** chronological feed (newest-first), keeping card chrome consistent across both views.
- **News UI:** Filter dropdown panels now include in-panel **search** to quickly narrow Source and Topic options.
- **News UI:** **Attachments** action is displayed **only when** the batch summary confirms at least one downloadable file for the article URL.
- **News ingestion:** Increased default `NEWS_MERGE_CAP` to **6000** to retain more historical items in the API response.
- **News ingestion:** Added bounded topic enrichment knobs (`NEWS_TOPIC_ENRICH_*`) and `NEWS_FROM_YEAR` (best-effort) to improve coverage without uncontrolled crawl expansion.

### Documentation

- **Product documentation audit (standard v1.4):** Updated **[PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md)** to **v1.4**; aligned **[README.md](README.md)**, **[docs/PRD.md](docs/PRD.md)**, **[docs/API_CONTRACTS.md](docs/API_CONTRACTS.md)**, **[docs/VARIABLES.md](docs/VARIABLES.md)**, **[docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md)**, **[docs/USER_STORIES.md](docs/USER_STORIES.md)**, and **[docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md)** with the latest News UI (view toggle, searchable filters, attachments visibility) and updated `NEWS_*` defaults and enrichment knobs.
- **Earlier iterations (still reflected in repo history):** v1.2 news UI + dedupe docs; v1.1 variables/PRD guardrails expansion; initial enterprise doc set under `docs/`.

### Removed

- **Docker / Render web porting artifacts:** Removed **`Dockerfile`**, **`.dockerignore`**, and **`render.yaml`**. The **`GET /health`** route remains for any generic liveness checks.

### Earlier unreleased notes

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
