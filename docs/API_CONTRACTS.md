# API contracts  
## GDPR Q&A Platform

Base URL: same origin as the static app (e.g. `http://localhost:3847`).  
Content type: JSON for all `/api/*` routes unless noted.

---

## Conventions

- **Timestamps:** ISO 8601 strings where present (`meta.lastRefreshed`, `contentAsOf`, news `date`).
- **Errors:** Many routes return `200` with partial data on soft failure (e.g. news crawl timeout); hard errors use `4xx`/`5xx` with `{ error: string }` where implemented.
- **CORS:** Enabled for Express (`cors()` middleware).
- **BYOK:** Client-supplied API keys travel in JSON request bodies as **`apiKeys`** (see below). The server **does not** persist BYOK keys to disk or log secret values.

---

## Health

### `GET /health`

**Response:** Plain text **`ok`** (HTTP **200**). Use for load balancers and liveness checks.

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
  "checkedAt": "2026-05-19T12:00:00.000Z"
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

**Response (selected fields):**

```json
{
  "lastRefreshed": "…",
  "lastChecked": "…",
  "etl": { },
  "byokSupported": true,
  "askGroqConfigured": true,
  "askTavilyConfigured": false,
  "askGroqServerConfigured": true,
  "askTavilyServerConfigured": false,
  "sources": [ { "name": "", "url": "", "description": "", "documents": [ { "label": "", "url": "" } ] } ]
}
```

- **`byokSupported`:** Always **`true`** in current builds (BYOK UI + request-body keys).
- **`askGroqConfigured`** / **`askTavilyConfigured`:** Mirror **server** `.env` presence (legacy names retained).
- **`askGroqServerConfigured`** / **`askTavilyServerConfigured`:** Explicit server-key flags for the Ask status line.

**`sources`:** Populated from **`gdpr-content.json`** → **`meta.sources`** (written on regulation refresh from **`gdpr-structure.json`**). If missing, the server uses **`data/gdpr-structure.json`** → **`meta.sources`** at startup; if that fails, a minimal three-entry emergency list applies. Intended to stay aligned with **News** crawler publishers (e.g. EDPB/EDPS RSS, ICO news hub, Commission Press Corner). National DPAs other than **ICO (UK)** are not listed.

### `GET /api/categories`

Returns `categories` array from loaded content.

### `GET /api/chapters`

Chapters with `sourceUrl` / `gdprInfoChapterUrl` normalized.

### `GET /api/chapters/:number`

404 if missing. Returns chapter plus `articles[]` for that chapter.

### `GET /api/chapter-summaries`

```json
{
  "summaries": { "1": "…", "2": "…", …, "11": "…" },
  "source": "file | inline-fallback",
  "llm": false,
  "generatedAt": null
}
```

### `POST /api/chapter-summaries/regenerate`

- **Auth:** Requires Groq key in **`.env`** or BYOK body **`apiKeys.groqApiKey`**.
- **503** if no Groq key available; **500** if LLM output not parseable.
- **Success:** Writes `data/chapter-summaries.json` and returns the same shape as GET with `source: "regenerated"`, `llm: true`.

### `GET /api/articles` / `GET /api/articles/:number`

- Single article includes `chapter`, `contentAsOf`, **`suitableRecitals`** (merged editorial + text citations + fallbacks).

### `GET /api/recitals` / `GET /api/recitals/:number`

- Single recital includes `sourceUrl`, `eurLexUrl`, `contentAsOf`, **`suitableArticles`**.

### `GET /article-suitable-recitals.json`

Static file route to `data/article-suitable-recitals.json` (editorial map). **404** file handling returns JSON `{ error: … }` from code path when file missing.

### `GET /api/industry-sectors`

When **`public/industry-sector-tree.json`** is present and valid, returns:

```json
{
  "sectors": [ { "id", "label", "isicSection", "isicDivision", "searchTerms", "framework" } ],
  "tree": { "schemaVersion", "industries": [ { "id", "label", "sections": ["A", …] } ], "sectorGroups": { "C": [ { "id", "label", "divisionIds": ["ISIC-10", …] } ], … } }
}
```

Otherwise returns a **plain array** of sector objects (same shape as `sectors[]` above) for backward compatibility. Static **`GET /industry-sector-tree.json`** is also available for the Ask UI when the API returns only the array.

---

## Search and Q&A

### `POST /api/ask`

**Body:** `{ "query": "string" }`  
**Response:** `{ "query", "contentAsOf", "results": [ { "type", "id", "number", "title", "excerpt", "sourceUrl", "eurLexUrl", "chapterTitle" } ] }`

- **Purpose:** Legacy/simple token search over `searchIndex` (top 25). The **Ask tab UI** uses `/api/answer` instead.

### `POST /api/answer`

**Body:**

```json
{
  "query": "string (required)",
  "includeWeb": true,
  "industrySectorId": "GENERAL",
  "apiKeys": {
    "groqApiKey": "optional — overrides server GROQ_API_KEY when non-empty",
    "tavilyApiKey": "optional — overrides server TAVILY_API_KEY when non-empty"
  }
}
```

**Response:**

