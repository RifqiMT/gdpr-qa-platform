# Data schema examples  
## GDPR Q&A Platform

**Purpose:** Illustrative **JSON fragments** for integrators and engineers. Shapes follow current server behavior; **not every optional field** is shown. For authoritative field lists see [VARIABLES.md](VARIABLES.md) and [API_CONTRACTS.md](API_CONTRACTS.md).

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
  "query": "When is consent valid under the GDPR?",
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
  "query": "When is consent valid under the GDPR?",
  "contentAsOf": "2026-05-19T12:00:00.000Z",
  "includeWeb": true,
  "industrySector": { "id": "GENERAL", "label": "General", "isicSection": null, "isicDivision": null },
  "answer": "Consent must be freely given, specific, informed, and unambiguous … [S1] … [S2]",
  "sources": [
    { "id": "S1", "kind": "regulation", "type": "article", "number": 7, "title": "Conditions for consent", "excerpt": "…" },
    { "id": "S2", "kind": "regulation", "type": "recital", "number": 32, "excerpt": "…" }
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
  "checkedAt": "2026-05-19T12:00:00.000Z"
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
