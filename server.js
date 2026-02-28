const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { run: runScraper } = require('./scraper');
const { crawlNews, withTimeout } = require('./news-crawler');

const NEWS_CRAWL_TIMEOUT_MS = 30000;
const DEFAULT_NEWS_FEEDS = [
  { name: 'EDPB', url: 'https://edpb.europa.eu/news_en', description: 'European Data Protection Board news' },
  { name: 'European Commission', url: 'https://commission.europa.eu/news', description: 'Commission news' },
  { name: 'ICO (UK)', url: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/', description: 'ICO news and blogs' },
  { name: 'Council of Europe', url: 'https://www.coe.int/en/web/data-protection', description: 'Data protection' }
];

const app = express();
const PORT = process.env.PORT || 3847;
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'gdpr-content.json');
const STRUCTURE_FILE = path.join(DATA_DIR, 'gdpr-structure.json');
const NEWS_FILE = path.join(DATA_DIR, 'gdpr-news.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadContent() {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
    }
  } catch (_) {}
  try {
    return JSON.parse(fs.readFileSync(STRUCTURE_FILE, 'utf-8'));
  } catch (_) {
    return { meta: {}, categories: [], chapters: [], articles: [], recitals: [], searchIndex: [] };
  }
}

app.get('/api/meta', (req, res) => {
  const data = loadContent();
  res.json({
    lastRefreshed: data.meta?.lastRefreshed ?? null,
    sources: data.meta?.sources ?? [
      { name: 'GDPR-Info', url: 'https://gdpr-info.eu/', description: 'Regulation text and structure.', documents: [{ label: 'Full regulation', url: 'https://gdpr-info.eu/' }] },
      { name: 'EUR-Lex', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng', description: 'Official EU Regulation.', documents: [{ label: 'Regulation (EU) 2016/679', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' }] },
      { name: 'EDPB', url: 'https://edpb.europa.eu/', description: 'EU body – guidelines and consistency.', documents: [{ label: 'Guidelines', url: 'https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en' }] },
      { name: 'European Commission', url: 'https://commission.europa.eu/law/law-topic/data-protection_en', description: 'Official Commission data protection.', documents: [{ label: 'Data protection', url: 'https://commission.europa.eu/law/law-topic/data-protection_en' }] },
      { name: 'ICO (UK)', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance/', description: 'UK GDPR guidance.', documents: [{ label: 'UK GDPR guidance', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance/' }] },
      { name: 'GDPR.eu', url: 'https://gdpr.eu/', description: 'Overview and resources.', documents: [{ label: 'GDPR overview', url: 'https://gdpr.eu/' }] },
      { name: 'Council of Europe', url: 'https://www.coe.int/en/web/data-protection', description: 'Convention 108+ and standards.', documents: [{ label: 'Data protection', url: 'https://www.coe.int/en/web/data-protection' }] }
    ]
  });
});

app.get('/api/news', async (req, res) => {
  let newsFeeds = DEFAULT_NEWS_FEEDS;
  let staticItems = [];
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf-8'));
      newsFeeds = (raw.newsFeeds && raw.newsFeeds.length) ? raw.newsFeeds : newsFeeds;
      staticItems = raw.items || [];
    }
  } catch (_) {}

  let items = staticItems;
  try {
    const crawled = await withTimeout(crawlNews(), NEWS_CRAWL_TIMEOUT_MS);
    const byUrl = new Map();
    crawled.forEach((item) => byUrl.set((item.url || '').toLowerCase().replace(/\/$/, ''), { ...item }));
    staticItems.forEach((item) => {
      const key = (item.url || '').toLowerCase().replace(/\/$/, '');
      if (!byUrl.has(key)) byUrl.set(key, { ...item });
    });
    items = Array.from(byUrl.values()).sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    }).slice(0, 60);
  } catch (err) {
    if (items.length === 0) items = staticItems;
  }
  res.json({ newsFeeds, items });
});

app.get('/api/categories', (req, res) => {
  const data = loadContent();
  res.json(data.categories || []);
});

app.get('/api/chapters', (req, res) => {
  const data = loadContent();
  res.json(data.chapters || []);
});

app.get('/api/chapters/:number', (req, res) => {
  const data = loadContent();
  const num = parseInt(req.params.number, 10);
  const chapter = (data.chapters || []).find(c => c.number === num);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  const articles = (data.articles || []).filter(a => a.chapter === num);
  res.json({ ...chapter, articles });
});

app.get('/api/articles', (req, res) => {
  const data = loadContent();
  res.json(data.articles || []);
});

app.get('/api/articles/:number', (req, res) => {
  const data = loadContent();
  const num = parseInt(req.params.number, 10);
  const article = (data.articles || []).find(a => a.number === num);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  const chapter = (data.chapters || []).find(c => c.number === article.chapter);
  res.json({ ...article, chapter });
});