```json
{
  "query": "…",
  "contentAsOf": "…",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "…", "isicSection": null },
  "llm": { "used": true, "provider": "groq", "model": "…", "note": null, "byokGroq": true, "byokTavily": false },
  "answer": "Plain text with [S1] citations…",
  "sources": [
    { "id": "S1", "kind": "regulation", "type": "article", "number": 5, "title": "…", "chapterTitle": "…", "sourceUrl": "…", "eurLexUrl": "…", "excerpt": "…" },
    { "id": "S2", "kind": "web", "title": "…", "url": "…", "snippet": "…", "excerpt": "…" }
  ]
}
```

- **400** if `query` empty.
- Sources are a **prefix** of merged local + web list, possibly **filtered** to only ids cited in `answer` when `llm.used` (citation ids extracted via `[Sn]` regex).

### `POST /api/summarize`

**Body:** `{ "query": "…", "excerpts": [ { "type", "number", "excerpt", … } ] }`  
**Response:** `{ "query", "summary" }`  
Uses `LLM_PROVIDER` and available keys; falls back to extractive summary.

---

## News

### `GET /api/news`

**Response:** `{ "newsFeeds": [ … ], "items": [ … ], "topicTaxonomy": { "groups": [ { "category", "topics": [ { "label" } ] } ], "fallbackTopic" } }`  
Each item includes **`topic`** and **`topicCategory`** (from **`news-topics.js`**) after server-side annotation. **`topicTaxonomy`** drives News tab topic **optgroups**.  
Merges `data/gdpr-news.json` with live crawl within **`NEWS_CRAWL_TIMEOUT_MS`** (when live crawl runs); results pass through **`dedupeNewsItemsConsolidated`**; caps at **`NEWS_MERGE_CAP`** (default **6000**). Crawl depth is further bounded inside **`news-crawler.js`** and optional **`NEWS_MAX_*`** / **`NEWS_COMMISSION_*`** / topic-enrichment env vars (see [VARIABLES.md](VARIABLES.md)).

**Caching:** Success responses set **`Cache-Control: no-store, no-cache, must-revalidate`** and **`Pragma: no-cache`** so browsers and intermediaries do not treat merged news as a long-lived cache entry.

**Query:** Optional **`?live=1`** (or truthy `live`) triggers a bounded live crawl merge on the read path (same timeout as above).

### `POST /api/news/refresh`

Runs full crawl, merges, writes `gdpr-news.json` (up to internal `storeCap`), returns:

```json
{
  "ok": true,
  "newsFeeds": [ ],
  "items": [ ],
  "topicTaxonomy": { "groups": [ ], "fallbackTopic": "Other GDPR & data protection topics" },
  "mergedTotal": 0,
  "stored": 0
}
```

- **`ok: false`** still **200** with `error` string and best-effort `items` (with topics) plus **`topicTaxonomy`** on crawl failure.

### `GET` / `POST /api/news/article-attachments`

**Body (POST):** `{ "url": "https://publisher.example/article" }`  
**Query (GET fallback):** `?url=` encoded article URL.

**Response:** `{ "ok": true, "attachments": [ { "label", "url", "type?" } ] }` or `{ "ok": false, "error": "…" }`.

- URLs must pass allowlist / SSRF checks in **`news-article-attachments.js`**.
- Results may be cached per **`NEWS_ATTACHMENTS_CACHE_*`**.

### `POST /api/news/attachments-summary`

**Body:** `{ "urls": [ "https://…", … ] }` (deduped, capped, typically ≤ 96).

**Response:** `{ "items": [ { "url": "…", "count": 2 } ] }` — used to hide **Attachments** when `count === 0`.

---

## Maintenance

### `POST /api/refresh`

Runs **`scraper.js`** ETL end-to-end: merge → **`normalizeCorpus`** (**`document-formatting-guardrails.js`**) → **`buildSearchIndex`** → write **`gdpr-content.json`**. Then **`invalidateRegulationContentCache`** and **`loadContent()`** so the running process serves the new file.

**Response (success):**

```json
{
  "success": true,
  "lastRefreshed": "2026-04-03T12:00:00.000Z",
  "lastChecked": "2026-04-03T12:00:05.000Z",
  "etl": {
    "primaryRequested": "gdpr-info",
    "extractedFrom": "gdpr-info",
    "fetched": true,
    "significant": true,
    "datasetHash": "…",
    "diff": { "recitals": {}, "articles": {}, "changedItems": 0, "changeRatio": 0 }
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

- **`formattingGuardrails`**: output of **`validateCorpusFormatting`** (§8 smoke tests — see [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)). The client may **`console.warn`** each entry in **`warnings`**.  
- **500** on uncaught exception.

---

## Static and SPA

- **`GET /*`** (non-file): serves `public/index.html` for client routing.
- **Static:** Everything under `public/` (e.g. `styles.css`, `app.js`, `industry-sectors.json`, copied `article-suitable-recitals.json`).

---

## Versioning

- No URL version prefix (`/v1`); breaking changes should bump **package.json** version and this document together.

---

## See also

- [VARIABLES.md](VARIABLES.md) — environment variables affecting behavior  
- [README.md §9](../README.md#9-api-reference-summary)
