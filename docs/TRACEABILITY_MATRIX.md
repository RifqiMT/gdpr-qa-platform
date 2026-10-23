# Traceability matrix  
## Regulation Q&A Platform

**Version:** 3.2 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23** · Thirteen instruments · `npm test` 58 pass / 24 suites

Enterprise-style mapping from **business rules → PRD → user stories → implementation → verification**.

| Column | Meaning |
|--------|---------|
| **BR** | Business / product rule id |
| **PRD** | Requirement id in [PRD.md](PRD.md) |
| **Stories** | [USER_STORIES.md](USER_STORIES.md) |
| **Implementation** | Primary code / config |
| **Verification** | How we know it works |

---

## Region and multi-regulation selection

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-R-01 Thirteen instruments selectable | FR-REG-01 | US-R-02 | `lib/regulations.js` `REGULATION_DISPLAY_ORDER`, `GET /api/regulations` | UI + API list length 13 |
| BR-R-02 Region filter | FR-SHELL-01, FR-REG-02 | US-R-01, US-R-06, US-I-08 | `public/app.js` region chrome (`REGION_IDS`, `catalogForRegion`, `defaultRegulationForRegion`); `styles.css` `data-region` thumb | Filter All / EU / Indonesia / USA / INTL; INTL → `iso-27701` |
| BR-R-03 Persistence | FR-SHELL-01, FR-REG-02 | US-R-03, US-R-07 | `localStorage` `gdpr-qa-regulation-v1`; `gdpr-qa-region-v1` ∈ `all\|eu\|id\|us\|intl` | Reload keeps selection and region |
| BR-R-04 Scoped APIs | FR-REG-03 | US-R-02 | `parseRegulationId`, `mergeRegulationBody` | Network tab `regulation=` |
| BR-R-05 Profile chrome | FR-REG-05/06 | US-R-04/05 | `regulation-profiles.js`, `regulation-profiles-id.js`, `regulation-profiles-us.js`, `regulation-profiles-iso.js` | Switch ID ↔ EU ↔ US ↔ INTL labels |

---

## Indonesian instruments

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-ID-01 UU PDP corpus | FR-ETL-02, FR-BRW-08 | US-B-08, US-E-02 | `id-law-scraper.js id-pdp`, `id-pdp-content.json` | Browse pasal; `npm test` |
| BR-ID-02 Satu Data corpus | FR-ETL-02 | US-B-08 | `id-satu-data-content.json` | Browse + Ask |
| BR-ID-03 AI Ethics soft law | FR-ASK-03, G6 | US-A-06 | Ask prompt framing; profiles | Manual Ask review |
| BR-ID-04 No GDPR sources fallback | FR-SRC-04 | US-C-02 | `GET /api/meta` fallback chain | Meta for `id-pdp` |
| BR-ID-05 Indo news | FR-NEWS-03/04/07 | US-N-02/03/04 | `news-crawler.js` Antara/Setkab/… | Refresh news |
| BR-ID-06 SEED includes ID corpora | FR-ETL-06 | US-E-05 | `lib/paths.js` `SEED_FILES` | Count = 41; cold start |
| BR-ID-07 Parity tests | NFR-07, EM-04 | US-Q-03 | `test/indo-parity.test.js` | `npm test` |

---

