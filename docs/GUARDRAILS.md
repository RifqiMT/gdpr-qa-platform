# Guardrails  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6**  
**Audience:** Product, engineering, legal/compliance stakeholders

These guardrails define **hard limitations** for business positioning and technical implementation. Violating them creates legal, trust, or reliability risk.

---

## 1. Business and legal guardrails

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **BG-01** | Product is **reference only** — never market as legal advice or compliance certification. | Liability; user trust |
| **BG-02** | Always enable verification via official publisher links. | Traceability |
| **BG-03** | Do not invent sector-specific statutes in Ask when sector framing is on. | Hallucination risk |
| **BG-04** | Do not claim legal equivalence between EU and Indonesian instruments (analogues are marketing-only). | Jurisdictional accuracy |
| **BG-05** | **`id-ai-ethics` is soft law** — UI and Ask must not present SE Menkominfo 9/2023 as a binding Act. | Legal force honesty |
| **BG-06** | News is awareness, not an exhaustive press monitor. | Scope honesty |
| **BG-07** | National EU DPAs other than **ICO (UK)** are excluded from News/Sources by policy. | Curated credibility |
| **BG-08** | BYOK keys remain in the browser; never write them to server `.env` or git. | Secret safety |
| **BG-09** | Indonesian Komdigi HTML crawl is **best-effort** (WAF possible) — do not promise complete Indo news. | Ops honesty |

---

## 2. Technical guardrails — Ask and LLM

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-LLM-01** | Ask path is **Groq → Tavily → extractive** only. Do not reintroduce removed multi-provider `/api/summarize` as the Ask UX. | Simplicity; 1.2.6 cleanup |
| **TG-LLM-02** | Prompts must require grounding in provided excerpts; prefer citation repair over silent omission. | Traceability |
| **TG-LLM-03** | Client `apiKeys` override env for that request only; never persist to disk. | BYOK safety |
| **TG-LLM-04** | Soft-law system framing required for `id-ai-ethics`. | BG-05 |
| **TG-LLM-05** | SPA must call **`POST /api/answer` only** for Ask (no `/api/ask`). | Dead API hygiene |

---

## 3. Technical guardrails — Content ETL

| ID | Guardrail | Rationale |
|----|-----------|-----------|
| **TG-E01** | Every corpus write runs `normalizeCorpus` + `validateCorpusFormatting`. | Reader integrity |
| **TG-E02** | Refresh updates **one** selected regulation; cron updates **all six**. | Predictable ops |
| **TG-E03** | Min article/recital counts enforced per instrument env (`MIN_*`). | Incomplete scrape protection |
| **TG-E04** | Vercel `SEED_FILES` must include EU + ID corpora (20 files). | Cold start |
| **TG-E05** | Do not bypass guardrails for “quick” writes. | TG-E01 |
| **TG-E06** | Indonesian ETL via `id-law-scraper.js` only for `id-*` ids. | Clear ownership |

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
| **TG-F05** | Meta sources fallback: content → structure → **empty** (never GDPR defaults for non-GDPR). | BG / Sources integrity |
| **TG-F10** | GDPR category/sub-category must not bleed onto AI Act, Data Act, or ID instruments. | Filter reliability |

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

## 7. Out-of-scope reminders (do not commit roadmap as promise)

- Multi-tenant SaaS, SSO, audit trails  
- Analytics SDK (until explicitly approved)  
- Automated DPIA / conformity assessment  
- Restoring `/api/summarize` multi-provider stack as core UX  

---

## 8. Documentation and knowledge management

| ID | Guardrail |
|----|-----------|
| **TG-DOC-01** | Code wins over stale docs; fix docs in the same change set when possible. |
| **TG-DOC-02** | Never document removed 1.2.6 endpoints as live. |
| **TG-DOC-03** | Documentation standard version and product version must stay aligned on major audits. |

---

## References

- [BUSINESS_GUIDELINES.md](BUSINESS_GUIDELINES.md)  
- [TECH_GUIDELINES.md](TECH_GUIDELINES.md)  
- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)  
- [PRD.md](PRD.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
