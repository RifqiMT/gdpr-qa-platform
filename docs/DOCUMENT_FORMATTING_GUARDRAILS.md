# Document formatting guardrails (GDPR reader)

This document is the **reference contract** between **source data** (`data/gdpr-content.json`, produced by refresh/scrape from EUR-Lex / GDPR-Info) and **in-app presentation** (`public/app.js`, `public/styles.css`). Any change to extraction, normalization, or JSON shape should be checked against these rules so the reader does not regress.

**Principle:** The app must not alter the **legal meaning** of the GDPR. Formatting logic only parses, escapes, and structures text for display. If a fix requires rewriting substantive law, fix the **ETL** or **source**, not the wording in JSON.

---

## 1. End-to-end pipeline

| Stage | Location | Responsibility |
|--------|-----------|----------------|
| Fetch & extract | `scraper.js` (EUR-Lex HTML/TXT, GDPR-Info pages) | Produce `articles[]`, `recitals[]` with `number`, `title`, `text`, URLs |
| Store | `data/gdpr-content.json` | Single source of truth for browse/API |
| Serve | `server.js` (`/api/articles/:n`, `/api/recitals/:n`) | Return records as stored |
| Render | `public/app.js` | `openArticle`, `openRecital`, formatters |
| Style | `public/styles.css` | `.article-doc`, `.recital-doc`, `.art-para-list`, etc. |

**Refresh rule:** After every content refresh, run the **verification checklist** (section 8) in the browser, not only diff/hash checks.

---

## 2. Article body: decision order (do not reorder casually)

When opening an article, the client builds HTML in this **fixed order**:

1. **`stripLeadingArticleHeadingFromBody`** — Removes a duplicated heading prefix (`data.title`, `Art. N GDPR`, `displayTitle`) so structure detection sees the real body. Normalizes `\r\n` → `\n`. May run up to **4** passes to strip repeated title lines (ETL duplicates).
2. **`renderManualNumberedParagraphs`** — If the body matches `N.` paragraph structure after strip, this path wins.
3. Else **`renderAutoArticleBody`** — Special cases (Art. 4 definitions, 5–7 structured lists, Art. 8), then **`renderGenericStructuredArticle`**.
4. Else **plain** escaped block with citation injection only.

**Guardrail:** If step 2 silently fails (regex too strict/loose), users see wrong paragraph boundaries. Prefer adjusting **normalized text** or **one** regex with comments referencing this doc.

---

## 3. Numbered paragraphs (`1.`, `2.`, …) — critical string shapes

### 3.1 Splitting between paragraphs

- **Use:** Split only before a **new line** that starts the next numbered paragraph:
  - Pattern intent: `(?=\n[horizontal-space]*\d+\.[whitespace]+)`
  - Horizontal space = spaces, tabs, NBSP (U+00A0), narrow NBSP (U+202F) in the **source string** (before HTML escape).
- **Do not use:** `(?=(?:^|\n)\s*\d+\.\s+)` with `\s*` spanning **newlines** between `1.` and `2.` — that used to split on every blank line in `\n \n \n 2.` and **destroy** lists.

### 3.2 Line endings

- Normalize **CRLF** and lone **CR** to `\n` before splitting (articles and recitals).

### 3.3 Glue after `Article` / `Art.`

- EUR-Lex-style glues (`2Article`, `Article4`) are normalized with spacing **before** citation/paragraph regexes in `linkRegulationCitationsInEscapedTextSegment`.

### 3.4 Merged “Article 98” false splits

- A guard merges a segment when a small fragment looks like `… Article ` + `16` glued (see `renderManualNumberedParagraphs` merge loop). Changing thresholds can revive bogus splits or swallow real paragraphs.

---

## 4. HTML escape and citation linking (known coupling)

### 4.1 Order of operations for prose lines

Typical line path:

`escapeHtml` → `formatInlineFootnotes` (EUR-Lex clause markers) → `formatRecitalRefs` → `injectRegulationCitationLinks`.

### 4.2 NBSP → `&nbsp;` breaks regex whitespace

- `escapeHtml` uses the DOM (`textContent` / `innerHTML`). **NBSP (U+00A0)** becomes the literal entity **`&nbsp;`** in the string.
- Citation list patterns rely on **true** whitespace (e.g. `,\s*` between `Articles 15, 16, 18, 19`). The six-character sequence `&nbsp;` is **not** matched by `\s`.
- **Symptom:** Only the first part of an article list is linked (e.g. Art. **89**: `15, 16, 18` linked, `19, 20, 21` not).
- **Mitigation:** `normalizeSpaceEntitiesForCitationPlainText` runs at the start of GDPR citation linking and Charter/TFEU wrapping — **do not remove** without replacing with an equivalent that restores spacing semantics for regexes.

**Guardrail:** ETL may keep NBSP in JSON (typical for EU texts). The client **must** normalize entities before regex-based linking, or normalize NBSP to U+0020 at scrape time **consistently** (and then re-test citations).

---

## 5. Recitals

- **Input:** `rawText` with optional blank-line paragraph splits; CRLF normalized.
- **Heuristic blocks:** Double newlines define paragraphs; single newlines inside a block are collapsed to spaces.
- **Inline “1Clause 2Clause”** (EUR-Lex): `splitInlineNumberedClauses` → bullet list, not a second numbered tier.
- **Long single-paragraph recitals:** Possible sentence pairing when many short sentences — changing thresholds affects layout only, not legal text.

---

## 6. ETL / scraper obligations (source refresh “bible”)

When changing `scraper.js` or any step that writes `gdpr-content.json`:

1. **Preserve `number`** for articles 1–99 and recitals 1–173; do not shift or merge without a migration plan.
2. **Article `text` body** should start consistently after the title line (duplicate title in body is tolerated; stripper handles it, but avoid unnecessary duplication).
3. **Numbered paragraphs:** Prefer preserving `N.` at the **start of a line** (after optional horizontal space), with **whitespace after the dot** before prose — matches manual parser expectations.
4. **Lists like `Articles 15, 16, 18, …`:** Commas may be followed by NBSP in official HTML; that is OK if client entity normalization remains (section 4.2).
5. **Art. 4 “Definitions”:** Keep `For the purposes of this Regulation:` and definition lines starting with `‘` or numeric-quote patterns so `renderArt4Definitions` activates.
6. **Do not strip** `(Recital N)` mid-article markers if the reader relies on them for cross-links and layout (they are formatted, not deleted as noise).
7. **Placeholder:** If extraction fails, use the agreed placeholder prefix `(Text not extracted` so the UI shows the “unavailable” state instead of garbage HTML.

---

## 7. Presentation-only helpers (must stay non-substantive)

- **`getArticleBodyTextAfterHeading`:** For list/search excerpts only; same strip as the reader; does not change stored JSON.
- **Related panel titles/descriptions:** Short labels for UX; full text remains in the document view.
- **`CANONICAL_ARTICLE_TITLES`:** Display fallback when API title is missing or malformed; keep in sync with official short titles when you intentionally update naming.

---

## 8. Verification checklist (after each refresh)

Run these in the **browse** reader (not only Ask):

| Check | Why |
|--------|-----|
| **Art. 1** | Three numbered paragraphs; no spurious empty list items |
| **Art. 2** | §1–§4; lettered `(a)`–`(d)` under §2 intact |
| **Art. 4** | Definition list + recital refs readable |
| **Art. 5–7** | Special list layouts |
| **Art. 89** | Second paragraph: `Articles 15, 16, 18, 19, 20 and 21` — **all** article numbers are in-app links |
| **One long recital** | No accidental bullet explosion on normal prose |
| **Chapter cards / doc nav** | Excerpts readable; no doubled title at start |

If **citations** break, inspect **entity normalization** (section 4.2) and **list regex** in `linkRegulationCitationsInEscapedTextSegment`. If **paragraphs** break, inspect **manual split** (section 3.1) and **stripLeading** passes.

---

## 9. File map (when you debug)

| Concern | Primary file / symbol |
|---------|------------------------|
| Article open pipeline | `openArticle`, `stripLeadingArticleHeadingFromBody`, `renderManualNumberedParagraphs`, `renderAutoArticleBody` |
| Recital HTML | `renderRecitalDocumentHtml`, `openRecital` |
| Citations | `injectRegulationCitationLinks`, `linkRegulationCitationsInEscapedTextSegment`, `normalizeSpaceEntitiesForCitationPlainText`, `isProbablyGdprArticleCitation` |
| Line formatting | `fmtArticleLine`, `fmtArticleMultiline`, `formatInlineFootnotes`, `stripEurLexClauseNumberMarkers` |
| Reader chrome | `public/styles.css` — `.article-doc`, `.art-para-list`, `.recital-doc` |
| JSON + refresh | `data/gdpr-content.json`, `scraper.js`, `server.js` |

---

## 10. Ask tab — industry / sector (ISIC Rev.4)

- **Data:** `public/industry-sectors.json` (served statically) and **`GET /api/industry-sectors`** (`server.js` → `loadIndustrySectorsList()` reading the same file).
- **Client:** `loadIndustrySectorsForAsk()` tries the API, then **`/industry-sectors.json`**, then an **embedded fallback** (GENERAL + ISIC sections A–U) so the combobox always wires.
- **UI:** `initAskIndustrySectorCombobox()` runs on load and again when the **Ask** tab is shown (`viewAsk`), idempotent via `data-ask-sector-combo-ready` on the list.
- **CSS:** `.ask-composer-card` and `.ask-sector-row` use `overflow: visible`; the dropdown list uses a high **z-index** so it is not clipped by the card.
- **LLM (`POST /api/answer`):** `buildAnswerPrompt` injects a **sector lock-in** (verbatim phrase from the label after the section letter). `answerNamesSelectedSector` checks keyword / phrase presence; **`enforceSectorMentionGroq`** rewrites the answer if the model stayed generic. `buildLocalContext` merges a second BM25 pass on `searchTerms` + GDPR tokens for richer sector-grounded retrieval.
- **General + simple explainers:** `querySeemsLaypersonExplain` widens BM25 toward principles/definitions, drops **Art. 8** when the question is not about children, skips **web snippets** for that pattern, and adds **GENERAL MODE** prompts. **`answerViolatesGeneralCoherence`** detects multiple `For …:` headings, forbidden lines (e.g. “For healthcare/businesses”), or `---` section splits; **`enforceGeneralSingleAudienceGroq`** rewrites into one concise, citation-grounded narrative. Ask uses **lower temperature** and **shorter max tokens** for General + layperson queries.

---

## 11. Changing this document

- Any **intentional** change to formatting behavior (new regex, new normalization, new split rules) should update **this file** in the same PR/commit so the next refresh still has a single source of truth.
- If behavior diverges from this doc, **either** fix the code **or** fix this doc — avoid undocumented drift.

---

*Last aligned with in-app logic in `public/app.js` (article/recital rendering, citation linking, Ask industry sectors). Update the “Last aligned” note when you change those flows.*
