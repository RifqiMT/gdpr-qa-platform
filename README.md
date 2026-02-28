# GDPR Q&A Platform

**Product documentation · General Data Protection Regulation (EU) 2016/679**

| Version | Node | Description |
|---------|------|-------------|
| 1.0.0   | ≥ 18 | Browse and search GDPR with citations; optional LLM summaries; News by source/topic with filters; Credible sources tab. |

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

---

## 1. Product overview

The **GDPR Q&A Platform** is a web application that lets users **browse** and **search** the full text of the General Data Protection Regulation (EU) 2016/679 with **citations and links** to official EU sources. It provides verbatim regulation text for answers, optional AI-generated summaries grounded in that text, a **Credible sources** tab with direct links to official documents, and a **News** tab with GDPR and data protection updates from credible organizations—grouped by source and topic with filters and three-paragraph summaries per item. No coding is required to use the product; a single server and browser are enough.

| Aspect | Description |
|--------|-------------|
| **Purpose** | Reference and Q&A over the GDPR using credible, official text only; plus curated news from supervisory bodies and official sources. |
| **Users** | Legal, compliance, privacy professionals and anyone needing quick, sourced GDPR answers and updates. |
| **Content** | Recitals 1–173 and Articles 1–99 from EUR-Lex, with structure and links from GDPR-Info; news from EDPB, ICO, European Commission, Council of Europe. |
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

- **Single source of truth** — All displayed answer text comes from the regulation content fetched from EUR-Lex and stored locally; no unsourced claims.
- **Traceability** — Every answer and summary ties back to specific Articles or Recitals, with links to GDPR-Info and EUR-Lex.
- **Reduced hallucination** — Verbatim answers plus optional LLM summaries constrained to the provided text, with strict prompts and citation of provisions.
- **Data refresh without duplication** — On refresh, recitals and articles are deduplicated by number (last occurrence wins); existing content is merged with newly fetched data so the latest overwrites per provision. Search index is deduplicated by id.
- **Efficiency** — Browse by structure or ask in natural language; jump from Ask results to the full article/recital in the app and back.
- **Offline-capable content** — After a refresh, the regulation is stored in `data/gdpr-content.json` and can be searched without calling external sites on each request.
- **Export** — Export the currently viewed article or recital as PDF from the Browse view (client-side via html2pdf.js).
- **News from credible sources** — One place to see GDPR-related updates from EDPB, ICO, European Commission, and Council of Europe, with three-paragraph summaries and filters by source and topic.
- **Credible sources hub** — One tab listing all official and widely cited sources with direct links to key documents (EDPB guidelines, ICO guidance, Commission pages, etc.).

---

## 3. Features

### 3.1 Browse regulation

- **Sidebar** — Navigate by **Recitals** (1–173) or **Chapters & Articles** (11 chapters, Articles 1–99). Chapter list shows roman numerals, titles, and article ranges.
- **Recitals list** — Grid of recital cards; click to open full recital text in a detail view with formatted body and citation links.
- **Chapters list** — Per-chapter cards; “View articles” opens a list of articles for that chapter; click an article to open its full text (title, numbered points, recital references).
- **Detail view** — Full document view with “Art. X GDPR” style layout, separators, and “Back” to return to list. **Export PDF** exports the current article or recital.
- **Back to question** — When the user opened the document from Ask (“View in app”), a “Back to question” button appears to return to the Ask tab and scroll to results.
- **Citations** — Each view links to GDPR-Info and EUR-Lex for the relevant section.

### 3.2 Ask a question

- **Search input** — Free-text question (e.g. “What is personal data?”, “Right to erasure”). Submit via button or Enter.
- **Results layout** — Two-column on large screens:
  - **Left:** **Question / Answer** block (verbatim regulation text only) + list of **result cards** (one per matching article/recital), each with full text, sources, and “View in app”.
  - **Right:** **Summary** panel — short, concise overview (extractive or LLM-generated from the same credible text).
