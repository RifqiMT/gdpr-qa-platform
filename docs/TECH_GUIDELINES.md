# Technical guidelines  
## EU Regulation Q&A Platform

**Version:** 1.6  
**Audience:** Engineering, DevOps, security review  
**Status:** Active · Documentation standard **v2.3** · Product **1.2.4** · **Last updated:** 2026-07-06

---

## 1. Architecture principles

| Principle | Implementation |
|-----------|----------------|
| **Single codebase, multi-regulation** | `lib/regulations.js` registry; `loadContent(regId)` in `lib/regulation-content.js`. |
| **No frontend build** | Vanilla JS/CSS in `public/`; Express static + SPA fallback. |
| **Corpus on disk** | JSON in `data/`; normalized on every refresh and read. |
| **Stateless API** | Regulation choice via query/body; client persists selection in `localStorage`. |
| **LLM optional** | Extractive fallbacks when Groq/Tavily absent. |

---

## 2. Regulation selection contract

**Server:** `parseRegulationId(req)` reads `?regulation=` or `body.regulation`; default `gdpr`.

**Client:** `currentRegulation.id`; `appendRegulationParam()` on GET; `mergeRegulationBody()` on POST refresh/answer/ask.

**Excluded from regulation param:**

- `/api/regulations`, `/api/news*`, `/api/industry-sectors`, `/api/validate-api-keys`

---

## 3. ETL guidelines

| Regulation | Script | Output | Primary source |
|------------|--------|--------|----------------|
| GDPR | `scraper.js` | `gdpr-content.json` | `GDPR_ETL_PRIMARY` (`gdpr-info` default) |
| AI Act | `ai-act-scraper.js` | `ai-act-content.json` | `ai-act-law.eu` |
| Data Act | `data-act-scraper.js` | `data-act-content.json` | `data-act-law.eu` |

**Mandatory:** Run `document-formatting-guardrails.js` `normalizeCorpus` before index build and disk write (**all** regulation paths).

**Refresh API:** `POST /api/refresh` with `{ regulation: "gdpr" | "ai-act" | "data-act" }`.

**CLI:** `npm run refresh`, `npm run refresh-ai-act`, `npm run refresh-data-act`.

**Cron:** `api/cron/daily-regulation-refresh.js` refreshes **GDPR, AI Act, and Data Act** when `CRON_SECRET` is set on Vercel.

**Shared HTML extraction:** `scraper.js` exports `getGdprInfoEntryPlainText` (used by AI Act and Data Act scrapers) for `span.actlist-number`, nested `<ol>/<li>`, and paragraph splits. Regulation scrapers call **`joinBodyLines()`** so numbered and lettered blocks retain blank-line boundaries in JSON.

---

## 3.1 Browse display titles (frontend)

| Function | Rule |
|----------|------|
| **`getArticleDisplayTitle(art)`** | If `getRegProfile().id === 'gdpr'`, prefer **`CANONICAL_ARTICLE_TITLES[art.number]`**, else trimmed **`art.title`** with GDPR-only malformed-title guards (length &gt; 120, recital-prefixed junk). **AI Act / Data Act:** always use full corpus **`art.title`** (no length cap). |
| **`getRecitalDisplayTitle(r)`** | Prefer **`parseRecitalTopicTitle(r.title)`**; else corpus title; reject Directive-prefixed junk. |
| **`stripLeadingArticleHeadingFromBody`** | Removes duplicate heading lines from body before structure detection; uses regulation-specific prefixes from **`regulation-profiles.js`**. |

**Regression test:** After any change to title helpers, open **Art. 10** on GDPR, AI Act, and Data Act — three **different** official short titles must appear. For Data Act, also verify **Art. 4** and **Art. 33** show **full** long titles (not “Article 4”).

### 3.2 Citation sidebar (Browse detail)

