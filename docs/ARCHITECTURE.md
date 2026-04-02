# Architecture overview  
## GDPR Q&A Platform

## System context

```mermaid
flowchart LR
  user[User browser]
  app[GDPR Q&A Platform Node Express]
  eurlex[EUR-Lex GDPR-Info]
  news[Publisher sites EDPB ICO etc]
  groq[Groq API]
  tavily[Tavily API]
  ddg[DuckDuckGo HTML]

  user --> app
  app --> eurlex
  app --> news
  app --> groq
  app --> tavily
  app --> ddg
```

---

## Logical architecture

| Layer | Components | Responsibility |
|-------|------------|----------------|
| **Client** | `public/index.html`, `public/app.js`, `public/styles.css` | Tabs, browse reader, Ask composer, news/sources UI, PDF export |
| **API** | `server.js` | REST endpoints, content load, BM25 retrieval, LLM orchestration, news merge |
| **ETL** | `scraper.js` + **`document-formatting-guardrails.js`** | Fetch and parse regulation → **`normalizeCorpus`** → **`buildSearchIndex`** → **`gdpr-content.json`** |
| **News** | `news-crawler.js` | Fetch listings → items merged in server |
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

  UI->>S: POST /api/refresh
  S->>SCR: run() ETL merge + fetch
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

  UI->>S: POST /api/answer { query, industrySectorId, includeWeb }
  S->>S: loadContent + buildLocalContext (BM25)
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

- **Single process** — One Node.js server serves API and static files.
- **Stateful files** — `data/` directory should persist on disk between restarts (content + news cache).
- **Secrets** — Environment variables only; no database required for core features.

---

## Extension points

- **New LLM provider for Ask:** Extend `server.js` with a parallel path to Groq/Tavily (keep citation contract).
- **Additional news sources:** Implement fetch/parser in `news-crawler.js` and add feed metadata to defaults or JSON.
- **Sector list:** Edit `public/industry-sectors.json` (and optional server copy if split later).

---

## References

- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [README.md §8 Project structure](../README.md#8-project-structure)
