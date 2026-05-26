# EU Regulation Q&A Platform

**Product documentation · GDPR (EU 2016/679) and EU AI Act (EU 2024/1689)**

| Version | Node | Description |
|---------|------|-------------|
| 1.1.0   | ≥ 18 | **Dual-regulation** browse and Ask: **GDPR** (99 articles, 173 recitals) and **EU AI Act** (113 articles, 180 recitals). Header regulation switcher; regulation-scoped APIs (`?regulation=`). **Ask** via BM25 + Groq/Tavily with `[S1]` citations; **BYOK** keys; optional ISIC sector framing; **News** (GDPR/data-protection feeds; AI Act–relevant filter when AI Act selected); regulation-aware **Credible sources**; chapter summaries; PDF export; **Vercel** deploy. **Product documentation standard v1.7** ([PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md)). |

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

**Documentation index:** [PRODUCT_DOCUMENTATION_STANDARD.md](PRODUCT_DOCUMENTATION_STANDARD.md) (**v1.7**) · [docs/README.md](docs/README.md) (full doc map) · [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) · [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) · [docs/BUSINESS_GUIDELINES.md](docs/BUSINESS_GUIDELINES.md) · [docs/TECH_GUIDELINES.md](docs/TECH_GUIDELINES.md).

**Deep dives:** [docs/VARIABLES.md](docs/VARIABLES.md) (data dictionary + relationship diagrams) · [docs/DATA_SCHEMA_EXAMPLES.md](docs/DATA_SCHEMA_EXAMPLES.md) (sample JSON shapes) · [docs/METRICS_AND_OKRS.md](docs/METRICS_AND_OKRS.md) · [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) · [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) · [docs/GLOSSARY.md](docs/GLOSSARY.md) · [docs/GUARDRAILS.md](docs/GUARDRAILS.md) · [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/FEATURE_CATALOG.md](docs/FEATURE_CATALOG.md) · [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) · [docs/SOURCE_CODE_INVENTORY.md](docs/SOURCE_CODE_INVENTORY.md) · [CHANGELOG.md](CHANGELOG.md).

**Source refresh & reader formatting:** [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md) — contract between `gdpr-content.json`, `scraper.js`, `document-formatting-guardrails.js`, and `public/app.js`. **Refresh sources** always runs server-side guardrail normalization before writing the corpus.

---

## 1. Product overview

The **EU Regulation Q&A Platform** is a web application for **browsing** and **asking questions** about EU regulations using **local corpora**, **official links**, and **grounded LLM synthesis**. Users select a regulation in the header (**GDPR** or **EU AI Act**); all Browse, Ask, and Credible sources flows follow that selection. **Ask** retrieves regulation excerpts (BM25), optionally fetches **web snippets**, and synthesizes answers with **Groq** (primary) or **Tavily** (fallback), with citations **`[S1]`, `[S2]`, …** tied to sources. Optional **industry / sector** (ISIC) framing applies to both regulations. **News** aggregates GDPR and data-protection headlines (with an **AI Act relevance filter** when EU AI Act is selected). No coding is required for end users.

