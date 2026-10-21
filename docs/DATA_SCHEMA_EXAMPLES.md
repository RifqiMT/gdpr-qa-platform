# Data schema examples  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-21 · Documentation standard **v2.6** · Product **1.2.7** · Audit date **2026-10-21**

Illustrative **JSON fragments** for integrators, covering all **six** corpora (EU: `gdpr`, `ai-act`, `data-act`; Indonesia: `id-pdp`, `id-satu-data`, `id-ai-ethics`). Authoritative fields: [VARIABLES.md](VARIABLES.md), [API_CONTRACTS.md](API_CONTRACTS.md). Text is abbreviated with `…`; Indonesian legal text is kept in **Bahasa Indonesia**, with **English structural titles**.

**Common corpus shape** (all six `data/<id>-content.json` files): `meta` · `categories` · `chapters` · `articles` · `recitals` · `searchIndex`. The `chapter` number on each article is **added at load time** by `enrichArticlesWithChapter` using the registry `chapterRanges`; it is not required in the stored file.

---

## 1. Regulation corpus (`data/gdpr-content.json`) — excerpts

```json
{
  "meta": {
    "lastRefreshed": "2026-04-04T10:00:00.000Z",
    "lastChecked": "2026-04-04T10:00:00.000Z",
    "datasetHash": "…",
    "etl": {
      "extractedFrom": "gdpr-info",
      "fetched": true,
      "significant": true
    },
    "sources": [
      {
        "name": "EDPB",
        "url": "https://edpb.europa.eu/",
        "description": "…",
        "documents": []
      }
    ]
  },
  "recitals": [{ "number": 1, "text": "…", "sourceUrl": "…", "eurLexUrl": "…" }],
  "articles": [{ "number": 5, "title": "…", "chapter": 2, "text": "…", "sourceUrl": "…" }],
  "searchIndex": [{ "id": "article-5", "type": "article", "title": "…", "text": "…" }]
}
```

---

## 1b. EU AI Act corpus (`data/ai-act-content.json`) — excerpts

```json
{
  "meta": {
    "regulationId": "ai-act",
    "lastRefreshed": "2026-05-25T09:21:33.808Z",
    "sources": [
      {
        "name": "AI Act Law",
        "url": "https://ai-act-law.eu/",
        "description": "Readable English layout of Regulation (EU) 2024/1689"
      }
    ]
  },
  "chapters": [{ "number": 3, "roman": "III", "title": "High-risk AI systems", "articleRange": "6-49" }],
  "articles": [{ "number": 6, "title": "Classification rules for high-risk AI systems", "chapter": 3, "text": "…" }],
  "recitals": [{ "number": 1, "text": "…" }],
  "searchIndex": [{ "id": "article-6", "type": "article", "number": 6, "title": "…", "text": "…" }]
}
```

---

## 1c. EU Data Act corpus (`data/data-act-content.json`) — excerpts

```json
{
  "meta": {
    "regulationId": "data-act",
    "lastRefreshed": "2026-07-06T12:00:00.000Z",
    "sources": [
      {
        "name": "Data Act Law",
        "url": "https://data-act-law.eu/",
        "description": "Readable English layout of Regulation (EU) 2023/2854"
      }
    ]
  },
  "chapters": [{ "number": 2, "roman": "II", "title": "Obligations of data holders", "articleRange": "4-7" }],
  "articles": [{ "number": 4, "title": "Obligation to make data available", "chapter": 2, "text": "…" }],
  "recitals": [{ "number": 1, "text": "…" }],
  "searchIndex": [{ "id": "article-4", "type": "article", "number": 4, "title": "…", "text": "…" }]
}
```

---

## 1d. Indonesia — UU PDP corpus (`data/id-pdp-content.json`) — excerpts

76 *Pasal* in 16 *BAB*; 4 *menimbang* clauses (a–d) stored as `recitals`.

