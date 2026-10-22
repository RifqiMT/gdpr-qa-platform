# Feature catalog  
## Regulation Q&A Platform

**Version:** 2.9 · **Last updated:** 2026-10-22 · **Product version:** `package.json` **1.2.9** · Documentation standard **v2.9** · Audit date **2026-10-22** · **`SEED_FILES`** = 29 · `npm test` **40 pass / 17 suites**

This catalog is the **feature-level inventory** of the shipped product across **nine instruments** in three jurisdictions. For requirements and acceptance criteria, see [PRD.md](PRD.md) and [USER_STORIES.md](USER_STORIES.md). For implementation mapping, see [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md). There is **no end-user authentication** in any feature below.

**Instrument key (used in column headers):**

| Column | Regulation id | Instrument | Jurisdiction | Legal force |
|--------|---------------|------------|--------------|-------------|
| GDPR | `gdpr` | Regulation (EU) 2016/679 | EU | Binding |
| AI Act | `ai-act` | Regulation (EU) 2024/1689 | EU | Binding |
| Data Act | `data-act` | Regulation (EU) 2023/2854 | EU | Binding |
| UU PDP | `id-pdp` | UU 27/2022 Pelindungan Data Pribadi | Indonesia | Binding statute |
| Satu Data | `id-satu-data` | Perpres 39/2019 Satu Data Indonesia | Indonesia | Binding presidential regulation |
| SE AI Ethics | `id-ai-ethics` | SE Menkominfo 9/2023 Etika Kecerdasan Artifisial | Indonesia | **Soft law** (circular) |
| US CCPA | `us-ccpa` | Cal. Civ. Code Title 1.81.5 (CCPA/CPRA) | United States (California) | Binding California statute |
| US OPEN Data | `us-open-data` | OPEN Government Data Act, Pub. L. 115-435 Title II | United States (federal) | Binding federal statute |
| US CO ADMT | `us-admt` | Colorado SB 26-189 / C.R.S. 6-1-1701 et seq. | United States (Colorado) | Binding Colorado statute |

---

## 1. Platform shell

| Feature ID | Name | Description | Primary surfaces |
|------------|------|-------------|------------------|
| F-SHELL-01 | Regulation picker (nine instruments) | Custom select listing **GDPR · EU Data Act · EU AI Act · UU PDP · Satu Data · SE AI Ethics · US CCPA · US OPEN Data · US CO ADMT** (`REGULATION_DISPLAY_ORDER`); persists in `localStorage` (`gdpr-qa-regulation-v1`). | `index.html`, `app.js`, `GET /api/regulations` |
| F-SHELL-02 | Tab navigation | Browse · Ask · Credible sources · News. | `index.html`, `app.js` |
| F-SHELL-03 | Refresh sources | ETL for the **active** instrument only (routes to the matching scraper). | Header button, `POST /api/refresh` |
| F-SHELL-04 | Freshness tooltip | Last refreshed / check timestamps for the active corpus. | `GET /api/meta`, freshness UI |
| F-SHELL-05 | API keys (BYOK) | Browser-stored Groq/Tavily override for Ask; no server persistence. | Header modal, `gdpr-qa-byok-v1` |
| F-SHELL-06 | Homepage (logo) | Resets Browse to placeholder; clears reader state. | `goToHome()` in `app.js` |
| F-SHELL-07 | App credits bar | Maintainer attribution; LinkedIn and website icon links. | `.app-credits` in `index.html` |
| F-SHELL-08 | Regulation-aware citation sidebar | Browse detail panels sync via `citationsUi` + `syncCitationSidebarChrome`; official-site label from `officialSiteName` (EUR-Lex / peraturan.go.id / JDIH Komdigi / California Legislative Information / Colorado General Assembly / govinfo). | `#citationsSidebar`, `regulation-profiles*.js` |
| F-SHELL-09 | Responsive app chrome | Sticky `#appChrome`; Tools menu; 1-column toolbar ≤899px; `--app-chrome-height` via `ResizeObserver`. | `index.html`, `styles.css`, `initHeaderActionsToggle` |
| F-SHELL-10 | Toolbar live status hints | Freshness + API key subtitles in Tools rows (`syncHeaderToolbarStatus`); no duplicate status strip. | `#headerFreshnessHint`, `#headerApiKeysHint`, `app.js` |
| F-SHELL-11 | Compact mobile tabs | Short tab labels; pill container; horizontal scroll. | `.tabs`, `.tab-label--short` |
| F-SHELL-12 | **Region picker** | Radio group **All · EU · Indonesia · USA** with sliding thumb (`#regionFilter`); filters which instruments appear in the regulation select and welcome hub; `data-region` on chrome/`<html>`; persists in `localStorage` (`gdpr-qa-region-v1`); **client-only** (never sent to API). | `#regionFilter`, `catalogForRegion`, `syncRegionFilterUi` |
| F-SHELL-13 | Jurisdiction chip | Chip beside the select showing **European Union**, **Indonesia**, or **United States** for the active instrument (`data-jurisdiction`); region auto-aligns when a regulation is chosen from outside the current region (`alignRegionWithRegulation`). | `#regulationJurisdictionChip` |
| F-SHELL-14 | Grouped regulation select (All region) | With region **All**, the select groups options under European Union / Indonesia / United States (`jurisdictionLabel`). | `app.js` regulation select builder |
| F-SHELL-15 | Nine theme accents | Per-instrument themes (EU, ID, and `us-ccpa`, `us-open-data`, `us-admt`) for welcome cards, News hero, and chrome. See [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md). | `browseUi.theme`, `newsUi.theme`, `styles.css` |

