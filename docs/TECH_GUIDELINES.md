# Technical guidelines  
## Regulation Q&A Platform

**Version:** 2.0  
**Audience:** Engineering, DevOps, security review  
**Status:** Active · Documentation standard **v2.6** · Product **1.2.7** · **Last updated:** 2026-10-21 · Audit date **2026-10-21**

---

## 1. Architecture principles

| Principle | Implementation |
|-----------|----------------|
| **Single codebase, multi-regulation, multi-jurisdiction** | `lib/regulations.js` registry (six instruments, `jurisdiction` `eu` \| `id`); `loadContent(regId)` in `lib/regulation-content.js`. |
| **No frontend build** | Vanilla JS/CSS in `public/`; Express static + SPA fallback. |
| **Corpus on disk** | JSON in `data/`; normalized on every refresh and read. |
| **Stateless API** | Regulation choice via query/body; client persists selection in `localStorage`. |
| **LLM optional** | Ask is **`POST /api/answer` only**: Groq → Tavily → extractive. No other LLM providers (removed in 1.2.6). |
| **No end-user auth** | Public read access; no accounts or sessions. Only the Vercel cron route requires `CRON_SECRET`. |
| **No cross-jurisdiction fallback** | Credible sources, chapter summaries, and suitable recitals never fall back to GDPR content for other instruments. |

---

## 2. Regulation selection contract

**Server:** `parseRegulationId(req)` reads `?regulation=` or `body.regulation`; unknown/missing ⇒ `gdpr`. Valid ids: `gdpr`, `ai-act`, `data-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`.

**Client:** `currentRegulation.id`; `appendRegulationParam()` adds `?regulation=` to `/api/*` requests (GET and POST); `mergeRegulationBody()` sets `body.regulation` for **`POST /api/refresh`** and **`POST /api/answer`** only.

**Excluded from regulation param:**

- `/api/regulations`, `/api/news*`, `/api/industry-sectors`, `/api/validate-api-keys`

**Region vs regulation:** The header **Region** control (All / EU / Indonesia, `gdpr-qa-region-v1`) is a **client-only** filter over `GET /api/regulations` (`jurisdiction`). It is never sent to the server; only the regulation id is. Selecting an instrument outside the active region realigns the region (`alignRegionWithRegulation`).

---

## 3. ETL guidelines

| Regulation | Script | Output | Primary source |
|------------|--------|--------|----------------|
| GDPR | `scraper.js` | `gdpr-content.json` | `GDPR_ETL_PRIMARY` (`gdpr-info` default) |
| AI Act | `ai-act-scraper.js` | `ai-act-content.json` | `ai-act-law.eu` |
| Data Act | `data-act-scraper.js` | `data-act-content.json` | `data-act-law.eu` |
| ID PDP Law | `id-law-scraper.js id-pdp` | `id-pdp-content.json` | JDIH Komdigi / peraturan.go.id (UU 27/2022) |
| ID Satu Data | `id-law-scraper.js id-satu-data` | `id-satu-data-content.json` | Perpres 39/2019 official PDF / peraturan.go.id |
| ID AI Ethics | `id-law-scraper.js id-ai-ethics` | `id-ai-ethics-content.json` | JDIH Komdigi (SE Menkominfo 9/2023) |

**Mandatory:** Run `document-formatting-guardrails.js` `normalizeCorpus` before index build and disk write (**all** regulation paths).

**Refresh API:** `POST /api/refresh` with `{ regulation: "gdpr" | "ai-act" | "data-act" | "id-pdp" | "id-satu-data" | "id-ai-ethics" }`.

**CLI:** `npm run refresh` (**GDPR only** — `server.js --refresh-only`), `npm run refresh-ai-act`, `npm run refresh-data-act`, `npm run refresh-id-pdp`, `npm run refresh-id-satu-data`, `npm run refresh-id-ai-ethics`.

