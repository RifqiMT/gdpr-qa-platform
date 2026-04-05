# User Personas  
## GDPR Q&A Platform

Personas represent primary users of the platform. They inform features, user stories, and documentation.

---

## Persona 1: Legal / Compliance Professional (Primary)

| Attribute | Description |
|-----------|-------------|
| **Name** | Alex (Legal / Compliance) |
| **Role** | In-house counsel or compliance officer; needs to check GDPR provisions and cite them accurately. |
| **Goals** | Find the right Article or Recital quickly, get verbatim text for memos or policies, cite official sources (EUR-Lex, GDPR-Info), avoid unsourced or wrong interpretations. |
| **Pain points** | Scrolling through long PDFs; unclear which version of the regulation is current; no single place to search and browse with citations. |
| **Needs** | Browse by structure (Recitals, Chapters & Articles), filter by topic/chapter, ask natural-language questions with **traceable sources**, optional **sector framing** for industry-specific wording, export a provision as PDF, see “content as of” date. |
| **Tech context** | Uses browser daily; comfortable with a local or internal server; may need to work offline after content is refreshed. |
| **Relevant features** | Browse (sidebar, filters, doc nav, related articles/recitals), Ask (search, citations, Relevant provisions, View in app), Refresh sources, Export PDF, Credible sources, Homepage (logo). |

---

## Persona 2: Data Protection Officer (DPO)

| Attribute | Description |
|-----------|-------------|
| **Name** | Sam (DPO) |
| **Role** | Data Protection Officer; answers internal and external questions about GDPR and tracks supervisory guidance. |
| **Goals** | Answer “what does the regulation say?” with exact text and citations; stay updated on EDPB/ICO/Commission news; point colleagues to official sources. |
| **Pain points** | Repeating the same lookups; ensuring answers are from the regulation, not third-party summaries; keeping up with news from multiple sites. |
| **Needs** | Ask a question and get a **citation-grounded** answer (`[S1]`…), sector context when relevant, View in app to show full article/recital; News tab with filters by **source** and **topic** (taxonomy from **`news-topics.js`**) across EDPB, EDPS, ICO, CNIL (English), Commission, and CoE; Credible sources tab for quick links. |
| **Tech context** | Uses internal or local deployment; may configure LLM key for summaries; needs traceability for audit. |
| **Relevant features** | Ask (Answer + `[Sn]` citations, industry sector, Relevant GDPR provisions), News (multi-authority crawl, topic tags, by-source grouping, three-paragraph summaries), Credible sources, Refresh sources. |

---

## Persona 3: Privacy / Legal Consultant

| Attribute | Description |
|-----------|-------------|
| **Name** | Jordan (Consultant) |
| **Role** | External consultant advising clients on GDPR compliance and documentation. |
| **Goals** | Prepare client-facing answers with exact regulation references; export a provision for appendices; avoid hallucination in any summary. |
| **Pain points** | Generic tools give unsourced or wrong answers; copying from EUR-Lex is manual; need to show “as of” date. |
| **Needs** | Ask with **citation-grounded** results and traceable sources; View in app and Export PDF; Credible sources for client handouts; clear attribution (EUR-Lex, GDPR-Info). |
| **Tech context** | Uses browser; may run app locally or on client server; cares about reproducibility of answers. |
| **Relevant features** | Ask (grounded answer + citations), View in app, Export PDF, content as of date, Credible sources, Refresh sources. |

---

## Persona 4: Industry specialist (e.g. utilities, health, HR)

| Attribute | Description |
|-----------|-------------|
| **Name** | Riley (Industry specialist) |
| **Role** | Privacy or compliance lead in a specific sector who needs GDPR explained in context of typical processing in that line of business. |
| **Goals** | Obtain answers that **name the sector** and tie obligations to realistic processing scenarios without inventing non-GDPR duties. |
| **Pain points** | Generic tools answer “organizations must…” without sector language; risk of over-interpreting guidance as statutory text. |
| **Needs** | Industry/sector combobox on Ask; answers that stay within cited sources; links to full Articles/Recitals. |
| **Tech context** | Same as other professional users; may run app on internal network with API keys managed by IT. |
| **Relevant features** | Ask (sector selection, status chip for LLM path), Browse, Credible sources. |

