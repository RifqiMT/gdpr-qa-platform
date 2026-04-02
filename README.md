# GDPR Q&A Platform

**Product documentation · General Data Protection Regulation (EU) 2016/679**

| Version | Node | Description |
|---------|------|-------------|
| 1.0.0   | ≥ 18 | Browse GDPR with filters and cross-links; **Ask** via BM25 + Groq/Tavily grounded answers with `[S1]` citations; optional industry sector; News (merge + refresh); Credible sources; chapter summaries; PDF export. **Product documentation standard v1.1** (see [PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md)). |

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

**Documentation index:** [PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md) · [docs/README.md](docs/README.md) (full doc map).

**Deep dives:** [docs/VARIABLES.md](docs/VARIABLES.md) (data dictionary + relationship diagrams) · [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) · [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) · [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) · [docs/GLOSSARY.md](docs/GLOSSARY.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md) · [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [CHANGELOG.md](CHANGELOG.md).

**Source refresh & reader formatting:** [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) — contract between `gdpr-content.json`, `scraper.js`, `document-formatting-guardrails.js`, and `public/app.js`. **Refresh sources** always runs server-side guardrail normalization before writing the corpus.

---

## 1. Product overview

The **GDPR Q&A Platform** is a web application that lets users **browse** the full text of the General Data Protection Regulation (EU) 2016/679 with **citations and links** to official EU sources, and **ask natural-language questions** that are answered using **retrieved regulation excerpts** (BM25 over a local corpus), optional **live web snippets**, and **LLM synthesis** (Groq primary, Tavily fallback) with numbered citations **`[S1]`, `[S2]`, …** mapped to those sources. Users may optionally select an **industry / sector** (ISIC-aligned list) to steer answers without leaving the GDPR text. The app also provides a **Credible sources** tab, a **News** tab (static JSON merged with live crawls, plus **Refresh news** to persist updates), **chapter introduction blurbs**, **article↔recital cross-references**, and **PDF export** for the current provision. No coding is required to use the product; a single server and browser are enough.

| Aspect | Description |
|--------|-------------|
| **Purpose** | Reference and Q&A over the GDPR using credible, official text only; plus curated news from supervisory bodies and official sources. |
| **Users** | Legal, compliance, privacy professionals and anyone needing quick, sourced GDPR answers and updates. |
| **Content** | **GDPR** recitals 1–173 and articles 1–99: default corpus from **GDPR-Info** (paragraph structure aligned with [gdpr-info.eu](https://gdpr-info.eu/)); optional **EUR-Lex** primary via env; official links in-app; news from EDPB, ICO, European Commission, Council of Europe. |
| **Deployment** | Single Node.js server; default port **3847** (`PORT` env). |

### Knowledge sources (credible organizations)

| Source | URL | Role |
|--------|-----|------|
| **GDPR-Info** | [gdpr-info.eu](https://gdpr-info.eu/) | Regulation text and structure (unofficial, widely cited) |
| **EUR-Lex** | [Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) | Official EU publication of the Regulation |
| **EDPB** | [edpb.europa.eu](https://edpb.europa.eu/) | European Data Protection Board – guidelines and consistency |
| **European Commission** | [Data protection](https://commission.europa.eu/law/law-topic/data-protection_en) | Official Commission policy and legal overview |
| **ICO (UK)** | [UK GDPR guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance/) | UK supervisory authority guidance |
| **GDPR.eu** | [gdpr.eu](https://gdpr.eu/) | Readable overview and resources (Proton) |
| **Council of Europe** | [Data protection](https://www.coe.int/en/web/data-protection) | Convention 108+ and international standards |

---

## 2. Product benefits

- **Single source of truth** — The regulation corpus is fetched from EUR-Lex (via the scraper) and stored locally; Ask retrieves from that corpus before synthesis.
- **Traceability** — Ask responses return `sources` with stable ids (`S1`…) aligned with citation chips; Browse links to GDPR-Info and EUR-Lex throughout.
- **Grounded synthesis** — LLM prompts require use of provided excerpts only; repair passes and extractive fallback reduce empty or non-compliant formatting.
- **Data refresh without duplication** — On refresh, recitals and articles are deduplicated by number (last occurrence wins); existing content is merged with newly fetched data so the latest overwrites per provision. Search index is deduplicated by id.
- **Efficiency** — Browse by structure or ask in natural language; jump from Ask results to the full article/recital in the app and back.
- **Offline-capable content** — After a refresh, the regulation is stored in `data/gdpr-content.json` and can be searched without calling external sites on each request.
- **Export** — Export the currently viewed article or recital as PDF from the Browse view (client-side via html2pdf.js).
- **Topic-based drill-down** — Chapters & Articles can be filtered by **Category** (chapter title), **Sub-category** (topic/keyword-derived, e.g. Consent, Right to erasure, Transfers, DPO), **Chapter**, and **Article**; sub-category options adapt when a chapter is selected.
- **Centered chapter headers** — Section headers (“Chapter I – General provisions”, etc.) and “Official sources” are horizontally and vertically centered in both the grouped list and the chapter detail view for a clear, professional layout.
- **Document navigation** — In article/recital detail view: Prev/Next buttons, label (e.g. “Article 5 of 99”), and a number input with “Go” to jump directly to any article or recital.
- **Relevant GDPR provisions** — Ask results list regulation sources cited for the answer, with “View in app” links and clickable `[Sn]` chips in the answer body.
- **Sector-aware Ask** — Optional industry/sector selection adjusts retrieval and prompts so answers name the sector when appropriate (still bounded by sources).
- **Cross-references** — Articles show merged “suitable” recitals (editorial map + recitals that cite the article); recitals show related articles.
- **News from credible sources** — One place to see GDPR-related updates from EDPB, ICO, European Commission, and Council of Europe, with three-paragraph summaries and filters by source and topic.
- **Credible sources hub** — One tab listing all official and widely cited sources with direct links to key documents (EDPB guidelines, ICO guidance, Commission pages, etc.).

---

## 3. Features

### 3.1 Browse GDPR

- **Homepage** — Clicking the **“GDPR Q&A Platform”** logo in the header goes to the **homepage**: the Browse tab is selected, the main content shows the initial placeholder (choose **GDPR recitals**, **GDPR chapters & articles**, or **Credible sources**), and the reader sidebar is reset to its original state (no chapter list loaded). This gives users a single, consistent “home” state.
- **Browse segments** — Navigate by **GDPR recitals** (1–173) or **GDPR chapters & articles** (11 chapters, Articles 1–99). Chapter list shows roman numerals, titles, and article ranges. Labels use an explicit **GDPR** prefix so future corpora (other regulations) can be added without ambiguity.
- **Filter bar** — **Category** (chapter title), **Sub-category** (topic derived from article title/keywords, e.g. Consent, Right to erasure, Transfers, DPO), **Chapter**, and **Article**; each filter is on its own row for clarity. When a Category/Chapter is selected, Sub-category shows only topics that have at least one article in that chapter. **Clear filters** resets all. Layout is responsive: single column on small screens, two-column grid on larger screens.
- **Recitals list** — Grid of recital cards; click to open full recital text in a detail view with formatted body and citation links.
- **Chapters & Articles list** — Grouped by chapter; filter by category, sub-category, chapter, and/or article. Section headers (e.g. “Chapter I – General provisions”) and meta (“Articles 1–4”) are centered. Each chapter can show a **short introduction** from `GET /api/chapter-summaries` (file-backed, with inline fallback; regeneratable via Groq on the server). Click an article to open its full text.
- **Detail view** — Full document view with centered header (“Chapter I – General provisions”, “Official sources: GDPR-Info · EUR-Lex”) and “Back” to return to list. **Document navigation**: Prev/Next buttons, label (e.g. “Article 5 of 99”), number input (1–99 or 1–173) and “Go” to jump to any article or recital. **Export PDF** exports the current article or recital.
- **Back to question** — When the user opened the document from Ask (“View in app”), a “Back to question” button appears to return to the Ask tab and scroll to results.
- **Citations** — Each view links to GDPR-Info and EUR-Lex for the relevant section.
- **Related panels** — **Related GDPR articles** / **Related GDPR recitals** use `suitableArticles` / `suitableRecitals` from the API (editorial JSON from GDPR-Info plus citations extracted from recital/article text; see `gdpr-crossrefs.js`).

### 3.2 Ask a question

- **Search input** — Free-text question (e.g. “What is personal data?”, “Right to erasure”). Submit via button or Enter.
- **API** — The UI calls **`POST /api/answer`** with `{ query, includeWeb, industrySectorId }`. The server builds **BM25-ranked** context from `searchIndex`, optionally fetches **web excerpts** (DuckDuckGo HTML + page text), then runs **Groq** chat completions; if that fails, **Tavily** search+answer; if that fails, an **extractive** summary from the top regulation excerpts.
- **Answer panel** — Shows synthesized text with **`[S1]`** citation chips. Regulation chips open the Article or Recital inside Browse; web chips open external URLs. A **status chip** shows Groq/Tavily model info or “Extractive fallback” plus any server `note`.
- **Industry / sector** — Optional combobox (`GET /api/industry-sectors`). **General** means no sector lock-in; other sectors require the model to include a **verbatim phrase** from the sector definition when supported by sources.
- **Relevant GDPR provisions** — Aside lists regulation `sources` returned with the answer (articles/recitals), each with “View in app”.
- **Refresh on each ask** — Each new question clears the previous answer, citations panel, and relevant-provisions list.
- **Legacy search API** — **`POST /api/ask`** still returns simple token-scored matches (full-text excerpts) for scripts or integrations; the Ask **tab** does not use it.

### 3.3 Credible sources

- **Sources tab** — Lists all credible organizations (GDPR-Info, EUR-Lex, EDPB, European Commission, ICO, GDPR.eu, Council of Europe) with short descriptions and direct links to key documents (guidelines, recitals, chapters, Commission pages, ICO guidance, etc.). Data comes from `GET /api/meta` (sources array).

### 3.4 Content and regulation refresh

- **Refresh sources** — Button triggers **`POST /api/refresh`**, which runs **`scraper.js`** ETL, then **`document-formatting-guardrails.js`** **`normalizeCorpus`** on every write path, **`validateCorpusFormatting`** (returns **`formattingGuardrails`** to the client), **`buildSearchIndex`**, and **`fs.writeFileSync`** for **`data/gdpr-content.json`**. The server then calls **`invalidateRegulationContentCache`** and **`loadContent()`** so APIs serve the file just written. The client reloads **`/api/meta`**, chapter and recital lists, credible sources, and re-opens the current document. See [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) §1.1.
- **Primary source** — Default **`GDPR_ETL_PRIMARY=gdpr-info`** (per-page fetch from gdpr-info.eu). Set **`GDPR_ETL_PRIMARY=eur-lex`** to prefer the official consolidated EUR-Lex parser first (GDPR-Info remains fallback when needed).
- **Force write** — **`GDPR_FORCE_CORPUS_WRITE=1`** (or **`GDPR_FORCE_RELOAD_CORPUS=1`**) forces a disk write on the next refresh even if the dataset hash is unchanged (e.g. after guardrail code changes).
- **Daily refresh** — Optional cron at **02:00 Europe/Brussels** uses the same pipeline as the button (**`runRegulationScraperAndReloadContent`**).
- **CLI refresh** — **`npm run refresh`** runs **`node server.js --refresh-only`** (ETL + write + guardrails; no HTTP server).
- **Credible sources** — Primary regulation text: [GDPR-Info](https://gdpr-info.eu/) and [EUR-Lex – Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). Additional credible resources linked in the Sources tab and footer; also in **`/api/meta`**.

### 3.5 News (GDPR from credible sources)

- **News tab** — Highlights GDPR and data protection news from credible sources. Each item links to the **original article** on the publisher’s site (traceable to source).
- **Grouping** — News is grouped **by source** (EDPB, ICO, European Commission, Council of Europe). Each section has a short plain-language summary describing that source’s role.
- **Three-paragraph summaries** — Each news card shows a **Summary** block with three paragraphs: (1) high-level summary of the item, (2) attribution to the source and link to full article, (3) relevance (e.g. GDPR compliance). Uses `summaryParagraphs` from data when present, otherwise built from snippet/title and standard sentences.
- **Topic tags** — Items are auto-tagged by topic (e.g. Rights (erasure & access), AI & digital, Enforcement & fines, Guidance & compliance, Transfers & BCR, International standards, Policy & publications, Children & privacy, General) derived from title/snippet; non‑“General” topics appear as tags on cards.
- **Filters** — **Source** dropdown (All sources / per-source) and **Topic** dropdown (All topics / per-topic). **Clear filters** resets both and re-applies so all items are shown. Filtering is client-side on the last loaded list (no extra network request).
- **Refresh news** — Button calls **`POST /api/news/refresh`**, which crawls sources, merges with existing JSON, writes `data/gdpr-news.json` (subject to internal storage cap), then reloads the UI from the response.
- **Data** — `data/gdpr-news.json`: `newsFeeds[]` and `items[]` (title, url, sourceName, sourceUrl, date, snippet, optional `summaryParagraphs[]`, optional `topic`). Server merges static items with crawled items from `news-crawler.js`; deduped by normalized URL, sorted by date, capped by `NEWS_MERGE_CAP` (response) and a higher cap when persisting on refresh. If file is missing, default feeds apply.
- **API** — `GET /api/news` returns `{ newsFeeds, items }`; `POST /api/news/refresh` returns merged items and persistence metadata.

### 3.6 Optional LLM summaries (`POST /api/summarize`)

- **Purpose** — Excerpt-based summaries for integrations: body `{ query, excerpts[] }`, multi-provider order controlled by `LLM_PROVIDER` and available API keys (Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter).
- **Ask tab** — The main Ask experience uses **`/api/answer`** only; it does **not** call `/api/summarize`. Summaries in the old two-column “verbatim + summary” layout are **not** the current primary UX.

---

## 4. Logic and data flow

### 4.1 Data sources and storage

- **gdpr-structure.json** — Static structure: `meta`, `categories`, `chapters` (roman numerals, titles, article ranges, source URLs). No full text; required for the scraper; used when `gdpr-content.json` is missing.
- **gdpr-content.json** — Produced by the scraper: `meta.lastRefreshed`, `categories`, `chapters`, `recitals[]`, `articles[]`, `searchIndex[]`. Recitals and articles contain full text; search index holds type, number, title, truncated text, and URLs for search. One entry per recital/article number after merge.
- **gdpr-news.json** — Optional: `newsFeeds[]` (name, url, description per source) and `items[]` (title, url, sourceName, sourceUrl, date, snippet, optional `summaryParagraphs[]` of three strings). Served and merged with crawled items by `GET /api/news`.

### 4.2 Scraper (`scraper.js`)

- **Primary source (default):** **GDPR-Info** (`GDPR_ETL_PRIMARY=gdpr-info`) — fetches each article `https://gdpr-info.eu/art-N-gdpr/` and recital `https://gdpr-info.eu/recitals/no-N/` so stored text matches the **same paragraph and line structure** as those pages (see `.entry-content` extraction with `<p>` / `<br>` splitting). This avoids EUR-Lex-only whitespace bugs in the reader.
- **Alternate:** Set `GDPR_ETL_PRIMARY=eur-lex` to prefer the official EUR-Lex consolidated HTML/TXT parser (`parseEurLexText`) first; GDPR-Info is still used as fallback if EUR-Lex fails or returns an empty parse.
- Fetches EUR-Lex HTML (or TXT fallback) when that path is selected, strips scripts/styles/nav, normalizes text.
- **Recitals** — Splits on “(Recital N)”, extracts body, keeps numbers 1–173. Uses a **Map** keyed by number so the **last occurrence wins** (no duplicates).
- **Articles** — Splits on “Article N”, extracts title and body, maps to chapters via fixed article ranges, caps body length. Uses a **Map** keyed by number so the **last occurrence wins** (no duplicates).
- **Merge with existing** — If `gdpr-content.json` exists, it is loaded and merged with newly fetched recitals/articles by number. For each number, the **newly fetched data overwrites** the existing one; numbers only in the existing file are kept. Result: one entry per recital/article number, with latest data from the refresh.
- **Document formatting guardrails** — Before `buildSearchIndex` and every write to `gdpr-content.json`, `document-formatting-guardrails.js` normalizes line endings, NBSP/narrow NBSP to ASCII space, and EUR-Lex “glue” patterns (same rules as the reader’s citation linker). It logs **`logFormattingGuardrailsReport`** and runs §8 smoke checks (counts, Articles 1 / 4 / 89). See [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md).
- **Search index** — Built from the normalized recitals and articles; deduplicated by `id` (e.g. `recital-5`, `article-5`) so the index has no duplicate entries.
- **Exports** — `run`, `fetchUrl`, `parseEurLexText`, `buildSearchIndex`, `mergeWithExisting`.

### 4.3 Sub-categories (topics) and Chapters filter (frontend)

- **Topic taxonomy** — `ARTICLE_TOPICS` in `app.js`: array of `{ id, label, keywords }` (e.g. Consent, Right to erasure, Transfers, DPO, Security of processing, Remedies & penalties). Keywords are matched case-insensitively against article title and a short text snippet.
- **Assignment** — `getArticleTopicIds(art)` returns topic ids for each article. On load, `articleTopics` (article number → topic ids) and `topicIdsByChapter` (chapter number → set of topic ids) are built and stored in `window.__chaptersData`.
- **Filter bar** — Category and Chapter selects are synced (same value). Sub-category dropdown is filled from `ARTICLE_TOPICS`; when a chapter is selected, only topics that have at least one article in that chapter are shown (`fillChaptersSubcategoryDropdown(filterChapter)`). `applyChaptersFilters()` filters articles by category/chapter, article number, and selected sub-category (topic). Clear filters resets all including sub-category.
- **UI** — Shared `.filter-bar`, `.filter-field`, `.filter-field-label`, `.filter-field-select`, `.filter-actions`, `.filter-clear-btn`. One dropdown per row on small screens; responsive grid (e.g. 2 columns for chapters at 900px, 2 columns for news at 640px).

### 4.4 News crawler (`news-crawler.js`)

- **Sources** — EDPB RSS, EDPB news HTML, ICO HTML, plus defaults for Commission and Council of Europe pages (see `DEFAULT_NEWS_FEEDS` in `server.js` and crawler implementation).
- **Output** — Items with `title`, `url`, `sourceName`, `sourceUrl`, `date`, `snippet`. Deduped by normalized URL key, sorted by date descending.
- **Merge in server** — `GET /api/news` reads `gdpr-news.json`, runs `crawlNews()` inside `NEWS_CRAWL_TIMEOUT_MS`, merges with static items (rich fields preserved), caps at `NEWS_MERGE_CAP`. `POST /api/news/refresh` uses a longer timeout, writes merged items to disk (higher internal cap), returns fresh list.

### 4.5 Server (`server.js`)

- **loadContent()** — Reads **`gdpr-content.json`** if present (mtime-cached), applies **`normalizeCorpus`** and rebuilds **`searchIndex`** in memory so Browse/Ask match [DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) even if the file predates a code change; else falls back to **`gdpr-structure.json`** or empty structures.
- **invalidateRegulationContentCache()** / **runRegulationScraperAndReloadContent()** — After ETL, clears the in-memory corpus cache and reloads from disk (**`POST /api/refresh`**, daily cron, initial missing-file refresh).
- **Cross-references** — `gdpr-crossrefs.js`: build map of recitals citing articles; merge with `article-suitable-recitals.json` for `suitableRecitals` / `suitableArticles` on article and recital GET routes.
- **BM25** — `buildBm25Searcher` over `searchIndex` for `buildLocalContext` (Ask). Legacy **`simpleSearch`** still powers **`POST /api/ask`**.
- **`POST /api/answer`** — Composes local + optional web sources, calls Groq with `buildAnswerPrompt`, optional sector enforcement and citation repair passes, then Tavily, then `buildSummaryFromExcerpts` extractive fallback.
- **`POST /api/summarize`** — Multi-provider LLM + extractive fallback (see §3.6).
- **Refresh** — **`POST /api/refresh`** runs **`runRegulationScraperAndReloadContent()`** (scraper + cache bust + **`loadContent`**); returns **`formattingGuardrails`**. Chapter summaries: **`GET` / `POST /api/chapter-summaries*`**.
- **Industry sectors** — `GET /api/industry-sectors` reads `public/industry-sectors.json` (cached).

### 4.6 Frontend (Ask flow)

- On Ask submit: clear answer HTML, status, citations panel, relevant provisions; show loading state.
- `POST /api/answer` with `query`, `includeWeb: true`, and selected `industrySectorId`.
- Render answer via `formatAnswerHtml` (citation chips, optional markdown-style `**bold**` callouts).
- `renderRelevantProvisionsFromAnswer` fills the aside from regulation sources.
- “View in app” (`a.app-goto-doc`): set `cameFromAsk = true`, switch to Browse, `openArticle` / `openRecital`. “Back to question” returns to Ask.

### 4.7 Frontend (Browse flow)

- Recitals / Chapters loaded from `/api/recitals`, `/api/chapters`, `/api/articles`. Chapters view builds `__chaptersData` (chapters, articles, articleTopics, topicIdsByChapter), populates Category, Sub-category, Chapter, Article dropdowns, and applies filters via `applyChaptersFilters()` (including topic filter). Section headers use `.chapters-group-heading` and `.chapters-group-meta` (centered). Chapter detail uses `.chapter-view-header` (centered horizontally and vertically with flexbox, min-height 140px).
- **Homepage** — `goToHome()` (triggered by logo link click): switch to Browse tab if not already active; show `browsePlaceholder`, hide all browse sections (recitals, chapters, sources, detail); hide Back, Export PDF, Back to question; clear `currentDoc` and `lastListSection`; clear `chapterList.innerHTML` so the sidebar “Regulation & sources” shows only the original three nav items (Recitals, Chapters & Articles, Credible sources) with no chapter list below.
- Article/recital detail from **`/api/articles/:number`**, **`/api/recitals/:number`**; articles use **`fmtArticleLine`** (citations + footnote stripping; parenthetical “(Recital N)” removed); recital bodies use **`fmtRecitalLine`** where cross-recital refs are highlighted. **Doc navigation**: **`updateDocNav()`** shows Prev/Next, label (e.g. “Article 5 of 99”), number input and “Go” (**`goToDocNumber`**); Enter in the number input triggers Go. PDF export via **html2pdf.js** on the current detail node.
- Tab switching: `data-view="browse"` | `data-view="ask"` | `data-view="sources"` | `data-view="news"`; views shown/hidden and `aria-selected` updated.

### 4.8 Frontend (Sources and News flow)

- **Sources** — On opening Sources tab, `loadSources()` runs `GET /api/meta` and renders source cards (name, description, list of document links) into `sourcesList`.
- **News** — On opening News tab, `loadNews()` runs `GET /api/news`; renders `newsFeeds` into `newsFeedsList`; sets `lastNewsItems = items`; calls `populateNewsFilters(items)` (builds Source and Topic dropdowns from unique sources and from `getTopicFromItem` + `NEWS_TOPIC_ORDER`); then `applyNewsFilters()` which filters `lastNewsItems` by selected source/topic and calls `renderNewsSections(filtered)`. Sections are grouped by source with `SOURCE_SUMMARIES` plain-language one-liner per source; each card shows topic tag (if not General), title (link to article), three-paragraph summary via `getThreeParagraphSummary(item, sourceName)`, and meta (source link, date). Changing filters or clicking Clear triggers `applyNewsFilters()` only (no new fetch).

---

## 5. Business guidelines

- **Use for reference only** — The platform is a convenience tool. For legal certainty, always verify against the official [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) and [GDPR-Info](https://gdpr-info.eu/) sources.
- **No legal advice** — The app does not provide legal advice. Users are responsible for their own interpretation and compliance.
- **Credible sources only** — Answer text is limited to the regulation content from EUR-Lex; LLM summaries are constrained to that same text to avoid hallucination. News is limited to defined credible sources (EDPB, ICO, European Commission, Council of Europe).
- **Attribution** — Footer and UI attribute content to gdpr-info.eu and EUR-Lex; links must remain so users can check originals. News items always link to the original article on the publisher’s site.

---

## 6. Tech guidelines

- **Node.js** — Required (engine `>=18`). Uses native `fetch` for LLM and scraper HTTP; axios + cheerio for news crawler.
- **No build step** — Frontend is vanilla HTML, CSS, and JavaScript; served as static files from `public/`.
- **Environment** — Optional `.env` or env vars for API keys and `PORT`; see Configuration. No secrets in the repo.
- **Data directory** — `data/` must be writable by the process for refresh (writes `gdpr-content.json`). `gdpr-structure.json` must exist for the scraper to run. `gdpr-news.json` is optional; if missing, default news feeds and empty items are used.
- **CORS** — Enabled for the Express app; suitable for same-origin or controlled cross-origin use.
- **Scheduling** — Cron is optional; if the server is stopped, no automatic refresh runs until the next start.
- **Accessibility & UX** — Tabs and panels use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`; buttons and filters have `aria-label` where needed (e.g. filter bar “Filter documents by category, chapter, and article”, “Filter news”); filter bar uses one dropdown per row and responsive layout; chapter headers are centered for readability; doc nav supports keyboard (Enter in number input).

---

## 7. Tech stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js ≥ 18 |
| **Backend** | Express 4.x, CORS, `fs`, `path` |
| **Scheduling** | node-cron (daily refresh, Europe/Brussels 02:00) |
| **Scraping (regulation)** | axios, cheerio (or built-in https + regex fallback) in `scraper.js` |
| **News crawling** | axios, cheerio in `news-crawler.js`; timeout wrapper for safe merge |
| **Frontend** | HTML5, CSS3, vanilla JavaScript (no framework) |
| **Fonts** | Google Fonts (DM Sans, DM Serif Text) |
| **PDF export** | html2pdf.js 0.10.1 (CDN), client-side |
| **LLM (optional)** | REST calls to OpenAI, Anthropic, Google Gemini, Groq, Mistral, OpenRouter (no SDKs; fetch only) |
| **Data** | JSON files in `data/` (gdpr-structure.json, gdpr-content.json, gdpr-news.json) |

### Dependencies (package.json)

| Package   | Purpose                    |
|----------|----------------------------|
| express  | HTTP server                |
| cors     | Cross-origin               |
| axios    | HTTP client (scraper, news)|
| cheerio  | HTML/XML parsing (scraper, news) |
| node-cron| Daily refresh              |

---

## 8. Project structure

```
gdpr-qa-platform/
├── server.js                 # Express: APIs, BM25 context, Groq/Tavily Ask, summarize, refresh (runRegulationScraperAndReloadContent), news, chapter summaries, cron, static + SPA fallback
├── scraper.js                # EUR-Lex ETL → gdpr-content.json
├── document-formatting-guardrails.js  # Corpus normalization + validation on every refresh (see docs/DOCUMENT_FORMATTING_GUARDRAILS.md)
├── news-crawler.js           # News crawl; used by GET/POST news routes
├── gdpr-crossrefs.js         # Article↔recital suitability helpers
├── package.json              # prestart, start, refresh, fetch-suitable-recitals
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
├── CHANGELOG.md
├── PRODUCT_DOCUMENTATION_STANDARD.md
├── docs/                     # PRD, personas, stories, variables, metrics, design, traceability, guardrails, API, architecture, formatting guardrails, README
├── scripts/
│   └── fetch-article-suitable-recitals.js
├── data/
│   ├── gdpr-structure.json
│   ├── gdpr-content.json     # Generated by scraper
│   ├── gdpr-news.json        # Optional; updated by Refresh news
│   ├── article-suitable-recitals.json  # Editorial map; copied to public/ on npm start
│   └── chapter-summaries.json          # Optional chapter blurbs
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── industry-sectors.json
    └── article-suitable-recitals.json  # Copy from data/ (prestart)
```

### Key source files

| File | Responsibility |
|------|----------------|
| **server.js** | `loadContent`; BM25 (`buildBm25Searcher`, `buildLocalContext`); `POST /api/answer` (Groq, Tavily, extractive); `POST /api/ask`, `POST /api/summarize`; article/recital routes with `suitableRecitals` / `suitableArticles`; chapter summaries; industry sectors; news merge/refresh; cron; static. |
| **gdpr-crossrefs.js** | `buildRecitalsCitingArticlesMap`, `mergedSuitableRecitalsForArticle`, `mergedSuitableArticlesForRecital`. |
| **scraper.js** | EUR-Lex fetch/parse, merge, **`document-formatting-guardrails.js`** normalization, `buildSearchIndex`, write `gdpr-content.json`. |
| **document-formatting-guardrails.js** | On every refresh: line endings, NBSP→space, EUR-Lex glue fixes; validation report (Art. 1, 4, 89, counts). |
| **news-crawler.js** | `crawlNews`, `withTimeout`, URL normalization for dedupe. |
| **public/app.js** | Browse (filters, doc nav, cross-links, chapter summaries); **Ask:** `doAsk` → `/api/answer`; Sources; News + refresh; PDF; homepage. |
| **public/styles.css** | Design tokens, layout, reader, Ask citation chips, news/sources, print/PDF hooks. |
| **data/article-suitable-recitals.json** | `articles` map for editorial suitable recitals per article. |
| **.env.example** | `PORT`, web/news tuning, LLM keys, `LLM_PROVIDER`. |

---

## 9. API reference (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/meta` | Freshness fields, `askGroqConfigured`, `askTavilyConfigured`, `sources[]` for Credible sources |
| GET | `/api/news` | `{ newsFeeds, items }` merged static + crawl (capped) |
| POST | `/api/news/refresh` | Full crawl, merge, write `gdpr-news.json`, return fresh items |
| GET | `/api/categories` | Categories |
| GET | `/api/chapters` | All chapters (+ source URLs) |
| GET | `/api/chapters/:number` | One chapter with articles |
| GET | `/api/chapter-summaries` | Chapter I–XI intro strings + metadata |
| POST | `/api/chapter-summaries/regenerate` | Regenerate summaries with Groq (requires key); writes JSON |
| GET | `/api/articles` | All articles |
| GET | `/api/articles/:number` | One article + `chapter`, `contentAsOf`, **`suitableRecitals`** |
| GET | `/api/recitals` | All recitals |
| GET | `/api/recitals/:number` | One recital + URLs, `contentAsOf`, **`suitableArticles`** |
| GET | `/api/industry-sectors` | Sector list for Ask combobox |
| POST | `/api/answer` | Body: `{ query, includeWeb?, industrySectorId? }`. Grounded answer + `sources` + `llm` metadata |
| POST | `/api/ask` | Body: `{ query }`. Legacy simple search, top 25 full-text hits |
| POST | `/api/summarize` | Body: `{ query, excerpts[] }`. LLM/extractive summary (integrations) |
| POST | `/api/refresh` | Run ETL + **normalizeCorpus** + write JSON + reload server cache; returns **`formattingGuardrails`** |
| GET | `/article-suitable-recitals.json` | Editorial suitable-recitals map (from `data/`) |
| GET | `*` (non-file) | SPA fallback → `public/index.html` |

Static files under `public/` are served by Express.

---

## 10. Configuration

### 10.1 Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3847). |
| `NEWS_CRAWL_TIMEOUT_MS` | Timeout for crawl during `GET /api/news` (default `75000`). |
| `NEWS_REFRESH_TIMEOUT_MS` | Timeout for `POST /api/news/refresh` (default `120000`). |
| `NEWS_MERGE_CAP` | Max items returned from merged news list (default `520`). |
| `WEB_TIMEOUT_MS` | HTTP timeout for DuckDuckGo and fetched pages in Ask (default `12000`). |
| `WEB_MAX_RESULTS` | Max DuckDuckGo HTML results parsed (default `4`). |
| `WEB_MAX_PAGES` | Max pages to fetch for excerpts (default `3`). |
| `WEB_SNIPPET_CHARS` | Max chars per web excerpt (default `1400`). |
| `GDPR_ETL_PRIMARY` | `gdpr-info` (default) or `eur-lex` — which source fills `gdpr-content.json` on refresh first. |
| `MIN_GDPR_INFO_ARTICLES` | Minimum article count to accept GDPR-Info as primary (default `99`). |
| `MIN_GDPR_INFO_RECITALS` | Minimum recital count to accept GDPR-Info as primary (default `173`). |
| `GDPR_MAX_ARTICLE_CHARS` | Optional cap on stored article/recital body length (`scraper.js`; `0` or unset = no cap). |
| `GDPR_INFO_CONCURRENCY` | Parallel GDPR-Info fetches (default `6`). |
| `GDPR_FORCE_CORPUS_WRITE` / `GDPR_FORCE_RELOAD_CORPUS` | Set to `1` to force writing `gdpr-content.json` on next refresh even if hash unchanged. |
| `OPENAI_API_KEY` | OpenAI API key for summaries |
| `OPENAI_MODEL` | Optional; default `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `ANTHROPIC_MODEL` | Optional; default `claude-3-5-sonnet-20241022` |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_GEMINI_MODEL` | Optional; default `gemini-1.5-flash` |
| `GROQ_API_KEY` | Groq API key (primary Ask LLM) |
| `GROQ_MODEL` | Optional; one model or comma-separated list tried in order (defaults include `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, …) |
| `TAVILY_API_KEY` | Optional Tavily key: Ask falls back to Tavily search+answer if Groq fails |
| `TAVILY_SEARCH_DEPTH` | Optional: `basic`, `fast`, `advanced`, `ultra-fast` (default `advanced` for Ask fallback) |
| `TAVILY_INCLUDE_ANSWER` | Optional: `basic`, `advanced`, `true`, or `false` (default `advanced`) |
| `TAVILY_MAX_RESULTS` | Optional; default `6` |
| `TAVILY_INCLUDE_DOMAINS` | Optional comma-separated domains to bias search (e.g. `eur-lex.europa.eu,gdpr-info.eu`) |
| `MISTRAL_API_KEY` | Mistral API key |
| `MISTRAL_MODEL` | Optional; default `mistral-small-latest` |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Optional; default `anthropic/claude-3.5-sonnet` |
| `OPENROUTER_REFERRER` | Optional referrer for OpenRouter |
| `LLM_PROVIDER` | Force single provider: `openai`, `anthropic`, `gemini`, `groq`, `mistral`, `openrouter` |
| `OPENROUTER_REFERRER` | HTTP Referer sent to OpenRouter (default `http://localhost:3847`; set in production). |

Copy `.env.example` to `.env` and set keys as needed. When multiple keys are set and `LLM_PROVIDER` is not set, the server tries Anthropic first, then OpenAI, then the rest.

### 10.2 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | `prestart` copies `article-suitable-recitals.json` to `public/` if present; starts server; if `gdpr-content.json` is missing, runs scraper once. |
| `npm run refresh` | Run scraper only (`node server.js --refresh-only`), then exit. |
| `npm run fetch-suitable-recitals` | Run `scripts/fetch-article-suitable-recitals.js` to refresh editorial crossrefs (see script header). |

---

## 11. Quick start

1. **Install and run**
   ```bash
   cd gdpr-qa-platform
   npm install
   npm start
   ```
2. Open **http://localhost:3847** in a browser.
3. Click **Refresh sources** once to fetch the regulation (or rely on structure-only until then).
4. Use **Browse regulation** to read Recitals and Chapters/Articles (use the filter bar to narrow by Category, Sub-category, Chapter, or Article); in article/recital detail use Prev/Next or “Go” to jump to another provision. Or use **Ask a question** to search and get verbatim answers plus an optional Summary and a “Relevant articles & documents” list.
5. Open **Credible sources** to see all official and cited sources with direct document links.
6. Open **News** to see GDPR/data protection updates by source, with filters and three-paragraph summaries; use **Refresh news** to reload from the server.
7. (Optional) Set one or more LLM API keys (see `.env.example`) for AI-generated summaries grounded in the regulation text.

---

## 12. License and disclaimer

This project is for **reference only**. The GDPR text is from the official EU sources. Always verify against [gdpr-info.eu](https://gdpr-info.eu/), [EUR-Lex (Regulation (EU) 2016/679)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), and other credible resources (EDPB, European Commission, ICO, Council of Europe). The maintainers do not provide legal advice.
