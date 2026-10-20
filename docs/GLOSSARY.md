# Glossary  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6** · Audit date **2026-10-20**

Short definitions of **acronyms and product-specific terms** used across documentation and the UI. Indonesian legal terms are given in *italics* with an English gloss. Sections: [A. Instruments and law](#a-instruments-and-law) · [B. Indonesian legal and institutional terms](#b-indonesian-legal-and-institutional-terms) · [C. EU legal terms](#c-eu-legal-terms) · [D. Product, UI, and engineering terms](#d-product-ui-and-engineering-terms).

---

## A. Instruments and law

| Term | Definition |
|------|------------|
| **GDPR** | General Data Protection Regulation — Regulation (EU) 2016/679; regulation id **`gdpr`**. |
| **AI Act** | Artificial Intelligence Act — Regulation (EU) 2024/1689; regulation id **`ai-act`**. |
| **Data Act** | Data Act — Regulation (EU) 2023/2854; regulation id **`data-act`**. |
| **UU PDP** | *Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi* — Indonesia's Personal Data Protection Law (statute, LN 2022 No. 196); regulation id **`id-pdp`**; GDPR analogue. 76 *Pasal* in 16 *BAB*, 4 *menimbang* clauses (a–d). |
| **Satu Data Indonesia (SDI)** | "One Data Indonesia" — government data-governance policy established by **Perpres 39/2019**; regulation id **`id-satu-data`**; Data Act analogue (public-sector data governance, not a data-sharing right). 44 *Pasal* in 8 *BAB*. Portal: **data.go.id**. |
| **Perpres** | *Peraturan Presiden* — Presidential Regulation; binding secondary legislation below a *UU*. **Perpres 39/2019** = Satu Data Indonesia. |
| **SE AI Ethics** | *Surat Edaran Menteri Komunikasi dan Informatika Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial* (SE Menkominfo 9/2023, 19 Dec 2023) — Indonesia's in-force AI ethics circular; regulation id **`id-ai-ethics`**; AI Act analogue in topic, **not** in legal force. Seven sections (*bagian*) and **nine ethical values** (*nilai etika*). |
| **Soft law** | Guidance that is authoritative but **not legally binding in itself**. In this product only **`id-ai-ethics`** (an *Surat Edaran*) is soft law; Ask answers must say obligations stem from the circular/guidance, not a statute (**LEGAL FORCE** prompt rule). See [GUARDRAILS.md](GUARDRAILS.md). |
| **Hard law** | Binding statute or regulation. All other five instruments. For Indonesia, **UU ITE** and **UU PDP** are the hard-law backbone around AI/data. |
| **Jurisdiction** | Registry field **`jurisdiction`**: **`eu`** (European Union) or **`id`** (Indonesia), with display **`jurisdictionLabel`**. Drives the region picker, chip, and grouped regulation select. |
| **Region** | UI-only filter in the header: **All**, **EU**, **Indonesia** (`gdpr-qa-region-v1`). Not an API parameter — the API receives the **regulation id**. |
| **RPerpres** | *Rancangan Peraturan Presiden* — draft Presidential Regulation. Two RPerpres (AI ethics; national AI roadmap 2026–2029) were awaiting signature as of September 2026; tracked via Komdigi notices, **not** part of the corpus. |

---

## B. Indonesian legal and institutional terms

| Term | Definition |
|------|------------|
| **Pasal** | *Article* of an Indonesian law. Stored as `articles[]` entries titled `Pasal N` / English structural titles; anchors `#pasal-N`. |
| **BAB** | *Chapter* (roman numerals I–XVI…). Maps to `chapters[]`. |
| **Bagian** | *Section* — a subdivision within a BAB; in `id-ai-ethics` the seven main sections are exposed as `articles[]` with anchors `#bagian-N`. |
| **Ayat** | Numbered sub-paragraph *(1) (2)* inside a Pasal; rendered by the numbered-paragraph reader. |
| **Menimbang** | *Considering* — preamble recitals (a, b, c, d) of an Indonesian law; stored as `recitals[]` (anchors `#menimbang-N`). Analogue of EU recitals. |
| **Mengingat** | *Bearing in mind* — legal-basis clause listing higher laws; not stored as separate corpus items. |
| **Nilai etika** | *Ethical values* — the nine values (e.g. inclusivity, humanity, security) in SE 9/2023; stored as `recitals[]` for `id-ai-ethics` (anchors `#nilai-N`). |
| **Pelindungan Data Pribadi** | *Personal data protection* (official spelling used in UU 27/2022; "perlindungan" is the common variant — the news gate matches both). |
| **Data Pribadi** | *Personal data*. |
| **Pengendali Data Pribadi** | *Personal data controller* (GDPR "controller" analogue). |
| **Prosesor Data Pribadi** | *Personal data processor*. |
| **Subjek Data Pribadi** | *Data subject*. |
| **Lembaga PDP** | *Lembaga Pelindungan Data Pribadi* — the data-protection authority envisaged by UU PDP (supervisory body). |
| **Walidata** | *Data custodian/validator* — Satu Data role that collects and validates agency data. |
| **Produsen Data / Pembina Data** | *Data producer* / *data supervisor (standards owner)* — Satu Data roles. |
| **Instansi Pusat / Instansi Daerah** | Central government agency / regional government agency — actors in Satu Data. |
| **Standar Data, Metadata, Interoperabilitas Data, Kode Referensi, Data Induk** | Satu Data pillars: data standards, metadata, interoperability, reference codes, master data. |
| **PSE** | *Penyelenggara Sistem Elektronik* — electronic system operator (public or private); scope of SE 9/2023. |
| **KBLI** | *Klasifikasi Baku Lapangan Usaha Indonesia* — Indonesian standard industrial classification; SE 9/2023 targets **KBLI 62015** (programming activities). Analogue of ISIC. |
| **UU ITE** | *Undang-Undang Informasi dan Transaksi Elektronik* — Electronic Information and Transactions Law; hard-law backbone beside UU PDP. |
| **Komdigi** | *Kementerian Komunikasi dan Digital* — Ministry of Communication and Digital Affairs (successor of **Kominfo**, *Kementerian Komunikasi dan Informatika*). Issuer of SE 9/2023; operates **JDIH Komdigi**. |
| **Setkab** | *Sekretariat Kabinet* — Cabinet Secretariat; announces Perpres and publishes a news feed crawled for News. |
| **JDIH** | *Jaringan Dokumentasi dan Informasi Hukum* — official legal documentation network. Sources: **JDIH Komdigi**, **JDIH Kemenko Infra** (PDF salinan), **JDIH Kemenkeu**. |
| **peraturan.go.id** | Official national database of Indonesian regulations (Database Peraturan). |
| **Salinan** | Certified copy of a legal instrument (e.g. PDF *salinan* of Perpres 39/2019). |
| **LN** | *Lembaran Negara* — State Gazette (e.g. LN 2022 No. 196). |
| **Antara** | Indonesia's state news agency; News source via tag hubs (`uu-pdp`, `data-pribadi`, …) and RSS (Hukum, Tekno, English). |

---

## C. EU legal terms

| Term | Definition |
|------|------------|
| **AI Act Law** | Readable site **ai-act-law.eu** — default primary source for AI Act corpus layout. |
| **Data Act Law** | Readable site **data-act-law.eu** — default primary source for Data Act corpus layout. |
| **AI Office** | EU body referenced in AI Act governance provisions (see official text). |
| **Deployer** | AI Act role placing an AI system into service under its authority (see Art. 3). |
| **Provider** | AI Act role developing an AI system or having it developed (see Art. 3). |
| **GPAI** | General-purpose AI model — Chapter V of the EU AI Act. |
| **High-risk AI system** | AI system classified as high-risk under Chapter III of the EU AI Act. |
| **DPO** | Data Protection Officer — persona target; not a software component. |
| **EDPB** | European Data Protection Board — credible source for guidelines and news feeds. |
| **EDPS** | European Data Protection Supervisor — EU institutional data protection; News via **`feed/news_en`**. |
| **EUR-Lex** | Official EU law database; canonical legal publication of the three EU regulations. |
| **GDPR-Info** | Unofficial but widely used website **gdpr-info.eu**; default primary source for paragraph structure in the GDPR corpus. |
| **ICO** | Information Commissioner's Office (UK) — credible source in News and Sources. |
| **Recital** | Non-operative preamble paragraph of an EU act; for Indonesia the closest analogue is *menimbang*. |
| **CELEX** | EU document identifier (e.g. `32016R0679`); `null` for Indonesian instruments. |

---

## D. Product, UI, and engineering terms

| Term | Definition |
|------|------------|
| **Regulation Q&A Platform** | Current product brand (repository still named `gdpr-qa-platform`; storage keys keep the `gdpr-qa-` prefix for continuity). |
| **Instrument** | Any one of the six supported legal texts (3 EU + 3 Indonesia). Used interchangeably with "regulation" in UI/API (`regulation` parameter). |
| **regulation** | API/UI parameter: **`gdpr`** \| **`ai-act`** \| **`data-act`** \| **`id-pdp`** \| **`id-satu-data`** \| **`id-ai-ethics`** selecting the active corpus; unknown ⇒ `gdpr`. |
| **REGULATION_DISPLAY_ORDER** | Registry array fixing list order: `gdpr`, `data-act`, `ai-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`. |
| **ID_REGULATION_IDS** | Set of the three Indonesian ids; gates `id-law-scraper.js` and the "no cross-jurisdiction source fallback" rule. |
| **Region picker** | `#regionFilter` radiogroup (All / EU / Indonesia) with sliding thumb, plus **jurisdiction chip** and **regulation select**; part of `#headerInstrumentPicker`. |
| **Jurisdiction chip** | `#regulationJurisdictionChip` — shows the active instrument's `jurisdictionLabel`. |
| **catalogForRegion** | Client helper returning the instruments visible for the current region. |
| **alignRegionWithRegulation** | Client helper that switches the region filter when a selected instrument belongs to another jurisdiction. |
| **BM25** | Best Matching 25 — ranking function for Ask excerpt retrieval (`server.js`). |
| **Corpus** | Regulation texts + search index from `data/<id>-content.json` (six files), normalized on read/write via **`document-formatting-guardrails.js`**. |
| **ETL** | Extract, transform, load — fetching regulation HTML/TXT/PDF-derived text, parsing, merging, normalizing, and writing `<id>-content.json`. Six paths (see [ARCHITECTURE.md](ARCHITECTURE.md)). |
| **id-law-scraper.js** | ETL module for the three Indonesian instruments: `run(regulationId)`; prefers the bundled official corpus when live JDIH HTML is incomplete. |
| **Bundled official corpus** | Indonesian text shipped in `data/` (built by `scripts/build-id-corpora.py` from JDIH HTML / official PDF) and kept when a live fetch is thin. ETL label `bundled-official`. |
| **regulation-profiles.js** | Client module: per-regulation copy for the **EU** instruments (`askUi`, `sourcesUi`, `newsUi`, `browseUi`, `citationsUi`), URLs, heading patterns. |
| **regulation-profiles-id.js** | Client module extending `REGULATION_PROFILES` with the three **Indonesian** profiles (same UI keys; themes `id-pdp`, `id-satu-data`, `id-ai-ethics`). |
| **citationsUi** | Per-regulation object defining citation sidebar panel titles, HTML leads, and toggle labels (e.g. "Related circular sections" for SE AI Ethics). |
| **syncCitationSidebarChrome** | Client function applying **`citationsUi`** to Browse detail aside when regulation changes. |
| **syncRegulationChrome** | Client function updating Browse/Ask/Sources/News labels, filters, and citation sidebar after regulation switch. |
| **officialSiteName** | Registry/profile label for the official publication site (`EUR-Lex`, `peraturan.go.id`, `JDIH Komdigi`). |
| **SEED_FILES** | Internal manifest in `lib/paths.js` — **20** bundled JSON files copied to `/tmp/gdpr-qa-data` on Vercel cold start when missing. |
| **IS_VERCEL** | Read-only flag (`process.env.VERCEL`) that switches `getDataDir()` to writable `/tmp` with one-time seed copy. |
| **Module public API** | Documented `module.exports` symbols per Node file; internal helpers must not be imported cross-module (**TG-C01**). |
| **Groq** | Third-party inference API (OpenAI-compatible) used as the **primary** Ask synthesizer when **`GROQ_API_KEY`** (server) or BYOK **`groqApiKey`** is set. |
| **Tavily** | Third-party search-and-answer API used as **fallback** when Groq does not return usable Ask output. |
| **Extractive fallback** | Final Ask path (`buildSummaryFromExcerpts`) when no LLM output is available; `llm.used` is `false`. |
| **BYOK** | Bring your own key — Groq/Tavily keys stored only in browser `localStorage` (`gdpr-qa-byok-v1`) and sent per request. |
| **Ask** | The Q&A tab; served only by **`POST /api/answer`**. |
| **No end-user auth** | There is no login or user account; access is public. Only the cron route uses a secret. |
| **Removed APIs (1.2.6)** | `/api/categories`, `/api/chapters/:number`, `/api/ask`, `/api/summarize` — see [API_CONTRACTS.md](API_CONTRACTS.md). |
| **ISIC** | International Standard Industrial Classification — referenced for sector labels in **`industry-sectors.json`**. |
| **OKR** | Objectives and Key Results — planning framework; see [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md). |
| **PRD** | Product Requirements Document — [PRD.md](PRD.md). |
| **TG / BG / DG** | Prefixes for guardrail ids in [GUARDRAILS.md](GUARDRAILS.md): **technical**, **business**, **data/privacy/documentation**. |
| **News deduplication (consolidated)** | Two-pass merge in **`news-crawler.js`** / **`server.js`**: (1) normalized URL key, (2) semantic key (source + date + title fingerprint) with **`mergeNewsDuplicate`**; mirrored in the browser by **`public/news-dedupe.js`** as **`GDPR_NEWS_DEDUPE`**. |
| **news-topics.js** | Server module: topic **taxonomy** (EU AI Act, EU Data Act, and three Indonesia categories), classification, and client filter support. |
| **indonesiaPolicyNewsRe** | Regex gate in `news-crawler.js` for Indonesian policy headlines (UU PDP, Satu Data, AI ethics terms, Komdigi, …); exported with `indonesiaNewsItemIsOnScope`. |
| **Antara tag hub** | `antaranews.com/tag/<slug>` listing page harvested by `crawlAntaraPolicyTagPages`; trusted tags bypass the keyword gate. |
| **itemMatchesNewsRegulationScope** | Client function filtering News items per selected instrument (regex + topic-category checks). |
| **CANONICAL_ARTICLE_TITLES** | GDPR-only map in `public/app.js` (Articles 1–99 official short titles); used by **`getArticleDisplayTitle`** when regulation is **`gdpr`**. |
| **getArticleDisplayTitle** | Client helper resolving the article H2 in Browse, filters, and Ask aside; must not apply GDPR canonical titles to any other instrument. |
| **getRecitalDisplayTitle** | Client helper resolving recital topic lines in cards and reader from corpus **`title`** fields. |
| **App chrome** | `#appChrome` wrapper: header + tab bar; sticky on viewports ≤899px. |
| **Tools panel** | `#headerActionsPanel` — collapsible header area with Source freshness, API keys, and Refresh sources (mobile/tablet). |
| **syncHeaderToolbarStatus** | Client function syncing one-line freshness and BYOK hints in the Tools panel without duplicate status cards. |
| **newsUi** | Per-regulation News hero copy and theme (intro, scope, tags, refresh labels). |
| **browseUi** | Per-regulation Browse welcome copy: description, highlights, theme, mark badge. |
| **browseWelcomeGrid** | Desktop overview of all six instruments on the Browse placeholder, grouped in region sections. |
| **resetChaptersFilters** | Clears chapter/category/article/sub-category filters and syncs combobox inputs; runs on regulation change. |
| **loadChaptersRequestId** | Generation counter preventing stale chapter list API results from overwriting the active regulation. |
| **indo-parity.test.js** | `test/indo-parity.test.js` — `npm test` suite covering Indonesian registry, corpora, news helpers, and persisted news. |

---

## See also

- [README.md](../README.md) — product overview  
- [VARIABLES.md](VARIABLES.md) — configuration and field definitions  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md) — feature inventory
