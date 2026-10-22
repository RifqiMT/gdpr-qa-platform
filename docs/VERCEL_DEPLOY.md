# Deploying to Vercel (production)

**Version:** 2.9 · **Last updated:** 2026-10-22 · Documentation standard **v2.9** · Product **1.2.9** · Audit date **2026-10-22** · `SEED_FILES` = 29

This guide covers deploying the **Regulation Q&A Platform** (nine instruments: GDPR, EU AI Act, EU Data Act, UU PDP, Satu Data Indonesia, SE AI Ethics, US CCPA, US OPEN Data, US CO ADMT) as a **Vercel serverless** Node app. Local development (`npm start`) is unchanged. The app has **no end-user authentication**; only the cron route is secret-protected.

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
  API --> Bundle["Bundled data/ (29 JSON files)"]
  API --> Tmp["/tmp/gdpr-qa-data"]
  Cron[Vercel Cron 02:00 UTC] --> CronFn["api/cron/daily-regulation-refresh.js"]
  CronFn --> ETL[runRegulationScraperAndReloadContent x9]
  ETL --> Tmp
  ETL --> S1["scraper.js (gdpr)"]
  ETL --> S2["ai-act-scraper.js"]
  ETL --> S3["data-act-scraper.js"]
  ETL --> S4["id-law-scraper.js (id-pdp, id-satu-data, id-ai-ethics)"]
  ETL --> S5["us-law-scraper.js (us-ccpa, us-admt, us-open-data)"]
```

---

## Prerequisites

1. [Vercel account](https://vercel.com) and [Vercel CLI](https://vercel.com/docs/cli) (optional).
2. GitHub repo connected to Vercel (recommended) or `vercel` CLI from this directory.
3. **Node ≥ 18** (set in Project → Settings → General if needed).
4. **Pro plan** (or equivalent) if you need function durations above **10 seconds** (Hobby limit). This app sets `maxDuration: 300` for regulation refresh and long news crawls; the cron runs **nine** ETLs sequentially, so Hobby limits are not sufficient for it.

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
"includeFiles": "data/**,ai-act-scraper.js,data-act-scraper.js,id-law-scraper.js,us-law-scraper.js"
```

Both functions (`api/index.js`, `api/cron/daily-regulation-refresh.js`) must keep **`id-law-scraper.js`** and **`us-law-scraper.js`** in `includeFiles`; otherwise refreshing `id-pdp`, `id-satu-data`, `id-ai-ethics`, `us-ccpa`, `us-admt`, or `us-open-data` fails on Vercel with a module-not-found error.

### 2. Environment variables

Set in **Project → Settings → Environment Variables** for **Production** (and Preview if desired):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | Recommended | Server-side Ask LLM (users can still use BYOK) |
| `GROQ_MODEL` | Optional | Comma-separated Groq model list; set if the built-in defaults are unavailable to your account |
| `TAVILY_API_KEY` | Optional | Tavily fallback when Groq fails |
| `CRON_SECRET` | **Required for cron** | Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes |

Optional tuning: same keys as `.env.example` (`NEWS_*`, `GDPR_*`, `MIN_ID_*`, `MIN_US_*`, `ID_*_FORCE_CORPUS_WRITE`, `US_*_FORCE_CORPUS_WRITE`, `WEB_*`). Ask uses **Groq → Tavily → extractive** only; other LLM providers are not supported (removed in 1.2.6).

**Do not** commit `.env` or paste secrets into the repository.

### 3. Deploy

```bash
cd gdpr-qa-platform
npm test            # 40 tests / 17 suites must pass before deploying
npx vercel          # preview
npx vercel --prod   # production
```

Or push to `main` with Git integration.

---

## What works in production

- Full SPA: region picker (All / EU / Indonesia / USA), Browse, Ask (BM25 + Groq/Tavily), BYOK, News (read bundled/cached JSON, EU + Indonesia + United States), Credible sources, PDF export — for **all nine** instruments.
- `GET /api/meta`, `GET /api/regulations`, health route `GET /health`, validation `POST /api/validate-api-keys`.
- **Ask** (`POST /api/answer`) with server keys and/or user BYOK keys.

## Limitations (important)

