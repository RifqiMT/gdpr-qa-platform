# API contracts  
## Regulation Q&A Platform

**Version:** 2.3 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23**

Base URL: same origin as the static app (e.g. `http://localhost:3847`).  
Content type: JSON for all `/api/*` routes unless noted.  
**Authentication:** none for end users. There is no login, session, or per-user quota. The only secured route is the Vercel cron handler (`CRON_SECRET`, see [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)); BYOK provider keys travel in request bodies and are never stored.

> **Scope of this document:** it lists **live routes only**. Routes removed in **1.2.6** are recorded in [§ Removed routes](#removed-routes-126) for migration awareness and are **not** part of the contract.

---

## Conventions

### Regulation scope

Corpus routes accept **`?regulation=<id>`** (query) or **`body.regulation`** (POST). The registry in `lib/regulations.js` defines **thirteen** valid ids:

| `regulation` id | Instrument | Jurisdiction (`jurisdiction`) | Legal force |
|-----------------|------------|-------------------------------|-------------|
| `gdpr` *(default)* | Regulation (EU) 2016/679 | `eu` | Binding regulation |
| `ai-act` | Regulation (EU) 2024/1689 | `eu` | Binding regulation |
| `data-act` | Regulation (EU) 2023/2854 | `eu` | Binding regulation |
| `id-pdp` | UU No. 27 Tahun 2022 (Pelindungan Data Pribadi) | `id` | Binding statute |
| `id-satu-data` | Perpres No. 39 Tahun 2019 (Satu Data Indonesia) | `id` | Binding presidential regulation |
| `id-ai-ethics` | SE Menkominfo No. 9 Tahun 2023 (Etika Kecerdasan Artifisial) | `id` | **Soft law** (circular / guidance) |
| `us-ccpa` | California Consumer Privacy Act of 2018 (Cal. Civ. Code Title 1.81.5), as amended by the CPRA | `us` | Binding state statute (analogue) |
| `us-admt` | Colorado Automated Decision-Making Technology Act (SB 26-189; C.R.S. 6-1-1701 et seq.) | `us` | Binding state statute (analogue) |
| `us-open-data` | OPEN Government Data Act (Title II of Pub. L. 115-435) | `us` | Binding federal statute (public-sector open data) |
| `iso-27701` | ISO/IEC 27701:2025 Privacy information management systems | `intl` | Voluntary standard (educational overlay) |
| `iso-19941` | ISO/IEC 19941:2017 Cloud interoperability and portability | `intl` | Voluntary standard (educational overlay) |
| `iso-23894` | ISO/IEC 23894:2023 AI risk-management guidance | `intl` | Voluntary guidance (educational overlay) |
| `soc2` | AICPA Trust Services Criteria (SOC 2) | `intl` | Attestation criteria (not a law) |

**United States entries are analogues, not federal equivalents.** The US has **no federal GDPR and no federal AI Act**: `us-ccpa` (California) and `us-admt` (Colorado) are state-level analogues to the GDPR and the EU AI Act respectively. `us-open-data` is the **OPEN Government Data Act (Pub. L. 115-435, Title II)**, a public-sector open-data law; it is **not** the **2014 DATA Act** (federal spending transparency) and **not** a private-sector IoT / cloud-switching analogue to the EU Data Act.

- **Unknown or missing values** are coerced to **`gdpr`** by `normalizeRegulationId` (no `400`).
- **Excluded from regulation scoping:** `/api/regulations`, `/api/news*`, `/api/industry-sectors`, `/api/validate-api-keys` (the SPA does not append `regulation=` to these).
- **Client behaviour:** `appendRegulationParam()` adds `?regulation=` to every `/api/*` request except the excluded set; `mergeRegulationBody()` additionally sets `body.regulation` for **`POST /api/refresh`** and **`POST /api/answer`** only.
- **Region picker is client-only:** the header **Region** control has **five** UI values — **All / EU / Indonesia / USA / INTL** — and filters which instruments the UI lists. The choice is stored in `localStorage` under **`gdpr-qa-region-v1`** with values **`all`** | **`eu`** | **`id`** | **`us`** | **`intl`** and is **never** sent to the API. The API contract exposes `jurisdiction` / `jurisdictionLabel` per instrument so any client can implement the same grouping (`all` = no filter; `eu`/`id`/`us`/`intl` map 1:1 to `jurisdiction`). Choosing **INTL** selects the default regulation **`iso-27701`**.

### General

- **Timestamps:** ISO 8601 strings where present (`meta.lastRefreshed`, `contentAsOf`, news `date`).
- **Errors:** Some routes return `200` with partial data on soft failure (e.g. news crawl timeout, `ok: false`); hard errors use `4xx`/`5xx` with `{ error: string }` (or `{ success: false, error }` for refresh, `{ ok: false, error }` for attachments).
- **CORS:** Enabled for Express (`cors()` middleware).
- **BYOK:** Client-supplied API keys travel in JSON request bodies as **`apiKeys`** (see below). The server **does not** persist BYOK keys to disk or log secret values.
- **Language of content:** EU and US corpora are English; Indonesian corpora keep **Bahasa Indonesia legal text** with English structural titles (e.g. `Pasal` articles titled in English). Responses are not translated by the API.
- **Provision nouns by jurisdiction:** EU → *Article* / *Recital*; Indonesia (`id-pdp`, `id-satu-data`) → *Pasal* / *Considering*; `id-ai-ethics` → *Section* / *Ethical value*; **United States → *Section* (e.g. `CCPA § 1798.100`, `ADMT § 6-1-1703`, `OPEN Data § 201`) / *Purpose note***; **International → *Clause* (`ISO 27701 clause N`, `ISO 19941 clause N`, `ISO 23894 clause N`) or *Criterion* (`SOC 2 criterion N`) / *Purpose note***. The API field names (`articles`, `recitals`, `type: "article" | "recital"`) are unchanged across jurisdictions.

---

## Route index (live)

| Method | Path | Regulation-scoped | Purpose |
|--------|------|:-----------------:|---------|
| GET | `/health` | — | Liveness |
| GET | `/api/regulations` | — | Thirteen-instrument catalog |
| POST | `/api/validate-api-keys` | — | BYOK validation |
| GET | `/api/meta` | ✓ | Freshness, ETL, credible sources, key status |
| GET | `/api/chapters` | ✓ | Chapter list |
| GET | `/api/chapter-summaries` | ✓ | Chapter introductions |
| POST | `/api/chapter-summaries/regenerate` | ✓ | Groq regeneration |
| GET | `/api/articles` | ✓ | All articles |
| GET | `/api/articles/:number` | ✓ | One article |
| GET | `/api/recitals` | ✓ | All recitals / preamble items |
| GET | `/api/recitals/:number` | ✓ | One recital |
| GET | `/article-suitable-recitals.json` | — (GDPR map) | Editorial crossref file |
| GET | `/api/industry-sectors` | — | ISIC sectors (+ tree) |
| POST | `/api/answer` | ✓ | **Ask** (the only Q&A endpoint) |
| GET | `/api/news` | — | News list |
| POST | `/api/news/refresh` | — | Full news crawl |
| GET / POST | `/api/news/article-attachments` | — | Attachment discovery |
| POST | `/api/news/attachments-summary` | — | Batch attachment counts |
| POST | `/api/refresh` | ✓ | Corpus ETL (one instrument) |
| GET | `/api/cron/daily-regulation-refresh` | — | Vercel cron (secured; all thirteen instruments) |
| GET | `/*` | — | SPA fallback |

---

## Health

### `GET /health`

**Response:** Plain text **`ok`** (HTTP **200**). Use for load balancers and liveness checks.

---

## Regulations catalog

### `GET /api/regulations`

**Response:** `{ regulations: [ … ] }` — always **thirteen** entries in **display order** (`REGULATION_DISPLAY_ORDER`): `gdpr`, `data-act`, `ai-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-open-data`, `us-admt`, `iso-27701`, `iso-19941`, `iso-23894`, `soc2` (EU, Indonesia, United States, International).

Each entry (projected by `listRegulations()`):

| Field | Type | Meaning |
|-------|------|---------|
| `id` | string | One of the thirteen ids |
| `shortName` | string | e.g. `GDPR`, `ID PDP Law`, `US CCPA`, `US CO ADMT`, `US OPEN Data` |
| `legalLabel` | string | e.g. `GDPR`, `UU PDP`, `SE AI Ethics`, `CCPA/CPRA`, `CO ADMT`, `OPEN Data Act` |
| `fullName` | string | Official title |
| `maxArticles` | number | Expected article / pasal / section count |
| `maxRecitals` | number | Expected recitals (EU) / considerations (*menimbang*) / ethical values (SE) / purpose notes (US) |
| `maxChapters` | number | Chapter count |
| `segmentMeta` | `{ recitals, articles }` | Human labels, e.g. `{ "recitals": "Considering a–d", "articles": "Pasal 1–76" }` or `{ "recitals": "Purpose notes 1–5", "articles": "§§ 1798.100–1798.199.95" }` |
| `infoBaseUrl`, `infoSiteName` | string | Primary readable source |
| `eurLexUrl`, `eurLexLabel` | string | Official publication link (field names retained for EU legacy; Indonesian entries point to peraturan.go.id / JDIH; US entries point to California leginfo, Colorado session laws, or Congress.gov) |
| `hasArticleTopics` | boolean | GDPR only: **`true`** |
| `hasSuitableRecitals` | boolean | GDPR only: **`true`** |
| `jurisdiction` | `"eu"` \| `"id"` \| `"us"` \| `"intl"` | Drives region picker grouping |
| `jurisdictionLabel` | string | `European Union`, `Indonesia`, `United States`, or `International` |
| `officialSiteName` | string | `EUR-Lex`, `peraturan.go.id`, `JDIH Komdigi`, `California Legislative Information`, `Colorado General Assembly`, or `govinfo` |

Per-instrument `segmentMeta` / counts for the United States entries:

| `id` | `maxArticles` | `maxRecitals` | `maxChapters` | `segmentMeta.articles` | `segmentMeta.recitals` |
|------|:-------------:|:-------------:|:-------------:|------------------------|------------------------|
| `us-ccpa` | 33 | 5 | 7 | `§§ 1798.100–1798.199.95` | `Purpose notes 1–5` |
| `us-open-data` | 10 | 4 | 5 | `Title II §§ 201–202` | `Purpose notes 1–4` |
| `iso-27701` | 14 | 5 | 4 | `Clauses 1–14` | `Purpose notes 1–5` |
| `iso-19941` | 11 | 4 | 4 | `Clauses 1–11` | `Purpose notes 1–4` |
| `iso-23894` | 12 | 5 | 5 | `Clauses 1–12` | `Purpose notes 1–5` |
| `soc2` | 20 | 6 | 5 | `Criteria CC / A / C / PI / P` | `Purpose notes 1–6` |
| `us-admt` | 14 | 5 | 7 | `C.R.S. 6-1-1701–1709` | `Purpose notes 1–5` |

Example (Indonesian soft-law entry):

```json
{
  "id": "id-ai-ethics",
  "shortName": "ID AI Ethics",
  "legalLabel": "SE AI Ethics",
  "fullName": "Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial",
  "maxArticles": 7,
  "maxRecitals": 9,
  "maxChapters": 5,
  "segmentMeta": { "recitals": "Nine ethical values", "articles": "Sections 1–7" },
  "hasArticleTopics": false,
  "hasSuitableRecitals": false,
  "jurisdiction": "id",
  "jurisdictionLabel": "Indonesia",
  "officialSiteName": "JDIH Komdigi"
}
```

Example (United States entry):

```json
{
  "id": "us-open-data",
  "shortName": "US OPEN Data",
  "legalLabel": "OPEN Data Act",
  "fullName": "OPEN Government Data Act (Title II of the Foundations for Evidence-Based Policymaking Act of 2018, Pub. L. 115-435)",
  "maxArticles": 10,
  "maxRecitals": 4,
  "maxChapters": 5,
  "segmentMeta": { "recitals": "Purpose notes 1–4", "articles": "Title II §§ 201–202" },
  "hasArticleTopics": false,
  "hasSuitableRecitals": false,
  "jurisdiction": "us",
  "jurisdictionLabel": "United States",
  "officialSiteName": "govinfo"
}
```

Example (International entry):

```json
{
  "id": "iso-27701",
  "shortName": "ISO 27701",
  "legalLabel": "ISO/IEC 27701",
  "fullName": "ISO/IEC 27701:2025 Privacy information management systems — Requirements and guidance",
  "maxArticles": 14,
  "maxRecitals": 5,
  "maxChapters": 4,
  "segmentMeta": { "recitals": "Purpose notes 1–5", "articles": "Clauses 1–14" },
  "hasArticleTopics": false,
  "hasSuitableRecitals": false,
  "jurisdiction": "intl",
  "jurisdictionLabel": "International",
  "officialSiteName": "ISO"
}
```

**Flag source:** `hasArticleTopics` and `hasSuitableRecitals` are defined on each entry in the internal `REGULATIONS` registry (`lib/regulations.js`). The client merges API values with `regulation-profiles.js` / `regulation-profiles-id.js` / `regulation-profiles-us.js` / `regulation-profiles-iso.js` via `getRegProfile()`. **GDPR:** both `true`; **all twelve other instruments:** both `false`.

---

## API key validation (BYOK)

### `POST /api/validate-api-keys`

Validates Groq and/or Tavily credentials with minimal provider API calls. Keys are **not** stored.

**Body:**

```json
{
  "apiKeys": {
    "groqApiKey": "gsk_…",
    "tavilyApiKey": "tvly-…"
  },
  "checkServerKeys": false
}
```

- Top-level **`groqApiKey`** / **`tavilyApiKey`** are also accepted (same as nested **`apiKeys`**).
- When **`checkServerKeys`** is **`true`** and a body key is empty, the server validates the corresponding **`.env`** key instead.

**Response (200):**

```json
{
  "groq": {
    "provider": "groq",
    "provided": true,
    "valid": true,
    "message": "Groq key is valid."
  },
  "tavily": {
    "provider": "tavily",
    "provided": false,
    "valid": null,
    "message": "No Tavily key entered."
  },
  "checkedAt": "2026-10-22T12:00:00.000Z"
}
```

| Field | Meaning |
|-------|---------|
| `provided` | Whether a key was supplied for that provider |
| `valid` | `true` / `false` when checked; `null` when skipped |
| `status` | Optional HTTP status from provider on failure |

**Validation method:** Groq → `GET https://api.groq.com/openai/v1/models`; Tavily → minimal `search` with `include_answer: false`.

---

## Regulation and structure

### `GET /api/meta`

Regulation-scoped (`?regulation=`). **Response (selected fields):**

```json
{
  "regulationId": "id-pdp",
  "regulation": { "id": "id-pdp", "shortName": "ID PDP Law", "fullName": "…", "maxArticles": 76, "maxRecitals": 4 },
  "regulations": [ { "id": "gdpr", "…": "…" } ],
  "lastRefreshed": "…",
  "lastChecked": "…",
  "etl": { "extractedFrom": "jdih-komdigi", "fetched": true, "significant": false, "datasetHash": "…", "articleCount": 76, "recitalCount": 4 },
  "byokSupported": true,
  "askGroqServerConfigured": true,
  "askTavilyServerConfigured": false,
  "sources": [ { "name": "", "url": "", "description": "", "documents": [ { "label": "", "url": "" } ] } ]
}
```

- **`regulations`:** same thirteen-entry array as `GET /api/regulations` (convenience for first paint).
- **`byokSupported`:** Always **`true`** in current builds (BYOK UI + request-body keys).
- **`askGroqServerConfigured`** / **`askTavilyServerConfigured`:** Server `.env` key presence flags for the Ask status line (legacy aliases `askGroqConfigured` / `askTavilyConfigured` removed).

**`sources` resolution (`resolveCredibleSourcesForRegulation`):**

1. **`meta.sources`** from the loaded corpus file (`data/<id>-content.json`), written from the structure file on ETL.
2. Else **`meta.sources`** from **`data/<id>-structure.json`**.
3. Else, for **`ai-act`**, **`data-act`**, **all three `id-*` instruments**, **all three `us-*` instruments**, and **all four International instruments (`iso-27701`, `iso-19941`, `iso-23894`, `soc2`)**, an **empty array**. **Meta never falls back to GDPR-Info / EUR-Lex / EDPB for `us-*`, `id-*`, `iso-*`, `soc2`, `ai-act`, or `data-act`** (**no cross-jurisdiction fallback**). United States sources are CPPA / California leginfo / California OAG (CCPA), Colorado General Assembly / session laws / coag.gov/ai (ADMT), and govinfo / data.gov / GSA (OPEN Data). International sources are ISO.org catalogue pages and ISO/IEC JTC 1 committees (`iso-27701`), ISO.org plus related ISO/IEC 17788/17789 vocabulary (`iso-19941`), ISO.org plus ISO/IEC 42001 as a **related note only** and JTC 1/SC 42 (`iso-23894`), and AICPA & CIMA (`soc2`).
4. Only **`gdpr`** may use the minimal emergency three-entry list.

Indonesian sources are official portals: JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra (PDF salinan), JDIH Kemenkeu, Setkab, `data.go.id` (instrument-dependent).

### `GET /api/chapters`

Chapters for the active instrument, with `sourceUrl` / `gdprInfoChapterUrl` normalized (the `gdprInfoChapterUrl` name is legacy; it carries the instrument's chapter source URL for every regulation).

### `GET /api/chapter-summaries`

```json
{
  "summaries": { "1": "…", "2": "…" },
  "source": "file | inline-fallback | missing",
  "llm": false,
  "generatedAt": null
}
```

- **`inline-fallback`** applies **only** to `gdpr`. For every other instrument a missing file returns `summaries: {}` and **`source: "missing"`** (GDPR blurbs are never injected into other corpora).
- Files: `chapter-summaries.json` (GDPR), `chapter-summaries-ai-act.json`, `chapter-summaries-data-act.json`, `chapter-summaries-id-pdp.json`, `chapter-summaries-id-satu-data.json`, `chapter-summaries-id-ai-ethics.json`, `chapter-summaries-us-ccpa.json`, `chapter-summaries-us-admt.json`, `chapter-summaries-us-open-data.json`, `chapter-summaries-iso-27701.json`, `chapter-summaries-iso-19941.json`, `chapter-summaries-iso-23894.json`, `chapter-summaries-soc2.json`.

### `POST /api/chapter-summaries/regenerate`

- **Auth:** Requires Groq key in **`.env`** or BYOK body **`apiKeys.groqApiKey`**.
- **503** if no Groq key available; **500** if LLM output not parseable.
- **Success:** Writes the active instrument's chapter-summaries file and returns the GET shape plus `regulationId`, with `source: "regenerated"`, `llm: true`. Number of chapters = `maxChapters` for that instrument.

### `GET /api/articles` / `GET /api/articles/:number`

- List returns the article array (for Indonesian laws these are **Pasal**; for `id-ai-ethics`, the seven **sections / bagian**; for United States instruments, **Sections** — `§` provisions such as `CCPA § 1798.100`).
- Single article: article fields plus `chapter` (object), `contentAsOf`, **`suitableRecitals`** (merged editorial + text citations + fallbacks; **GDPR only**, `[]` for the other twelve).
- **404** `{ "error": "Article not found" }`.

### `GET /api/recitals` / `GET /api/recitals/:number`

- List returns recitals. For Indonesian laws these are the **menimbang** (considering) clauses *a–d*; for `id-ai-ethics` they are the **nine ethical values** (*nilai etika*); for United States and International instruments they are editorial **Purpose notes** (e.g. `Purpose note (1)`).
- Single recital includes `sourceUrl`, `eurLexUrl`, `contentAsOf`, **`suitableArticles`** (GDPR only populated).
- **404** `{ "error": "Recital not found" }`.

### `GET /article-suitable-recitals.json`

Static file route to `data/article-suitable-recitals.json` (GDPR editorial map). When the file is missing the route returns `{ "source": "", "articles": {}, "error": "Cross-reference file not found" }`. Not regulation-scoped.

### `GET /api/industry-sectors`

When **`public/industry-sector-tree.json`** is present and valid, returns:

```json
{
  "sectors": [ { "id", "label", "isicSection", "isicDivision", "searchTerms", "framework" } ],
  "tree": { "schemaVersion", "industries": [ { "id", "label", "sections": ["A", …] } ], "sectorGroups": { "C": [ { "id", "label", "divisionIds": ["ISIC-10", …] } ], … } }
}
```

Otherwise returns a **plain array** of sector objects (same shape as `sectors[]` above) for backward compatibility. Static **`GET /industry-sector-tree.json`** is also available for the Ask UI when the API returns only the array. Sector framing applies to all thirteen instruments.

---

## Ask (Q&A)

> **Ask is `POST /api/answer` only.** Pipeline: BM25 local retrieval → optional web snippets → **Groq** (primary) → **Tavily** (fallback) → **extractive** summary (final fallback). There is no second Q&A route.

### `POST /api/answer`

**Body:**

```json
{
  "query": "string (required)",
  "regulation": "gdpr",
  "includeWeb": true,
  "industrySectorId": "GENERAL",
  "apiKeys": {
    "groqApiKey": "optional — overrides server GROQ_API_KEY when non-empty",
    "tavilyApiKey": "optional — overrides server TAVILY_API_KEY when non-empty"
  }
}
```

- **`regulation`:** one of the thirteen ids (default `gdpr`). Selects the corpus for BM25, the prompt label (`legalLabel`), and web-search context (`regulationSearchContext`: DuckDuckGo suffix + Tavily prefix per instrument, e.g. *Indonesia UU 27/2022 Pelindungan Data Pribadi PDP Law:* for `id-pdp`; *Colorado SB 26-189 Automated Decision-Making Technology ADMT C.R.S. 6-1-1701:* for `us-admt`; *OPEN Government Data Act Public Law 115-435 Title II 44 USC 3511:* for `us-open-data`).
- **`id-ai-ethics` soft-law rule:** the Groq system prompt adds a **LEGAL FORCE** rule — answers must describe obligations as stemming from a *Surat Edaran* (guidance), **not** a binding statute, unless a cited source states otherwise.
- **United States jurisdiction rules:** the prompt and search context carry a jurisdiction note so the model treats `us-*` corpora as **analogues** — the US has no federal GDPR or AI Act (`us-ccpa` is California; `us-admt` is Colorado, duties generally from 1 January 2027). For `us-open-data` the prompt adds a **JURISDICTION** rule: do not confuse with the **2014 DATA Act** (federal spending transparency); this corpus is Title II of Pub. L. 115-435 (44 U.S.C. §§ 3502, 3504, 3506, 3511), a public-sector open-data law, not a private-sector IoT / cloud-switching analogue to the EU Data Act.
- **International legal-force rules:** `iso-27701`, `iso-19941`, `iso-23894`, and `soc2` carry a **LEGAL FORCE** note in the system prompt: they are **voluntary standards / attestation criteria, not laws**, and not substitutes for the GDPR, Data Act, or AI Act. The model must not invent paid ISO clause text or AICPA Points of Focus (corpora are copyright-safe educational overlays). `iso-27701` — the 2019 edition is withdrawn; `iso-19941` — a forthcoming ISO/IEC 19941-1 replacement is noted; `iso-23894` — ISO/IEC 42001 is a *related* certifiable AIMS and must not be described as 23894; `soc2` — Type 1 (design at a point in time) vs Type 2 (operating effectiveness over a period). Duplicate requests for ISO 23894 resolve to the **same single instrument**.
- **`includeWeb`:** default `true`; the server may skip web search for general layperson "explain" queries.

**Response:**

```json
{
  "query": "…",
  "regulationId": "id-pdp",
  "contentAsOf": "…",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "…", "isicSection": null, "isicDivision": null },
  "llm": { "used": true, "provider": "groq", "model": "…", "note": null, "byokGroq": true, "byokTavily": false },
  "answer": "Plain text with [S1] citations…",
  "sources": [
    { "id": "S1", "kind": "regulation", "type": "article", "number": 20, "title": "…", "chapterTitle": "…", "sourceUrl": "…", "eurLexUrl": "…", "excerpt": "…" },
    { "id": "S2", "kind": "web", "title": "…", "url": "…", "snippet": "…", "excerpt": "…" }
  ]
}
```

- **400** `{ "error": "Missing query" }` if `query` is empty.
- Sources are a **prefix** (max 10) of merged local + web list, **filtered** to ids cited in `answer` when `llm.used` (citation ids extracted via `[Sn]`); original `S#` numbering is preserved so UI links stay stable.
- **`llm.used: false`** with provider `null` indicates the **extractive** fallback.
- For Indonesian instruments, regulation sources carry `type: "article"` (Pasal / bagian) or `type: "recital"` (menimbang / nilai) and `sourceUrl` values pointing at JDIH / peraturan.go.id anchors (`#pasal-N`, `#menimbang-N`, `#bagian-N`, `#nilai-N`).
- For **United States** instruments, regulation sources carry `type: "article"` (**Section**, titled `CCPA § N`, `ADMT § N`, or `OPEN Data § N`) or `type: "recital"` (**Purpose note**, titled `Purpose note (N)`), with `sourceUrl` anchors `#section-N` and `#purpose-N` on the official publication pages (California leginfo / CPPA, Colorado General Assembly, govinfo / Congress.gov).

---

## News

News is **not regulation-scoped** at the API layer: `data/gdpr-news.json` holds the merged EU + Indonesian + United States cache. Relevance per instrument is applied **client-side** (`itemMatchesNewsRegulationScope` in `public/app.js`).

### `GET /api/news`

**Response:** `{ "newsFeeds": [ … ], "items": [ … ], "topicTaxonomy": { "groups": [ { "category", "topics": [ { "label" } ] } ], "fallbackTopic" } }`  
Each item includes **`topic`** and **`topicCategory`** (from **`news-topics.js`**) after server-side annotation. **`topicTaxonomy`** drives News tab topic **optgroups** and includes the Indonesian categories **Indonesia Personal Data Protection**, **Indonesia Satu Data**, and **Indonesia AI Ethics**, plus **United States CCPA**, **United States OPEN Data**, and **United States ADMT**.  
Default read path serves the **persisted** `data/gdpr-news.json` (deduped, capped at **`NEWS_MERGE_CAP`**, default **6000**) for a fast, reliable response. **`newsFeeds`** is merged with `DEFAULT_NEWS_FEEDS` and includes Indonesian feeds (Antara Hukum / Tekno, Komdigi, Setkab, Satu Data Indonesia) and United States feeds (FTC, CPPA, California OAG, Colorado AG, data.gov, GSA, Federal Data Strategy) alongside EDPB, EDPS, Commission, ICO (UK), Council of Europe and EU Digital Strategy (AI).

**Caching:** Success responses set **`Cache-Control: no-store, no-cache, must-revalidate`** and **`Pragma: no-cache`**.

**Query:** Optional **`?live=1`** triggers a bounded live crawl (`withTimeout`, **`NEWS_CRAWL_TIMEOUT_MS`**) merged into the stored list; on timeout the stored list is returned unchanged.

### `POST /api/news/refresh`

Runs the full crawl (EU publishers, `crawlIndonesiaOfficialNews`, and `crawlUnitedStatesOfficialNews`: FTC, CPPA/CalPrivacy, California OAG, Colorado AG ADAI hub, data.gov / Federal Data Strategy), merges, writes `gdpr-news.json` (up to internal `storeCap`), and returns:

```json
{
  "ok": true,
  "newsFeeds": [ ],
  "items": [ ],
  "topicTaxonomy": { "groups": [ ], "fallbackTopic": "…" },
  "mergedTotal": 0,
  "stored": 0
}
```

- Indonesian items outside trusted tag hubs must pass the **Indonesian policy gate** (`indonesiaPolicyNewsRe` / `indonesiaNewsItemIsOnScope`) — UU PDP, *pelindungan data pribadi*, Satu Data, Perpres 39/2019, *etika kecerdasan artifisial*, SE 9/2023, etc.
- **`ok: false`** still returns **HTTP 200** with `error` string and best-effort stored `items` plus **`topicTaxonomy`** on crawl failure/timeout (`NEWS_REFRESH_TIMEOUT_MS`).
- Komdigi HTML may be WAF-blocked; this degrades gracefully (other Indonesian sources still populate).
- International items (ISO news, ISO Insights, AICPA SOC for Service Organizations) are seeded by `internationalCatalogueNewsSeed()` / `scripts/seed-iso-soc-news.js` and gated by **`internationalPolicyNewsRe`** / **`internationalNewsItemIsOnScope`**; live crawl is best-effort.

### `GET` / `POST /api/news/article-attachments`

**Body (POST):** `{ "url": "https://publisher.example/article" }`  
**Query (GET fallback):** `?url=` encoded article URL.

**Response:** `{ "ok": true, "cached": false, "attachments": [ { "label", "url", "type?" } ] }` or `{ "ok": false, "error": "…" }`.

- **400** missing/invalid/too-long URL; **403** URL not on the allowlist; **502** upstream fetch/parse failure.
- URLs must pass allowlist / SSRF checks in **`news-article-attachments.js`**.
- Results may be cached per **`NEWS_ATTACHMENTS_CACHE_*`**.

### `POST /api/news/attachments-summary`

**Body:** `{ "urls": [ "https://…", … ] }` (deduped, capped at **96**).

**Response:** `{ "ok": true, "items": [ { "url": "…", "count": 2 } ] }` — `count` is `null` when the probe failed; used to hide **Attachments** when `count === 0`. **400** if `urls` is not an array.

---

## Maintenance

### `POST /api/refresh`

Regulation-scoped. Body `{ "regulation": "<id>" }` (or `?regulation=`). Dispatches through `runRegulationScraperAndReloadContent(id)`:

| `regulation` | ETL module |
|--------------|-----------|
| `gdpr` (default / fallback) | `scraper.js` |
| `ai-act` | `ai-act-scraper.js` |
| `data-act` | `data-act-scraper.js` |
| `id-pdp`, `id-satu-data`, `id-ai-ethics` | `id-law-scraper.js` → `run(id)` |
| `us-ccpa`, `us-admt`, `us-open-data` | `us-law-scraper.js` → `run(id)` |
| `iso-27701`, `iso-19941`, `iso-23894`, `soc2` | `iso-soc-scraper.js` → `run(id)` |

Each path: merge → **`normalizeCorpus`** (**`document-formatting-guardrails.js`**) → **`buildSearchIndex`** → write `<id>-content.json`; then the content cache is invalidated and **`loadContent()`** reloads so the running process serves the new file.

**Response (success):**

```json
{
  "success": true,
  "regulationId": "gdpr",
  "lastRefreshed": "2026-10-22T12:00:00.000Z",
  "lastChecked": "2026-10-22T12:00:05.000Z",
  "etl": {
    "extractedFrom": "gdpr-info",
    "fetched": true,
    "significant": true,
    "datasetHash": "…"
  },
  "formattingGuardrails": {
    "ok": true,
    "checks": [
      { "id": "recitals-count", "ok": true, "detail": "recitals=173" },
      { "id": "articles-count", "ok": true, "detail": "articles=99" }
    ],
    "warnings": []
  },
  "message": "Sources refreshed successfully (significant changes loaded from gdpr-info)."
}
```

- **Indonesian `etl` shape:** `{ extractedFrom: "jdih-komdigi" | "jdih-kemenkoinfra-pdf" | "jdih-live" | "bundled-official", fetched, significant, datasetHash, articleCount, recitalCount }`. The Indonesian ETL **keeps the bundled official corpus** when the live JDIH HTML extract is incomplete, and throws (→ **500**) only if even the existing corpus is below the minimum counts (`MIN_<PREFIX>_ARTICLES` / `_RECITALS`).
- **United States `etl` shape:** same fields; `extractedFrom` defaults to **`"bundled-official"`** (or the value already stored in the corpus). The US ETL pings the official source (CPPA / leginfo, Colorado General Assembly, govinfo), **keeps the bundled official corpus** when it already meets `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, or `MIN_US_OPEN_DATA_*` (`_ARTICLES` / `_RECITALS`), and throws (→ **500**) only when the existing corpus is below the minimum article count.
- **`message`** variants: significant change loaded; "ETL ran (no significant changes detected …)"; or "ETL ran but extract failed (kept existing dataset)".
- **`formattingGuardrails`**: output of **`validateCorpusFormatting`** (see [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)). The client may **`console.warn`** each entry in **`warnings`**.
- **500** `{ "success": false, "error": "…" }` on uncaught exception.

### Cron (Vercel; not for browsers)

`GET /api/cron/daily-regulation-refresh` — `Authorization: Bearer $CRON_SECRET`. Refreshes **all thirteen** instruments sequentially (`gdpr`, `ai-act`, `data-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-admt`, `us-open-data`, `iso-27701`, `iso-19941`, `iso-23894`, `soc2`) and returns:

```json
{
  "ok": true,
  "job": "daily-regulation-refresh",
  "gdpr": { "lastRefreshed": "…", "lastChecked": "…" },
  "aiAct": { "lastRefreshed": "…", "lastChecked": "…" },
  "dataAct": { "lastRefreshed": "…", "lastChecked": "…" },
  "idPdp": { "lastRefreshed": "…", "lastChecked": "…" },
  "idSatuData": { "lastRefreshed": "…", "lastChecked": "…" },
  "idAiEthics": { "lastRefreshed": "…", "lastChecked": "…" },
  "usCcpa": { "lastRefreshed": "…", "lastChecked": "…" },
  "usAdmt": { "lastRefreshed": "…", "lastChecked": "…" },
  "usOpenData": { "lastRefreshed": "…", "lastChecked": "…" },
  "iso27701": { "lastRefreshed": "…", "lastChecked": "…" },
  "iso19941": { "lastRefreshed": "…", "lastChecked": "…" },
  "iso23894": { "lastRefreshed": "…", "lastChecked": "…" },
  "soc2": { "lastRefreshed": "…", "lastChecked": "…" }
}
```

Each key carries `lastRefreshed` / `lastChecked` (`null` when absent). **401** `{ "error": "Unauthorized" }` without a valid secret; **500** `{ ok: false, error }` on failure (a failure in any instrument aborts the remaining ones). Local equivalent: `node-cron` at 02:00 `Europe/Brussels` inside `server.js`.

---

## Static and SPA

- **`GET /*`** (non-file): serves `public/index.html` for client routing.
- **Static:** Everything under `public/` (e.g. `styles.css`, `app.js`, `regulation-profiles.js`, `regulation-profiles-id.js`, `regulation-profiles-us.js`, `news-dedupe.js`, `industry-sectors.json`, copied `article-suitable-recitals.json`).

---

## Removed routes (1.2.6)

These routes **no longer exist**. Do **not** call them or document them as live. Verified 2026-10-20: `POST /api/ask` → **404**; `GET /api/categories` → **200 with the SPA `index.html`** (via the `GET /*` fallback — not JSON), so clients must not treat a 200 as proof the route exists.

| Removed route | Why | Replacement |
|---------------|-----|-------------|
| `GET /api/categories` | Unused by the SPA | Use `GET /api/chapters` (chapter title acts as category in the GDPR Browse filter) |
| `GET /api/chapters/:number` | Unused by the SPA | Use `GET /api/chapters` + `GET /api/articles` and filter by `chapter` |
| `POST /api/ask` | Legacy token search; the Ask tab already used `/api/answer` | **`POST /api/answer`** |
| `POST /api/summarize` | Multi-provider summarizer unused by the SPA | **`POST /api/answer`** (Groq → Tavily → extractive); OpenAI / Anthropic / Gemini / Mistral / OpenRouter paths removed |

See [CHANGELOG.md](../CHANGELOG.md) § 1.2.6.

---

## Versioning

- No URL version prefix (`/v1`); breaking changes should bump **package.json** version and this document together. Current package version: **1.3.0** (documentation standard **v3.2**, audit **2026-10-23**).

---

## See also

- [VARIABLES.md](VARIABLES.md) — environment variables affecting behavior  
- [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) — JSON fragments for all thirteen corpora  
- [README.md §9](../README.md#9-api-reference-summary)
