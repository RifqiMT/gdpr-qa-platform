# Architecture overview  
## EU Regulation Q&A Platform

**Version:** 1.5 · **Last updated:** 2026-05-19 · Documentation standard **v2.1** · Product **1.2.3**

## System context

```mermaid
flowchart LR
  user[User browser]
  app[EU Regulation Q&A Node Express]
  gdprSrc[GDPR-Info / EUR-Lex]
  aiSrc[AI Act Law / EUR-Lex 2024/1689]
  daSrc[Data Act Law / EUR-Lex 2023/2854]
  news[Publisher sites EDPB EDPS ICO Commission CoE]
  groq[Groq API]
  tavily[Tavily API]
  ddg[DuckDuckGo HTML]

  user --> app
  app --> gdprSrc
  app --> aiSrc
  app --> daSrc
  app --> news
  app --> groq
  app --> tavily
  app --> ddg
```

---

## Logical architecture

| Layer | Components | Responsibility |
|-------|------------|----------------|
| **Client** | `index.html`, `app.js`, `regulation-profiles.js`, `news-dedupe.js`, `styles.css` | `#appChrome` (sticky header + tabs ≤899px); **Tools** panel; `syncHeaderToolbarStatus`; News hero; regulation switcher; tabs; regulation-aware Ask/Sources/News/Browse |
| **API** | `server.js` | REST; `parseRegulationId`; BM25; Groq/Tavily with `regulationSearchContext` |
| **Registry** | `lib/regulations.js`, `lib/regulation-content.js`, `lib/paths.js` | Regulation metadata; `loadContent(regId)`; Vercel `/tmp` |
| **ETL GDPR** | `scraper.js` + **`document-formatting-guardrails.js`** | → **`gdpr-content.json`** |
| **ETL AI Act** | `ai-act-scraper.js` | → **`ai-act-content.json`** |
| **ETL Data Act** | `data-act-scraper.js` | → **`data-act-content.json`** |
| **News** | `news-crawler.js`, `news-topics.js`, `server.js` (merge, dedupe, routes), `public/news-dedupe.js` | Parallel fetches (RSS/HTML/API) → relevance gate → topic assignment → merge → **consolidated dedupe** → API + client mirror |
| **Crossrefs** | `gdpr-crossrefs.js` | Article↔recital suitability and citation extraction |
| **Data** | `data/*.json`, `public/industry-sectors.json` | Corpus, news cache, chapter summaries, sectors |

---

## Regulation refresh pipeline (sequence)

```mermaid
sequenceDiagram
  participant UI as Browser
  participant S as server.js
  participant SCR as scraper.js
  participant DF as document-formatting-guardrails
  participant FS as File system

  UI->>S: POST /api/refresh { regulation }
  S->>SCR: scraper / ai-act-scraper / data-act-scraper per regulation
  SCR->>DF: normalizeCorpus(recitals, articles)
  DF-->>SCR: normalized arrays
  SCR->>SCR: buildSearchIndex
  SCR->>FS: write gdpr-content.json
  SCR-->>S: output meta
  S->>S: invalidateRegulationContentCache
  S->>S: loadContent() reload + normalize on read
  S-->>UI: JSON success + formattingGuardrails
```

---

## Ask pipeline (sequence)

```mermaid
sequenceDiagram
  participant UI as Browser
  participant S as server.js
  participant G as Groq API
  participant T as Tavily API
  participant W as Web (DDG + pages)

  UI->>S: POST /api/answer { query, industrySectorId, includeWeb, apiKeys? }
  Note over UI,S: apiKeys optional BYOK from localStorage
  S->>S: resolveLlmKeys + loadContent + buildLocalContext (BM25)
  opt includeWeb
    S->>W: DuckDuckGo + fetch excerpts
  end
  S->>G: chat/completions (grounded prompt)
  alt Groq OK
    G-->>S: answer text
  else Groq fails
    S->>T: search (optional)
    T-->>S: answer or snippets
  else all fail
    S-->>S: buildSummaryFromExcerpts (extractive)
  end
  S-->>UI: JSON answer + sources
```

---

## Deployment model

- **Local / VM** — One Node.js process (`npm start`) serves API and static files; `node-cron` runs daily regulation ETL at 02:00 Europe/Brussels.
- **Vercel** — Express app exported via `api/index.js`; all routes rewrite to that function; bundled `data/` is seeded into `/tmp/gdpr-qa-data` per instance (`lib/paths.js`). Daily ETL uses Vercel Cron → `api/cron/daily-regulation-refresh.js` with `CRON_SECRET`. See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).
- **Stateful files (local)** — `data/` should persist on disk between restarts (content + news cache). On Vercel, treat committed `data/` as source of truth; `/tmp` writes are ephemeral.
- **Secrets** — Environment variables only; no database required for core features. BYOK keys stay in the browser.

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

- **New LLM provider for Ask:** Extend `server.js` with a parallel path to Groq/Tavily (keep citation contract).
- **BYOK providers:** Extend **`resolveLlmKeys`** and validation helpers; never persist client keys server-side.
- **Additional news sources:** Implement fetch/parser in `news-crawler.js` and add feed metadata to defaults or JSON.
- **Sector list:** Edit `public/industry-sectors.json` (and optional server copy if split later).

---

## References

- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [README.md §8 Project structure](../README.md#8-project-structure)
