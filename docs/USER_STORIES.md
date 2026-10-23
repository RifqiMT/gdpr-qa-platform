# User Stories  
## Regulation Q&A Platform

**Version:** 3.1 · **Last updated:** 2026-10-22 · Documentation standard **v3.1** · Product **1.3.0** · Audit date **2026-10-22** · Thirteen instruments (EU + Indonesia + United States + International)  
**Traceability:** Stories map to [PRD.md](PRD.md) and [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).

---

## Epic 0: Region and regulation selection

| ID | Story | Priority |
|----|-------|----------|
| US-R-01 | As a user, I can filter instruments by **All / EU / Indonesia / USA / INTL** so the selector matches my jurisdiction. | P0 |
| US-R-02 | As a user, I can select any of the **thirteen** instruments and have Browse, Ask, and Sources follow that choice. | P0 |
| US-R-03 | As a user, my last selected regulation persists across reloads (`gdpr-qa-regulation-v1`). | P0 |
| US-R-04 | As a user, UI chrome (titles, placeholders, links, themes) updates when I switch regulation. | P0 |
| US-R-05 | As a user, citation sidebar publisher links match the active instrument (never stuck on GDPR-Info for ID or US laws). | P0 |
| US-R-06 | As a user, choosing USA selects `us-ccpa` by default and the jurisdiction chip reads **United States**; choosing a regulation outside my region realigns the region filter. | P1 |
| US-R-07 | As a user, my last region choice persists across reloads in `gdpr-qa-region-v1` (`all`, `eu`, `id`, `us`, or `intl`); an invalid stored value falls back to `all`. | P1 |

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
| US-W-01 | As a desktop user, I see themed overview cards for all thirteen instruments in four region rows (EU, Indonesia, USA, International). | P1 |
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
| US-B-04 | As a user, I can navigate with Prev / Next and the jump search field (Enter or pick a suggestion) and export PDF. | P1 |
| US-B-04b | As a user, I can toggle **Page \| Full** so PDF export and scrolling match one provision vs the whole corpus. | P1 |
| US-B-04c | As a user, opening a shared `#/{reg}/article/N` link lands on that provision on first paint. | P0 |
| US-B-04d | As a user, switching regulation while reading does not leave the previous instrument’s text on screen. | P0 |
| US-B-04e | As a user, opening Chapters or Recitals from the welcome hub does not bounce me back to the home grid. | P0 |
| US-B-05 | As a GDPR user, I see suitable recitals; as other users, I see related provisions from text only. | P1 |
| US-B-06 | As a user, article/pasal titles show the official corpus title (GDPR may use canonical map). | P0 |
| US-B-07 | As a user, chapter introductions match the active regulation (no GDPR blurbs under ID or US instruments). | P1 |
| US-B-08 | As an Indonesian user, I can browse UU PDP pasal, Satu Data pasal, and AI Ethics sections/values. | P0 |
| US-B-09 | As a United States user, I can browse CCPA sections, ADMT sections, and OPEN Data Title II sections with **Section / Purpose note** labels (never *Article / Recital*). | P0 |
| US-B-10 | As an International-standards user, I can browse ISO 27701 / ISO 19941 / ISO 23894 clauses and SOC 2 criteria with **Clause / Criterion / Purpose note** labels (never *Article / Recital*) and no GDPR topic filters. | P0 |

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
| US-A-08 | As a United States user, Ask retrieves CCPA / OPEN Data / ADMT excerpts (right to delete, open government data asset, consequential decision) — never EUR-Lex GDPR bleed. | P0 |
| US-A-09 | As an International-standards user, Ask retrieves on-instrument excerpts for ISO 27701 / 19941 / 23894 / SOC 2 questions and frames each as a **voluntary standard / attestation, not a law**. | P0 |

---

## Epic 3: Credible sources

| ID | Story | Priority |
|----|-------|----------|
| US-C-01 | As a user, Sources lists credible organizations for the **active** instrument only. | P0 |
| US-C-02 | As an Indonesian user, I see JDIH / peraturan.go.id style sources — not GDPR-Info. | P0 |
| US-C-03 | As an EU AI Act / Data Act user, I see instrument-specific publishers + EUR-Lex. | P0 |
| US-C-04 | As a United States user, Sources lists CPPA/leginfo/OAG, Colorado GA/coag.gov/ai, or govinfo/data.gov/GSA — never GDPR-Info. | P0 |
| US-C-05 | As an International-standards user, Sources lists ISO.org / JTC 1 or AICPA & CIMA publishers — never GDPR-Info / EUR-Lex. | P0 |

