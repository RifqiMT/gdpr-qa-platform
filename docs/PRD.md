# Product Requirements Document (PRD)  
## GDPR Q&A Platform

**Version:** 1.3  
**Last updated:** 2026-04 — Aligned with product documentation standard **v1.3**, expanded **News** ingestion (EDPB, EDPS, ICO, European Commission multi-feed Press Corner, Council of Europe), **`news-topics.js`** classification, configurable **`NEWS_*`** crawl and merge caps, and existing News UI (Quick filters dock, expandable feeds, client dedupe mirror).

---

## 1. Product overview

### 1.1 Purpose

A web application for **browsing and searching** the full text of the General Data Protection Regulation (EU) 2016/679 with **citations and links** to official EU sources. It provides:

- **Browse** — Recitals 1–173 and Articles 1–99 with topic-based filters (Category, Sub-category, Chapter, Article), document navigation (Prev/Next/Go), and PDF export.
- **Ask** — Natural-language questions answered via **`POST /api/answer`**: BM25 retrieval over the local corpus, optional live web snippets, synthesis with **Groq** (primary) or **Tavily** (fallback), or an **extractive** fallback if neither returns usable text. Answers use numbered citations `[S1]` mapped to regulation excerpts and optional web sources. Optional **industry / sector** framing (ISIC-aligned list) steers prompts. A **Relevant GDPR provisions** panel lists cited articles/recitals with “View in app.”
- **Credible sources** — One tab listing official and widely cited organizations (GDPR-Info, EUR-Lex, EDPB, EDPS, European Commission, ICO, GDPR.eu, Council of Europe) with direct document links.
- **News** — GDPR and data protection updates from **EDPB** (RSS + HTML listings), **EDPS** (RSS), **ICO** (UK) (search + sitemap + HTML), **European Commission** Press Corner (general + per-policy RSS and API, merged), and **Council of Europe** (RSS/HTML when available). Other national DPAs are out of scope except **ICO**. Items are grouped by **source** with **topic** tags (**`news-topics.js`**), filters, and card snippets; **deduplicated** (server **`dedupeNewsItemsConsolidated`** plus client **`news-dedupe.js`**). Main filter toolbar stays in **document flow**. On wide viewports, a **Quick filters** sidebar dock mirrors controls and persists expand/collapse in **`sessionStorage`**; **Official site & RSS** is similarly expandable. Users can toggle between **By source** and a blended **All** view (single chronological list across sources). **`GET /api/news`** uses **no-store** cache headers. List size is capped by **`NEWS_MERGE_CAP`** (default **6000**); optional **`NEWS_MAX_*`** / **`NEWS_COMMISSION_*`** and topic enrichment knobs tune crawl depth and coverage (see [VARIABLES.md](VARIABLES.md)).

Target: legal, compliance, and privacy professionals (and anyone) who need quick, sourced GDPR answers and updates without unsourced claims.

### 1.2 Goals

- Single source of truth: Ask answers are grounded in the **local regulation corpus** (default extraction **GDPR-Info**, optional **EUR-Lex** primary via configuration); corpus is normalized on every refresh and on every API load per **document formatting guardrails**.
- Traceability: every answer and summary ties back to specific Articles or Recitals with links to GDPR-Info and EUR-Lex.
- Reduced unsourced claims: Ask answers are constrained to retrieved sources; LLM outputs require per-sentence `[Sn]` citations where enforced by prompts and repair passes.
- Efficiency: browse by structure or ask in natural language; jump from Ask results to full article/recital in the app and back.
- Credible news: one place for GDPR-related updates from defined supervisory and official sources.
- No coding required: single Node.js server and browser.

### 1.3 Target users

- Legal and compliance professionals checking GDPR provisions.
- Data Protection Officers (DPOs) and privacy officers needing quick references and citations.
- Consultants and advisors preparing client-facing answers with official sources.
- Engineering and operations staff deploying the app, configuring ETL, and monitoring refresh health.
- Anyone needing to verify or cite the regulation text (e.g. developers, product managers).

---

## 2. User needs and problems

| Need | Problem addressed |
|------|-------------------|
| Find specific GDPR provisions quickly | Browse by Recitals/Chapters & Articles; filter by category, sub-category, chapter, article. |
| Ask questions in natural language | Ask tab with search; results show verbatim text and “View in app” to open the provision. |
| Get a concise summary without reading full text | Optional LLM summary (or extractive/client fallback) constrained to regulation text only. |
| Verify and cite official sources | Every view links to GDPR-Info and EUR-Lex; content as of date shown where applicable. |
| Stay updated on GDPR/news | News tab from EDPB, EDPS, ICO, Commission, Council of Europe with filters, topics, and summaries. |
| Access key documents from one place | Credible sources tab with direct links to guidelines and official pages. |
| Return to a clean starting view | Homepage: click logo to go to Browse tab with initial placeholder and sidebar reset. |
| Export a provision for offline use | Export current article or recital as PDF from Browse detail view. |

---

## 3. Functional requirements

