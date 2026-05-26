# User Stories  
## EU Regulation Q&A Platform

**Version:** 1.2 · **Last updated:** 2026-05-25

Stories are grouped by epic. Format: **As a** [persona], **I want** [action] **so that** [benefit].  
Personas: see [USER_PERSONAS.md](USER_PERSONAS.md) (including **AI governance lead**).

---

## Epic 0: Regulation selection

| ID | Story | Persona |
|----|--------|---------|
| US-R1 | As an **AI governance** user, I want to select **EU AI Act** in the header so that Browse and Ask use the AI Act corpus (113 articles, 180 recitals). | AI governance |
| US-R2 | As a **Legal/Compliance** user, I want my regulation choice **remembered** on return visits so that I do not re-select GDPR each session. | Legal/Compliance |
| US-R3 | As **Engineering / DevOps**, I want **Refresh sources** to update only the **active** regulation so that GDPR and AI Act ETL do not overwrite each other unintentionally. | Engineering / DevOps |
| US-R4 | As a **DPO**, I want tab labels and placeholders to **change with regulation** so that I am never confused about whether I am reading GDPR or AI Act text. | DPO |

---

## Epic 1: Browse regulation

| ID | Story | Persona |
|----|--------|---------|
| US-B1 | As a **Legal/Compliance** user, I want to open the Browse tab and see the sidebar “Regulation & sources” with Recitals, Chapters & Articles, and Credible sources so that I can choose how to navigate. | Legal/Compliance |
| US-B2 | As a **Legal/Compliance** user, I want to open Recitals and click a recital to see full text with citations and Prev/Next/Go so that I can read and navigate without leaving the app. | Legal/Compliance |
| US-B3 | As a **DPO**, I want to filter Chapters & Articles by Category, Sub-category (GDPR), Chapter, and Article so that I can narrow down to the right provisions quickly. | DPO |
| US-B3b | As an **AI governance** user, I want to browse AI Act chapters **without GDPR-only sub-categories** so that the filter bar matches the AI Act structure. | AI governance |
| US-B8 | As an **AI governance** user, I want article headings and external links to use **AI Act Law** and EUR-Lex 2024/1689 so that citations match my compliance pack. | AI governance |
| US-B4 | As a **Consultant**, I want to open an article and use Prev/Next and “Go to” number so that I can jump to any Article or Recital without going back to the list. | Consultant |
| US-B5 | As a **Legal/Compliance** user, I want to export the current article or recital as PDF so that I can attach it to memos or store offline. | Legal/Compliance |
| US-B6 | As a **Stakeholder**, I want to see citation links (GDPR-Info, EUR-Lex) on every detail view so that I can verify against official sources. | Stakeholder |
| US-B7 | As a **General Professional**, I want to click “Back to question” when I opened a document from Ask so that I can return to my search results. | General Professional |

---

## Epic 2: Ask a question

| ID | Story | Persona |
|----|--------|---------|
| US-A1 | As a **DPO**, I want to type a question and receive an answer that is **grounded in retrieved regulation (and optional web) sources** with `[S1]`-style citations so that I can trace every claim. | DPO |
| US-A2 | As a **Consultant**, I want to see which **LLM path** was used (Groq, Tavily, or extractive) so that I can judge how much to rely on synthesis versus opening full text. | Consultant |
| US-A3 | As a **Legal/Compliance** user, I want a **Relevant provisions** list (labeled per regulation) with “View in app” so that I can open the full article or recital without re-searching. | Legal/Compliance |
| US-A11 | As an **AI governance** user, I want Ask answers to cite **AI Act articles** when I have EU AI Act selected so that obligations map to Regulation (EU) 2024/1689. | AI governance |
| US-A4 | As a **General Professional**, I want each new question to clear the previous answer and panels so that I only see output for the current question. | General Professional |
| US-A5 | As a **DPO**, I want to see **content as of** / freshness information when available so that I know which consolidated version underlies the corpus. | DPO |
| US-A6 | As an **Industry specialist**, I want to pick my **sector** in the Ask UI so that the answer explicitly reflects that industry’s context while staying within cited GDPR text. | Industry specialist |
| US-A7 | As a **Legal/Compliance** user, I want citation chips in the answer to be **clickable** so that I can jump to the Article or Recital in Browse. | Legal/Compliance |
| US-A8 | As **Engineering / DevOps**, I want to supply my own **Groq** and **Tavily** API keys in the browser so that I can use Ask without changing server `.env` or redeploying. | Engineering / DevOps |
| US-A9 | As a **Consultant**, I want to **validate** my API keys before saving so that I know they work before asking a question. | Consultant |
| US-A10 | As a **DPO**, I want the Ask tab to show whether **server** or **my own** keys are active so that I understand who is billed for LLM usage. | DPO |

