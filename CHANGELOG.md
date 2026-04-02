# Changelog

All notable changes to the **GDPR Q&A Platform** are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

---

## [Unreleased]

### Documentation

- **Comprehensive documentation audit (product standard v1.1):** Rewrote and expanded **[docs/VARIABLES.md](docs/VARIABLES.md)** with full environment-variable tables (including **`GDPR_MAX_ARTICLE_CHARS`**, **`GDPR_INFO_CONCURRENCY`**, **`GDPR_FORCE_*`**, **`OPENROUTER_REFERRER`**), refresh API fields, and **two** Mermaid relationship diagrams (data flow + configuration dependencies).
- Updated **[PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md)** to v1.1 with governance rules and an authoritative documentation index.
- Refreshed **[README.md](README.md)** for the mandatory **document formatting** refresh pipeline, **`runRegulationScraperAndReloadContent`**, default **GDPR-Info** corpus, client reload after refresh, and extended configuration table.
- **PRD v1.1:** Added **FR-R7**, **FR-R8**, **NFR-7**; clarified data model and success criteria for guardrails and post-refresh coherence.
- **Personas & stories:** Added **Engineering / DevOps** persona; new stories **US-R4–US-R6** for guardrails, UI reload, and force write.
- **Metrics:** New **§1.4** (formatting/corpus integrity) and **OKR O4**; **TRACEABILITY_MATRIX** rows **BR-R-05**–**BR-R-07** and updated **BR-NF-04**.
- **Design:** **DESIGN_GUIDELINES** §2.1 responsive breakpoints; semantic/error color note.
- **API / architecture:** **`POST /api/refresh`** sample JSON; regulation refresh sequence diagram in **ARCHITECTURE.md**.
- **Hub:** **[docs/README.md](docs/README.md)** reading order and expanded map; **GUARDRAILS** §8 documentation guardrails; **`.env.example`** extended for new ETL and OpenRouter variables.
- **New:** **[docs/GLOSSARY.md](docs/GLOSSARY.md)** for acronyms and product terms.

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
