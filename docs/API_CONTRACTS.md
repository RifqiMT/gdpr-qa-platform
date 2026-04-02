# API contracts  
## GDPR Q&A Platform

Base URL: same origin as the static app (e.g. `http://localhost:3847`).  
Content type: JSON for all `/api/*` routes unless noted.

---

## Conventions

- **Timestamps:** ISO 8601 strings where present (`meta.lastRefreshed`, `contentAsOf`, news `date`).
- **Errors:** Many routes return `200` with partial data on soft failure (e.g. news crawl timeout); hard errors use `4xx`/`5xx` with `{ error: string }` where implemented.
- **CORS:** Enabled for Express (`cors()` middleware).

---

## Regulation and structure

### `GET /api/meta`

**Response (selected fields):**

```json
{
  "lastRefreshed": "…",
  "lastChecked": "…",
  "etl": { },
  "askGroqConfigured": true,
  "askTavilyConfigured": false,
  "sources": [ { "name": "", "url": "", "description": "", "documents": [ { "label": "", "url": "" } ] } ]
}
```

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

- **Auth:** Requires `GROQ_API_KEY`.
- **503** if key missing; **500** if LLM output not parseable.
- **Success:** Writes `data/chapter-summaries.json` and returns the same shape as GET with `source: "regenerated"`, `llm: true`.

### `GET /api/articles` / `GET /api/articles/:number`

- Single article includes `chapter`, `contentAsOf`, **`suitableRecitals`** (merged editorial + text citations + fallbacks).

### `GET /api/recitals` / `GET /api/recitals/:number`

- Single recital includes `sourceUrl`, `eurLexUrl`, `contentAsOf`, **`suitableArticles`**.

### `GET /article-suitable-recitals.json`

Static file route to `data/article-suitable-recitals.json` (editorial map). **404** file handling returns JSON `{ error: … }` from code path when file missing.

### `GET /api/industry-sectors`

Returns array of sector objects: `id`, `label`, `isicSection`, `searchTerms`, `framework` (see `public/industry-sectors.json`).

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
  "industrySectorId": "GENERAL"
}
```

**Response:**

```json
{
  "query": "…",
  "contentAsOf": "…",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "…", "isicSection": null },
  "llm": { "used": true, "provider": "groq", "model": "…", "note": null },
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

**Response:** `{ "newsFeeds": [ … ], "items": [ … ] }`  
Merges `data/gdpr-news.json` with live crawl within timeout; caps at `NEWS_MERGE_CAP`.

### `POST /api/news/refresh`

Runs full crawl, merges, writes `gdpr-news.json` (up to internal `storeCap`), returns:

```json
{
  "ok": true,
  "newsFeeds": [ ],
  "items": [ ],
  "mergedTotal": 0,
  "stored": 0
}
```

- **`ok: false`** still **200** with `error` string and best-effort `items` on crawl failure.

---

## Maintenance

### `POST /api/refresh`

Runs `scraper.js` ETL. Returns `success`, `lastRefreshed`, `lastChecked`, `etl`, `message`. **500** on throw.

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
