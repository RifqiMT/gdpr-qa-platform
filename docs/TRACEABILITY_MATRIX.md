# Traceability matrix  
## EU Regulation Q&A Platform

**Version:** 1.7 · **Last updated:** 2026-05-19 · Documentation standard **v2.2** · Product **1.2.4**

Enterprise-style traceability: **business intent** → **requirements** → **implementation** → **verification**. Maintained with [PRD](PRD.md) and [USER_STORIES](USER_STORIES.md).

**Legend**

| Column | Meaning |
|--------|---------|
| **BR** | Business requirement (outcome) |
| **PRD** | Requirement id in PRD.md |
| **Story** | User story id in USER_STORIES.md |
| **Implementation** | Primary code or data artifact |
| **Verification** | How to confirm |

---

## Regulation selection (multi-regulation)

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-R-01 | User selects GDPR, EU AI Act, or EU Data Act | FR-REG-01 | US-R1, US-R5 | `#regulationSelect`, `GET /api/regulations`, `lib/regulations.js` | Switch shows 50 articles for Data Act |
| BR-R-02 | Selection persists across sessions | FR-REG-02 | US-R2 | `gdpr-qa-regulation-v1`, `setCurrentRegulation` | Reload page; selection retained |
| BR-R-03 | Refresh updates active regulation only | FR-REG-04 | US-R3, US-ETL1 | `POST /api/refresh`, `runRegulationScraperAndReloadContent` | Refresh with AI Act does not alter GDPR JSON |
| BR-R-04 | UI copy follows regulation | FR-REG-05, FR-REG-06 | US-R4, US-R6 | `regulation-profiles.js`, `syncAskSourcesNewsChrome`, `syncCitationSidebarChrome` | Ask title and citation sidebar say “EU AI Act” / AI Act Law when selected |

---

## App shell and responsive chrome

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-S-01 | Mobile/tablet user can open header tools without cramped icon-only row | FR-SHELL-02, FR-SHELL-03 | US-S1 | `#headerActionsToggle`, `.header-toolbar`, `.header-regulation` | ≤899px: Tools opens 1-column grid; regulation full width |
| BR-S-02 | User sees corpus freshness at a glance before opening tooltip | FR-SHELL-05 | US-S2 | `syncHeaderToolbarStatus`, `#headerFreshnessHint`, `#btnFreshnessInfo` | Toolbar subtitle shows refresh dates; tooltip has full detail |
| BR-S-03 | User configures API keys from header without duplicate status cards | FR-SHELL-05, FR-SHELL-06 | US-S3 | `#btnByokSettings`, `#askLlmKeysStatus` (Ask only) | No `#headerStatusStrip`; keys dialog + Ask line only |
| BR-S-04 | Reader uses remaining viewport under sticky chrome | FR-SHELL-04 | US-S4 | `#appChrome`, `ResizeObserver`, `--app-chrome-height` | Browse article scroll not hidden under chrome on phone |
| BR-S-05 | News intro does not consume entire mobile screen | FR-NEWS-07 | US-N14 | `#newsHero`, `initNewsHeroDetails`, `.news-detail-grid` | Hero collapsed by default; expand shows 1-column panels |

---

## Browse welcome and chapters filter reliability

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-W-01 | User sees all three regulations at a glance on desktop | FR-BRW-13 | US-W1 | `#browseWelcomeGrid`, `browseUi`, `initBrowseWelcomeGrid` | ≥900px: three themed cards visible |
| BR-W-02 | User opens chapters before recitals in welcome UI | FR-BRW-14 | US-W2 | `buildBrowseWelcomeCardHtml`, `#browseQuickChapters` primary | Chapters button is first / primary green |
| BR-W-03 | Data Act chapters list not falsely empty after GDPR filter use | FR-BRW-15 | US-W3 | `resetChaptersFilters`, `getChaptersFilterSubcategoryValue` | Switch GDPR→Data Act with “All” filters → articles show |
| BR-W-04 | Fast regulation switching does not show wrong corpus | FR-BRW-16 | US-W4 | `loadChaptersRequestId` | Rapid switch: list matches selected regulation |
| BR-W-05 | Mobile user can collapse chapter filters to see articles | FR-BRW-17 | US-W5 | `#chaptersFiltersToggle`, `#chaptersFiltersPanel` | ≤899px: Filters collapsed by default; expand works |

---

## Browse and regulation reading