```json
{
  "meta": {
    "regulationId": "id-pdp",
    "lastRefreshed": "2026-09-07T00:00:13.236Z",
    "lastChecked": "2026-09-07T00:00:13.236Z",
    "datasetHash": "84d40a90…",
    "etl": {
      "extractedFrom": "jdih-komdigi",
      "fetched": true,
      "significant": false,
      "datasetHash": "84d40a90…",
      "articleCount": 76,
      "recitalCount": 4
    },
    "sources": [
      {
        "name": "JDIH Kementerian Komunikasi dan Digital",
        "url": "https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022",
        "description": "Official legal-documentation network of Komdigi; HTML text of UU 27/2022.",
        "documents": [{ "label": "UU No. 27 Tahun 2022 (JDIH Komdigi)", "url": "https://jdih.komdigi.go.id/…" }]
      }
    ]
  },
  "categories": [{ "id": "recitals", "title": "Considering (Menimbang)", "description": "Preamble recitals of UU 27/2022 (huruf a–d).", "sourceUrl": "…", "eurLexUrl": "https://peraturan.go.id/id/uu-no-27-tahun-2022" }],
  "chapters": [{ "number": 1, "roman": "I", "title": "Ketentuan umum", "articleRange": "1-2", "sourceUrl": "…", "eurLexUrl": "https://peraturan.go.id/id/uu-no-27-tahun-2022" }],
  "recitals": [{
    "number": 1,
    "title": "Considering (a) — personal data protection as a human right",
    "text": "bahwa pelindungan data pribadi merupakan salah satu hak asasi manusia …",
    "sourceUrl": "…#menimbang-1"
  }],
  "articles": [{
    "number": 20,
    "title": "Legal bases for processing",
    "text": "Pengendali Data Pribadi wajib memiliki dasar pemrosesan Data Pribadi.\n\nDasar pemrosesan … meliputi:\n\npersetujuan yang sah secara eksplisit …",
    "sourceUrl": "https://jdih.komdigi.go.id/…#pasal-20",
    "eurLexUrl": "https://jdih.kemenkoinfra.go.id/cfind/source/files/uu/uu-nomor-27-tahun-2022.pdf"
  }],
  "searchIndex": [{ "type": "recital", "id": "recital-1", "number": 1, "title": "Recital (1) — Considering (a) — …", "text": "…" }]
}
```

- `eurLexUrl` / `eurLexTxtUrl` are legacy field names; for Indonesian instruments they hold **peraturan.go.id** or the **official PDF salinan**.
- Indonesian `articles[].title` is an **English** structural title (e.g. *Definitions*, *Legal bases for processing*); `text` is the Indonesian statutory wording.

---

## 1e. Indonesia — Satu Data corpus (`data/id-satu-data-content.json`) — excerpts

Perpres 39/2019: 44 *Pasal* in 8 *BAB*; 4 *menimbang* clauses. Official PDF text is the primary ETL source.

```json
{
  "meta": {
    "regulationId": "id-satu-data",
    "etl": { "extractedFrom": "jdih-kemenkoinfra-pdf", "fetched": true, "significant": true, "articleCount": 44, "recitalCount": 4 },
    "sources": [
      { "name": "peraturan.go.id", "url": "https://peraturan.go.id/id/perpres-no-39-tahun-2019", "description": "Official national regulation database entry for Perpres 39/2019.", "documents": [] },
      { "name": "Portal Satu Data Indonesia", "url": "https://data.go.id", "description": "National data-sharing portal implementing Satu Data Indonesia.", "documents": [] }
    ]
  },
  "chapters": [{ "number": 2, "roman": "II", "title": "Prinsip Satu Data Indonesia", "articleRange": "3-10" }],
  "recitals": [{ "number": 1, "title": "Considering (a) — integrated development needs reliable shareable data", "text": "bahwa untuk mewujudkan keterpaduan perencanaan …" }],
  "articles": [{
    "number": 4,
    "title": "Data standards",
    "text": "…",
    "sourceUrl": "https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf",
    "eurLexUrl": "https://peraturan.go.id/id/perpres-no-39-tahun-2019"
  }]
}
```

---

## 1f. Indonesia — SE AI Ethics corpus, soft law (`data/id-ai-ethics-content.json`) — excerpts

SE Menkominfo 9/2023 is **soft law**. Its 7 sections are stored as `articles`; the **nine ethical values** are stored as `recitals`.

