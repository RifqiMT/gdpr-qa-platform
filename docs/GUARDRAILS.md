# Guardrails  
## EU Regulation Q&A Platform

**Version:** 1.7 · **Last updated:** 2026-07-06 · Documentation standard **v2.3** · Product **1.2.4**

Guardrails define **technical and business limitations** so the team ships safely: what the product must not claim, what the architecture assumes, and where human review is required.

---

## 1. Business and legal guardrails

| Id | Guardrail | Rationale |
|----|-----------|-----------|
| BG-01 | **Not legal advice.** All UI copy, answers, and summaries are **reference material** only. | Avoid unregulated practice of law; users must consult qualified counsel. |
| BG-02 | **Verify on official sources.** EUR-Lex and publisher sites remain authoritative; the app may lag or mis-render. | Consolidated texts and scraping can introduce formatting issues. |
| BG-03 | **News is third-party.** Summaries and snippets are indicative; compliance decisions require reading the original article and applicable law. | Crawlers can miss context; sites change layout. |
| BG-04 | **LLM outputs are probabilistic.** Even with grounding prompts, models can mis-cite or omit qualifiers. | Mitigated by citations, repair passes, and extractive fallback—not eliminated. |
| BG-05 | **Sector framing is illustrative.** Industry selection steers language toward typical processing; it does not replace sector-specific law (employment health data, utilities regulation, etc.). | GDPR is horizontal; other laws may apply. |
| BG-06 | **No warranty on completeness.** The corpus covers Regulation (EU) 2016/679 as loaded; guidelines, national implementations, and case law are out of scope unless linked as external sources. | Product is a workspace, not a registry of all law. |
| BG-07 | **National supervisory authorities (country-specific)** are **not** ingested for News or Credible sources, except **ICO (UK)** — EU-level bodies (EDPB, EDPS, Commission, CoE) remain included. | Keeps scope aligned with pan-EU reference use; avoids duplicating every MS DPA. |
| BG-08 | **BYOK keys are user-controlled secrets.** The product stores them in **browser localStorage** and transmits them to the **same-origin server** for LLM calls only. Users are responsible for key custody, rotation, and provider billing. | Not a vault; not suitable for shared kiosks without policy. |
| BG-09 | **Three regulations, one News corpus.** News remains GDPR/data-protection oriented; AI Act and Data Act views use **client-side relevance filters**, not dedicated regulation-only crawlers. | Do not imply complete Data Act or AI Act press coverage. |
| BG-10 | **Maintainer attribution** in the app credits bar is **product metadata**, not a legal disclaimer or endorsement by LinkedIn or any regulator. | Separate from “reference only” copy in README §12. |
| BG-11 | **Article numbers are not globally unique titles.** Articles 1–99 exist in GDPR, AI Act, and Data Act with **different** official titles. UI must never map GDPR canonical titles onto other regulations by number alone. | Enforced in `getArticleDisplayTitle()` (GDPR-only canonical map). |
| BG-12 | **Long official titles must display in full** for AI Act and Data Act. Do not truncate corpus titles to “Article N” in the reader. | Enforced in `getArticleDisplayTitle()` (no 120-character fallback outside GDPR). |
| BG-13 | **One surface per status type.** Freshness timestamps belong in the **Source freshness** tooltip (header Tools). API key configuration belongs in the **API keys** dialog + **Ask tab** status line. Do not add parallel always-visible status cards that repeat the same data. | Avoids redundant mobile chrome and conflicting copy. |

---

## 2. Technical guardrails — Ask and LLM

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-A01 | **Primary path:** `POST /api/answer` uses corpus excerpts + optional web snippets + Groq; **Tavily** if Groq fails; **extractive** if both fail. | Do not imply “only LLM” to stakeholders. |
| TG-A02 | **Web search** uses DuckDuckGo HTML parsing — fragile if markup changes. | Monitor failures; expect empty `webSources`. |
| TG-A03 | **Citation stability:** Response `sources` ids `S1…Sn` must stay aligned with `[Sn]` in text (server filters returned sources to cited ids when LLM used). | Breaking this breaks Ask chips. |
| TG-A04 | **Secrets:** Never commit `.env`; API keys in process env only. | Rotate keys if leaked. |
| TG-A05 | **Rate limits:** Groq/Tavily/OpenAI quotas can cause silent fallback. | Watch logs (`Groq answer error`, etc.). |
| TG-A06 | **`/api/summarize`** is separate from the Ask tab UI (which does not call it in current `app.js`). | Do not remove endpoint without checking API consumers. |
| TG-A07 | **BYOK precedence:** Non-empty **`apiKeys`** in the request body override **`.env`** keys for that request only; keys are **never** written to disk by the server. | Do not log request bodies containing secrets. |
| TG-A08 | **`POST /api/validate-api-keys`** performs live provider calls; rate limits apply. Use for user-initiated checks, not high-frequency automation. | Abuse can exhaust Groq/Tavily quotas. |

---