| BR-ID | Business requirement | PRD | Story | Implementation | Verification |
|-------|---------------------|-----|-------|----------------|--------------|
| BR-B-01 | User reads recitals in app with official links | FR-B2 | US-B2 | `public/app.js` (recitals list, `openRecital`), `GET /api/recitals` | Open Recital 1; citations panel shows active site + EUR-Lex |
| BR-B-02 | User filters Articles by category, topic, chapter, number | FR-B3 | US-B3 | `ARTICLE_TOPICS`, `applyChaptersFilters`, `GET /api/chapters`, `/api/articles` | Filter to “Consent”; list matches |
| BR-B-03 | User navigates Prev/Next/Go between documents | FR-B4 | US-B4 | `docNav`, `goToDocNumber`, `updateDocNav` | Jump Article 17 → 18; keyboard Enter on Go |
| BR-B-04 | User exports current provision as PDF | FR-B6 | US-B5, US-E1 | `html2pdf.js`, `#pdfPrintMount`, print CSS | Export produces multi-page PDF without clipped paragraphs |
| BR-B-05 | User returns from Ask via “Back to question” | FR-B5 | US-B7 | `cameFromAsk`, `btnBackToQuestion` | Ask → View in app → Back to question |
| BR-B-06 | Homepage reset via logo | FR-B7, FR-H1 | US-H1, US-H2 | `goToHome`, `#logoLink` | Logo click shows placeholder; sidebar reset |
| BR-B-07 | Related articles/recitals cross-links | FR-B2 (extended) | US-B2 | `gdpr-crossrefs.js`, `GET /api/articles/:n` `suitableRecitals`, `/api/recitals/:n` `suitableArticles` | Open Article 6; related recitals non-empty when data present |
| BR-B-08 | Article titles match active regulation corpus | FR-BRW-09 | US-B10 | `getArticleDisplayTitle()`, `CANONICAL_ARTICLE_TITLES` (GDPR only) | Data Act Art. 10 shows “Dispute settlement”, not GDPR Art. 10 title |
| BR-B-09 | Recital titles readable and regulation-agnostic | FR-BRW-10 | US-B11 | `getRecitalDisplayTitle()`, `parseRecitalTopicTitle` | Recital card and reader H2 match `*-content.json` title |
| BR-B-10 | AI Act / Data Act body matches source paragraph structure | FR-BRW-11 | US-B12 | `scraper.js`, `joinBodyLines`, `document-formatting-guardrails`, `renderManualNumberedParagraphs` | Art. 6 AI Act shows `1.`/`2.` and `(a)`–`(c)` sublists |
| BR-B-11 | Citation sidebar labels match active regulation | FR-BRW-12, FR-REG-06 | US-B13, US-R6 | `citationsUi`, `syncCitationSidebarChrome`, `index.html` panel IDs | Data Act selected → “Related Data Act articles”, Data Act Law link |
| BR-B-12 | Long official article titles display in reader | FR-BRW-09 | US-B10 | `getArticleDisplayTitle()` (no 120-char cap for non-GDPR) | Data Act Art. 4 shows full title, not “Article 4” |

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
| BR-A-07 | User supplies own LLM API keys (BYOK) | FR-A10, FR-A12 | US-A8 | `BYOK_STORAGE_KEY`, `withByokApiKeys`, `resolveLlmKeys` in `server.js` | Enable BYOK; Ask uses client keys; `llm.byokGroq` true |
| BR-A-08 | User validates API keys before use | FR-A11 | US-A9 | `POST /api/validate-api-keys`, `renderByokValidationResults` | Check validity → Groq/Tavily valid cards |
| BR-A-09 | Ask UI shows server vs BYOK key state | FR-A10 | US-A10 | `updateAskLlmKeysStatus`, `GET /api/meta` server flags | Status line reflects BYOK or server keys |
| BR-A-10 | AI Act Ask uses AI Act corpus and prompts | FR-ASK-02 | US-A11 | `regulationSearchContext`, `buildAnswerPrompt(reg)`, `ai-act-content.json` | Ask with `regulation=ai-act` cites Art. 6+ |
| BR-AI-N01 | AI Act news filter in UI | FR-NEWS-05, FR-NEWS-07 | US-N12 | `itemMatchesNewsRegulationScope`, `newsUi`, `#newsScopeCard` | AI Act selected → fewer news cards + filtered scope card in hero |
| BR-DA-01 | Data Act Ask uses Data Act corpus | FR-ETL-02b, FR-ASK-02 | US-A12 | `data-act-content.json`, `regulationSearchContext` | Ask with `regulation=data-act` cites Data Act articles |
| BR-DA-02 | Data Act credible sources | FR-SRC-01 | US-S4 | `data-act-structure.json`, `GET /api/meta?regulation=data-act` | Three source cards for Data Act |
| BR-DA-N01 | Data Act news filter in UI | FR-NEWS-05, FR-NEWS-07 | US-N13 | `DATA_ACT_NEWS_SCOPE_RE`, `newsUi`, `#newsScopeCard` | Data Act selected → filtered list + scope card in hero |
| BR-SH-01 | Maintainer attribution bar | FR-SHELL-07 | US-H4 | `app-credits` in `index.html`, `styles.css` | Footer shows name + LinkedIn + website icons |

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
