# Guardrails  
## GDPR Q&A Platform

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

---

## 5. Technical guardrails — Frontend

| Id | Guardrail | Detail |
|----|-----------|--------|
| TG-F01 | **Vanilla JS** — no framework-enforced CSP or bundler; still avoid inline untrusted HTML in Ask except escaped model output. | `escapeHtml` + controlled chips. |
| TG-F02 | **Accessibility** — Maintaining ARIA tab pattern is mandatory for WCAG-oriented orgs. | Regressions affect procurement. |
| TG-F03 | **PDF export** depends on **html2pdf.js** CDN — offline/air-gapped installs need vendoring. | Document for enterprise deployment. |
| TG-F04 | **News sidebar chrome** uses **`sessionStorage`** for collapse prefs — not shared across browsers or devices; clearing site data resets layout. | Expected; document for support. |

---

## 6. Data and privacy guardrails

| Id | Guardrail | Detail |
|----|-----------|--------|
| DG-01 | **Questions** may contain personal or sensitive information; logging full text to shared systems may be **unlawful** without basis. | Prefer aggregate metrics or hashed buckets. |
| DG-02 | **No built-in authentication** — deploy behind VPN/SSO if needed. | Default app is open on bind address. |
| DG-03 | **Single-tenant files** — `data/*.json` hold regulation text only; no user profiles. | Backups still sensitive for deployment metadata. |

---

## 7. Out-of-scope reminders (do not commit roadmap as promise)

- User accounts, roles, audit trails per user.  
- Official EDPB/ICO API partnerships beyond public pages.  
- Guaranteed SLAs without hosting agreement.  
- Automated legal compliance scoring.

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