| Function / artifact | Rule |
|---------------------|------|
| **`citationsUi`** | Per-regulation panel titles, HTML leads, toggle `aria-label`s in **`regulation-profiles.js`**. |
| **`syncCitationSidebarChrome(reg)`** | Called from **`syncRegulationChrome`**; updates `#citationOfficialLead`, `#relatedArticlesTitleLabel`, `#relatedRecitalsTitleLabel`, leads, and badge ARIA. |
| **`relatedPanelBadgeAriaLabel`** | Uses **`legalLabel`** (e.g. “Data Act”) for count badges — never hardcode “GDPR”. |

**Regression test:** Select EU Data Act → open any article → sidebar must say “Related **Data Act** articles” and link to **data-act-law.eu**, not GDPR-Info.

---

## 4. Ask pipeline (technical)

1. `buildLocalContext(data, query, sector)` — BM25 over `searchIndex`.  
2. Optional `fetchWebSnippets(query, reg)` — DuckDuckGo + page text; regulation suffix in query.  
3. `answerWithGroq(query, sources, sector, key, reg)` — `buildAnswerPrompt` uses `reg.legalLabel`.  
4. `answerWithTavily(query, sector, key, reg)` — Tavily prefix from `regulationSearchContext`.  
5. `buildSummaryFromExcerpts` — extractive fallback with regulation label.

**BYOK:** `resolveLlmKeys(req)` merges body `apiKeys` over `.env`.

---

## 5. News pipeline (technical)

- **Storage:** `data/gdpr-news.json` (feeds + items).  
- **Classification:** `news-topics.js` (includes **EU Artificial Intelligence Act** and **EU Data Act** categories).  
- **Dedupe:** `dedupeNewsItemsConsolidated` server + `news-dedupe.js` client.  
- **Regulation UI filters:** `itemMatchesNewsRegulationScope` in `app.js` when `ai-act` or `data-act` selected (client-side, not server-side).

---

## 6. Security

| Topic | Guideline |
|-------|-----------|
| **Secrets** | `.env` only; never commit; BYOK keys only in browser `localStorage`. |
| **Cron** | `Authorization: Bearer ${CRON_SECRET}` on Vercel cron route. |
| **Attachments** | Allowlisted domains for news article HTML fetch. |
| **CORS** | Enabled on Express; restrict origins in production if needed. |
| **User-Agent** | Identified fetcher for web snippets (`GDPR-QA-Platform/1.0`). |

---

## 7. Performance

| Path | Target | Knobs |
|------|--------|-------|
| Browse GET | < 200 ms (local, warm cache) | In-memory `loadContent` cache |
| Ask POST | 2–15 s (LLM) | `includeWeb: false` for faster tests |
| News refresh | Up to `NEWS_REFRESH_TIMEOUT_MS` (180s default) | Reduce crawl env caps |
| Vercel | Cold start + `/tmp` seed | Bundle `data/` in deployment |

**Guardrail:** Avoid >10% regression on Browse list render without profiling ([README](../README.md) performance note).

---

## 8. Responsive app chrome (frontend)

| Concern | Implementation |
|---------|----------------|
| **Breakpoint** | `max-width: 899px` — sticky `#appChrome`, collapsible `#headerActionsPanel`, compact tab labels. |
| **Chrome height** | `ResizeObserver` on `#appChrome` → CSS variable `--app-chrome-height` for `--reading-pane-max-h`. |
| **Status without duplication** | `syncHeaderToolbarStatus()` updates `#headerFreshnessHint` / `#headerApiKeysHint` only; full freshness in tooltip; Ask narrative on `#askLlmKeysStatus`; no `#headerStatusStrip` (**BG-13**). |
| **News hero** | `newsUi` in `regulation-profiles.js`; `syncNewsHeroChrome`, `initNewsHeroDetails`, `updateNewsHeroStats`; `.news-detail-grid` single column on small viewports. |
| **Init** | `initHeaderActionsToggle()` from `app.js` DOM ready; re-run height sync on panel toggle and window resize. |

Do not add a second always-visible status row in the header — extend the Tools subtitles or existing tab copy instead.

---

## 8b. Browse welcome and chapters filters

