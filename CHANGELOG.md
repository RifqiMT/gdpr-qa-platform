# Changelog

All notable changes to the **Regulation Q&A Platform** (repository: `gdpr-qa-platform`) are documented in this file. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [1.3.0] — 2026-10-23

### Added

- **International jurisdiction (four voluntary instruments):** ISO/IEC 27701:2025 (`iso-27701`, GDPR analogue PIMS), ISO/IEC 19941:2017 (`iso-19941`, Data Act cloud-portability analogue), ISO/IEC 23894:2023 (`iso-23894`, AI Act risk-management analogue; related ISO/IEC 42001 noted only), and AICPA SOC 2 / Trust Services Criteria (`soc2`). Mapping is honest: these are **not laws**. Duplicate ISO 23894 in the request is treated as one instrument.
- **Copyright-safe corpora:** Educational overlays from ISO.org catalogue abstracts, Harmonized Structure clause titles, ISO 31000 process titles, and publicly listed TSC criterion names. Paywalled ISO/AICPA body text is not scraped. Ping-only ETL in `iso-soc-scraper.js`.
- **Region picker INTL:** Header thumb All / EU / Indonesia / USA / INTL; welcome grid fourth row; jurisdiction chip “International”; default `iso-27701`.
- **International news:** ISO.org news/insights and AICPA SOC/TSC pages, plus catalogue-notice seeds; topic groups `International ISO 27701` / `19941` / `23894` / `SOC 2`.
- **Tests:** `test/iso-parity.test.js` (registry, corpora/sources, news helpers, Ask retrieval, UI blurbs). `npm test` — 58 pass / 24 suites.
- **Vercel seeding:** `SEED_FILES` = **41**; cron refresh covers ISO/SOC instruments; `vercel.json` `includeFiles` lists `iso-soc-scraper.js`.

### Removed

- **Unused import:** `enrichArticlesWithChapter` from `us-law-scraper.js` (US corpora ship with chapter already assigned).
- **Unused CSS:** `@keyframes fadeIn` (never referenced; `docContentFadeIn` remains).

### Documentation

- Product documentation standard **v3.0** → **v3.1** (audit 2026-10-23): thirteen instruments (EU + Indonesia + United States + International), jurisdictions `eu` / `id` / `us` / `intl`. ISO/SOC ETL env vars and refresh scripts documented end to end. Honesty guardrails BG-22…24 and TG-INTL-01…08. Personas, Epic stories, PRD, traceability BR-INTL-*, metrics OKR O14, and full satellite doc lockstep.

---

## [1.2.9] — 2026-10-22

### Added

- **United States jurisdiction (three analogues):** California CCPA/CPRA (`us-ccpa`), Colorado ADMT Act SB 26-189 (`us-admt`), and the OPEN Government Data Act (`us-open-data`, Title II of Pub. L. 115-435) with official corpora, structure JSON, chapter summaries, `us-law-scraper.js`, `public/regulation-profiles-us.js`, and npm refresh scripts. Mapping is honest: there is **no federal GDPR or AI Act**; the **2014 DATA Act is not** the EU Data Act analogue.
- **Region picker USA:** Header region thumb All / EU / Indonesia / USA; welcome grid third row; jurisdiction chip “United States”.
- **US news crawl:** FTC (RSS/HTML; compatible UA — Chrome-like UAs 404), CPPA/CalPrivacy year announcements, California OAG RSS, Colorado AG ADAI/ADMT hub + rulemaking files, data.gov / Federal Data Strategy listings, plus topic groups (`United States CCPA` / `OPEN Data` / `ADMT`).
- **Tests:** `test/us-parity.test.js` (registry, corpora/sources, news helpers, persisted US headlines).
- **Vercel seeding:** `SEED_FILES` expanded for US corpora/structure/summaries; cron refresh covers US instruments.

### Fixed