- **Question/Answer format** — Explicit “Question: …” and “Answer: …” using only excerpts from the API (no paraphrasing in the main answer block).
- **View in app** — From any result or the summary sources, open the corresponding article or recital in the Browse view.
- **Refresh on each ask** — Each new question clears previous results and summary and loads only that question’s answers and summary.

### 3.3 Credible sources

- **Sources tab** — Lists all credible organizations (GDPR-Info, EUR-Lex, EDPB, European Commission, ICO, GDPR.eu, Council of Europe) with short descriptions and direct links to key documents (guidelines, recitals, chapters, Commission pages, ICO guidance, etc.). Data comes from `GET /api/meta` (sources array).

### 3.4 Content and regulation refresh

- **Refresh sources** — Button triggers `POST /api/refresh`: fetches the latest regulation from EUR-Lex, parses recitals and articles, merges with existing data (no duplicates), builds the search index, and writes `data/gdpr-content.json`. Header shows last refreshed time.
- **Daily refresh** — Optional cron at 02:00 Europe/Brussels to re-run the scraper.
- **Credible sources** — Primary regulation text: [GDPR-Info](https://gdpr-info.eu/) and [EUR-Lex – Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). Additional credible resources linked in the Sources tab and footer; also in `/api/meta`.

### 3.5 News (GDPR from credible sources)

- **News tab** — Highlights GDPR and data protection news from credible sources. Each item links to the **original article** on the publisher’s site (traceable to source).
- **Grouping** — News is grouped **by source** (EDPB, ICO, European Commission, Council of Europe). Each section has a short plain-language summary describing that source’s role.
- **Three-paragraph summaries** — Each news card shows a **Summary** block with three paragraphs: (1) high-level summary of the item, (2) attribution to the source and link to full article, (3) relevance (e.g. GDPR compliance). Uses `summaryParagraphs` from data when present, otherwise built from snippet/title and standard sentences.
- **Topic tags** — Items are auto-tagged by topic (e.g. Rights (erasure & access), AI & digital, Enforcement & fines, Guidance & compliance, Transfers & BCR, International standards, Policy & publications, Children & privacy, General) derived from title/snippet; non‑“General” topics appear as tags on cards.
- **Filters** — **Source** dropdown (All sources / per-source) and **Topic** dropdown (All topics / per-topic). **Clear filters** resets both and re-applies so all items are shown. Filtering is client-side on the last loaded list (no extra network request).
- **Refresh news** — Button re-fetches `GET /api/news` and repopulates filters and sections.
- **Data** — `data/gdpr-news.json`: `newsFeeds[]` (links to each source’s news page) and `items[]` (curated items with title, url, sourceName, sourceUrl, date, snippet, optional `summaryParagraphs[]`, optional `topic`). Server merges static items with crawled items from `news-crawler.js` (EDPB RSS/HTML, ICO HTML); deduped by URL, sorted by date, capped (e.g. 60). If file is missing, default `newsFeeds` and empty items are used.
- **API** — `GET /api/news` returns `{ newsFeeds, items }` for the News tab.

### 3.6 Optional LLM summaries

- **Summary box** — When at least one LLM API key is set, the right-hand Summary (Ask tab) can be generated by an LLM instructed to use **only** the provided regulation excerpts (strict anti-hallucination).
- **Provider order** — Anthropic (Claude) → OpenAI → Google Gemini → Groq → Mistral → OpenRouter. First provider with a key is used; or set `LLM_PROVIDER` to force one.
- **Fallbacks** — If no key is set or the summarize API fails, an extractive summary (first sentences from top provision) or a client-side summary (`buildClientSummary`) is shown so the Summary box always has content when there are results.

---

## 4. Logic and data flow

### 4.1 Data sources and storage

- **gdpr-structure.json** — Static structure: `meta`, `categories`, `chapters` (roman numerals, titles, article ranges, source URLs). No full text; required for the scraper; used when `gdpr-content.json` is missing.
- **gdpr-content.json** — Produced by the scraper: `meta.lastRefreshed`, `categories`, `chapters`, `recitals[]`, `articles[]`, `searchIndex[]`. Recitals and articles contain full text; search index holds type, number, title, truncated text, and URLs for search. One entry per recital/article number after merge.
- **gdpr-news.json** — Optional: `newsFeeds[]` (name, url, description per source) and `items[]` (title, url, sourceName, sourceUrl, date, snippet, optional `summaryParagraphs[]` of three strings). Served and merged with crawled items by `GET /api/news`.

### 4.2 Scraper (`scraper.js`)

- Fetches EUR-Lex HTML (or TXT fallback), strips scripts/styles/nav, normalizes text.
- **Recitals** — Splits on “(Recital N)”, extracts body, keeps numbers 1–173. Uses a **Map** keyed by number so the **last occurrence wins** (no duplicates).
- **Articles** — Splits on “Article N”, extracts title and body, maps to chapters via fixed article ranges, caps body length. Uses a **Map** keyed by number so the **last occurrence wins** (no duplicates).
- **Merge with existing** — If `gdpr-content.json` exists, it is loaded and merged with newly fetched recitals/articles by number. For each number, the **newly fetched data overwrites** the existing one; numbers only in the existing file are kept. Result: one entry per recital/article number, with latest data from the refresh.
- **Search index** — Built from the merged recitals and articles; deduplicated by `id` (e.g. `recital-5`, `article-5`) so the index has no duplicate entries.
- **Exports** — `run`, `fetchUrl`, `parseEurLexText`, `buildSearchIndex`, `mergeWithExisting`.

### 4.3 News crawler (`news-crawler.js`)

- **Sources** — EDPB RSS (`feed/publications_en`), EDPB news page (HTML), ICO news page (HTML). Timeout per crawl (e.g. 25s); overall `crawlNews()` timeout (e.g. 30s in server).
- **Output** — Items with `title`, `url`, `sourceName`, `sourceUrl`, `date`, `snippet` (from RSS description when available). Deduped by URL, sorted by date descending, capped (e.g. 60).
- **Merge in server** — `GET /api/news` reads `gdpr-news.json` for `newsFeeds` and static `items`; runs `crawlNews()` (with timeout); merges crawled + static by URL (static can fill gaps); sorts by date and limits (e.g. 60); returns `{ newsFeeds, items }`. On crawl failure, returns static items only.

### 4.4 Server (`server.js`)

- **loadContent()** — Reads `gdpr-content.json` if present, else `gdpr-structure.json`; fallback to empty meta/categories/chapters/articles/recitals/searchIndex.
- **Search** — `simpleSearch(query, index)`: tokenize query, score by term match (title +2), sort by score, top 25. `/api/ask` resolves full text from `articles`/`recitals` for each result.
- **Summarize** — `/api/summarize`: if excerpts length > 0, try LLM then extractive; on error return 200 with extractive/safe fallback.
- **Refresh** — `POST /api/refresh` runs scraper, then returns success/lastRefreshed.
- **News** — `GET /api/news`: load news file, crawl news (with timeout), merge and return `{ newsFeeds, items }`.

### 4.5 Frontend (Ask flow)

- On Ask submit: clear overall answer and summary panels; show “Searching…”.
- `POST /api/ask` with current query → receive `results` and `queryUsed`.
- Left: render “Question: queryUsed” and “Answer:” from concatenated full excerpts; source line; “View in app” links per provision.
- Right: show Summary panel; `POST /api/summarize` with `queryUsed` and top excerpts; on success show summary; on failure show `buildClientSummary(queryUsed, results)`.
- “View in app” (`a.app-goto-doc`): set `cameFromAsk = true`, switch to Browse tab, call `openRecital(number)` or `openArticle(number)`. “Back to question”: switch back to Ask tab, scroll to results.

### 4.6 Frontend (Browse flow)

- Recitals / Chapters loaded from `/api/recitals`, `/api/chapters` (and `/api/chapters/:number` for article list).
- Article/recital detail from `/api/articles/:number`, `/api/recitals/:number`; rendered with numbered points and recital refs (`formatRecitalRefs`). PDF export via html2pdf.js on the current detail node.
- Tab switching: `data-view="browse"` | `data-view="ask"` | `data-view="sources"` | `data-view="news"`; views shown/hidden and `aria-selected` updated.

### 4.7 Frontend (Sources and News flow)

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
- **Accessibility** — Tabs and panels use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`; buttons and filters have `aria-label` where needed; news filter group has `aria-label="Filter news"`.

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
├── server.js              # Express app: API routes, LLM summarize, refresh, news merge, cron, static serve
├── scraper.js             # EUR-Lex fetch, parse recitals/articles, mergeWithExisting, buildSearchIndex
├── news-crawler.js        # EDPB RSS/HTML, ICO HTML; crawlNews(), withTimeout; returns items for merge
├── package.json           # Scripts, dependencies, engines (node >=18)
├── package-lock.json      # Lockfile
├── .env.example           # Optional env vars for LLM and PORT
├── README.md              # This file
├── data/
│   ├── gdpr-structure.json   # Static: meta, categories, chapters (required for scraper)
│   ├── gdpr-content.json     # Generated: recitals, articles, searchIndex, meta (after refresh)
│   └── gdpr-news.json        # Optional: newsFeeds[], items[] (static; merged with crawl in API)
└── public/
    ├── index.html         # Single-page UI: header, tabs (Browse / Ask / Credible sources / News), footer
    ├── styles.css         # Layout, typography, components, news filters/sections/summaries, responsive
    └── app.js             # API client; Browse; Ask; Sources (loadSources); News (loadNews, filters, renderNewsSections, getThreeParagraphSummary, getTopicFromItem); PDF; View in app; Back to question
```

### Key source files

| File | Responsibility |
|------|----------------|
| **server.js** | `loadContent`, REST API (meta, categories, chapters, articles, recitals, ask, summarize, refresh, **news**), `simpleSearch`, LLM providers (OpenAI, Anthropic, Gemini, Groq, Mistral, OpenRouter), extractive `buildSummaryFromExcerpts`, cron, static serve, SPA fallback. News: read gdpr-news.json, call `crawlNews()` with timeout, merge by URL, return `{ newsFeeds, items }`. |
| **scraper.js** | `fetchUrl`, `parseEurLexText` (recitals + articles from EUR-Lex), `buildSearchIndex` (dedupe by id), `mergeWithExisting` (by number, new overwrites), `run()` (load existing, fetch, merge, write). |
| **news-crawler.js** | `crawlNews()` (EDPB RSS, EDPB HTML, ICO HTML); `fetchRss`, `crawlEdpbRss`, `crawlEdpbHtml`, `crawlIco`; `withTimeout`. Returns items with title, url, sourceName, sourceUrl, date, snippet. |
| **public/index.html** | Markup: header (logo, lastRefreshed, Refresh), tabs (Browse, Ask, Credible sources, News), Browse (sidebar, placeholder, recitals list, chapters list, detail + citations, Back / Back to question / Export PDF), Ask (query input, askResults grid: overallSummary + resultsList, askSummaryPanel), Sources (sourcesList), News (newsFeedsList, news filters: newsFilterSource, newsFilterTopic, newsFilterClear, newsSections), footer, html2pdf.js script, app.js. |
| **public/app.js** | `get`/`post`, DOM refs, setMeta/loadMeta, tab switching, showSection, loadRecitals/loadChapters, openRecital/openArticle, citation links, Export PDF (html2pdf), app-goto-doc handler, escapeHtml/formatRecitalRefs, buildClientSummary, doAsk. **Sources:** loadSources (GET /api/meta → render source cards). **News:** loadNews (GET /api/news → lastNewsItems, populateNewsFilters, applyNewsFilters), renderNewsSections (by source, SOURCE_SUMMARIES, getTopicFromItem, getThreeParagraphSummary), applyNewsFilters (filter lastNewsItems by source/topic), populateNewsFilters (dropdowns), NEWS_TOPIC_ORDER, SOURCE_SUMMARIES. |
| **public/styles.css** | Variables, reset, layout (header, tabs, main), sidebar, content-panel, detail-actions, placeholder, doc-grid, detail-view, qa-* and summary-in-plain-language, ask-results-grid, result-card, **news-filters, news-by-source, news-card-summary, news-topic-tag**, source-card, responsive and print. |
| **data/gdpr-structure.json** | Static: meta.sources, categories, chapters[1–11] with number, roman, title, articleRange, sourceUrl, eurLexUrl. |
| **data/gdpr-news.json** | Optional: newsFeeds[], items[] (title, url, sourceName, sourceUrl, date, snippet, optional summaryParagraphs[], optional topic). |
| **.env.example** | Commented env vars: PORT, OPENAI_*, ANTHROPIC_*, GOOGLE_GEMINI_*, GROQ_*, MISTRAL_*, OPENROUTER_*, LLM_PROVIDER. |

---

## 9. API reference (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/meta` | Last refreshed timestamp, source list (for header and Credible sources tab) |
| GET | `/api/news` | News feeds and items (static + crawled merge); for News tab and filters |
| GET | `/api/categories` | Categories (e.g. Recitals, Chapters & Articles) |
| GET | `/api/chapters` | All chapters |
| GET | `/api/chapters/:number` | One chapter with its articles |
| GET | `/api/articles` | All articles |
| GET | `/api/articles/:number` | One article with chapter info |
| GET | `/api/recitals` | All recitals |
| GET | `/api/recitals/:number` | One recital with source URLs |
| POST | `/api/ask` | Body: `{ query }`. Returns `{ query, results[] }` with full-text excerpts. |
| POST | `/api/summarize` | Body: `{ query, excerpts[] }`. Returns `{ query, summary }`. |
| POST | `/api/refresh` | Run scraper; returns `{ success, lastRefreshed, message }`. |
| GET | `*` | Serves `public/index.html` (SPA fallback). |

---

## 10. Configuration

### 10.1 Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3847) |
| `OPENAI_API_KEY` | OpenAI API key for summaries |
| `OPENAI_MODEL` | Optional; default `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `ANTHROPIC_MODEL` | Optional; default `claude-3-5-sonnet-20241022` |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_GEMINI_MODEL` | Optional; default `gemini-1.5-flash` |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Optional; default `llama-3.1-70b-versatile` |
| `MISTRAL_API_KEY` | Mistral API key |
| `MISTRAL_MODEL` | Optional; default `mistral-small-latest` |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Optional; default `anthropic/claude-3.5-sonnet` |
| `OPENROUTER_REFERRER` | Optional referrer for OpenRouter |
| `LLM_PROVIDER` | Force single provider: `openai`, `anthropic`, `gemini`, `groq`, `mistral`, `openrouter` |

Copy `.env.example` to `.env` and set keys as needed. When multiple keys are set and `LLM_PROVIDER` is not set, the server tries Anthropic first, then OpenAI, then the rest.

### 10.2 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server; if `gdpr-content.json` is missing, runs scraper once. |
| `npm run refresh` | Run scraper only (`node server.js --refresh-only`), then exit. |

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
4. Use **Browse regulation** to read Recitals and Chapters/Articles, or **Ask a question** to search and get verbatim answers plus an optional Summary.
5. Open **Credible sources** to see all official and cited sources with direct document links.
6. Open **News** to see GDPR/data protection updates by source, with filters and three-paragraph summaries; use **Refresh news** to reload from the server.
7. (Optional) Set one or more LLM API keys (see `.env.example`) for AI-generated summaries grounded in the regulation text.

---

## 12. License and disclaimer

This project is for **reference only**. The GDPR text is from the official EU sources. Always verify against [gdpr-info.eu](https://gdpr-info.eu/), [EUR-Lex (Regulation (EU) 2016/679)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), and other credible resources (EDPB, European Commission, ICO, Council of Europe). The maintainers do not provide legal advice.
