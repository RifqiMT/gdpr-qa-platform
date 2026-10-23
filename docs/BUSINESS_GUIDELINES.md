# Business guidelines
## Regulation Q&A Platform

**Version:** 3.2 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23** · Thirteen instruments  
**Audience:** Product, legal/compliance stakeholders, content owners, support  
**Status:** Active

---

## 1. Purpose of this document

These guidelines define **how the product should be positioned, scoped, and used** from a business perspective. They complement the [PRD](PRD.md), [GUARDRAILS](GUARDRAILS.md), and root [README](../README.md).

**Source of truth:** the code (`lib/regulations.js`, `lib/paths.js`, `server.js`, `vercel.json`, `public/regulation-profiles*.js`). Where a prose document disagrees with the code, the code wins and the document must be corrected.

---

## 2. Product positioning

| Element | Guideline |
|---------|-----------|
| **Name** | **Regulation Q&A Platform** — a **multi-jurisdiction** workspace. It is **not** EU-only. Repository / package name remains `gdpr-qa-platform` for historical reasons. |
| **Value proposition** | Fast, **cited** access to official regulation text across the **European Union**, **Indonesia**, and the **United States** (in-force analogues), plus a **voluntary-standards catalogue** (ISO/IEC 27701, 19941, 23894 and SOC 2 under **International**), and curated **supervisory and policy news**, without replacing professional legal judgment. |
| **Not** | Legal advice, supervisory-authority decisions, contract drafting, or automated compliance certification. |
| **Instruments (13)** | EU: `gdpr`, `ai-act`, `data-act`. Indonesia: `id-pdp`, `id-satu-data`, `id-ai-ethics`. United States: `us-ccpa`, `us-open-data`, `us-admt`. International (voluntary standards, **not laws**): `iso-27701`, `iso-19941`, `iso-23894`, `soc2`. |
| **Jurisdictions (4)** | `eu` (European Union), `id` (Indonesia), `us` (United States), `intl` (International). Header **region filter** (All / EU / Indonesia / USA / INTL; `all` / `eu` / `id` / `us` / `intl`) narrows the selector; INTL defaults to `iso-27701`. |
| **Access model** | **No authentication.** Deploy behind VPN/SSO if access control is required (**DG-02**). |

### 2.1 Instrument catalogue (business view)

| Id | Short name | Legal instrument | Jurisdiction | Legal force | Theme accent |
|----|------------|------------------|--------------|-------------|--------------|
| `gdpr` | GDPR | Regulation (EU) 2016/679 | EU | Binding regulation | `#0f766e` (teal) |
| `ai-act` | EU AI Act | Regulation (EU) 2024/1689 | EU | Binding regulation | `#4f46e5` (indigo) |
| `data-act` | EU Data Act | Regulation (EU) 2023/2854 | EU | Binding regulation | `#0369a1` (blue) |
| `id-pdp` | ID PDP Law | UU No. 27 Tahun 2022 (Pelindungan Data Pribadi) | ID | Binding statute | `#c8102e` (red) |
| `id-satu-data` | ID Satu Data | Perpres No. 39 Tahun 2019 (Satu Data Indonesia) | ID | Binding presidential regulation | `#047857` (emerald) |
| `id-ai-ethics` | ID AI Ethics | SE Menkominfo No. 9 Tahun 2023 (Etika Kecerdasan Artifisial) | ID | **Soft law** (circular / guidance) | `#b45309` (amber) |
| `us-ccpa` | US CCPA | Cal. Civ. Code Title 1.81.5 (CCPA/CPRA) | US (California) | Binding California statute | `#1d4ed8` (blue) |
| `us-open-data` | US OPEN Data | OPEN Government Data Act, Pub. L. 115-435 Title II | US (federal) | Binding federal statute | `#0f766e` (teal) |
| `us-admt` | US CO ADMT | Colorado SB 26-189 / C.R.S. 6-1-1701 et seq. | US (Colorado) | Binding Colorado statute | `#6d28d9` (violet) |
| `iso-27701` | ISO 27701 | ISO/IEC 27701:2025 Privacy information management systems (PIMS) | International | **Voluntary** International Standard (standalone; 2019 edition withdrawn) | `#0f766e` (teal) |
| `iso-19941` | ISO 19941 | ISO/IEC 19941:2017 Cloud computing — Interoperability and portability | International | **Voluntary** International Standard (19941-1 replacement forthcoming) | `#0369a1` (blue) |
| `iso-23894` | ISO 23894 | ISO/IEC 23894:2023 Artificial intelligence — Guidance on risk management | International | **Voluntary** guidance (not ISO/IEC 42001; not the EU AI Act) | `#5b21b6` (violet) |
| `soc2` | SOC 2 | AICPA 2017 Trust Services Criteria (Points of Focus 2022) / SOC for Service Organizations | International | **Voluntary** CPA attestation framework (not a law; not ISO certification) | `#b45309` (amber) |

