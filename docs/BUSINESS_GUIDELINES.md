# Business guidelines
## Regulation Q&A Platform

**Version:** 1.6 · **Last updated:** 2026-10-21 · Documentation standard **v2.6** · Product **1.2.7** · Audit date **2026-10-21**  
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
| **Value proposition** | Fast, **cited** access to official regulation text across the **European Union** and **Indonesia**, plus curated **supervisory and policy news**, without replacing professional legal judgment. |
| **Not** | Legal advice, supervisory-authority decisions, contract drafting, or automated compliance certification. |
| **Instruments (6)** | `gdpr`, `ai-act`, `data-act` (EU) and `id-pdp`, `id-satu-data`, `id-ai-ethics` (Indonesia) — all selectable in the UI. |
| **Jurisdictions (2)** | `eu` (European Union) and `id` (Indonesia). Header **region filter** (`all` / `eu` / `id`) narrows the selector. |
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

**Analogue mapping (marketing copy only, not a legal equivalence claim):** UU PDP ↔ GDPR; Satu Data Indonesia ↔ Data Act; SE AI Ethics ↔ AI Act.

---

## 3. Target outcomes for users

1. **Find** the correct article / pasal or recital / considering clause in seconds (Browse + filters + doc navigation).  
2. **Ask** questions and receive answers **grounded in corpus text** with traceable `[S#]` citations.  
3. **Verify** against official publishers (EUR-Lex, GDPR-Info, AI Act Law, Data Act Law; JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra).  
4. **Stay informed** via News from EU-level / UK ICO sources **and** Indonesian state sources (Antara, Setkab, Komdigi, Satu Data portal).  
5. **Export** a provision for offline reading (browser **Print → Save as PDF**).  
6. **Trust** that headings match the selected instrument (same article number does not imply the same title across instruments).  
7. **Operate on mobile** — freshness and API-key status from the header **Tools** menu without duplicate chrome.  
8. **Discover instruments quickly** — Browse welcome hub groups cards by **region** (EU row, Indonesia row) before drilling into chapters or recitals.

---

## 3.1 Browse welcome hub (business)

| Rule | Detail |
|------|--------|
| **Purpose** | Orient users who land on Browse without a provision open — plain-language summaries, topic tags, and official links per instrument. |
| **Card order** | `BROWSE_WELCOME_GRID_ORDER`: GDPR · EU Data Act · EU AI Act · ID PDP · ID Satu Data · ID AI Ethics, grouped into two region sections (**European Union**, **Indonesia** — hint “In-force national instruments”). |
| **Region filter** | With region `eu` or `id`, only that region’s cards show (`browse-welcome-grid--single-region`); with `all`, both sections show. |
| **Mobile** | One card for the **currently selected** instrument; **Chapters first**, **Recitals second**. |
| **Copy ownership** | Descriptions live in **`browseUi`** inside `regulation-profiles.js` (EU) and `regulation-profiles-id.js` (Indonesia). Educational, not legal analysis. |
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

- One shared file (`data/gdpr-news.json`) holds **EU and Indonesian** headlines.  
- **EU feeds:** EDPB, EDPS, European Commission, ICO (UK), Council of Europe, EU Digital Strategy (AI).  
- **Indonesian feeds:** Antara (Hukum), Antara (Tekno) plus Antara policy tag hubs, **Setkab**, **Komdigi** (best-effort; site may WAF-block), **Satu Data Indonesia / data.go.id** (best-effort SPA harvest).  
- When a non-GDPR instrument is selected, the UI **filters** headlines for relevance and shows an explanatory banner. Indonesian instruments additionally pass an Indonesian policy topic gate in the crawler.  
- Do not market News as a complete press monitor for any single instrument.

---

## 5. Credible sources policy

| Rule | Detail |
|------|--------|
| **BG-07** | National DPAs other than **ICO (UK)** are excluded from the **EU/UK** News and default credible-source lists. Indonesian **state** sources (Komdigi, Setkab, Antara, data.go.id, JDIH) are in scope **by explicit product decision** (**BG-14**). |
| **Official text** | Corpora must trace to an official publisher: EUR-Lex for EU instruments; JDIH / peraturan.go.id / official PDF for Indonesian instruments. |
| **No cross-jurisdiction fallback** | `GET /api/meta` never returns GDPR-Info / EUR-Lex / EDPB for `ai-act`, `data-act`, or `id-*` (content → structure → empty list). |
| **Attribution** | Every news card links to the **publisher’s original URL**. |
| **Refresh** | Operators run **Refresh sources** after material legal updates; **Refresh news** on a schedule (cron refreshes the six corpora daily, not news). |

---

## 6. Ask and LLM business rules