| Concern | Implementation |
|---------|----------------|
| **Desktop hub** | `initBrowseWelcomeGrid()` builds three cards from `REGULATION_PROFILES` (`BROWSE_WELCOME_GRID_ORDER`: gdpr, data-act, ai-act). |
| **Mobile solo** | `syncBrowseWelcomeSolo(reg)` updates `#browseWelcome` for active regulation only. |
| **Quick actions** | **Chapters** = `btn-primary` + `data-browse-quick="chapters"`; **Recitals** = secondary. |
| **Regulation switch** | `setCurrentRegulation` → `resetChaptersFilters()` when id changes; clears hidden GDPR topic filters. |
| **Sub-category guard** | `getChaptersFilterSubcategoryValue()` returns `''` when `!hasArticleTopics`. |
| **Load races** | `loadChaptersRequestId` + `currentRegulation.id` check before applying `__chaptersData`. |
| **Mobile filters** | `#chaptersFiltersPanel` collapsed by default ≤899px; `#chaptersActiveFilters` shows applied filters. |

Copy for welcome cards lives in **`browseUi`** — keep in sync with [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) §2.2.1.

---

## 9. Code conventions

- Match existing **vanilla JS** style in `app.js` (IIFE, `function` declarations).  
- Regulation-specific copy in **`regulation-profiles.js`**, not scattered GDPR strings.  
- New regulation: add entry to `lib/regulations.js`, structure + content JSON, scraper, chapter summaries file, profile in `regulation-profiles.js`.  
- API changes: update `docs/API_CONTRACTS.md` and `docs/TRACEABILITY_MATRIX.md`.

---

## 9b. Module public API (Node)

Import **only** these documented exports. Internal helpers stay module-private per **TG-C01**.

| Module | Public exports |
|--------|----------------|
| `lib/regulations.js` | `normalizeRegulationId`, `getRegulation`, `listRegulations`, `getRegulationPaths`, `enrichArticlesWithChapter` |
| `lib/paths.js` | `getDataDir`, `IS_VERCEL` |
| `lib/regulation-content.js` | `parseRegulationId`, `loadContent`, `invalidateRegulationContentCache`, `runRegulationScraperAndReloadContent`, `listRegulations`, `getRegulationPaths` |
| `gdpr-crossrefs.js` | `buildRecitalsCitingArticlesMap`, `mergedSuitableRecitalsForArticle`, `mergedSuitableArticlesForRecital` |
| `document-formatting-guardrails.js` | `normalizeCorpus`, `validateCorpusFormatting`, `logFormattingGuardrailsReport` |
| `news-crawler.js` | `crawlNews`, `withTimeout`, `normalizeNewsUrlKey`, `dedupeNewsItemsConsolidated`, `sanitizeNewsItemDates` |
| `scraper.js` | `run`, `fetchText`, `buildSearchIndex`, `stripLeadingHeadingLinesFromBody`, `mergeWithExisting`, `getGdprInfoEntryPlainText`, `computeDatasetHash` |

Full consumer map: [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md).

---

## 10. Testing checklist (manual)

- [ ] Switch GDPR ↔ AI Act — Browse lists correct counts.  
- [ ] Ask on AI Act: “What is a high-risk AI system?” — cites AI Act articles.  
- [ ] Sources tab shows AI Act Law + EUR-Lex when AI Act selected.  
- [ ] News with AI Act: banner visible; filtered count < full corpus.  
- [ ] `POST /api/refresh` per regulation succeeds.  
- [ ] BYOK validate + Ask with client keys.  
- [ ] `GET /health` returns `ok`.
- [ ] **375px width:** Tools opens; freshness and API key subtitles update after meta/BYOK; article reader not hidden under sticky chrome.
- [ ] **News (mobile):** Hero collapsed by default; expand shows 1-column intro + scope; Sync still works.
- [ ] **Browse welcome (desktop):** Three regulation cards; chapters button above recitals; card click switches regulation.
- [ ] **Chapters false empty:** GDPR sub-category set → switch to Data Act → Chapters shows articles with All filters.

---

## 11. Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md)  
- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