## United States instruments

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-US-01 CCPA/CPRA corpus | FR-US-01, FR-ETL-02b | US-J-01, US-B-09 | `us-law-scraper.js us-ccpa`, `data/us-ccpa-content.json` (33 / 5), `scripts/build-us-corpora.py` | Browse Civil Code sections; `test/us-parity.test.js` |
| BR-US-02 Colorado ADMT corpus | FR-US-01, FR-ETL-02b | US-J-02 | `us-law-scraper.js us-admt`, `data/us-admt-content.json` (14 / 5) | Browse + Ask; 1 Jan 2027 duties noted in copy |
| BR-US-03 OPEN Data corpus | FR-US-01, FR-US-03 | US-J-03 | `us-open-data-content.json` (10 / 4); registry `fullName` | `us-parity`: not the 2014 DATA Act |
| BR-US-04 No invented federal GDPR / AI Act | FR-US-02, FR-SRC-05, FR-ASK-03b | US-J-04, US-J-05, US-C-04, US-A-08 | Ask JURISDICTION prompt; `resolveCredibleSourcesForRegulation` (no GDPR fallback for `us-*`); BM25 US expansions | Meta + Ask for each `us-*`; `us-parity` sources test |
| BR-US-05 US news | FR-NEWS-03b, FR-NEWS-04, FR-NEWS-07, FR-US-04, FR-US-05 | US-J-06, US-N-02/03/04 | `crawlUnitedStatesOfficialNews`, `unitedStatesNewsItemIsOnScope`, `news-topics.js` (3 US groups), `DEFAULT_NEWS_FEEDS` | Refresh news; `us-parity` persisted-items test |
| BR-US-06 US ETL guard | FR-ETL-02b/02c, FR-ETL-07 | US-J-07, US-E-02 | `MIN_US_*`, `US_*_FORCE_CORPUS_WRITE`, npm `refresh-us-*` | `.env.example`; CLI run; `ETL incomplete` on floor breach |
| BR-US-07 SEED includes US corpora | FR-ETL-06 | US-E-05 | `lib/paths.js` `SEED_FILES` (41 files incl. 9 US) | Count = 41; cold start |
| BR-US-08 US labels and source blurbs | FR-BRW-10b, FR-US-07 | US-B-09, US-W-01 | `regulation-profiles-us.js` (`CCPA § N`, `Purpose note (N)`), `SOURCE_SUMMARIES` | `us-parity` UI blurbs test |
| BR-US-09 US themes | FR-US-06 | US-J-08 | `styles.css` `us-ccpa` / `us-open-data` / `us-admt` blocks | Visual: blue / teal / violet |
| BR-US-10 US parity tests | NFR-07, FR-US-08, EM-04 | US-Q-03 | `test/us-parity.test.js` | `npm test` |

---

## International instruments (voluntary standards — not laws)

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-INTL-01 ISO 27701 corpus | FR-INTL-01, FR-INTL-03, FR-ETL-02d | US-I-01 | `iso-soc-scraper.js iso-27701`, `data/iso-27701-content.json` (14 / 5), `scripts/build-iso-soc-corpora.js` | Browse clauses; `test/iso-parity.test.js` |
| BR-INTL-02 ISO 19941 corpus | FR-INTL-01, FR-INTL-04 | US-I-02 | `iso-19941-content.json` (11 / 4); 19941-1 replacement note | Not the EU Data Act |
| BR-INTL-03 ISO 23894 corpus | FR-INTL-01, FR-INTL-08 | US-I-03, US-I-12 | `iso-23894-content.json` (12 / 5); 42001 related note; duplicate request = one instrument | Not the EU AI Act; not 42001 |
| BR-INTL-04 SOC 2 corpus | FR-INTL-01 | US-I-04 | `soc2-content.json` TSC names (20 / 6) | Attestation, not a law |
| BR-INTL-05 No GDPR fallback | FR-INTL-02, FR-SRC-06 | US-I-05, US-C-05 | `resolveCredibleSourcesForRegulation` + `INTL_REGULATION_IDS` | `iso-parity` sources test |
| BR-INTL-06 International news | FR-INTL-05, FR-NEWS-03c | US-I-06, US-N-02/03/04 | `crawlInternationalOfficialNews`, `internationalNewsItemIsOnScope`, `news-topics.js` (4 International groups), `scripts/seed-iso-soc-news.js` | ISO/AICPA feeds + seeds; `iso-parity` news tests |
| BR-INTL-07 Copyright-safe overlay | FR-INTL-03 | US-I-01, US-I-10 | Educational catalogue / Harmonized Structure / TSC category titles only; ETL ping-only (`pingOfficialSource`) | No paid ISO / AICPA body text scraped or stored |
| BR-INTL-08 ISO/SOC 2 parity tests | NFR-07, FR-INTL-07, EM-04 | US-I-07, US-Q-03 | `test/iso-parity.test.js` | `npm test` (58 pass / 24 suites) |
| BR-INTL-09 Voluntary-standard honesty | FR-INTL-04, FR-ASK-03c, G8 | US-I-09, US-A-09 | System-prompt LEGAL FORCE branch in `server.js`; `regulation-profiles-iso.js` copy | Ask on each `iso-*` / `soc2`: "voluntary / attestation, not a law" |
| BR-INTL-10 International ETL guard | FR-ETL-02d, FR-ETL-07, FR-INTL-10 | US-I-11, US-E-02 | `MIN_ISO_27701_*` (14/5), `MIN_ISO_19941_*` (11/4), `MIN_ISO_23894_*` (12/5), `MIN_SOC2_*` (20/6), `*_FORCE_CORPUS_WRITE`; npm `refresh-iso-*` / `refresh-soc2` | `.env.example`; CLI run; `ETL incomplete` on floor breach |
| BR-INTL-11 Region INTL + themes | FR-SHELL-01, FR-INTL-06, FR-INTL-09 | US-R-07, US-I-08, US-I-13 | `REGION_IDS` incl. `intl`; `styles.css` `intl` thumb (`#64748b` → `#334155` @ `165deg`) and `iso-*` / `soc2` theme blocks | Visual: teal / sky / violet / amber; INTL → `iso-27701` |
| BR-INTL-12 SEED + Vercel bundle | FR-ETL-06, FR-ETL-08 | US-E-05 | `lib/paths.js` `SEED_FILES` (41 files incl. 8 corpus/structure + 4 summary files International); `vercel.json` `includeFiles` lists `iso-soc-scraper.js` | Count = 41; cold start; function bundle contains scraper |
| BR-INTL-13 International profiles | FR-INTL-11, FR-BRW-10c | US-B-10, US-I-14 | `public/regulation-profiles-iso.js` (`ISO N clause N`, `SOC 2 criterion N`, `Purpose note (N)`) | `iso-parity` UI blurbs test |