---

## Persona 5: General Professional (Developer / Product / Policy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Casey (General Professional) |
| **Role** | Developer, product manager, or policy person who occasionally needs to check GDPR wording. |
| **Goals** | Quick answer to “what does GDPR say about X?” without reading the full regulation; know where to verify (official links). |
| **Pain points** | Don’t know where to look; fear of citing wrong or outdated text; don’t want to install heavy tools. |
| **Needs** | Simple Ask flow; short summary + link to full text; Browse if they want to explore; Credible sources to bookmark official pages. |
| **Tech context** | Uses browser; prefers minimal setup (one URL); may use default extractive summary (no LLM key). |
| **Relevant features** | Ask (search, summary fallback, View in app), Browse (sidebar, filters), Credible sources, Homepage (logo to reset). |

---

## Persona 6: Stakeholder / Reviewer (Read-heavy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Morgan (Stakeholder) |
| **Role** | Manager or auditor who reviews compliance materials and needs to verify references. |
| **Goals** | Check that cited Articles/Recitals match what the platform shows; open official links to confirm. |
| **Pain points** | Hard to verify citations without opening multiple sites; need a single place to see text and links. |
| **Needs** | Browse to specific Article/Recital; doc nav (Prev/Next/Go); citations panel with GDPR-Info and EUR-Lex; Credible sources for full list of official links. |
| **Tech context** | Uses same app as team; read-only usage; may export PDF for records. |
| **Relevant features** | Browse (doc nav, citations, Export PDF), Credible sources, Homepage (logo). |

---

## Persona 7: Engineering / DevOps

| Attribute | Description |
|-----------|-------------|
| **Name** | Taylor (Engineering / DevOps) |
| **Role** | Deploys and operates the app internally or for clients; owns configuration, refresh jobs, and observability. |
| **Goals** | Keep the regulation corpus current and **formatting-consistent**; verify ETL and guardrails after upgrades; minimize stale in-memory state after refresh. |
| **Pain points** | Silent hash-unchanged skips when operators expect a rewrite; unclear which primary source (**GDPR-Info** vs **EUR-Lex**) is active; long-running crawls without timeout visibility. |
| **Needs** | Documented **environment variables** ([VARIABLES.md](VARIABLES.md)) including **news** timeouts, **`NEWS_MERGE_CAP`**, and optional **`NEWS_MAX_*` / `NEWS_COMMISSION_*`** crawl tuners; **`POST /api/refresh`** returning **`formattingGuardrails`**; **`GDPR_FORCE_CORPUS_WRITE`** for forced writes; logs for cron and CLI **`npm run refresh`**. |
| **Tech context** | Node ≥ 18, `.env` management, optional reverse proxy; reads **CHANGELOG** and **ARCHITECTURE** for upgrades. |
| **Relevant features** | Refresh pipeline, **document formatting guardrails**, **`.env.example`**, **API contracts** for **/api/meta** and **/api/refresh**. |

---

## Summary matrix

| Persona              | Primary use                    | Key features                                              |
|----------------------|--------------------------------|-----------------------------------------------------------|
| Legal / Compliance   | Look up provisions, cite       | Browse, Ask + citations, filters, doc nav, Export PDF, Refresh |
| DPO                 | Answer questions, stay updated | Ask, Relevant provisions, News (multi-source + topics), Credible sources |
| Consultant           | Client-facing, sourced answers | Ask, grounded answers, Export PDF, Credible sources       |
| Industry specialist  | Sector-context Q&A             | Ask + sector, Browse, official links                      |
| General Professional| Quick check                    | Ask, extractive/LLM paths, Browse, Credible sources, Homepage |
| Stakeholder         | Verify references              | Browse, doc nav, citations, Export PDF, Credible sources  |
| Engineering / DevOps | Operate ETL and config         | Refresh + guardrails, env vars, API meta, logs, changelog |

For user stories derived from these personas, see [USER_STORIES.md](USER_STORIES.md). For full product documentation, see [README.md](../README.md).
