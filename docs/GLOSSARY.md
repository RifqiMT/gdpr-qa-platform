# Glossary  
## EU Regulation Q&A Platform

**Version:** 1.1 · **Last updated:** 2026-05-25

Short definitions of **acronyms and product-specific terms** used across documentation and the UI.

| Term | Definition |
|------|------------|
| **AI Act** | Artificial Intelligence Act — Regulation (EU) 2024/1689; regulation id **`ai-act`** in APIs. |
| **AI Act Law** | Readable site **ai-act-law.eu** — default primary source for AI Act corpus layout. |
| **AI Office** | EU body referenced in AI Act governance provisions (see official text). |
| **BM25** | Best Matching 25 — ranking function for Ask excerpt retrieval (`server.js`). |
| **Corpus** | Regulation texts + search index from **`gdpr-content.json`** or **`ai-act-content.json`**, normalized on read/write (GDPR via **`document-formatting-guardrails.js`**). |
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
| **regulation** | API/UI parameter **`gdpr`** \| **`ai-act`** selecting active corpus. |
| **regulation-profiles.js** | Client module: per-regulation copy (Ask, Sources, News), URLs, heading patterns. |

---

## See also

- [README.md](../README.md) — product overview  
- [VARIABLES.md](VARIABLES.md) — configuration and field definitions  
