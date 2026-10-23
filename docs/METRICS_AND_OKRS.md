# Product metrics and OKRs  
## Regulation Q&A Platform

**Version:** 3.2 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23** · Thirteen instruments · `SEED_FILES` = 41 · `npm test` 58 pass / 24 suites

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
| `jurisdiction_mix` | Jurisdiction mix | All vs EU vs Indonesia vs USA vs INTL filter usage | `count by region_filter / sessions` | region picker (`gdpr-qa-region-v1` ∈ `all\|eu\|id\|us\|intl`) | `{eu:0.40, id:0.20, us:0.15, intl:0.10, all:0.15}` |
| `browse_to_ask_rate` | Browse→Ask conversion | Sessions that Browse then Ask | `sessions_browse_then_ask / sessions_browse` | client funnel | `0.35` |
| `citation_click_rate` | Citation engagement | Asks where user opens a `[S#]` or View in app | `asks_with_citation_nav / asks_with_sources` | client | `0.45` |
| `news_refresh_success` | News refresh success | Successful `POST /api/news/refresh` | `refresh_ok / refresh_attempts` | server logs | `0.90` |
| `news_scope_ratio` | News scope tightness | Share of shared corpus retained after `itemMatchesNewsRegulationScope` for the active regulation | `scoped_count / shared_corpus_count` by `regulation_id` | client filter | GDPR ≈ regional DP subset; AI Act / Data Act tighter |
| `gdpr_news_nonempty_rate` | GDPR news non-empty | GDPR-filtered lists with ≥1 item after load | `nonempty_gdpr_views / gdpr_news_views` | client filter | `≥0.80` |
| `indo_news_nonempty_rate` | Indo news non-empty | Indo-filtered lists with ≥1 item after load | `nonempty_indo_views / indo_news_views` | client filter | `0.70` (best-effort) |
| `etl_success_rate` | ETL success rate | Successful `POST /api/refresh` / cron per instrument | `ok / attempts` by `regulation` | server / cron | `≥0.95` |
| `soft_law_ask_share` | Soft-law Ask share | Ask under `id-ai-ethics` | `asks_id_ai_ethics / asks_total` | regulation param | monitor only |
| `us_ask_share` | United States Ask share | Ask under any `us-*` instrument | `asks_us / asks_total` where `regulation ∈ {us-ccpa, us-admt, us-open-data}` | regulation param | monitor only |
| `us_news_nonempty_rate` | USA news non-empty | USA-filtered News lists with ≥1 item after load | `nonempty_us_views / us_news_views` | client filter (`itemMatchesNewsRegulationScope`) | `0.80` |
| `us_ask_with_sources_rate` | US Ask success | `us-*` Ask requests returning ≥1 local `[S#]` source from the US corpus | `us_asks_with_local_sources / us_asks_total` | `/api/answer` | `≥0.90` |
| `intl_ask_share` | International Ask share | Ask under any `iso-*` / `soc2` instrument | `asks_intl / asks_total` where `regulation ∈ {iso-27701, iso-19941, iso-23894, soc2}` | regulation param | monitor only |
| `intl_news_nonempty_rate` | INTL news non-empty | INTL-filtered News lists with ≥1 item after load | `nonempty_intl_views / intl_news_views` | client filter (`itemMatchesNewsRegulationScope`) | `0.80` |
| `intl_ask_with_sources_rate` | International Ask success | `iso-*` / `soc2` Ask requests returning ≥1 local `[S#]` source from the educational overlay | `intl_asks_with_local_sources / intl_asks_total` | `/api/answer` | `≥0.90` |
| `intl_voluntary_label_rate` | Voluntary-standard labelling | International Ask answers whose framing states "voluntary standard / attestation, not a law" (LEGAL FORCE rule) | `intl_asks_with_legal_force_note / intl_asks_total` | prompt audit / sampling | `1.00` (sample audit) |
| `reader_full_share` | Reader Full-mode share | Sessions that set `gdprQaReaderViewMode = full` | `sessions_full / sessions_reader` | client | monitor only |

### 1.3 Quality and risk metrics

| Metric | Definition | Threshold guidance |
|--------|------------|--------------------|
| Empty Ask rate | Answers with zero sources when corpus non-empty | Investigate if >5% |
| Wrong-sources fallback | Meta sources incorrectly showing GDPR for ID, US, **or International** regs | **Must be 0** (regression) |
| US false-friend incidents | US surface treating the 2014 DATA Act as the EU Data Act analogue, or implying a federal GDPR / AI Act | **Must be 0** |
| International legal-force incidents | An International surface (UI copy, Ask answer, docs) presenting ISO/IEC 27701 / 19941 / 23894 or SOC 2 as a law, certification of compliance, or reproducing paid ISO / AICPA body text | **Must be 0** |
| EU leakage into INTL News | ICO / EDPB / EDPS / FTC items shown under `iso-*` / `soc2` News | **Must be 0** |
| EU leakage into USA News | ICO / EDPB / EDPS items shown under `us-*` News | **Must be 0** |
| Stale chapter blurbs | Non-GDPR chapter summaries showing GDPR text | **Must be 0** |
| Guardrail validation failures | `validateCorpusFormatting` fail on refresh | **Must be 0** for release |

### 1.4 Document formatting and corpus integrity

