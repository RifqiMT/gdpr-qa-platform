# Architecture overview  
## Regulation Q&A Platform

**Version:** 3.1 · **Last updated:** 2026-10-22 · Documentation standard **v3.1** · Product **1.3.0** · Audit date **2026-10-22** · Thirteen instruments · `SEED_FILES` = 41 · `npm test` 58 pass / 24 suites

The platform is a single Node.js/Express application serving a vanilla-JS SPA over **thirteen instruments** in four jurisdictions (EU: `gdpr`, `ai-act`, `data-act`; Indonesia: `id-pdp`, `id-satu-data`, `id-ai-ethics`; United States: `us-ccpa`, `us-open-data`, `us-admt`; International: `iso-27701`, `iso-19941`, `iso-23894`, `soc2`). There is **no database** and **no end-user authentication**.

## System context

```mermaid
flowchart LR
  user[User browser]
  app[Regulation Q&A Node Express]

  subgraph EU["EU sources"]
    gdprSrc[GDPR-Info / EUR-Lex 2016/679]
    aiSrc[AI Act Law / EUR-Lex 2024/1689]
    daSrc[Data Act Law / EUR-Lex 2023/2854]
    euNews[EDPB EDPS ICO Commission CoE]
  end

  subgraph ID["Indonesia sources"]
    jdih[JDIH Komdigi / peraturan.go.id / JDIH Kemenko Infra PDF]
    idNews[Antara tags and RSS / Setkab / Komdigi / data.go.id]
  end

  subgraph US["United States sources"]
    usLaw[CPPA / leginfo / Colorado session laws / govinfo / Congress.gov]
    usNews[FTC / CPPA CalPrivacy / California OAG / Colorado AG / data.gov / GSA / FDS]
  end

  subgraph INTL["International sources"]
    isoCat[ISO.org catalogue / JTC 1 SC 27 and SC 42]
    aicpa[AICPA Trust Services Criteria / SOC for Service Organizations]
  end

  groq[Groq API]
  tavily[Tavily API]
  ddg[DuckDuckGo HTML]

  user --> app
  app --> gdprSrc
  app --> aiSrc
  app --> daSrc
  app --> jdih
  app --> euNews
  app --> idNews
  app --> usLaw
  app --> usNews
  app --> isoCat
  app --> aicpa
  app --> groq
  app --> tavily
  app --> ddg
```

---

## Logical architecture