app.get('/api/recitals', (req, res) => {
  const data = loadContent();
  res.json(data.recitals || []);
});

app.get('/api/recitals/:number', (req, res) => {
  const data = loadContent();
  const num = parseInt(req.params.number, 10);
  const recital = (data.recitals || []).find(r => r.number === num);
  if (!recital) return res.status(404).json({ error: 'Recital not found' });
  res.json({
    ...recital,
    sourceUrl: 'https://gdpr-info.eu/recitals/',
    eurLexUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679'
  });
});

function simpleSearch(query, index) {
  if (!query || !index.length) return [];
  const q = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = index.map(item => {
    const text = ((item.title || '') + ' ' + (item.text || '')).toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (text.includes(t)) score += 1;
      if ((item.title || '').toLowerCase().includes(t)) score += 2;
    }
    return { ...item, score };
  });
  return scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 25);
}

app.post('/api/ask', (req, res) => {
  const data = loadContent();
  const query = (req.body?.query || req.query?.query || '').trim();
  const index = data.searchIndex || [];
  const results = simpleSearch(query, index);
  const articles = data.articles || [];
  const recitals = data.recitals || [];

  res.json({
    query,
    results: results.map(({ score, ...r }) => {
      let fullText = '';
      if (r.type === 'recital') {
        const rec = recitals.find(x => x.number === r.number);
        fullText = rec ? (rec.text || '').trim() : (r.text || '').trim();
      } else {
        const art = articles.find(x => x.number === r.number);
        if (art) {
          fullText = ((art.title || '') + '\n\n' + (art.text || '')).trim();
        } else {
          fullText = (r.text || '').trim();
        }
      }
      return {
        type: r.type,
        id: r.id,
        number: r.number,
        title: r.title,
        excerpt: fullText,
        sourceUrl: r.sourceUrl,
        eurLexUrl: r.eurLexUrl,
        chapterTitle: r.chapterTitle
      };
    })
  });
});

/** Build a concise, comprehensible summary from excerpts (extractive). */
function buildSummaryFromExcerpts(query, excerpts) {
  if (!excerpts || excerpts.length === 0) return 'No provisions were found to summarize. Use the regulation text on the left.';
  const getFirstSentences = (text, maxChars) => {
    const t = (text || '').trim().replace(/\s+/g, ' ');
    if (!t) return '';
    const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    let out = '';
    for (const s of sentences) {
      if (out.length + s.length + 1 > maxChars) break;
      out += (out ? ' ' : '') + s.trim();
    }
    return out || t.slice(0, maxChars).trim();
  };
  const first = excerpts[0];
  const text = (first.excerpt || first.text || '').trim();
  const label = first.type === 'recital' ? `Recital ${first.number}` : `Article ${first.number}`;
  const core = getFirstSentences(text, 320);
  if (!core) return `See ${label} in the regulation text on the left.`;
  const otherSources = excerpts.slice(1, 3).map(ex => ex.type === 'recital' ? `Recital ${ex.number}` : `Article ${ex.number}`);
  const sourceLine = otherSources.length ? `Source: ${label} (see also ${otherSources.join(', ')}).` : `Source: ${label}.`;
  return `${core} ${sourceLine}`;
}

/** Build shared prompt — strict anti-hallucination: answer ONLY from provided credible text. */
function buildSummaryPrompt(query, excerpts) {
  const sourceText = excerpts.slice(0, 5).map((ex) => {
    const label = ex.type === 'recital' ? `Recital ${ex.number}` : `Article ${ex.number}`;
    return `[${label}]\n${(ex.excerpt || ex.text || '').trim().slice(0, 3000)}`;
  }).join('\n\n---\n\n');
  const systemPrompt = `You answer questions about the GDPR (EU Regulation 2016/679) using ONLY the regulation text provided below. You must not hallucinate.

STRICT RULES:
1. Use ONLY information that appears in the provided text. Do not add, infer, or assume anything not explicitly stated.
2. Every claim in your answer must be directly supported by a specific sentence or phrase in the text. When possible, cite the Article or Recital (e.g. "Article 4(1) states that...").
3. If the provided text does not contain an answer to the question, respond with exactly: "The provided regulation text does not contain a direct answer to this question. Please refer to the full text on the left or try rephrasing."
4. Write in plain language, 3–5 clear sentences. Do not quote long passages; summarize only what is there.`;
  const userPrompt = `Question: ${query}\n\nCredible regulation text (use ONLY this):\n${sourceText}\n\nAnswer the question using ONLY the text above. Cite Article/Recital numbers. If the answer is not in the text, say so.`;
  return { systemPrompt, userPrompt };
}

