# Glossary  
## GDPR Q&A Platform

Short definitions of **acronyms and product-specific terms** used across documentation and the UI.

| Term | Definition |
|------|------------|
| **BM25** | Best Matching 25 — a probabilistic ranking function used to score regulation excerpts against the user’s Ask query (`server.js`). |
| **Corpus** | The full set of regulation texts and index rows loaded from **`gdpr-content.json`** (and normalized via **`document-formatting-guardrails.js`**). |
| **DPO** | Data Protection Officer — persona target; not a software component. |
| **EDPB** | European Data Protection Board — credible source for guidelines and news feeds. |
| **ETL** | Extract, transform, load — in this product, fetching regulation HTML/TXT, parsing, merging, normalizing, and writing **`gdpr-content.json`**. |
| **EUR-Lex** | Official EU law database; canonical legal publication of Regulation (EU) 2016/679. |
| **GDPR** | General Data Protection Regulation — Regulation (EU) 2016/679. |
| **GDPR-Info** | Unofficial but widely used website **gdpr-info.eu**; default primary source for paragraph structure in the app’s corpus. |
| **Groq** | Third-party inference API (OpenAI-compatible) used as the **primary** Ask synthesizer when **`GROQ_API_KEY`** is set. |
| **ICO** | Information Commissioner’s Office (UK) — credible source in News and Sources. |
| **ISIC** | International Standard Industrial Classification of All Economic Activities — referenced for sector labels in **`industry-sectors.json`**. |
| **OKR** | Objectives and Key Results — planning framework; example cycles in [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md). |
| **PRD** | Product Requirements Document — [PRD.md](PRD.md). |
| **Tavily** | Third-party search-and-answer API used as **fallback** when Groq does not return usable Ask output. |
| **TG / BG / DG** | Prefixes for guardrail ids in [GUARDRAILS.md](GUARDRAILS.md): **technical**, **business**, **data/privacy/documentation**. |

---

## See also

- [README.md](../README.md) — product overview  
- [VARIABLES.md](VARIABLES.md) — configuration and field definitions  
