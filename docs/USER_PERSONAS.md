# User Personas  
## GDPR Q&A Platform

Personas represent primary users of the platform. They inform features, user stories, and documentation.

---

## Persona 1: Legal / Compliance Professional (Primary)

| Attribute | Description |
|-----------|-------------|
| **Name** | Alex (Legal / Compliance) |
| **Role** | In-house counsel or compliance officer; needs to check GDPR provisions and cite them accurately. |
| **Goals** | Find the right Article or Recital quickly, get verbatim text for memos or policies, cite official sources (EUR-Lex, GDPR-Info), avoid unsourced or wrong interpretations. |
| **Pain points** | Scrolling through long PDFs; unclear which version of the regulation is current; no single place to search and browse with citations. |
| **Needs** | Browse by structure (Recitals, Chapters & Articles), filter by topic/chapter, ask natural-language questions and get sourced answers, export a provision as PDF, see “content as of” date. |
| **Tech context** | Uses browser daily; comfortable with a local or internal server; may need to work offline after content is refreshed. |
| **Relevant features** | Browse (sidebar, filters, doc nav), Ask (search, Relevant articles, View in app), Refresh sources, Export PDF, Credible sources, Homepage (logo). |

---

## Persona 2: Data Protection Officer (DPO)

| Attribute | Description |
|-----------|-------------|
| **Name** | Sam (DPO) |
| **Role** | Data Protection Officer; answers internal and external questions about GDPR and tracks supervisory guidance. |
| **Goals** | Answer “what does the regulation say?” with exact text and citations; stay updated on EDPB/ICO/Commission news; point colleagues to official sources. |
| **Pain points** | Repeating the same lookups; ensuring answers are from the regulation, not third-party summaries; keeping up with news from multiple sites. |
| **Needs** | Ask a question and get verbatim answer + optional summary; View in app to show full article/recital; News tab with filters by source/topic; Credible sources tab for quick links. |
| **Tech context** | Uses internal or local deployment; may configure LLM key for summaries; needs traceability for audit. |
| **Relevant features** | Ask (Question/Answer, Summary, Relevant articles & documents), News (by source, filters, three-paragraph summaries), Credible sources, Refresh sources. |

---

## Persona 3: Privacy / Legal Consultant

| Attribute | Description |
|-----------|-------------|
| **Name** | Jordan (Consultant) |
| **Role** | External consultant advising clients on GDPR compliance and documentation. |
| **Goals** | Prepare client-facing answers with exact regulation references; export a provision for appendices; avoid hallucination in any summary. |
| **Pain points** | Generic tools give unsourced or wrong answers; copying from EUR-Lex is manual; need to show “as of” date. |
| **Needs** | Ask with verbatim results and optional LLM summary (constrained to text); View in app and Export PDF; Credible sources for client handouts; clear attribution (EUR-Lex, GDPR-Info). |
| **Tech context** | Uses browser; may run app locally or on client server; cares about reproducibility of answers. |
| **Relevant features** | Ask (verbatim + summary), View in app, Export PDF, content as of date, Credible sources, Refresh sources. |

---

## Persona 4: General Professional (Developer / Product / Policy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Casey (General Professional) |
| **Role** | Developer, product manager, or policy person who occasionally needs to check GDPR wording. |
| **Goals** | Quick answer to “what does GDPR say about X?” without reading the full regulation; know where to verify (official links). |
| **Pain points** | Don’t know where to look; fear of citing wrong or outdated text; don’t want to install heavy tools. |
| **Needs** | Simple Ask flow; short summary + link to full text; Browse if they want to explore; Credible sources to bookmark official pages. |
| **Tech context** | Uses browser; prefers minimal setup (one URL); may use default extractive summary (no LLM key). |
| **Relevant features** | Ask (search, summary fallback, View in app), Browse (sidebar, filters), Credible sources, Homepage (logo to reset). |

---

## Persona 5: Stakeholder / Reviewer (Read-heavy)

| Attribute | Description |
|-----------|-------------|
| **Name** | Morgan (Stakeholder) |
| **Role** | Manager or auditor who reviews compliance materials and needs to verify references. |
| **Goals** | Check that cited Articles/Recitals match what the platform shows; open official links to confirm. |
| **Pain points** | Hard to verify citations without opening multiple sites; need a single place to see text and links. |
| **Needs** | Browse to specific Article/Recital; doc nav (Prev/Next/Go); citations panel with GDPR-Info and EUR-Lex; Credible sources for full list of official links. |
| **Tech context** | Uses same app as team; read-only usage; may export PDF for records. |
| **Relevant features** | Browse (doc nav, citations, Export PDF), Credible sources, Homepage (logo). |

---

## Summary matrix

| Persona              | Primary use                    | Key features                                              |
|----------------------|--------------------------------|-----------------------------------------------------------|
| Legal / Compliance   | Look up provisions, cite       | Browse, Ask, filters, doc nav, Export PDF, Refresh         |
| DPO                 | Answer questions, stay updated | Ask, Summary, Relevant articles, News, Credible sources    |
| Consultant           | Client-facing, sourced answers | Ask, verbatim + summary, Export PDF, Credible sources      |
| General Professional| Quick check                    | Ask, summary fallback, Browse, Credible sources, Homepage  |
| Stakeholder         | Verify references              | Browse, doc nav, citations, Export PDF, Credible sources  |

For user stories derived from these personas, see [USER_STORIES.md](USER_STORIES.md). For full product documentation, see [README.md](../README.md).