**Analogue mapping (marketing copy only, not a legal equivalence claim):** UU PDP ↔ GDPR; Satu Data Indonesia ↔ Data Act; SE AI Ethics ↔ AI Act. United States: CCPA/CPRA ↔ GDPR (California only; no federal GDPR); Colorado ADMT Act ↔ AI Act (no federal AI Act; SB 26-189 replaced SB 24-205); OPEN Government Data Act ↔ Data Act for **public-sector open data** (not the 2014 DATA Act, which is spending transparency). International: ISO/IEC 27701 supports GDPR-style accountability but does not replace Regulation (EU) 2016/679; ISO/IEC 19941 is a cloud portability standard, not the Data Act; ISO/IEC 23894 is AI risk-management guidance, not the AI Act (and not ISO/IEC 42001); SOC 2 is an attestation, not a statute.

---

## 3. Target outcomes for users

1. **Find** the correct article / pasal or recital / considering clause in seconds (Browse + filters + doc navigation).  
2. **Ask** questions and receive answers **grounded in corpus text** with traceable `[S#]` citations.  
3. **Verify** against official publishers (EUR-Lex, GDPR-Info, AI Act Law, Data Act Law; JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra; CPPA, Colorado General Assembly, govinfo; ISO.org catalogue, AICPA).  
4. **Stay informed** via News from EU-level / UK ICO sources, Indonesian state sources (Antara, Setkab, Komdigi, Satu Data portal), **and** United States official hubs (FTC, CPPA/CalPrivacy, California OAG, Colorado AG, data.gov / Federal Data Strategy), **and** International standards hubs (ISO.org news, ISO Insights, AICPA & CIMA SOC).  
5. **Export** a provision for offline reading (browser **Print → Save as PDF**).  
6. **Trust** that headings match the selected instrument (same article number does not imply the same title across instruments).  
7. **Operate on mobile** — freshness and API-key status from the header **Tools** menu without duplicate chrome.  
8. **Discover instruments quickly** — Browse welcome hub groups cards by **region** (EU, Indonesia, USA, International rows) before drilling into chapters or recitals.

---

## 3.1 Browse welcome hub (business)

| Rule | Detail |
|------|--------|
| **Purpose** | Orient users who land on Browse without a provision open — plain-language summaries, topic tags, and official links per instrument. |
| **Card order** | `BROWSE_WELCOME_GRID_ORDER`: GDPR · EU Data Act · EU AI Act · ID PDP · ID Satu Data · ID AI Ethics · US CCPA · US OPEN Data · US CO ADMT · ISO 27701 · ISO 19941 · ISO 23894 · SOC 2, grouped into four region sections (**European Union**, **Indonesia**, **United States**, **International**; hints “Binding EU regulations” / “In-force national instruments” / U.S. analogues / “Voluntary ISO and AICPA instruments — not laws”). |
| **Region filter** | With region `eu`, `id`, `us`, or `intl`, only that region’s cards show (`browse-welcome-grid--single-region`); with `all`, all four sections show. |
| **Mobile** | One card for the **currently selected** instrument; **Chapters first**, **Recitals second**. |
| **Copy ownership** | Descriptions live in **`browseUi`** inside `regulation-profiles.js` (EU), `regulation-profiles-id.js` (Indonesia), `regulation-profiles-us.js` (United States), and `regulation-profiles-iso.js` (International). Educational, not legal analysis. |
| **Theme consistency** | Welcome themes must match News hero and citation accents for the same instrument (see [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md)). |
| **Filters** | GDPR-only topic filters must not carry over to any other instrument (**TG-F10**). |

---