## 3. Technical guardrails — Content ETL

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-E01 | **`gdpr-structure.json` required** for scraper runs. | Without structure, refresh may fail or produce incomplete navigation. |
| TG-E02 | **Merge rule:** New scrape overwrites by article/recital **number**; dedupe search index by **id**. | Documented in README; changing merge semantics needs migration notes. |
| TG-E03 | **Formatting contract** between JSON and reader is strict. | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) is the **binding bible** for every source and refresh path. |
| TG-E04 | **Cron** runs in server timezone `Europe/Brussels`. | Varies if host TZ differs; document for ops. |
| TG-E05 | **Every regulation refresh** runs **`normalizeCorpus`** (guardrails) before index + disk write; **`runRegulationScraperAndReloadContent`** clears the corpus cache and reloads; the **Refresh sources** button reloads meta, chapters, recitals, and sources in the client. | Do not add a write path that skips `document-formatting-guardrails.js` or serves stale JSON after ETL. |

---

## 4. Technical guardrails — News

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-N01 | Crawlers depend on **external HTML/RSS**; selectors may break. | Fallback: static `gdpr-news.json` items. |
| TG-N02 | **Timeouts** (`NEWS_CRAWL_TIMEOUT_MS`, `NEWS_REFRESH_TIMEOUT_MS`) truncate slow crawls. | Partial results OK by design. |
| TG-N03 | **Storage cap** on refresh write (`storeCap` ≥ `NEWS_MERGE_CAP`) limits file growth. | Adjust env if ops need longer history. |
| TG-N04 | **Deduplication contract** — Server and client both apply **`dedupeNewsItemsConsolidated`** / **`dedupeNewsItemsClient`** (from **`news-dedupe.js`**). Changing merge rules in **`news-crawler.js`** without updating **`public/news-dedupe.js`** can reintroduce visual duplicates for users on mixed deployments. | Treat the two files as a **paired change** in review. |
| TG-N05 | **`GET /api/news`** intentionally sets **no-store** cache headers. | Do not “optimize” with long `max-age` without product sign-off—stale news lists erode trust. |
| TG-N06 | **Commission Press Corner** ingestion uses **many RSS and API calls** (general + per-policy feeds + search buckets). Raising concurrency or page counts increases **429/timeout** risk and refresh duration. | Treat **`NEWS_COMMISSION_RSS_CONCURRENCY`** and **`NEWS_REFRESH_TIMEOUT_MS`** as paired operational knobs. |
| TG-N07 | **Third-party RSS/HTML** (EDPB, EDPS, ICO, Commission, CoE) depend on **feed stability** and **robots/network** policy of publisher sites. | Monitor crawl logs; expect **empty sections** when feeds move or block automated clients. |
| TG-N08 | **`HOST`** defaults to **`0.0.0.0`** — the process may be reachable from all interfaces unless firewalled. | For laptops or shared networks, bind **`127.0.0.1`** or place behind a reverse proxy. |

---

## 5. Technical guardrails — Frontend

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-F01 | **Vanilla JS** — no framework-enforced CSP or bundler; still avoid inline untrusted HTML in Ask except escaped model output. | `escapeHtml` + controlled chips. |
| TG-F02 | **Accessibility** — Maintaining ARIA tab pattern is mandatory for WCAG-oriented orgs. | Regressions affect procurement. |
| TG-F03 | **PDF export** depends on **html2pdf.js** CDN — offline/air-gapped installs need vendoring. | Document for enterprise deployment. |
| TG-F04 | **News sidebar chrome** uses **`sessionStorage`** for collapse prefs — not shared across browsers or devices; clearing site data resets layout. | Expected; document for support. |
| TG-F05 | **BYOK UI** stores secrets in **`localStorage`** (`gdpr-qa-byok-v1`). Clearing site data removes keys; XSS on the origin could exfiltrate keys — deploy with trusted static assets and HTTPS in production. | Enterprise SSO does not replace BYOK storage model. |
| TG-F06 | **Display title helpers** — Any change to `getArticleDisplayTitle`, `getRecitalDisplayTitle`, or `CANONICAL_ARTICLE_TITLES` must be tested on **all three** regulations (spot-check Art. 10 on each; Data Act Art. 4 for long titles). | Regression caused wrong Data Act titles when GDPR map applied globally. |
| TG-F07 | **Citation sidebar chrome** — Panel titles, leads, and publisher links must update via **`citationsUi`** + **`syncCitationSidebarChrome`**. Do not hardcode “GDPR” or GDPR-Info in `index.html` without IDs wired to sync. | Users saw GDPR labels while viewing EU Data Act. |
| TG-F08 | **App chrome height** — Header/toolbar markup changes must keep **`ResizeObserver`** updating **`--app-chrome-height`** so the reader is not clipped under sticky chrome on phones. | Test Browse detail on 375px width after chrome edits. |
| TG-F09 | **No duplicate status UI** — Use **`syncHeaderToolbarStatus`** for toolbar hints only; do not add a second always-visible freshness/keys card row (see **BG-13**). | Ask tab **`#askLlmKeysStatus`** remains the long-form Ask key narrative. |
| TG-F10 | **Hidden chapter filters** — When `hasArticleTopics` is false, **`getChaptersFilterSubcategoryValue`** must return empty and **`resetChaptersFilters`** must run on regulation change. Never apply GDPR **Category** / **Sub-category** values to AI Act or Data Act lists. | Prevents false “no articles match” empty states. |
| TG-F11 | **Chapters load races** — `loadChapters` must compare **`loadChaptersRequestId`** and **`currentRegulation.id`** before applying results. | Prevents wrong-regulation article lists after fast switching. |