| Check | Definition | Formula |
|-------|------------|---------|
| Article/pasal count vs registry mins | Corpus meets `minArticles` / `minRecitals` | `count ≥ min_*` |
| SEED completeness | Vercel seed has 41 files (26 corpus/structure + 13 summaries + news + suitable recitals) | `len(SEED_FILES)=41` |
| International corpus floors | International corpora meet registry mins | `iso-27701 ≥ 14 / 5`, `iso-19941 ≥ 11 / 4`, `iso-23894 ≥ 12 / 5`, `soc2 ≥ 20 / 6` (articles / recitals) |
| US corpus floors | US corpora meet registry mins | `us-ccpa ≥ 30 / 5`, `us-admt ≥ 12 / 5`, `us-open-data ≥ 8 / 4` (articles / recitals) |
| Parity and UI tests | `npm test` green | **58 pass / 0 fail / 24 suites** (indo-parity, us-parity, iso-parity, browse-routes, reader-view; verified 2026-10-23) |

---

## 2. Technical operational metrics

| Metric | Definition | Example target |
|--------|------------|----------------|
| `/health` availability | Uptime of liveness | ≥99.5% |
| Ask p95 latency | Time to `/api/answer` response | < 12s with Groq |
| News refresh duration | Wall time of refresh | < `NEWS_REFRESH_TIMEOUT_MS` |
| Cron completion | Daily thirteen-instrument refresh finishes (`gdpr`, `aiAct`, `dataAct`, `idPdp`, `idSatuData`, `idAiEthics`, `usCcpa`, `usAdmt`, `usOpenData`, `iso27701`, `iso19941`, `iso23894`, `soc2`) | 7/7 days |
| Cold-start seed | `/tmp` seed without missing critical JSON | 100% of deploys |

---

## 3. OKRs (example cycle — adjust per quarter)

### Objective O1: Users trust answers because they are traceable to the instrument.

| KR | Target |
|----|--------|
| KR1 | Ask success rate ≥ 90% |
| KR2 | Citation click rate ≥ 40% |
| KR3 | Zero critical “unsourced legal claim” support tickets |

### Objective O2: Corpora stay current and discoverable across thirteen instruments.

| KR | Target |
|----|--------|
| KR1 | ETL success rate ≥ 95% per instrument |
| KR2 | Cron completes all thirteen daily |
| KR3 | Guardrail validation failures = 0 on scheduled runs |

### Objective O3: News and credible sources add value without noise.

| KR | Target |
|----|--------|
| KR1 | News refresh success ≥ 90% |
| KR2 | Dedupe collapses known stub/canonical duplicates |
| KR3 | Wrong-sources fallback incidents = 0 |
| KR4 | GDPR (and every other instrument) News uses scoped relevance — zero “full shared corpus” regressions; cross-jurisdiction leakage = 0 |

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
| KR2 | Welcome hub shows all thirteen cards (EU, Indonesia, USA, International rows) on desktop |

### Objective O12: Engineering maintainability keeps the codebase auditable.

| KR | Target |
|----|--------|
| KR1 | Docs standard **v3.2** aligned with package **1.3.0** (incl. Page \| Full, browse-route tests, thirteen-instrument lockstep, News scoped for all regs, Browse `policySummary`, `SEED_FILES` = 41) |
| KR2 | No dead APIs documented as live |
| KR3 | Module public APIs listed in SOURCE_CODE_INVENTORY |

### Objective O13: United States analogues are first-class and honest.

| KR | Target |
|----|--------|
| KR1 | `us-ccpa`, `us-open-data`, `us-admt` selectable with Browse / Ask / Sources / News; `us-parity` tests green before every release |
| KR2 | US Ask with local sources ≥ 90%; zero wrong-sources fallback incidents (no GDPR-Info / EUR-Lex for `us-*`) |
| KR3 | USA News non-empty rate ≥ 80% after refresh; zero EU leakage |
| KR4 | Zero support tickets or UI copy equating the OPEN Government Data Act with the 2014 DATA Act or claiming a federal GDPR / AI Act |
| KR5 | ETL: `npm run refresh-us-*` and cron succeed ≥ 95% (floors `MIN_US_*` held) |

### Objective O14: International voluntary standards are first-class and honest.

| KR | Target |
|----|--------|
| KR1 | `iso-27701`, `iso-19941`, `iso-23894`, `soc2` selectable (region **INTL**, default `iso-27701`) with Browse / Ask / Sources / News; `iso-parity` tests green before every release (58 pass / 24 suites baseline) |
| KR2 | International Ask with local sources ≥ 90%; zero wrong-sources fallback incidents (no GDPR-Info / EUR-Lex for `iso-*` / `soc2`) |
| KR3 | INTL News non-empty rate ≥ 80% after refresh (ISO / AICPA feeds); zero EU / US leakage |
| KR4 | Zero International legal-force incidents: no UI copy or answer presents ISO / SOC 2 as a law; zero paid ISO / AICPA body text in `data/` |
| KR5 | ETL: `npm run refresh-iso-*` / `refresh-soc2` and cron succeed ≥ 95% (floors `MIN_ISO_*` / `MIN_SOC2_*` held) |
| KR6 | INTL share of sessions (`jurisdiction_mix.intl`) tracked as a monitor-only adoption signal |

---

## 4. Instrumentation guidance

1. Prefer **privacy-preserving** event logs (no question text in third-party analytics by default).  
2. Never log API keys, BYOK payloads, or full `.env`.  
3. Tag events with `regulation_id`, `jurisdiction`, `llm_path` (`groq` \| `tavily` \| `extractive`).  
4. Until instrumentation exists, use **manual smoke + `npm test` + cron logs** as proxy evidence for OKRs O2/O8/O12/O13/O14.

---

## 5. References

- [PRD.md](PRD.md)  
- [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)  
- [GUARDRAILS.md](GUARDRAILS.md)  
- [../README.md](../README.md)
