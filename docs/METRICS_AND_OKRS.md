# Product metrics and OKRs  
## GDPR Q&A Platform

**Last updated:** 2026-04 (aligned with documentation standard v1.3 and expanded News ingestion).

This document defines **product metrics** (what to measure in production or research) and **Objectives and Key Results (OKRs)** for the product team. Metrics should be collected in a way that respects privacy (no unnecessary logging of full question text in shared analytics without policy).

---

## 1. North-star and supporting metrics

### 1.1 North-star metric (suggested)

| Metric | Friendly name | Definition | Why it matters |
|--------|---------------|------------|----------------|
| **Weekly active reference sessions** | WARef | Count of browser sessions (or anonymous session ids) that complete at least one meaningful action: open an Article/Recital detail, submit Ask, or export PDF, within 7 days. | Reflects real use of the core value: working with the regulation text. |

### 1.2 Supporting product metrics

| Metric | Definition | Notes / formula |
|--------|------------|-----------------|
| **Ask success rate** | Share of `POST /api/answer` requests that return HTTP 200 with a non-empty `answer` field. | Segment by `llm.used` and `llm.provider` to compare Groq vs Tavily vs extractive. |
| **Citation usability** | Share of Ask answers where every sentence matches the server’s citation regex (or user clicks at least one `[Sn]` chip). | Proxy for grounded-output quality; tune prompts if this drops. |
| **Browse depth** | Average number of article/recital detail views per session after a filter or search. | Higher may indicate research tasks; combine with time-on-task. |
| **Refresh adoption** | Share of deployments or sessions where `meta.lastRefreshed` is within N days of “today.” | Stale corpus hurts trust; drive “Refresh sources” UX. |
| **News engagement** | Click-through rate from in-app news cards to external publisher URLs. | Validates news value without hosting content. |
| **News duplicate density** | Before/after dedupe: ratio of raw merged rows to rows after **`dedupeNewsItemsConsolidated`** (server log or one-off script). | Should trend **low** after crawl fixes; client **`news-dedupe.js`** is a safety net—large gaps imply server/JSON drift. |
| **News items post-gate (count)** | Number of items returned after **`crawlNews`** + **`newsItemMatchesApprovedTopic`** (or length of **`GET /api/news`** `items` after merge cap). | Tracks ingestion health; sudden drops may indicate upstream HTML/RSS changes, **403** blocks, or timeouts. Segment by **`sourceName`** when debugging. |
| **News refresh duration** | Wall-clock time for **`POST /api/news/refresh`** until response (compare to **`NEWS_REFRESH_TIMEOUT_MS`**). | Approaching timeout suggests raising cap or reducing crawl depth via **`NEWS_MAX_*`**. |
| **News API cache bypass** | Share of `GET /api/news` responses whose **`Cache-Control`** includes **`no-store`** (monitoring or spot-check). | Confirms users see post-refresh merges without aggressive HTTP caching. |
| **Sector usage** | Share of Ask requests with `industrySectorId !== 'GENERAL'`. | Informs sector list quality and prompt tuning. |
| **Time to first answer** | p50/p95 latency of `POST /api/answer` end-to-end. | Dominated by LLM and web fetches; track regressions after deploys. |

### 1.3 Quality and risk metrics

| Metric | Definition |
|--------|------------|
| **Fallback rate** | Answers where `llm.used === false` (extractive path). High rate may indicate key misconfiguration or quota issues. |
| **Error rate** | 4xx/5xx on critical routes: `/api/answer`, `/api/refresh`, `/api/news`. |
| **Scraper failure rate** | Failed or no-significant-change runs from cron or manual refresh (from logs / `meta.etl`). |

### 1.4 Document formatting and corpus integrity

| Metric | Friendly name | Definition | Notes |
|--------|---------------|------------|--------|
| **formattingGuardrails.ok** | Guardrails pass flag | Share of **`POST /api/refresh`** responses where **`formattingGuardrails.ok === true`**. | **`false`** indicates §8 smoke warnings — inspect **`warnings[]`** and corpus (Art. 1, 4, 5, 89, recital 50, counts). |
| **Guardrails warning count** | Validation warning volume | Count of strings in **`formattingGuardrails.warnings`** per refresh. | Trend upward after ETL changes signals regression. |
| **Normalize-on-read consistency** | Read-path normalization active | Implicit: **`loadContent()`** always applies **`normalizeCorpus`**. | Spot-check: API body matches guardrail expectations after editing JSON manually. |

---

## 2. Technical operational metrics

| Metric | Purpose |
|--------|---------|
| **API latency** | p50/p95 for `GET /api/articles/:n`, `POST /api/answer`, `GET /api/news`. |
| **News crawl duration** | Wall time vs `NEWS_CRAWL_TIMEOUT_MS` to tune timeouts. |
| **Disk footprint** | Size of `gdpr-content.json` and `gdpr-news.json` after refresh. |
| **Process health** | Uptime, memory, single-thread Node event-loop lag (if instrumented). |

---

## 3. OKRs (example cycle — adjust per quarter)

### Objective O1: Users trust answers because they are traceable to the regulation.

| Key result | Target (example) |
|------------|------------------|
| KR1 | ≥ 90% of Ask responses include at least two regulation `sources` when corpus has matches. |
| KR2 | Reduce share of answers missing per-sentence `[Sn]` citations (post-repair) by 30% vs baseline. |
| KR3 | User research: ≥ 8/10 legal reviewers rate “citations helpful” for sampled queries. |

### Objective O2: The regulation corpus stays current and discoverable.

| Key result | Target (example) |
|------------|------------------|
| KR1 | 80% of managed deployments show `lastRefreshed` &lt; 14 days old. |
| KR2 | BM25 top-10 relevance rated acceptable on a fixed golden set of 50 queries. |
| KR3 | Zero P1 bugs open &gt; 7 days on Browse rendering (paragraph splits, links). |

### Objective O3: News and credible sources add value without noise.

| Key result | Target (example) |
|------------|------------------|
| KR1 | News CTR to original articles ≥ X% (set from baseline). |
| KR2 | &lt; 1% of news items with broken URLs in a weekly crawl audit. |
| KR3 | Credible sources tab: all links in `/api/meta` return HTTP 200 or documented redirects. |
| KR4 | Duplicate news cards: **&lt; 1%** of rendered items are removable duplicates under manual audit of a fixed weekly sample (after dedupe). |

### Objective O4: Regulation text stays structurally sound after every refresh.

| Key result | Target (example) |
|------------|------------------|
| KR1 | ≥ 99% of production **`POST /api/refresh`** runs return **`formattingGuardrails.ok === true`**. |
| KR2 | Zero skipped **`normalizeCorpus`** steps in code review for new ETL paths (audit checklist). |
| KR3 | Manual spot-check of **Art. 4**, **Art. 6**, and **Art. 13** reader layout passes after each major scraper change. |

---

## 4. Instrumentation guidance

- **Server:** Structured logs with route, status, duration, and **hashed** query or topic bucket (avoid storing raw GDPR questions in third-party tools unless compliant).
- **Client:** Optional analytics events: `ask_submit`, `view_article`, `export_pdf`, `news_click` with non-PII properties.
- **Review:** Quarterly audit of prompts and fallback messages against sample queries (red team for hallucination patterns).

---

## 5. References

- [README.md §2 Product benefits](../README.md#2-product-benefits)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [VARIABLES.md](VARIABLES.md)