---

## Engineering maintainability

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-EM-01 No dead Ask APIs | FR-ASK-08 | US-A-02, US-D-02 | Removed `/api/ask`, `/api/summarize` | Grep server + docs |
| BR-EM-02 Public module API | EM-01 | US-D-01 | SOURCE_CODE_INVENTORY | Export audit |
| BR-EM-03 Docs lockstep | NFR-08 | US-D-01 | PRODUCT_DOCUMENTATION_STANDARD **v3.2**; every `docs/*.md` stamped product 1.3.0 · standard v3.2 | Audit date 2026-10-23 · product 1.3.0 · thirteen instruments · News scoped for all regs · `SEED_FILES` = 41 · 58 pass / 24 suites |

---

## App shell and responsive chrome

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-S-01 Tools menu | FR-SHELL-03 | US-S-01 | `#headerActionsToggle` | ≤899px |
| BR-S-02 Chrome resize | FR-SHELL-04 | US-S-02 | `#appChrome` ResizeObserver → tab thumb | Tab thumb stays aligned |
| BR-S-03 Tabs | FR-SHELL-06 | US-S-03 | Segmented tab track | Visual |
| BR-S-04 Logo home | FR-SHELL-07 | US-H-01 | `goToHome()` | Click logo |

---

## Browse welcome and chapters filter reliability

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-W-01 Welcome hub | FR-BRW-10 | US-W-01/02 | `#browseWelcomeGrid` / solo | Desktop + mobile |
| BR-W-02 Chapters first | FR-BRW-11 | US-W-03 | Quick actions order | Manual |
| BR-F-01 Filter reset | FR-BRW-04 | US-B-03 | `resetChaptersFilters` | Switch GDPR→AI Act |
| BR-F-02 Stale load ignore | FR-BRW-12 | US-B-03 | `loadChaptersRequestId` | Rapid switch |

---

## Browse and regulation reading

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-B-01 Lists + reader | FR-BRW-01/02 | US-B-01 | `/api/articles`, `/api/recitals`, `app.js` | Smoke |
| BR-B-02 GDPR topics | FR-BRW-03 | US-B-02 | `ARTICLE_TOPICS`, `hasArticleTopics` | Filters visible |
| BR-B-03 Titles | FR-BRW-08 | US-B-06 | `getArticleDisplayTitle` | Long AI Act title |
| BR-B-04 Formatting | FR-BRW-09 | US-Q-02 | guardrails + renderer | §8 checklist |
| BR-B-05 Suitable recitals | FR-BRW-06 | US-Q-01 | `gdpr-crossrefs.js` | GDPR only |
| BR-B-06 Chapter summaries | FR-BRW-07 | US-B-07 | `/api/chapter-summaries` | No GDPR bleed |
| BR-B-07 PDF / nav | FR-BRW-05 | US-B-04, US-X-01 | Browser print PDF; Page \| Full; jump Enter | Manual |
| BR-B-08 Deep link / bounce | FR-BRW-05b/c | US-B-04c/e | `buildDocRouteHash`, `suppressAppRouteSync` | `test/browse-routes.test.js` |
| BR-B-09 Reg-switch clear | FR-BRW-05b | US-B-04d | reader clear on regulation change | Manual + reader-view tests |
| BR-B-10 Browse policy summary | FR-BRW-14 | US-B-11 | `browseUi.policySummary` + theme chips; full-width summary panel in `styles.css` | Open Chapters/Recitals per instrument |

---

