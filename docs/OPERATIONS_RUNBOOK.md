# Operations runbook  
## EU Regulation Q&A Platform

**Version:** 1.3 · **Last updated:** 2026-05-19 · Documentation standard **v2.2** · Product **1.2.4**

Procedures for **local development**, **production (Vercel)**, and **routine maintenance**. Pair with [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md), [TECH_GUIDELINES.md](TECH_GUIDELINES.md), and [GUARDRAILS.md](GUARDRAILS.md).

---

## 1. Service overview

| Item | Value |
|------|--------|
| **Process** | `node server.js` (Express) |
| **Default port** | `3847` (`PORT` env) |
| **Health** | `GET /health` → `ok` |
| **UI** | Static `public/` + SPA fallback |
| **Writable data** | `data/` (local) or `GDPR_DATA_DIR` (Vercel `/tmp/gdpr-qa-data`) |

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

---

## 3. Routine maintenance

| Task | Command / action | Frequency |
|------|------------------|-----------|
| Refresh GDPR corpus | UI **Refresh sources** (GDPR selected) or `npm run refresh` | Weekly or after EUR-Lex updates |
| Refresh AI Act corpus | UI **Refresh sources** (AI Act selected) or `npm run refresh-ai-act` | As needed |
| Refresh Data Act corpus | UI **Refresh sources** (Data Act selected) or `npm run refresh-data-act` | As needed |
| Refresh news | UI **Refresh news** or `POST /api/news/refresh` | Daily / weekly |
| Regenerate chapter summaries | `POST /api/chapter-summaries/regenerate` + Groq key | After major corpus change |
| Update suitable recitals | `npm run fetch-suitable-recitals` | Occasional (GDPR) |
| Verify guardrails | Check `formattingGuardrails` in refresh API response | After ETL code changes |

---

## 4. Environment checklist

| Variable | Required for Ask | Notes |
|----------|------------------|-------|
| `GROQ_API_KEY` | Recommended | Primary LLM |
| `TAVILY_API_KEY` | Optional | Fallback when Groq fails |
| `CRON_SECRET` | Vercel cron | Bearer for daily regulation refresh |
| `GDPR_DATA_DIR` | Vercel | Writable path; seeded from bundle |
| `NEWS_*` | Optional | Crawl depth, caps, timeouts |

Full dictionary: [VARIABLES.md](VARIABLES.md) · template: [.env.example](../.env.example).

---

## 5. Vercel production

1. Set env vars in project settings (never commit `.env`).
2. Deploy from `main`; `vercel.json` routes to `api/index.js`.
3. Cron hits `/api/cron/daily-regulation-refresh` with `Authorization: Bearer $CRON_SECRET`.
4. Expect **ephemeral** `/tmp` — bundled `data/*.json` is source of truth on cold start.

Detail: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).

---

## 6. Monitoring and smoke tests

| Check | Expected |
|-------|----------|
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3847/` | `200` |
| `curl -s http://localhost:3847/api/regulations` | JSON with `gdpr`, `ai-act`, and `data-act` |
| `curl -s "http://localhost:3847/api/meta?regulation=ai-act"` | `regulationId: ai-act`, `sources` array |
| Ask (with keys) | `POST /api/answer` returns `answer`, `sources`, `llm.used` |
| Data Act Art. 10 title | Browse → EU Data Act → Art. 10 → H2 **“Dispute settlement”** (not GDPR Art. 10 title) |
| Data Act Art. 4 long title | Browse → EU Data Act → Art. 4 → H2 shows full rights/obligations title (not bare “Article 4”) |
| AI Act Art. 10 title | Browse → EU AI Act → Art. 10 → H2 **“Data and data governance”** |
| Citation sidebar (Data Act) | EU Data Act selected → open any article → sidebar says **Related Data Act articles** and links to **data-act-law.eu** |
| Citation sidebar (AI Act) | EU AI Act selected → sidebar says **Related AI Act recitals** and links to **ai-act-law.eu** |
| Reader paragraphs | AI Act Art. 6 or 99; Data Act Art. 4 shows `1.` / `2.` blocks and `(a)` sublists |
| Mobile Tools (375px) | **Tools** opens; `#headerFreshnessHint` non-empty after load; no duplicate status strip in header |
| News hero (≤899px) | News tab: hero collapsed; **Show details** reveals 1-column intro + scope; **Sync** runs refresh |
| Browse welcome (≥900px) | Browse placeholder: three cards (GDPR, Data Act, AI Act); **Chapters** button above **Recitals** |
| Chapters filter bleed | GDPR: set sub-category → switch EU Data Act → Chapters with All filters → articles listed |
| Mobile chapters filters | ≤899px: **Filters** collapsed by default; expand shows chapter + article; **Clear filters** works |

---

## 7. Common issues

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Ask always extractive | Missing/invalid Groq key | Set `.env` or BYOK; check server log on start |
| Empty Browse | Missing content JSON | Run refresh or verify `data/*-content.json` exists |
| News attachments fail | Opened `index.html` as file | Use `npm start` URL |
| Stale news in browser | Cached JSON | `GET /api/news` sends `no-store`; hard refresh |
| AI Act Sources empty | Wrong regulation / missing structure | Select AI Act; verify `ai-act-structure.json` |
| Sidebar still says “GDPR” | Stale `app.js` / hard refresh needed | Hard refresh; verify `syncCitationSidebarChrome` in build |
| News empty with AI Act selected | Filter too strict | Switch to GDPR for full list; widen search/filters |

---

## 8. Security operations

- **Never** commit `.env`, API keys, or `CRON_SECRET`.
- BYOK keys stay in **browser localStorage** only; sent per request, not stored server-side.
- Rotate keys if exposed; update Vercel env and notify users to re-save BYOK.

See [GUARDRAILS.md](GUARDRAILS.md) **TG-SEC-*** and **BG-08**.

---

## 9. Escalation and ownership

| Area | Owner (typical) | Doc |
|------|-----------------|-----|
| Product scope | Product / legal liaison | [PRD.md](PRD.md), [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md) |
| ETL / corpus | Engineering | [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) |
| LLM / Ask | Engineering | [TECH_GUIDELINES.md](TECH_GUIDELINES.md) |
| News crawler | Engineering | `news-crawler.js`, [VARIABLES.md](VARIABLES.md) §7 |
| Design / UX | Design + frontend | [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) |

---

## See also

- [CHANGELOG.md](../CHANGELOG.md)  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) — operational KPIs
