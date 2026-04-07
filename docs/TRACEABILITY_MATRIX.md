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
| BR-N-05 | Duplicate-free news list | FR-S5 | US-N6 | `dedupeNewsItemsConsolidated` in `news-crawler.js` / `server.js`; `dedupeNewsItemsClient` + `public/news-dedupe.js` | Same story under two URLs shows once after load |
| BR-N-06 | Usable filters while scrolling (desktop) | FR-S7 | US-N7 | `IntersectionObserver` on `#newsControlsPanel`, `news-controls-panel--dock-visible`, sidebar Quick filters sync | Scroll past toolbar; sidebar filters still work and match main |
| BR-N-07 | Fresh news API payload | FR-S6 | — | `GET /api/news` sets `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache` | Response headers in DevTools; hard refresh not required for merge changes |
| BR-N-08 | Compact sidebar feed list | FR-S8 | US-N8 | `#newsFeedsSectionToggle`, `newsFeedsSectionPanel`, `gdpr_news_feeds_section_collapsed` | Collapse feeds; state survives tab switch within session |
| BR-N-09 | Broad supervisory and official news coverage | FR-S2 (rev) | US-N1 | `news-crawler.js` (`crawlNews`, `crawlCommissionPress`, EDPS/EDPB/ICO/CoE paths), `news-topics.js` | After **Refresh news**, sections appear for configured sources (EU-level + ICO UK + CoE; no other national DPAs) |
| BR-N-10 | Topic labels on news cards | FR-S2 | US-N3 | `news-topics.js` (`assignNewsTopicFields`, `getTopicTaxonomyForClient`), `GET /api/news` `topicTaxonomy` | Topic filter optgroups match taxonomy; cards show non-fallback topic when classified |
| BR-N-11 | Operator-tunable news volume | FR-S9 | US-N9 | `news-crawler.js` (`NEWS_MAX_*`, `NEWS_COMMISSION_*`), `server.js` (`NEWS_MERGE_CAP`, `storeCap`) | Changing env changes crawl depth or API cap without code edit |
| BR-N-12 | User can switch between grouped and blended news layouts | FR-S2 (rev) | US-N2 | `public/index.html` (view toggle buttons), `public/app.js` (`newsViewMode`, `renderNewsAllCards`) | Toggle “By source” ↔ “All”; cards remain visually consistent; “All” is sorted newest-first |
| BR-N-13 | Attachments control shown only when files exist | FR-S2 (rev) | US-N4 | `POST /api/news/attachments-summary`, `public/app.js` (`shouldShowNewsAttachmentsButton`) | For a URL with `count=0`, no Attachments button is rendered; for `count>0`, button opens dialog |

---

## Content pipeline

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-R-01 | Manual refresh of regulation | FR-R1 | US-R1 | `POST /api/refresh`, `scraper.js` | `gdpr-content.json` updates; `meta.etl` reflects run |
| BR-R-02 | Scheduled refresh | FR-R2 | US-R2 | `node-cron` → `runRegulationScraperAndReloadContent` in `server.js` | Log “Daily GDPR content refresh completed.” |
| BR-R-03 | Initial refresh if no cache | FR-R3 | — | `server.listen` callback | First start without JSON triggers ETL + `loadContent` |
| BR-R-04 | Chapter summaries | FR-R4 | US-R3 | `chapter-summaries.json`, `GET /api/chapter-summaries`, `POST /api/chapter-summaries/regenerate` | API returns 11 chapters |
| BR-R-05 | Document formatting on every write | FR-R7 | US-R4 | `document-formatting-guardrails.js` `normalizeCorpus` in `scraper.js` | `formattingGuardrails` on refresh; console report |
| BR-R-06 | Server cache coherent after ETL | FR-R8 | US-R5 | `invalidateRegulationContentCache`, `runRegulationScraperAndReloadContent` | `GET /api/articles/1` matches disk after refresh |
| BR-R-07 | Optional force write | — | US-R6 | `GDPR_FORCE_CORPUS_WRITE` / `GDPR_FORCE_RELOAD_CORPUS` | Hash unchanged still writes when env set |

---

## Non-functional and compliance

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-NF-01 | Node ≥18, no build step | NFR-1–3 | — | `package.json`, `public/*` static | `npm start` only |
| BR-NF-02 | Accessibility for tabs and filters | NFR-5 | US-U1, US-U2 | ARIA on `index.html`, keyboard handlers | axe / manual keyboard pass |
| BR-NF-03 | No legal advice positioning | Out of scope + README | — | Footer disclaimer | Copy present |
| BR-NF-04 | Document formatting contract | NFR-7 | US-R4 | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md), `document-formatting-guardrails.js` | Post-refresh checklist + `formattingGuardrails.ok` |

---

## Documentation and configuration

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-D-01 | Central variable dictionary with relationships | — | US-D1 | [VARIABLES.md](VARIABLES.md), [.env.example](../.env.example) | New env var documented in §1 + README §10 |
| BR-D-02 | Enterprise traceability for releases | — | US-D2 | [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Matrix row exists for each Must requirement |

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