---

## 5b. Technical guardrails — Module boundaries

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-C01 | **Import documented exports only.** Node modules expose a trimmed public API; do not `require()` internal symbols (e.g. `REGULATIONS`, `SEED_FILES`, granular guardrail helpers). | See [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) §1.1 and §2. |
| TG-C02 | **Paired news dedupe** — Server `dedupeNewsItemsConsolidated` and client `public/news-dedupe.js` must stay aligned when merge rules change. | Same as **TG-N04**. |
| TG-C03 | **Vercel seed completeness** — All regulation corpora in `SEED_FILES` must be present in bundled `data/` before deploy; missing files cause empty Browse on cold start. | See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) seed manifest. |

---

## 6. Data and privacy guardrails

| Id | Guardrail | Detail |
|----|-----------|--------|
| DG-01 | **Questions** may contain personal or sensitive information; logging full text to shared systems may be **unlawful** without basis. | Prefer aggregate metrics or hashed buckets. |
| DG-02 | **No built-in authentication** — deploy behind VPN/SSO if needed. | Default app is open on bind address. |
| DG-03 | **Single-tenant files** — `data/*.json` hold regulation text only; no user profiles. | Backups still sensitive for deployment metadata. |
| DG-04 | **BYOK keys in browser** may be considered personal data if tied to an identifiable user device. Do not sync **`localStorage`** to analytics. | Treat like any client-side secret. |

---

## 6b. EU AI Act–specific guardrails

| Id | Guardrail | Detail |
|----|-----------|--------|
| BG-AI-01 | **No suitable-recital map** | AI Act does not ship `article-suitable-recitals` crossrefs; UI must not imply GDPR-Info-style suitable recitals. |
| BG-AI-02 | **News is filtered, not separate** | AI Act mode filters shared GDPR/data-protection news; do not claim full AI Act press coverage. |
| BG-AI-03 | **Separate corpora** | `ai-act-content.json` and `gdpr-content.json` must never merge; regulation id selects one file. |
| TG-AI-01 | **AI Act ETL** | `ai-act-scraper.js` is independent of GDPR guardrails file; monitor formatting separately. |
| TG-AI-02 | **Regulation in Ask** | Tavily/DuckDuckGo queries must include AI Act context when `regulation=ai-act`. |

---

## 6c. EU Data Act–specific guardrails

| Id | Guardrail | Detail |
|----|-----------|--------|
| BG-DA-01 | **No suitable-recital map** | Data Act does not ship `article-suitable-recitals`; do not show GDPR-style suitable recitals panels. |
| BG-DA-02 | **News is filtered, not separate** | Data Act mode filters shared news for data-access/interoperability keywords; not a dedicated Data Act press wire. |
| BG-DA-03 | **Separate corpus** | `data-act-content.json` must not merge with GDPR or AI Act; titles come only from Data Act ETL. |
| TG-DA-01 | **Data Act ETL** | `data-act-scraper.js` + shared `scraper.js` HTML extraction; same formatting guardrails as other corpora. |
| TG-DA-02 | **Title display** | Never apply `CANONICAL_ARTICLE_TITLES` when `regulation=data-act`. |

---

## 7. Out-of-scope reminders (do not commit roadmap as promise)

- User accounts, roles, audit trails per user.  
- Official EDPB/ICO API partnerships beyond public pages.  
- Guaranteed SLAs without hosting agreement.  
- Automated legal compliance scoring.  
- Dedicated AI Act-only news crawler (filter-only today).

---

## 8. Documentation and knowledge management

| Id | Guardrail | Detail |
|----|-----------|--------|
| DG-DOC-01 | **Docs follow the product documentation standard** | [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) lists authoritative files; avoid duplicating legal or config guidance in conflicting places. |
| DG-DOC-02 | **Variable and API changes stay synchronized** | New env vars or response fields require updates to [VARIABLES.md](VARIABLES.md), [API_CONTRACTS.md](API_CONTRACTS.md), [README.md §10](../README.md#10-configuration), and [.env.example](../.env.example) when user-visible. |

---

## References

- [README.md §5 Business guidelines](../README.md#5-business-guidelines)  
- [README.md §12 License and disclaimer](../README.md#12-license-and-disclaimer)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md)  
- [docs/README.md](README.md) — documentation hub and reading order