---

## 2. Browse regulation

✓ = supported · — = not applicable · Partial = limited behaviour.

| Feature ID | Name | GDPR | AI Act | Data Act | UU PDP | Satu Data | SE AI Ethics | US CCPA | US OPEN Data | US CO ADMT | Notes |
|------------|------|:----:|:------:|:--------:|:------:|:---------:|:------------:|:-------:|:------------:|:----------:|-------|
| F-BRW-01 | Recitals list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ID: **Menimbang** a–d (UU PDP, Satu Data); SE: **nine ethical values**; US: **Purpose notes** (5 / 4 / 5) |
| F-BRW-02 | Chapters & articles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Grouped by chapter (**BAB**), roman numerals; ID articles are **Pasal** (SE: bagian 1–7); US articles are **Sections** (CCPA 33, ADMT 14, OPEN Data 10) |
| F-BRW-03 | Category filter | ✓ | — | — | — | — | — | — | — | — | Hidden when `hasArticleTopics` is false |
| F-BRW-04 | Sub-category filter | ✓ | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Topic keywords (`ARTICLE_TOPICS`) are GDPR-only |
| F-BRW-05 | Chapter / article filters | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Combobox filters |
| F-BRW-06 | Reader detail view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Formatted body, official links |
| F-BRW-07 | Doc navigation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Prev / Next + jump search (Enter / suggestion pick; **no Go button**) |
| F-BRW-08 | Export PDF | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Browser print / Save as PDF; **Page** = open provision (+ sources/related); **Full** = entire on-screen corpus (+ official sources) |
| F-BRW-08b | Page \| Full mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Toolbar radiogroup; preference `localStorage` `gdprQaReaderViewMode`; Full hides Related panels |
| F-BRW-08c | Deep links / hash routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `#/{reg}/article\|recital/{n}`; boot restore; browse bounce hardening |
| F-BRW-08d | Regulation-switch reader clear | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Clears stale article/recital/Full cache; lands on matching list |
| F-BRW-09 | Related articles/recitals | ✓ | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Partial | Text citations; no suitable-recital map outside GDPR |
| F-BRW-10 | Suitable recitals panel | ✓ | — | — | — | — | — | — | — | — | `article-suitable-recitals.json` + API (GDPR only) |
| F-BRW-11 | Chapter introductions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `chapter-summaries*.json` (nine files); Groq regenerate; missing file ⇒ empty, never GDPR text |
| F-BRW-12 | Back to question | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | From Ask → Browse → return to Ask |
| F-BRW-13 | Regulation-aware links | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js` URLs and headings |
| F-BRW-14 | Correct article display titles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | GDPR: canonical map; all others: corpus `title` only |
| F-BRW-15 | Recital display titles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `getRecitalDisplayTitle`, `parseRecitalTopicTitle` |
| F-BRW-16 | Numbered/lettered paragraph reader | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ETL + guardrails + `renderManualNumberedParagraphs` |
| F-BRW-17 | Regulation-aware citation sidebar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `citationsUi`; official + related panel copy |
| F-BRW-18 | Full long article titles (non-GDPR) | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | No 120-char fallback in `getArticleDisplayTitle` |
| F-BRW-19 | Browse welcome overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `browseUi`; themed description + tags + official-source link |
| F-BRW-20 | Desktop regulation hub | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `#browseWelcomeGrid`; nine cards in three region rows (`BROWSE_WELCOME_GRID_ORDER`); region sections (`.browse-welcome-region`) hide/show with the region picker. United States instruments (`us-ccpa`, `us-open-data`, `us-admt`) share this Browse matrix (no GDPR topic filters). |
| F-BRW-21 | Chapters filter reliability | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `resetChaptersFilters`; hidden GDPR topic filter guard |
| F-BRW-22 | Mobile collapsible chapter filters | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `#chaptersFiltersToggle`; active-filter banner |
| F-BRW-23 | Indonesian legal-text reader | — | — | — | ✓ | ✓ | ✓ | — | — | — | Bahasa Indonesia body text with **Pasal / BAB / Bagian / Menimbang** labels; anchors `#pasal-N`, `#menimbang-N`, `#bagian-N`, `#nilai-N` |
| F-BRW-24 | Soft-law positioning copy | — | — | — | — | — | ✓ | — | — | — | `regulation-profiles-id.js` copy (Ask, News, sections labelled "circular") states SE 9/2023 is **guidance, not legally binding in itself**; pending Perpres on AI ethics / AI roadmap noted in credible sources |
| F-BRW-25 | **US statute reader** | — | — | — | — | — | — | ✓ | ✓ | ✓ | English statutory text with **Section** / **Purpose note** labels (`CCPA § N`, `ADMT § N`, `OPEN Data § N`, `Purpose note (N)`); anchors `#section-N`, `#purpose-N`; Civil Code / C.R.S. citation in each `title`; no GDPR topic filters or suitable recitals |