### 3.1 Browse regulation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B1 | User can open Browse tab and see sidebar “Regulation & sources” with Recitals, Chapters & Articles, Credible sources. | Must |
| FR-B2 | User can open Recitals list and click a recital to view full text with citations and doc nav (Prev/Next/Go). | Must |
| FR-B3 | User can open Chapters & Articles with filter bar (Category, Sub-category, Chapter, Article); sub-category options adapt to selected chapter. | Must |
| FR-B4 | User can open an article or chapter and view full text; doc nav shows Prev/Next, label (e.g. Article 5 of 99), and number input with Go. | Must |
| FR-B5 | User can use “Back” to return to list; “Back to question” appears when document was opened from Ask (“View in app”). | Must |
| FR-B6 | User can export the current article or recital as PDF (client-side). | Must |
| FR-B7 | Clicking the “GDPR Q&A Platform” logo goes to homepage: Browse tab, initial placeholder, sidebar chapter list cleared. | Must |

### 3.2 Ask a question

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | User can enter a question and submit (button or Enter); the app calls **`POST /api/answer`** and displays a synthesized answer grounded in retrieved sources (not raw concatenation only). | Must |
| FR-A2 | Answer text exposes citation tokens `[S1]`, `[S2]`, … that map to regulation or web sources returned in the same response. | Must |
| FR-A3 | Results include **Relevant GDPR provisions** (regulation sources) with “View in app” per article/recital. | Must |
| FR-A4 | “View in app” switches to Browse tab and opens the corresponding article or recital; “Back to question” returns to Ask tab. | Must |
| FR-A5 | Each new question clears previous answer and panels; **content as of** date shown when `contentAsOf` is available. | Must |
| FR-A6 | User can optionally select an **industry / sector** (or General); the server resolves `industrySectorId` and applies sector lock-in rules in prompts when not General. | Should |
| FR-A7 | Status UI indicates whether the answer used **Groq**, **Tavily**, or **extractive** fallback (`llm` metadata). | Should |
| FR-A8 | **`POST /api/ask`** remains available for simple search-style results (legacy/programmatic); the Ask **tab** uses `/api/answer` only. | Must |
| FR-A9 | **`POST /api/summarize`** remains available for excerpt-based summaries (multi-provider); optional for integrations—current Ask tab does not require it. | Should |

### 3.3 Credible sources and News

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-S1 | User can open Credible sources tab and see all organizations with descriptions and document links (from /api/meta). | Must |
| FR-S2 | User can open News tab and see news grouped by source with three-paragraph summaries and topic tags. | Must |
| FR-S3 | User can filter News by Source and Topic; Clear filters resets both. | Must |
| FR-S4 | User can click “Refresh news” to call **`POST /api/news/refresh`** (persist merge to `gdpr-news.json`) and reload the list. | Must |
| FR-S5 | News items returned to the client are **deduplicated** after merge: normalized URL key first, then semantic merge by source + publication date + title fingerprint; **`mergeNewsDuplicate`** prefers canonical URLs and richer snippets when collapsing rows. | Must |
| FR-S6 | **`GET /api/news`** responses include **`Cache-Control: no-store, no-cache, must-revalidate`** and **`Pragma: no-cache`** so user agents do not treat merged news as a long-lived cache entry. | Must |
| FR-S7 | **Desktop (≥ ~1100px):** When the primary news filter panel leaves the main column viewport, a **Quick filters** region in the sidebar shows the same controls (search, source, topic, reset), stays in sync with the main panel, supports expand/collapse, and persists preference in **`sessionStorage`**. | Should |
| FR-S8 | The **Official site & RSS** feed list is **expandable/collapsible** with **`sessionStorage`** persistence so users can reclaim vertical space. | Should |
| FR-S9 | **Operators** may tune news **ingestion depth** and **Commission parallelism** via documented environment variables (**`NEWS_MAX_*`**, **`NEWS_COMMISSION_*`**) without code changes, subject to upstream site behavior and timeouts. | Should |

### 3.4 Content and refresh

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-R1 | User can click “Refresh sources” to run ETL; regulation text updated; “Content as of” / freshness shown in the UI. | Must |
| FR-R2 | Server may run optional daily refresh (cron 02:00 Europe/Brussels) using the same pipeline as the button. | Should |
| FR-R3 | If **`gdpr-content.json`** is missing on server start, an initial ETL run is attempted and the in-memory corpus is reloaded. | Should |
| FR-R4 | Server exposes **`GET /api/chapter-summaries`** and optional **`POST /api/chapter-summaries/regenerate`** (requires **`GROQ_API_KEY`**) for Chapter I–XI intro blurbs. | Should |
| FR-R5 | **`GET /api/industry-sectors`** serves the sector list for the Ask combobox. | Should |
| FR-R6 | Article and recital detail APIs return **`suitableRecitals`** / **`suitableArticles`** merged from editorial JSON and text-derived references (**`gdpr-crossrefs.js`**). | Should |
| FR-R7 | Every regulation refresh **must** run **`normalizeCorpus`** from **`document-formatting-guardrails.js`** before **`buildSearchIndex`** and before every write of **`gdpr-content.json`**; **`POST /api/refresh`** returns **`formattingGuardrails`** (validation + warnings). | Must |
| FR-R8 | After a successful refresh, the server **invalidates** the regulation content cache and **reloads** **`loadContent()`**; the client **reloads** meta, chapter list, recital list, credible sources, and re-opens the current article/recital when applicable. | Must |