**Indonesian ETL rules (`id-law-scraper.js`):** `run(id)` accepts only ids in `ID_REGULATION_IDS`; prefers the **bundled official corpus** when the live JDIH HTML extract is below `MIN_<PREFIX>_ARTICLES` / `_RECITALS` (defaults from the registry); throws `… ETL incomplete` only if even the existing corpus is below the minimum; writes only on hash change, missing file/index, or `<PREFIX>_FORCE_CORPUS_WRITE=1` / `GDPR_FORCE_CORPUS_WRITE=1`. `scripts/build-id-corpora.py` is a maintainer-only builder (scratch in git-ignored `tmp-id-etl/`).

**Cron:** `api/cron/daily-regulation-refresh.js` refreshes **EU (GDPR, AI Act, Data Act) and Indonesian (UU PDP, Satu Data, AI ethics)** laws sequentially when `CRON_SECRET` is set on Vercel; local `node-cron` (02:00 `Europe/Brussels`) does the same. Both must be updated together when an instrument is added.

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

Single entry point: **`POST /api/answer`** (body `regulation` selects the corpus).

1. `buildLocalContext(data, query, sector, regId)` — BM25 over `searchIndex` (Indonesian corpora are indexed from Bahasa Indonesia text).  
2. Optional `fetchWebSnippets(query, reg)` — DuckDuckGo + page text; per-instrument suffix from `regulationSearchContext` (EU and Indonesian variants).  
3. `answerWithGroq(query, sources, sector, key, reg)` — `buildAnswerPrompt` uses `reg.legalLabel`; for **`id-ai-ethics`** a **LEGAL FORCE** rule states the SE is soft-law guidance, not a statute.  
4. `answerWithTavily(query, sector, key, reg)` — Tavily prefix from `regulationSearchContext`.  
5. `buildSummaryFromExcerpts` — extractive fallback with regulation label.

**BYOK:** `resolveLlmKeys(req)` merges body `apiKeys` over `.env`.

**Model selection:** `GROQ_MODEL` (single or comma-separated) takes precedence over the built-in default list; set it explicitly if defaults are unavailable to your Groq account (see [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) §7).

---

## 5. News pipeline (technical)

- **Storage:** `data/gdpr-news.json` (feeds + items; shared EU + Indonesia).  
- **Crawl:** `crawlNews()` runs EU publishers and `crawlIndonesiaOfficialNews()` in parallel (Antara tag hubs `uu-pdp` / `data-pribadi` / Satu Data / AI-ethics / `komdigi`, Antara RSS, Komdigi HTML and `data.go.id` best-effort, Setkab feed).  
- **Indonesian gate:** `indonesiaPolicyNewsRe` / `indonesiaNewsItemIsOnScope`; trusted tag hubs skip the keyword gate.  
- **Classification:** `news-topics.js` (includes **EU Artificial Intelligence Act**, **EU Data Act**, **Indonesia Personal Data Protection**, **Indonesia Satu Data**, **Indonesia AI Ethics** categories).  
- **Dedupe:** `dedupeNewsItemsConsolidated` server + `news-dedupe.js` client.  
- **Regulation UI filters:** `itemMatchesNewsRegulationScope` in `app.js` when any non-GDPR instrument is selected (client-side, not server-side; GDPR shows the full list).

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
| **Desktop hub** | `initBrowseWelcomeGrid()` builds **six** cards from `REGULATION_PROFILES` in two region sections (`BROWSE_WELCOME_GRID_ORDER`: gdpr, data-act, ai-act, id-pdp, id-satu-data, id-ai-ethics); the region picker hides non-matching `.browse-welcome-region` sections. |
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
- New regulation: add entry to `lib/regulations.js` (incl. `jurisdiction`, `jurisdictionLabel`, `officialSiteName`, `etlEnvPrefix`), structure + content JSON, scraper (or extend `ID_REGULATION_IDS` for Indonesian instruments), chapter summaries file, **`SEED_FILES`** entries in `lib/paths.js`, cron + `node-cron` + `runRegulationScraperAndReloadContent` branch, profile in `regulation-profiles.js` / `regulation-profiles-id.js`, grid order constants, and a test in `test/`.
- Indonesian/EU profile copy lives in the matching profile file; never hardcode instrument strings in `app.js` beyond the news-scope regexes.  
- API changes: update `docs/API_CONTRACTS.md` and `docs/TRACEABILITY_MATRIX.md`.

