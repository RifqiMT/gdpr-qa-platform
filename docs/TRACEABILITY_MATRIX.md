# Traceability matrix  
## GDPR Q&A Platform

Enterprise-style traceability links **business intent** → **requirements** → **implementation** → **verification**. This matrix is maintained alongside the [PRD](PRD.md) and [USER_STORIES](USER_STORIES.md).

**Legend**

| Column | Meaning |
|--------|---------|
| **BR** | Business requirement (outcome) |
| **PRD** | Requirement id in PRD.md |
| **Story** | User story id in USER_STORIES.md |
| **Implementation** | Primary code or data artifact |
| **Verification** | How to confirm |

---

## Browse and regulation reading

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-B-01 | User reads Recitals 1–173 in app with official links | FR-B2 | US-B2 | `public/app.js` (recitals list, `openRecital`), `GET /api/recitals` | Open Recital 1; citations panel shows GDPR-Info/EUR-Lex |
| BR-B-02 | User filters Articles by category, topic, chapter, number | FR-B3 | US-B3 | `ARTICLE_TOPICS`, `applyChaptersFilters`, `GET /api/chapters`, `/api/articles` | Filter to “Consent”; list matches |
| BR-B-03 | User navigates Prev/Next/Go between documents | FR-B4 | US-B4 | `docNav`, `goToDocNumber`, `updateDocNav` | Jump Article 17 → 18; keyboard Enter on Go |
| BR-B-04 | User exports current provision as PDF | FR-B6 | US-B5, US-E1 | `html2pdf.js`, `#pdfPrintMount`, print CSS | Export produces multi-page PDF without clipped paragraphs |
| BR-B-05 | User returns from Ask via “Back to question” | FR-B5 | US-B7 | `cameFromAsk`, `btnBackToQuestion` | Ask → View in app → Back to question |
| BR-B-06 | Homepage reset via logo | FR-B7, FR-H1 | US-H1, US-H2 | `goToHome`, `#logoLink` | Logo click shows placeholder; sidebar reset |
| BR-B-07 | Related articles/recitals cross-links | FR-B2 (extended) | US-B2 | `gdpr-crossrefs.js`, `GET /api/articles/:n` `suitableRecitals`, `/api/recitals/:n` `suitableArticles` | Open Article 6; related recitals non-empty when data present |

---

## Ask (grounded Q&A)

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-A-01 | User submits question and receives grounded answer | FR-A1 (rev) | US-A1 | `POST /api/answer`, `doAsk` in `app.js` | Ask returns answer + sources |
| BR-A-02 | Answer cites numbered sources [S1]… | FR-A1 | US-A1 | `buildAnswerPrompt`, `formatAnswerHtml`, citation repair | Chips link to provisions |
| BR-A-03 | Optional industry sector framing | FR-A6 | US-A6 | `industry-sectors.json`, `resolveIndustrySector`, Ask combobox | Select sector; answer names verbatim phrase |
| BR-A-04 | Relevant provisions list with View in app | FR-A2 | US-A3 | `renderRelevantProvisionsFromAnswer` | List matches regulation sources |
| BR-A-05 | LLM provider visibility | NFR-6 | US-A5 | `askAnswerStatus` chip from `llm` object | Shows Groq/Tavily/Extractive |
| BR-A-06 | Content freshness visible | FR-A5 | US-A5 | `contentAsOf` in responses, freshness tooltip | Tooltip shows last refreshed |

---

## Credible sources and news

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-S-01 | Curated source list with documents | FR-S1 | US-S1 | `GET /api/meta` `sources`, `loadSources` | Sources tab renders all orgs |
| BR-N-01 | News from defined authorities | FR-S2 | US-N1 | `news-crawler.js`, `DEFAULT_NEWS_FEEDS`, `gdpr-news.json` | News sections per source |
| BR-N-02 | Filter by source and topic | FR-S3 | US-N3 | `populateNewsFilters`, `applyNewsFilters` | Filters narrow cards |
| BR-N-03 | Refresh news persists merge | FR-S4 | US-N5 | `POST /api/news/refresh` | File updated; UI reloads |
| BR-N-04 | Original article traceability | FR-S2 | US-N4 | Card title links to publisher URL | External link opens |

---

## Content pipeline

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-R-01 | Manual refresh of regulation | FR-R1 | US-R1 | `POST /api/refresh`, `scraper.js` | `gdpr-content.json` updates `lastRefreshed` |
| BR-R-02 | Scheduled refresh | FR-R2 | US-R2 | `node-cron` in `server.js` | Log “Daily GDPR content refresh” |
| BR-R-03 | Initial refresh if no cache | FR-R3 | — | `server.listen` callback | First start without JSON triggers scrape |
| BR-R-04 | Chapter summaries | FR-R4 | US-R3 | `chapter-summaries.json`, `GET /api/chapter-summaries`, `POST /api/chapter-summaries/regenerate` | API returns 11 chapters |

---

## Non-functional and compliance

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-NF-01 | Node ≥18, no build step | NFR-1–3 | — | `package.json`, `public/*` static | `npm start` only |
| BR-NF-02 | Accessibility for tabs and filters | NFR-5 | US-U1, US-U2 | ARIA on `index.html`, keyboard handlers | axe / manual keyboard pass |
| BR-NF-03 | No legal advice positioning | Out of scope + README | — | Footer disclaimer | Copy present |
| BR-NF-04 | Document formatting contract | — | — | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) | Post-refresh checklist |

---

## Change control

When adding a feature:

1. Add or update a row in this matrix.  
2. Add PRD id and user story id.  
3. Link implementation files in the PR.  
4. Record verification steps in test notes or QA checklist.

---

## References

- [PRD.md](PRD.md)  
- [USER_STORIES.md](USER_STORIES.md)  
- [README.md](../README.md)