```json
{
  "meta": {
    "regulationId": "id-ai-ethics",
    "etl": { "extractedFrom": "jdih-komdigi", "fetched": true, "significant": false, "articleCount": 7, "recitalCount": 9 },
    "sources": [
      {
        "name": "JDIH Kementerian Komunikasi dan Digital",
        "url": "https://jdih.komdigi.go.id/produk_hukum/view/id/883/…",
        "description": "Official HTML text of SE Menkominfo 9/2023 … currently Indonesia's in-force AI ethics instrument; two Presidential Regulations … still awaiting signature as of September 2026.",
        "documents": []
      }
    ]
  },
  "chapters": [{ "number": 1, "roman": "I", "title": "Umum", "articleRange": "1" }],
  "articles": [
    { "number": 1, "title": "General background (Umum)", "text": "Perkembangan teknologi kecerdasan artifisial telah mengalami peningkatan yang signifikan …" },
    { "number": 6, "title": "Operative circular (Isi Edaran)", "text": "…" }
  ],
  "recitals": [
    { "number": 1, "title": "Inclusiveness (Inklusivitas)", "text": "Penyelenggaraan Kecerdasan Artifisial perlu memperhatikan nilai kesetaraan, keadilan, dan perdamaian …", "sourceUrl": "…#nilai-1" },
    { "number": 2, "title": "Humanity (Kemanusiaan)", "text": "…" }
  ]
}
```

Anchors: `#pasal-N` (UU PDP, Satu Data), `#menimbang-N` (preamble), `#bagian-N` (SE sections), `#nilai-N` (SE ethical values).

### 1g. Chapter summaries (`data/chapter-summaries-id-pdp.json`) — excerpt

```json
{
  "regulationId": "id-pdp",
  "source": "inline-fallback",
  "llm": false,
  "generatedAt": null,
  "summaries": { "1": "Bab I defines personal data, controllers, processors, data subjects, and the territorial plus extra-territorial scope of Indonesia's PDP Law …" }
}
```

Same shape for `chapter-summaries-id-satu-data.json` and `chapter-summaries-id-ai-ethics.json`. Note: the stored `source` value (`inline-fallback` here) comes from the file; the API echoes the file's `source`, and returns `source: "missing"` with `summaries: {}` only when the file is absent for a non-GDPR instrument.

---

## 1h. Regulation catalog entry (`GET /api/regulations`) — Indonesian

```json
{
  "id": "id-pdp",
  "shortName": "ID PDP Law",
  "legalLabel": "UU PDP",
  "fullName": "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
  "maxArticles": 76,
  "maxRecitals": 4,
  "maxChapters": 16,
  "segmentMeta": { "recitals": "Considering a–d", "articles": "Pasal 1–76" },
  "hasArticleTopics": false,
  "hasSuitableRecitals": false,
  "jurisdiction": "id",
  "jurisdictionLabel": "Indonesia",
  "officialSiteName": "peraturan.go.id"
}
```

---

## 2. News cache (`data/gdpr-news.json`) — excerpts

One shared cache for EU **and** Indonesian items; per-instrument scope is applied client-side.

```json
{
  "newsFeeds": [
    {
      "name": "European Data Protection Board (EDPB)",
      "url": "https://edpb.europa.eu/feed/publications_en",
      "description": "…"
    },
    {
      "name": "Antara (Hukum)",
      "url": "https://www.antaranews.com/rss/hukum.xml",
      "description": "LKBN Antara — law and justice (official state news agency)"
    }
  ],
  "items": [
    {
      "title": "Example press release",
      "url": "https://edpb.europa.eu/news/news/2026/example_en",
      "sourceName": "European Data Protection Board (EDPB)",
      "sourceUrl": "https://edpb.europa.eu/",
      "date": "2026-03-15",
      "snippet": "Short excerpt…",
      "topic": "Enforcement and Compliance",
      "topicCategory": "Supervisory cooperation",
      "commissionPolicyAreas": ["DIGAG"],
      "summaryParagraphs": ["…", "…", "…"]
    },
    {
      "title": "Mengawal pelindungan data pribadi dari regulasi ke pengawasan",
      "url": "https://www.antaranews.com/berita/5787817/mengawal-pelindungan-data-pribadi-dari-regulasi-ke-pengawasan",
      "sourceName": "Antara (Hukum)",
      "sourceUrl": "https://www.antaranews.com/",
      "date": null,
      "snippet": "UU PDP pelindungan data pribadi",
      "topic": "UU PDP and Komdigi supervision",
      "topicCategory": "Indonesia Personal Data Protection"
    }
  ]
}
```

