# Documentation hub  
## EU Regulation Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the **EU Regulation Q&A Platform** — a multi-regulation reference and Q&A application covering **GDPR**, **EU AI Act**, and **EU Data Act**.

The **canonical operator handbook** is the repository root **[README.md](../README.md)**.  
**Governance standard:** [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) (**v1.8**).  
**Product version:** `package.json` **1.2.0**.

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, features, logic, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Document index and governance rules. |
| 3 | [PRD.md](PRD.md) | Formal requirements (three regulations, BYOK, News, Vercel). |
| 4 | [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, regulation-specific notes. |
| 5 | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Engineering standards, APIs, ETL, security. |
| 6 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Users and acceptance criteria. |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System design and REST contracts. |
| 8 | [VARIABLES.md](VARIABLES.md) | Data dictionary + **Mermaid relationship charts**. |
| 8b | [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Sample JSON (GDPR, AI Act, Data Act, Ask, news). |
| 9 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Binding ETL ↔ JSON ↔ reader contract. |
| 10 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 11 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system, tokens, app credits bar. |
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
| [PRD.md](PRD.md) | Product requirements **v2.1** — GDPR, AI Act, Data Act, BYOK, News, Vercel. |
| [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, News policy per regulation. |
| [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Stack, regulation APIs, three ETL scrapers, LLM, performance. |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Eight personas (legal, DPO, AI governance, **Data Act**, DevOps, …). |
| [USER_STORIES.md](USER_STORIES.md) | Epics: regulation switch, Browse, Ask, Sources, News, BYOK, ETL. |
| [VARIABLES.md](VARIABLES.md) | Env vars, JSON fields, client storage, relationship diagrams. |
| [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Illustrative API and corpus payloads. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product + operational metrics; OKRs **O1–O6**. |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Color tokens, components, **app-credits** footer bar. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | BR ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms (GDPR, AI Act, Data Act, BM25, BYOK, …). |
| [GUARDRAILS.md](GUARDRAILS.md) | **BG-***, **TG-***, **DG-*** guardrails. |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Reader formatting for all corpora. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST shapes; `regulation` = `gdpr` \| `ai-act` \| `data-act`. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Three-regulation context, ETL, Ask, News. |
| [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Serverless deploy, cron (all regulations), `/tmp` data. |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Shipped features **F-*** with regulation columns. |
| [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Start, refresh (incl. `refresh-data-act`), monitoring. |
| [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | File-by-file repository map. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Primary product handbook. |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v1.8**. |
| [../CHANGELOG.md](../CHANGELOG.md) | [Keep a Changelog](https://keepachangelog.com/) history. |
| [../.env.example](../.env.example) | Environment template (GDPR + AI Act + Data Act + News + LLM). |
| [../public/regulation-profiles.js](../public/regulation-profiles.js) | Per-regulation UI copy. |
| [../lib/regulations.js](../lib/regulations.js) | Regulation registry (ids, CELEX, paths, limits). |

---

## Conventions

- **Product name:** **EU Regulation Q&A Platform** in user-facing docs; repository folder may remain `gdpr-qa-platform`.
- **Regulation ids:** `gdpr` (default), `ai-act`, `data-act` — must match `lib/regulations.js` and API `regulation` parameter.
- **Versioning:** Align substantive releases with `package.json` `version` and **CHANGELOG**.
- **Secrets:** Never commit `.env`; document keys only in VARIABLES and `.env.example`.
- **Legal:** Reference only — not legal advice ([GUARDRAILS.md](GUARDRAILS.md)).
- **Maintainer attribution:** Bottom **app credits** bar in `public/index.html` — not a legal disclaimer footer.

---

## See also

- [README §8](../README.md#8-project-structure) — source layout  
- [GUARDRAILS.md](GUARDRAILS.md) — product limitations  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md) — what ships per regulation
