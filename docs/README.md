# Documentation hub  
## Regulation Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the **Regulation Q&A Platform** — a multi-jurisdiction reference and Q&A application covering:

| Jurisdiction | Instruments |
|--------------|-------------|
| **European Union** | GDPR · EU AI Act · EU Data Act |
| **Indonesia** | UU PDP · Satu Data Indonesia · AI Ethics (soft law) |

The **canonical operator handbook** is the repository root **[README.md](../README.md)**.  
**Governance standard:** [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) (**v2.6**).  
**Product version:** `package.json` **1.2.7** · **Last documentation audit:** **2026-10-21**.

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, features, logic, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Document index and governance rules. |
| 3 | [PRD.md](PRD.md) | Formal requirements **v2.8** (region picker, six instruments, Page \| Full reader, deep links). |
| 4 | [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, regulation-specific notes. |
| 5 | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Engineering standards, APIs, ETL, security. |
| 6 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Users and acceptance criteria. |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System design and REST contracts. |
| 8 | [VARIABLES.md](VARIABLES.md) | Data dictionary + **Mermaid charts**. |
| 8b | [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Sample JSON (EU + ID corpora, Ask, news). |
| 9 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Binding ETL ↔ JSON ↔ reader contract. |
| 10 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 11 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system, six theme accents, app chrome. |
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
| [PRD.md](PRD.md) | Product requirements **v2.7** — six instruments, region picker, Indo ETL/news, soft-law AI ethics. |
| [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, News policy per jurisdiction. |
| [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Stack, regulation APIs, six ETL scrapers, LLM, performance. |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Personas (EU + Indonesian privacy / data / AI governance). |
| [USER_STORIES.md](USER_STORIES.md) | Epics: region/regulation, browse, Ask, News, BYOK, Indo parity. |
| [VARIABLES.md](VARIABLES.md) | Env vars (incl. `MIN_ID_*`), profiles, SEED_FILES (20), Mermaid charts. |
| [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Illustrative API and corpus payloads. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product + operational metrics; OKRs **O1–O12**. |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Tokens, six regulation theme accents, region picker, News hero. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | BR ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms (GDPR, UU PDP, Satu Data, SE AI Ethics, BYOK, …). |
| [GUARDRAILS.md](GUARDRAILS.md) | **BG-***, **TG-***, **DG-*** guardrails. |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Reader formatting for all corpora. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST shapes; `regulation` = six ids. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Multi-jurisdiction context, ETL, Ask, News. |
| [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Serverless deploy, cron (all six), `/tmp` data. |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Shipped features **F-*** with regulation columns. |
| [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Start, refresh EU+ID, mobile smoke checks. |
| [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | File-by-file repository map. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Primary product handbook. |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v2.6**. |
| [../CHANGELOG.md](../CHANGELOG.md) | [Keep a Changelog](https://keepachangelog.com/) history. |
| [../.env.example](../.env.example) | Environment template (EU + ID ETL + News + Groq/Tavily). |
| [../public/regulation-profiles.js](../public/regulation-profiles.js) | EU UI profiles. |
| [../public/regulation-profiles-id.js](../public/regulation-profiles-id.js) | Indonesian UI profiles. |
| [../lib/regulations.js](../lib/regulations.js) | Regulation registry (six ids, jurisdictions, flags). |
| [../lib/paths.js](../lib/paths.js) | `getDataDir()`, Vercel `SEED_FILES` (**20** JSON files). |

---

## Conventions

| Convention | Meaning |
|------------|---------|
| **Code wins** | If docs disagree with shipped code, fix the docs. |
| **IDs** | Requirements `FR-*` / `BR-*`; features `F-*`; guardrails `BG-*` / `TG-*` / `DG-*`. |
| **Regulation enum** | `gdpr` \| `ai-act` \| `data-act` \| `id-pdp` \| `id-satu-data` \| `id-ai-ethics`. |
| **Jurisdiction** | `eu` \| `id` (plus UI filter `all`). |
| **Soft law** | Always label `id-ai-ethics` as guidance / circular, not binding statute. |
| **Secrets** | Never paste real API keys into documentation. |
| **Dead APIs** | Do not document `/api/ask`, `/api/summarize`, `/api/categories`, `/api/chapters/:number` as live (removed 1.2.6). |

---

## Maintenance

After material product changes: update README + CHANGELOG, then lockstep VARIABLES / API_CONTRACTS / FEATURE_CATALOG / TRACEABILITY / GUARDRAILS as needed. Run a full audit against this hub when adding a jurisdiction or removing APIs. See governance rules in [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) §9.
