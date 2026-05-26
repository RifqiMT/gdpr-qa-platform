# Business guidelines  
## EU Regulation Q&A Platform

**Version:** 1.3 · **Last updated:** 2026-05-19  
**Audience:** Product, legal/compliance stakeholders, content owners, support  
**Status:** Active · Documentation standard **v2.0**

---

## 1. Purpose of this document

These guidelines define **how the product should be positioned, scoped, and used** from a business perspective. They complement the [PRD](PRD.md), [GUARDRAILS](GUARDRAILS.md), and root [README](../README.md).

---

## 2. Product positioning

| Element | Guideline |
|---------|-----------|
| **Name** | **EU Regulation Q&A Platform** — emphasizes multi-regulation capability. |
| **Value proposition** | Fast, **cited** access to official EU regulation text (**GDPR**, **EU AI Act**, **EU Data Act**) plus curated **supervisory news**, without replacing professional legal judgment. |
| **Not** | Legal advice, DPA decisions, contract drafting, or automated compliance certification. |
| **Primary regulations** | **GDPR** (2016/679), **EU AI Act** (2024/1689), **EU Data Act** (2023/2854), selectable in the UI. |

---

## 3. Target outcomes for users

1. **Find** the correct article or recital in seconds (Browse + filters + doc navigation).  
2. **Ask** questions and receive answers **grounded in corpus text** with traceable `[S#]` citations.  
3. **Verify** against official publishers (EUR-Lex, GDPR-Info, AI Act Law).  
4. **Stay informed** via News from EU-level and UK ICO sources (data protection + AI overlap).  
5. **Export** a provision as PDF for offline reading or internal packs.  
6. **Trust** that article and recital **headings** match the selected regulation (same article number does not imply the same title across GDPR, AI Act, and Data Act).

---

## 4. Regulation scope

### 4.1 GDPR (default)

- Full recitals **1–173** and articles **1–99**.  
- Topic filters (category / sub-category) for consent, erasure, transfers, DPO, etc.  
- Editorial **suitable recitals** per article (GDPR-Info alignment).  
- Credible sources: GDPR-Info, EUR-Lex, EDPB, EDPS, Commission, ICO (UK), Council of Europe.

### 4.2 EU AI Act

- Full recitals **1–180** and articles **1–113** in **13 chapters**.  
- **No** GDPR-style sub-category taxonomy (product simplifies browse).  
- **No** suitable-recital cross-reference map (not bundled).  
- Credible sources: AI Act Law, EUR-Lex 2024/1689, Commission AI regulatory framework.  
- Ask and Browse use the **same** LLM and citation patterns as GDPR, with regulation-specific prompts and web search bias.

### 4.3 EU Data Act

- Full recitals **1–119** and articles **1–50** in **11 chapters**.  
- **No** GDPR-style sub-category taxonomy (same simplification as AI Act).  
- **No** suitable-recital cross-reference map (not bundled).  
- Credible sources: [Data Act Law](https://data-act-law.eu/), EUR-Lex 2023/2854, Commission Data Act policy.  
- Ask and Browse use the same citation and LLM patterns with Data Act–specific prompts and web search bias.

### 4.4 News (shared corpus)

- News remains **GDPR and data protection** oriented (EDPB, EDPS, ICO, Commission, CoE).  
- When **EU AI Act** or **EU Data Act** is selected, the UI **filters** headlines for regulation relevance and shows an explanatory banner.  
- Do not market News as a complete AI Act or Data Act press monitor until dedicated feeds are crawled.

---

## 5. Credible sources policy

| Rule | Detail |
|------|--------|
| **BG-07** | National DPAs other than **ICO (UK)** are excluded from News and default credible-source lists. |
| **Official text** | Regulation corpora must trace to **EUR-Lex** and readable mirrors (GDPR-Info, AI Act Law, Data Act Law). |
| **Supervisory news** | Only configured EU/UK/international bodies in `gdpr-news.json` / crawler defaults. |
| **Attribution** | Every news card links to the **publisher’s original URL**. |
| **Refresh** | Operators should run **Refresh sources** after material EU legal updates; **Refresh news** on a schedule (daily cron optional). |

---

## 6. Ask and LLM business rules

| Rule | Detail |
|------|--------|
| **Grounding** | Answers must use **retrieved sources only**; extractive fallback when LLMs unavailable. |
| **Citations** | Every sentence in LLM answers should end with `[S#]` where enforced by prompts. |
| **Sector framing** | Optional ISIC sector is **illustrative** — not a substitute for sector-specific legal counsel. |
| **BYOK** | Users may supply own Groq/Tavily keys in the browser; keys are **not** stored server-side. |
| **Disclosure** | UI must show whether **server** or **BYOK** keys powered the answer. |

---

## 7. Content freshness

| Content | Owner action | User expectation |
|---------|--------------|------------------|
| GDPR corpus | **Refresh sources** (GDPR selected) | `meta.lastRefreshed` shown in freshness tooltip |
| AI Act corpus | **Refresh sources** (AI Act selected) or `npm run refresh-ai-act` | Same |
| News | **Refresh all sources** | May take minutes; capped list (`NEWS_MERGE_CAP`) |
| Chapter summaries | Optional Groq regeneration | File-backed blurbs; not legal text |

---

## 8. Deployment and audience

| Environment | Typical user | Business note |
|-------------|--------------|---------------|
| **Local** (`npm start`) | Developers, pilots | Full write access to `data/` |
| **Vercel** | Demo / light production | Ephemeral `/tmp`; bundled JSON seed; cron refreshes both regulations |
| **Enterprise** | Internal compliance portal | Host behind SSO; set `OPENROUTER_REFERRER` / production URLs |

---

## 9. Out of scope (business)

- Automated DPIA or conformity assessment workflows for AI Act.  
- Multi-tenant org accounts, audit logs, or role-based access control.  
- Non-EU regulations (CCPA-only, PIPL, etc.) unless added as new `regulations.js` entries.  
- Guaranteed completeness of news crawl (subject to publisher RSS/HTML changes).

---

## 10. Related documents

- [PRD.md](PRD.md) — functional requirements  
- [GUARDRAILS.md](GUARDRAILS.md) — hard limitations  
- [USER_PERSONAS.md](USER_PERSONAS.md) — who we build for  
- [METRICS_AND_OKRS.md](METRICS_AND_OKRS.md) — success measures
