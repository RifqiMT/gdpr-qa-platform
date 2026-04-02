# Documentation hub  
## GDPR Q&A Platform

This directory contains **professional product, design, and engineering documentation** for the GDPR Q&A Platform. The **canonical installation and feature guide** is the repository root **[README.md](../README.md)**.

---

## Recommended reading order

| Step | Document | Why read it |
|------|----------|-------------|
| 1 | [../README.md](../README.md) | Product overview, features, configuration, quick start. |
| 2 | [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation governance and full index. |
| 3 | [PRD.md](PRD.md) | Formal requirements and scope. |
| 4 | [USER_PERSONAS.md](USER_PERSONAS.md) / [USER_STORIES.md](USER_STORIES.md) | Who uses the product and verifiable stories. |
| 5 | [ARCHITECTURE.md](ARCHITECTURE.md) / [API_CONTRACTS.md](API_CONTRACTS.md) | System shape and REST contracts. |
| 6 | [VARIABLES.md](VARIABLES.md) | Environment variables, JSON fields, **mermaid relationship charts**. |
| 7 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | **Binding** ETL ↔ JSON ↔ reader contract. |
| 8 | [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations. |
| 9 | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Visual system for UI work. |
| 10 | [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product metrics and example OKRs. |
| 11 | [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Enterprise-style requirements traceability. |
| 12 | [../CHANGELOG.md](../CHANGELOG.md) | Historical changes. |

---

## Document map (`docs/`)

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product requirements: goals, functional/non-functional requirements, data model, success criteria, out of scope (**v1.1**). |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Six user personas plus **Engineering / DevOps**. |
| [USER_STORIES.md](USER_STORIES.md) | User stories by epic, aligned with PRD and traceability matrix. |
| [VARIABLES.md](VARIABLES.md) | **Comprehensive** data dictionary: technical name, friendly name, definition, formula, location, example; **two** relationship diagrams. |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product metrics, operational metrics, **document formatting** metrics, example OKRs (**O1–O4**). |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | Design principles, **light theme palette**, typography, spacing, motion, **responsive breakpoints**, components, print/PDF. |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Business requirements ↔ PRD ↔ stories ↔ code ↔ verification. |
| [GLOSSARY.md](GLOSSARY.md) | Acronyms and product terms (BM25, ETL, corpus, GDPR-Info, …). |
| [GUARDRAILS.md](GUARDRAILS.md) | Business and technical guardrails (**BG-***, **TG-***, **DG-***). |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Mandatory refresh contract, reader pipeline, ETL obligations, verification checklist. |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST API request/response shapes (including **`POST /api/refresh`**). |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System context, logical layers, **regulation refresh** and **Ask** sequence diagrams. |

---

## Repository-level files

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Main product documentation (single source for operators). |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard **v1.1** and checklist. |
| [../CHANGELOG.md](../CHANGELOG.md) | Release and change history ([Keep a Changelog](https://keepachangelog.com/)). |
| [../.env.example](../.env.example) | Environment variable template (no secrets). |

---

## Conventions

- **Versioning:** Align substantive doc updates with **`package.json`** `version` when releasing.
- **Links:** Use relative paths from **`docs/`** to siblings; **`../`** for root files.
- **Legal:** User-facing assurance is **reference only**; see [GUARDRAILS.md](GUARDRAILS.md).
- **Secrets:** Never commit **`.env`**; describe variables only in **VARIABLES**, **README**, and **`.env.example`**.

---

## See also

- [README.md](../README.md) — **§8 Project structure** for file layout  
- [GUARDRAILS.md](GUARDRAILS.md) — **TG-E05** (mandatory formatting on refresh)