| Layer | Components | Responsibility |
|-------|------------|----------------|
| **Client** | `index.html`, `app.js`, `regulation-profiles.js`, **`regulation-profiles-id.js`**, **`regulation-profiles-us.js`**, **`regulation-profiles-iso.js`**, `news-dedupe.js`, `styles.css` | `#appChrome`; **region picker** (All / EU / Indonesia / USA / INTL) + jurisdiction chip + regulation select; **Tools** panel; **browse welcome grid** (desktop, thirteen cards in four region rows) / solo card (mobile); reader **Page \| Full** (`gdprQaReaderViewMode`); chapters filter panel + `resetChaptersFilters`; News hero; regulation-aware Browse/Ask/Sources/News |
| **API** | `server.js` | REST; `parseRegulationId`; BM25; Groq/Tavily with `regulationSearchContext`; credible-source resolver; news merge |
| **Registry** | `lib/regulations.js`, `lib/regulation-content.js`, `lib/paths.js` | Thirteen-entry registry (+ `jurisdiction`, `REGULATION_DISPLAY_ORDER`, `ID_REGULATION_IDS`, `US_REGULATION_IDS`, `INTL_REGULATION_IDS`); `loadContent(regId)`; ETL dispatch; Vercel `/tmp` + **`SEED_FILES`** (**41** JSON files) |
| **ETL GDPR** | `scraper.js` + **`document-formatting-guardrails.js`** | → `gdpr-content.json` |
| **ETL AI Act** | `ai-act-scraper.js` | → `ai-act-content.json` |
| **ETL Data Act** | `data-act-scraper.js` | → `data-act-content.json` |
| **ETL Indonesia (×3)** | **`id-law-scraper.js`** `run(id)` | → `id-pdp-content.json`, `id-satu-data-content.json`, `id-ai-ethics-content.json` (bundled official corpus preferred when live JDIH HTML is thin) |
| **ETL United States (×3)** | **`us-law-scraper.js`** `run(id)` | → `us-ccpa-content.json`, `us-admt-content.json`, `us-open-data-content.json` (bundled official corpus is authoritative; source reachability ping only; no GDPR fallback) |
| **ETL International (×4)** | **`iso-soc-scraper.js`** `run(id)` | → `iso-27701-content.json`, `iso-19941-content.json`, `iso-23894-content.json`, `soc2-content.json` (copyright-safe educational overlay; ISO.org / AICPA catalogue ping only) |
| **ETL bootstrap (maintainer)** | `scripts/build-id-corpora.py`, `scripts/build-us-corpora.py`, **`scripts/build-iso-soc-corpora.js`** | One-off builders: Indonesian corpora from JDIH HTML + Perpres PDF (`tmp-id-etl/`); United States analogues from CPPA / Colorado session laws / govinfo (`tmp-us-etl/`); International overlays from ISO.org abstracts + HLS / ISO 31000 / AICPA TSC category names |
| **News** | `news-crawler.js` (EU + `crawlIndonesiaOfficialNews` + **`crawlUnitedStatesOfficialNews`** + **`crawlInternationalOfficialNews`**), `news-topics.js`, `server.js` (merge, dedupe, routes), `public/news-dedupe.js` | Parallel fetches (RSS/HTML/API) → relevance gate (EU topic gate + **Indonesian policy gate** + **United States policy gate** + **International catalogue gate**) → topic assignment → merge → **consolidated dedupe** → API + client mirror |
| **Crossrefs** | `gdpr-crossrefs.js` | GDPR article↔recital suitability and citation extraction |
| **Tests** | `test/indo-parity.test.js`, `test/us-parity.test.js`, **`test/iso-parity.test.js`**, `test/browse-routes.test.js`, `test/reader-view.test.js` (`npm test`) | Registry, Indonesian / US / International corpora, news helpers, persisted news, Ask retrieval and sources fallback, browse hash routing, reader Page \| Full — **58 pass / 24 suites** |
| **Data** | `data/*.json` (41 files), `public/industry-sectors.json` | Corpora, structure, news cache, chapter summaries, sectors |

---

## Thirteen ETL paths

Every instrument has exactly one ETL entry point, selected by `runRegulationScraperAndReloadContent(id)` (`lib/regulation-content.js`). All thirteen paths run **`normalizeCorpus`** before `buildSearchIndex` and before writing JSON.

```mermaid
flowchart TB
  trig["Triggers: POST /api/refresh · npm run refresh-* · node-cron 02:00 · Vercel cron"]
  disp["runRegulationScraperAndReloadContent(id)"]
  trig --> disp

  disp -->|gdpr| S1["scraper.js\nGDPR-Info / EUR-Lex"]
  disp -->|ai-act| S2["ai-act-scraper.js\nai-act-law.eu"]
  disp -->|data-act| S3["data-act-scraper.js\ndata-act-law.eu"]
  disp -->|id-pdp| S4["id-law-scraper.js run(id-pdp)\nJDIH Komdigi · UU 27/2022"]
  disp -->|id-satu-data| S5["id-law-scraper.js run(id-satu-data)\nPerpres 39/2019 PDF / peraturan.go.id"]
  disp -->|id-ai-ethics| S6["id-law-scraper.js run(id-ai-ethics)\nJDIH Komdigi · SE 9/2023"]

  disp -->|us-ccpa| S7["us-law-scraper.js run(us-ccpa)\nCPPA · Cal. Civ. Code 1798.100–199.95"]
  disp -->|us-admt| S8["us-law-scraper.js run(us-admt)\nColorado SB 26-189 · C.R.S. 6-1-1701"]
  disp -->|us-open-data| S9["us-law-scraper.js run(us-open-data)\nPub. L. 115-435 Title II · govinfo"]
  disp -->|iso-27701| S10["iso-soc-scraper.js run(iso-27701)\nISO.org catalogue ping · PIMS overlay"]
  disp -->|iso-19941| S11["iso-soc-scraper.js run(iso-19941)\nISO.org catalogue ping · cloud overlay"]
  disp -->|iso-23894| S12["iso-soc-scraper.js run(iso-23894)\nISO.org catalogue ping · AI risk overlay"]
  disp -->|soc2| S13["iso-soc-scraper.js run(soc2)\nAICPA TSC ping · educational overlay"]

  S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10 & S11 & S12 & S13 --> NORM["document-formatting-guardrails.normalizeCorpus"]
  NORM --> IDX["buildSearchIndex (BM25 rows)"]
  IDX --> OUT["data/<id>-content.json"]
  OUT --> RELOAD["invalidate cache + loadContent(id)"]
```