| Rule | Detail |
|------|--------|
| **Single entry point** | Ask is **`POST /api/answer` only**. Legacy `/api/ask` and `/api/summarize` are **removed**. |
| **Provider chain** | **Groq → Tavily → extractive fallback.** No other LLM vendors are supported (OpenAI, Anthropic, Gemini, Mistral, OpenRouter and `LLM_PROVIDER` are removed). |
| **Grounding** | Answers must use **retrieved sources only**; extractive fallback when LLMs are unavailable. |
| **Citations** | Every sentence in LLM answers should end with `[S#]` (enforced by prompt + repair pass). |
| **Sector framing** | Optional ISIC sector is **illustrative** — not sector-specific legal counsel (**BG-05**). |
| **Soft-law framing** | For `id-ai-ethics`, the model is instructed to state that SE 9/2023 is a Surat Edaran, not a binding UU/Perpres (**BG-15**). |
| **BYOK** | Users may supply their own Groq/Tavily keys in the browser; keys are **not** stored server-side. |
| **Disclosure** | UI shows whether **server** or **BYOK** keys powered the answer and which provider answered. |

---

## 7. Content freshness

| Content | Owner action | User expectation |
|---------|--------------|------------------|
| EU corpora (`gdpr`, `ai-act`, `data-act`) | **Refresh sources** or `npm run refresh` / `refresh-ai-act` / `refresh-data-act` | `meta.lastRefreshed` in freshness tooltip |
| Indonesian corpora | **Refresh sources** or `npm run refresh-id-pdp` / `refresh-id-satu-data` / `refresh-id-ai-ethics` | Same; bundled official text is **kept** when live HTML is thin (`extractedFrom` in `meta.etl`) |
| All six corpora | **Daily cron** (Vercel `0 2 * * *` UTC; local `node-cron` 02:00 Europe/Brussels) | Hands-off refresh attempt; on Vercel only writes `/tmp` |
| News | **Refresh news** (`POST /api/news/refresh`) | May take minutes; list capped (`NEWS_MERGE_CAP`) |
| Chapter summaries | Optional Groq regeneration | File-backed blurbs; not legal text |

---

## 8. Deployment and audience

| Environment | Typical user | Business note |
|-------------|--------------|---------------|
| **Local** (`npm start`, port 3847) | Developers, pilots | Full write access to `data/` |
| **Vercel** | Demo / light production | Ephemeral `/tmp`; bundled JSON seed (**20** files); cron refreshes all six |
| **Enterprise** | Internal compliance portal | Host behind SSO (the app has **no auth**); protect `CRON_SECRET`; restrict CORS if needed |

---

## 9. Business guideline index (BG)

Existing ids **BG-01 … BG-13** are defined in [GUARDRAILS.md](GUARDRAILS.md). This document **extends** the scheme for multi-jurisdiction scope (propose mirroring into GUARDRAILS on next edit):

| Id | Guideline | Rationale |
|----|-----------|-----------|
| BG-14 | **Multi-jurisdiction scope.** The product covers EU **and** Indonesia; do not describe it as EU-only in UI, docs, or sales material. | Registry has `jurisdiction: 'eu' \| 'id'`. |
| BG-15 | **Soft law is labelled as soft law.** `id-ai-ethics` (SE Menkominfo 9/2023) must never be presented as binding statute. | Prevents mis-stating legal force. |
| BG-16 | **Indonesian news is best-effort.** Komdigi and data.go.id harvests may return few or zero items; Antara/Setkab carry most volume. | Publisher WAF / SPA behaviour. |
| BG-17 | **Jurisdiction isolation.** Corpora, sources, chapter summaries, and filters of one instrument must never leak into another (no GDPR blurbs for Indonesia; no EUR-Lex for `id-*`). | Enforced in `/api/meta` and `readChapterSummariesPayload`. |
| BG-18 | **Single provider chain.** Marketing and docs may only claim Groq + Tavily + extractive Ask. | Other providers removed in 1.2.6. |
| BG-19 | **No built-in authentication.** `CRON_SECRET` protects only the Vercel cron route; there are no user accounts. | Do not imply per-user audit or RBAC. |

Existing ids that still apply unchanged: **BG-01** not legal advice · **BG-02** verify on official sources · **BG-03** news is third-party · **BG-04** LLM probabilistic · **BG-05** sector illustrative · **BG-08** BYOK custody · **BG-11/BG-12** titles never cross-mapped and shown in full · **BG-13** one surface per status type.

> **Superseded wording:** BG-09 (“Three regulations, one News corpus”) now reads **six instruments, one News corpus** — filter-only per instrument, no dedicated per-instrument crawlers.

---

## 10. Out of scope (business)

- Automated DPIA or conformity-assessment workflows.  
- Multi-tenant org accounts, audit logs, or role-based access control.  
- Jurisdictions other than EU and Indonesia (CCPA, PIPL, etc.) unless added as new `lib/regulations.js` entries with profile, structure, content, scraper path, and tests.  
- Guaranteed completeness of news crawl.  
- Additional LLM vendors or non-extractive offline models.

---

## 11. Related documents

- [PRD.md](PRD.md) — functional requirements  
- [GUARDRAILS.md](GUARDRAILS.md) — hard limitations  
- [USER_PERSONAS.md](USER_PERSONAS.md) — who we build for  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) — success measures  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md) — feature inventory
