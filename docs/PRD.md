# Product Requirements Document (PRD)  
## GDPR Q&A Platform

**Version:** 1.0  
**Last updated:** Aligned with README and product documentation standard.

---

## 1. Product overview

### 1.1 Purpose

A web application for **browsing and searching** the full text of the General Data Protection Regulation (EU) 2016/679 with **citations and links** to official EU sources. It provides:

- **Browse** — Recitals 1–173 and Articles 1–99 with topic-based filters (Category, Sub-category, Chapter, Article), document navigation (Prev/Next/Go), and PDF export.
- **Ask** — Natural-language search over the regulation with verbatim answers, optional LLM-generated summaries grounded in the text, and a “Relevant articles & documents” panel with “View in app” links.
- **Credible sources** — One tab listing official and widely cited organizations (GDPR-Info, EUR-Lex, EDPB, European Commission, ICO, GDPR.eu, Council of Europe) with direct document links.
- **News** — GDPR and data protection updates from credible sources (EDPB, ICO, European Commission, Council of Europe), grouped by source with filters and three-paragraph summaries.

Target: legal, compliance, and privacy professionals (and anyone) who need quick, sourced GDPR answers and updates without unsourced claims.

### 1.2 Goals

- Single source of truth: all answer text from regulation content (EUR-Lex) stored and searchable locally.
- Traceability: every answer and summary ties back to specific Articles or Recitals with links to GDPR-Info and EUR-Lex.
- Reduced hallucination: verbatim answers plus optional LLM summaries constrained to provided text only.
- Efficiency: browse by structure or ask in natural language; jump from Ask results to full article/recital in the app and back.
- Credible news: one place for GDPR-related updates from defined supervisory and official sources.
- No coding required: single Node.js server and browser.

### 1.3 Target users

- Legal and compliance professionals checking GDPR provisions.
- Data Protection Officers (DPOs) and privacy officers needing quick references and citations.
- Consultants and advisors preparing client-facing answers with official sources.
- Anyone needing to verify or cite the regulation text (e.g. developers, product managers).

---

## 2. User needs and problems

| Need | Problem addressed |
|------|-------------------|
| Find specific GDPR provisions quickly | Browse by Recitals/Chapters & Articles; filter by category, sub-category, chapter, article. |
| Ask questions in natural language | Ask tab with search; results show verbatim text and “View in app” to open the provision. |
| Get a concise summary without reading full text | Optional LLM summary (or extractive/client fallback) constrained to regulation text only. |
| Verify and cite official sources | Every view links to GDPR-Info and EUR-Lex; content as of date shown where applicable. |
| Stay updated on GDPR/news | News tab from EDPB, ICO, Commission, Council of Europe with filters and summaries. |
| Access key documents from one place | Credible sources tab with direct links to guidelines and official pages. |
| Return to a clean starting view | Homepage: click logo to go to Browse tab with initial placeholder and sidebar reset. |
| Export a provision for offline use | Export current article or recital as PDF from Browse detail view. |

---

## 3. Functional requirements

### 3.1 Browse regulation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B1 | User can open Browse tab and see sidebar “Regulation & sources” with Recitals, Chapters & Articles, Credible sources. | Must |
| FR-B2 | User can open Recitals list and click a recital to view full text with citations and doc nav (Prev/Next/Go). | Must |
| FR-B3 | User can open Chapters & Articles with filter bar (Category, Sub-category, Chapter, Article); sub-category options adapt to selected chapter. | Must |
| FR-B4 | User can open an article or chapter and view full text; doc nav shows Prev/Next, label (e.g. Article 5 of 99), and number input with Go. | Must |
| FR-B5 | User can use “Back” to return to list; “Back to question” appears when document was opened from Ask (“View in app”). | Must |
| FR-B6 | User can export the current article or recital as PDF (client-side). | Must |
| FR-B7 | Clicking the “GDPR Q&A Platform” logo goes to homepage: Browse tab, initial placeholder, sidebar chapter list cleared. | Must |