---

## 9b. Module public API (Node)

Import **only** these documented exports. Internal helpers stay module-private per **TG-C01**.

| Module | Public exports |
|--------|----------------|
| `lib/regulations.js` | `normalizeRegulationId`, `getRegulation`, `listRegulations`, `getRegulationPaths`, `enrichArticlesWithChapter`, `ID_REGULATION_IDS` |
| `lib/paths.js` | `getDataDir`, `IS_VERCEL` |
| `lib/regulation-content.js` | `parseRegulationId`, `loadContent`, `runRegulationScraperAndReloadContent`, `listRegulations`, `getRegulationPaths` |
| `gdpr-crossrefs.js` | `buildRecitalsCitingArticlesMap`, `mergedSuitableRecitalsForArticle`, `mergedSuitableArticlesForRecital` |
| `document-formatting-guardrails.js` | `normalizeCorpus`, `validateCorpusFormatting`, `logFormattingGuardrailsReport` |
| `news-crawler.js` | `crawlNews`, `indonesiaPolicyNewsRe`, `indonesiaNewsItemIsOnScope`, `withTimeout`, `normalizeNewsUrlKey`, `dedupeNewsItemsConsolidated`, `sanitizeNewsItemDates` (`crawlIndonesiaOfficialNews` is internal) |
| `scraper.js` | `run`, `fetchText`, `buildSearchIndex`, `stripLeadingHeadingLinesFromBody`, `mergeWithExisting`, `getGdprInfoEntryPlainText`, `computeDatasetHash` |
| `id-law-scraper.js` | `run(regulationId)` |

Full consumer map: [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md).

---

## 10. Testing checklist

**Automated (run first):** `npm test` → `node --test test/*.test.js` — expect **8 tests / 4 suites passing** (`test/indo-parity.test.js`: Indonesian registry, corpora for Ask/Browse, news helpers, persisted Indonesian news). Add tests for every new instrument or crawler change; keep the suite stable before merging.

**Manual:**

- [ ] Region picker: All / EU / Indonesia filters the regulation select; chip and grouped options correct; choice persists after reload.  
- [ ] Switch among all six instruments — Browse counts: GDPR 99, AI Act 113, Data Act 50, UU PDP 76, Satu Data 44, SE AI Ethics 7 articles.  
- [ ] Ask on an Indonesian instrument (e.g. UU PDP "Apa hak subjek data pribadi?") — cites Pasal sources; `id-ai-ethics` answers frame the SE as guidance (soft law).  
- [ ] Credible sources for Indonesian instruments show JDIH / peraturan.go.id (no EUR-Lex/EDPB fallback).  
- [ ] Switch GDPR ↔ AI Act — Browse lists correct counts.  
- [ ] Ask on AI Act: “What is a high-risk AI system?” — cites AI Act articles.  
- [ ] Sources tab shows AI Act Law + EUR-Lex when AI Act selected.  
- [ ] News with AI Act or an Indonesian instrument: banner visible; filtered count < full corpus; Indonesian empty state hints **Refresh news**.  
- [ ] `POST /api/refresh` per regulation succeeds.  
- [ ] BYOK validate + Ask with client keys.  
- [ ] `GET /health` returns `ok`.
- [ ] **375px width:** Tools opens; freshness and API key subtitles update after meta/BYOK; article reader not hidden under sticky chrome.
- [ ] **News (mobile):** Hero collapsed by default; expand shows 1-column intro + scope; Sync still works.
- [ ] **Browse welcome (desktop):** Six regulation cards in two region sections; chapters button above recitals; card click switches regulation.
- [ ] **Chapters false empty:** GDPR sub-category set → switch to Data Act → Chapters shows articles with All filters.

---

## 11. Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md)  
- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