- **USA News empty / off-scope:** Persisted `gdpr-news.json` now includes official U.S. headlines (CalPrivacy, Colorado ADMT rulemaking, OPEN Data / FDS). Client filters isolate US feeds (no ICO leak), trust CPPA listings for CCPA, and keep FTC/OAG/GSA behind topic keywords. Default feeds use live URLs (Colorado press-room, data.gov home, California OAG, GSA, Federal Data Strategy) instead of `data.gov/meta/` (404).
- **USA Ask / Sources / Browse nouns:** `GET /api/meta` never falls back to GDPR-Info / EUR-Lex for `us-*`. Ask BM25 uses CCPA / ADMT / OPEN Data layperson and sector expansions (not GDPR “controller/processor”). Ask badges, Browse chrome, and citation cards say **Section / Purpose note** for US instruments. `SOURCE_SUMMARIES` covers CPPA, FTC, California OAG, Colorado AG, govinfo, data.gov, GSA, and Federal Data Strategy.

### Removed

- **Dead export:** `crawlUnitedStatesOfficialNews` no longer exported from `news-crawler.js` (still called inside `crawlNews`; same pattern as Indonesia).
- **Unused CSS tokens:** `--header-height`, `--tabs-bar-height`, `--doc-readable-max-h`, `--content-max`, `--sources-accent-glow`, `--news-hero-accent-glow` (declared but never consumed).

### Documentation

- Product documentation standard **v2.8** → **v2.9** (audit 2026-10-22): USA feature parity across Ask, News, and Credible sources; full satellite lockstep for **nine instruments** (EU + Indonesia + United States). Personas 12–14, Epic 11 (US-J-01…08), PRD FR-US-01…08, traceability BR-US-01…10, guardrails TG-US-01…07 / BG-20–21, metrics `us_*` / `reader_full_share`, OKR O13. Honest-mapping language standardised. `SEED_FILES` = 29. Test baseline: `npm test` — 40 pass / 17 suites.

---

## [1.2.8] — 2026-10-21

### Fixed

- **Browse navigation bounce to home:** Opening chapters/recitals (welcome CTAs, Browse menu, Ask citations) no longer races through `#/browse` / `href="#"` such that a late `hashchange` snaps back to the regulation home grid. Segment opens use `activateMainViewOnly`, batch URL sync under `suppressAppRouteSync`, and provision links use real `#/{reg}/article|recital/{n}` hashes.
- **Export PDF vs Page \| Full:** Print export follows the active reader mode — Page exports the current provision (+ sources/related); Full exports the entire on-screen articles or recitals corpus (+ official sources). In-app `#/…` citation links resolve to absolute URLs in the PDF.
- **Reader Go button removed:** Redundant ghost **Go** control dropped; jump field is a search form — **Enter** or picking from the list navigates (respects Page \| Full). Placeholder/ARIA hint “· Enter”.
- **Deep-link wipe on boot:** Initial regulation load no longer syncs `#/browse` before the hash is restored — `#/gdpr/article/N` (and siblings) open correctly on first paint.
- **Regulation switch stale reader:** Changing regulation while an article/recital (or Full corpus) is open now clears the old document, lands on the matching chapters/recitals list, and reloads that corpus. In-flight fetches and Full-view caches are cancelled/keyed by regulation so the previous instrument cannot paint after the switch.

### Changed

- **Typography unify:** Dropped DM Serif Text — headings, article/recital titles, and body use DM Sans only (`--font-serif` is a display-role alias). Title weights bumped so hierarchy stays clear without a second face.
- **Chapters & Recitals browse:** Shared professional chrome (eyebrow, denser headers); flatter teal filter/search strips; denser chapter panels and article cards (tighter grids, 2-line excerpts); denser recital card grid; enter animation respects `prefers-reduced-motion`.

### Added

- **Tests:** `test/browse-routes.test.js`, `test/reader-view.test.js` (hash routing, reader Page \| Full mode).

### Documentation

