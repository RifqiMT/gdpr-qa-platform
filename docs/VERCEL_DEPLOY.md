# Deploying to Vercel (production)

**Version:** 3.2 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23** · `SEED_FILES` = 41

This guide covers deploying the **Regulation Q&A Platform** (thirteen instruments: GDPR, EU AI Act, EU Data Act, UU PDP, Satu Data Indonesia, SE AI Ethics, US CCPA, US OPEN Data, US CO ADMT, ISO 27701, ISO 19941, ISO 23894, SOC 2) as a **Vercel serverless** Node app. Local development (`npm start`) is unchanged. The app has **no end-user authentication**; only the cron route is secret-protected.

---

## Architecture on Vercel

| Component | Local | Vercel |
|-----------|-------|--------|
| HTTP server | `app.listen()` in `server.js` | `api/index.js` exports the Express app |
| Static SPA | `public/` via Express | Same (rewritten to `/api`) |
| Regulation data | `data/*.json` (read/write) | Bundled `data/` (read-only) + writable copy under `/tmp/gdpr-qa-data` per instance |
| Daily ETL cron | `node-cron` in `server.js` (02:00 `Europe/Brussels`) | [Vercel Cron](https://vercel.com/docs/cron-jobs) → `api/cron/daily-regulation-refresh.js` (02:00 UTC) |

```mermaid
flowchart LR
  User[Browser] --> Vercel[Vercel Edge / CDN]
  Vercel --> API["api/index.js (Express)"]
  API --> Bundle["Bundled data/ (41 JSON files)"]
  API --> Tmp["/tmp/gdpr-qa-data"]
  Cron[Vercel Cron 02:00 UTC] --> CronFn["api/cron/daily-regulation-refresh.js"]
  CronFn --> ETL[runRegulationScraperAndReloadContent x13]
  ETL --> Tmp
  ETL --> S1["scraper.js (gdpr)"]
  ETL --> S2["ai-act-scraper.js"]
  ETL --> S3["data-act-scraper.js"]
  ETL --> S4["id-law-scraper.js (id-pdp, id-satu-data, id-ai-ethics)"]
  ETL --> S5["us-law-scraper.js (us-ccpa, us-admt, us-open-data)"]
  ETL --> S6["iso-soc-scraper.js (iso-27701, iso-19941, iso-23894, soc2)"]
```

---

## Prerequisites

1. [Vercel account](https://vercel.com) and [Vercel CLI](https://vercel.com/docs/cli) (optional).
2. GitHub repo connected to Vercel (recommended) or `vercel` CLI from this directory.
3. **Node ≥ 18** (set in Project → Settings → General if needed).
4. **Pro plan** (or equivalent) if you need function durations above **10 seconds** (Hobby limit). This app sets `maxDuration: 300` for regulation refresh and long news crawls; the cron runs **thirteen** ETLs sequentially, so Hobby limits are not sufficient for it.

---

## One-time setup

### 1. Import project

- **Root directory:** repository root (`gdpr-qa-platform` if monorepo subfolder).
- **Framework preset:** Other (no framework auto-detection).
- **Build command:** `npm run vercel-build` (copies `article-suitable-recitals.json` into `public/`).
- **Install command:** `npm install`.
- **Output directory:** leave empty (serverless, not static export).

`vercel.json` in the repo already configures rewrites, function limits, `includeFiles`, and the daily cron schedule:

```json
"includeFiles": "data/**,ai-act-scraper.js,data-act-scraper.js,id-law-scraper.js,us-law-scraper.js,iso-soc-scraper.js"
```

Both functions (`api/index.js`, `api/cron/daily-regulation-refresh.js`) must keep **`id-law-scraper.js`**, **`us-law-scraper.js`**, and **`iso-soc-scraper.js`** in `includeFiles` (together with `ai-act-scraper.js` and `data-act-scraper.js`); otherwise refreshing `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-admt`, `us-open-data`, `iso-27701`, `iso-19941`, `iso-23894`, or `soc2` fails on Vercel with a module-not-found error.

### 2. Environment variables

Set in **Project → Settings → Environment Variables** for **Production** (and Preview if desired):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | Recommended | Server-side Ask LLM (users can still use BYOK) |
| `GROQ_MODEL` | Optional | Comma-separated Groq model list; set if the built-in defaults are unavailable to your account |
| `TAVILY_API_KEY` | Optional | Tavily fallback when Groq fails |
| `CRON_SECRET` | **Required for cron** | Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes |

Optional tuning: same keys as `.env.example` (`NEWS_*`, `GDPR_*`, `MIN_ID_*`, `MIN_US_*`, `MIN_ISO_27701_*` / `MIN_ISO_19941_*` / `MIN_ISO_23894_*` / `MIN_SOC2_*`, `ID_*_FORCE_CORPUS_WRITE`, `US_*_FORCE_CORPUS_WRITE`, `ISO_*_FORCE_CORPUS_WRITE` / `SOC2_FORCE_CORPUS_WRITE`, `WEB_*`). Ask uses **Groq → Tavily → extractive** only; other LLM providers are not supported (removed in 1.2.6).

**Do not** commit `.env` or paste secrets into the repository.

### 3. Deploy

```bash
cd gdpr-qa-platform
npm test            # 58 tests / 24 suites must pass before deploying
npx vercel          # preview
npx vercel --prod   # production
```

Or push to `main` with Git integration.

---

## What works in production

- Full SPA: region picker (All / EU / Indonesia / USA / INTL), Browse, Ask (BM25 + Groq/Tavily), BYOK, News (read bundled/cached JSON, EU + Indonesia + United States + International), Credible sources, PDF export — for **all thirteen** instruments.
- `GET /api/meta`, `GET /api/regulations`, health route `GET /health`, validation `POST /api/validate-api-keys`.
- **Ask** (`POST /api/answer`) with server keys and/or user BYOK keys.

## Limitations (important)

1. **Ephemeral writes** — On Vercel, JSON writes (regulation refresh, news refresh, chapter summaries) go to `/tmp/gdpr-qa-data`. That storage is **per serverless instance** and **not shared** across instances; it can be cleared on cold start. Production should rely on **committed `data/` in the repo** (or run the refresh scripts locally and push updated JSON until external storage is added).
2. **Long operations** — `POST /api/news/refresh` and regulation ETL can exceed Hobby timeouts. Use Pro + `maxDuration` in `vercel.json`, or refresh data offline and redeploy.
3. **Cron** — Daily regulation refresh at **02:00 UTC** (`0 2 * * *`) updates `/tmp` on the cron invocation only; it does not update the git bundle. For authoritative corpus updates, refresh locally and commit the thirteen `data/*-content.json` files (and `data/gdpr-news.json`).
4. **Indonesian sources** — Komdigi HTML may be **WAF-blocked** from Vercel IPs and `data.go.id` is a SPA; Indonesian News may rely on Antara and Setkab. The Indonesian corpus ETL **keeps the bundled official text** when live JDIH HTML is incomplete, so a thin live fetch does not degrade Browse/Ask.
5. **United States sources** — The US ETL only pings CPPA / Colorado General Assembly / govinfo and **always keeps the bundled official corpus**; an unreachable source never degrades Browse/Ask. FTC rejects Chrome-like User-Agents (404), so the crawler sends a compatible UA; USA News depends on the persisted `gdpr-news.json` seed until the first successful **Refresh news**.
6. **International sources** — The ISO / SOC 2 ETL only pings ISO.org / AICPA pages and **always keeps the bundled educational overlay** (no paywalled body text is fetched); an unreachable source never degrades Browse/Ask. INTL News depends on the persisted `gdpr-news.json` catalogue seed until the first successful **Refresh news**; ISO / AICPA listings can be thin from datacenter IPs.
7. **BYOK** — Keys stay in the browser; they are sent to your Vercel deployment over HTTPS only when the user asks or validates keys.

---

## Cron job

- **Path:** `/api/cron/daily-regulation-refresh`
- **Schedule:** `0 2 * * *` (see `vercel.json`)
- **Auth:** `CRON_SECRET` must match `Authorization: Bearer …` (Vercel sets this automatically when `CRON_SECRET` is configured). Missing/mismatched secret → **401**.
- **Scope — all thirteen instruments, sequential:** `gdpr` → `ai-act` → `data-act` → `id-pdp` → `id-satu-data` → `id-ai-ethics` → `us-ccpa` → `us-admt` → `us-open-data` → `iso-27701` → `iso-19941` → `iso-23894` → `soc2`. Any failure aborts the run with **500** `{ ok: false, error }`; instruments after the failing one are not refreshed in that invocation.
- **Response:** `{ ok, job: "daily-regulation-refresh", gdpr, aiAct, dataAct, idPdp, idSatuData, idAiEthics, usCcpa, usAdmt, usOpenData, iso27701, iso19941, iso23894, soc2 }`, each `{ lastRefreshed, lastChecked }`.

Manual test (replace values):

```bash
curl -X GET "https://YOUR_DEPLOYMENT.vercel.app/api/cron/daily-regulation-refresh" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expect `ok: true` and thirteen non-null `lastChecked` values.

---

## Files added for Vercel

| File | Role |
|------|------|
| `vercel.json` | Rewrites, function config (`includeFiles` incl. `id-law-scraper.js`, `us-law-scraper.js`, `iso-soc-scraper.js` for both functions), crons (`0 2 * * *` → thirteen instruments) |
| `api/index.js` | Serverless entry → Express `app` |
| `api/cron/daily-regulation-refresh.js` | Cron handler (all thirteen regulations) |
| `lib/paths.js` | `getDataDir()` — bundle vs `/tmp`; **`SEED_FILES`** manifest (**41** JSON files) |
| `.vercelignore` | Exclude `.env`, logs, `tmp-id-etl/`, `tmp-us-etl/` |

---

## Seed manifest (`SEED_FILES` — 41 files)

On first access per serverless instance, `lib/paths.js` copies these files from bundled `data/` into `/tmp/gdpr-qa-data` **only when the destination file is missing**. See [VARIABLES.md](VARIABLES.md) §1.1 for the full 41-file table (thirteen corpora, thirteen structures, thirteen chapter summaries, news, GDPR suitable recitals).

Override writable root with `GDPR_DATA_DIR`. **Adding a data file?** Add it to `SEED_FILES`, otherwise Vercel cold starts will not see it.

### Post-deploy verification

```bash
BASE=https://YOUR_DEPLOYMENT.vercel.app
curl -s "$BASE/health"                                   # ok
curl -s "$BASE/api/regulations"                          # thirteen regulations, jurisdiction eu/id/us/intl
curl -s "$BASE/api/meta?regulation=data-act"             # Data Act metadata
curl -s "$BASE/api/meta?regulation=id-pdp"               # etl.articleCount 76, 4 sources
curl -s "$BASE/api/articles?regulation=id-ai-ethics"     # 7 sections
curl -s "$BASE/api/articles?regulation=us-ccpa"          # 33 Civil Code sections
curl -s "$BASE/api/articles?regulation=us-admt"          # 14 ADMT sections
curl -s "$BASE/api/articles?regulation=us-open-data"     # 10 OPEN Data sections
curl -s "$BASE/api/articles?regulation=iso-27701"       # 14 ISO 27701 clauses
curl -s "$BASE/api/articles?regulation=soc2"            # 20 SOC 2 criteria
curl -s "$BASE/api/meta?regulation=iso-23894"           # ISO/AICPA sources only, no GDPR-Info / EUR-Lex
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| 504 on Ask / refresh | Function timeout; upgrade plan or reduce crawl scope |
| Empty regulation after deploy | Missing `data/<id>-content.json` in repo (check all thirteen); run the refresh script locally and commit |
| Indonesian regulation empty / refresh 500 on Vercel | `id-law-scraper.js` missing from `includeFiles`, or an `id-*` file missing from `SEED_FILES` / `data/` |
| US regulation empty / refresh 500 on Vercel | `us-law-scraper.js` missing from `includeFiles`, or a `us-*` file missing from `SEED_FILES` / `data/` |
| International regulation empty / refresh 500 on Vercel | `iso-soc-scraper.js` missing from `includeFiles`, or an `iso-*` / `soc2` file missing from `SEED_FILES` / `data/` |
| Cron 401 | `CRON_SECRET` missing or mismatch |
| Cron 500 partway | One ETL failed (sequential); check logs for the instrument named in the error |
| Attachments / news stale | Instance using bundled JSON; run local news refresh and commit `data/gdpr-news.json` |
| Ask never uses Groq | Default model list unavailable to key; set `GROQ_MODEL` (see [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) §7) |

---

## Related docs

- [README.md](../README.md) — Quick start (local)
- [ARCHITECTURE.md](ARCHITECTURE.md) — System overview
- [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) — Smoke tests and refresh scripts
- [GUARDRAILS.md](GUARDRAILS.md) — BG-08 / TG limits for BYOK and hosting