---

## 3. Ask a question

All features apply to **all nine instruments** unless noted. **Ask is `POST /api/answer` only** (Groq → Tavily → extractive).

| Feature ID | Name | Description |
|------------|------|-------------|
| F-ASK-01 | Natural-language Q&A | `POST /api/answer` with BM25 local context + optional web + Groq/Tavily/extractive |
| F-ASK-02 | Citation chips `[S#]` | Regulation chips open Browse; web chips open URLs |
| F-ASK-03 | Relevant provisions panel | Lists regulation sources from answer; regulation-labeled |
| F-ASK-04 | Industry / sector (ISIC) | Optional sector framing in prompts and BM25 expansion |
| F-ASK-05 | Regulation-scoped prompts | `buildAnswerPrompt(query, sources, sector, reg)` — label from `legalLabel` |
| F-ASK-06 | Regulation-scoped web search | DuckDuckGo + Tavily prefixes per `regulationSearchContext` (EU, Indonesia, and United States variants) |
| F-ASK-07 | Layperson explain mode | Skips web for some general explain queries; tighter length rules. BM25 expansion is **instrument-specific** (`laypersonSearchExpansion`): CCPA consumer-PI rights, Colorado ADMT consequential decisions, OPEN Government data assets — never GDPR controller/processor wording on `us-*` |
| F-ASK-08 | LLM status chip | Groq / Tavily / extractive + model name |
| F-ASK-09 | BYOK | `apiKeys` in body; `POST /api/validate-api-keys` |
| F-ASK-10 | Dynamic Ask copy | Placeholders, hero, signals via `askUi` in profiles (EU, Indonesian, and US) |
| F-ASK-11 | Indonesian-corpus Ask | `id-pdp`, `id-satu-data`, `id-ai-ethics` corpora are BM25-indexed from Bahasa Indonesia text; English or Indonesian questions are accepted; citations link to JDIH / peraturan.go.id |
| F-ASK-12 | Soft-law answer rule | For `id-ai-ethics` the Groq prompt adds a **LEGAL FORCE** rule: obligations are described as stemming from a circular/guidance, not a binding statute |
| F-ASK-13 | US-corpus Ask | `us-ccpa`, `us-admt`, `us-open-data` corpora are BM25-indexed from official English texts; citations link to CPPA / leginfo, Colorado session laws, or govinfo |
| F-ASK-14 | US jurisdiction answer rule | Groq prompt adds a **JURISDICTION** rule: no federal GDPR / AI Act; 2014 DATA Act is a false friend of the EU Data Act |

