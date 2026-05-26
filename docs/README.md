# Documentation hub  
## EU Regulation Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the **EU Regulation Q&A Platform** (GDPR + EU AI Act). The **canonical operator handbook** is the repository root **[README.md](../README.md)**.

**Documentation standard:** [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) (**v1.7**).

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, dual-regulation features, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Governance checklist and full document index. |
| 3 | [PRD.md](PRD.md) | Formal requirements (GDPR + EU AI Act). |
| 4 | [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business rules, scope, and compliance positioning. |
| 5 | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Engineering standards, APIs, and operations. |
| 6 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Users and verifiable acceptance criteria. |
| 7 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System design and REST contracts. |
| 8 | [VARIABLES.md](VARIABLES.md) | Data dictionary + **Mermaid relationship charts**. |
| 8b | [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Sample JSON (GDPR + AI Act + Ask). |
| 9 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Binding ETL ↔ JSON ↔ reader contract. |
| 10 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 11 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system and regulation-aware UI. |
| 12 | [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product and OKR metrics. |
| 13 | [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Requirements ↔ code ↔ verification. |
| 14 | [GLOSSARY.md](GLOSSARY.md) | Terms (GDPR, AI Act, BM25, GPAI, …). |
| 15 | [../CHANGELOG.md](../CHANGELOG.md) | Release history. |
| 16 | [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Production on Vercel. |
| 17 | [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Feature inventory (F-BRW-*, F-ASK-*, …). |
| 18 | [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Local/Vercel ops, smoke tests, incidents. |

---

## Document map (`docs/`)

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product requirements **v2.0** — dual regulation, BYOK, News, Vercel. |
| [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) | Business scope, credible sources policy, legal positioning. |
| [TECH_GUIDELINES.md](TECH_GUIDELINES.md) | Stack, regulation APIs, ETL, LLM, security, performance. |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Seven personas including **AI governance lead**. |
| [USER_STORIES.md](USER_STORIES.md) | Epics: Browse, Ask, Sources, News, regulation switch, BYOK, deploy. |
| [VARIABLES.md](VARIABLES.md) | Env vars, JSON fields, client storage, Mermaid charts. |
| [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md) | Illustrative API and corpus payloads. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product + operational metrics; OKRs **O1–O5**. |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Tokens, components, regulation selector, news banner. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Enterprise traceability matrix. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms and domain terms. |
| [GUARDRAILS.md](GUARDRAILS.md) | **BG-***, **TG-***, **DG-*** guardrails. |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Reader formatting contract (GDPR + AI Act corpora). |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST shapes with `regulation` parameter. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Multi-regulation context, ETL, Ask sequence. |
| [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) | Serverless deploy, cron, `/tmp` data. |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Shipped features by area and regulation flags. |
| [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) | Runbooks: start, refresh, monitoring, troubleshooting. |
| [SOURCE_CODE_INVENTORY.md](SOURCE_CODE_INVENTORY.md) | File-by-file source map and dependency sketch. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Primary product handbook. |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v1.7**. |
| [../CHANGELOG.md](../CHANGELOG.md) | [Keep a Changelog](https://keepachangelog.com/) history. |
| [../.env.example](../.env.example) | Environment template (GDPR + AI Act + News + LLM). |
| [../public/regulation-profiles.js](../public/regulation-profiles.js) | Per-regulation UI copy (Ask, Sources, News). |

---

## Conventions

- **Product name:** **EU Regulation Q&A Platform** in user-facing docs; repository folder may remain `gdpr-qa-platform`.
- **Regulation ids:** `gdpr` (default), `ai-act` — must match `lib/regulations.js` and API `regulation` parameter.
- **Versioning:** Align substantive releases with `package.json` `version`.
- **Secrets:** Never commit `.env`; document keys only in VARIABLES and `.env.example`.
- **Legal:** Reference only — not legal advice ([GUARDRAILS.md](GUARDRAILS.md)).

---

## See also

- [README §8](../README.md#8-project-structure) — source layout  
- [GUARDRAILS.md](GUARDRAILS.md) — what the product must not claim
