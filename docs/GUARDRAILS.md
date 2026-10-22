# Guardrails  
## Regulation Q&A Platform

**Version:** 2.9 · **Last updated:** 2026-10-22 · Documentation standard **v2.9** · Product **1.2.9** · Audit date **2026-10-22** · Nine instruments (EU + Indonesia + United States)  
**Audience:** Product, engineering, legal/compliance stakeholders

These guardrails define **hard limitations** for business positioning and technical implementation. Violating them creates legal, trust, or reliability risk.

---

## 1. Business and legal guardrails

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **BG-01** | Product is **reference only** — never market as legal advice or compliance certification. | Liability; user trust |
| **BG-02** | Always enable verification via official publisher links. | Traceability |
| **BG-03** | Do not invent sector-specific statutes in Ask when sector framing is on. | Hallucination risk |
| **BG-04** | Do not claim legal equivalence between EU, Indonesian, and U.S. instruments (analogues are mapping-only). | Jurisdictional accuracy |
| **BG-05** | **`id-ai-ethics` is soft law** — UI and Ask must not present SE Menkominfo 9/2023 as a binding Act. | Legal force honesty |
| **BG-06** | News is awareness, not an exhaustive press monitor. | Scope honesty |
| **BG-07** | National EU DPAs other than **ICO (UK)** are excluded from News/Sources by policy. | Curated credibility |
| **BG-08** | BYOK keys remain in the browser; never write them to server `.env` or git. | Secret safety |
| **BG-09** | Indonesian Komdigi HTML crawl is **best-effort** (WAF possible) — do not promise complete Indo news. | Ops honesty |
| **BG-10** | **No invented U.S. federal GDPR / AI Act / Data Act.** Use CCPA/CPRA (California), Colorado SB 26-189, and the OPEN Government Data Act (Pub. L. 115-435 Title II). Never present the 2014 DATA Act (Digital Accountability and Transparency Act) as the EU Data Act analogue. Ask prompts, profile copy, and docs must state California / Colorado / public-sector-open-data scope. | Legal mapping honesty |
| **BG-20** | U.S. instruments are **state or sector analogues**, not nationwide privacy or AI law; do not generalize CCPA to other states or ADMT (effective 1 Jan 2027) to other jurisdictions. | Jurisdictional accuracy |
| **BG-21** | U.S. news is **awareness only** from FTC, CPPA/CalPrivacy, California OAG, Colorado AG, and data.gov / GSA / FDS; FTC press items outside privacy/AI/data topics are filtered out. | Scope honesty |

---

> **Numbering note:** BG-01 … BG-10 and BG-20 … BG-21 are canonical here. [BUSINESS_GUIDELINES.md §9](BUSINESS_GUIDELINES.md#9-business-guideline-index-bg) extends the scheme with BG-14 … BG-19 (multi-jurisdiction scope, soft-law labelling, best-effort Indonesian news, jurisdiction isolation, single provider chain, no authentication); BG-15 restates **BG-05**, and BG-17 restates **TG-F05 / TG-US-01**.

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

---

## 3. Technical guardrails — Content ETL

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-E01** | Every corpus write runs `normalizeCorpus` + `validateCorpusFormatting`. | Reader integrity |
| **TG-E02** | Refresh updates **one** selected regulation; cron updates **all nine**. | Predictable ops |
| **TG-E03** | Min article/recital counts enforced per instrument env (`MIN_*`, including `MIN_US_CCPA_*`, `MIN_US_ADMT_*`, `MIN_US_OPEN_DATA_*`). | Incomplete scrape protection |
| **TG-E04** | Vercel `SEED_FILES` must include EU + ID + US corpora (29 files). | Cold start |
| **TG-E05** | Do not bypass guardrails for “quick” writes. | TG-E01 |
| **TG-E06** | Indonesian ETL via `id-law-scraper.js` only for `id-*` ids. | Clear ownership |
| **TG-E07** | United States ETL via `us-law-scraper.js` only for `us-*` ids; it must run `normalizeCorpus` before every write and must not overwrite the bundled corpus when the floor is not met. | Clear ownership; reader integrity |
| **TG-E08** | `vercel.json` `includeFiles` must list every scraper required at runtime (`ai-act`, `data-act`, `id-law`, `us-law`) for both `api/index.js` and the cron function. | Serverless refresh works |

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
| **TG-F05** | Meta sources fallback: content → structure → **empty** (never GDPR defaults for non-GDPR, **including every `us-*` id**). | BG / Sources integrity |
| **TG-F10** | GDPR category/sub-category must not bleed onto AI Act, Data Act, ID, or US instruments. | Filter reliability |
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

## 7. Out-of-scope reminders (do not commit roadmap as promise)

- Multi-tenant SaaS, SSO, audit trails  
- Analytics SDK (until explicitly approved)  
- Automated DPIA / conformity assessment  
- Restoring `/api/summarize` multi-provider stack as core UX  
- Additional U.S. state privacy/AI statutes beyond the three bundled instruments  

---

## 8. Documentation and knowledge management

| ID | Guardrail |
|----|-----------|
| **TG-DOC-01** | Code wins over stale docs; fix docs in the same change set when possible. |
| **TG-DOC-02** | Never document removed 1.2.6 endpoints as live. |
| **TG-DOC-03** | Documentation standard version and product version must stay aligned on major audits (current: standard **v2.9**, product **1.2.9**, audit **2026-10-22**). |
| **TG-DOC-04** | Counts quoted in docs (nine instruments, `SEED_FILES` = 29, `npm test` = 40 pass / 17 suites) must be re-verified at each audit. |

---

## References

- [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md)  
- [TECH_GUIDELINES.md](TECH_GUIDELINES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [PRD.md](PRD.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
