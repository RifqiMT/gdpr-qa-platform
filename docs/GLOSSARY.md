# Glossary  
## EU Regulation Q&A Platform

**Version:** 1.4 · **Last updated:** 2026-05-19 · Documentation standard **v2.2** · Product **1.2.4**

Short definitions of **acronyms and product-specific terms** used across documentation and the UI.

| Term | Definition |
|------|------------|
| **AI Act** | Artificial Intelligence Act — Regulation (EU) 2024/1689; regulation id **`ai-act`** in APIs. |
| **AI Act Law** | Readable site **ai-act-law.eu** — default primary source for AI Act corpus layout. |
| **Data Act** | Data Act — Regulation (EU) 2023/2854; regulation id **`data-act`** in APIs. |
| **Data Act Law** | Readable site **data-act-law.eu** — default primary source for Data Act corpus layout. |
| **AI Office** | EU body referenced in AI Act governance provisions (see official text). |
| **BM25** | Best Matching 25 — ranking function for Ask excerpt retrieval (`server.js`). |
| **Corpus** | Regulation texts + search index from **`gdpr-content.json`**, **`ai-act-content.json`**, or **`data-act-content.json`**, normalized on read/write via **`document-formatting-guardrails.js`**. |
| **Deployer** | AI Act role placing an AI system on the market or putting it into service (see Art. 3). |
| **GPAI** | General-purpose AI model — Chapter V of the EU AI Act. |
| **High-risk AI system** | AI system classified as high-risk under Chapter III of the EU AI Act. |
| **Provider** | AI Act role developing an AI system or having it developed (see Art. 3). |
| **DPO** | Data Protection Officer — persona target; not a software component. |
| **EDPB** | European Data Protection Board — credible source for guidelines and news feeds. |
| **EDPS** | European Data Protection Supervisor — EU institutional data protection; News via **`feed/news_en`**. |
| **ETL** | Extract, transform, load — in this product, fetching regulation HTML/TXT, parsing, merging, normalizing, and writing **`gdpr-content.json`**. |
| **EUR-Lex** | Official EU law database; canonical legal publication of Regulation (EU) 2016/679. |
| **GDPR** | General Data Protection Regulation — Regulation (EU) 2016/679. |
| **GDPR-Info** | Unofficial but widely used website **gdpr-info.eu**; default primary source for paragraph structure in the app’s corpus. |
| **BYOK** | Bring Your Own Key — users store **Groq** / **Tavily** credentials in **browser `localStorage`** and send them per request via **`apiKeys`**; overrides server `.env` when non-empty. |
| **Groq** | Third-party inference API (OpenAI-compatible) used as the **primary** Ask synthesizer when **`GROQ_API_KEY`** (server) or BYOK **`groqApiKey`** is set. |
| **ICO** | Information Commissioner’s Office (UK) — credible source in News and Sources. |
| **ISIC** | International Standard Industrial Classification of All Economic Activities — referenced for sector labels in **`industry-sectors.json`**. |
| **OKR** | Objectives and Key Results — planning framework; example cycles in [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md). |
| **PRD** | Product Requirements Document — [PRD.md](PRD.md). |
| **Tavily** | Third-party search-and-answer API used as **fallback** when Groq does not return usable Ask output. |
| **TG / BG / DG** | Prefixes for guardrail ids in [GUARDRAILS.md](GUARDRAILS.md): **technical**, **business**, **data/privacy/documentation**. |
| **News deduplication (consolidated)** | Two-pass merge in **`news-crawler.js`** / **`server.js`**: (1) normalized URL key, (2) semantic key (source + date + title fingerprint) with **`mergeNewsDuplicate`**; mirrored in the browser by **`public/news-dedupe.js`** as **`GDPR_NEWS_DEDUPE`**. |
| **news-topics.js** | Server module: topic **taxonomy** (includes **EU Artificial Intelligence Act** category), classification, and client filter support. |
| **regulation** | API/UI parameter **`gdpr`** \| **`ai-act`** \| **`data-act`** selecting active corpus. |
| **regulation-profiles.js** | Client module: per-regulation copy (`askUi`, `sourcesUi`, `newsUi`, **`citationsUi`**), URLs, heading patterns. |
| **citationsUi** | Per-regulation object defining citation sidebar panel titles, HTML leads, and toggle labels (GDPR-Info vs AI Act Law vs Data Act Law). |
| **syncCitationSidebarChrome** | Client function applying **`citationsUi`** to Browse detail aside when regulation changes. |
| **syncRegulationChrome** | Client function updating Browse/Ask/Sources/News labels, filters, and citation sidebar after regulation switch. |
| **CANONICAL_ARTICLE_TITLES** | GDPR-only map in `public/app.js` (Articles 1–99 official short titles); used by **`getArticleDisplayTitle`** when regulation is **`gdpr`**. |
| **getArticleDisplayTitle** | Client helper resolving the article H2 in Browse, filters, and Ask aside; must not apply GDPR canonical titles to AI Act or Data Act. |
| **getRecitalDisplayTitle** | Client helper resolving recital topic lines in cards and reader from corpus **`title`** fields. |
| **App chrome** | `#appChrome` wrapper: header + tab bar; sticky on viewports ≤899px. |
| **Tools panel** | `#headerActionsPanel` — collapsible header area with Source freshness, API keys, and Refresh sources (mobile/tablet). |
| **syncHeaderToolbarStatus** | Client function syncing one-line freshness and BYOK hints in the Tools panel without duplicate status cards. |
| **newsUi** | Per-regulation News hero copy and theme in `regulation-profiles.js` (intro, scope, tags, refresh labels). |
| **browseUi** | Per-regulation Browse welcome copy: description, highlights, theme, mark badge (`regulation-profiles.js`). |
| **browseWelcomeGrid** | Desktop three-column overview of GDPR, EU Data Act, and EU AI Act on the Browse placeholder. |
| **resetChaptersFilters** | Clears chapter/category/article/sub-category filters and syncs combobox inputs; runs on regulation change. |
| **loadChaptersRequestId** | Generation counter preventing stale chapter list API results from overwriting the active regulation. |

---

## See also

- [README.md](../README.md) — product overview  
- [VARIABLES.md](VARIABLES.md) — configuration and field definitions  