## 4. Regulation scope

### 4.1 GDPR (default)

- Recitals **1–173**, articles **1–99**, **11** chapters.  
- Topic filters (category / sub-category) and editorial **suitable recitals** (GDPR only).  
- Credible sources in corpus: GDPR-Info, EUR-Lex, EDPB, EDPS, European Commission, ICO (UK), GDPR.eu, Council of Europe.

### 4.2 EU AI Act

- Recitals **1–180**, articles **1–113**, **13** chapters.  
- **No** GDPR-style sub-category taxonomy; **no** suitable-recital map.  
- Credible sources: AI Act Law, EUR-Lex 2024/1689, Commission AI framework.

### 4.3 EU Data Act

- Recitals **1–119**, articles **1–50**, **11** chapters.  
- **No** sub-category taxonomy; **no** suitable-recital map.  
- Credible sources: Data Act Law, EUR-Lex 2023/2854, Commission.

### 4.4 Indonesia — UU PDP (`id-pdp`)

- **Pasal 1–76** in **16 Bab**; **4** “Menimbang” (considering) clauses a–d.  
- Official sources: JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra (PDF salinan), JDIH Kemenkeu.  
- Ask uses an Indonesian-law web search context (UU 27/2022) and the same grounded, citation-first prompt as the EU instruments.

### 4.5 Indonesia — Satu Data Indonesia (`id-satu-data`)

- **Pasal 1–44** in **8 Bab**; **4** considering clauses.  
- Official sources: peraturan.go.id, JDIH Kemenko Infra (PDF salinan), Sekretariat Kabinet, Portal Satu Data Indonesia.  
- ETL floor `MIN_ID_SATU_DATA_ARTICLES` defaults to **40** (corpus currently holds 44).

### 4.6 Indonesia — AI Ethics (`id-ai-ethics`) — **soft law**

- **Sections (Bagian) 1–7** in **5** groupings; **nine ethical values** presented in the recital slot.  
- Instrument is **Surat Edaran Menteri Kominfo No. 9/2023** — **guidance, not a statute**. Product copy and Ask prompts **must** say so (**BG-15**).  
- Official sources: JDIH Komdigi; JDIH Komdigi AI Presidential Regulation drafts (reference only).

### 4.7 News (shared corpus, multi-jurisdiction)

- One shared file (`data/gdpr-news.json`) holds **EU, Indonesian, United States, and International** headlines.  
- **EU feeds:** EDPB, EDPS, European Commission, ICO (UK), Council of Europe, EU Digital Strategy (AI).  
- **Indonesian feeds:** Antara (Hukum), Antara (Tekno) plus Antara policy tag hubs, **Setkab**, **Komdigi** (best-effort; site may WAF-block), **Satu Data Indonesia / data.go.id** (best-effort SPA harvest).  
- **United States feeds:** FTC, California Privacy Protection Agency (CPPA/CalPrivacy), California Attorney General, Colorado Attorney General (ADAI / ADMT), data.gov, GSA, Federal Data Strategy.  
- **International feeds:** ISO.org news, ISO Insights, AICPA & CIMA SOC for Service Organizations hub, plus an official catalogue seed (ISO/IEC 27701:2025, 19941:2017, 23894:2023, ISO/IEC 42001 related note, 2017 TSC / 2022 Points of Focus listing).  
- When **any** instrument is selected (including GDPR), the UI **filters** headlines for relevance (regional credible-source pool + primary hubs + keyword/category rules) and shows an always-visible **Relevant to …** scope badge. Hero counts reflect the scoped set. Indonesian, United States, and International instruments additionally pass jurisdiction topic gates in the crawler.  
- Do not market News as a complete press monitor for any single instrument.

### 4.8 United States — CCPA/CPRA (`us-ccpa`)

- **Cal. Civ. Code Title 1.81.5**, §§ 1798.100–1798.199.95 (CPPA unofficial compilation, January 2025 / California Leginfo).  
- **California-only** consumer privacy statute — **not** a federal GDPR. Ask prompts must say so (**BG-10** / **TG-LLM-06**).  
- Official sources: CPPA, California Legislative Information, California Attorney General. Corpus: **33 sections**, **5 purpose notes**, **7 chapters**; ETL floor `MIN_US_CCPA_ARTICLES` = **30**.