> **Removed in 1.2.6:** `F-ASK-10 Legacy search API (POST /api/ask)` and the multi-provider `POST /api/summarize`. No catalog feature depends on them.

---

## 4. Credible sources

| Feature ID | Name | Description |
|------------|------|-------------|
| F-SRC-01 | Regulation-scoped catalog | `GET /api/meta?regulation=` → `meta.sources[]` (EU + Indonesian + United States instruments) |
| F-SRC-02 | Source cards | Name, description, document link lists |
| F-SRC-03 | Dynamic header copy | `sourcesUi` in `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js` |
| F-SRC-04 | Summary blurbs | `SOURCE_SUMMARIES` in `app.js` for known orgs (incl. CPPA, FTC, California OAG, Colorado AG, govinfo, data.gov, GSA, Federal Data Strategy) |
| F-SRC-05 | No cross-jurisdiction fallback | Non-GDPR regs (`ai-act`, `data-act`, `id-*`, `us-*`) never fall back to GDPR-Info / EUR-Lex / EDPB in `/api/meta` (`resolveCredibleSourcesForRegulation`) |
| F-SRC-06 | Indonesian official sources | JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra PDF salinan, JDIH Kemenkeu, Setkab, `data.go.id`, Komdigi RPerpres notices (AI ethics) |
| F-SRC-07 | United States official sources | CPPA compilation + California leginfo + OAG (CCPA); Colorado General Assembly + session laws + coag.gov/ai (ADMT); govinfo + Congress.gov + data.gov + GSA (OPEN Data) |

---

## 5. News

| Feature ID | Name | Description |
|------------|------|-------------|
| F-NEWS-01 | Multi-source aggregation | EU: EDPB, EDPS, ICO (UK), Commission, Council of Europe (+ EU Digital Strategy AI). Indonesia: Antara tags/RSS, Setkab, Komdigi (best-effort), Satu Data / data.go.id. United States: FTC, CPPA/CalPrivacy, California OAG, Colorado AG ADAI hub, data.gov / FDS / GSA |
| F-NEWS-02 | Topic taxonomy | `news-topics.js` groups incl. **EU Artificial Intelligence Act**, **EU Data Act**, **Indonesia Personal Data Protection**, **Indonesia Satu Data**, **Indonesia AI Ethics**, **United States CCPA**, **United States OPEN Data**, **United States ADMT** |
| F-NEWS-03 | Source / topic filters | Client-side on `lastNewsItems` |
| F-NEWS-04 | By source / All views | Segmented toggle; chronological **All** mode |
| F-NEWS-05 | URL + semantic dedupe | Server + `news-dedupe.js` client mirror |
| F-NEWS-06 | Refresh news | `POST /api/news/refresh` → `gdpr-news.json` (EU + Indonesia + United States merged) |
| F-NEWS-07 | Attachments discovery | Per-article scan; batch summary hides empty actions |
| F-NEWS-08 | Quick filters dock | Desktop sidebar when main filters scroll away |
| F-NEWS-09 | Regulation relevance filter | `ai-act`, `data-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-admt`, `us-open-data`: `itemMatchesNewsRegulationScope` + banner (GDPR shows the full list) |
| F-NEWS-10 | Three-paragraph summaries | Card summary blocks from data or heuristics |
| F-NEWS-11 | Responsive news hero | Compact bar; collapsible details ≤899px; `newsUi` themes; 1-column intro/scope panels; stats strip. |
| F-NEWS-12 | Region-scoped feed list | Indonesian regs / Indonesia region show Antara–Komdigi–Setkab–Satu Data; USA region / `us-*` regs show FTC, CPPA, California OAG, Colorado AG, data.gov / GSA / FDS |
| F-NEWS-13 | **Indonesian news crawl** | `crawlIndonesiaOfficialNews`: Antara policy **tag hubs** (`uu-pdp`, `data-pribadi`, Satu Data, AI ethics, `komdigi`), Antara RSS (Hukum, Tekno, English), Komdigi HTML and Satu Data portal (best-effort), Setkab feed |
| F-NEWS-16 | **United States news crawl** | `crawlUnitedStatesOfficialNews`: FTC RSS/HTML (compatible UA), CPPA/CalPrivacy year announcements, California OAG RSS, Colorado AG ADAI hub + rulemaking files, Federal Data Strategy, resources.data.gov |
| F-NEWS-17 | United States policy gate | `unitedStatesPolicyNewsRe` / `unitedStatesNewsItemIsOnScope` keep CCPA / ADMT / OPEN Data headlines |
| F-NEWS-14 | Indonesian policy gate | `indonesiaPolicyNewsRe` / `indonesiaNewsItemIsOnScope` keep only UU PDP / Satu Data / AI-ethics headlines from non-trusted tags |
| F-NEWS-15 | Empty-state guidance | Indonesian- and USA-filtered empty News states point users to **Refresh news**; refresh copy names Antara/Komdigi and FTC/CPPA/Colorado AG/data.gov |

