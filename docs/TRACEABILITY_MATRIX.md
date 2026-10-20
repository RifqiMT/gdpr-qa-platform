# Traceability matrix  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6**

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
| BR-R-01 Six instruments selectable | FR-REG-01 | US-R-02 | `lib/regulations.js` `REGULATION_DISPLAY_ORDER`, `GET /api/regulations` | UI + API list length 6 |
| BR-R-02 Region filter | FR-SHELL-01, FR-REG-02 | US-R-01 | `public/app.js` region chrome | Filter All/EU/ID |
| BR-R-03 Persistence | FR-SHELL-01, FR-REG-02 | US-R-03 | `localStorage` `gdpr-qa-regulation-v1` | Reload keeps selection |
| BR-R-04 Scoped APIs | FR-REG-03 | US-R-02 | `parseRegulationId`, `mergeRegulationBody` | Network tab `regulation=` |
| BR-R-05 Profile chrome | FR-REG-05/06 | US-R-04/05 | `regulation-profiles.js`, `regulation-profiles-id.js` | Switch ID ↔ EU labels |

---

## Indonesian instruments

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-ID-01 UU PDP corpus | FR-ETL-02, FR-BRW-08 | US-B-08, US-E-02 | `id-law-scraper.js id-pdp`, `id-pdp-content.json` | Browse pasal; `npm test` |
| BR-ID-02 Satu Data corpus | FR-ETL-02 | US-B-08 | `id-satu-data-content.json` | Browse + Ask |
| BR-ID-03 AI Ethics soft law | FR-ASK-03, G6 | US-A-06 | Ask prompt framing; profiles | Manual Ask review |
| BR-ID-04 No GDPR sources fallback | FR-SRC-04 | US-C-02 | `GET /api/meta` fallback chain | Meta for `id-pdp` |
| BR-ID-05 Indo news | FR-NEWS-03/04/07 | US-N-02/03/04 | `news-crawler.js` Antara/Setkab/… | Refresh news |
| BR-ID-06 SEED includes ID | FR-ETL-06 | US-E-05 | `lib/paths.js` `SEED_FILES` | Count = 20; cold start |
| BR-ID-07 Parity tests | NFR-07 | US-Q-03 | `test/indo-parity.test.js` | `npm test` |

---

## Engineering maintainability

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-EM-01 No dead Ask APIs | FR-ASK-08 | US-A-02, US-D-02 | Removed `/api/ask`, `/api/summarize` | Grep server + docs |
| BR-EM-02 Public module API | EM-01 | US-D-01 | SOURCE_CODE_INVENTORY | Export audit |
| BR-EM-03 Docs lockstep | NFR-08 | US-D-01 | PRODUCT_DOCUMENTATION_STANDARD v2.5 | Audit date 2026-10-20 |

---

## App shell and responsive chrome

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-S-01 Tools menu | FR-SHELL-03 | US-S-01 | `#headerActionsToggle` | ≤899px |
| BR-S-02 Chrome height | FR-SHELL-04 | US-S-02 | `--app-chrome-height` ResizeObserver | Reader not clipped |
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
| BR-B-07 PDF / nav | FR-BRW-05 | US-B-04, US-X-01 | html2pdf, doc nav | Manual |

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

---

## Credible sources and news

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-SRC-01 Scoped sources | FR-SRC-01–04 | US-C-01–03 | `/api/meta` | Per regulation |
| BR-N-01 Shared crawl | FR-NEWS-01 | US-N-01/03 | `news-crawler.js` | Refresh |
| BR-N-02 Relevance filters | FR-NEWS-04 | US-N-02 | `itemMatchesNewsRegulationScope` | Switch regs |
| BR-N-03 Dedupe | FR-NEWS-05 | US-N-05 | server + `news-dedupe.js` | Dup URLs |
| BR-N-04 Policy BG-07 | FR-NEWS-02 | — | crawler source list | No extra DPAs |

---

## Content pipeline

| BR | PRD | Stories | Implementation | Verification |
|----|-----|---------|----------------|--------------|
| BR-E-01 Guardrails | FR-ETL-03 | US-E-04 | `document-formatting-guardrails.js` | Refresh report |
| BR-E-02 Per-reg refresh | FR-ETL-01/02 | US-E-01/02 | scrapers + `id-law-scraper.js` | CLI scripts |
| BR-E-03 Cron all six | FR-ETL-04/05 | US-E-03 | `daily-regulation-refresh.js` | Cron + secret |
| BR-E-04 Force write / mins | FR-ETL-07 | — | `MIN_*`, `*_FORCE_CORPUS_WRITE` | `.env.example` |

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
| BR-DOC-04 Changelog | — | — | `CHANGELOG.md` | Unreleased + 1.2.6 |

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