### 4.9 United States — Colorado ADMT (`us-admt`)

- **SB 26-189** (2026 Sess. Laws ch. 131), C.R.S. 6-1-1701 et seq.; signed 14 May 2026; duties generally **1 January 2027**.  
- Repeals/re-enacts SB 24-205. **Colorado-only** automated-decision law — **not** a federal AI Act.  
- Official sources: Colorado General Assembly session laws, Colorado Attorney General (`coag.gov/ai`). Corpus: **14 sections**, **5 purpose notes**, **7 chapters**; ETL floor `MIN_US_ADMT_ARTICLES` = **12**.

### 4.10 United States — OPEN Government Data Act (`us-open-data`)

- **Title II of Pub. L. 115-435** (44 U.S.C. §§ 3502, 3504, 3506, 3511). Federal **public-sector open data** analogue of the EU Data Act.  
- **Not** the Digital Accountability and Transparency Act of **2014** (a spending-transparency false friend).  
- Official sources: govinfo, Congress.gov, data.gov. Corpus: **10 sections**, **4 purpose notes**, **5 chapters**; ETL floor `MIN_US_OPEN_DATA_ARTICLES` = **8**. It does **not** impose a private-sector data-sharing duty; do not market it as the EU Data Act equivalent beyond the public-sector open-data analogy.

### 4.11 International — voluntary standards catalogue (`iso-27701`, `iso-19941`, `iso-23894`, `soc2`)

- **Voluntary standards, not laws.** None of these four instruments is a statute, regulation, or supervisory-authority decision. Product copy, Ask prompts, and docs must say so (**BG-22**, **BG-23**, **TG-LLM-07**).  
- **ISO/IEC 27701:2025 (`iso-27701`)** — standalone PIMS requirements and guidance (2nd edition, published 14 Oct 2025; the 2019 add-on edition is withdrawn). Corpus: **14 clauses**, **5 purpose notes**, **4 chapters**; ETL floor `MIN_ISO_27701_ARTICLES` = **14**. Supports GDPR-style accountability; does **not** replace Regulation (EU) 2016/679.  
- **ISO/IEC 19941:2017 (`iso-19941`)** — cloud interoperability and portability; confirmed 2023; ISO/IEC 19941-1 replacement noted as forthcoming. Corpus: **11 clauses**, **4 purpose notes**, **4 chapters**; floor **11**. Not the EU Data Act.  
- **ISO/IEC 23894:2023 (`iso-23894`)** — AI risk-management guidance overlaying ISO 31000 (JTC 1/SC 42). Corpus: **12 clauses**, **5 purpose notes**, **5 chapters**; floor **12**. ISO/IEC 42001 (AIMS) appears only as a related note; a duplicate ISO 23894 request is **one instrument**. Not the EU AI Act.  
- **SOC 2 (`soc2`)** — CPA attestation using the AICPA 2017 Trust Services Criteria (Points of Focus 2022): Security (Common Criteria) plus optional Availability, Processing Integrity, Confidentiality, Privacy; Type 1 (design at a point in time) vs Type 2 (operating effectiveness over a period). Corpus: **20 criteria**, **6 purpose notes**, **5 chapters**; floor **20**. Not a statute and not ISO certification.  
- **Copyright-safe educational overlays only.** Corpora are built from ISO.org catalogue abstracts, Harmonized Structure / ISO 31000 titles, and publicly listed TSC names; **no paywalled ISO or AICPA body text** (and no iteh.ai samples) is scraped, reconstructed, or shipped (**BG-22**, **TG-INTL-02**). Users must buy the standard / read the AICPA criteria for authoritative wording.  
- **Labels:** *ISO 27701 clause N*, *ISO 19941 clause N*, *ISO 23894 clause N*, *SOC 2 criterion N*, and *Purpose note (N)* — never *Article* / *Recital*.  
- **Audience value:** privacy-engineering, cloud, AI-governance, and assurance teams who need a cited, jump-to reference alongside the binding EU / ID / US instruments.

---

## 5. Credible sources policy

