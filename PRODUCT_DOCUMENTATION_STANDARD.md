# Product Documentation Standard

This document defines the **product documentation standard** for the GDPR Q&A Platform. The full content for each section lives in [README.md](README.md) or in the linked docs. Use this as a checklist and index.

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Main product documentation: overview, benefits, features, logics, business/tech guidelines, tech stack, folder directory, API summary, configuration, limitations. |
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document: goals, user needs, functional/non-functional requirements, data model summary, success criteria, out of scope. |
| [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) | User personas: Legal/Compliance, Privacy Officer, DPO, Consultant, General Professional; goals, pain points, needs. |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | User stories by epic (Browse, Ask, Sources, News, Refresh, Homepage, Export, Accessibility). |

---

## 1. Overview

**Location:** [README §1 – Product overview](README.md#1-product-overview)

| Element | Description |
|--------|--------------|
| **Purpose** | Browse and search the full text of the General Data Protection Regulation (EU) 2016/679 with citations and links to official EU sources; optional LLM summaries; Credible sources tab; News from EDPB, ICO, Commission, Council of Europe. |
| **Target users** | Legal, compliance, privacy professionals and anyone needing quick, sourced GDPR answers and updates. |
| **Key concepts** | Recitals 1–173, Articles 1–99, Browse (sidebar, filters, doc nav), Ask (search, Relevant articles, Summary), Credible sources, News (by source/topic), Refresh sources, Homepage (logo link). |
| **High-level flow** | Open app → Browse regulation or Ask a question → View in app from Ask → Credible sources / News → Refresh sources to update regulation text. |

---

## 2. Product benefits

**Location:** [README §2 – Product benefits](README.md#2-product-benefits)

Single source of truth, traceability to Articles/Recitals, reduced hallucination (verbatim + optional LLM constrained to text), data refresh without duplication, efficiency (browse or ask, jump to provision), offline-capable content after refresh, PDF export, topic-based drill-down, centered chapter headers, document navigation (Prev/Next/Go), Relevant articles & documents panel, news from credible sources with filters and three-paragraph summaries, Credible sources hub.

---

## 3. Features

**Location:** [README §3 – Features](README.md#3-features)

| Area | Contents |
|------|----------|
| **Browse regulation** | Sidebar (Recitals, Chapters & Articles, Credible sources); filter bar (Category, Sub-category, Chapter, Article); recitals/chapters list; detail view with doc nav (Prev/Next/Go) and Export PDF; Back / Back to question; citations. |
| **Ask a question** | Search input; results (Question/Answer block, Relevant articles & documents, result cards); Summary panel (LLM or extractive); View in app; content as of date. |
| **Credible sources** | Sources tab with organizations and document links from `/api/meta`. |
| **Content refresh** | Refresh sources button; daily cron (02:00 Europe/Brussels); optional initial refresh on start. |
| **News** | News tab; grouping by source; three-paragraph summaries; topic tags; filters (Source, Topic); Refresh news. |
| **Optional LLM summaries** | Provider order (Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter); fallbacks (extractive / client-side). |
| **Homepage** | Click “GDPR Q&A Platform” logo to go to homepage: Browse tab with initial placeholder; sidebar “Regulation & sources” reset (no chapter list). |

---

## 4. Logics (and data model)

**Location:** [README §4 – Logic and data flow](README.md#4-logic-and-data-flow)

| Element | Description |
|--------|--------------|
| **Data files** | gdpr-structure.json (static structure); gdpr-content.json (recitals, articles, searchIndex, meta); gdpr-news.json (newsFeeds, items). |
| **Scraper** | EUR-Lex fetch; parse recitals/articles; merge with existing by number (last wins); buildSearchIndex (dedupe by id). |
| **Sub-categories** | ARTICLE_TOPICS in app.js; getArticleTopicIds; filter bar Category/Chapter synced; Sub-category filled from topics in selected chapter. |
| **News crawler** | EDPB RSS/HTML, ICO HTML; timeout; merge in server with static items; dedupe by URL; sort by date; cap 60. |
| **Search** | simpleSearch (tokenize, score title +2, top 25); /api/ask returns full-text excerpts; /api/summarize LLM or extractive. |
| **Homepage** | goToHome(): switch to Browse tab, show placeholder, hide all browse sections, clear chapterList, hide Back/Export/Back to question. |

---

## 5. Business guidelines

**Location:** [README §5 – Business guidelines](README.md#5-business-guidelines)

Use for reference only; verify against EUR-Lex and GDPR-Info. No legal advice. Credible sources only for answers and news. Attribution in footer and UI; links to originals must remain.

---

## 6. Tech guidelines

**Location:** [README §6 – Tech guidelines](README.md#6-tech-guidelines)

| Element | Description |
|--------|--------------|
| **Tech stack** | Node.js ≥18, Express, CORS, scraper (axios/cheerio or https), news-crawler (axios, cheerio), vanilla HTML/CSS/JS, html2pdf.js, optional LLM (fetch only). |
| **Technical guidelines** | No build step; data/ writable; gdpr-structure.json required for scraper; CORS enabled; cron optional; accessibility (tabs, aria, keyboard). |

---

## 7. Tech stacks (summary)

**Location:** [README §7 – Tech stack](README.md#7-tech-stack)

Runtime Node.js ≥18; backend Express, node-cron; scraping axios/cheerio; frontend HTML5, CSS3, vanilla JS; fonts DM Sans, DM Serif Text; PDF export html2pdf.js; optional LLM (OpenAI, Anthropic, Gemini, Groq, Mistral, OpenRouter); data JSON files in data/.

---

## 8. Other important elements

| Element | Location |
|--------|----------|
| **Prerequisites and requirements** | README §2 (Users, Content, Deployment); Node ≥18, data/ writable. |
| **Getting started** | README §11 – Quick start (install, npm start, open localhost:3847, Refresh sources). |
| **Folder directory and file roles** | README §8 – Project structure (server.js, scraper.js, news-crawler.js, public/, data/, .env.example). |
| **API reference** | README §9 – API reference (GET/POST routes: meta, news, categories, chapters, articles, recitals, ask, summarize, refresh). |
| **Configuration** | README §10 – Environment variables (PORT, LLM keys, LLM_PROVIDER), Scripts (start, refresh). |
| **Limitations and disclaimer** | README §12 – Reference only; verify with official sources; no legal advice. |
| **PRD (requirements)** | [docs/PRD.md](docs/PRD.md) – Functional/non-functional requirements, success criteria, out of scope. |
| **User personas** | [docs/USER_PERSONAS.md](docs/USER_PERSONAS.md) – Personas with goals, pain points, needs. |
| **User stories** | [docs/USER_STORIES.md](docs/USER_STORIES.md) – Stories by epic with persona and benefit. |

---

## Quick reference: README table of contents

1. Product overview  
2. Product benefits  
3. Features  
4. Logic and data flow  
5. Business guidelines  
6. Tech guidelines  
7. Tech stack  
8. Project structure  
9. API reference (summary)  
10. Configuration  
11. Quick start  
12. License and disclaimer  

**Related docs:** [README.md](README.md) · [PRD.md](docs/PRD.md) · [USER_PERSONAS.md](docs/USER_PERSONAS.md) · [USER_STORIES.md](docs/USER_STORIES.md)