| # | Regulation id | ETL module | Output file | Structure file (credible sources, chapters) | npm script |
|---|---------------|-----------|-------------|---------------------------------------------|------------|
| 1 | `gdpr` | `scraper.js` | `gdpr-content.json` | `gdpr-structure.json` | `npm run refresh` |
| 2 | `ai-act` | `ai-act-scraper.js` | `ai-act-content.json` | `ai-act-structure.json` | `npm run refresh-ai-act` |
| 3 | `data-act` | `data-act-scraper.js` | `data-act-content.json` | `data-act-structure.json` | `npm run refresh-data-act` |
| 4 | `id-pdp` | `id-law-scraper.js id-pdp` | `id-pdp-content.json` | `id-pdp-structure.json` | `npm run refresh-id-pdp` |
| 5 | `id-satu-data` | `id-law-scraper.js id-satu-data` | `id-satu-data-content.json` | `id-satu-data-structure.json` | `npm run refresh-id-satu-data` |
| 6 | `id-ai-ethics` | `id-law-scraper.js id-ai-ethics` | `id-ai-ethics-content.json` | `id-ai-ethics-structure.json` | `npm run refresh-id-ai-ethics` |
| 7 | `us-ccpa` | `us-law-scraper.js us-ccpa` | `us-ccpa-content.json` | `us-ccpa-structure.json` | `npm run refresh-us-ccpa` |
| 8 | `us-admt` | `us-law-scraper.js us-admt` | `us-admt-content.json` | `us-admt-structure.json` | `npm run refresh-us-admt` |
| 9 | `us-open-data` | `us-law-scraper.js us-open-data` | `us-open-data-content.json` | `us-open-data-structure.json` | `npm run refresh-us-open-data` |
| 10 | `iso-27701` | `iso-soc-scraper.js iso-27701` | `iso-27701-content.json` | `iso-27701-structure.json` | `npm run refresh-iso-27701` |
| 11 | `iso-19941` | `iso-soc-scraper.js iso-19941` | `iso-19941-content.json` | `iso-19941-structure.json` | `npm run refresh-iso-19941` |
| 12 | `iso-23894` | `iso-soc-scraper.js iso-23894` | `iso-23894-content.json` | `iso-23894-structure.json` | `npm run refresh-iso-23894` |
| 13 | `soc2` | `iso-soc-scraper.js soc2` | `soc2-content.json` | `soc2-structure.json` | `npm run refresh-soc2` |

### Indonesian ETL behaviour (`id-law-scraper.js`)

1. Load the structure file (chapters, `meta.sources`) and the existing content file.
2. Attempt a **live JDIH HTML fetch** (`fetchText`) and parse `Pasal N` blocks from plain text (`parsePasalFromPlainText`).
3. Use the live extract **only if** the bundled corpus is below `MIN_<PREFIX>_ARTICLES` / `_RECITALS`; otherwise **keep the bundled official corpus** (refresh then confirms source reachability and re-normalizes).
4. `mergeWithExisting` → `normalizeCorpus` → `buildSearchIndex` → hash compare (`computeDatasetHash`); write only when the hash changed, `<PREFIX>_FORCE_CORPUS_WRITE=1` / `GDPR_FORCE_CORPUS_WRITE=1`, the file is missing, or the index is empty.
5. `meta.etl.extractedFrom` ∈ `bundled-official`, `jdih-live`, `jdih-komdigi`, `jdih-kemenkoinfra-pdf`.
6. Throws (→ `POST /api/refresh` **500**) only when even the existing corpus falls below the minimum article count.