### 3.5 Homepage and navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-H1 | “GDPR Q&A Platform” logo in header is a link; clicking it goes to homepage (Browse tab, placeholder, sidebar reset). | Must |
| FR-H2 | Tab navigation: Browse regulation, Ask a question, Credible sources, News; active tab and panels updated correctly. | Must |

---

## 4. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Runs on Node.js ≥18; single server process; default port 3847 (configurable via PORT). | Must |
| NFR-2 | Regulation content and structure stored in data/ (gdpr-structure.json, gdpr-content.json); data/ writable for refresh. | Must |
| NFR-3 | Frontend: vanilla HTML, CSS, JavaScript; no build step; static files served from public/. | Must |
| NFR-4 | CORS enabled; suitable for same-origin or controlled cross-origin use. | Must |
| NFR-5 | Accessibility: semantic HTML, ARIA for tabs/panels/filters, keyboard support (e.g. Enter in doc nav number). | Should |
| NFR-6 | LLM summaries optional; no secrets in repo; env vars for API keys (see README §10). | Must |
| NFR-7 | Document formatting behavior is governed by **[DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)**; new ETL or write paths must not skip **`normalizeCorpus`**. | Must |

---

## 5. Data model (summary)

- **gdpr-structure.json:** meta, categories, chapters[] (number, roman, title, articleRange, sourceUrl, eurLexUrl). Required for scraper.
- **gdpr-content.json:** **meta** (**lastRefreshed**, **lastChecked**, **etl**, **datasetHash**, **sources**, …), **categories**, **chapters[]**, **recitals[]**, **articles[]**, **searchIndex[]**. Produced by **`scraper.js`** after **`normalizeCorpus`** and **`buildSearchIndex`**.
- **gdpr-news.json:** newsFeeds[] (name, url, description), items[] (title, url, sourceName, sourceUrl, date, snippet, optional summaryParagraphs[], optional **commissionPolicyAreas**[] — Commission **policy area codes**, optional **topic** / **topicCategory** after server annotation). Optional; merged with crawled items from **`news-crawler.js`**, then passed through **`dedupeNewsItemsConsolidated`** on **`GET /api/news`** and after **`mergeNewsItems`** on refresh; written on **`POST /api/news/refresh`** (internal **store cap** may exceed **`NEWS_MERGE_CAP`** to retain history on disk). The browser loads **`public/news-dedupe.js`** and runs **`dedupeNewsItemsClient`** on render as a safety net against older payloads.
- **article-suitable-recitals.json:** editorial map `articles` keyed by article number → recital numbers; copied to `public/` on `npm start` (`prestart`).
- **chapter-summaries.json:** optional `{ summaries: { "1": "…", …, "11": "…" }, source, llm, generatedAt }`.
- **industry-sectors.json:** sector definitions (`public/industry-sectors.json`).

Full data flow: [README §4 – Logic and data flow](../README.md#4-logic-and-data-flow).

---

## 6. Success criteria

- Users can browse Recitals and Chapters & Articles with filters and doc nav, and export current provision as PDF.
- Users can ask questions and receive grounded answers with citations and relevant provisions; “View in app” and “Back to question” work correctly.
- Users can open Credible sources and News; News filters and Refresh news work; duplicate stories (alternate URLs) do not clutter the list; wide-layout users can use Quick filters when the main toolbar scrolls away; feed list can be collapsed; **News** reflects the current multi-source crawler (including EDPS and Commission multi-feed) and respects **`NEWS_MERGE_CAP`** on API responses.
- Users can go to homepage via logo and see initial Browse state with sidebar reset.
- Refresh sources updates regulation text; freshness metadata shown; **formatting guardrails** run and are observable via API; Browse/Ask use normalized corpus. Answers remain tied to returned **`sources`** and citation ids.

---

## 7. Out of scope

- User accounts, authentication, or multi-tenant hosting.
- Legal advice or interpretation; reference only; users must verify with official sources.
- Editing or annotating regulation text in the app.
- Real-time collaboration or versioning of content beyond refresh.
- Native mobile app; web only (responsive).

---

## 8. References

- Full product documentation: [README.md](../README.md)
- Product documentation standard: [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
- Documentation hub: [docs/README.md](README.md)
- User personas: [USER_PERSONAS.md](USER_PERSONAS.md)
- User stories: [USER_STORIES.md](USER_STORIES.md)
- Variables and relationships: [VARIABLES.md](VARIABLES.md)
- API contracts: [API_CONTRACTS.md](API_CONTRACTS.md)
- Guardrails: [GUARDRAILS.md](GUARDRAILS.md)
- Changelog: [CHANGELOG.md](../CHANGELOG.md)
