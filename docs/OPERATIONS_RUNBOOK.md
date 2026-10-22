# Operations runbook  
## Regulation Q&A Platform

**Version:** 2.9 · **Last updated:** 2026-10-22 · Documentation standard **v2.9** · Product **1.2.9** · Audit date **2026-10-22**

Procedures for **local development**, **production (Vercel)**, and **routine maintenance** across **nine instruments** (`gdpr`, `ai-act`, `data-act`, `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-open-data`, `us-admt`). Pair with [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md), [TECH_GUIDELINES.md](TECH_GUIDELINES.md), and [GUARDRAILS.md](GUARDRAILS.md). There is **no end-user authentication**; the only secured route is the cron handler.

---

## 1. Service overview

| Item | Value |
|------|--------|
| **Process** | `node server.js` (Express) |
| **Default port** | `3847` (`PORT` env) |
| **Health** | `GET /health` → `ok` |
| **UI** | Static `public/` + SPA fallback |
| **Writable data** | `data/` (local) or `GDPR_DATA_DIR` (Vercel `/tmp/gdpr-qa-data`) |
| **Instruments** | 3 EU + 3 Indonesia + 3 United States; list via `GET /api/regulations` |
| **Tests** | `npm test` (`node --test test/*.test.js`) — Indo + US parity + browse routes + reader view; **40 pass / 17 suites** |

---

## 2. Start and stop (local)

### Start

```bash
cd gdpr-qa-platform
npm install
cp .env.example .env   # set GROQ_API_KEY, optional TAVILY_API_KEY
npm start
```

Open **http://localhost:3847**. Use **http://** not `file://` (News attachments require same-origin API).

### Stop / restart

```bash
lsof -ti :3847 | xargs kill -9
npm start
```

Exit code **137** on a background task usually means the process was killed during restart — expected.

### Run tests before any release

```bash
npm test
```

Expected (2026-10-22): **`npm test` → 40 tests / 17 suites / 0 failures** across **`indo-parity.test.js`**, **`us-parity.test.js`** (incl. Ask retrieval + sources fallback), **`browse-routes.test.js`**, and **`reader-view.test.js`**. Run on every change touching `lib/regulations.js`, `id-law-scraper.js`, `us-law-scraper.js`, `news-crawler.js`, `news-topics.js`, `public/app.js` / `index.html` reader chrome, or `data/*.json`. Unstable tests must be stabilized before merge.

---

## 3. Routine maintenance

| Task | Command / action | Frequency |
|------|------------------|-----------|
| Refresh GDPR corpus | UI **Refresh sources** (GDPR selected) or `npm run refresh` (**GDPR only**) | Weekly or after EUR-Lex updates |
| Refresh AI Act corpus | UI **Refresh sources** (AI Act selected) or `npm run refresh-ai-act` | As needed |
| Refresh Data Act corpus | UI **Refresh sources** (Data Act selected) or `npm run refresh-data-act` | As needed |
| **Refresh UU PDP corpus** | UI (UU PDP selected) or `npm run refresh-id-pdp` | As needed / after JDIH changes |
| **Refresh Satu Data corpus** | UI (Satu Data selected) or `npm run refresh-id-satu-data` | As needed |
| **Refresh SE AI Ethics corpus** | UI (SE AI Ethics selected) or `npm run refresh-id-ai-ethics` | As needed; also when Komdigi signs the AI-ethics / AI-roadmap Perpres (update structure sources, see §3.1) |
| **Refresh US CCPA corpus** | UI (US CCPA selected) or `npm run refresh-us-ccpa` | As needed / after CPPA compilation updates |
| **Refresh Colorado ADMT corpus** | UI (US CO ADMT selected) or `npm run refresh-us-admt` | As needed / after Colorado session-law updates |
| **Refresh OPEN Data corpus** | UI (US OPEN Data selected) or `npm run refresh-us-open-data` | As needed |
| Refresh **all nine** | Wait for daily cron (02:00) or `POST /api/refresh` once per `regulation` id | Daily (automatic) |
| Refresh news (EU + Indonesia + United States) | UI **Refresh news** or `POST /api/news/refresh` | Daily / weekly |
| Regenerate chapter summaries | `POST /api/chapter-summaries/regenerate` (+ `regulation`) + Groq key | After major corpus change |
| Update suitable recitals | `npm run fetch-suitable-recitals` | Occasional (GDPR only) |
| Verify guardrails | Check `formattingGuardrails` in refresh API response | After ETL code changes |
| Run test suite | `npm test` | Before every release / PR |