---

## Epic 4: News

| ID | Story | Priority |
|----|-------|----------|
| US-N-01 | As a user, I can browse supervisory/policy news with source and topic filters. | P0 |
| US-N-02 | As an AI Act / Data Act / UU PDP / Satu Data / AI Ethics / CCPA / ADMT / OPEN Data / ISO 27701 / ISO 19941 / ISO 23894 / SOC 2 user, I see a relevance-filtered list and banner. | P0 |
| US-N-03 | As a user, I can Refresh news to re-crawl EU, Indonesian, United States, and International (ISO / AICPA) official hubs. | P0 |
| US-N-04 | As an Indonesian, United States, or International user, empty filtered states tell me to Refresh news when feeds are sparse. | P1 |
| US-N-05 | As a user, duplicate stories collapse (URL + semantic dedupe). | P1 |

---

## Epic 5: Content refresh

| ID | Story | Priority |
|----|-------|----------|
| US-E-01 | As an operator, Refresh sources updates only the selected instrument’s corpus. | P0 |
| US-E-02 | As an operator, I can CLI-refresh GDPR, AI Act, Data Act, each Indonesian instrument, each United States analogue, and each International standard (`refresh-iso-27701`, `refresh-iso-19941`, `refresh-iso-23894`, `refresh-soc2`). | P0 |
| US-E-03 | As an operator, daily cron refreshes all thirteen instruments. | P0 |
| US-E-04 | As an operator, every corpus write runs formatting guardrails. | P0 |
| US-E-05 | As a Vercel operator, cold start seeds EU + ID + US + INTL JSON via `SEED_FILES` (41 files). | P0 |

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
| US-X-01 | As a user, I can export the open provision (Page) or the whole on-screen corpus (Full) as PDF. | P1 |
| US-X-02 | As a user, citation chips and official links open the correct publisher for the active instrument. | P0 |

---

## Epic 8: Accessibility and UX

| ID | Story | Priority |
|----|-------|----------|
| US-U-01 | As a keyboard user, I can operate tabs, filters, and the reader jump field (Enter or list pick; there is no Go button) via keyboard. | P1 |
| US-U-02 | As a mobile user, Filters collapse behind a clear control with active-filter summary. | P1 |

---

## Epic 9: Cross-references and corpus quality

| ID | Story | Priority |
|----|-------|----------|
| US-Q-01 | As a GDPR user, related + suitable recitals appear where mapped. | P1 |
| US-Q-02 | As any user, reader numbered paragraphs match source layout after refresh. | P0 |
| US-Q-03 | As engineering, `npm test` validates Indonesian, United States, and International registry/corpus/news parity plus browse-route and reader-view behaviour (**58 pass / 24 suites** at the 2026-10-22 audit). | P0 |

---

## Epic 10: Documentation and compliance artifacts

| ID | Story | Priority |
|----|-------|----------|
| US-D-01 | As a stakeholder, I can find PRD, personas, stories, variables, metrics, design, traceability, and guardrails under `docs/`. | P1 |
| US-D-02 | As engineering, docs do not advertise removed 1.2.6 APIs or LLM providers. | P0 |

---

## Epic 11: United States jurisdiction (CCPA/CPRA, Colorado ADMT, OPEN Government Data Act)

