# Documentation hub  
## EU Regulation Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the **EU Regulation Q&A Platform** — a multi-regulation reference and Q&A application covering **GDPR**, **EU AI Act**, and **EU Data Act**.

The **canonical operator handbook** is the repository root **[README.md](../README.md)**.  
**Governance standard:** [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) (**v2.2**).  
**Product version:** `package.json` **1.2.4** · **Last documentation audit:** 2026-05-19.

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, features, logic, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Document index and governance rules. |
| 3 | [PRD.md](PRD.md) | Formal requirements **v2.5** (browse welcome hub, chapters filter reliability, BYOK, Vercel). |
| 4 | [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, regulation-specific notes. |
| 5 | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Engineering standards, APIs, ETL, security. |
| 6 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Users and acceptance criteria. |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System design and REST contracts. |
| 8 | [VARIABLES.md](VARIABLES.md) | Data dictionary + **Mermaid charts** (app chrome §12, browse welcome §13). |
| 8b | [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Sample JSON (GDPR, AI Act, Data Act, Ask, news). |
| 9 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Binding ETL ↔ JSON ↔ reader contract. |
| 10 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 11 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system, **app chrome**, News hero, tokens. |
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
| [PRD.md](PRD.md) | Product requirements **v2.5** — browse welcome hub, chapters filter reliability, three regulations, responsive chrome, BYOK, News hero, Vercel. |
| [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources, News policy per regulation. |
| [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Stack, regulation APIs, three ETL scrapers, LLM, performance. |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Eight personas (legal, DPO, AI governance, Data Act, DevOps, …). |
| [USER_STORIES.md](USER_STORIES.md) | Epics: browse welcome, chapters reliability, regulation switch, Ask, News, BYOK, shell. |
| [VARIABLES.md](VARIABLES.md) | Env vars, `browseUi`, `citationsUi`, `newsUi`, chapters filter vars, relationship diagrams. |
| [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Illustrative API and corpus payloads. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product + operational metrics; OKRs **O1–O9** (incl. browse entry **O9**). |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Tokens, **regulation theme accents**, browse welcome, app chrome, News hero. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | BR ↔ PRD ↔ stories ↔ implementation ↔ verification. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms (GDPR, AI Act, Data Act, app chrome, BYOK, …). |
| [GUARDRAILS.md](GUARDRAILS.md) | **BG-***, **TG-***, **DG-*** guardrails. |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Reader formatting for all corpora. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST shapes; `regulation` = `gdpr` \| `ai-act` \| `data-act`. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Three-regulation context, ETL, Ask, News. |
| [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Serverless deploy, cron (all regulations), `/tmp` data. |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Shipped features **F-*** with regulation columns. |
| [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Start, refresh, mobile smoke checks. |
| [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | File-by-file repository map. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Primary product handbook. |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v2.2**. |
| [../CHANGELOG.md](../CHANGELOG.md) | [Keep a Changelog](https://keepachangelog.com/) history. |
| [../.env.example](../.env.example) | Environment template (GDPR + AI Act + Data Act + News + LLM). |
| [../public/regulation-profiles.js](../public/regulation-profiles.js) | Per-regulation UI copy (`askUi`, `sourcesUi`, `newsUi`, `browseUi`, `citationsUi`). |
| [../lib/regulations.js](../lib/regulations.js) | Regulation registry (ids, CELEX, paths, limits). |

---

## Conventions

- **Product name:** **EU Regulation Q&A Platform** in user-facing docs; repository folder may remain `gdpr-qa-platform`.
- **Regulation ids:** `gdpr`, `ai-act`, `data-act` (lowercase, hyphenated) in APIs and code.
- **Version alignment:** When releasing, bump `package.json`, [CHANGELOG.md](../CHANGELOG.md), and “Last updated” headers in this folder.
- **Single source of truth for status UI:** Freshness timestamps → header **Tools → Source freshness** tooltip; API key configuration → **Tools → API keys** dialog + **Ask tab** status line — not duplicate card strips.
- **Chapters filters:** GDPR-only **Category** / **Sub-category** must not apply to AI Act or Data Act after regulation switch (`getChaptersFilterSubcategoryValue`, **TG-F10**).

---

## Maintenance

See [VARIABLES.md §11](VARIABLES.md#11-maintenance-checklist) and [PRODUCT_DOCUMENTATION_STANDARD.md §5](../PRODUCT_DOCUMENTATION_STANDARD.md) for release and audit checklists.
