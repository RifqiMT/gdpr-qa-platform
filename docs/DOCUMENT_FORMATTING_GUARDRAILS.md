# Document formatting guardrails (GDPR reader)

This document is the **reference contract** between **source data** (`data/gdpr-content.json`, produced by refresh/scrape from EUR-Lex / GDPR-Info) and **in-app presentation** (`public/app.js`, `public/styles.css`). Any change to extraction, normalization, or JSON shape should be checked against these rules so the reader does not regress.

**Principle:** The app must not alter the **legal meaning** of the GDPR. Formatting logic only parses, escapes, and structures text for display. If a fix requires rewriting substantive law, fix the **ETL** or **source**, not the wording in JSON.

**This file is the binding bible** for how regulation text is normalized and presented. Any new extractor (GDPR-Info, EUR-Lex, or future mirror) must still pass through the same mandatory steps below before the corpus is written or served.

---

## 1. End-to-end pipeline

### 1.1 Mandatory refresh contract (no exceptions)

For **every** regulation refresh — **Refresh sources** / `POST /api/refresh`, **`npm run refresh`** (`server.js --refresh-only`), **daily cron**, and **initial startup** when `gdpr-content.json` is missing:

1. **`scraper.js` `run()`** merges fetched `articles` / `recitals` with the existing file (or structure-only baseline).
2. **`normalizeCorpus`** from **`document-formatting-guardrails.js`** runs on the merged arrays **immediately before** **`buildSearchIndex`** and **before every `fs.writeFileSync`** of `gdpr-content.json` — including when the dataset hash is unchanged (baseline is re-normalized on each run so guardrail updates apply without a forced hash change).
3. **`logFormattingGuardrailsReport`** + **`validateCorpusFormatting`** run on the normalized corpus (§8 smoke checks).
4. **`server.js`** after ETL: **`invalidateRegulationContentCache`** + **`loadContent()`** (`runRegulationScraperAndReloadContent`) so in-memory API state matches the file just written.
5. **`POST /api/refresh`** returns **`formattingGuardrails`** to the client for console warnings.
6. **`public/app.js`** after a successful refresh: reloads **`/api/meta`**, **`loadChapters()`**, **`loadRecitals()`**, **`loadSources()`**, and re-opens the current article/recital so the reader shows normalized text without a manual full page reload.

CLI **`--refresh-only`** does not start HTTP; it still performs steps 1–3 and writes JSON. The next server start or API call uses **`loadContent()`** (step 4 on read).

| Stage | Location | Responsibility |
|--------|-----------|----------------|
| Fetch & extract | `scraper.js` (EUR-Lex HTML/TXT, GDPR-Info pages) | Produce `articles[]`, `recitals[]` with `number`, `title`, `text`, URLs |
| **Normalize (every refresh write)** | **`document-formatting-guardrails.js`** → **`normalizeCorpus`** | **Before `buildSearchIndex` and every write:** line endings (§3.2), NBSP→space (§4.2), EUR-Lex glue (§3.3); article-only stripping of parenthetical “(Recital N)” and continuation-line merges; **`logFormattingGuardrailsReport`** + **`validateCorpusFormatting`** (§8). |
| **Normalize (every API read)** | **`server.js` → `loadContent()`** | **`normalizeCorpus`** on `articles` / `recitals` + **`buildSearchIndex`** so Browse/Ask match guardrails even if the JSON file predates a code change. |
| **Cache bust after ETL** | **`server.js`** → **`invalidateRegulationContentCache`**, **`runRegulationScraperAndReloadContent`** | Ensures the process serving `/api/*` does not return stale corpus after refresh. |
| Store | `data/gdpr-content.json` | Single source of truth for browse/API |
| Serve | `server.js` (`/api/articles/:n`, `/api/recitals/:n`) | Returns guardrail-normalized payloads from `loadContent()` |
| Render | `public/app.js` | `openArticle`, `openRecital`, `fmtArticleLine` / `fmtRecitalLine`, list renderers |
| Style | `public/styles.css` | `.article-doc`, `.recital-doc`, `.art-para-list`, etc. |

**Manual QA:** Still run the **verification checklist** (section 8) in the browser after major ETL or reader changes.

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

**Article bodies** (including letter lists and bullets under an article):

Plain text → **`stripParentheticalRecitalsFromArticlePlain`** (remove `(Recital N)` / `[Recital N]` noise) → **`stripCompoundEnumerationAtLineStarts`** (where applicable) → **`escapeHtml`** → **`formatInlineFootnotes`** (EUR-Lex clause markers) → **`injectRegulationCitationLinks`**.  
Do **not** run **`formatRecitalRefs`** on article lines (it adds layout breaks; recitals belong in their own documents / sidebar).

**Recital documents** (and recital clause bullet lists via `recital-clause-list`):

Same as articles through **`injectRegulationCitationLinks`**, but use **`fmtRecitalLine`**, which inserts **`formatRecitalRefs`** before citation linking for cross-recital readability.

### 4.2 NBSP → `&nbsp;` breaks regex whitespace