---

### International ETL behaviour (`iso-soc-scraper.js`)

1. Load the structure file (`meta.sources`, chapters) and the existing content file; reject ids outside `INTL_REGULATION_IDS`.
2. `pingOfficialSource` fetches `reg.infoBaseUrl` (ISO.org catalogue page or AICPA Trust Services Criteria page) and records reachability only (a response body over 400 bytes counts as reachable). The **bundled educational overlay** (built offline by `scripts/build-iso-soc-corpora.js`) is the source of truth; **no paywalled ISO / AICPA body text is fetched or parsed**.
3. Floors come from `MIN_<ISO_27701|ISO_19941|ISO_23894|SOC2>_ARTICLES` / `_RECITALS` (defaults 14/5, 11/4, 12/5, 20/6). If the existing corpus is below the article floor the run throws `<shortName> ETL incomplete` (→ `POST /api/refresh` **500**) and does not overwrite the bundle. There is **no GDPR fallback**.
4. `normalizeCorpus` → `buildSearchIndex` → SHA-256 `datasetHash` compare; write only when the hash changed, `<PREFIX>_FORCE_CORPUS_WRITE=1` / `GDPR_FORCE_CORPUS_WRITE=1`, the file is missing, or the index is empty.
5. `meta.etl.extractedFrom` is carried from the bundle (`iso-org-catalogue-27701-2025`, `iso-org-catalogue-19941-2017`, `iso-org-catalogue-23894-2023`, `aicpa-tsc-2017-pof-2022-catalogue`).
6. **Honesty constraints:** ISO/IEC 27701 / 19941 / 23894 and SOC 2 are **voluntary standards / attestation criteria, not laws**; corpora are copyright-safe educational overlays; ISO/IEC 42001 is a related note only (under 23894).

---

### United States ETL behaviour (`us-law-scraper.js`)

1. Load the structure file (chapters, `meta.sources`) and the existing content file; reject ids outside `US_REGULATION_IDS`.
2. `pingOfficialSource` fetches `reg.infoBaseUrl` (CPPA, Colorado General Assembly, govinfo) and records reachability only. The **bundled official corpus** (built offline by `scripts/build-us-corpora.py`) is the source of truth; live HTML is not parsed into the corpus.
3. Floors come from `MIN_<US_CCPA|US_ADMT|US_OPEN_DATA>_ARTICLES` / `_RECITALS` (defaults 30/5, 12/5, 8/4). If the existing corpus is below the article floor the run throws `<shortName> ETL incomplete` (→ `POST /api/refresh` **500**) and does not overwrite the bundle.
4. `mergeWithExisting` → `normalizeCorpus` → `buildSearchIndex` → hash compare; write only when the hash changed, `<PREFIX>_FORCE_CORPUS_WRITE=1` / `GDPR_FORCE_CORPUS_WRITE=1`, the file is missing, or the index is empty.
5. `meta.etl.extractedFrom` is carried from the bundled corpus (`cppa-jan2025-compilation`, `colo-sess-laws-2026-ch131`, `govinfo-plaw-115publ435`) and defaults to `bundled-official` when absent.
6. **Honesty constraints:** there is no federal GDPR / AI Act; the OPEN Government Data Act is not the 2014 DATA Act; `GET /api/meta` never falls back to GDPR sources for `us-*`.

---

## Region picker and regulation selection (client flow)

The **region** is a **client-only** UX filter; the **regulation id** is what reaches the API.