---

## 6. Content pipeline (ETL)

| Feature ID | Name | GDPR | AI Act | Data Act | UU PDP / Satu Data / SE AI Ethics | US CCPA / OPEN Data / CO ADMT |
|------------|------|------|--------|----------|-----------------------------------|-------------------------------|
| F-ETL-01 | Scraper ETL | `scraper.js` | `ai-act-scraper.js` | `data-act-scraper.js` | **`id-law-scraper.js`** (`run(id)`) | **`us-law-scraper.js`** (`run(id)`) |
| F-ETL-02 | Formatting guardrails | `document-formatting-guardrails.js` | Same | Same | **Same** (`normalizeCorpus` runs in `id-law-scraper.js` too) | **Same** (`normalizeCorpus` runs in `us-law-scraper.js` too) |
| F-ETL-03 | Search index build | BM25 `searchIndex[]` | Same | Same | Same | Same |
| F-ETL-04 | Merge with existing | Per-number last-wins | Same | Same | **Prefer bundled official corpus** when live JDIH HTML is thin or incomplete; `mergeWithExisting` + `computeDatasetHash` | **Bundled official corpus is authoritative**; live source is only pinged (`pingOfficialSource`); `mergeWithExisting` + `computeDatasetHash` |
| F-ETL-05 | CLI refresh | `npm run refresh` | `npm run refresh-ai-act` | `npm run refresh-data-act` | `npm run refresh-id-pdp` / `refresh-id-satu-data` / `refresh-id-ai-ethics` | `npm run refresh-us-ccpa` / `refresh-us-admt` / `refresh-us-open-data` |
| F-ETL-06 | Scheduled refresh | Vercel cron + local `node-cron` refresh **all nine** instruments | Same | Same | Same | Same |
| F-ETL-07 | **Indonesian corpus builder** | — | — | — | `scripts/build-id-corpora.py` builds the bundled corpora from JDIH HTML + official Perpres PDF (maintainer-run; scratch in git-ignored `tmp-id-etl/`) | — |
| F-ETL-08 | Indonesian ETL guard | — | — | — | Minimum counts via `MIN_ID_PDP_*`, `MIN_ID_SATU_DATA_*`, `MIN_ID_AI_ETHICS_*`; force write via `<PREFIX>_FORCE_CORPUS_WRITE` / `GDPR_FORCE_CORPUS_WRITE`; ETL `extractedFrom` ∈ `jdih-komdigi`, `jdih-kemenkoinfra-pdf`, `jdih-live`, `bundled-official` | — |
| F-ETL-09 | **US corpus builder** | — | — | — | — | `scripts/build-us-corpora.py` from the CPPA PDF extract, Colorado session-law HTML, and govinfo P.L. 115-435 (maintainer-run; scratch in git-ignored `tmp-us-etl/`) |
| F-ETL-10 | **US ETL guard** | — | — | — | — | Minimum counts via `MIN_US_CCPA_*` (30 / 5), `MIN_US_ADMT_*` (12 / 5), `MIN_US_OPEN_DATA_*` (8 / 4); force write via `US_CCPA_FORCE_CORPUS_WRITE` / `US_ADMT_FORCE_CORPUS_WRITE` / `US_OPEN_DATA_FORCE_CORPUS_WRITE` or `GDPR_FORCE_CORPUS_WRITE`; ETL `extractedFrom` is carried from the bundled corpus (`cppa-jan2025-compilation` / `colo-sess-laws-2026-ch131` / `govinfo-plaw-115publ435`, default `bundled-official`); **no GDPR-Info / EUR-Lex fallback** |