- `escapeHtml` uses the DOM (`textContent` / `innerHTML`). **NBSP (U+00A0)** becomes the literal entity **`&nbsp;`** in the string.
- Citation list patterns rely on **true** whitespace (e.g. `,\s*` between `Articles 15, 16, 18, 19`). The six-character sequence `&nbsp;` is **not** matched by `\s`.
- **Symptom:** Only the first part of an article list is linked (e.g. Art. **89**: `15, 16, 18` linked, `19, 20, 21` not).
- **Mitigation:** `normalizeSpaceEntitiesForCitationPlainText` runs at the start of GDPR citation linking and Charter/TFEU wrapping — **do not remove** without replacing with an equivalent that restores spacing semantics for regexes.

**Guardrail:** ETL may keep NBSP in JSON (typical for EU texts). The client **must** normalize entities before regex-based linking, or normalize NBSP to U+0020 at scrape time **consistently** (and then re-test citations).

---

## 5. Recitals

- **Input:** `rawText` with optional blank-line paragraph splits; CRLF normalized.
- **GDPR-Info HTML:** `scraper.js` splits each `<p>` on `<sup>n</sup>` so clauses become separate lines (same structure as [gdpr-info.eu recital pages](https://gdpr-info.eu/recitals/no-1/)).
- **Heuristic blocks:** Double newlines define paragraphs; single newlines inside a block are collapsed to spaces.
- **Inline “1Clause 2Clause”** (EUR-Lex): `splitInlineNumberedClauses` → bullet list via `renderDocBulletList` (includes orphan `(a)` / `(1)` merging like articles).
- **Recital-only guardrail:** `splitGluedNumericClauseMarkers` in `document-formatting-guardrails.js` repairs “…purposes. 2In such…” when a line was glued; it is **not** applied to article bodies (avoids breaking “Article 8. 2…”-style references).
- **Long single-paragraph recitals:** Possible sentence pairing when many short sentences — changing thresholds affects layout only, not legal text.

---

## 6. ETL / scraper obligations (source refresh “bible”)

**On every refresh** (button, `POST /api/refresh`, daily cron), `scraper.js` calls **`normalizeCorpus`** from `document-formatting-guardrails.js` on the final `recitals` and `articles` before `buildSearchIndex` and `fs.writeFileSync`. Do not skip this step when adding new write paths.

**GDPR-Info extraction:** `.entry-content` is walked in document order (`<p>`, `<ol>/<ul>/<li>` with nesting, footnote `<div>`s). Articles that are list-only (e.g. Art. 1, 5) and definition lists (Art. 4) require this; a `<p>`-only pass misses the legal text.

**Default corpus source:** With `GDPR_ETL_PRIMARY=gdpr-info` (default), article and recital bodies are taken from **gdpr-info.eu** `.entry-content` (same presentation as the public pages you use for spot checks). EUR-Lex text differs in whitespace and line breaks; use it only when you intentionally set `GDPR_ETL_PRIMARY=eur-lex`.

When changing `scraper.js` or any step that writes `gdpr-content.json`:

1. **Preserve `number`** for articles 1–99 and recitals 1–173; do not shift or merge without a migration plan.
2. **Article `text` body** should start consistently after the title line (duplicate title in body is tolerated; stripper handles it, but avoid unnecessary duplication).
3. **Numbered paragraphs:** Prefer preserving `N.` at the **start of a line** (after optional horizontal space), with **whitespace after the dot** before prose — matches manual parser expectations.
4. **Lists like `Articles 15, 16, 18, …`:** Commas may be followed by NBSP in official HTML; that is OK if client entity normalization remains (section 4.2).
5. **Art. 4 “Definitions”:** Keep `For the purposes of this Regulation:` and definition lines starting with `‘` or numeric-quote patterns so `renderArt4Definitions` activates.
6. **Article bodies:** parenthetical **`(Recital N)`** / **`[Recital N]`** are **removed** in **`normalizeArticle`** and on the client (**`stripParentheticalRecitalsFromArticlePlain`**) so articles stay readable; cross-refs live in **Suitable recitals** / dedicated recital docs, not inline chrome.
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
| **Art. 1-99** | Three numbered paragraphs; no spurious empty list items |
| **Art. 1-99** | §1–§4; lettered `(a)`–`(d)` under §2 intact |
| **Art. 1-99** | Definition list + recital refs readable |
| **Art. 1-99** | Special list layouts |
| **Art. 1-99** | Second paragraph: `Articles 15, 16, 18, 19, 20 and 21` — **all** article numbers are in-app links |
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
| Line formatting | `fmtArticleLine`, `fmtRecitalLine`, `fmtArticleMultiline`, `formatInlineFootnotes`, `stripEurLexClauseNumberMarkers`, `stripParentheticalRecitalsFromArticlePlain` |
| Reader chrome | `public/styles.css` — `.article-doc`, `.art-para-list`, `.recital-doc` |
| JSON + refresh | `data/gdpr-content.json`, `scraper.js`, **`document-formatting-guardrails.js`**, `server.js` (`/api/refresh` returns `formattingGuardrails`) |

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