Indonesian `topicCategory` values: **Indonesia Personal Data Protection**, **Indonesia Satu Data**, **Indonesia AI Ethics**. `date` may be `null` when the publisher listing page exposes none.

---

## 3. Ask request with BYOK (`POST /api/answer`) — illustrative

```json
{
  "query": "What is a high-risk AI system?",
  "regulation": "ai-act",
  "includeWeb": true,
  "industrySectorId": "GENERAL",
  "apiKeys": {
    "groqApiKey": "gsk_…",
    "tavilyApiKey": "tvly-…"
  }
}
```

Indonesian instrument (question may be in Bahasa Indonesia or English):

```json
{
  "query": "Apa dasar pemrosesan data pribadi menurut UU PDP?",
  "regulation": "id-pdp",
  "includeWeb": false,
  "industrySectorId": "GENERAL"
}
```

---

## 4. Ask response (`POST /api/answer`) — illustrative

```json
{
  "query": "What is a high-risk AI system?",
  "regulationId": "ai-act",
  "contentAsOf": "2026-07-06T12:00:00.000Z",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "General", "isicSection": null, "isicDivision": null },
  "answer": "A high-risk AI system is one classified under the Article 6 rules … [S1] … [S2]",
  "sources": [
    { "id": "S1", "kind": "regulation", "type": "article", "number": 6, "title": "Classification rules for high-risk AI systems", "excerpt": "…", "sourceUrl": "https://ai-act-law.eu/article/6/" }
  ],
  "llm": {
    "used": true,
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "note": null,
    "byokGroq": true,
    "byokTavily": false
  }
}
```

Indonesian response fragment (UU PDP; `kind: "regulation"` sources link to JDIH anchors):

```json
{
  "query": "Apa dasar pemrosesan data pribadi menurut UU PDP?",
  "regulationId": "id-pdp",
  "llm": { "used": true, "provider": "tavily", "model": "search+answer (advanced)", "note": "Used after Groq had no usable answer.", "byokGroq": false, "byokTavily": false },
  "answer": "Pengendali Data Pribadi wajib memiliki dasar pemrosesan, termasuk persetujuan yang sah secara eksplisit … [S1]",
  "sources": [
    { "id": "S1", "kind": "regulation", "type": "article", "number": 20, "title": "Legal bases for processing", "chapterTitle": "…", "sourceUrl": "https://jdih.komdigi.go.id/…#pasal-20", "eurLexUrl": "https://jdih.kemenkoinfra.go.id/…", "excerpt": "…" }
  ]
}
```

`llm.provider` is `groq`, `tavily`, or `null` (extractive fallback, `used: false`). For `id-ai-ethics` the Groq prompt adds a soft-law (LEGAL FORCE) rule.

---

## 5. API key validation (`POST /api/validate-api-keys`) — illustrative

```json
{
  "groq": {
    "provider": "groq",
    "provided": true,
    "valid": true,
    "message": "Groq key is valid."
  },
  "tavily": {
    "provider": "tavily",
    "provided": true,
    "valid": true,
    "message": "Tavily key is valid."
  },
  "checkedAt": "2026-07-06T12:00:00.000Z"
}
```

---

## 6. Regulation refresh (`POST /api/refresh`) — illustrative

```json
{
  "success": true,
  "regulationId": "id-pdp",
  "lastRefreshed": "2026-10-20T12:00:00.000Z",
  "lastChecked": "2026-10-20T12:00:05.000Z",
  "etl": { "extractedFrom": "jdih-komdigi", "fetched": true, "significant": false, "articleCount": 76, "recitalCount": 4 },
  "message": "ETL ran (no significant changes detected from jdih-komdigi).",
  "formattingGuardrails": {
    "ok": true,
    "checks": [{ "id": "article-count", "ok": true, "detail": "76" }],
    "warnings": []
  }
}
```

---

## References

- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) — corpus normalization contract (all six corpora)  
- [VARIABLES.md](VARIABLES.md) — full dictionary  
- [API_CONTRACTS.md](API_CONTRACTS.md) — request/response contracts (live routes only)