---

## Epic 3: Credible sources

| ID | Story | Persona |
|----|--------|---------|
| US-S1 | As a **DPO**, I want one tab listing all credible organizations (GDPR-Info, EUR-Lex, EDPB, ICO, Commission, GDPR.eu, Council of Europe) with document links so that I can bookmark or share official pages. | DPO |
| US-S2 | As a **Stakeholder**, I want to open Credible sources and see short descriptions per organization so that I understand the role of each source. | Stakeholder |
| US-S3 | As an **AI governance** user, I want Credible sources to list **AI Act Law, EUR-Lex 2024/1689, and Commission AI policy** when EU AI Act is selected so that I have the right official links in one place. | AI governance |

---

## Epic 4: News

| ID | Story | Persona |
|----|--------|---------|
| US-N1 | As a **DPO**, I want a News tab with GDPR/data protection updates from **EDPB, EDPS, ICO (UK), European Commission,** and **Council of Europe** so that I have one place to stay updated. | DPO |
| US-N2 | As a **Legal/Compliance** user, I want news grouped by source with a short summary per source so that I can scan by organization. | Legal/Compliance |
| US-N3 | As a **DPO**, I want to filter news by Source and Topic so that I can focus on e.g. enforcement or guidance. | DPO |
| US-N4 | As a **Consultant**, I want each news item to link to the original article so that I can read the full story on the publisher’s site. | Consultant |
| US-N5 | As a **DPO**, I want to click “Refresh news” to run a **server refresh** that merges crawled items and updates the cached news file so that I get durable, current updates. | DPO |
| US-N6 | As a **Legal/Compliance** user, I want **duplicate stories** (same item linked from different URLs) **collapsed into one card** so that my scan list is not noisy. | Legal/Compliance |
| US-N7 | As a **DPO**, I want **Quick filters** to appear in the **sidebar when I scroll** past the main news filters (on desktop) so that I can change source/topic without scrolling back up. | DPO |
| US-N8 | As a **Consultant**, I want to **collapse “Official site & RSS”** when I need more room in the sidebar, with my choice remembered for the session. | Consultant |
| US-N9 | As **Engineering / DevOps**, I want to **tune news crawl depth and merge caps** via documented **`NEWS_*`** environment variables so that we can balance freshness, runtime, and API payload size without forking the crawler. | Engineering / DevOps |
| US-N10 | As a **Legal/Compliance** user, I want to switch between a **By source** view and an **All sources** chronological feed so that I can scan either by organization or by time. | Legal/Compliance |
| US-N11 | As a **DPO**, I want the **Attachments** action to appear only when a news article page actually links downloadable files so that the UI stays clean and predictable. | DPO |
| US-N12 | As an **AI governance** user, I want News to show an **AI Act relevance filter and banner** when EU AI Act is selected so that I see AI governance headlines without assuming a separate AI-only wire service. | AI governance |

---

## Epic 5: Content refresh

| ID | Story | Persona |
|----|--------|---------|
| US-ETL1 | As a **Legal/Compliance** user, I want to click **“Refresh sources”** to run ETL for the **selected regulation** (GDPR-Info/EUR-Lex or AI Act Law) so that I work with an up-to-date consolidated corpus. | Legal/Compliance |
| US-ETL2 | As a **DPO**, I want to see **content as of** / **last checked** freshness metadata so that I know how current the regulation text is. | DPO |
| US-ETL3 | As **Engineering / DevOps**, I want **`npm run refresh-ai-act`** and Vercel cron to refresh **both** corpora so that production stays current without manual CLI per regulation. | Engineering / DevOps |
| US-ETL4 | As a **Legal/Compliance** user, I want **chapter introduction blurbs** per regulation when browsing chapters so that I understand each chapter’s scope before opening articles. | Legal/Compliance |
| US-ETL5 | As **Engineering / DevOps**, I want every GDPR refresh to run **document formatting guardrails** and return **`formattingGuardrails`** so that I can confirm validation in logs or API responses. | Engineering / DevOps |
| US-ETL6 | As a **Legal/Compliance** user, I want the app to **reload** browse lists and the open document after refresh so that I see normalized text without a full browser reload. | Legal/Compliance |
| US-ETL7 | As **Engineering / DevOps**, I want **`GDPR_FORCE_CORPUS_WRITE`** / **`AI_ACT_FORCE_CORPUS_WRITE`** to force disk writes when hashes match so that guardrail-only updates still persist. | Engineering / DevOps |

