# Documentation hub  
## Regulation Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the **Regulation Q&A Platform** — a multi-jurisdiction reference and Q&A application covering:

| Jurisdiction | Instruments |
|--------------|-------------|
| **European Union** | GDPR · EU AI Act · EU Data Act |
| **Indonesia** | UU PDP · Satu Data Indonesia · AI Ethics (soft law) |
| **United States** | CCPA/CPRA · OPEN Government Data Act · Colorado ADMT Act |
| **International** | ISO/IEC 27701 · ISO/IEC 19941 · ISO/IEC 23894 · SOC 2 (AICPA Trust Services Criteria) — **voluntary standards, not laws** |

The **canonical operator handbook** is the repository root **[README.md](../README.md)**.  
**Governance standard:** [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) (**v3.2**).  
**Hub version:** **3.2** · **Product version:** `package.json` **1.3.0** · **Last documentation audit:** **2026-10-23** · **Instruments:** thirteen (EU + Indonesia + United States + International) · **`SEED_FILES`:** 41 · **Tests:** `npm test` → 58 pass / 24 suites.

Every document in this folder is stamped **product 1.3.0 · standard v3.2 · audit 2026-10-23**. If a document disagrees with shipped code, the code wins and the document must be fixed.

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, features, logic, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Document index and governance rules. |
| 3 | [PRD.md](PRD.md) | Formal requirements (region picker All/EU/Indonesia/USA/INTL, thirteen instruments, Page \| Full reader, deep links, US analogues, International voluntary standards). |
| 4 | [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, regulation-specific notes. |
| 5 | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Engineering standards, APIs, ETL, security. |
| 6 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Users and acceptance criteria. |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System design and REST contracts. |
| 8 | [VARIABLES.md](VARIABLES.md) | Data dictionary + **Mermaid charts**. |
| 8b | [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Sample JSON (EU, ID, US, and International corpora, Ask, news). |
| 9 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Binding ETL ↔ JSON ↔ reader contract. |
| 10 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 11 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system, thirteen theme accents, app chrome. |
| 12 | [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product and OKR metrics. |
| 13 | [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Enterprise traceability matrix. |
| 14 | [GLOSSARY.md](GLOSSARY.md) | Terms and acronyms. |
| 15 | [../CHANGELOG.md](../CHANGELOG.md) | Release history. |
| 16 | [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Production on Vercel. |
| 17 | [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Feature inventory by area. |
| 18 | [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Ops runbooks and smoke tests. |
| 19 | [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | Source file map. |

---

## Document map (`docs/`)

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product requirements aligned with standard **v3.2** — thirteen instruments, four jurisdictions, region picker, Indo/US/ISO-SOC ETL/news, soft-law AI ethics, US and International honesty (voluntary standards, not laws). |
| [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, News policy per jurisdiction. |
| [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Stack, regulation APIs, thirteen-instrument ETL (incl. `iso-soc-scraper.js`), LLM, performance. |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Personas (EU + Indonesian + United States + International: PIMS lead, cloud portability architect, AI risk manager, SOC 2 auditor). |
| [USER_STORIES.md](USER_STORIES.md) | Epics: region/regulation, browse, Ask, News, BYOK, Indonesian parity, United States parity, International standards. |
| [VARIABLES.md](VARIABLES.md) | Env vars (incl. `MIN_ID_*`, `MIN_US_*`, `MIN_ISO_*` / force-write flags), profiles, `SEED_FILES` (41), Mermaid charts (thirteen corpora). |
| [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Illustrative API and corpus payloads. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product + operational metrics; OKRs **O1–O14** (incl. News scope tightness / GDPR scoped News). |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Tokens, thirteen regulation theme accents, region picker, News hero. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | BR ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms (GDPR, UU PDP, Satu Data, SE AI Ethics, ISO 27701 / 19941 / 23894, SOC 2, TSC, PIMS, BYOK, …). |
| [GUARDRAILS.md](GUARDRAILS.md) | **BG-***, **TG-***, **DG-*** guardrails. |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Reader formatting for all corpora. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST shapes; `regulation` = thirteen ids; jurisdictions `eu` / `id` / `us` / `intl`. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Multi-jurisdiction context, ETL, Ask, News. |
| [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Serverless deploy, cron (all thirteen), `/tmp` data. |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Shipped features **F-*** with regulation columns. |
| [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Start, refresh EU + ID + US + ISO/SOC 2, 58-test gate, smoke checks. |
| [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | File-by-file repository map. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Primary product handbook. |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v3.2**. |
| [../CHANGELOG.md](../CHANGELOG.md) | [Keep a Changelog](https://keepachangelog.com/) history. |
| [../.env.example](../.env.example) | Environment template (EU + ID + US + ISO/SOC 2 ETL + News + Groq/Tavily). |
| [../public/regulation-profiles.js](../public/regulation-profiles.js) | EU UI profiles. |
| [../public/regulation-profiles-id.js](../public/regulation-profiles-id.js) | Indonesian UI profiles. |
| [../public/regulation-profiles-us.js](../public/regulation-profiles-us.js) | United States analogue UI profiles. |
| [../public/regulation-profiles-iso.js](../public/regulation-profiles-iso.js) | International (ISO / SOC 2) UI profiles. |
| [../us-law-scraper.js](../us-law-scraper.js) | US ETL (`MIN_US_*`, `US_*_FORCE_CORPUS_WRITE`); npm `refresh-us-ccpa` / `refresh-us-admt` / `refresh-us-open-data`. |
| [../iso-soc-scraper.js](../iso-soc-scraper.js) | International ETL (`MIN_ISO_27701_*`, `MIN_ISO_19941_*`, `MIN_ISO_23894_*`, `MIN_SOC2_*`, `*_FORCE_CORPUS_WRITE`); ping-only, no paywalled body scrape; npm `refresh-iso-27701` / `refresh-iso-19941` / `refresh-iso-23894` / `refresh-soc2`. |
| [../scripts/build-iso-soc-corpora.js](../scripts/build-iso-soc-corpora.js) | Offline builder for the four copyright-safe International educational corpora (`npm run build-iso-soc-corpora`). |
| [../scripts/seed-iso-soc-news.js](../scripts/seed-iso-soc-news.js) | Merges official ISO / AICPA catalogue notices into `data/gdpr-news.json`. |
| [../test/iso-parity.test.js](../test/iso-parity.test.js) | International registry / corpus / news / Ask-retrieval parity tests. |
| [../scripts/build-us-corpora.py](../scripts/build-us-corpora.py) | Offline builder for the three US corpora from official texts. |
| [../lib/regulations.js](../lib/regulations.js) | Regulation registry (thirteen ids, four jurisdictions, flags). |
| [../lib/paths.js](../lib/paths.js) | `getDataDir()`, Vercel `SEED_FILES` (**41** JSON files). |

---

## Conventions

| Convention | Meaning |
|------------|---------|
| **Code wins** | If docs disagree with shipped code, fix the docs. |
| **IDs** | Requirements `FR-*` / `BR-*`; features `F-*`; guardrails `BG-*` / `TG-*` / `DG-*`. |
| **Regulation enum** | `gdpr` \| `ai-act` \| `data-act` \| `id-pdp` \| `id-satu-data` \| `id-ai-ethics` \| `us-ccpa` \| `us-open-data` \| `us-admt` \| `iso-27701` \| `iso-19941` \| `iso-23894` \| `soc2` (thirteen). |
| **Jurisdiction** | `eu` \| `id` \| `us` \| `intl` (plus UI filter `all`). Region picker: All / EU / Indonesia / USA / INTL; `localStorage` `gdpr-qa-region-v1` ∈ `all\|eu\|id\|us\|intl`; INTL default regulation `iso-27701`. |
| **Soft law** | Always label `id-ai-ethics` as guidance / circular, not binding statute. |
| **US honesty** | There is **no federal GDPR or AI Act**. `us-ccpa` / `us-admt` / `us-open-data` are *analogues*. The **OPEN Government Data Act** (Pub. L. 115-435 Title II) is **not** the 2014 **DATA Act**. `us-*` never falls back to GDPR-Info / EUR-Lex. |
| **International honesty** | ISO/IEC 27701, 19941, 23894 and SOC 2 are **voluntary standards / attestation criteria, not laws**. Corpora are **copyright-safe educational overlays** (public catalogue abstracts, Harmonized Structure titles, TSC category names) — no paywalled body scrape. ISO/IEC 42001 appears only as a related note under `iso-23894`. A duplicate ISO 23894 request is **one instrument**. `iso-*` / `soc2` never fall back to GDPR-Info / EUR-Lex. |
| **Reader** | Page \| Full toggle persisted as `gdprQaReaderViewMode` (`page` \| `full`); there is no Go button (jump field + Enter). |
| **Secrets** | Never paste real API keys into documentation. |
| **Dead APIs** | Do not document `/api/ask`, `/api/summarize`, `/api/categories`, `/api/chapters/:number` as live (removed 1.2.6). |

---

## Maintenance

After material product changes: update README + CHANGELOG, then lockstep VARIABLES / API_CONTRACTS / FEATURE_CATALOG / TRACEABILITY / GUARDRAILS as needed. Run a full audit against this hub when adding a jurisdiction or removing APIs. See governance rules in [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) §9.