```mermaid
flowchart LR
  subgraph chrome["#headerInstrumentPicker"]
    region["Region radiogroup\nAll · EU · Indonesia · USA · INTL\n(localStorage gdpr-qa-region-v1)"]
    chip["Jurisdiction chip\nEuropean Union | Indonesia | United States | International"]
    select["Regulation select\n(optgroups when region = All)\n(localStorage gdpr-qa-regulation-v1)"]
  end
  catalog["GET /api/regulations\njurisdiction + jurisdictionLabel"]
  region -->|catalogForRegion| select
  catalog --> region
  select --> setReg["setCurrentRegulation(id)"]
  setReg --> align["alignRegionWithRegulation()\n+ syncRegulationJurisdictionChip()"]
  setReg --> reset["resetChaptersFilters()"]
  setReg --> sync["syncRegulationChrome()\nBrowse · Ask · Sources · News · citations"]
  setReg --> api["appendRegulationParam()\n?regulation=id on /api/* (not regulations, news, sectors, validate)"]
```

- `defaultRegulationForRegion(region)` picks the first instrument for a region (`gdpr` for EU, `id-pdp` for Indonesia, `us-ccpa` for USA, `iso-27701` for INTL; `all` keeps the current regulation).
- `itemMatchesNewsRegulationScope` filters News client-side per instrument.
- Profiles: EU in `regulation-profiles.js`; Indonesian profiles in **`regulation-profiles-id.js`**, United States profiles in **`regulation-profiles-us.js`**, and International profiles in **`regulation-profiles-iso.js`**; all extend `window.REGULATION_PROFILES` (and set `officialSiteName`).

---

## Regulation refresh pipeline (sequence)

```mermaid
sequenceDiagram
  participant UI as Browser
  participant S as server.js
  participant R as lib/regulation-content.js
  participant SCR as Scraper (per regulation)
  participant DF as document-formatting-guardrails
  participant FS as File system

  UI->>S: POST /api/refresh { regulation }
  S->>R: runRegulationScraperAndReloadContent(id)
  R->>SCR: scraper | ai-act | data-act | id-law-scraper(id) | us-law-scraper(id) | iso-soc-scraper(id)
  SCR->>DF: normalizeCorpus(recitals, articles)
  DF-->>SCR: normalized arrays
  SCR->>SCR: buildSearchIndex
  SCR->>FS: write <id>-content.json
  SCR-->>R: output meta
  R->>R: invalidate cache + loadContent(id) (normalize on read)
  S->>S: validateCorpusFormatting
  S-->>UI: JSON success + regulationId + formattingGuardrails
```

---

## Browse welcome (client flow)

When Browse shows the placeholder (no article/recital open), the client renders regulation overview UI from **`browseUi`** in `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js` / `regulation-profiles-iso.js`:

```mermaid
flowchart TB
  subgraph desktop["Desktop ≥900px"]
    grid["#browseWelcomeGrid\n13 themed cards in 4 region sections\nGDPR · Data Act · AI Act | UU PDP · Satu Data · SE AI Ethics | CCPA · OPEN Data · ADMT | ISO 27701 · ISO 19941 · ISO 23894 · SOC 2"]
    grid --> pick["User clicks card or quick action"]
  end
  subgraph mobile["Mobile ≤899px"]
    solo["#browseWelcome\nsolo card for active regulation"]
    solo --> pick
  end
  rf["Region filter hides non-matching\n.browse-welcome-region sections"] --> grid
  pick --> setReg["setCurrentRegulation(id)"]
  setReg --> reset["resetChaptersFilters()"]
  pick --> seg["Open Chapters or Recitals segment"]
  seg --> load["loadChapters / loadRecitals\n(loadChaptersRequestId guards stale responses)"]
```

---

## Ask pipeline (sequence)

**Ask is `POST /api/answer` only.** There is no `/api/ask` or `/api/summarize` (removed 1.2.6).

```mermaid
sequenceDiagram
  participant UI as Browser
  participant S as server.js
  participant G as Groq API
  participant T as Tavily API
  participant W as Web (DDG + pages)

  UI->>S: POST /api/answer { query, regulation, industrySectorId, includeWeb, apiKeys? }
  Note over UI,S: apiKeys optional BYOK from localStorage
  S->>S: resolveLlmKeys + loadContent(regulation) + buildLocalContext (BM25)
  opt includeWeb
    S->>W: DuckDuckGo (regulationSearchContext suffix) + fetch excerpts
  end
  S->>G: chat/completions (grounded prompt; soft-law rule for id-ai-ethics)
  alt Groq OK
    G-->>S: answer text
  else Groq fails
    S->>T: search (optional, regulation prefix)
    T-->>S: answer or snippets
  else all fail
    S-->>S: buildSummaryFromExcerpts (extractive)
  end
  S-->>UI: JSON answer + sources + regulationId
```

