# Product metrics and OKRs  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6**

**Important:** The application does **not** currently ship an analytics SDK. Metrics below are **definitions and targets** for the product team. Instrument when approved (privacy-preserving, no secrets).

---

## 1. North-star and supporting metrics

### 1.1 North-star metric (suggested)

| Metric | Definition | Formula | Target (example) |
|--------|------------|---------|------------------|
| **WARef** — Weekly Active Reference Sessions | Sessions with ≥1 meaningful reference action (open provision **or** completed Ask with sources) | `count(distinct session_id where browse_open ∪ ask_complete)` per ISO week | ↑ QoQ |

### 1.2 Supporting product metrics

| Metric | Friendly name | Definition | Formula / rule | Location (when instrumented) | Example |
|--------|---------------|------------|----------------|------------------------------|---------|
| `ask_success_rate` | Ask success rate | Share of Ask requests returning non-empty answer with ≥1 source | `asks_with_sources / asks_total` | `/api/answer` logs | `0.92` |
| `ask_extractive_share` | Extractive fallback share | Share of Ask completed via extractive path | `asks_extractive / asks_total` | `llm.provider` / note | `0.15` |
| `byok_adoption` | BYOK adoption | Share of Ask with client keys | `asks_byok / asks_total` | `llm.byokGroq` / `byokTavily` | `0.20` |
| `regulation_mix` | Instrument mix | Distribution of active regulation per session | `count by regulation_id / sessions` | client `currentRegulation` | `{gdpr:0.4, id-pdp:0.2, …}` |
| `jurisdiction_mix` | Jurisdiction mix | EU vs ID vs All filter usage | `count by region_filter` | region picker | `{eu:0.55, id:0.30, all:0.15}` |
| `browse_to_ask_rate` | Browse→Ask conversion | Sessions that Browse then Ask | `sessions_browse_then_ask / sessions_browse` | client funnel | `0.35` |
| `citation_click_rate` | Citation engagement | Asks where user opens a `[S#]` or View in app | `asks_with_citation_nav / asks_with_sources` | client | `0.45` |
| `news_refresh_success` | News refresh success | Successful `POST /api/news/refresh` | `refresh_ok / refresh_attempts` | server logs | `0.90` |
| `indo_news_nonempty_rate` | Indo news non-empty | Indo-filtered lists with ≥1 item after load | `nonempty_indo_views / indo_news_views` | client filter | `0.70` (best-effort) |
| `etl_success_rate` | ETL success rate | Successful `POST /api/refresh` / cron per instrument | `ok / attempts` by `regulation` | server / cron | `≥0.95` |
| `soft_law_ask_share` | Soft-law Ask share | Ask under `id-ai-ethics` | `asks_id_ai_ethics / asks_total` | regulation param | monitor only |

### 1.3 Quality and risk metrics

| Metric | Definition | Threshold guidance |
|--------|------------|--------------------|
| Empty Ask rate | Answers with zero sources when corpus non-empty | Investigate if >5% |
| Wrong-sources fallback | Meta sources incorrectly showing GDPR for ID regs | **Must be 0** (regression) |
| Stale chapter blurbs | Non-GDPR chapter summaries showing GDPR text | **Must be 0** |
| Guardrail validation failures | `validateCorpusFormatting` fail on refresh | **Must be 0** for release |

### 1.4 Document formatting and corpus integrity

| Check | Definition | Formula |
|-------|------------|---------|
| Article/pasal count vs registry mins | Corpus meets `minArticles` / `minRecitals` | `count ≥ min_*` |
| SEED completeness | Vercel seed has 20 files | `len(SEED_FILES)=20` |
| Indo parity tests | `npm test` green | pass/fail |

---

## 2. Technical operational metrics

| Metric | Definition | Example target |
|--------|------------|----------------|
| `/health` availability | Uptime of liveness | ≥99.5% |
| Ask p95 latency | Time to `/api/answer` response | < 12s with Groq |
| News refresh duration | Wall time of refresh | < `NEWS_REFRESH_TIMEOUT_MS` |
| Cron completion | Daily six-instrument refresh finishes | 7/7 days |
| Cold-start seed | `/tmp` seed without missing critical JSON | 100% of deploys |