1. **Ephemeral writes** — On Vercel, JSON writes (regulation refresh, news refresh, chapter summaries) go to `/tmp/gdpr-qa-data`. That storage is **per serverless instance** and **not shared** across instances; it can be cleared on cold start. Production should rely on **committed `data/` in the repo** (or run the refresh scripts locally and push updated JSON until external storage is added).
2. **Long operations** — `POST /api/news/refresh` and regulation ETL can exceed Hobby timeouts. Use Pro + `maxDuration` in `vercel.json`, or refresh data offline and redeploy.
3. **Cron** — Daily regulation refresh at **02:00 UTC** (`0 2 * * *`) updates `/tmp` on the cron invocation only; it does not update the git bundle. For authoritative corpus updates, refresh locally and commit the nine `data/*-content.json` files (three per jurisdiction) (and `data/gdpr-news.json`).
4. **Indonesian sources** — Komdigi HTML may be **WAF-blocked** from Vercel IPs and `data.go.id` is a SPA; Indonesian News may rely on Antara and Setkab. The Indonesian corpus ETL **keeps the bundled official text** when live JDIH HTML is incomplete, so a thin live fetch does not degrade Browse/Ask.
5. **United States sources** — The US ETL only pings CPPA / Colorado General Assembly / govinfo and **always keeps the bundled official corpus**; an unreachable source never degrades Browse/Ask. FTC rejects Chrome-like User-Agents (404), so the crawler sends a compatible UA; USA News depends on the persisted `gdpr-news.json` seed until the first successful **Refresh news**.
6. **BYOK** — Keys stay in the browser; they are sent to your Vercel deployment over HTTPS only when the user asks or validates keys.

---

## Cron job

- **Path:** `/api/cron/daily-regulation-refresh`
- **Schedule:** `0 2 * * *` (see `vercel.json`)
- **Auth:** `CRON_SECRET` must match `Authorization: Bearer …` (Vercel sets this automatically when `CRON_SECRET` is configured). Missing/mismatched secret → **401**.
- **Scope — all nine instruments, sequential:** `gdpr` → `ai-act` → `data-act` → `id-pdp` → `id-satu-data` → `id-ai-ethics` → `us-ccpa` → `us-admt` → `us-open-data`. Any failure aborts the run with **500** `{ ok: false, error }`; instruments after the failing one are not refreshed in that invocation.
- **Response:** `{ ok, job: "daily-regulation-refresh", gdpr, aiAct, dataAct, idPdp, idSatuData, idAiEthics, usCcpa, usAdmt, usOpenData }`, each `{ lastRefreshed, lastChecked }`.

Manual test (replace values):

```bash
curl -X GET "https://YOUR_DEPLOYMENT.vercel.app/api/cron/daily-regulation-refresh" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expect `ok: true` and nine non-null `lastChecked` values.

---

## Files added for Vercel

| File | Role |
|------|------|
| `vercel.json` | Rewrites, function config (`includeFiles` incl. `id-law-scraper.js`, `us-law-scraper.js` for both functions), crons (`0 2 * * *` → nine instruments) |
| `api/index.js` | Serverless entry → Express `app` |
| `api/cron/daily-regulation-refresh.js` | Cron handler (all nine regulations) |
| `lib/paths.js` | `getDataDir()` — bundle vs `/tmp`; **`SEED_FILES`** manifest (**29** JSON files) |
| `.vercelignore` | Exclude `.env`, logs, `tmp-id-etl/`, `tmp-us-etl/` |

---

## Seed manifest (`SEED_FILES` — 29 files)

On first access per serverless instance, `lib/paths.js` copies these files from bundled `data/` into `/tmp/gdpr-qa-data` **only when the destination file is missing**. See [VARIABLES.md](VARIABLES.md) §1.1 for the full 29-file table (nine corpora, nine structures, nine chapter summaries, news, GDPR suitable recitals).

Override writable root with `GDPR_DATA_DIR`. **Adding a data file?** Add it to `SEED_FILES`, otherwise Vercel cold starts will not see it.

### Post-deploy verification

```bash
BASE=https://YOUR_DEPLOYMENT.vercel.app
curl -s "$BASE/health"                                   # ok
curl -s "$BASE/api/regulations"                          # nine regulations, jurisdiction eu/id/us
curl -s "$BASE/api/meta?regulation=data-act"             # Data Act metadata
curl -s "$BASE/api/meta?regulation=id-pdp"               # etl.articleCount 76, 4 sources
curl -s "$BASE/api/articles?regulation=id-ai-ethics"     # 7 sections
curl -s "$BASE/api/articles?regulation=us-ccpa"          # 33 Civil Code sections
curl -s "$BASE/api/articles?regulation=us-admt"          # 14 ADMT sections
curl -s "$BASE/api/articles?regulation=us-open-data"     # 10 OPEN Data sections
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| 504 on Ask / refresh | Function timeout; upgrade plan or reduce crawl scope |
| Empty regulation after deploy | Missing `data/<id>-content.json` in repo (check all nine); run the refresh script locally and commit |
| Indonesian regulation empty / refresh 500 on Vercel | `id-law-scraper.js` missing from `includeFiles`, or an `id-*` file missing from `SEED_FILES` / `data/` |
| US regulation empty / refresh 500 on Vercel | `us-law-scraper.js` missing from `includeFiles`, or a `us-*` file missing from `SEED_FILES` / `data/` |
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