---

## News pipeline (EU + Indonesia + United States + International)

```mermaid
flowchart LR
  subgraph crawl["crawlNews() in news-crawler.js (parallel)"]
    eu["EDPB RSS/HTML · EDPS RSS · ICO · Commission · Council of Europe"]
    ind["crawlIndonesiaOfficialNews()"]
    usn["crawlUnitedStatesOfficialNews()"]
    intn["crawlInternationalOfficialNews()"]
  end
  subgraph indDetail["Indonesian sources"]
    tags["Antara tag hubs\nuu-pdp · data-pribadi · Satu Data · AI ethics · komdigi"]
    rss["Antara RSS\nHukum · Tekno · English"]
    kom["Komdigi HTML (best-effort, WAF-prone)"]
    set["Setkab feed"]
    sd["data.go.id portal (best-effort)"]
  end
  subgraph usDetail["United States sources"]
    ftc["FTC press releases (RSS/HTML, compatible UA)"]
    cppa["CPPA / CalPrivacy year announcements"]
    oag["California OAG RSS"]
    coag["Colorado AG ADAI / ADMT hub + rulemaking files"]
    fds["data.gov · Federal Data Strategy · GSA"]
  end
  subgraph intDetail["International sources"]
    isof["ISO.org news / ISO Insights"]
    aicpaf["AICPA & CIMA Trust Services / SOC hub"]
    seed["internationalCatalogueNewsSeed (official catalogue headlines)"]
  end
  ind --- tags & rss & kom & set & sd
  usn --- ftc & cppa & oag & coag & fds
  intn --- isof & aicpaf & seed
  eu --> gate
  ind --> gate["Relevance gates\nEU topic gate · indonesiaPolicyNewsRe · unitedStatesNewsItemIsOnScope · internationalNewsItemIsOnScope"]
  usn --> gate
  intn --> gate
  gate --> topics["news-topics.js\ntopic + topicCategory"]
  topics --> merge["mergeNewsItems + dedupeNewsItemsConsolidated"]
  merge --> file["data/gdpr-news.json"]
  file --> api["GET /api/news"]
  api --> client["Client: itemMatchesNewsRegulationScope\n(per instrument)"]
```

- Trusted Antara tag hubs skip the keyword gate; broad tags/RSS still require `indonesiaPolicyNewsRe`.
- Taxonomy categories added for Indonesia: **Indonesia Personal Data Protection**, **Indonesia Satu Data**, **Indonesia AI Ethics**; for the United States: **United States CCPA**, **United States OPEN Data**, **United States ADMT**; for International: **International ISO 27701**, **International ISO 19941**, **International ISO 23894**, **International SOC 2** (taxonomy 22 categories / 91 leaf labels).
- United States gate: CPPA/CalPrivacy and `data.gov` / `resources.data.gov` / `strategy.data.gov` URLs are trusted; FTC, California OAG, and GSA items require topic keywords (`unitedStatesPolicyNewsRe`). FTC fetches use a compatible (non-Chrome) user agent because Chrome-like UAs receive 404. Persisted `gdpr-news.json` ships with official U.S. headlines so USA News is non-empty before the first refresh.
- International gate: items from ISO.org / ISO Insights / `aicpa-cima.com` listings are kept only when they match `internationalPolicyNewsRe` (ISO 27701 / 19941 / 23894 / 42001, PIMS, SOC 2, Trust Services Criteria, JTC 1 SC 27 / SC 42) or an in-scope ISO standard URL; `internationalCatalogueNewsSeed()` prepends official catalogue headlines to every crawl. Persisted `gdpr-news.json` ships with official International catalogue headlines (`scripts/seed-iso-soc-news.js`) so INTL News is non-empty before the first refresh. Client scopes: `ISO_27701_NEWS_SCOPE_RE`, `ISO_19941_NEWS_SCOPE_RE`, `ISO_23894_NEWS_SCOPE_RE`, `SOC2_NEWS_SCOPE_RE`, `newsFeedIsInternational`.
- A single shared cache (`gdpr-news.json`) holds EU, Indonesian, United States, and International items; scope is applied in the browser.