| Rule | Detail |
|------|--------|
| **BG-07** | National DPAs other than **ICO (UK)** are excluded from the **EU/UK** News and default credible-source lists. Indonesian **state** sources (Komdigi, Setkab, Antara, data.go.id, JDIH) are in scope **by explicit product decision** (**BG-14**). |
| **Official text** | Corpora must trace to an official publisher: EUR-Lex for EU instruments; JDIH / peraturan.go.id / official PDF for Indonesian instruments; CPPA / Colorado session laws / govinfo for United States analogues; ISO.org catalogue and AICPA pages for International standards (**catalogue-level overlays only — never paid body text**). |
| **No cross-jurisdiction fallback** | `GET /api/meta` never returns GDPR-Info / EUR-Lex / EDPB for `ai-act`, `data-act`, `id-*`, `us-*`, `iso-*`, or `soc2` (content → structure → empty list). |
| **Attribution** | Every news card links to the **publisher’s original URL**. |
| **Refresh** | Operators run **Refresh sources** after material legal updates; **Refresh news** on a schedule (cron refreshes the thirteen corpora daily, not news). |

---

## 6. Ask and LLM business rules

| Rule | Detail |
|------|--------|
| **Single entry point** | Ask is **`POST /api/answer` only**. Legacy `/api/ask` and `/api/summarize` are **removed**. |
| **Provider chain** | **Groq → Tavily → extractive fallback.** No other LLM vendors are supported (OpenAI, Anthropic, Gemini, Mistral, OpenRouter and `LLM_PROVIDER` are removed). |
| **Grounding** | Answers must use **retrieved sources only**; extractive fallback when LLMs are unavailable. |
| **Citations** | Every sentence in LLM answers should end with `[S#]` (enforced by prompt + repair pass). |
| **Sector framing** | Optional ISIC sector is **illustrative** — not sector-specific legal counsel (**BG-03**). |
| **Jurisdiction framing (US)** | For `us-*`, the prompt states California / Colorado / federal-public-sector scope, that no federal GDPR / AI Act exists, and that the 2014 DATA Act is not the instrument (**BG-10**, **TG-LLM-06**). |
| **Voluntary-standard framing (International)** | For `iso-*` / `soc2`, the prompt states the instrument is a voluntary standard or CPA attestation, not a law; 23894 ≠ 42001 ≠ EU AI Act; SOC 2 ≠ ISO certification; no invented paid text (**BG-22**, **BG-23**, **TG-LLM-07**). |
| **Soft-law framing** | For `id-ai-ethics`, the model is instructed to state that SE 9/2023 is a Surat Edaran, not a binding UU/Perpres (**BG-15** / **BG-05**). |
| **BYOK** | Users may supply their own Groq/Tavily keys in the browser; keys are **not** stored server-side. |
| **Disclosure** | UI shows whether **server** or **BYOK** keys powered the answer and which provider answered. |

---

## 7. Content freshness

| Content | Owner action | User expectation |
|---------|--------------|------------------|
| EU corpora (`gdpr`, `ai-act`, `data-act`) | **Refresh sources** or `npm run refresh` / `refresh-ai-act` / `refresh-data-act` | `meta.lastRefreshed` in freshness tooltip |
| Indonesian corpora | **Refresh sources** or `npm run refresh-id-pdp` / `refresh-id-satu-data` / `refresh-id-ai-ethics` | Same; bundled official text is **kept** when live HTML is thin (`extractedFrom` in `meta.etl`) |
| United States corpora | **Refresh sources** or `npm run refresh-us-ccpa` / `refresh-us-admt` / `refresh-us-open-data` | Bundled official extracts kept when live ping fails |
| International corpora | **Refresh sources** or `npm run refresh-iso-27701` / `refresh-iso-19941` / `refresh-iso-23894` / `refresh-soc2` | Reachability ping + re-normalize only; the bundled educational overlay is kept (edition changes need a maintainer rebuild via `npm run build-iso-soc-corpora`) |
| All thirteen corpora | **Daily cron** (Vercel `0 2 * * *` UTC; local `node-cron` 02:00 Europe/Brussels) | Hands-off refresh attempt; on Vercel only writes `/tmp` |
| News | **Refresh news** (`POST /api/news/refresh`) | May take minutes; list capped (`NEWS_MERGE_CAP`) |
| Chapter summaries | Optional Groq regeneration | File-backed blurbs; not legal text |

---

## 8. Deployment and audience