| Aspect | Description |
|--------|-------------|
| **Purpose** | Reference and Q&A over **GDPR** and **EU AI Act** using credible official text; curated supervisory news; traceable citations. |
| **Users** | Legal, compliance, privacy, and AI governance professionals; DPOs; consultants; engineers operating the stack. |
| **Regulations** | **GDPR** — 173 recitals, 99 articles ([gdpr-info.eu](https://gdpr-info.eu/), EUR-Lex 2016/679). **EU AI Act** — 180 recitals, 113 articles ([ai-act-law.eu](https://ai-act-law.eu/), EUR-Lex 2024/1689). |
| **Deployment** | Node.js locally (port **3847**); **Vercel** serverless — [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md). |
| **News scope** | EDPB, EDPS, ICO (UK), European Commission, Council of Europe, EU Digital Strategy (AI policy link). Not a dedicated AI Act-only news crawler. |

### Knowledge sources (credible organizations)

| Source | URL | Role |
|--------|-----|------|
| **GDPR-Info** | [gdpr-info.eu](https://gdpr-info.eu/) | Regulation text and structure (unofficial, widely cited) |
| **EUR-Lex** | [Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) | Official EU publication of the Regulation |
| **EDPB** | [edpb.europa.eu](https://edpb.europa.eu/) | European Data Protection Board – guidelines and consistency |
| **EDPS** | [edps.europa.eu](https://www.edps.europa.eu/) | European Data Protection Supervisor – EU institutions and bodies |
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
- **Sector-aware Ask** — Optional industry/sector filter expands BM25/web/Tavily context, adds **customization + reliability** instructions in prompts (verbatim sector phrase, sustained sector hooks per sentence, no invented sector statutes), slightly lower LLM temperature, stronger sector repair passes, and a sector-framed extractive fallback.
- **Cross-references** — Articles show merged “suitable” recitals (editorial map + recitals that cite the article); recitals show related articles.
- **News from credible sources** — One place to see GDPR-related updates from EDPB, EDPS, ICO (UK), European Commission, and Council of Europe, with summaries and filters by source and topic. Users can switch between **By source** and a blended **All** view (single chronological list across sources). **Refresh news** can load many more items than a single RSS page (still capped by `NEWS_MERGE_CAP`, default 6000).
- **Credible sources hub** — One tab listing all official and widely cited sources with direct links to key documents (EDPB guidelines, ICO guidance, Commission pages, etc.).
- **Bring your own key (BYOK)** — Operators and power users can supply **Groq** and **Tavily** API keys in the browser (header **API keys**), validate them before save, and override server `.env` keys for Ask without redeploying the Node process.

---

## 3. Features

### 3.1 Browse regulation (GDPR or EU AI Act)

- **Regulation switcher** — Header **Regulation** dropdown (`gdpr` | `ai-act`) persists in **`localStorage`** (`gdpr-qa-regulation-v1`). Browse labels, filters, reader headings, and external links update via **`public/regulation-profiles.js`** and **`syncRegulationChrome()`**.
- **Homepage** — Clicking the **“EU Regulation Q&A Platform”** logo resets Browse to the placeholder (recitals, chapters & articles, credible sources) and clears the reader sidebar.
- **Browse segments** — **Recitals** (GDPR 1–173; AI Act 1–180) and **Chapters & articles** (GDPR: 11 chapters, Articles 1–99; AI Act: 13 chapters, Articles 1–113). Chapter list shows roman numerals, titles, and article ranges.
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
- **Industry / sector** — Optional **searchable combobox** (`GET /api/industry-sectors` + `industry-sector-tree.json`): with the tree, the dropdown uses **grouped browse** (expand macro industry → ISIC section → short labels for whole section or divisions); **typing** switches to a **flat filtered list** of full paths for quick lookup. Without the tree file, the list stays a flat section/division catalog. **General** means no sector lock-in; other selections require the model to include a **verbatim phrase** from the sector definition when supported by sources.
- **Relevant GDPR provisions** — Aside lists regulation `sources` returned with the answer (articles/recitals), each with “View in app”.
- **Refresh on each ask** — Each new question clears the previous answer, citations panel, and relevant-provisions list.
- **Legacy search API** — **`POST /api/ask`** still returns simple token-scored matches (full-text excerpts) for scripts or integrations; the Ask **tab** does not use it.

#### 3.2.1 API keys (BYOK)

- **Header control** — **API keys** opens a modal to enable **Use my API keys for Ask**, enter **Groq** (primary LLM) and **Tavily** (fallback) keys, **Save keys**, **Check validity**, or **Clear saved keys**.
- **Storage** — Keys persist in **`localStorage`** under **`gdpr-qa-byok-v1`** (`useOwnKeys`, `groqApiKey`, `tavilyApiKey`). They are **not** written to the server `.env` file.
- **Runtime** — When BYOK is enabled and keys are present, **`POST /api/answer`** includes `apiKeys: { groqApiKey?, tavilyApiKey? }`. Non-empty client keys **override** server environment keys for that request. Response **`llm.byokGroq`** / **`llm.byokTavily`** indicate which credentials were used.
- **Validation** — **Check validity** calls **`POST /api/validate-api-keys`** (Groq models endpoint; Tavily minimal search). Results render in an animated status panel (valid / invalid / skipped per provider).
- **Status** — The Ask tab shows whether **server** or **BYOK** keys are active (`GET /api/meta` + local settings).

### 3.3 Credible sources

- **Sources tab** — **`GET /api/meta?regulation=`** returns **`meta.sources`** for the **active regulation** (from corpus or structure fallback).
- **GDPR** — GDPR-Info, EUR-Lex, EDPB, EDPS, European Commission (data protection), ICO (UK), GDPR.eu, Council of Europe.
- **EU AI Act** — AI Act Law, EUR-Lex 2024/1689, European Commission AI regulatory framework (from **`ai-act-structure.json`**).
- **UI** — Title, intro, and card descriptions sync on regulation change (`syncAskSourcesNewsChrome`).

### 3.4 Content and regulation refresh

- **Refresh sources** — **`POST /api/refresh`** with **`regulation`** runs ETL for the **selected** regulation only:
  - **GDPR:** **`scraper.js`** → **`data/gdpr-content.json`**
  - **EU AI Act:** **`ai-act-scraper.js`** → **`data/ai-act-content.json`**
- **Pipeline** — **`document-formatting-guardrails.js`** **`normalizeCorpus`**, **`validateCorpusFormatting`**, **`buildSearchIndex`**, disk write, **`invalidateRegulationContentCache`**, client reload. See [docs/DOCUMENT_FORMATTING_GUARDRAILS.md](docs/DOCUMENT_FORMATTING_GUARDRAILS.md).
- **GDPR primary source** — **`GDPR_ETL_PRIMARY=gdpr-info`** (default) or **`eur-lex`**.
- **AI Act primary source** — [ai-act-law.eu](https://ai-act-law.eu/) article/recital pages (`ai-act-scraper.js`).
- **Force write** — **`GDPR_FORCE_CORPUS_WRITE=1`** / **`AI_ACT_FORCE_CORPUS_WRITE=1`** when hashes unchanged.
- **Daily refresh** — Local cron (Europe/Brussels 02:00) or Vercel **`/api/cron/daily-regulation-refresh`** (both regulations).
- **CLI** — **`npm run refresh`** (GDPR); **`npm run refresh-ai-act`** (AI Act).

### 3.5 News (GDPR & data protection; AI Act filter)

- **News tab** — Aggregates GDPR and data-protection headlines from EU/UK supervisory and Commission sources. Each item links to the **original article** on the publisher’s site.
- **EU AI Act selected** — Hero copy and an info **banner** explain scope; the list is **filtered client-side** for AI governance relevance (AI Act, high-risk AI, GPAI, biometrics, overlapping privacy/AI topics). Full corpus remains available when **GDPR** is selected.
- **Grouping** — News is grouped **by source** (EDPB, EDPS, ICO, European Commission, Council of Europe). Each section has a short plain-language summary describing that source’s role.
- **Three-paragraph summaries** — Each news card shows a **Summary** block with three paragraphs: (1) high-level summary of the item, (2) attribution to the source and link to full article, (3) relevance (e.g. GDPR compliance). Uses `summaryParagraphs` from data when present, otherwise built from snippet/title and standard sentences.
- **Topic tags** — Items get a **`topic`** (and **`topicCategory`**) from **`news-topics.js`**: grouped areas such as **Core Rights**, **AI and Emerging Tech**, **Data Transfers**, **Enforcement and Compliance**, **Processing Concepts**, **Sector-Specific Areas**, **Cybersecurity**, and **Oversight Areas**, each with specific leaf labels (e.g. Standard contractual clauses, DPIA, Lead authority processes). Classification uses title, snippet, and URL. The catch‑all **Other GDPR & data protection topics** is hidden on cards to reduce noise. The taxonomy also acts as a **supplemental relevance anchor** in **`newsItemMatchesApprovedTopic`** (with a data-protection context check) so niche phrasing from existing feeds can still pass the gate.
- **Filters** — **Source** dropdown (All sources / per-source) and **Topic** dropdown with **optgroups** mirroring those categories (All topics / per leaf topic). **Clear filters** resets both and re-applies so all items are shown. Filtering is client-side on the last loaded list (no extra network request). The main filter card sits **above** the article list in normal document flow (no sticky overlap with cards).
- **Desktop scroll affordance (≥1100px)** — When the main filter toolbar scrolls out of the **`.main`** viewport, a **Quick filters** card appears in the **left column** under “Official site & RSS”: expandable header (chevron), active-filter **badge**, search + source + topic + reset, synced with the main controls. **Session** remembers collapsed/expanded state (`sessionStorage`). **Official site & RSS** is also **expandable/collapsible** (same session persistence) to save vertical space in the sidebar.
- **Deduplication** — **`news-crawler.js`** merges items by normalized URL, then by **semantic key** (source + date + normalized title fingerprint) so the same story under different URLs (e.g. EDPS news stub vs publications URL) collapses to one row. **`server.js`** runs **`dedupeNewsItemsConsolidated`** on `GET /api/news` and after **`mergeNewsItems`**. **`public/news-dedupe.js`** mirrors that logic in the browser so the UI stays clean even if an older server binary or cached JSON still contained duplicates.
- **Refresh news** — Button calls **`POST /api/news/refresh`**, which crawls sources, merges with existing JSON, writes `data/gdpr-news.json` (subject to internal storage cap), then reloads the UI from the response.
- **Data** — `data/gdpr-news.json`: `newsFeeds[]` and `items[]` (title, url, sourceName, sourceUrl, date, snippet, optional `summaryParagraphs[]`, optional `commissionPolicyAreas`, optional **`topic`** / **`topicCategory`** after refresh). Server merges static items with crawled items from `news-crawler.js`; **URL + semantic dedupe**, sorted by date, capped by `NEWS_MERGE_CAP` (response) and a higher cap when persisting on refresh. If file is missing, default feeds apply. Optional topic-enrichment is bounded by `NEWS_TOPIC_ENRICH_*` and is **best-effort** (source-dependent).
- **API** — `GET /api/news` returns `{ newsFeeds, items, topicTaxonomy }` with **`Cache-Control: no-store, no-cache, must-revalidate`** and **`Pragma: no-cache`** to reduce stale JSON in browsers; optional query **`?live=1`** merges a live crawl within `NEWS_CRAWL_TIMEOUT_MS`. `POST /api/news/refresh` returns merged items, **`topicTaxonomy`**, and persistence metadata. **Attachments** calls `POST /api/news/article-attachments` with JSON `{ "url": "<article URL>" }` and **falls back to** `GET ?url=` if POST fails (older proxies / hosts). **`POST /api/news/attachments-summary`** with `{ "urls": [ … ] }` returns `{ items: [{ url, count }] }` (deduped, capped) so the UI can **hide the Attachments button** when `count === 0`. Load the UI from the **same origin** as `server.js` (`npm start`, e.g. port 3847), or set **`<meta name="gdpr-api-base" content="https://your-api-host">`** in `index.html` when the static UI and API are on different origins (CORS is enabled on the server).

### 3.6 Optional LLM summaries (`POST /api/summarize`)

- **Purpose** — Excerpt-based summaries for integrations: body `{ query, excerpts[] }`, multi-provider order controlled by `LLM_PROVIDER` and available API keys (Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter).
- **Ask tab** — The main Ask experience uses **`/api/answer`** only; it does **not** call `/api/summarize`. Summaries in the old two-column “verbatim + summary” layout are **not** the current primary UX.

---

## 4. Logic and data flow

### 4.1 Data sources and storage

| File | Regulation | Role |
|------|------------|------|
| **`gdpr-structure.json`** / **`gdpr-content.json`** | GDPR | Structure + full corpus (99 articles, 173 recitals); ETL via **`scraper.js`**. |
| **`ai-act-structure.json`** / **`ai-act-content.json`** | EU AI Act | Structure + full corpus (113 articles, 180 recitals); ETL via **`ai-act-scraper.js`**. |
| **`lib/regulations.js`** | Both | Registry: ids, CELEX, paths, chapter ranges, feature flags (`hasArticleTopics`, `hasSuitableRecitals`). |
| **`lib/regulation-content.js`** | Both | **`loadContent(regId)`**, cache, **`parseRegulationId`**, refresh orchestration. |
| **`gdpr-news.json`** | News (shared) | `newsFeeds[]`, `items[]`; merged with **`news-crawler.js`**; topics via **`news-topics.js`**. |
| **`article-suitable-recitals.json`** | GDPR only | Editorial article→recital map for crossrefs. |
| **`chapter-summaries.json`** / **`chapter-summaries-ai-act.json`** | Per regulation | Chapter intro blurbs for Browse. |
| **`public/regulation-profiles.js`** | Both | Per-regulation UI copy (Ask, Sources, News, reader URLs). |

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

- **Sources** — EDPB RSS, EDPB paginated news HTML, **EDPS news RSS** (`feed/news_en`) with URL resolution from feed HTML, ICO (**Umbraco search API** + sitemap gap fill + HTML fallback), Commission **general + per-policy** press RSS (batched) + thematic Press Corner API, CoE RSS/HTML (subject to site availability). Optional env vars tune depth (see `.env.example`). National DPAs other than **ICO (UK)** are intentionally excluded from News and Credible sources.
- **Output** — Items with `title`, `url`, `sourceName`, `sourceUrl`, `date`, `snippet`, optional **`commissionPolicyAreas`**, and **`topic` / `topicCategory`** from **`news-topics.js`**. **`dedupeNewsItemsConsolidated`**: first pass by **`normalizeNewsUrlKey`**, second pass by **source + date + title fingerprint**; **`mergeNewsDuplicate`** prefers canonical URLs (e.g. EDPS publications path over `/press-news/news/` stub) and richer snippets, and merges topic fields. Sorted by date descending; filtered by **`newsItemMatchesApprovedTopic`** (includes optional **topic-taxonomy anchor** pass).
- **Merge in server** — `readNewsFilePayload` + **`dedupeNewsItemsConsolidated`** on every **`GET /api/news`**; **`mergeNewsItems`** (static + crawl) ends with the same dedupe. `POST /api/news/refresh` uses **`NEWS_REFRESH_TIMEOUT_MS`**, writes merged items to disk (higher internal cap), returns fresh list.

### 4.5 Server (`server.js`)

- **loadContent(regId)** — Reads **`gdpr-content.json`** or **`ai-act-content.json`** via **`lib/regulation-content.js`** (mtime-cached), applies **`normalizeCorpus`**, rebuilds **`searchIndex`**. **`contentFor(req)`** / **`parseRegulationId(req)`** select corpus from query/body **`regulation`** (default `gdpr`).
- **Regulation-aware Ask web context** — **`regulationSearchContext(reg)`** biases DuckDuckGo and Tavily queries for GDPR vs AI Act; **`fetchWebSnippets(query, reg)`**, **`answerWithTavily(..., reg)`**.
- **invalidateRegulationContentCache()** / **runRegulationScraperAndReloadContent()** — After ETL, clears the in-memory corpus cache and reloads from disk (**`POST /api/refresh`**, daily cron, initial missing-file refresh).
- **Cross-references** — `gdpr-crossrefs.js`: build map of recitals citing articles; merge with `article-suitable-recitals.json` for `suitableRecitals` / `suitableArticles` on article and recital GET routes.
- **BM25** — `buildBm25Searcher` over `searchIndex` for `buildLocalContext` (Ask). Legacy **`simpleSearch`** still powers **`POST /api/ask`**.
- **`POST /api/answer`** — Composes local + optional web sources, calls Groq with `buildAnswerPrompt`, optional sector enforcement and citation repair passes, then Tavily, then `buildSummaryFromExcerpts` extractive fallback.
- **`POST /api/summarize`** — Multi-provider LLM + extractive fallback (see §3.6).
- **Refresh** — **`POST /api/refresh`** runs **`runRegulationScraperAndReloadContent()`** (scraper + cache bust + **`loadContent`**); returns **`formattingGuardrails`**. Chapter summaries: **`GET` / `POST /api/chapter-summaries*`**.
- **Industry sectors** — `GET /api/industry-sectors` reads `public/industry-sectors.json` and, when present, `public/industry-sector-tree.json` (cached); response is `{ sectors, tree }` or a legacy array.

### 4.6 Frontend (Ask flow)

- On Ask submit: clear answer HTML, status, citations panel, relevant provisions; show loading state.
- `POST /api/answer` with `query`, `includeWeb: true`, `industrySectorId`, and **`regulation`** (from header via **`mergeRegulationBody`**).
- **`syncAskSourcesNewsChrome`** updates Ask hero, placeholders, relevant-provisions labels, and sector explainer when regulation changes.
- Render answer via `formatAnswerHtml` (citation chips, optional markdown-style `**bold**` callouts).
- `renderRelevantProvisionsFromAnswer` fills the aside from regulation sources.
- “View in app” (`a.app-goto-doc`): set `cameFromAsk = true`, switch to Browse, `openArticle` / `openRecital`. “Back to question” returns to Ask.

### 4.7 Frontend (Browse flow)

- Recitals / Chapters loaded from `/api/recitals`, `/api/chapters`, `/api/articles`. Chapters view builds `__chaptersData` (chapters, articles, articleTopics, topicIdsByChapter), populates Category, Sub-category, Chapter, Article dropdowns, and applies filters via `applyChaptersFilters()` (including topic filter). Section headers use `.chapters-group-heading` and `.chapters-group-meta` (centered). Chapter detail uses `.chapter-view-header` (centered horizontally and vertically with flexbox, min-height 140px).
- **Homepage** — `goToHome()` (triggered by logo link click): switch to Browse tab if not already active; show `browsePlaceholder`, hide all browse sections (recitals, chapters, sources, detail); hide Back, Export PDF, Back to question; clear `currentDoc` and `lastListSection`; clear `chapterList.innerHTML` so the sidebar “Regulation & sources” shows only the original three nav items (Recitals, Chapters & Articles, Credible sources) with no chapter list below.
- Article/recital detail from **`/api/articles/:number`**, **`/api/recitals/:number`**; articles use **`fmtArticleLine`** (citations + footnote stripping; parenthetical “(Recital N)” removed); recital bodies use **`fmtRecitalLine`** where cross-recital refs are highlighted. **Doc navigation**: **`updateDocNav()`** shows Prev/Next, label (e.g. “Article 5 of 99”), number input and “Go” (**`goToDocNumber`**); Enter in the number input triggers Go. PDF export via **html2pdf.js** on the current detail node.
- Tab switching: `data-view="browse"` | `data-view="ask"` | `data-view="sources"` | `data-view="news"`; views shown/hidden and `aria-selected` updated.

### 4.8 Frontend (Sources and News flow)

- **Sources** — `loadSources()` → **`GET /api/meta`** (regulation-scoped); cards use **`SOURCE_SUMMARIES`** fallbacks for known org names.
- **News** — `loadNews()` → **`GET /api/news`** (not regulation-scoped on API); **`itemMatchesNewsRegulationScope`** filters when AI Act selected; **`applyNewsFilters`** applies source/topic/search on top. Dedupe via **`news-dedupe.js`**; expandable feeds sidebar; Quick filters dock on desktop scroll.

---

## 5. Business guidelines

- **Use for reference only** — The platform is a convenience tool. For legal certainty, always verify against the official [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) and [GDPR-Info](https://gdpr-info.eu/) sources.
- **No legal advice** — The app does not provide legal advice. Users are responsible for their own interpretation and compliance.
- **Credible sources only** — Answer text is limited to the regulation content from EUR-Lex; LLM summaries are constrained to that same text to avoid hallucination. News is limited to defined credible sources (EDPB, EDPS, ICO (UK), European Commission, Council of Europe); other national supervisory authorities are excluded except ICO.
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
├── lib/
│   ├── regulations.js        # Regulation registry (gdpr, ai-act)
│   ├── regulation-content.js # loadContent, parseRegulationId, ETL orchestration
│   └── paths.js              # data dir; Vercel /tmp handling
├── scraper.js                # GDPR ETL → gdpr-content.json
├── ai-act-scraper.js         # EU AI Act ETL → ai-act-content.json
├── api/
│   ├── index.js              # Vercel serverless entry
│   └── cron/daily-regulation-refresh.js  # Both regulations
├── public/regulation-profiles.js  # Per-regulation UI copy and URLs
├── document-formatting-guardrails.js  # Corpus normalization + validation on every refresh (see docs/DOCUMENT_FORMATTING_GUARDRAILS.md)
├── news-crawler.js           # News crawl; used by GET/POST news routes
├── news-topics.js            # News topic taxonomy, classification, supplemental crawl gate
├── gdpr-crossrefs.js         # Article↔recital suitability helpers
├── package.json              # prestart, start, refresh, fetch-suitable-recitals
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
├── CHANGELOG.md
├── PRODUCT_DOCUMENTATION_STANDARD.md
├── docs/                     # PRD, personas, stories, variables, data schema examples, metrics, design, traceability, guardrails, API, architecture, formatting guardrails, README
├── scripts/
│   └── fetch-article-suitable-recitals.js
├── data/
│   ├── gdpr-structure.json / gdpr-content.json
│   ├── ai-act-structure.json / ai-act-content.json
│   ├── gdpr-news.json
│   ├── article-suitable-recitals.json   # GDPR only
│   ├── chapter-summaries.json
│   └── chapter-summaries-ai-act.json
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── news-dedupe.js            # Client mirror of server news dedupe (loaded before app.js)
    ├── industry-sectors.json
    ├── industry-sector-tree.json # ISIC Rev.4 macro industry → section → division group → division (Ask UI)
    └── article-suitable-recitals.json  # Copy from data/ (prestart)
```

### Key source files

| File | Responsibility |
|------|----------------|
| **server.js** | `loadContent`; BM25 (`buildBm25Searcher`, `buildLocalContext`); `POST /api/answer` (Groq, Tavily, extractive); `POST /api/ask`, `POST /api/summarize`; article/recital routes with `suitableRecitals` / `suitableArticles`; chapter summaries; industry sectors; news merge/refresh; cron; static. |
| **gdpr-crossrefs.js** | `buildRecitalsCitingArticlesMap`, `mergedSuitableRecitalsForArticle`, `mergedSuitableArticlesForRecital`. |
| **scraper.js** | EUR-Lex fetch/parse, merge, **`document-formatting-guardrails.js`** normalization, `buildSearchIndex`, write `gdpr-content.json`. |
| **document-formatting-guardrails.js** | On every refresh: line endings, NBSP→space, EUR-Lex glue fixes; validation report (Art. 1, 4, 89, counts). |
| **news-crawler.js** | `crawlNews`, `dedupeNewsItemsConsolidated`, `normalizeNewsUrlKey`, semantic merge, `withTimeout`, topic assignment via **`news-topics.js`**. |
| **news-topics.js** | GDPR/privacy news topic groups, `classifyNewsItemTopic`, `assignNewsTopicFields`, `getTopicTaxonomyForClient`, supplemental **`newsBlobMatchesTopicAnchor`** gate. |
| **public/news-dedupe.js** | Browser **`GDPR_NEWS_DEDUPE.dedupeNewsItemsConsolidated`** (keep aligned with crawler). |
| **public/app.js** | Browse (filters, doc nav, cross-links, chapter summaries); **Ask:** `doAsk` → `/api/answer` + BYOK (`withByokApiKeys`, validation UI); Sources; News (dedupe client, expandable feeds + sidebar filters, IO dock); PDF; homepage. |
| **public/styles.css** | Design tokens, layout, reader, Ask citation chips, **BYOK validation panel**, news layout, sidebar Quick filters card, feeds section toggle, print/PDF hooks. |
| **data/article-suitable-recitals.json** | `articles` map for editorial suitable recitals per article. |
| **.env.example** | `PORT`, web/news tuning, LLM keys, `LLM_PROVIDER`. |

---

## 9. API reference (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness probe (`ok` plain text) |
| GET | `/api/regulations` | List available regulations (`gdpr`, `ai-act`) with limits and flags |
| GET | `/api/meta` | Freshness, `byokSupported`, server/BYOK Groq/Tavily flags, `sources[]` — **`?regulation=`** |
| POST | `/api/validate-api-keys` | Validate Groq/Tavily keys in body (`apiKeys`); keys not stored |
| GET | `/api/news` | `{ newsFeeds, items }` merged static + crawl (capped) |
| POST | `/api/news/refresh` | Full crawl, merge, write `gdpr-news.json`, return fresh items |
| GET/POST | `/api/news/article-attachments` | Attachment links for one allowlisted article URL |
| POST | `/api/news/attachments-summary` | Batch attachment counts (up to 96 URLs) |
| GET | `/api/categories` | Categories — **`?regulation=`** |
| GET | `/api/chapters` | All chapters (+ source URLs) — **`?regulation=`** |
| GET | `/api/chapters/:number` | One chapter with articles |
| GET | `/api/chapter-summaries` | Chapter I–XI intro strings + metadata |
| POST | `/api/chapter-summaries/regenerate` | Regenerate summaries with Groq (requires key); writes JSON |
| GET | `/api/articles` | All articles |
| GET | `/api/articles/:number` | One article + `chapter`, `contentAsOf`, **`suitableRecitals`** |
| GET | `/api/recitals` | All recitals |
| GET | `/api/recitals/:number` | One recital + URLs, `contentAsOf`, **`suitableArticles`** |
| GET | `/api/industry-sectors` | Sector list + optional ISIC tree for Ask (`{ sectors, tree }` or array) |
| POST | `/api/answer` | Body: `{ query, includeWeb?, industrySectorId?, apiKeys?, regulation? }`. Grounded answer + `regulationId` + `sources` + `llm` |
| POST | `/api/ask` | Body: `{ query, regulation? }`. Legacy simple search |
| POST | `/api/summarize` | Body: `{ query, excerpts[] }`. LLM/extractive summary (integrations) |
| POST | `/api/refresh` | ETL for **`regulation`** in body/query; returns **`formattingGuardrails`** |
| GET | `/article-suitable-recitals.json` | Editorial suitable-recitals map (from `data/`) |
| GET | `*` (non-file) | SPA fallback → `public/index.html` |

Static files under `public/` are served by Express.

---

## 10. Configuration

### 10.1 Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3847`). |
| `HOST` | Bind address (default: `0.0.0.0`). |
| `NEWS_CRAWL_TIMEOUT_MS` | Timeout for crawl during `GET /api/news` (default `90000`). |
| `NEWS_REFRESH_TIMEOUT_MS` | Timeout for `POST /api/news/refresh` (default `180000`). |
| `NEWS_MERGE_CAP` | Max items returned from merged news list after dedupe (default `6000`). |
| `NEWS_ATTACHMENTS_CACHE_TTL_MS` | TTL for cached HTML attachment scans (default `900000`). |
| `NEWS_ATTACHMENTS_CACHE_MAX` | Max entries in the attachments cache (default `150`). |
| `NEWS_MAX_EDPB_PAGES` | Max EDPB news listing pages to crawl (optional; see `news-crawler.js`). |
| `NEWS_MAX_ICO_SEARCH_PAGES` | Max ICO search API pages (optional). |
| `NEWS_MAX_ICO_SITEMAP_FETCHES` | Cap on ICO sitemap follow-up fetches (optional). |
| `NEWS_MAX_HTML_LINKS_PER_SOURCE` | Max harvested links per HTML listing source (optional). |
| `NEWS_COMMISSION_RSS_CONCURRENCY` | Parallel Commission RSS/API batch size (optional). |
| `NEWS_COMMISSION_RSS_PAGE_SIZE` | Commission RSS `pagesize` parameter, clamped in code (optional). |
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
| `LLM_PROVIDER` | Force single provider: `openai`, `anthropic`, `gemini`, `groq`, `mistral`, `openrouter` |
| `OPENROUTER_REFERRER` | HTTP Referer sent to OpenRouter (default `http://localhost:3847`; set in production). |

Copy `.env.example` to `.env` and set keys as needed. When multiple keys are set and `LLM_PROVIDER` is not set, the server tries Anthropic first, then OpenAI, then the rest.

**BYOK (browser):** Users may instead open **API keys** in the header, save Groq/Tavily keys locally, and enable **Use my API keys for Ask**. Keys are sent to the server only when asking questions (or validating); they are never committed to the repository. See [docs/VARIABLES.md](docs/VARIABLES.md) §4.1 and [docs/GUARDRAILS.md](docs/GUARDRAILS.md) **BG-08** / **TG-LLM-03**.

### 10.2 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | `prestart` copies `article-suitable-recitals.json` to `public/` if present; starts server; if `gdpr-content.json` is missing, runs scraper once. |
| `npm run refresh` | Run GDPR scraper only (`node server.js --refresh-only`), then exit. |
| `npm run refresh-ai-act` | Run `ai-act-scraper.js` for EU AI Act corpus. |
| `npm run fetch-suitable-recitals` | Run `scripts/fetch-article-suitable-recitals.js` to refresh editorial crossrefs (see script header). |
| `npm run vercel-build` | Pre-deploy copy of recitals map into `public/` (used by Vercel `buildCommand`). |

### 10.3 Deploy to Vercel

1. Connect the GitHub repo to Vercel (root = this folder).
2. Set environment variables: `GROQ_API_KEY`, `CRON_SECRET`, optional `TAVILY_API_KEY`, `OPENROUTER_REFERRER` = production URL.
3. Deploy; `vercel.json` routes all pages to the Express app and schedules daily regulation ETL.

Full steps, limits, and cron auth: **[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)**.

---

## 11. Quick start

1. **Install and run**
   ```bash
   cd gdpr-qa-platform
   npm install
   npm start
   ```
2. Open **http://localhost:3847** in a browser.
3. Choose **GDPR** or **EU AI Act** in the header **Regulation** dropdown.
4. Click **Refresh sources** to update the selected regulation corpus (bundled JSON is used until then).
5. Use **Browse** for recitals and chapters/articles (GDPR: category + sub-category filters; AI Act: chapter/article filters). Use Prev/Next or **Go** in the reader.
6. Use **Ask a question** for grounded answers with **`[S#]`** citations and **Relevant provisions** (regulation-aware).
7. Open **Credible sources** for official links for the active regulation.
8. Open **News** for supervisory headlines (AI-filtered when EU AI Act is selected); **Refresh news** reloads feeds.
9. (Optional) Set **GROQ_API_KEY** / **TAVILY_API_KEY** in `.env` or use header **API keys** (BYOK).

---

## 12. License and disclaimer

This project is for **reference only**. Regulation text is sourced from official EU publications and widely used readable layouts ([GDPR-Info](https://gdpr-info.eu/), [AI Act Law](https://ai-act-law.eu/), [EUR-Lex](https://eur-lex.europa.eu/)). Always verify against the official instruments: Regulation (EU) 2016/679 and Regulation (EU) 2024/1689. The maintainers do not provide legal advice.