> `npm run refresh` (`node server.js --refresh-only`) refreshes **GDPR only**; use the per-instrument scripts or `POST /api/refresh` for the others.

---

## 7. Deployment and operations

| Feature ID | Name | Description |
|------------|------|-------------|
| F-OPS-01 | Local Node server | `npm start` port **3847** |
| F-OPS-02 | Vercel serverless | `api/index.js`, `vercel.json` (`includeFiles` bundles `data/**` and the scrapers `ai-act-scraper.js`, `data-act-scraper.js`, `id-law-scraper.js`, `us-law-scraper.js`; GDPR `scraper.js` ships as part of the function bundle) |
| F-OPS-03 | Ephemeral data on Vercel | `GDPR_DATA_DIR` / `/tmp` seed from bundled `data/` (**`SEED_FILES` = 29** JSON files) |
| F-OPS-04 | Health check | `GET /health` |
| F-OPS-05 | CORS | Enabled for API consumers |
| F-OPS-06 | Automated tests | `npm test` → `node --test test/*.test.js` (`indo-parity`, `us-parity` including Ask retrieval + sources fallback, `browse-routes`, `reader-view`); **40 pass / 17 suites** at the 2026-10-22 audit |
| F-OPS-07 | No end-user auth | Public read access; only cron route is secret-protected |

---

## 8. Feature ↔ persona matrix (summary)

| Persona | Browse | Ask | Sources | News |
|---------|--------|-----|---------|------|
| Legal / Compliance | ●●● | ●●● | ●● | ●● |
| DPO (EU) | ●● | ●●● | ●● | ●●● |
| Indonesian Personal Data Protection Lead (UU PDP) | ●●● | ●●● | ●● | ●●● (Indonesian filter) |
| Satu Data / Open Government Data Steward | ●●● | ●● | ●●● | ●● (Indonesian filter) |
| AI Ethics / Responsible AI Officer (Indonesia) | ●●● | ●●● | ●● | ●● (Indonesian filter) |
| AI governance lead (EU AI Act) | ●●● | ●●● | ●●● | ●● (filtered) |
| California privacy counsel (CCPA/CPRA) | ●●● | ●●● | ●●● | ●● (CCPA filter) |
| Colorado ADMT / AI governance lead | ●●● | ●●● | ●● | ●● (ADMT filter) |
| Federal open-data steward (OPEN Data Act) | ●●● | ●● | ●●● | ●● (OPEN Data filter) |
| Consultant (EU + Indonesia + US) | ●● | ●●● | ● | ●● |
| Engineering / DevOps | ● | ● (BYOK) | — | ● (tuning) |

Legend: ● = primary · ●● = frequent · ●●● = core workflow. Persona detail: [USER_PERSONAS.md](USER_PERSONAS.md).

---

## See also

- [README.md](../README.md) — operator handbook  
- [PRD.md](PRD.md) — formal requirements  
- [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) — runbooks and incidents  
- [API_CONTRACTS.md](API_CONTRACTS.md) — live routes only
