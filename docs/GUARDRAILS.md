# Guardrails  
## Regulation Q&A Platform

**Version:** 3.1 · **Last updated:** 2026-10-22 · Documentation standard **v3.1** · Product **1.3.0** · Audit date **2026-10-22** · Thirteen instruments (EU + Indonesia + United States + International)  
**Audience:** Product, engineering, legal/compliance stakeholders

These guardrails define **hard limitations** for business positioning and technical implementation. Violating them creates legal, trust, or reliability risk.

---

## 1. Business and legal guardrails

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **BG-01** | Product is **reference only** — never market as legal advice or compliance certification. | Liability; user trust |
| **BG-02** | Always enable verification via official publisher links. | Traceability |
| **BG-03** | Do not invent sector-specific statutes in Ask when sector framing is on. | Hallucination risk |
| **BG-04** | Do not claim legal equivalence between EU, Indonesian, U.S., and International instruments (analogues are mapping-only). | Jurisdictional accuracy |
| **BG-05** | **`id-ai-ethics` is soft law** — UI and Ask must not present SE Menkominfo 9/2023 as a binding Act. | Legal force honesty |
| **BG-06** | News is awareness, not an exhaustive press monitor. | Scope honesty |
| **BG-07** | National EU DPAs other than **ICO (UK)** are excluded from News/Sources by policy. | Curated credibility |
| **BG-08** | BYOK keys remain in the browser; never write them to server `.env` or git. | Secret safety |
| **BG-09** | Indonesian Komdigi HTML crawl is **best-effort** (WAF possible) — do not promise complete Indo news. | Ops honesty |
| **BG-10** | **No invented U.S. federal GDPR / AI Act / Data Act.** Use CCPA/CPRA (California), Colorado SB 26-189, and the OPEN Government Data Act (Pub. L. 115-435 Title II). Never present the 2014 DATA Act (Digital Accountability and Transparency Act) as the EU Data Act analogue. Ask prompts, profile copy, and docs must state California / Colorado / public-sector-open-data scope. | Legal mapping honesty |
| **BG-20** | U.S. instruments are **state or sector analogues**, not nationwide privacy or AI law; do not generalize CCPA to other states or ADMT (effective 1 Jan 2027) to other jurisdictions. | Jurisdictional accuracy |
| **BG-21** | U.S. news is **awareness only** from FTC, CPPA/CalPrivacy, California OAG, Colorado AG, and data.gov / GSA / FDS; FTC press items outside privacy/AI/data topics are filtered out. | Scope honesty |
| **BG-22** | International instruments are **voluntary standards / attestation criteria, not laws**. Do not scrape or reconstruct paywalled ISO or AICPA Trust Services Criteria body text (including iteh.ai samples). Educational overlays from ISO.org catalogues, Harmonized Structure titles, and publicly listed TSC names only. ISO/IEC 23894 is not ISO/IEC 42001 and not the EU AI Act. | Copyright + legal-force honesty |
| **BG-23** | **Voluntary catalogue:** ISO/IEC 27701, 19941, 23894 and SOC 2 are presented as a *voluntary-standards catalogue*. Never imply that ISO certification or a SOC 2 report equals legal compliance (GDPR, Data Act, AI Act) or that the product is certified. ISO/IEC 27701 is the 2025 standalone edition (2019 withdrawn); ISO/IEC 19941-1 replacement is noted only as forthcoming. | Legal-force honesty; liability |
| **BG-24** | International news is **awareness only** from ISO.org / ISO Insights and AICPA & CIMA hubs; it must not be marketed as a standards-body monitor. A duplicate user request for ISO 23894 is **one instrument**; ISO/IEC 42001 appears only as a related note. | Scope honesty |

---