| ID | Story | Priority |
|----|-------|----------|
| US-J-01 | As California privacy counsel, I can open `us-ccpa` and read Cal. Civ. Code §§ 1798.100–1798.199.95 (33 sections, 5 purpose notes) with CPPA / leginfo links. | P0 |
| US-J-02 | As a Colorado ADMT / AI governance lead, I can open `us-admt` and read SB 26-189 / C.R.S. 6-1-1701 et seq. (14 sections, 5 purpose notes), with the 1 Jan 2027 effective context stated in copy. | P0 |
| US-J-03 | As a federal open-data steward, I can open `us-open-data` and read Title II of Pub. L. 115-435 (10 sections, 4 purpose notes); copy states it is **not** the 2014 DATA Act. | P0 |
| US-J-04 | As a user, no US instrument is presented as a federal GDPR or AI Act; Ask prompts and profile copy state the California / Colorado / federal-public-sector scope. | P0 |
| US-J-05 | As a user, `GET /api/meta` for any `us-*` instrument never returns GDPR-Info / EUR-Lex GDPR sources (no fallback). | P0 |
| US-J-06 | As a user, USA News shows only official U.S. feeds (FTC, CPPA/CalPrivacy, California OAG, Colorado AG ADAI, data.gov / GSA / Federal Data Strategy) and no ICO/EDPB leakage; empty state points to **Refresh news**. | P0 |
| US-J-07 | As an operator, I can run `npm run refresh-us-ccpa`, `refresh-us-admt`, and `refresh-us-open-data`, tune floors with `MIN_US_*`, and force a write with `US_*_FORCE_CORPUS_WRITE`. | P0 |
| US-J-08 | As a user, each US instrument has a distinct theme accent (CCPA blue `#1d4ed8`, OPEN Data teal `#0f766e`, ADMT violet `#6d28d9`) across Browse welcome, News hero, and Sources. | P2 |

---

## Epic 12: International standards (ISO/IEC 27701, 19941, 23894, SOC 2) — voluntary, not laws

| ID | Story | Priority |
|----|-------|----------|
| US-I-01 | As a privacy programme lead, I can open `iso-27701` and read an educational PIMS clause map (14 clauses, 5 purpose notes) linked to the ISO.org 27701:2025 catalogue — not paid ISO text. | P0 |
| US-I-02 | As a cloud architect, I can open `iso-19941` and read interoperability/portability types with the 19941-1 replacement noted. | P0 |
| US-I-03 | As an AI governance lead, I can open `iso-23894` and read ISO 31000 overlay guidance, with ISO/IEC 42001 called out as a related certifiable AIMS (a related note only — **not** a separate instrument). | P0 |
| US-I-04 | As an assurance buyer, I can open `soc2` and read TSC category/criterion names (CC1–CC9, A1, C1, PI1, P1–P8), Type 1 vs Type 2, and that SOC 2 is not a law. | P0 |
| US-I-05 | As a user, Ask/Sources for `iso-*` / `soc2` never fall back to GDPR-Info / EUR-Lex. | P0 |
| US-I-06 | As a user, International News shows ISO.org / AICPA items filtered per instrument. | P0 |
| US-I-07 | As an operator, I can run `npm run refresh-iso-27701` (and siblings) and `npm run build-iso-soc-corpora`. | P0 |
| US-I-08 | As a user, choosing INTL selects `iso-27701` by default and the chip reads **International**; the region thumb is slate (`#475569` → `#334155`) and `gdpr-qa-region-v1` stores `intl`. | P1 |
| US-I-09 | As a user, every International surface (Browse, Ask, Sources, News) states these are **voluntary standards / attestation criteria, not laws**, and not substitutes for the GDPR, Data Act, or AI Act. | P0 |
| US-I-10 | As a rights-holder-conscious product owner, the International corpora are **copyright-safe educational overlays** (catalogue abstracts, Harmonized Structure titles, AICPA TSC category names) and ETL never scrapes paywalled ISO / AICPA body text. | P0 |
| US-I-11 | As an operator, I can tune floors with `MIN_ISO_27701_*` (14/5), `MIN_ISO_19941_*` (11/4), `MIN_ISO_23894_*` (12/5), `MIN_SOC2_*` (20/6) and force a write with `ISO_27701_FORCE_CORPUS_WRITE` / `ISO_19941_FORCE_CORPUS_WRITE` / `ISO_23894_FORCE_CORPUS_WRITE` / `SOC2_FORCE_CORPUS_WRITE`. | P1 |
| US-I-12 | As a user, a duplicate request for ISO 23894 resolves to the **same single instrument** (no second entry); ISO/IEC 42001 appears only as a related note. | P1 |
| US-I-13 | As a user, each International instrument has a distinct accent (ISO 27701 `#0f766e`, ISO 19941 `#0369a1`, ISO 23894 `#5b21b6`, SOC 2 `#b45309`) across Browse welcome, News hero, and Sources. | P2 |
| US-I-14 | As a user, the **Page \| Full** reader (`gdprQaReaderViewMode`) works identically on International instruments, including PDF export. | P1 |

---

## Acceptance criteria (representative)

### AC — Region + Indonesian instrument (US-R-01, US-R-02, US-B-08)