### 3.2 Ask a question

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | User can enter a question and submit (button or Enter); results show verbatim regulation excerpts only. | Must |
| FR-A2 | Results include “Relevant articles & documents” with “View in app” per provision. | Must |
| FR-A3 | Summary panel shows extractive or LLM-generated summary (when API key set) grounded in the same text; fallback when no key or API failure. | Must |
| FR-A4 | “View in app” switches to Browse tab and opens the corresponding article or recital; “Back to question” returns to Ask tab. | Must |
| FR-A5 | Each new question clears previous results and summary; “Regulation text as of [date]” shown when available. | Must |

### 3.3 Credible sources and News

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-S1 | User can open Credible sources tab and see all organizations with descriptions and document links (from /api/meta). | Must |
| FR-S2 | User can open News tab and see news grouped by source with three-paragraph summaries and topic tags. | Must |
| FR-S3 | User can filter News by Source and Topic; Clear filters resets both. | Must |
| FR-S4 | User can click “Refresh news” to re-fetch /api/news. | Must |

### 3.4 Content and refresh

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-R1 | User can click “Refresh sources” to run scraper; regulation text updated; “Last refreshed” shown in header. | Must |
| FR-R2 | Server may run optional daily refresh (cron 02:00 Europe/Brussels). | Should |
| FR-R3 | If gdpr-content.json is missing on server start, initial scraper run is attempted. | Should |

### 3.5 Homepage and navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-H1 | “GDPR Q&A Platform” logo in header is a link; clicking it goes to homepage (Browse tab, placeholder, sidebar reset). | Must |
| FR-H2 | Tab navigation: Browse regulation, Ask a question, Credible sources, News; active tab and panels updated correctly. | Must |

---

## 4. Non-functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Runs on Node.js ≥18; single server process; default port 3847 (configurable via PORT). | Must |
| NFR-2 | Regulation content and structure stored in data/ (gdpr-structure.json, gdpr-content.json); data/ writable for refresh. | Must |
| NFR-3 | Frontend: vanilla HTML, CSS, JavaScript; no build step; static files served from public/. | Must |
| NFR-4 | CORS enabled; suitable for same-origin or controlled cross-origin use. | Must |
| NFR-5 | Accessibility: semantic HTML, ARIA for tabs/panels/filters, keyboard support (e.g. Enter in doc nav number). | Should |
| NFR-6 | LLM summaries optional; no secrets in repo; env vars for API keys (see README §10). | Must |

---

## 5. Data model (summary)

- **gdpr-structure.json:** meta, categories, chapters[] (number, roman, title, articleRange, sourceUrl, eurLexUrl). Required for scraper.
- **gdpr-content.json:** meta (lastRefreshed, sources), categories, chapters[], recitals[] (number, text), articles[] (number, title, text, chapter), searchIndex[] (type, number, title, text, sourceUrl, eurLexUrl, chapterTitle). Generated by scraper.
- **gdpr-news.json:** newsFeeds[] (name, url, description), items[] (title, url, sourceName, sourceUrl, date, snippet, optional summaryParagraphs[], topic). Optional; merged with crawled items in /api/news.

Full data flow: [README §4 – Logic and data flow](../README.md#4-logic-and-data-flow).

---

## 6. Success criteria

- Users can browse Recitals and Chapters & Articles with filters and doc nav, and export current provision as PDF.
- Users can ask questions and get verbatim answers plus optional summary; “View in app” and “Back to question” work correctly.
- Users can open Credible sources and News; News filters and Refresh news work.
- Users can go to homepage via logo and see initial Browse state with sidebar reset.
- Refresh sources updates regulation text; last refreshed time shown. No unsourced claims in answers.

---

## 7. Out of scope

- User accounts, authentication, or multi-tenant hosting.
- Legal advice or interpretation; reference only; users must verify with official sources.
- Editing or annotating regulation text in the app.
- Real-time collaboration or versioning of content beyond refresh.
- Native mobile app; web only (responsive).

---

## 8. References

- Full product documentation: [README.md](../README.md)
- Product documentation standard: [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
- User personas: [USER_PERSONAS.md](USER_PERSONAS.md)
- User stories: [USER_STORIES.md](USER_STORIES.md)