- **Product documentation standard v2.6 (audit 2026-10-21):** Full doc-set lockstep — README/PRD/FEATURE_CATALOG/USER_STORIES/VARIABLES/DESIGN/TRACEABILITY/SOURCE_CODE_INVENTORY/OPERATIONS and supporting docs. Captures reader **Page \| Full**, Go-button removal (Enter/jump), deep-link boot, regulation-switch stale clear, browse hash bounce hardening, DM Sans–only typography, and new tests. Corrects reader localStorage key to `gdprQaReaderViewMode` (`page` \| `full`).

---

## [1.2.7] — 2026-10-20

### Added

- **Indonesian jurisdiction (three instruments):** UU PDP (`id-pdp`), Satu Data Indonesia (`id-satu-data`), and AI Ethics circular (`id-ai-ethics`) with corpora, structure JSON, chapter summaries, `id-law-scraper.js`, `public/regulation-profiles-id.js`, and npm refresh scripts.
- **Region + Regulation picker:** Unified header chrome — region thumb (All / EU / Indonesia), jurisdiction chip, custom regulation select; six-instrument browse welcome grid.
- **Indonesian news crawl:** Antara policy tag hubs (`uu-pdp`, `data-pribadi`, `satu-data`, `etika-ai`, …), Satu Data portal best-effort harvest, and broader Indo topic gate in `news-crawler.js`.
- **Tests:** `npm test` → `test/indo-parity.test.js` (registry, corpora/sources, news helpers, persisted Indo items).
- **Vercel seeding:** `SEED_FILES` expanded for Indonesian corpora/structure/summaries; cron refresh covers ID instruments.

### Fixed

- **Credible sources fallback:** `GET /api/meta` no longer returns GDPR-Info / EUR-Lex / EDPB when `regulation` is `id-*`, `ai-act`, or `data-act` (content → structure → empty).
- **Chapter summary fallback:** Missing non-GDPR summary files no longer inject GDPR chapter blurbs.
- **Ask (ID AI Ethics):** Soft-law framing for SE Menkominfo 9/2023 in Groq system prompt.

### Changed

- **Credible Sources UX:** News-aligned themed hero (pill, count, filter), richer source cards (monogram, host chip, primary CTA, document rows), client-side search, responsive 1/2/3 grid.
- **Source freshness popover:** Fixed stacking under the tab bar (header `z-index`); click-to-open only (no hover clip); redesigned card layout with clear rows and source chip.
- **BYOK API keys modal:** Redesigned dialog (themed header, privacy callout, switch toggle, provider field cards with show/hide, clearer action hierarchy); keeps save / validate / clear behavior.
- **BYOK action bar:** Single-row **Check · Clear · Save** (equal height, nowrap); Save primary with slight flex grow; narrow viewports stack Save on top then Check | Clear.
- **News UX polish:** Lighter control strip (no nested filter card); flattened source headers; quieter article cards; flat chronological **All** view; empty/loading panels with Refresh/Clear CTAs; Official feeds collapsed by default on ≤899px.
- **Reader chrome toolbar:** Unified Back · nav cluster · Export strip; quieter Prev/Next labels with full aria; soft Go control; Export remains primary; responsive wrap ≤900px / stack ≤640px.
- **Reader Go-to field:** Fixed clipped label text (equal-height 2.35rem controls + line-height padding).
- **Reader chrome v2:** Flattened single strip (no nested nav box); ghost Back/Prev/Next/Go; Export sole primary; quieter disabled edge arrows; Go-to label moved to placeholder/screen reader.
- **Reader Go-to clip fix:** Line-height matches sibling controls; horizontal-only overflow for ellipsis; dropped chrome `backdrop-filter` that clipped control borders; slight toolbar padding.
- **Reader Go-to bordered wrap:** Visible border/radius/focus ring moved to `.doc-nav-goto-input-wrap`; borderless search input keeps ellipsis without clipping the stroke.
- **Reader Page | Full:** Toolbar segment toggles page-based (one provision) vs full corpus (all articles or all recitals); preference in localStorage; Go/Prev/Next scroll within Full.
- **Reader Full spacing:** Compact stacked sections (no per-card padding/separators); tighter gaps between provisions.
- **Reader Full sidebar:** Hides Related articles / Related recitals panels (keep Citations & official links only).
- **News UX:** Empty Indo-filtered states point users to **Refresh news**; refresh status copy includes Indonesian sources.
- **App chrome polish:** Header controls grouped; teal-only region accents; pill toolbar; segmented tab track with sliding active thumb; quieter borders (12px radii).
- **Browse workspace width:** Removed `72rem` cap on the regulation card grid; full-width regulation cards and action buttons.

