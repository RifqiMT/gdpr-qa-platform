# Documentation hub  
## GDPR Q&A Platform

This folder contains product, design, and engineering documentation. Start with the **[README.md](../README.md)** in the repository root for installation, features, and configuration.

---

## Document map

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product requirements: goals, functional/non-functional requirements, data model, scope |
| [USER_PERSONAS.md](USER_PERSONAS.md) | Primary personas, goals, pain points, feature mapping |
| [USER_STORIES.md](USER_STORIES.md) | User stories by epic (Browse, Ask, News, …) |
| [VARIABLES.md](VARIABLES.md) | Data dictionary: env vars, JSON fields, Ask variables, relationship diagram |
| [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) | Product metrics and example OKRs |
| [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) | UI tokens, colors, typography, components |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Business ↔ PRD ↔ stories ↔ code ↔ verification |
| [GUARDRAILS.md](GUARDRAILS.md) | Business and technical limitations |
| [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | ETL ↔ JSON ↔ reader formatting contract |
| [API_CONTRACTS.md](API_CONTRACTS.md) | REST API request/response shapes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System context and sequence diagrams |

---

## Repository-level index

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Main product documentation |
| [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md) | Documentation standard and checklist |
| [../CHANGELOG.md](../CHANGELOG.md) | Release and change history |

---

## Conventions

- **Versioning:** Align doc updates with `package.json` `version` when releasing.
- **Links:** Prefer relative paths from `docs/` to sibling files; use `../` for root files.
- **Legal:** All user-facing assurance is “reference only”; see [GUARDRAILS.md](GUARDRAILS.md).