---

## 3. OKRs (example cycle — adjust per quarter)

### Objective O1: Users trust answers because they are traceable to the instrument.

| KR | Target |
|----|--------|
| KR1 | Ask success rate ≥ 90% |
| KR2 | Citation click rate ≥ 40% |
| KR3 | Zero critical “unsourced legal claim” support tickets |

### Objective O2: Corpora stay current and discoverable across six instruments.

| KR | Target |
|----|--------|
| KR1 | ETL success rate ≥ 95% per instrument |
| KR2 | Cron completes all six daily |
| KR3 | Guardrail validation failures = 0 on scheduled runs |

### Objective O3: News and credible sources add value without noise.

| KR | Target |
|----|--------|
| KR1 | News refresh success ≥ 90% |
| KR2 | Dedupe collapses known stub/canonical duplicates |
| KR3 | Wrong-sources fallback incidents = 0 |

### Objective O4: Regulation text stays structurally sound after every refresh.

| KR | Target |
|----|--------|
| KR1 | Formatting checklist (DOCUMENT_FORMATTING_GUARDRAILS §8) green |
| KR2 | No GDPR title/map bleed onto other instruments |

### Objective O5: Operators can use their own LLM credentials safely (BYOK).

| KR | Target |
|----|--------|
| KR1 | BYOK validation UX clear (valid/invalid/skipped) |
| KR2 | Zero BYOK keys written to server disk or git |

### Objective O6: EU AI Act remains first-class.

| KR | Target |
|----|--------|
| KR1 | AI Act Browse/Ask/Sources parity with GDPR (minus topic filters / suitable recitals) |
| KR2 | AI Act news relevance filter used in ≥ X% of AI Act sessions (monitor) |

### Objective O7: EU Data Act remains first-class.

| KR | Target |
|----|--------|
| KR1 | Data Act corpus mins (50 / 119) held after refresh |
| KR2 | Data Act news relevance filter functional |

### Objective O8: Indonesian instruments are first-class (parity).

| KR | Target |
|----|--------|
| KR1 | `id-pdp`, `id-satu-data`, `id-ai-ethics` selectable with Browse/Ask/Sources |
| KR2 | `npm test` Indo parity green in CI/local before release |
| KR3 | SEED_FILES includes all ID corpora + chapter summaries |
| KR4 | Meta sources never fall back to GDPR-Info for `id-*` |

### Objective O9: Soft-law honesty for ID AI Ethics.

| KR | Target |
|----|--------|
| KR1 | UI + Ask framing labels SE as guidance / circular |
| KR2 | Zero support tickets claiming the product “certifies” AI ethics compliance |

### Objective O10: Mobile and tablet users work without layout friction.

| KR | Target |
|----|--------|
| KR1 | Tools menu usable ≤899px |
| KR2 | Reading pane not clipped by sticky chrome |

### Objective O11: Browse entry and chapters list trustworthy across regulations.

| KR | Target |
|----|--------|
| KR1 | Zero false-empty chapters after regulation switch |
| KR2 | Welcome hub shows EU + ID cards on desktop |

### Objective O12: Engineering maintainability keeps the codebase auditable.

| KR | Target |
|----|--------|
| KR1 | Docs standard v2.5 aligned with package 1.2.6 |
| KR2 | No dead APIs documented as live |
| KR3 | Module public APIs listed in SOURCE_CODE_INVENTORY |

---

## 4. Instrumentation guidance

1. Prefer **privacy-preserving** event logs (no question text in third-party analytics by default).  
2. Never log API keys, BYOK payloads, or full `.env`.  
3. Tag events with `regulation_id`, `jurisdiction`, `llm_path` (`groq` \| `tavily` \| `extractive`).  
4. Until instrumentation exists, use **manual smoke + `npm test` + cron logs** as proxy evidence for OKRs O2/O8/O12.

---

## 5. References

- [PRD.md](PRD.md)  
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [../README.md](../README.md)
