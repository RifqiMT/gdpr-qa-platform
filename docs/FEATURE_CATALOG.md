# Feature catalog  
## EU Regulation Q&A Platform

**Version:** 1.6 · **Last updated:** 2026-07-06 · **Product version:** `package.json` **1.2.4** · Documentation standard **v2.3**

This catalog is the **feature-level inventory** of the shipped product. For requirements and acceptance criteria, see [PRD.md](PRD.md) and [USER_STORIES.md](USER_STORIES.md). For implementation mapping, see [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## 1. Platform shell

| Feature ID | Name | Description | Primary surfaces |
|------------|------|-------------|------------------|
| F-SHELL-01 | Regulation switcher | Header dropdown: **GDPR** \| **EU AI Act** \| **EU Data Act**; persists in browser storage. | `index.html`, `app.js`, `GET /api/regulations` |
| F-SHELL-02 | Tab navigation | Browse · Ask · Credible sources · News. | `index.html`, `app.js` |
| F-SHELL-03 | Refresh sources | ETL for **active** regulation only. | Header button, `POST /api/refresh` |
| F-SHELL-04 | Freshness tooltip | Last refreshed / check timestamps for corpus. | `GET /api/meta`, freshness UI |
| F-SHELL-05 | API keys (BYOK) | Browser-stored Groq/Tavily override for Ask. | Header modal, `gdpr-qa-byok-v1` |
| F-SHELL-06 | Homepage (logo) | Resets Browse to placeholder; clears reader state. | `goToHome()` in `app.js` |
| F-SHELL-07 | App credits bar | Maintainer attribution; LinkedIn and website icon links. | `.app-credits` in `index.html` |
| F-SHELL-08 | Regulation-aware citation sidebar | Browse detail panels sync via `citationsUi` + `syncCitationSidebarChrome`. | `#citationsSidebar`, `regulation-profiles.js` |
| F-SHELL-09 | Responsive app chrome | Sticky `#appChrome`; Tools menu; 1-column toolbar ≤899px; `--app-chrome-height` via `ResizeObserver`. | `index.html`, `styles.css`, `initHeaderActionsToggle` |
| F-SHELL-10 | Toolbar live status hints | Freshness + API key subtitles in Tools rows (`syncHeaderToolbarStatus`); no duplicate status strip. | `#headerFreshnessHint`, `#headerApiKeysHint`, `app.js` |
| F-SHELL-11 | Compact mobile tabs | Short tab labels; pill container; horizontal scroll. | `.tabs`, `.tab-label--short` |

---

## 2. Browse regulation

| Feature ID | Name | GDPR | EU AI Act | EU Data Act | Notes |
|------------|------|------|-----------|-------------|-------|
| F-BRW-01 | Recitals list | ✓ | ✓ | ✓ | Search by number/keyword; card grid |
| F-BRW-02 | Chapters & articles | ✓ | ✓ | ✓ | Grouped by chapter; roman numerals |
| F-BRW-03 | Category filter | ✓ | — | — | Chapter-title as category |
| F-BRW-04 | Sub-category filter | ✓ | Hidden | Hidden | Topic keywords (`ARTICLE_TOPICS`) |
| F-BRW-05 | Chapter / article filters | ✓ | ✓ | ✓ | Combobox filters |
| F-BRW-06 | Reader detail view | ✓ | ✓ | ✓ | Formatted body, official links |
| F-BRW-07 | Doc navigation | ✓ | ✓ | ✓ | Prev / Next / Go (number input) |
| F-BRW-08 | Export PDF | ✓ | ✓ | ✓ | html2pdf.js client-side |
| F-BRW-09 | Related articles/recitals | ✓ | Partial | Partial | Text citations; no suitable-recital map |
| F-BRW-10 | Suitable recitals panel | ✓ | — | — | `article-suitable-recitals.json` + API |
| F-BRW-11 | Chapter introductions | ✓ | ✓ | ✓ | `chapter-summaries*.json`; Groq regenerate |
| F-BRW-12 | Back to question | ✓ | ✓ | ✓ | From Ask → Browse → return to Ask |
| F-BRW-13 | Regulation-aware links | ✓ | ✓ | ✓ | `regulation-profiles.js` URLs and headings |
| F-BRW-14 | Correct article display titles | ✓ | ✓ | ✓ | GDPR: canonical map; AI/Data Act: corpus `title` only |
| F-BRW-15 | Recital display titles | ✓ | ✓ | ✓ | `getRecitalDisplayTitle`, `parseRecitalTopicTitle` |
| F-BRW-16 | Numbered/lettered paragraph reader | ✓ | ✓ | ✓ | ETL + guardrails + `renderManualNumberedParagraphs` |
| F-BRW-17 | Regulation-aware citation sidebar | ✓ | ✓ | ✓ | `citationsUi`; official + related panel copy |
| F-BRW-18 | Full long article titles (non-GDPR) | — | ✓ | ✓ | No 120-char fallback in `getArticleDisplayTitle` |
| F-BRW-19 | Browse welcome overview | ✓ | ✓ | ✓ | `browseUi`; themed description + tags + EUR-Lex |
| F-BRW-20 | Desktop 3-column regulation hub | ✓ | ✓ | ✓ | `#browseWelcomeGrid`; order GDPR · Data Act · AI Act |
| F-BRW-21 | Chapters filter reliability | ✓ | ✓ | ✓ | `resetChaptersFilters`; hidden GDPR topic filter guard |
| F-BRW-22 | Mobile collapsible chapter filters | ✓ | ✓ | ✓ | `#chaptersFiltersToggle`; active-filter banner |

---

## 3. Ask a question

| Feature ID | Name | Description |
|------------|------|-------------|
| F-ASK-01 | Natural-language Q&A | `POST /api/answer` with BM25 local context + optional web + Groq/Tavily/extractive |
| F-ASK-02 | Citation chips `[S#]` | Regulation chips open Browse; web chips open URLs |
| F-ASK-03 | Relevant provisions panel | Lists regulation sources from answer; regulation-labeled |
| F-ASK-04 | Industry / sector (ISIC) | Optional sector framing in prompts and BM25 expansion |
| F-ASK-05 | Regulation-scoped prompts | `buildAnswerPrompt(query, sources, sector, reg)` |
| F-ASK-06 | Regulation-scoped web search | DuckDuckGo + Tavily prefixes per `regulationSearchContext` |
| F-ASK-07 | Layperson explain mode | Skips web for some general explain queries; tighter length rules |
| F-ASK-08 | LLM status chip | Groq / Tavily / extractive + model name |
| F-ASK-09 | BYOK | `apiKeys` in body; `POST /api/validate-api-keys` |
| F-ASK-10 | Legacy search API | `POST /api/ask` token search (integrations) |
| F-ASK-11 | Dynamic Ask copy | Placeholders, hero, signals via `askUi` in profiles |

---

## 4. Credible sources

| Feature ID | Name | Description |
|------------|------|-------------|
| F-SRC-01 | Regulation-scoped catalog | `GET /api/meta?regulation=` → `meta.sources[]` |
| F-SRC-02 | Source cards | Name, description, document link lists |
| F-SRC-03 | Dynamic header copy | `sourcesUi` in `regulation-profiles.js` |
| F-SRC-04 | Summary blurbs | `SOURCE_SUMMARIES` in `app.js` for known orgs |

---

## 5. News

| Feature ID | Name | Description |
|------------|------|-------------|
| F-NEWS-01 | Multi-source aggregation | EDPB, EDPS, ICO (UK), Commission, CoE (+ EU Digital Strategy AI link in feeds list) |
| F-NEWS-02 | Topic taxonomy | `news-topics.js` groups incl. **EU Artificial Intelligence Act** |
| F-NEWS-03 | Source / topic filters | Client-side on `lastNewsItems` |
| F-NEWS-04 | By source / All views | Segmented toggle; chronological **All** mode |
| F-NEWS-05 | URL + semantic dedupe | Server + `news-dedupe.js` client mirror |
| F-NEWS-06 | Refresh news | `POST /api/news/refresh` → `gdpr-news.json` |
| F-NEWS-07 | Attachments discovery | Per-article scan; batch summary hides empty actions |
| F-NEWS-08 | Quick filters dock | Desktop sidebar when main filters scroll away |
| F-NEWS-09 | Regulation relevance filter | When `ai-act` or `data-act` selected: `itemMatchesNewsRegulationScope` + banner |
| F-NEWS-10 | Three-paragraph summaries | Card summary blocks from data or heuristics |
| F-NEWS-11 | Responsive news hero | Compact bar; collapsible details ≤899px; `newsUi` themes; 1-column intro/scope panels; stats strip. | `#newsHero`, `syncNewsHeroChrome`, `initNewsHeroDetails` |

---

## 6. Content pipeline (ETL)

| Feature ID | Name | GDPR | EU AI Act | EU Data Act |
|------------|------|------|-----------|-------------|
| F-ETL-01 | Scraper ETL | `scraper.js` | `ai-act-scraper.js` | `data-act-scraper.js` |
| F-ETL-02 | Formatting guardrails | `document-formatting-guardrails.js` | Same | Same |
| F-ETL-03 | Search index build | BM25 `searchIndex[]` | Same | Same |
| F-ETL-04 | Merge with existing | Per-number last-wins | Same | Same |
| F-ETL-05 | CLI refresh | `npm run refresh` | `npm run refresh-ai-act` | `npm run refresh-data-act` |
| F-ETL-06 | Vercel cron | `api/cron/daily-regulation-refresh.js` | All three regulations |

---

## 7. Deployment and operations

| Feature ID | Name | Description |
|------------|------|-------------|
| F-OPS-01 | Local Node server | `npm start` port **3847** |
| F-OPS-02 | Vercel serverless | `api/index.js`, `vercel.json` |
| F-OPS-03 | Ephemeral data on Vercel | `GDPR_DATA_DIR` / `/tmp` seed from bundled `data/` |
| F-OPS-04 | Health check | `GET /health` |
| F-OPS-05 | CORS | Enabled for API consumers |

---

## 8. Feature ↔ persona matrix (summary)

| Persona | Browse | Ask | Sources | News |
|---------|--------|-----|---------|------|
| Legal / Compliance | ●●● | ●●● | ●● | ●● |
| DPO | ●● | ●●● | ●● | ●●● |
| AI governance lead | ●●● | ●●● | ●●● | ●● (filtered) |
| Consultant | ●● | ●●● | ● | ●● |
| Engineering / DevOps | ● | ● (BYOK) | — | ● (tuning) |

Legend: ● = primary · ●● = frequent · ●●● = core workflow

---

## See also

- [README.md](../README.md) — operator handbook  
- [PRD.md](PRD.md) — formal requirements  
- [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) — runbooks and incidents
