# Changelog

All notable changes to the **GDPR Q&A Platform** are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

---

## [Unreleased]

### Documentation

- **Product documentation audit (standard v1.3):** Bumped **[PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md)** to **v1.3**; aligned **[README.md](README.md)** (version blurb, configuration table: **`HOST`**, **`NEWS_ATTACHMENTS_*`**, **`NEWS_MAX_*`**, **`NEWS_COMMISSION_*`**, corrected default news timeouts **90000** / **180000** ms, duplicate env row removed, disclaimer sources); expanded **[docs/VARIABLES.md](docs/VARIABLES.md)** (defaults for **`NEWS_MERGE_CAP`**, attachments cache, crawler tuning vars, **`commissionPolicyAreas`** semantics, **§9.4** topic-assignment diagram); new **[docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md)**; updated **[docs/PRD.md](docs/PRD.md)** (**v1.3**, **FR-S9**, news data model and purpose); **[docs/USER_PERSONAS.md](docs/USER_PERSONAS.md)**, **[docs/USER_STORIES.md](docs/USER_STORIES.md)** (**US-N9**); **[docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md)** (news count and refresh duration); **[docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md)** (`.news-topic-tag`); **[docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md)** (**BR-N-09**–**BR-N-11**); **[docs/GUARDRAILS.md](docs/GUARDRAILS.md)** (**TG-N06**–**TG-N08**); **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**; **[docs/GLOSSARY.md](docs/GLOSSARY.md)**; **[docs/README.md](docs/README.md)** hub.
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