1. Set region to **Indonesia** → selector shows `id-pdp`, `id-satu-data`, `id-ai-ethics` only.  
2. Select **ID PDP Law** → Browse loads pasal counts consistent with corpus; Ask answers cite UU PDP sources.  
3. Sources tab does **not** show GDPR-Info / EDPB as primary cards.

### AC — United States analogues

1. Set region to **USA** → selector shows `us-ccpa`, `us-open-data`, `us-admt` only.  
2. Select **US CCPA** → Browse loads Cal. Civ. Code sections; Ask answers cite CPPA / leginfo, not EUR-Lex (US-J-01, US-J-05).  
3. Select **US OPEN Data** → answers must not treat the 2014 DATA Act as the instrument.  
4. Select **US CO ADMT** → answers frame Colorado SB 26-189 / C.R.S. 6-1-1701, not a federal AI Act.  
5. Ask a question on each US instrument → relevant provisions are Civil Code / OPEN Data / ADMT sections (badges say **Section**, not Article).  
6. Sources tab cards are the official U.S. publishers for that instrument (no GDPR-Info / EDPB).

### AC — US news and refresh (US-J-06, US-J-07)

1. With region **USA**, open **News** → only U.S. official sources appear; ICO / EDPB items are absent.  
2. If the list is empty, the banner directs the user to **Refresh news**; after refresh, CPPA/CalPrivacy, Colorado AG ADAI, FTC, or data.gov items render with source attribution.  
3. Run `npm run refresh-us-ccpa` → log shows `ETL: checking … at https://cppa.ca.gov/` and either `no significant change; skipped write` or a write; exit code `0`.  
4. Set `MIN_US_CCPA_ARTICLES=999` on a copy → run fails with `ETL incomplete` and the bundled corpus is not overwritten.

### AC — International analogues

1. Set region to **INTL** → selector shows `iso-27701`, `iso-19941`, `iso-23894`, `soc2` only.  
2. Select **ISO 27701** → Ask “What is a PIMS?” cites educational overlay + ISO.org; copy states voluntary / not GDPR.  
3. Select **ISO 19941** → answers mention CSC/CSP/portability and **not** the EU Data Act.  
4. Select **ISO 23894** → answers mention ISO 31000 overlay and related 42001, **not** the EU AI Act.  
5. Select **SOC 2** → answers mention Trust Services Criteria / Type 1 vs Type 2; badges say **Criterion**.  
6. Sources tab cards are ISO.org / AICPA (no GDPR-Info).

### AC — International ETL and honesty (US-I-05, US-I-09, US-I-10, US-I-11)

1. Run `npm run refresh-iso-27701` → log shows `ETL: checking ISO 27701 at https://www.iso.org/standard/27701 …` and either `keeping bundled … corpus` / `no significant change; skipped write` or a write; exit code `0`.  
2. Set `MIN_ISO_27701_ARTICLES=999` on a copy → run fails with `ISO 27701 ETL incomplete` and the bundled corpus is not overwritten.  
3. `GET /api/meta?regulation=soc2` → `sources` contains only AICPA entries; no GDPR-Info / EUR-Lex.  
4. Ask on each International instrument → the answer states it is a voluntary standard / attestation, not a law, and does not invent paid clause text.  
5. `npm test` → `test/iso-parity.test.js` green within **58 pass / 24 suites**.

### AC — Region persistence including INTL (US-R-07, US-I-08)

1. Click **INTL** → selector lists the four International instruments; `localStorage['gdpr-qa-region-v1'] === 'intl'`; the regulation becomes `iso-27701`.  
2. Reload → INTL is restored; set the stored value to an invalid string → region falls back to `all`.

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

### AC — Page \| Full + deep link (US-B-04b, US-B-04c)

1. Open an article; toggle **Full** — corpus stacks; Related panels hide; Export PDF includes multiple provisions.  
2. Toggle **Page** — single provision; Related panels return when applicable.  
3. Reload with `#/gdpr/article/5` (or another id) — provision opens on first paint without bouncing to home.

### AC — Browse bounce / reg switch (US-B-04d, US-B-04e)

1. From welcome hub, open Chapters — stay on chapters list (no snap back to home).  
2. Open an article, switch regulation — previous article text must not remain; land on the new instrument’s list.

---

## Reference

- [PRD.md](PRD.md)  
- [USER_PERSONAS.md](USER_PERSONAS.md)  
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)