### 3.1 Indonesian refresh scripts

| Script | Equivalent | Output | Typical `etl.extractedFrom` |
|--------|-----------|--------|-----------------------------|
| `npm run refresh-id-pdp` | `node id-law-scraper.js id-pdp` | `data/id-pdp-content.json` | `jdih-komdigi` |
| `npm run refresh-id-satu-data` | `node id-law-scraper.js id-satu-data` | `data/id-satu-data-content.json` | `jdih-kemenkoinfra-pdf` |
| `npm run refresh-id-ai-ethics` | `node id-law-scraper.js id-ai-ethics` | `data/id-ai-ethics-content.json` | `jdih-komdigi` |

How the Indonesian ETL behaves (so operators are not surprised):

- It **keeps the bundled official corpus** when the live JDIH HTML extract is incomplete — a log line "keeping bundled official … corpus" or "live … extract incomplete" is **normal**, not a failure.
- It writes only when the dataset hash changed, the file is missing, the index is empty, or a force flag is set: `ID_PDP_FORCE_CORPUS_WRITE=1`, `ID_SATU_DATA_FORCE_CORPUS_WRITE=1`, `ID_AI_ETHICS_FORCE_CORPUS_WRITE=1` (or global `GDPR_FORCE_CORPUS_WRITE=1`).
- Minimum counts guard against truncated data: `MIN_ID_PDP_ARTICLES` / `_RECITALS`, `MIN_ID_SATU_DATA_*`, `MIN_ID_AI_ETHICS_*` (defaults from the registry: 76/4, 40/4, 7/9). Falling below them with no usable existing corpus aborts with `… ETL incomplete` (exit 1; `POST /api/refresh` → **500**).
- **Rebuilding corpora from scratch** (maintainers only): `python3 scripts/build-id-corpora.py` uses downloaded sources in git-ignored `tmp-id-etl/` (UU 27/2022 PDF, Perpres 39/2019 PDF/text). Review the script's hard-coded scratch path before running on another machine; then run the three `refresh-id-*` scripts and `npm test`, and commit the updated `data/id-*.json` only after review. United States rebuild: `python3 scripts/build-us-corpora.py` from git-ignored `tmp-us-etl/` (CPPA PDF extract, Colorado session-law HTML, govinfo P.L. 115-435), then `npm run refresh-us-ccpa` / `refresh-us-admt` / `refresh-us-open-data`.
- **After changing a corpus,** also review the matching `chapter-summaries-id-*.json` if chapter structure changed.

### 3.1b United States refresh scripts

| Script | Equivalent | Output | `meta.etl.extractedFrom` |
|--------|-----------|--------|--------------------------|
| `npm run refresh-us-ccpa` | `node us-law-scraper.js us-ccpa` | `data/us-ccpa-content.json` (33 sections, 5 purpose notes) | `cppa-jan2025-compilation` |
| `npm run refresh-us-admt` | `node us-law-scraper.js us-admt` | `data/us-admt-content.json` (14 / 5) | `colo-sess-laws-2026-ch131` |
| `npm run refresh-us-open-data` | `node us-law-scraper.js us-open-data` | `data/us-open-data-content.json` (10 / 4) | `govinfo-plaw-115publ435` |

How the United States ETL behaves:

- It **pings** the official source (`reg.infoBaseUrl`: CPPA, Colorado General Assembly, govinfo) and logs `keeping bundled official … corpus (source reachable|unreachable)`. An **unreachable** source is a warning, not a failure, when the bundle meets the floor — the corpus is never replaced from live HTML.
- It writes only when the dataset hash changed, the file/index is missing, or a force flag is set: `US_CCPA_FORCE_CORPUS_WRITE=1`, `US_ADMT_FORCE_CORPUS_WRITE=1`, `US_OPEN_DATA_FORCE_CORPUS_WRITE=1` (or global `GDPR_FORCE_CORPUS_WRITE=1`).
- Floors: `MIN_US_CCPA_ARTICLES` / `_RECITALS` (30 / 5), `MIN_US_ADMT_*` (12 / 5), `MIN_US_OPEN_DATA_*` (8 / 4). Falling below the article floor aborts with `… ETL incomplete` (exit 1; `POST /api/refresh` → **500**) and leaves the bundle untouched.
- Rebuild from scratch (maintainers only): `python3 scripts/build-us-corpora.py` (scratch `tmp-us-etl/`), then the three `refresh-us-*` scripts and `npm test`; review `chapter-summaries-us-*.json` if chapter structure changed.

### 3.2 Indonesian news refresh

`POST /api/news/refresh` (UI **Refresh news**) runs the EU crawl **and** `crawlIndonesiaOfficialNews`: Antara policy tag hubs (`uu-pdp`, `data-pribadi`, Satu Data and AI-ethics tags, `komdigi`), Antara RSS (Hukum, Tekno, English), Komdigi HTML, Setkab feed, and `data.go.id` portal. Notes:

- **Komdigi** HTML is best-effort and can be **WAF-blocked** (log: `News crawler (Komdigi …): HTTP … (bot/WAF block)`); this is expected, other sources still populate.
- `data.go.id` is a SPA — few links are normal.
- If the Indonesian-filtered News tab is empty, run **Refresh news** first; the empty-state copy says the same.
- Persisted items live in `data/gdpr-news.json` (shared EU + Indonesia + United States). `npm test` asserts it contains Antara / Satu Data items.

### 3.3 United States news refresh

The same `POST /api/news/refresh` also runs `crawlUnitedStatesOfficialNews`: FTC RSS/HTML (a Chrome-like User-Agent is **404**; crawler uses `Mozilla/5.0 (compatible; GDPRQnAPlatform/…)`), CPPA/CalPrivacy year announcement pages, California OAG news RSS, Colorado AG ADAI hub (`coag.gov/ai/` plus rulemaking PDF/DOCX), Federal Data Strategy, and `resources.data.gov`. Notes:

- **`data.gov/meta/` is 404** — default feed is `https://www.data.gov/`.
- Colorado AG HTML press-room is WordPress chrome; use RSS + WP JSON + the `/ai/` hub, not the press-room HTML listing.
- If a USA-filtered News tab (CCPA / OPEN Data / ADMT) is empty, run **Refresh news**; empty-state copy names FTC, CPPA, Colorado AG, and data.gov.
- `npm test` (`test/us-parity.test.js`) asserts persisted CPPA / OPEN Data / ADMT items.

---

## 4. Environment checklist