### Removed

- **Dead CSS (pass 3):** Legacy PDF capture mode (`#browseDetail.pdf-capture-mode`), `.sub-para-list*`, `.point-text sup.fn`.
- **Dead CSS (pass 2):** Unused selectors (`.doc-card`, `.chapters-grid`, `.pdf-export-host`, `.filter-field-select`, `.news-sidebar-select*`, `.news-source-heading`, `.news-card-summary*`, `.meta-row`, `.placeholder-icon`, `.point-num`, `.citation-panel-titles`, `.content-as-of-inline`).
- **Dead export:** `crawlIndonesiaOfficialNews` no longer exported from `news-crawler.js` (still called inside `crawlNews`).
- **Dead stub:** `crawlIcoSearchQuery` (always returned `[]`) removed from topic enrichment.
- **Legacy `/api/meta` aliases:** `askGroqConfigured` / `askTavilyConfigured` removed; SPA uses `askGroqServerConfigured` / `askTavilyServerConfigured` only.
- **Unused param:** `buildAnswerFromTavilyResults(query, …)` → `(results, reg)`.
- **Misleading alias:** `formatInlineFootnotes` inlined to `stripEurLexClauseNumberMarkers` (never emitted footnote superscripts).

### Documentation

- **Product documentation standard v2.5 (audit 2026-10-20):** Full alignment of README, PRD v2.7, personas, user stories, VARIABLES (+ Mermaid), metrics/OKRs O1–O12, design guidelines (six theme accents), traceability, guardrails, API contracts, architecture, feature catalog, glossary, ops/runbooks, and supporting docs to multi-jurisdiction scope (EU + Indonesia, six instruments). Removed documentation of dead APIs and removed LLM summarize providers. `SEED_FILES` documented as **20** JSON files.

---

## [1.2.6] — 2026-07-22

### Removed

- **Legacy REST endpoints:** `GET /api/categories`, `GET /api/chapters/:number`, `POST /api/ask`, and `POST /api/summarize` (unused by the SPA; Ask uses `POST /api/answer` only).
- **Unused LLM summarize providers:** OpenAI, Anthropic, Gemini, Mistral, and OpenRouter helpers removed from `server.js`; Ask remains Groq → Tavily → extractive.
- **Dead exports:** `invalidateRegulationContentCache` removed from `lib/regulation-content.js` public API.

### Changed

- **GDPR scraper:** Reuses shared `enrichArticlesWithChapter` from `lib/regulations.js` instead of local duplicate.
- **News merge:** Inlined `normNewsKey` into `mergeNewsItems` using `normalizeNewsUrlKey`.
- **Client:** Regulation body injection limited to `/api/refresh` and `/api/answer` (drops removed routes).
- **`.env.example`:** Trimmed to active Groq/Tavily and platform env vars only.

### Documentation