## Ask (grounded Q&A)

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-A-01 Grounded answer | FR-ASK-01/02 | US-A-01 | `POST /api/answer` | Citations present |
| BR-A-02 Fallback chain | FR-ASK-01 | US-A-07 | Groq→Tavily→extractive | Disable keys |
| BR-A-03 BYOK | FR-ASK-06 | US-A-04 | `gdpr-qa-byok-v1`, validate route | Check validity |
| BR-A-04 Sector | FR-ASK-07 | US-A-05 | `/api/industry-sectors` | Combobox |
| BR-A-05 Soft law | FR-ASK-03 | US-A-06 | system prompt branch | ID AI Ethics Ask |
| BR-A-06 View in app | FR-ASK-04 | US-A-03 | `app-goto-doc` | Round-trip |
| BR-A-07 US analogue Ask | FR-ASK-03b | US-A-08, US-J-04 | `buildLocalContext` + `laypersonSearchExpansion` | `test/us-parity.test.js` |

---

## Credible sources and news

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-SRC-01 Scoped sources | FR-SRC-01–06 | US-C-01–05 | `/api/meta` | Per regulation (US: no GDPR-Info) |
| BR-N-01 Shared crawl | FR-NEWS-01 | US-N-01/03 | `news-crawler.js` | Refresh |
| BR-N-02 Relevance filters | FR-NEWS-04, FR-NEWS-04b | US-N-02 | `itemMatchesNewsRegulationScope` + regional/primary helpers (incl. `GDPR_NEWS_SCOPE_RE`, `US_*_NEWS_SCOPE_RE`, `ISO_*_NEWS_SCOPE_RE`, `SOC2_NEWS_SCOPE_RE`); all thirteen profiles `filterForRegulation: true` | Switch regs; GDPR scoped ≠ full corpus |
| BR-N-03 Dedupe | FR-NEWS-05 | US-N-05 | server + `news-dedupe.js` | Dup URLs |
| BR-N-04 Policy BG-07 | FR-NEWS-02 | — | crawler source list | No extra DPAs |

---

## Content pipeline

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-E-01 Guardrails | FR-ETL-03 | US-E-04 | `document-formatting-guardrails.js` | Refresh report |
| BR-E-02 Per-reg refresh | FR-ETL-01/02/02b/02d | US-E-01/02 | scrapers + `id-law-scraper.js` + `us-law-scraper.js` + `iso-soc-scraper.js` | CLI scripts (`refresh-id-*`, `refresh-us-*`, `refresh-iso-*`, `refresh-soc2`) |
| BR-E-03 Cron all thirteen | FR-ETL-04/05 | US-E-03 | `daily-regulation-refresh.js` | Cron + secret |
| BR-E-04 Force write / mins | FR-ETL-07 | US-J-07, US-I-11 | `MIN_*` (incl. `MIN_US_*`, `MIN_ISO_*`, `MIN_SOC2_*`), `*_FORCE_CORPUS_WRITE` (incl. `US_*`, `ISO_*`, `SOC2`) | `.env.example` |

---

## Non-functional and compliance

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-NF-01 No auth | NFR-03, DG-01 | — | Open Express | Threat model docs |
| BR-NF-02 Secrets | NFR-04, BG-08 | US-A-04 | `.gitignore`, BYOK | Secret scan |
| BR-NF-03 Responsive | NFR-05 | US-S-*, US-U-02 | `styles.css` | Device smoke |
| BR-NF-04 A11y basics | NFR-06 | US-U-01 | roles/aria | Keyboard check |

---

## Documentation and configuration

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-DOC-01 Handbook | — | US-D-01 | `README.md` | Links resolve |
| BR-DOC-02 Variables | — | US-D-01 | `VARIABLES.md`, `.env.example` | Match env usage |
| BR-DOC-03 API contracts | — | US-D-02 | `API_CONTRACTS.md` | Match `server.js` routes |
| BR-DOC-04 Changelog | — | — | `CHANGELOG.md` | Unreleased (UX + documentation v3.2 lockstep) + **1.3.0** + prior |

---

## Change control

| Event | Required updates |
|-------|------------------|
| New instrument | regulations.js, profiles, ETL, SEED_FILES, PRD, FEATURE_CATALOG, VARIABLES, DESIGN themes, TRACEABILITY, tests |
| Remove API | server.js, API_CONTRACTS, README, GUARDRAILS, CHANGELOG |
| Env var add/remove | `.env.example`, VARIABLES, README §10, VERCEL_DEPLOY if prod |
| Guardrail change | DOCUMENT_FORMATTING_GUARDRAILS + TRACEABILITY + scraper/reader |

---

## References

- [PRD.md](PRD.md)  
- [USER_STORIES.md](USER_STORIES.md)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)  
- [../CHANGELOG.md](../CHANGELOG.md)