| Variable | Required for Ask | Notes |
|----------|------------------|-------|
| `GROQ_API_KEY` | Recommended | Primary LLM |
| `GROQ_MODEL` | Optional | Single or comma-separated model list; **set explicitly** if default models are unavailable (see §7) |
| `TAVILY_API_KEY` | Optional | Fallback when Groq fails |
| `CRON_SECRET` | Vercel cron | Bearer for daily regulation refresh (all nine) |
| `GDPR_DATA_DIR` | Vercel | Writable path; seeded from bundle |
| `NEWS_*` | Optional | Crawl depth, caps, timeouts |
| `MIN_ID_*`, `ID_*_FORCE_CORPUS_WRITE` | Optional | Indonesian ETL guards (§3.1) |
| `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, `MIN_US_OPEN_DATA_*`, `US_*_FORCE_CORPUS_WRITE` | Optional | United States ETL guards (§3.1b) |

Full dictionary: [VARIABLES.md](VARIABLES.md) · template: [.env.example](../.env.example).

---

## 5. Vercel production

1. Set env vars in project settings (never commit `.env`).
2. Deploy from `main`; `vercel.json` routes to `api/index.js`; `includeFiles` must ship `data/**` and scraper modules (`ai-act-scraper.js`, `data-act-scraper.js`, **`id-law-scraper.js`**, **`us-law-scraper.js`**).
3. Cron hits `/api/cron/daily-regulation-refresh` with `Authorization: Bearer $CRON_SECRET` and refreshes **all nine** instruments sequentially (allow up to `maxDuration` 300 s).
4. Expect **ephemeral** `/tmp` — bundled `data/*.json` is source of truth on cold start; **`SEED_FILES`** copies **29** JSON files (nine corpora, nine structures, news, nine chapter-summary files, GDPR suitable recitals) on first instance access. Verify `GET /api/regulations` returns **nine** entries with `jurisdiction`; GDPR has `hasArticleTopics`/`hasSuitableRecitals` `true`, the other eight `false`.

Detail: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).

---

## 6. Monitoring and smoke tests

### 6.1 API smoke (copy-paste)

```bash
BASE=http://localhost:3847
curl -s "$BASE/health"                               # ok
curl -s "$BASE/api/regulations" | python3 -c "import sys,json;print([(r['id'],r['jurisdiction']) for r in json.load(sys.stdin)['regulations']])"
for r in gdpr ai-act data-act id-pdp id-satu-data id-ai-ethics us-ccpa us-admt us-open-data; do
  echo -n "$r articles="; curl -s "$BASE/api/articles?regulation=$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
  echo -n "$r sources=";  curl -s "$BASE/api/meta?regulation=$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin)['sources']))"
done
```

### 6.2 Expected results

| Check | Expected |
|-------|----------|
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3847/` | `200` |
| `GET /api/regulations` | **Nine** ids in order `gdpr, data-act, ai-act, id-pdp, id-satu-data, id-ai-ethics, us-ccpa, us-open-data, us-admt`; `jurisdiction` `eu` ×3 / `id` ×3 / `us` ×3; GDPR `hasArticleTopics: true`; all others `false` |
| Article counts (`GET /api/articles?regulation=`) | `gdpr` 99 · `ai-act` 113 · `data-act` 50 · **`id-pdp` 76 · `id-satu-data` 44 · `id-ai-ethics` 7 · `us-ccpa` 33 · `us-admt` 14 · `us-open-data` 10** |
| `GET /api/meta?regulation=id-pdp` | `regulationId: id-pdp`, 4 `sources` (JDIH Komdigi, peraturan.go.id, JDIH Kemenko Infra, JDIH Kemenkeu), `etl.articleCount: 76` |
| `GET /api/meta?regulation=id-satu-data` | 4 `sources` incl. `data.go.id`; `etl.articleCount: 44` |
| `GET /api/meta?regulation=id-ai-ethics` | 2 `sources`; `etl.articleCount: 7`, `etl.recitalCount: 9` |
| `GET /api/meta?regulation=us-ccpa` / `us-admt` / `us-open-data` | `regulationId` matches; **3 `sources` each** (CPPA / leginfo / California OAG; Colorado GA bill / session laws / coag.gov AI; govinfo / data.gov / GSA); **no** GDPR-Info / EUR-Lex GDPR entries; `etl.articleCount` 33 / 14 / 10 |
| `GET /api/meta?regulation=ai-act` | `regulationId: ai-act`, `sources` array (never GDPR-Info / EUR-Lex fallback for non-GDPR) |
| **Ask on an Indonesian instrument** | `POST /api/answer {"query":"Apa hak subjek data pribadi?","regulation":"id-pdp","includeWeb":false}` → `regulationId: "id-pdp"`, non-empty `answer`, regulation `sources` with `[S#]` ids; `llm.provider` is `groq`, `tavily`, or `null` (extractive) depending on keys |
| **US Ask** | `POST /api/answer {"query":"How do I opt out of the sale of my personal information?","regulation":"us-ccpa","includeWeb":false}` → `regulationId: "us-ccpa"`, regulation `sources` labelled `CCPA § N`; no GDPR controller/processor wording; `us-open-data` answers never treat the 2014 DATA Act as the instrument |
| **Soft-law check** | `regulation: "id-ai-ethics"`, query "Is the circular legally binding?" → answer frames SE 9/2023 as guidance, **not** a statute |
| `GET /api/news` | `items` includes Indonesian sources (Antara / Satu Data) and United States sources (CPPA / FTC / OAG / Colorado AG / data.gov); `topicTaxonomy.groups` includes **Indonesia Personal Data Protection**, **Indonesia Satu Data**, **Indonesia AI Ethics**, **United States CCPA**, **United States OPEN Data**, **United States ADMT** |
| **Removed routes (1.2.6)** | `POST /api/ask` → **404**; `POST /api/summarize` → **404**; `GET /api/categories` and `/api/chapters/1` return the SPA HTML (200, not JSON) — they must not be used |
| Ask (with keys) | `POST /api/answer` returns `answer`, `sources`, `llm.used` |
| Data Act Art. 10 title | Browse → EU Data Act → Art. 10 → H2 **"Dispute settlement"** (not GDPR Art. 10 title) |
| Data Act Art. 4 long title | Browse → EU Data Act → Art. 4 → H2 shows full rights/obligations title (not bare "Article 4") |
| AI Act Art. 10 title | Browse → EU AI Act → Art. 10 → H2 **"Data and data governance"** |
| Citation sidebar (Data Act) | EU Data Act selected → open any article → sidebar says **Related Data Act articles** and links to **data-act-law.eu** |
| Citation sidebar (AI Act) | EU AI Act selected → sidebar says **Related AI Act recitals** and links to **ai-act-law.eu** |
| Reader paragraphs | AI Act Art. 6 or 99; Data Act Art. 4 shows `1.` / `2.` blocks and `(a)` sublists |

### 6.3 UI smoke — region picker and Indonesian instruments

| Check | Expected |
|-------|----------|
| Region picker | Header **Region**: All / EU / Indonesia / USA. **EU** → 3 EU instruments, chip "European Union"; **Indonesia** → 3 Indonesian instruments (default **UU PDP**); **USA** → CCPA, OPEN Data, CO ADMT (default **US CCPA**), chip "United States"; **All** → grouped options. Reload keeps the choice (`gdpr-qa-region-v1`). |
| Browse welcome (≥900px) | **Nine** cards in three region sections; region filter hides the other sections; **Chapters** button above **Recitals** |
| UU PDP Browse | Select UU PDP → Chapters shows 16 BAB and Pasal 1–76; Recitals shows **Menimbang a–d** |
| Satu Data Browse | Pasal 1–44 in 8 BAB; Recitals 4 |
| SE AI Ethics Browse | 7 sections; Recitals tab shows the **nine ethical values**; no category/sub-category filter shown (GDPR only) |
| Credible sources (Indonesian) | Cards show JDIH / peraturan.go.id etc.; **no** EUR-Lex/EDPB cards |
| News (Indonesian instrument) | Scope banner visible; list limited to Indonesian-relevant items; empty ⇒ **Refresh news** hint |
| News (United States instrument) | USA region + CCPA / OPEN Data / ADMT show official U.S. headlines (CalPrivacy, FDS/data.gov, Colorado ADAI hub); no ICO leak |
| Mobile Tools (375px) | **Tools** opens; `#headerFreshnessHint` non-empty after load; no duplicate status strip in header |
| News hero (≤899px) | News tab: hero collapsed; **Show details** reveals 1-column intro + scope; **Sync** runs refresh |
| Chapters filter bleed | GDPR: set sub-category → switch EU Data Act → Chapters with All filters → articles listed |
| Mobile chapters filters | ≤899px: **Filters** collapsed by default; expand shows chapter + article; **Clear filters** works |

---

## 7. Common issues

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Ask always extractive | Missing/invalid Groq key | Set `.env` or BYOK; check server log on start |
| Ask never uses Groq; log shows `model_not_found` / `model_decommissioned` | Default Groq model list (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`) not available to the key (observed in a 2026-10-20 local smoke test; Ask then fell back to Tavily) | Set `GROQ_MODEL` to a model currently listed for your Groq account (`GET https://api.groq.com/openai/v1/models`); no code change needed. Tracked as a follow-up for the model default list. |
| Empty Browse | Missing content JSON | Run refresh or verify `data/*-content.json` exists (nine files) |
| Indonesian refresh logs "keeping bundled official corpus" | Live JDIH HTML thin or unchanged | Normal; confirm `etl.fetched: true` and counts |
| `… ETL incomplete: articles x/y` (exit 1 / 500) | Existing corpus below `MIN_ID_*` / `MIN_US_*` (and, for ID, live extract failed) | Restore `data/id-*.json` / `data/us-*.json` from git; or lower `MIN_*` only if the instrument legitimately changed |
| Indonesian News empty | No refresh yet / Komdigi WAF block | Run **Refresh news**; check logs; Antara tag hubs usually still populate |
| News attachments fail | Opened `index.html` as file | Use `npm start` URL |
| Stale news in browser | Cached JSON | `GET /api/news` sends `no-store`; hard refresh |
| Credible sources empty for AI Act / Data Act / Indonesian | Wrong regulation / missing structure | Select the right instrument; verify `data/<id>-structure.json` has `meta.sources` (by design there is **no** GDPR fallback) |
| Sidebar still says "GDPR" | Stale `app.js` / hard refresh needed | Hard refresh; verify `syncCitationSidebarChrome` in build |
| Region chip / list wrong after update | Stale `regulation-profiles-id.js` / `regulation-profiles-us.js` or `localStorage` | Hard refresh; clear `gdpr-qa-region-v1` / `gdpr-qa-regulation-v1` |
| USA News empty / ICO items visible under USA | Store not refreshed or stale client | Run **Refresh news**; hard refresh; confirm `gdpr-news.json` has CPPA / Colorado / data.gov items (`us-parity` asserts it) |
| News empty with a scoped instrument selected | Filter too strict | Switch to GDPR for full list; widen search/filters |
| Cron timeouts on Vercel | Nine sequential ETLs + `maxDuration` 300 | Check function logs; refresh locally and commit `data/` if needed |

---

## 8. Security operations

- **Never** commit `.env`, API keys, or `CRON_SECRET`.
- BYOK keys stay in **browser localStorage** only; sent per request, not stored server-side.
- There is **no end-user authentication**; do not place secrets in the public SPA or corpora.
- Rotate keys if exposed; update Vercel env and notify users to re-save BYOK.

See [GUARDRAILS.md](GUARDRAILS.md) **TG-SEC-*** and **BG-08**.

---

## 9. Escalation and ownership

| Area | Owner (typical) | Doc |
|------|-----------------|-----|
| Product scope | Product / legal liaison | [PRD.md](PRD.md), [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) |
| ETL / corpus (EU) | Engineering | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) |
| ETL / corpus (Indonesia) | Engineering + Indonesian legal reviewer | `id-law-scraper.js`, §3.1 |
| ETL / corpus (United States) | Engineering | `us-law-scraper.js`, `scripts/build-us-corpora.py` |
| LLM / Ask | Engineering | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) |
| News crawler | Engineering | `news-crawler.js`, [VARIABLES.md](VARIABLES.md) §7 |
| Design / UX | Design + frontend | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) |

---

## See also

- [CHANGELOG.md](../CHANGELOG.md)  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) — operational KPIs