- **Product documentation standard v2.4:** Full alignment audit (2026-07-22) — product **1.2.5**/**1.2.6** headers; browse welcome epic (**US-W***); regulation theme token tables (accent / soft / glow); metrics **O10** (engineering maintainability); governance and README index updates.

---

## [1.2.5] — 2026-07-06

### Changed

- **Module public API hygiene:** Trimmed `module.exports` surfaces in `lib/regulations.js`, `lib/paths.js`, `gdpr-crossrefs.js`, `document-formatting-guardrails.js`, `news-crawler.js`, `news-article-attachments.js`, `scraper.js`, and regulation scrapers to documented public symbols only.
- **Regulation registry:** `hasArticleTopics` and `hasSuitableRecitals` are now defined on each `REGULATIONS` entry and projected by `GET /api/regulations` via `listRegulations()`.
- **Vercel seed manifest:** `lib/paths.js` `SEED_FILES` now includes EU Data Act corpus, structure, and chapter summaries for cold-start `/tmp` seeding.
- **Client cleanup:** Removed legacy `openChapter`, `buildClientSummary`, `normalizeAnswerText`, `renderNumericSublist`, and flat `#newsList` news path from `public/app.js`.
- **CSS cleanup:** Removed unused `.chapter-view*`, `.chapter-card`, legacy Ask/chat result blocks, and hidden legacy filter rules from `public/styles.css`.

### Documentation

- **Product documentation standard v2.3:** Full audit (2026-07-06) — module public APIs, Vercel `SEED_FILES` manifest, variables relationship charts, traceability, guardrails, design guidelines, source inventory, and README alignment after code cleanup.

---

## [1.2.4] — 2026-05-19

### Added

- **Browse regulation overview:** Per-regulation **`browseUi`** in `regulation-profiles.js` (description, theme tags, EUR-Lex link).
- **Desktop Browse hub:** Three-column **`#browseWelcomeGrid`** (GDPR · EU Data Act · EU AI Act) with themed cards; click card or quick actions to switch regulation and open **Chapters & articles** or **Recitals**.
- **Mobile Browse welcome:** Single **`#browseWelcome`** card synced to header regulation selection.

### Fixed

- **False empty chapters list:** Hidden GDPR **Category** / **Sub-category** values no longer filter AI Act or Data Act after regulation switch (`resetChaptersFilters`, `getChaptersFilterSubcategoryValue`).
- **Stale chapter loads:** `loadChaptersRequestId` ignores out-of-order API responses when switching regulations quickly.
- **Chapter number matching:** `normalizeChapterNumber()` for consistent filter grouping.

### Changed

- **Chapters quick actions order:** **Chapters & articles** first (primary), **Recitals** second — welcome cards, tab menu, and mobile solo layout.
- **Mobile chapters filters:** Collapsible **Filters** toolbar (≤899px); active-filter summary and clearer empty states (no data vs filtered).

### Documentation

- **Product documentation standard v2.2:** Full audit for browse welcome, chapters filter reliability, design tokens for regulation themes, traceability, variables (§13), metrics, user stories, PRD v2.5.

---

## [1.2.3] — 2026-05-19

### Added

- **Responsive app chrome (phones & tablets):** Sticky `#appChrome` wrapper; **Tools** menu with collapsible **1-column toolbar** (labeled rows for Source freshness, API keys, Refresh sources); full-width **Regulation** selector; compact pill-style tab bar.
- **Live toolbar status (mobile/tablet Tools panel):** `syncHeaderToolbarStatus()` updates freshness and API-key subtitles from `GET /api/meta` and BYOK state (no duplicate always-visible status strip).
- **News hero (responsive):** Compact bar (pill + title + Sync); collapsible **details** on ≤899px with **1-column** intro and scope panels; horizontal-scroll topic tags; regulation-themed accents (`newsUi` in `regulation-profiles.js`).

### Changed

- **Header UX:** Replaced cramped icon-only overflow row with full-width toolbar actions; desktop keeps horizontal compact controls (freshness icon, API keys + Refresh labels).
- **Avoid feature overlap:** Removed redundant header status cards; freshness detail remains in **tooltip**; Ask key narrative remains on **Ask tab** (`#askLlmKeysStatus`); BYOK configuration remains in **API keys** dialog only.
- **Reading viewport:** `--app-chrome-height` measured via `ResizeObserver` for accurate `--reading-pane-max-h` on variable chrome height.

### Documentation

- **Product documentation standard v2.1:** Full audit — README, PRD v2.4, personas, user stories, VARIABLES (§12 app chrome + §9.8 diagram), metrics, design (responsive chrome), traceability (BR-S-*), guardrails (BG-13, TG-F07–F09), feature catalog, architecture, operations, source inventory, glossary, changelog.

---

## [1.2.2] — 2026-05-19

### Fixed

- **Citation sidebar (multi-regulation):** Browse detail panels (“Citations & official links”, “Related articles/recitals”) use **`citationsUi`** from `regulation-profiles.js` and **`syncCitationSidebarChrome()`** when the regulation selector changes (no longer hardcoded to GDPR / GDPR-Info).
- **Article display titles (AI Act & Data Act):** `getArticleDisplayTitle()` no longer replaces corpus titles longer than 120 characters with bare “Article N” (fixes Data Act Art. 4, Art. 33, and similar long official titles).
- **AI Act / Data Act ETL:** `<sup>N</sup>` paragraph markers, sequential top-level numbering across `<li>` elements (`topLevelParaNum`), and “in particular on:” + lettered sub-list reordering (e.g. Art. 96).
- **Article bodies:** Glued markers (`1In` → `1. In`) via guardrails; strip duplicate title lines from body text; `buildSearchIndex` uses regulation-specific recital URLs (no GDPR-Info pollution in AI/Data Act indexes).

### Changed

- **Browse chrome:** Document nav, chapter filter placeholders, and related-panel loading/badge ARIA labels follow the active regulation (`regulationFilterPlaceholder`, `relatedPanelBadgeAriaLabel`).
- **Documentation (standard v2.0):** Comprehensive audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.3, personas, user stories, VARIABLES (`citationsUi` + relationship charts), metrics, design, traceability (BR-B-11/12), guardrails, architecture, API contracts, feature catalog, operations runbook, source inventory, glossary, data schema examples, document formatting guardrails, docs hub.

---

## [1.2.1] — 2026-05-26

### Fixed

- **Browse reader titles (EU AI Act & EU Data Act):** `getArticleDisplayTitle()` in `public/app.js` now applies **`CANONICAL_ARTICLE_TITLES` only when GDPR is selected**. AI Act and Data Act use scraped `title` from `*-content.json` (fixes wrong headings such as GDPR Art. 10 title on Data Act Art. 10).
- **Recital titles:** Added **`getRecitalDisplayTitle()`** and improved **`parseRecitalTopicTitle()`** for regulation-agnostic topic lines in cards, reader, and Ask aside.
- **Regulation-aware labels:** Citation “back” links and chapter filter option labels use the active regulation name instead of hardcoded “GDPR”.

### Changed

- **Document formatting (AI Act & Data Act):** ETL preserves numbered paragraphs `(a)`/`(b)` and `1.` markers via shared `scraper.js` list handling, `joinBodyLines()` in regulation scrapers, `normalizeDsgvoLawParagraphMarkers`, and reader helpers (`renderManualNumberedParagraphs`, `renderManualParagraphBody`).
- **Documentation (standard v1.9):** Comprehensive audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.2, personas, user stories, VARIABLES (display-title variables + relationship charts), metrics, design, traceability, guardrails, architecture, API contracts, tech/business guidelines, feature catalog, operations runbook, source inventory, glossary, data schema examples, document formatting guardrails, docs hub, changelog.

---

## [1.2.0] — 2026-05-19

### Added

- **EU Data Act regulation:** Browse and Ask over Regulation (EU) 2023/2854 — **50 articles** and **119 recitals** from [data-act-law.eu](https://data-act-law.eu/), with header switcher option **`data-act`**, `?regulation=data-act` API parameter, `npm run refresh-data-act`, bundled `data/data-act-content.json`, and profile in `public/regulation-profiles.js`.
- **Ask / Sources / News integration for Data Act:** Regulation-aware Ask copy and web search context; credible sources from `data-act-structure.json`; News relevance filter and banner when EU Data Act is selected; **EU Data Act** topic group in `news-topics.js`.
- **Daily cron:** `api/cron/daily-regulation-refresh.js` refreshes GDPR, AI Act, and Data Act corpora.

### Changed

- **Multi-regulation product:** Header regulation dropdown now lists **GDPR**, **EU AI Act**, and **EU Data Act** (`package.json` **1.2.0**).
- **App shell:** Replaced legal-reference page footer with **app credits** bar (maintainer attribution, LinkedIn and website icon links).
- **Documentation (standard v1.8):** Full audit — README, PRODUCT_DOCUMENTATION_STANDARD, PRD v2.1, personas (incl. Data Act lead), user stories, VARIABLES (Data Act env + relationship charts), metrics, design (app credits), traceability, guardrails, architecture, API contracts, tech guidelines, data schema examples, operations runbook, glossary, feature catalog, changelog.

---

## [1.1.0] — 2026-05-25

### Added

- **EU AI Act regulation:** Browse and Ask over Regulation (EU) 2024/1689 — 113 articles and 180 recitals from [ai-act-law.eu](https://ai-act-law.eu/), with regulation switcher in the header, `?regulation=ai-act` API parameter, `npm run refresh-ai-act`, bundled `data/ai-act-content.json`, and shared UI via `public/regulation-profiles.js` (reader, chapter list, citations, PDF export).
- **Ask / Sources / News integration for AI Act:** Regulation-aware Ask copy, Tavily/web search context, credible sources from `ai-act-structure.json`, News AI-relevance filter and banner when EU AI Act is selected; **EU Artificial Intelligence Act** topic group in `news-topics.js`.
- **Vercel production deployment:** `vercel.json`, `api/index.js` (Express serverless entry), `api/cron/daily-regulation-refresh.js`, `lib/paths.js` (bundled `data/` + `/tmp` on Vercel), `npm run vercel-build`, `.vercelignore`, and **[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)**.
- **BYOK (Bring Your Own Key):** Header **API keys** dialog stores Groq/Tavily credentials in **browser `localStorage`** (`gdpr-qa-byok-v1`); optional override of server `.env` keys on **`POST /api/answer`** and **`POST /api/chapter-summaries/regenerate`** via request body **`apiKeys`**.
- **`POST /api/validate-api-keys`:** Validates Groq (models API) and Tavily (minimal search) without persisting secrets; powers **Check validity** with animated result cards in the dialog.
- **Ask LLM status line:** Shows server vs BYOK key state on the Ask tab (`updateAskLlmKeysStatus`).

### Changed

- **News & Credible sources scope:** Removed **CNIL** and other **country-based** national DPA feeds from News and **`meta.sources`**; **ICO (UK)** remains the only national supervisory authority in-app. See **BG-07** in [docs/GUARDRAILS.md](docs/GUARDRAILS.md).
- **News UI:** Added a segmented **view toggle** to switch between **By source** and a blended **All sources** chronological feed (newest-first), keeping card chrome consistent across both views.
- **News UI:** Filter dropdown panels now include in-panel **search** to quickly narrow Source and Topic options.
- **News UI:** **Attachments** action is displayed **only when** the batch summary confirms at least one downloadable file for the article URL.
- **News ingestion:** Increased default `NEWS_MERGE_CAP` to **6000** to retain more historical items in the API response.
- **News ingestion:** Added bounded topic enrichment knobs (`NEWS_TOPIC_ENRICH_*`) and `NEWS_FROM_YEAR` (best-effort) to improve coverage without uncontrolled crawl expansion.

### Documentation

- **Product documentation audit (standard v1.5):** BYOK, validate-api-keys, News UI (see git history for v1.4–v1.5 iterations).

### Removed

- **Docker / Render web porting artifacts:** Removed **`Dockerfile`**, **`.dockerignore`**, and **`render.yaml`**. **`GET /health`** retained.

### Notes (1.1.0 development)

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