---

## Epic 6: Homepage and navigation

| ID | Story | Persona |
|----|--------|---------|
| US-H1 | As any user, I want to click the **EU Regulation Q&A Platform** logo to go to the homepage so that I can start over from a clean Browse view. | All |
| US-H2 | As a **General Professional**, I want the homepage to show the initial placeholder and the sidebar “Regulation & sources” without a loaded chapter list so that the state is clearly “home.” | General Professional |
| US-H3 | As any user, I want to switch between Browse, Ask, Credible sources, and News with clear tab state so that I always know where I am. | All |

---

## Epic 7: Export and citations

| ID | Story | Persona |
|----|--------|---------|
| US-E1 | As a **Consultant**, I want to export the currently viewed article or recital as PDF so that I can attach it to client deliverables. | Consultant |
| US-E2 | As a **Stakeholder**, I want every detail view to show “Citations & official links” so that I can verify the text. | Stakeholder |

---

## Epic 8: Accessibility and UX

| ID | Story | Persona |
|----|--------|---------|
| US-U1 | As any user, I want tabs and panels to use proper roles and aria-selected so that I can use the app with assistive technology. | All |
| US-U2 | As any user, I want to use Enter in the “Go to” number input to jump to the document so that I can navigate with the keyboard. | All |

---

## Epic 9: Cross-references and corpus quality

| ID | Story | Persona |
|----|--------|---------|
| US-X1 | As a **Legal/Compliance** user, I want **related recitals** suggested when I read an article so that I see interpretive context alongside binding text. | Legal/Compliance |
| US-X2 | As a **Stakeholder**, I want **related articles** listed when I read a recital so that I can jump to operative provisions. | Stakeholder |

---

## Epic 10: Documentation and compliance artifacts

| ID | Story | Persona |
|----|--------|---------|
| US-D1 | As **Engineering / DevOps**, I want a single **variables** document with formulas and examples so that I can configure deployments without reading the entire codebase. | Engineering / DevOps |
| US-D2 | As a **product owner**, I want a **traceability matrix** linking business requirements to PRD ids and code so that audits and release reviews are efficient. | Product (proxy) |

---

## Acceptance criteria (representative)

| Story ID | Given | When | Then |
|----------|-------|------|------|
| US-R1 | EU AI Act is selected | User opens Browse → Chapters | Article list shows up to **113** articles; headings use **AI Act Law** links |
| US-R4 | User switches regulation | User opens Ask tab | Title, placeholder, and relevant-provisions label match active regulation |
| US-A11 | EU AI Act selected | User asks about high-risk AI systems | Answer cites AI Act articles in `sources`; chips open AI Act Browse |
| US-S3 | EU AI Act selected | User opens Credible sources | Cards include AI Act Law, EUR-Lex 2024/1689, Commission AI framework |
| US-N12 | EU AI Act selected | User opens News | Banner visible; list filtered to AI-relevant items; status explains filter |
| US-A8 | User enters Groq key in BYOK | User clicks Check validity | `POST /api/validate-api-keys` returns `valid: true` for Groq without persisting key |
| US-ETL1 | GDPR selected | User clicks Refresh sources | Only `gdpr-content.json` mtime changes; AI Act file unchanged |

Full verification steps: [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## Reference

- **Personas:** [USER_PERSONAS.md](USER_PERSONAS.md)  
- **PRD:** [PRD.md](PRD.md)  
- **Full documentation:** [README.md](../README.md)  
- **Product documentation standard:** [PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)  
- **Variables & diagrams:** [VARIABLES.md](VARIABLES.md)  
- **Sample JSON:** [DATA_SCHEMA_EXAMPLES.md](DATA_SCHEMA_EXAMPLES.md)  
- **API contracts:** [API_CONTRACTS.md](API_CONTRACTS.md)  
- **Traceability:** [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)
