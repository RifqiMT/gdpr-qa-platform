# Product metrics and OKRs  
## EU Regulation Q&A Platform

**Version:** 1.7 · **Last updated:** 2026-07-22 · Documentation standard **v2.4** · Product **1.2.5** (browse welcome hub, chapters filter reliability, regulation themes, engineering maintainability **O10**).

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
| **News date sanitization** | Share of items with normalized `publishedAt` / `date` after **`sanitizeNewsItemDates`** in the crawl pipeline. | Invalid or missing dates should not break sort order; monitor drops in enrichment passes. |
| **News items post-gate (count)** | Number of items returned after **`crawlNews`** + **`newsItemMatchesApprovedTopic`** (or length of **`GET /api/news`** `items` after merge cap). | Tracks ingestion health; sudden drops may indicate upstream HTML/RSS changes, **403** blocks, or timeouts. Segment by **`sourceName`** when debugging. |
| **News refresh duration** | Wall-clock time for **`POST /api/news/refresh`** until response (compare to **`NEWS_REFRESH_TIMEOUT_MS`**). | Approaching timeout suggests raising cap or reducing crawl depth via **`NEWS_MAX_*`**. |
| **News API cache bypass** | Share of `GET /api/news` responses whose **`Cache-Control`** includes **`no-store`** (monitoring or spot-check). | Confirms users see post-refresh merges without aggressive HTTP caching. |
| **Sector usage** | Share of Ask requests with `industrySectorId !== 'GENERAL'`. | Informs sector list quality and prompt tuning. |
| **Time to first answer** | p50/p95 latency of `POST /api/answer` end-to-end. | Dominated by LLM and web fetches; track regressions after deploys. |
| **BYOK adoption** | Share of Ask requests where **`llm.byokGroq`** or **`llm.byokTavily`** is **`true`**. | Indicates reliance on user-supplied keys vs server `.env`. |
| **Key validation success rate** | Share of **`POST /api/validate-api-keys`** checks per provider where **`valid === true`** (among **`provided`**). | Product quality of onboarding; do not log key values. |
| **BYOK enablement** | Share of sessions that save **`useOwnKeys: true`** in **`gdpr-qa-byok-v1`** (client-side telemetry only if policy allows). | Privacy-sensitive — aggregate counts only. |
| **Regulation mix (Ask)** | Share of **`POST /api/answer`** by **`regulationId`**: `gdpr`, `ai-act`, `data-act`. | Adoption of multi-regulation product. |
| **Corpus freshness (per regulation)** | Age of **`meta.lastRefreshed`** in each `*-content.json` vs policy threshold. | Stale Data Act or AI Act corpus undermines trust. |
| **Regulation switch rate** | Share of sessions that change `#regulationSelect` at least once. | Indicates multi-regulation workflows. |
| **Title mismatch reports** | Support or QA tickets citing wrong article heading for regulation (should trend to **zero** after FR-BRW-09). | Spot-check Art. 10 on GDPR vs Data Act vs AI Act; Data Act Art. 4/33 for long titles. |
| **Citation sidebar regulation accuracy** | QA checklist: zero instances of “GDPR” / GDPR-Info in sidebar when AI Act or Data Act is selected. | Manual pass on three regulations per release; ties to **FR-BRW-12** / **TG-F07**. |
| **Reader formatting regressions** | Manual or automated checks that sample articles contain `1.` / `(a)` markers post-ETL (AI Act Art. 6, Data Act Art. 4). | Tied to `formattingGuardrails.ok` and visual QA. |
| **Mobile Tools open rate** | Share of sessions at viewport ≤899px where `#headerActionsPanel` receives `is-open` at least once. | Proxy for discoverability of freshness, keys, and refresh on phones/tablets. |
| **Toolbar hint accuracy** | Manual QA: `#headerFreshnessHint` and `#headerApiKeysHint` match tooltip and Ask key line after meta/BYOK changes. | Regressions indicate `syncHeaderToolbarStatus` drift. |
| **Reading pane under chrome** | Visual QA: first line of article body visible without scroll on 375px after opening an article. | Uses `--app-chrome-height`; failure = layout regression. |
| **News hero expand rate** | Share of mobile News sessions where `#newsHeroDetails` is expanded at least once. | High expand + low scroll-to-cards may mean hero still too tall—tune copy or default. |
| **Browse welcome card engagement** | Share of desktop sessions where user clicks a grid card or quick action on `#browseWelcomeGrid`. | Segment by regulation id. |
| **False empty chapters rate** | Share of `applyChaptersFilters` runs with filters visually “All” but zero articles (should trend **zero** after **TG-F10**). | Log `chaptersFiltersAreActive()` vs empty HTML reason. |
| **Chapters filter clear rate** | Share of empty filtered states where user clicks **Clear all filters** within 30s. | High rate may mean confusing hidden filters. |
| **Module export surface drift** | Count of undocumented `module.exports` symbols vs [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) public API table after each release. | Target **zero** drift; ties to **FR-ENG-01** and **TG-C01**. |
| **Dead client symbol count** | Static review: unused functions in `public/app.js` not referenced in HTML or event bindings. | Should remain **zero** after hygiene passes. |
| **Vercel seed manifest parity** | `SEED_FILES.length` matches documented manifest in [VARIABLES.md §1.1](VARIABLES.md#11-vercel-seed-manifest-libpathsjs--seed_files). | Currently **11** files; mismatch blocks cold-start on serverless. |

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
| KR3 | Manual spot-check of **GDPR Art. 4**, **AI Act Art. 6**, **Data Act Art. 4**, and **Art. 10 titles** on all three regulations passes after each major scraper or reader change. |

### Objective O5: Operators can use their own LLM credentials safely (BYOK).

| Key result | Target (example) |
|------------|------------------|
| KR1 | ≥ 95% of **`POST /api/validate-api-keys`** checks for known-good test keys return **`valid: true`** (synthetic monitoring). |
| KR2 | Documentation and UI copy clearly state keys are **browser-local** and not written to server `.env`. |
| KR3 | Zero incidents of API keys logged in server stdout (audit per release). |

### Objective O6: EU AI Act is a first-class regulation in the product.

| Key result | Target (example) |
|------------|------------------|
| KR1 | After refresh, AI Act corpus has **≥113** articles and **≥180** recitals in `ai-act-content.json`. |
| KR2 | ≥ 90% of golden-path AI Act Ask queries return at least one AI Act article citation in `sources`. |
| KR3 | Regulation switch causes **zero** GDPR corpus responses when `regulation=ai-act` (automated API tests). |
| KR4 | **AI Act adoption:** ≥ 15% of Ask sessions use `ai-act` (if telemetry enabled). |

### Objective O7: EU Data Act is a first-class regulation in the product.

| Key result | Target (example) |
|------------|------------------|
| KR1 | After refresh, Data Act corpus has **≥50** articles and **≥119** recitals in `data-act-content.json`. |
| KR2 | ≥ 90% of golden-path Data Act Ask queries return at least one Data Act article citation in `sources`. |
| KR3 | Regulation switch causes **zero** GDPR corpus responses when `regulation=data-act` (automated API tests). |
| KR4 | **Data Act adoption:** measurable share of Ask sessions use `data-act` (if telemetry enabled). |

### Objective O8: Mobile and tablet users can work without layout friction.

| Key result | Target (example) |
|------------|------------------|
| KR1 | Zero P1 bugs open > 7 days on **Tools** panel, reading pane under chrome, or News hero overlap. |
| KR2 | QA pass on 375px and 768px: Tools subtitles match tooltip/Ask key state after refresh and BYOK save. |
| KR3 | ≥ 70% of mobile sessions (if instrumented) open Tools at least once — indicates discoverability of freshness and keys. |

### Objective O9: Browse entry and chapters list are trustworthy across regulations.

| Key result | Target (example) |
|------------|------------------|
| KR1 | **False empty chapters rate** = 0 on QA script: GDPR topic filter → switch to Data Act → All filters → articles visible. |
| KR2 | ≥ 80% of desktop Browse-placeholder sessions interact with at least one welcome card (if telemetry enabled). |
| KR3 | Zero P1 bugs on **hidden filter bleed** or **stale loadChapters** after regulation switch for two release cycles. |

### Objective O10: Engineering maintainability keeps the codebase auditable.

| Key result | Target (example) |
|------------|------------------|
| KR1 | **Module export surface drift** = 0 between code and [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) on every release. |
| KR2 | All modified JS files pass `node --check` in CI before merge. |
| KR3 | **Vercel seed manifest parity** maintained (11 files) when adding new corpus JSON. |
| KR4 | No reintroduction of removed legacy UI paths (`#newsList`, `openChapter`, `.chapter-view*`) in PR review checklist. |

---

## 4. Instrumentation guidance

- **Server:** Structured logs with route, status, duration, and **hashed** query or topic bucket (avoid storing raw GDPR questions in third-party tools unless compliant).
- **Client:** Optional analytics events: `ask_submit`, `view_article`, `export_pdf`, `news_click`, `byok_save`, `byok_validate` with non-PII properties (never include key material).
- **Review:** Quarterly audit of prompts and fallback messages against sample queries (red team for hallucination patterns).

---

## 5. References

- [README.md §2 Product benefits](../README.md#2-product-benefits)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [VARIABLES.md](VARIABLES.md)