> **Numbering note:** BG-01 … BG-10 and BG-20 … BG-24 are canonical here. [BUSINESS_GUIDELINES.md §9](BUSINESS_GUIDELINES.md#9-business-guideline-index-bg) extends the scheme with BG-14 … BG-19 (multi-jurisdiction scope, soft-law labelling, best-effort Indonesian news, jurisdiction isolation, single provider chain, no authentication); BG-15 restates **BG-05**, and BG-17 restates **TG-F05 / TG-US-01**.

---

## 2. Technical guardrails — Ask and LLM

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-LLM-01** | Ask path is **Groq → Tavily → extractive** only. Do not reintroduce removed multi-provider `/api/summarize` as the Ask UX. | Simplicity; 1.2.6 cleanup |
| **TG-LLM-02** | Prompts must require grounding in provided excerpts; prefer citation repair over silent omission. | Traceability |
| **TG-LLM-03** | Client `apiKeys` override env for that request only; never persist to disk. | BYOK safety |
| **TG-LLM-04** | Soft-law system framing required for `id-ai-ethics`. | BG-05 |
| **TG-LLM-05** | SPA must call **`POST /api/answer` only** for Ask (no `/api/ask`). | Dead API hygiene |
| **TG-LLM-06** | Jurisdiction framing required for `us-ccpa`, `us-admt`, and `us-open-data` (not federal GDPR / AI Act / 2014 DATA Act). | BG-10 |
| **TG-LLM-07** | **LEGAL FORCE framing required** for `iso-27701`, `iso-19941`, `iso-23894`, and `soc2`: voluntary standard / attestation, not a law; do not invent paid ISO clause text or AICPA Points of Focus; 23894 ≠ 42001 ≠ AI Act; SOC 2 ≠ ISO certification. | BG-22, BG-23 |

---

## 3. Technical guardrails — Content ETL

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-E01** | Every corpus write runs `normalizeCorpus` + `validateCorpusFormatting`. | Reader integrity |
| **TG-E02** | Refresh updates **one** selected regulation; cron updates **all thirteen**. | Predictable ops |
| **TG-E03** | Min article/recital counts enforced per instrument env (`MIN_*`, including `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, `MIN_US_OPEN_DATA_*`, `MIN_ISO_27701_*`, `MIN_ISO_19941_*`, `MIN_ISO_23894_*`, `MIN_SOC2_*`). | Incomplete scrape protection |
| **TG-E04** | Vercel `SEED_FILES` must include EU + ID + US + INTL corpora (41 files). | Cold start |
| **TG-E05** | Do not bypass guardrails for “quick” writes. | TG-E01 |
| **TG-E06** | Indonesian ETL via `id-law-scraper.js` only for `id-*` ids. | Clear ownership |
| **TG-E07** | United States ETL via `us-law-scraper.js` only for `us-*` ids; it must run `normalizeCorpus` before every write and must not overwrite the bundled corpus when the floor is not met. | Clear ownership; reader integrity |
| **TG-E08** | `vercel.json` `includeFiles` must list every scraper required at runtime (`ai-act`, `data-act`, `id-law`, `us-law`, **`iso-soc`**) for both `api/index.js` and the cron function. | Serverless refresh works |
| **TG-E09** | International ETL via `iso-soc-scraper.js` only for `iso-*` / `soc2` ids; it is **ping-only** (never parses live ISO / AICPA body text), must run `normalizeCorpus` before every write, and must not overwrite the bundled overlay when the floor is not met. | Copyright; clear ownership; reader integrity |

---

## 4. Technical guardrails — News

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-N01** | Dedupe by URL then semantic key before return/persist. | Noise control |
| **TG-N02** | Respect `NEWS_MERGE_CAP` and refresh timeouts. | Stability |
| **TG-N03** | Client relevance filters must not mutate the shared JSON schema incorrectly. | Multi-instrument safety |
| **TG-N04** | Attachment fetch allowlist / caps apply; hide Attachments when count = 0. | UX + safety |

---

## 5. Technical guardrails — Frontend

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-F01** | `CANONICAL_ARTICLE_TITLES` is GDPR-only. | Title correctness |
| **TG-F02** | Clear/hide GDPR topic filters when `hasArticleTopics` is false. | False-empty bug |
| **TG-F03** | Citation sidebar sync on every regulation change. | No GDPR-Info bleed |
| **TG-F04** | Chapter summary fallback must not inject GDPR blurbs into other instruments. | Content correctness |
| **TG-F05** | Meta sources fallback: content → structure → **empty** (never GDPR defaults for non-GDPR, **including every `us-*`, `iso-*`, and `soc2` id**). | BG / Sources integrity |
| **TG-F10** | GDPR category/sub-category must not bleed onto AI Act, Data Act, ID, US, or International instruments. | Filter reliability |
| **TG-F11** | PDF export must follow active **Page \| Full** mode (do not always export a single provision). | Export correctness |
| **TG-F12** | Browse opens must use real provision hashes and must not race `hashchange` back to `#/browse` home. | Navigation reliability |
| **TG-F13** | Switching regulation while a document is open must clear the prior instrument’s reader/Full cache. | Content correctness |

---

## 5b. Technical guardrails — Module boundaries

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-C01** | Keep `module.exports` limited to documented public symbols; update SOURCE_CODE_INVENTORY when changed. | Maintainability |
| **TG-C02** | Do not resurrect removed exports (e.g. `invalidateRegulationContentCache` public) without docs + changelog. | API hygiene |

---

## 6. Data and privacy guardrails

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **DG-01** | No end-user auth — treat deployment network perimeter as access control. | Threat model honesty |
| **DG-02** | If access control is required, place VPN/SSO in front; do not pretend the app has RBAC. | BG / security |
| **DG-03** | Do not log secrets, BYOK keys, or full `.env` values. | Secret safety |
| **DG-04** | Prefer not to send raw user questions to third-party analytics without review. | Privacy |

---

## 6b. EU AI Act–specific guardrails

| ID | Guardrail |
|----|-----------|
| **TG-AI-01** | `hasArticleTopics: false`, `hasSuitableRecitals: false` — do not fake GDPR-only features. |
| **TG-AI-02** | News AI relevance filter is client-side, not a dedicated AI Act wire. |

---

## 6c. EU Data Act–specific guardrails

| ID | Guardrail |
|----|-----------|
| **TG-DA-01** | Same feature-flag honesty as AI Act for topics/suitable recitals. |
| **TG-DA-02** | Do not imply Data Act replaces GDPR or Satu Data. |

---

## 6d. Indonesian instrument guardrails

| ID | Guardrail |
|----|-----------|
| **TG-ID-01** | `id-*` instruments use Indonesian publishers; never EUR-Lex-only framing. |
| **TG-ID-02** | Soft-law framing mandatory for `id-ai-ethics` (see BG-05, TG-LLM-04). |
| **TG-ID-03** | Indo news emptiness is not necessarily a product defect — check WAF / refresh. |
| **TG-ID-04** | Parity tests in `test/indo-parity.test.js` must stay green for registry/corpora helpers. |

---

## 6e. United States instrument guardrails

| ID | Guardrail |
|----|-----------|
| **TG-US-01** | **No GDPR fallback for `us-*`:** `GET /api/meta`, chapter summaries, Ask sources, and citation sidebars must never fall back to GDPR-Info / EUR-Lex / EDPB for `us-ccpa`, `us-admt`, or `us-open-data` (`US_REGULATION_IDS`; BG-10). |
| **TG-US-02** | `us-open-data` is Title II of Pub. L. 115-435; its registry `fullName` must not reference the Digital Accountability and Transparency Act (2014 DATA Act). |
| **TG-US-03** | Ask retrieval for `us-*` uses CCPA / ADMT / OPEN Data layperson and sector expansions (`laypersonSearchExpansion`), never GDPR "controller / processor" wording. |
| **TG-US-04** | US provision labels are **Section / Purpose note** (`CCPA § N`, `ADMT § N`, `OPEN Data § N`); *Article* / *Recital* wording must not appear on US surfaces. |
| **TG-US-05** | US news fetches FTC with a compatible (non-Chrome) user agent and use live default URLs; do not reintroduce `data.gov/meta/` (404). USA News must not show ICO / EDPB items. |
| **TG-US-06** | `us-parity` tests in `test/us-parity.test.js` must stay green (registry, corpora/sources without EU bleed, news helpers, persisted US headlines, Ask retrieval, UI blurbs). |
| **TG-US-07** | Theme accents stay distinct: `us-ccpa` `#1d4ed8`, `us-open-data` `#0f766e`, `us-admt` `#6d28d9`. |

---

## 6f. International instrument guardrails (ISO/IEC 27701, 19941, 23894, SOC 2)

| ID | Guardrail |
|----|-----------|
| **TG-INTL-01** | **No GDPR fallback for `iso-*` / `soc2`:** `GET /api/meta`, chapter summaries, Ask sources, and citation sidebars must never fall back to GDPR-Info / EUR-Lex / EDPB for `iso-27701`, `iso-19941`, `iso-23894`, or `soc2` (`INTL_REGULATION_IDS`; BG-22). |
| **TG-INTL-02** | **No paywalled-body scrape:** corpora are copyright-safe educational overlays (ISO.org catalogue abstracts, Harmonized Structure / ISO 31000 titles, AICPA TSC category and criterion names). Do not add iteh.ai samples, paid ISO clause text, or AICPA Points of Focus tables to `data/`, ETL, or docs. |
| **TG-INTL-03** | International provision labels are **Clause / Criterion / Purpose note** (`ISO 27701 clause N`, `ISO 19941 clause N`, `ISO 23894 clause N`, `SOC 2 criterion N`); *Article* / *Recital* wording must not appear on International surfaces. |
| **TG-INTL-04** | Ask retrieval for `iso-*` / `soc2` uses PIMS / cloud-portability / AI-risk / Trust-Services-Criteria expansions (`laypersonSearchExpansion`), never GDPR "controller / processor" wording beyond PII controller / processor in ISO 27701. |
| **TG-INTL-05** | ISO/IEC 42001 is a **related note only** under `iso-23894` (no separate corpus, no separate registry id). A duplicate ISO 23894 request resolves to one instrument. |
| **TG-INTL-06** | `test/iso-parity.test.js` must stay green (registry, honest analogue mapping, corpora/sources without EU bleed, news helpers, persisted International headlines, Ask retrieval, UI blurbs) within the **58 pass / 24 suites** baseline. |
| **TG-INTL-07** | Theme accents and region thumb stay as shipped: `iso-27701` `#0f766e`, `iso-19941` `#0369a1`, `iso-23894` `#5b21b6`, `soc2` `#b45309`; `intl` thumb `#475569` → `#334155`. |
| **TG-INTL-08** | `gdpr-qa-region-v1` accepts only `all`, `eu`, `id`, `us`, `intl`; INTL defaults the regulation to `iso-27701`. |

---

## 7. Out-of-scope reminders (do not commit roadmap as promise)

- Multi-tenant SaaS, SSO, audit trails  
- Analytics SDK (until explicitly approved)  
- Automated DPIA / conformity assessment  
- Restoring `/api/summarize` multi-provider stack as core UX  
- Additional U.S. state privacy/AI statutes beyond the three bundled instruments  
- ISO/IEC 42001 or other ISO/AICPA instruments as shipped corpora; paid ISO / AICPA text; certification or attestation workflows  

---

## 8. Documentation and knowledge management

| ID | Guardrail |
|----|-----------|
| **TG-DOC-01** | Code wins over stale docs; fix docs in the same change set when possible. |
| **TG-DOC-02** | Never document removed 1.2.6 endpoints as live. |
| **TG-DOC-03** | Documentation standard version and product version must stay aligned on major audits (current: standard **v3.1**, product **1.3.0**, audit **2026-10-22**). |
| **TG-DOC-04** | Counts quoted in docs (thirteen instruments, `SEED_FILES` = 41, `npm test` = 58 pass / 24 suites) must be re-verified at each audit. |

---

## References

- [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md)  
- [TECH_GUIDELINES.md](TECH_GUIDELINES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [PRD.md](PRD.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
