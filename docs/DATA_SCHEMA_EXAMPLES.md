# Data schema examples  
## EU Regulation Q&A Platform

**Version:** 1.3 · **Last updated:** 2026-07-22 · Documentation standard **v2.4** · Product **1.2.5**

Illustrative **JSON fragments** for integrators. Authoritative fields: [VARIABLES.md](VARIABLES.md), [API_CONTRACTS.md](API_CONTRACTS.md).

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

## 2. News cache (`data/gdpr-news.json`) — excerpts

```json
{
  "newsFeeds": [
    {
      "name": "European Data Protection Board (EDPB)",
      "url": "https://edpb.europa.eu/feed/publications_en",
      "description": "…"
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
    }
  ]
}
```

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

---

## 4. Ask response (`POST /api/answer`) — illustrative

```json
{
  "query": "What is a high-risk AI system?",
  "regulationId": "ai-act",
  "contentAsOf": "2026-07-06T12:00:00.000Z",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "General", "isicSection": null, "isicDivision": null },
  "answer": "Consent must be freely given, specific, informed, and unambiguous … [S1] … [S2]",
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
  "message": "Sources refreshed successfully.",
  "formattingGuardrails": {
    "ok": true,
    "checks": [{ "id": "article-count", "ok": true, "detail": "99" }],
    "warnings": []
  }
}
```

---

## References

- [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md) — corpus normalization contract  
- [VARIABLES.md](VARIABLES.md) — full dictionary  
- [API_CONTRACTS.md](API_CONTRACTS.md) — request/response contracts  