---

## Deployment model

- **Local / VM** — One Node.js process (`npm start`) serves API and static files; `node-cron` runs daily ETL for **all thirteen** instruments at 02:00 `Europe/Brussels`.
- **Vercel** — Express app exported via `api/index.js`; all routes rewrite to that function; bundled `data/` is seeded into `/tmp/gdpr-qa-data` per instance (`lib/paths.js` **`SEED_FILES`** manifest — **41** JSON files: thirteen corpora, thirteen structures, one news store, thirteen chapter-summary files, GDPR suitable recitals). `vercel.json` `includeFiles` ships `data/**`, `ai-act-scraper.js`, `data-act-scraper.js`, **`id-law-scraper.js`**, **`us-law-scraper.js`**, **`iso-soc-scraper.js`**. Daily ETL uses Vercel Cron → `api/cron/daily-regulation-refresh.js` (all thirteen, sequential) with `CRON_SECRET`. See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).
- **Stateful files (local)** — `data/` should persist on disk between restarts (content + news cache). On Vercel, treat committed `data/` as source of truth; `/tmp` writes are ephemeral.
- **Secrets** — Environment variables only; no database required for core features. BYOK keys stay in the browser. **No end-user auth.**

---

## BYOK validation (sequence)

```mermaid
sequenceDiagram
  participant UI as Browser dialog
  participant S as server.js
  participant G as Groq API
  participant T as Tavily API

  UI->>S: POST /api/validate-api-keys { apiKeys }
  par Groq check
    S->>G: GET /openai/v1/models
    G-->>S: 200 or 401
  and Tavily check
    S->>T: minimal search
    T-->>S: 200 or error
  end
  S-->>UI: { groq, tavily, checkedAt }
```

---

## Extension points

- **New regulation (any jurisdiction):** add an entry to `lib/regulations.js` (incl. `jurisdiction`, `jurisdictionLabel`, `officialSiteName`, `etlEnvPrefix`, `chapterRanges`), a structure + content JSON, a chapter-summaries file, add the files to `SEED_FILES`, add a profile (`regulation-profiles*.js`), and extend `REGULATION_DISPLAY_ORDER` / `BROWSE_WELCOME_GRID_ORDER`. For Indonesian instruments extend `ID_REGULATION_IDS` (ETL via `id-law-scraper.js`); for United States analogues extend `US_REGULATION_IDS` and the `us-*` branch in `runRegulationScraperAndReloadContent`; for International voluntary standards extend `INTL_REGULATION_IDS` and the `iso-*` / `soc2` branch (ETL via `iso-soc-scraper.js`; copyright-safe overlays only). Add the new id to the cron handler (`api/cron/daily-regulation-refresh.js`) and the `node-cron` block in `server.js`; touch `vercel.json` `includeFiles` only if a new scraper module is introduced. Add a test in `test/`.
- **New LLM provider for Ask:** Extend `server.js` with a parallel path to Groq/Tavily (keep citation contract; do **not** revive the removed `/api/summarize`).
- **BYOK providers:** Extend **`resolveLlmKeys`** and validation helpers; never persist client keys server-side.
- **Additional news sources:** Implement fetch/parser in `news-crawler.js` (add Indonesian feeds inside `crawlIndonesiaOfficialNews` U.S. feeds inside `crawlUnitedStatesOfficialNews`, and ISO / AICPA feeds inside `crawlInternationalOfficialNews`) and add feed metadata to defaults or JSON.
- **Sector list:** Edit `public/industry-sectors.json` (and optional server copy if split later).

---

## References

- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md)  
- [README.md §8 Project structure](../README.md#8-project-structure)
