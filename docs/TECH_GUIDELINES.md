# Technical guidelines  
## EU Regulation Q&A Platform

**Version:** 1.2  
**Audience:** Engineering, DevOps, security review  
**Status:** Active · Documentation standard **v1.8** · Product **1.2.0**

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

## 8. Code conventions

- Match existing **vanilla JS** style in `app.js` (IIFE, `function` declarations).  
- Regulation-specific copy in **`regulation-profiles.js`**, not scattered GDPR strings.  
- New regulation: add entry to `lib/regulations.js`, structure + content JSON, scraper, chapter summaries file, profile in `regulation-profiles.js`.  
- API changes: update `docs/API_CONTRACTS.md` and `docs/TRACEABILITY_MATRIX.md`.

---

## 9. Testing checklist (manual)

- [ ] Switch GDPR ↔ AI Act — Browse lists correct counts.  
- [ ] Ask on AI Act: “What is a high-risk AI system?” — cites AI Act articles.  
- [ ] Sources tab shows AI Act Law + EUR-Lex when AI Act selected.  
- [ ] News with AI Act: banner visible; filtered count < full corpus.  
- [ ] `POST /api/refresh` per regulation succeeds.  
- [ ] BYOK validate + Ask with client keys.  
- [ ] `GET /health` returns `ok`.

---

## 10. Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md)  
- [API_CONTRACTS.md](API_CONTRACTS.md)  
- [VARIABLES.md](VARIABLES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
