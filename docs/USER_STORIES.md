# User Stories  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6**  
**Traceability:** Stories map to [PRD.md](PRD.md) and [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## Epic 0: Region and regulation selection

| ID | Story | Priority |
|----|-------|----------|
| US-R-01 | As a user, I can filter instruments by **All / European Union / Indonesia** so the selector matches my jurisdiction. | P0 |
| US-R-02 | As a user, I can select any of the **six** instruments and have Browse, Ask, and Sources follow that choice. | P0 |
| US-R-03 | As a user, my last selected regulation persists across reloads (`gdpr-qa-regulation-v1`). | P0 |
| US-R-04 | As a user, UI chrome (titles, placeholders, links, themes) updates when I switch regulation. | P0 |
| US-R-05 | As a user, citation sidebar publisher links match the active instrument (never stuck on GDPR-Info for ID laws). | P0 |

---

## Epic 0b: Responsive app shell

| ID | Story | Priority |
|----|-------|----------|
| US-S-01 | As a mobile user, I can open **Tools** for freshness, API keys, and Refresh sources. | P0 |
| US-S-02 | As a user, sticky chrome does not clip the reading pane. | P1 |
| US-S-03 | As a user, tabs clearly show Browse / Ask / Sources / News with an active indicator. | P1 |
| US-S-04 | As a user, the logo returns me to the Browse welcome hub. | P1 |

---

## Epic 0c: Browse welcome hub

| ID | Story | Priority |
|----|-------|----------|
| US-W-01 | As a desktop user, I see themed overview cards for instruments (EU + Indonesia display order). | P1 |
| US-W-02 | As a mobile user, I see a solo welcome card for the active regulation. | P1 |
| US-W-03 | As a user, quick actions open **Chapters & articles** first and **Recitals** second. | P1 |
| US-W-04 | As a user, each card shows accurate description, theme tags, and official link for that instrument. | P1 |

---

## Epic 1: Browse regulation

| ID | Story | Priority |
|----|-------|----------|
| US-B-01 | As a user, I can list and open articles/pasal and recitals/considering/values for the active instrument. | P0 |
| US-B-02 | As a GDPR user, I can filter by category and sub-category topics. | P0 |
| US-B-03 | As a non-GDPR user, I never see a false empty list caused by leftover GDPR topic filters. | P0 |
| US-B-04 | As a user, I can navigate with Prev / Next / Go and export PDF. | P1 |
| US-B-05 | As a GDPR user, I see suitable recitals; as other users, I see related provisions from text only. | P1 |
| US-B-06 | As a user, article/pasal titles show the official corpus title (GDPR may use canonical map). | P0 |
| US-B-07 | As a user, chapter introductions match the active regulation (no GDPR blurbs under ID instruments). | P1 |
| US-B-08 | As an Indonesian user, I can browse UU PDP pasal, Satu Data pasal, and AI Ethics sections/values. | P0 |

---

## Epic 2: Ask a question

| ID | Story | Priority |
|----|-------|----------|
| US-A-01 | As a user, I can ask a natural-language question and receive a grounded answer with `[S#]` citations. | P0 |
| US-A-02 | As a user, Ask uses only `POST /api/answer` (Groq → Tavily → extractive). | P0 |
| US-A-03 | As a user, I can open cited provisions in Browse and return via Back to question. | P0 |
| US-A-04 | As a power user, I can use BYOK Groq/Tavily keys validated before save. | P1 |
| US-A-05 | As an industry specialist, I can optionally apply ISIC sector framing. | P1 |
| US-A-06 | As an AI Ethics user, Ask framing states that SE Menkominfo 9/2023 is soft law. | P0 |
| US-A-07 | As a user without LLM keys, I still receive an extractive answer from corpus excerpts. | P0 |

---

## Epic 3: Credible sources

| ID | Story | Priority |
|----|-------|----------|
| US-C-01 | As a user, Sources lists credible organizations for the **active** instrument only. | P0 |
| US-C-02 | As an Indonesian user, I see JDIH / peraturan.go.id style sources — not GDPR-Info. | P0 |
| US-C-03 | As an EU AI Act / Data Act user, I see instrument-specific publishers + EUR-Lex. | P0 |

---

## Epic 4: News

| ID | Story | Priority |
|----|-------|----------|
| US-N-01 | As a user, I can browse supervisory/policy news with source and topic filters. | P0 |
| US-N-02 | As an AI Act / Data Act / UU PDP / Satu Data / AI Ethics user, I see a relevance-filtered list and banner. | P0 |
| US-N-03 | As a user, I can Refresh news to re-crawl EU and Indonesian hubs. | P0 |
| US-N-04 | As an Indonesian user, empty filtered states tell me to Refresh news when feeds are sparse. | P1 |
| US-N-05 | As a user, duplicate stories collapse (URL + semantic dedupe). | P1 |

---

## Epic 5: Content refresh

| ID | Story | Priority |
|----|-------|----------|
| US-E-01 | As an operator, Refresh sources updates only the selected instrument’s corpus. | P0 |
| US-E-02 | As an operator, I can CLI-refresh GDPR, AI Act, Data Act, and each Indonesian instrument. | P0 |
| US-E-03 | As an operator, daily cron refreshes all six instruments. | P0 |
| US-E-04 | As an operator, every corpus write runs formatting guardrails. | P0 |
| US-E-05 | As a Vercel operator, cold start seeds EU + ID JSON via `SEED_FILES`. | P0 |

---

## Epic 6: Homepage and navigation

| ID | Story | Priority |
|----|-------|----------|
| US-H-01 | As a user, clicking the brand logo resets Browse to the welcome hub. | P1 |
| US-H-02 | As a user, I can move between Browse, Ask, Sources, and News without losing regulation selection. | P0 |

---

## Epic 7: Export and citations

| ID | Story | Priority |
|----|-------|----------|
| US-X-01 | As a user, I can export the open provision as PDF. | P1 |
| US-X-02 | As a user, citation chips and official links open the correct publisher for the active instrument. | P0 |

---

## Epic 8: Accessibility and UX

| ID | Story | Priority |
|----|-------|----------|
| US-U-01 | As a keyboard user, I can operate tabs, filters, and doc Go via keyboard. | P1 |
| US-U-02 | As a mobile user, Filters collapse behind a clear control with active-filter summary. | P1 |

---

## Epic 9: Cross-references and corpus quality

| ID | Story | Priority |
|----|-------|----------|
| US-Q-01 | As a GDPR user, related + suitable recitals appear where mapped. | P1 |
| US-Q-02 | As any user, reader numbered paragraphs match source layout after refresh. | P0 |
| US-Q-03 | As engineering, `npm test` validates Indo registry/corpus/news parity. | P0 |

---

## Epic 10: Documentation and compliance artifacts

| ID | Story | Priority |
|----|-------|----------|
| US-D-01 | As a stakeholder, I can find PRD, personas, stories, variables, metrics, design, traceability, and guardrails under `docs/`. | P1 |
| US-D-02 | As engineering, docs do not advertise removed 1.2.6 APIs or LLM providers. | P0 |

---

## Acceptance criteria (representative)

### AC — Region + Indonesian instrument (US-R-01, US-R-02, US-B-08)

1. Set region to **Indonesia** → selector shows `id-pdp`, `id-satu-data`, `id-ai-ethics` only.  
2. Select **ID PDP Law** → Browse loads pasal counts consistent with corpus; Ask answers cite UU PDP sources.  
3. Sources tab does **not** show GDPR-Info / EDPB as primary cards.

### AC — Soft-law Ask (US-A-06)

1. Select **ID AI Ethics**.  
2. Ask a question about ethical values.  
3. System prompt / answer framing indicates guidance / circular (soft law), not a binding Act.

### AC — Chapters filter reliability (US-B-03)

1. On GDPR, set a Sub-category filter.  
2. Switch to AI Act, Data Act, or any ID instrument.  
3. Chapters list is not falsely empty; topic filters are hidden/cleared.

### AC — News Indo filter (US-N-02, US-N-04)

1. Select UU PDP or Satu Data.  
2. News list applies Indo relevance filter; empty state mentions Refresh news.  
3. After successful refresh with Indo items present, cards render with source attribution.

### AC — Dead API absence (US-A-02, US-D-02)

1. Confirm SPA Ask calls only `/api/answer`.  
2. Confirm documentation does not list `/api/ask` or `/api/summarize` as live.

---

## Reference

- [PRD.md](PRD.md)  
- [USER_PERSONAS.md](USER_PERSONAS.md)  
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)