| Environment | Typical user | Business note |
|-------------|--------------|---------------|
| **Local** (`npm start`, port 3847) | Developers, pilots | Full write access to `data/` |
| **Vercel** | Demo / light production | Ephemeral `/tmp`; bundled JSON seed (**41** files); cron refreshes all thirteen |
| **Enterprise** | Internal compliance portal | Host behind SSO (the app has **no auth**); protect `CRON_SECRET`; restrict CORS if needed |

---

## 9. Business guideline index (BG)

[GUARDRAILS.md §1](GUARDRAILS.md#1-business-and-legal-guardrails) is canonical for **BG-01 … BG-10** and **BG-20 … BG-24**. This document **extends** the scheme with BG-14 … BG-19 for multi-jurisdiction scope (cross-referenced from GUARDRAILS):

| Id | Guideline | Rationale |
|----|-----------|-----------|
| BG-14 | **Multi-jurisdiction scope.** The product covers EU, Indonesia, the United States, **and** an International voluntary-standards catalogue; do not describe it as EU-only in UI, docs, or sales material. | Registry has `jurisdiction: 'eu' \| 'id' \| 'us' \| 'intl'`. |
| BG-15 | **Soft law is labelled as soft law.** `id-ai-ethics` (SE Menkominfo 9/2023) must never be presented as binding statute. | Prevents mis-stating legal force. |
| BG-16 | **Indonesian news is best-effort.** Komdigi and data.go.id harvests may return few or zero items; Antara/Setkab carry most volume. | Publisher WAF / SPA behaviour. |
| BG-17 | **Jurisdiction isolation.** Corpora, sources, chapter summaries, and filters of one instrument must never leak into another (no GDPR blurbs for Indonesia, the United States, or International; no EUR-Lex for `id-*`, `us-*`, `iso-*`, or `soc2`). | Enforced in `/api/meta` and `readChapterSummariesPayload`; `us-parity` and `iso-parity` tests. |
| BG-18 | **Single provider chain.** Marketing and docs may only claim Groq + Tavily + extractive Ask. | Other providers removed in 1.2.6. |
| BG-19 | **No built-in authentication.** `CRON_SECRET` protects only the Vercel cron route; there are no user accounts. | Do not imply per-user audit or RBAC. |

Canonical ids that still apply unchanged (see GUARDRAILS): **BG-01** not legal advice · **BG-02** verify on official sources · **BG-03** no invented sector statutes · **BG-04** no legal equivalence across jurisdictions · **BG-05** soft law · **BG-06** news is awareness · **BG-08** BYOK custody · **BG-10** no invented U.S. federal GDPR / AI Act / Data Act · **BG-20** U.S. instruments are state or sector analogues · **BG-21** U.S. news is awareness only · **BG-22** International instruments are voluntary standards, copyright-safe overlays only · **BG-23** no certification / compliance equivalence claims · **BG-24** International news is awareness only; 23894 duplicate = one instrument. Product conventions carried from earlier releases: titles are never cross-mapped between instruments and are shown in full; one surface per status type (no duplicate status strips).

> **Superseded wording:** BG-09 (“Three regulations, one News corpus”) now reads **thirteen instruments, one News corpus** — filter-only per instrument, no dedicated per-instrument crawlers.

---

## 10. Out of scope (business)

- Automated DPIA or conformity-assessment workflows.  
- Multi-tenant org accounts, audit logs, or role-based access control.  
- Jurisdictions and standards other than the thirteen registered instruments (e.g. China’s PIPL, other U.S. state privacy laws, ISO/IEC 42001 or ISO/IEC 27001 as shipped corpora) unless added as new `lib/regulations.js` entries with profile, structure, content, scraper path, and tests. Federal U.S. GDPR / AI Act copies are **out of scope because they do not exist**. The 2014 DATA Act is **out of scope** (false friend of the EU Data Act). Paid ISO / AICPA body text and certification or attestation workflows are **out of scope**.  
- Guaranteed completeness of news crawl.  
- Additional LLM vendors or non-extractive offline models.

---

## 11. Related documents

- [PRD.md](PRD.md) — functional requirements  
- [GUARDRAILS.md](GUARDRAILS.md) — hard limitations  
- [USER_PERSONAS.md](USER_PERSONAS.md) — who we build for  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) — success measures  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md) — feature inventory