/** OpenAI (gpt-4o-mini, etc.). Requires OPENAI_API_KEY. */
async function summarizeWithOpenAI(query, excerpts) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('OpenAI summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/** Anthropic (Claude). Requires ANTHROPIC_API_KEY. */
async function summarizeWithAnthropic(query, excerpts) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });
  if (!res.ok) {
    console.error('Anthropic summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const block = data.content?.find(b => b.type === 'text');
  return block?.text?.trim() || null;
}

/** Google Gemini. Requires GOOGLE_GEMINI_API_KEY. */
async function summarizeWithGemini(query, excerpts) {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.1
      }
    })
  });
  if (!res.ok) {
    console.error('Gemini summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}

/** Groq (fast inference, OpenAI-compatible). Requires GROQ_API_KEY. */
async function summarizeWithGroq(query, excerpts) {
  const key = process.env.GROQ_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('Groq summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/** Mistral. Requires MISTRAL_API_KEY. */
async function summarizeWithMistral(query, excerpts) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('Mistral summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/** OpenRouter (single API for many models). Requires OPENROUTER_API_KEY. */
async function summarizeWithOpenRouter(query, excerpts) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !excerpts || excerpts.length === 0) return null;
  const { systemPrompt, userPrompt } = buildSummaryPrompt(query, excerpts);
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:3847'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    })
  });
  if (!res.ok) {
    console.error('OpenRouter summarize error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/** Try LLM providers; best instruction-following first (Anthropic, OpenAI) to reduce hallucination. */
async function summarizeWithLLM(query, excerpts) {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (provider === 'openai') return await summarizeWithOpenAI(query, excerpts);
  if (provider === 'anthropic') return await summarizeWithAnthropic(query, excerpts);
  if (provider === 'gemini') return await summarizeWithGemini(query, excerpts);
  if (provider === 'groq') return await summarizeWithGroq(query, excerpts);
  if (provider === 'mistral') return await summarizeWithMistral(query, excerpts);
  if (provider === 'openrouter') return await summarizeWithOpenRouter(query, excerpts);
  // No provider specified: try best models first (Anthropic → OpenAI → others)
  if (process.env.ANTHROPIC_API_KEY) {
    const out = await summarizeWithAnthropic(query, excerpts);
    if (out) return out;
  }
  if (process.env.OPENAI_API_KEY) {
    const out = await summarizeWithOpenAI(query, excerpts);
    if (out) return out;
  }
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    const out = await summarizeWithGemini(query, excerpts);
    if (out) return out;
  }
  if (process.env.GROQ_API_KEY) {
    const out = await summarizeWithGroq(query, excerpts);
    if (out) return out;
  }
  if (process.env.MISTRAL_API_KEY) {
    const out = await summarizeWithMistral(query, excerpts);
    if (out) return out;
  }
  if (process.env.OPENROUTER_API_KEY) {
    const out = await summarizeWithOpenRouter(query, excerpts);
    if (out) return out;
  }
  return null;
}

app.post('/api/summarize', async (req, res) => {
  try {
    const query = (req.body?.query || '').trim();
    const excerpts = Array.isArray(req.body?.excerpts) ? req.body.excerpts : [];
    let summary = '';
    if (excerpts.length > 0) {
      summary = await summarizeWithLLM(query, excerpts) || buildSummaryFromExcerpts(query, excerpts);
    } else {
      summary = buildSummaryFromExcerpts(query, excerpts);
    }
    res.json({ query, summary });
  } catch (err) {
    console.error('Summarize error:', err);
    const query = (req.body?.query || '').trim();
    const excerpts = Array.isArray(req.body?.excerpts) ? req.body.excerpts : [];
    res.json({
      query,
      summary: buildSummaryFromExcerpts(query, excerpts) || 'Summary is temporarily unavailable. Use the regulation text on the left.'
    });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    await runScraper();
    const data = loadContent();
    res.json({
      success: true,
      lastRefreshed: data.meta?.lastRefreshed,
      message: 'Sources refreshed successfully.'
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

cron.schedule('0 2 * * *', async () => {
  try {
    await runScraper();
    console.log('Daily GDPR content refresh completed.');
  } catch (e) {
    console.error('Daily refresh failed:', e.message);
  }
}, { timezone: 'Europe/Brussels' });

if (process.argv.includes('--refresh-only')) {
  runScraper()
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
} else {
  const server = app.listen(PORT, async () => {
    console.log(`GDPR Q&A Platform running at http://localhost:${PORT}`);
    if (!fs.existsSync(CONTENT_FILE)) {
      console.log('No cached content found. Running initial refresh...');
      try {
        await runScraper();
      } catch (e) {
        console.log('Initial refresh failed. Using structure only. Use "Refresh sources" in the app to retry.');
      }
    }
  });
}

module.exports = app;
