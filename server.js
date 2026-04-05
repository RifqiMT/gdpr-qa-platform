const path = require('path');
const fs = require('fs');
(function loadEnvFromFirstExisting() {
  const dotenv = require('dotenv');
  const candidates = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'gdpr-qa-platform', '.env')
  ];
  const envPath = candidates.find((p) => fs.existsSync(p));
  if (envPath) dotenv.config({ path: envPath });
  if (process.env.GROQ_API_KEY) {
    process.env.GROQ_API_KEY = String(process.env.GROQ_API_KEY).replace(/^\uFEFF/, '').trim();
  }
  if (process.env.TAVILY_API_KEY) {
    process.env.TAVILY_API_KEY = String(process.env.TAVILY_API_KEY).replace(/^\uFEFF/, '').trim();
  }
})();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { run: runScraper, buildSearchIndex } = require('./scraper');
const newsCrawlerPath = require.resolve('./news-crawler');
const {
  withTimeout,
  normalizeNewsUrlKey,
  dedupeNewsItemsConsolidated,
  sanitizeNewsItemDates
} = require('./news-crawler');
const { assignNewsTopicFields, getTopicTaxonomyForClient } = require('./news-topics');

/** Reload `news-crawler.js` from disk so refresh picks up code changes without restarting the server. */
function runCrawlNews() {
  delete require.cache[newsCrawlerPath];
  return require('./news-crawler').crawlNews();
}
const { fetchNewsArticleAttachments } = require('./news-article-attachments');
const {
  buildRecitalsCitingArticlesMap,
  mergedSuitableRecitalsForArticle,
  mergedSuitableArticlesForRecital
} = require('./gdpr-crossrefs');

/** Optional: `GET /api/news?live=1` runs a live crawl with this budget (default 90s). */
const NEWS_CRAWL_TIMEOUT_MS = parseInt(process.env.NEWS_CRAWL_TIMEOUT_MS || '90000', 10);
/** “Refresh all sources” / POST /api/news/refresh — must cover ICO API + parallel sitemap enrichment. */
const NEWS_REFRESH_TIMEOUT_MS = parseInt(process.env.NEWS_REFRESH_TIMEOUT_MS || '180000', 10);
/** Max items returned / stored after merging static file + live crawl (all configured sources). */
const NEWS_MERGE_CAP = parseInt(process.env.NEWS_MERGE_CAP || '1600', 10);
const NEWS_ATTACHMENTS_CACHE_TTL_MS = parseInt(process.env.NEWS_ATTACHMENTS_CACHE_TTL_MS || '900000', 10);
const NEWS_ATTACHMENTS_CACHE_MAX = parseInt(process.env.NEWS_ATTACHMENTS_CACHE_MAX || '150', 10);
/** @type {Map<string, { ts: number, payload: { url: string, attachments: object[] } }>} */
const newsArticleAttachmentsCache = new Map();
const WEB_TIMEOUT_MS = parseInt(process.env.WEB_TIMEOUT_MS || '12000', 10);
const WEB_MAX_RESULTS = parseInt(process.env.WEB_MAX_RESULTS || '4', 10);
const WEB_MAX_PAGES = parseInt(process.env.WEB_MAX_PAGES || '3', 10);
const WEB_SNIPPET_CHARS = parseInt(process.env.WEB_SNIPPET_CHARS || '1400', 10);

const DEFAULT_NEWS_FEEDS = [
  { name: 'EDPB', url: 'https://edpb.europa.eu/news_en', description: 'European Data Protection Board news' },
  {
    name: 'EDPS',
    url: 'https://www.edps.europa.eu/press-publications/press-news_en',
    description: 'European Data Protection Supervisor — press, news, and blog'
  },
  { name: 'European Commission', url: 'https://commission.europa.eu/news', description: 'Commission news' },
  { name: 'ICO (UK)', url: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/', description: 'ICO news and blogs' },
  { name: 'Council of Europe', url: 'https://www.coe.int/en/web/data-protection', description: 'Data protection' }
];

/** Append any new default feeds (e.g. EDPS) when `gdpr-news.json` has an older `newsFeeds` list. */
function mergeNewsFeedsWithDefaults(stored) {
  const base =
    stored && Array.isArray(stored) && stored.length > 0 ? stored.slice() : DEFAULT_NEWS_FEEDS.slice();
  const urls = new Set(base.map((f) => f && f.url).filter(Boolean));
  for (const d of DEFAULT_NEWS_FEEDS) {
    if (d && d.url && !urls.has(d.url)) {
      base.push({ ...d });
      urls.add(d.url);
    }
  }
  return base.length ? base : DEFAULT_NEWS_FEEDS.slice();
}

const app = express();
const PORT = process.env.PORT || 3847;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'gdpr-content.json');
const STRUCTURE_FILE = path.join(DATA_DIR, 'gdpr-structure.json');

/** In-memory cache invalidated by gdpr-content.json mtime. Always apply guardrails + rebuild search index so the API matches DOCUMENT_FORMATTING_GUARDRAILS even if the file was never re-fetched from GDPR-Info. */
let contentLoadCache = { mtimeMs: null, data: null };

/** After regulation ETL (`runScraper`), clear cache and reload so APIs/Ask use the file just written (see docs/DOCUMENT_FORMATTING_GUARDRAILS.md §1). */
function invalidateRegulationContentCache() {
  contentLoadCache = { mtimeMs: null, data: null };
}

/** @returns {Promise<object>} Normalized corpus + meta from `loadContent()` after ETL write. */
async function runRegulationScraperAndReloadContent() {
  await runScraper();
  invalidateRegulationContentCache();
  return loadContent();
}
const NEWS_FILE = path.join(DATA_DIR, 'gdpr-news.json');
const ARTICLE_SUITABLE_RECITALS_FILE = path.join(DATA_DIR, 'article-suitable-recitals.json');
const CHAPTER_SUMMARIES_FILE = path.join(DATA_DIR, 'chapter-summaries.json');
const INDUSTRY_SECTORS_FILE = path.join(__dirname, 'public', 'industry-sectors.json');
const INDUSTRY_SECTOR_TREE_FILE = path.join(__dirname, 'public', 'industry-sector-tree.json');

let industrySectorTreeCache = null;
let industrySectorTreeMtimeMs = null;

/** ISIC Rev.4 decision tree for Ask (industry → section → division group → division). */
function loadIndustrySectorTree() {
  try {
    if (!fs.existsSync(INDUSTRY_SECTOR_TREE_FILE)) {
      industrySectorTreeCache = null;
      industrySectorTreeMtimeMs = null;
      return null;
    }
    const st = fs.statSync(INDUSTRY_SECTOR_TREE_FILE);
    if (industrySectorTreeCache != null && industrySectorTreeMtimeMs === st.mtimeMs) {
      return industrySectorTreeCache;
    }
    industrySectorTreeMtimeMs = st.mtimeMs;
    const j = JSON.parse(fs.readFileSync(INDUSTRY_SECTOR_TREE_FILE, 'utf8'));
    if (j && Array.isArray(j.industries) && j.sectorGroups && typeof j.sectorGroups === 'object') {
      industrySectorTreeCache = j;
      return industrySectorTreeCache;
    }
  } catch (e) {
    console.warn('loadIndustrySectorTree:', e.message);
  }
  industrySectorTreeCache = null;
  return null;
}

/** Inline fallback if chapter-summaries.json is missing or invalid (mirrors bundled file). */
const FALLBACK_CHAPTER_SUMMARIES = {
  1: 'GDPR Chapter I frames what the Regulation protects and where it applies: its objectives and material and territorial scope, plus key definitions (including personal data and processing) that the rest of the text builds on.',
  2: 'GDPR Chapter II sets out the core principles for processing personal data and the main grounds for lawfulness—including consent and other bases—alongside specific rules for children\'s consent, special categories of data, and related carve-outs.',
  3: 'GDPR Chapter III describes transparency and information duties toward data subjects and their rights of access, rectification, erasure, restriction, portability, objection, and related modalities, including rules on automated decision-making.',
  4: 'GDPR Chapter IV allocates responsibilities between controllers and processors: accountability tools (such as DPIAs and records), security and breach notification, DPOs, codes of conduct and certification, and obligations when using processors or joint arrangements.',
  5: 'GDPR Chapter V governs transfers of personal data outside the EEA: the general rule, adequacy decisions, appropriate safeguard mechanisms (including BCRs), derogations, and cooperation on international enforcement.',
  6: 'GDPR Chapter VI establishes independent supervisory authorities: their independence, powers, tasks, and lead-authority arrangements for cross-border processing.',
  7: 'GDPR Chapter VII sets up cooperation and consistency among authorities, including the EDPB, consistency opinions, binding decisions, and urgency procedures where views diverge.',
  8: 'GDPR Chapter VIII provides remedies for individuals—complaints, judicial review, representation—and rules on compensation, liability, and administrative fines and penalties.',
  9: 'GDPR Chapter IX contains sector-specific and contextual provisions (e.g. freedom of expression, employment processing, archiving and research, churches) that qualify how standard rules apply in particular situations.',
  10: 'GDPR Chapter X covers delegated and implementing EU acts that empower the Commission to adopt supplementary rules under defined procedures.',
  11: 'GDPR Chapter XI contains final provisions: repeal of the old Directive, relationships with other instruments, reporting and review, and entry into force and application of the GDPR.'
};

function readChapterSummariesPayload() {
  try {
    if (fs.existsSync(CHAPTER_SUMMARIES_FILE)) {
      const j = JSON.parse(fs.readFileSync(CHAPTER_SUMMARIES_FILE, 'utf8'));
      if (j && j.summaries && typeof j.summaries === 'object') {
        return {
          summaries: j.summaries,
          source: j.source || 'file',
          llm: Boolean(j.llm),
          generatedAt: j.generatedAt || null
        };
      }
    }
  } catch (e) {
    console.warn('chapter-summaries.json unreadable:', e.message);
  }
  return {
    summaries: { ...FALLBACK_CHAPTER_SUMMARIES },
    source: 'inline-fallback',
    llm: false,
    generatedAt: null
  };
}

async function generateChapterSummariesWithGroq(contentData) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const chapters = (contentData.chapters || []).slice().sort((a, b) => a.number - b.number);
  const articles = contentData.articles || [];
  const parts = [];
  for (const ch of chapters) {
    const arts = articles.filter((a) => a.chapter === ch.number).sort((a, b) => a.number - b.number);
    const lines = arts
      .map((a) => {
        const excerpt = String(a.text || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 220);
        return `Art. ${a.number} — ${String(a.title || '').trim()}: ${excerpt}`;
      })
      .join('\n');
    parts.push(
      `### Chapter ${ch.number} (${ch.roman}) — ${ch.title}\nArticles ${ch.articleRange}\n${lines || '(no article text in corpus)'}`
    );
  }
  const bundle = parts.join('\n\n').slice(0, 28000);
  const systemPrompt = `You write concise chapter introductions for a GDPR regulation browser.
Output ONLY valid JSON: one object with string keys "1","2",…"11" (all eleven) and string values.
Each value is 2–3 sentences of plain English describing what that chapter covers.
Use ONLY themes supported by the article titles and excerpts provided. Do not invent citations or cases.
No markdown fences, no commentary—only the JSON object.`;
  const userPrompt = `Regulation structure and article excerpts by chapter:\n\n${bundle}\n\nReturn: {"1":"…","2":"…",…,"11":"…"}`;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2200,
      temperature: 0.12
    })
  });
  if (!res.ok) {
    console.error('Groq chapter summaries error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (_) {
    return null;
  }
}

let editorialSuitableState = { mtimeMs: null, articles: {} };
let recitalsCitingArticleCache = { count: 0, map: null };

function getRecitalsCitingArticlesMap(data) {
  const recitals = data.recitals || [];
  const n = recitals.length;
  if (!recitalsCitingArticleCache.map || recitalsCitingArticleCache.count !== n) {
    recitalsCitingArticleCache.map = buildRecitalsCitingArticlesMap(recitals);
    recitalsCitingArticleCache.count = n;
  }
  return recitalsCitingArticleCache.map;
}

/** Reload when the JSON file changes (avoids stale cache if the file was added after server start). */
function getEditorialSuitableRecitalsByArticle() {
  try {
    const st = fs.statSync(ARTICLE_SUITABLE_RECITALS_FILE);
    if (editorialSuitableState.mtimeMs === st.mtimeMs && editorialSuitableState.articles) {
      return editorialSuitableState.articles;
    }
    const raw = JSON.parse(fs.readFileSync(ARTICLE_SUITABLE_RECITALS_FILE, 'utf8'));
    const articles = raw.articles || {};
    editorialSuitableState = { mtimeMs: st.mtimeMs, articles };
    return articles;
  } catch (_) {
    editorialSuitableState = { mtimeMs: null, articles: {} };
    return editorialSuitableState.articles;
  }
}

app.use(cors());
app.use(express.json());

/** Fast liveness probe for load balancers and monitoring. */
app.get('/health', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.get('/article-suitable-recitals.json', (req, res) => {
  res.type('application/json');
  if (!fs.existsSync(ARTICLE_SUITABLE_RECITALS_FILE)) {
    return res.json({ source: '', articles: {}, error: 'Cross-reference file not found' });
  }
  res.sendFile(path.resolve(ARTICLE_SUITABLE_RECITALS_FILE));
});

function loadContent() {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const st = fs.statSync(CONTENT_FILE);
      if (contentLoadCache.data && contentLoadCache.mtimeMs === st.mtimeMs) {
        return contentLoadCache.data;
      }
      const raw = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
      const { normalizeCorpus } = require('./document-formatting-guardrails');
      const norm = normalizeCorpus(raw.recitals || [], raw.articles || []);
      raw.recitals = norm.recitals;
      raw.articles = norm.articles;
      if (Array.isArray(raw.chapters) && raw.chapters.length) {
        try {
          raw.searchIndex = buildSearchIndex(raw.recitals, raw.articles, raw.chapters);
        } catch (e) {
          console.warn('[loadContent] searchIndex rebuild failed:', e && e.message ? e.message : String(e));
        }
      }
      contentLoadCache = { mtimeMs: st.mtimeMs, data: raw };
      return raw;
    }
  } catch (e) {
    console.warn('loadContent:', e && e.message ? e.message : String(e));
  }
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
    lastChecked: data.meta?.lastChecked ?? null,
    etl: data.meta?.etl ?? null,
    askGroqConfigured: Boolean((process.env.GROQ_API_KEY || '').trim()),
    askTavilyConfigured: Boolean((process.env.TAVILY_API_KEY || '').trim()),
    sources: data.meta?.sources ?? [
      { name: 'GDPR-Info', url: 'https://gdpr-info.eu/', description: 'Regulation text and structure.', documents: [{ label: 'Full regulation', url: 'https://gdpr-info.eu/' }] },
      { name: 'EUR-Lex', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng', description: 'Official EU Regulation.', documents: [{ label: 'Regulation (EU) 2016/679', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng' }] },
      { name: 'EDPB', url: 'https://edpb.europa.eu/', description: 'EU body – guidelines and consistency.', documents: [{ label: 'Guidelines', url: 'https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en' }] },
      {
        name: 'EDPS',
        url: 'https://www.edps.europa.eu/',
        description: 'Supervises personal data processing by EU institutions and bodies.',
        documents: [
          { label: 'Press & news', url: 'https://www.edps.europa.eu/press-publications/press-news_en' },
          { label: 'Our work', url: 'https://www.edps.europa.eu/data-protection/our-work_en' }
        ]
      },
      { name: 'European Commission', url: 'https://commission.europa.eu/law/law-topic/data-protection_en', description: 'Official Commission data protection.', documents: [{ label: 'Data protection', url: 'https://commission.europa.eu/law/law-topic/data-protection_en' }] },
      { name: 'ICO (UK)', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance/', description: 'UK GDPR guidance.', documents: [{ label: 'UK GDPR guidance', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance/' }] },
      { name: 'GDPR.eu', url: 'https://gdpr.eu/', description: 'Overview and resources.', documents: [{ label: 'GDPR overview', url: 'https://gdpr.eu/' }] },
      { name: 'Council of Europe', url: 'https://www.coe.int/en/web/data-protection', description: 'Convention 108+ and standards.', documents: [{ label: 'Data protection', url: 'https://www.coe.int/en/web/data-protection' }] }
    ]
  });
});

function normNewsKey(url) {
  const k = normalizeNewsUrlKey(url);
  if (k) return k;
  return String(url || '')
    .toLowerCase()
    .replace(/\/$/, '')
    .trim();
}

/** Merge live crawl with bundled/static items; keep rich fields (e.g. summaryParagraphs) from static when URLs match. */
function mergeNewsItems(staticItems, crawledItems) {
  const map = new Map();
  for (const c of crawledItems || []) {
    const k = normNewsKey(c.url);
    if (!k || !c.title) continue;
    map.set(k, { ...c });
  }
  for (const s of staticItems || []) {
    const k = normNewsKey(s.url);
    if (!k) continue;
    const ex = map.get(k);
    if (!ex) {
      map.set(k, { ...s });
    } else {
      const sp = s.summaryParagraphs;
      const hasSp = Array.isArray(sp) && sp.length > 0;
      map.set(k, {
        ...ex,
        summaryParagraphs: hasSp ? sp : ex.summaryParagraphs,
        snippet: ex.snippet || s.snippet,
        date: ex.date || s.date
      });
    }
  }
  const merged = Array.from(map.values()).sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return dedupeNewsItemsConsolidated(merged);
}

function finalizeNewsListItem(it) {
  return assignNewsTopicFields(sanitizeNewsItemDates(it));
}

function annotateNewsItemsWithTopics(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((it) => finalizeNewsListItem(it));
}

function readNewsFilePayload() {
  let newsFeeds = DEFAULT_NEWS_FEEDS;
  let staticItems = [];
  let description = '';
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf-8'));
      newsFeeds = mergeNewsFeedsWithDefaults(raw.newsFeeds);
      staticItems = raw.items || [];
      description = raw.description || '';
    }
  } catch (e) {
    console.warn('readNewsFilePayload:', e.message);
  }
  return { newsFeeds, staticItems, description };
}

/**
 * News list: served from `data/gdpr-news.json` for a fast, reliable response.
 * A live crawl on every page load often exceeded `NEWS_CRAWL_TIMEOUT_MS`, so the API fell back to
 * the static file only — users kept seeing ~3 ICO rows from the bundled JSON. Use **Refresh all sources**
 * (`POST /api/news/refresh`) to re-crawl and persist. Optional: `GET /api/news?live=1` merges a live crawl.
 */
app.get('/api/news', async (req, res) => {
  const { newsFeeds, staticItems } = readNewsFilePayload();
  let items = dedupeNewsItemsConsolidated(staticItems).slice(0, NEWS_MERGE_CAP);
  if (String(req.query.live || '') === '1') {
    try {
      const crawled = await withTimeout(runCrawlNews(), NEWS_CRAWL_TIMEOUT_MS);
      items = mergeNewsItems(staticItems, crawled).slice(0, NEWS_MERGE_CAP);
    } catch (err) {
      console.warn('GET /api/news live crawl:', err.message || err);
    }
  }
  items = annotateNewsItemsWithTopics(items);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.json({ newsFeeds, items, topicTaxonomy: getTopicTaxonomyForClient() });
});

/**
 * Load attachment list for one article URL; uses shared cache with single-item API.
 * @param {string} decoded
 * @param {{ timeout?: number }} [opts]
 */
async function resolveArticleAttachmentsPayload(decoded, opts) {
  const timeout = opts && opts.timeout != null ? opts.timeout : 20000;
  const trimmed = String(decoded || '').trim();
  if (!trimmed || trimmed.length > 2048) {
    const e = new Error(trimmed ? 'URL too long.' : 'Invalid URL');
    e.code = 'BAD_URL';
    throw e;
  }
  const cacheKey = normalizeNewsUrlKey(trimmed);
  const hit = newsArticleAttachmentsCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < NEWS_ATTACHMENTS_CACHE_TTL_MS) {
    return { ...hit.payload, cached: true };
  }
  const result = await fetchNewsArticleAttachments(trimmed, { timeout });
  if (newsArticleAttachmentsCache.size >= NEWS_ATTACHMENTS_CACHE_MAX) {
    const first = newsArticleAttachmentsCache.keys().next().value;
    if (first != null) newsArticleAttachmentsCache.delete(first);
  }
  newsArticleAttachmentsCache.set(cacheKey, { ts: Date.now(), payload: result });
  return { ...result, cached: false };
}

/**
 * Discover downloadable files linked from an allowlisted news article (PDF, Office, etc.).
 * Use POST JSON `{ "url": "https://..." }` (preferred — avoids proxy/query limits) or GET `?url=`.
 * Cached briefly to avoid hammering regulator sites.
 */
async function handleNewsArticleAttachments(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const raw =
    req.method === 'POST' && req.body && typeof req.body.url === 'string'
      ? req.body.url
      : typeof req.query.url === 'string'
        ? req.query.url
        : null;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'Missing url. Send POST JSON { "url": "https://..." } or GET ?url=…'
    });
  }
  try {
    const payload = await resolveArticleAttachmentsPayload(raw.trim(), { timeout: 20000 });
    const { cached, ...rest } = payload;
    res.json({ ok: true, cached, ...rest });
  } catch (e) {
    const code = e && e.code;
    if (code === 'NOT_ALLOWED') {
      return res.status(403).json({
        ok: false,
        error: 'This URL is not from an allowed news source.'
      });
    }
    if (code === 'BAD_URL') {
      return res.status(400).json({ ok: false, error: e.message || 'Invalid URL.' });
    }
    console.warn('/api/news/article-attachments:', e.message || e);
    res.status(502).json({
      ok: false,
      error: 'Could not fetch or parse the article page. The site may be slow or blocking automated requests.'
    });
  }
}

app.get('/api/news/article-attachments', handleNewsArticleAttachments);
app.post('/api/news/article-attachments', handleNewsArticleAttachments);

/** Batch attachment counts for many news URLs (deduped, capped) — used to hide per-card Attachments when count is 0. */
app.post('/api/news/attachments-summary', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const arr = req.body && req.body.urls;
  if (!Array.isArray(arr)) {
    return res.status(400).json({ ok: false, error: 'Request JSON must include urls: string[].' });
  }
  const seenNorm = new Set();
  const urls = [];
  for (const u of arr) {
    const s = String(u || '').trim();
    if (!s.startsWith('http')) continue;
    const k = normalizeNewsUrlKey(s);
    if (!k || seenNorm.has(k)) continue;
    seenNorm.add(k);
    urls.push(s);
    if (urls.length >= 48) break;
  }
  const items = [];
  const concurrency = 6;
  const batchTimeout = 10000;
  for (let i = 0; i < urls.length; i += concurrency) {
    const slice = urls.slice(i, i + concurrency);
    const part = await Promise.all(
      slice.map(async (url) => {
        try {
          const payload = await resolveArticleAttachmentsPayload(url, { timeout: batchTimeout });
          return { url, count: Array.isArray(payload.attachments) ? payload.attachments.length : 0 };
        } catch {
          return { url, count: null };
        }
      })
    );
    items.push(...part);
  }
  res.json({ ok: true, items });
});

/** Full crawl from all sources, merge with existing JSON, write cache, return fresh list (used by “Refresh news”). */
app.post('/api/news/refresh', async (req, res) => {
  const { newsFeeds, staticItems, description } = readNewsFilePayload();
  try {
    const crawled = await withTimeout(runCrawlNews(), NEWS_REFRESH_TIMEOUT_MS);
    const merged = mergeNewsItems(staticItems, crawled);
    const storeCap = Math.max(NEWS_MERGE_CAP + 400, 2000);
    const storedItems = merged.slice(0, storeCap).map((it) => finalizeNewsListItem(it));
    const payload = {
      description:
        description ||
        'GDPR and data protection news from credible sources. Each item links to the original article. Use Refresh news to re-fetch all feeds.',
      newsFeeds,
      items: storedItems
    };
    try {
      fs.writeFileSync(NEWS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (w) {
      console.warn('NEWS_FILE write failed:', w.message);
    }
    const outItems = storedItems.slice(0, NEWS_MERGE_CAP);
    res.json({
      ok: true,
      newsFeeds,
      items: outItems,
      topicTaxonomy: getTopicTaxonomyForClient(),
      mergedTotal: merged.length,
      stored: Math.min(merged.length, storeCap)
    });
  } catch (e) {
    console.error('POST /api/news/refresh:', e.message || e);
    const merged = mergeNewsItems(staticItems, []);
    res.status(200).json({
      ok: false,
      error: String(e.message || e),
      newsFeeds,
      items: annotateNewsItemsWithTopics(merged.slice(0, NEWS_MERGE_CAP)),
      topicTaxonomy: getTopicTaxonomyForClient(),
      mergedTotal: merged.length
    });
  }
});

app.get('/api/categories', (req, res) => {
  const data = loadContent();
  res.json(data.categories || []);
});

app.get('/api/chapters', (req, res) => {
  const data = loadContent();
  const list = (data.chapters || []).map((c) => {
    const sourceUrl = c.sourceUrl || `https://gdpr-info.eu/chapter-${c.number}/`;
    return { ...c, sourceUrl, gdprInfoChapterUrl: sourceUrl };
  });
  res.json(list);
});

app.get('/api/chapter-summaries', (req, res) => {
  const payload = readChapterSummariesPayload();
  res.json({
    summaries: payload.summaries,
    source: payload.source,
    llm: payload.llm,
    generatedAt: payload.generatedAt
  });
});

/** Regenerate cached chapter summaries with Groq (writes data/chapter-summaries.json). Requires GROQ_API_KEY. */
app.post('/api/chapter-summaries/regenerate', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured; using bundled summaries.' });
  }
  const data = loadContent();
  try {
    const summaries = await generateChapterSummariesWithGroq(data);
    if (!summaries || typeof summaries !== 'object') {
      return res.status(500).json({ error: 'LLM did not return parseable JSON summaries.' });
    }
    const normalized = {};
    for (let n = 1; n <= 11; n++) {
      const v = summaries[String(n)] || summaries[n];
      normalized[String(n)] = typeof v === 'string' ? v.trim() : FALLBACK_CHAPTER_SUMMARIES[n];
    }
    const out = {
      summaries: normalized,
      source: 'regenerated',
      llm: true,
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CHAPTER_SUMMARIES_FILE, JSON.stringify(out, null, 2), 'utf8');
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/chapters/:number', (req, res) => {
  const data = loadContent();
  const num = parseInt(req.params.number, 10);
  const chapter = (data.chapters || []).find(c => c.number === num);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  const articles = (data.articles || []).filter(a => a.chapter === num);
  const sourceUrl = chapter.sourceUrl || `https://gdpr-info.eu/chapter-${num}/`;
  res.json({ ...chapter, sourceUrl, gdprInfoChapterUrl: sourceUrl, articles });
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
  const citingMap = getRecitalsCitingArticlesMap(data);
  const editorial = getEditorialSuitableRecitalsByArticle();
  const suitableRecitals = mergedSuitableRecitalsForArticle(num, editorial, citingMap);
  res.json({
    ...article,
    chapter,
    contentAsOf: data.meta?.lastRefreshed || null,
    suitableRecitals
  });
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
  const editorial = getEditorialSuitableRecitalsByArticle();
  const suitableArticles = mergedSuitableArticlesForRecital(num, editorial, recital.text || '');
  /** Same path pattern as scraper.js (`/recitals/no-${n}/`) — opens this recital on GDPR-Info, not the recitals index. */
  const gdprInfoRecitalUrl = `https://gdpr-info.eu/recitals/no-${num}/`;
  res.json({
    ...recital,
    sourceUrl: gdprInfoRecitalUrl,
    eurLexUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
    contentAsOf: data.meta?.lastRefreshed || null,
    suitableArticles
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

function normalizeTextForIndex(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim()
    .toLowerCase();
}

function tokenize(text) {
  const t = normalizeTextForIndex(text);
  if (!t) return [];
  return t
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter(tok => tok.length >= 2);
}

function buildBm25Searcher(index, options) {
  const k1 = options?.k1 ?? 1.2;
  const b = options?.b ?? 0.75;
  const docs = (index || []).map((item, i) => {
    const title = String(item.title || '');
    const text = String(item.text || '');
    const combined = `${title}\n${text}`;
    const tokens = tokenize(combined);
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    return { i, item, tokens, tf, len: tokens.length };
  });
  const N = docs.length || 1;
  const avgdl = docs.reduce((s, d) => s + d.len, 0) / N || 1;
  const df = new Map();
  docs.forEach((d) => {
    const seen = new Set(d.tokens);
    seen.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });
  const idf = new Map();
  for (const [t, n] of df.entries()) {
    const val = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    idf.set(t, val);
  }
  const titleBoost = options?.titleBoost ?? 1.4;
  return function search(query, limit) {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];
    const qSet = Array.from(new Set(qTokens));
    const scored = [];
    for (const d of docs) {
      if (!d.len) continue;
      let score = 0;
      const titleTokens = tokenize(d.item.title || '');
      const titleSet = new Set(titleTokens);
      for (const t of qSet) {
        const f = d.tf.get(t) || 0;
        if (!f) continue;
        const termIdf = idf.get(t) || 0;
        const denom = f + k1 * (1 - b + b * (d.len / avgdl));
        const bm25 = termIdf * ((f * (k1 + 1)) / denom);
        const boost = titleSet.has(t) ? titleBoost : 1.0;
        score += bm25 * boost;
      }
      if (score > 0) scored.push({ ...d.item, score });
    }
    scored.sort((a, b2) => b2.score - a.score);
    return scored.slice(0, limit || 12);
  };
}

function chunkExcerpt(text, maxChars) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= maxChars) return t;
  // Prefer splitting at sentence boundary near maxChars
  const slice = t.slice(0, maxChars + 200);
  const m = slice.match(/^[\s\S]*?[.!?](?=\s|$)/g);
  if (m && m.length) {
    let out = '';
    for (const s of m) {
      if (out.length + s.length + 1 > maxChars) break;
      out += (out ? ' ' : '') + s.trim();
    }
    if (out.length >= Math.min(180, maxChars)) return out;
  }
  return t.slice(0, maxChars).trim();
}

let industrySectorsCache = null;
let industrySectorsFileMtimeMs = null;
function loadIndustrySectorsList() {
  try {
    const st = fs.statSync(INDUSTRY_SECTORS_FILE);
    if (industrySectorsCache != null && industrySectorsFileMtimeMs === st.mtimeMs) {
      return industrySectorsCache;
    }
    industrySectorsFileMtimeMs = st.mtimeMs;
    const raw = fs.readFileSync(INDUSTRY_SECTORS_FILE, 'utf8');
    const j = JSON.parse(raw);
    industrySectorsCache = Array.isArray(j) && j.length ? j : null;
  } catch (_) {
    industrySectorsCache = null;
    industrySectorsFileMtimeMs = null;
  }
  if (!industrySectorsCache) {
    industrySectorsCache = [
      {
        id: 'GENERAL',
        label: 'General — no sector-specific framing',
        isicSection: null,
        isicDivision: null,
        searchTerms: '',
        framework: ''
      }
    ];
  }
  return industrySectorsCache;
}

function resolveIndustrySector(rawId) {
  const list = loadIndustrySectorsList();
  const sid = String(rawId || 'GENERAL').trim() || 'GENERAL';
  return list.find((x) => x.id === sid) || list.find((x) => x.id === 'GENERAL') || list[0];
}

/** Text after section/division code and dash, e.g. "Electricity, gas, steam…" — used for mandatory verbatim mention. */
function sectorLabelFocusPhrase(sector) {
  if (!sector || sector.id === 'GENERAL') return '';
  const lab = String(sector.label || '').trim();
  let m = lab.match(/^[A-Z]\s*[—–-]\s*(.+)$/i);
  if (m) return m[1].trim();
  m = lab.match(/^\d{2}\s*[—–-]\s*(.+)$/);
  if (m) return m[1].trim();
  return lab.trim() || lab;
}

/** Keywords to detect whether the model actually referenced the sector (not just "the industry"). */
function sectorMatchKeywords(sector) {
  if (!sector || sector.id === 'GENERAL') return [];
  const focus = sectorLabelFocusPhrase(sector);
  const fromLabel = tokenize(focus).filter((t) => t.length >= 3);
  const fromTerms = tokenize(String(sector.searchTerms || '')).filter((t) => t.length >= 4);
  const merged = [];
  const seen = new Set();
  for (const t of [...fromLabel, ...fromTerms]) {
    if (seen.has(t)) continue;
    seen.add(t);
    merged.push(t);
  }
  return merged.slice(0, 14);
}

function answerNamesSelectedSector(answerText, sector) {
  if (!sector || sector.id === 'GENERAL') return true;
  const focus = sectorLabelFocusPhrase(sector).toLowerCase();
  const t = String(answerText || '')
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ');
  if (focus.length >= 8 && t.includes(focus)) return true;
  const kws = sectorMatchKeywords(sector);
  if (kws.length === 0) return true;
  const hits = kws.filter((k) => t.includes(k));
  const need = kws.length >= 3 ? 2 : 1;
  return hits.length >= need;
}

/** Short thematic keywords from sector.searchTerms for prompts (BM25-style anchors, not a second law). */
function sectorThematicAnchorsLine(sector) {
  if (!sector || sector.id === 'GENERAL') return '';
  const parts = tokenize(String(sector.searchTerms || '')).filter((t) => t.length > 3);
  const uniq = [];
  const seen = new Set();
  for (const p of parts) {
    if (seen.has(p)) continue;
    seen.add(p);
    uniq.push(p);
    if (uniq.length >= 10) break;
  }
  return uniq.length ? uniq.join(', ') : '';
}

/** User-message prefix: ISIC Rev.4–style sector; customization + reliability instructions for filtered Ask. */
function formatSectorUserBlock(sector) {
  if (!sector || sector.id === 'GENERAL') return '';
  const fw = sector.framework ? `\nClassification: ${sector.framework}` : '';
  const focus = sectorLabelFocusPhrase(sector);
  const anchors = sectorThematicAnchorsLine(sector);
  const sec =
    sector.isicSection != null && String(sector.isicSection).trim()
      ? String(sector.isicSection).trim().toUpperCase()
      : '';
  const div = sector.isicDivision != null && String(sector.isicDivision).trim()
    ? String(sector.isicDivision).trim().padStart(2, '0')
    : '';
  const isicLine = div
    ? `ISIC Rev.4 division: ${div} (Section ${sec || '—'})`
    : sec
      ? `ISIC Rev.4 section: ${sec}`
      : `ISIC Rev.4: ${String(sector.id || '').toUpperCase()}`;
  const anchorLine = anchors
    ? `Thematic anchors (weave naturally where they fit the sources — do not invent duties): ${anchors}\n`
    : '';
  return (
    'SELECTED INDUSTRY / SECTOR (the user chose this filter; customize the whole answer — see system rules):\n' +
    `Full label: ${sector.label}\n` +
    `${isicLine}\n` +
    `Verbatim phrase you MUST use at least once in the body (copy exactly): ${focus}${fw}\n` +
    `${anchorLine}` +
    'RELEVANCE & RELIABILITY:\n' +
    '- Write as guidance for controllers/processors in THIS line of business, not generic "any organization".\n' +
    '- After each main GDPR point, add one short clause tying it to typical processing in this sector (e.g. customers, employees, visitors, subscribers) only where the cited sources give a fair basis — no invented sector-specific statutes.\n' +
    '- If the excerpts are generic GDPR text only, say that briefly, then still explain how those duties apply to typical activities in this sector at a high level, without new legal claims.\n\n'
  );
}

function buildLocalContext(data, query, sector) {
  const index = data.searchIndex || [];
  const search = buildBm25Searcher(index, { titleBoost: 1.8 });
  let searchQuery =
    sector && sector.id !== 'GENERAL' && String(sector.searchTerms || '').trim()
      ? `${query} ${sector.searchTerms}`.trim()
      : query;
  if (sector && sector.id !== 'GENERAL') {
    const fp = sectorLabelFocusPhrase(sector);
    if (fp && fp.length > 5) {
      const fpTok = tokenize(fp)
        .filter((t) => t.length > 4)
        .slice(0, 8)
        .join(' ');
      if (fpTok) searchQuery = `${searchQuery} ${fpTok}`.trim();
    }
  }
  if ((!sector || sector.id === 'GENERAL') && querySeemsLaypersonExplain(query)) {
    searchQuery =
      `${query} personal data definition principles lawfulness fairness transparency rights data subject controller processing`.trim();
  }
  let top = search(searchQuery, 40);
  top = filterScoredResultsForAskQuery(top, query);
  if (sector && sector.id !== 'GENERAL' && String(sector.searchTerms || '').trim()) {
    const sectorQ = `${sector.searchTerms} controller processor personal data security breach processing activities lawfulness transparency`.trim();
    const extra = search(sectorQ, 22);
    const seen = new Set(top.map((r) => `${r.type}-${r.number}`));
    for (const r of extra) {
      const k = `${r.type}-${r.number}`;
      if (seen.has(k)) continue;
      seen.add(k);
      top.push({ ...r, score: (r.score || 0) * 0.82 });
    }
    top.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  const articles = data.articles || [];
  const recitals = data.recitals || [];
  const chapters = data.chapters || [];
  const qLower = String(query || '').toLowerCase();
  const wantsRecitals = /\brecital(s)?\b/.test(qLower);
  const scored = top.slice();
  const scoredArticles = scored.filter(r => r.type === 'article');
  const scoredRecitals = scored.filter(r => r.type === 'recital');

  // Prefer Articles for "what must/should" type questions; use Recitals as context.
  // If user explicitly asks for recitals, flip priority.
  const maxTotal = sector && sector.id !== 'GENERAL' ? 11 : 10;
  let articleTarget = wantsRecitals ? 3 : 7;
  let recitalTarget = wantsRecitals ? 7 : 3;
  if (sector && sector.id !== 'GENERAL' && !wantsRecitals) {
    articleTarget = Math.min(8, articleTarget + 1);
  }
  if (querySeemsLaypersonExplain(query) && !wantsRecitals && (!sector || sector.id === 'GENERAL')) {
    articleTarget = 5;
    recitalTarget = 5;
  }
  const picked = [
    ...scoredArticles.slice(0, articleTarget),
    ...scoredRecitals.slice(0, recitalTarget)
  ].slice(0, maxTotal);

  const out = [];
  picked.forEach((r) => {
    let fullText = '';
    let title = r.title || '';
    let chapterTitle = r.chapterTitle || '';
    if (r.type === 'recital') {
      const rec = recitals.find(x => x.number === r.number);
      fullText = rec ? (rec.text || '').trim() : (r.text || '').trim();
    } else {
      const art = articles.find(x => x.number === r.number);
      if (art) {
        title = art.title || title;
        fullText = ((art.title || '') + '\n\n' + (art.text || '')).trim();
        const ch = chapters.find(c => c.number === art.chapter);
        if (ch) chapterTitle = ch.title || chapterTitle;
      } else {
        fullText = (r.text || '').trim();
      }
    }
    const excerpt = chunkExcerpt(fullText, 2200);
    out.push({
      kind: 'regulation',
      type: r.type,
      number: r.number,
      title: title || (r.type === 'recital' ? `Recital (${r.number})` : `Article ${r.number}`),
      chapterTitle,
      sourceUrl: r.sourceUrl,
      eurLexUrl: r.eurLexUrl,
      excerpt
    });
  });
  return out;
}

async function fetchWithTimeout(url, options) {
  return await withTimeout(fetch(url, options), WEB_TIMEOUT_MS);
}

function stripHtmlToText(html) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html || '');
  $('script, style, noscript, svg, header, footer, nav, form, iframe').remove();
  const text = $('body').text() || $.text() || '';
  return String(text).replace(/\s+/g, ' ').trim();
}

async function webSearchDuckDuckGo(query) {
  const q = encodeURIComponent(query);
  const url = `https://duckduckgo.com/html/?q=${q}`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GDPR-QA-Platform/1.0; +http://localhost)'
    }
  });
  if (!res.ok) return [];
  const html = await res.text();
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const results = [];
  $('.result').each((_, el) => {
    if (results.length >= WEB_MAX_RESULTS) return;
    const a = $(el).find('.result__a').first();
    const href = a.attr('href') || '';
    const title = a.text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();
    if (!href || !title) return;
    results.push({ title, url: href, snippet });
  });
  return results;
}

async function fetchWebSnippets(query) {
  const hits = await webSearchDuckDuckGo(query);
  const pages = [];
  for (const hit of hits.slice(0, WEB_MAX_PAGES)) {
    try {
      const res = await fetchWithTimeout(hit.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GDPR-QA-Platform/1.0; +http://localhost)'
        }
      });
      if (!res.ok) continue;
      const html = await res.text();
      const text = stripHtmlToText(html);
      const excerpt = chunkExcerpt(text, WEB_SNIPPET_CHARS);
      if (!excerpt) continue;
      pages.push({
        kind: 'web',
        title: hit.title,
        url: hit.url,
        snippet: hit.snippet || '',
        excerpt
      });
    } catch (_) {}
  }
  return pages;
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
    contentAsOf: data.meta?.lastRefreshed || null,
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
function buildSummaryFromExcerpts(query, excerpts, sector) {
  if (!excerpts || excerpts.length === 0) {
    const empty =
      sector && sector.id !== 'GENERAL'
        ? `No matching provisions were retrieved for this query with sector “${sector.label}”. Try rephrasing or choose General.`
        : 'No provisions were found to summarize. Use the regulation text on the left.';
    return empty;
  }
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
  const focus = sector && sector.id !== 'GENERAL' ? sectorLabelFocusPhrase(sector) : '';
  const sectorPrefix =
    sector && sector.id !== 'GENERAL'
      ? `Filtered context: ${sector.label}${focus ? ` (${focus})` : ''}. Interpret the following strictly as GDPR obligations that would apply to typical personal-data processing in this line of business; it is extractive summary only, not tailored legal advice. From the retrieved text: `
      : '';
  return `${sectorPrefix}${core} ${sourceLine}`;
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

function querySeemsMetricsFocused(q) {
  return /\b(metric|metrics|kpi|kpis|indicator|indicators|dashboard|measure|measuring|track|monitor|benchmark|scorecard|example)s?\b/i.test(
    String(q || '')
  );
}

/** User wants simple / non-technical explanation (often wrong BM25 hits e.g. Art. 8). */
function querySeemsLaypersonExplain(q) {
  const s = String(q || '').toLowerCase();
  if (/\brecital(s)?\b/.test(s)) return false;
  return (
    /\bgrandparent|grandparents|grandma|grandpa|grandmother|grandfather|elderly|seniors?\s+citizens?|80\s*\+|eighty|non-technical|no\s+idea\s+about\s+technology|simple\s+words|plain\s+language|lay\s*person|everyday\s+language|like\s+i'?m\s+five\b/i.test(
      s
    ) ||
    /\bexplain\s+(to|for)\s+(my\s+)?(grand|mom|dad|father|mother|parents|family)\b/i.test(s) ||
    /\bexplanation\s+about\s+.*\b(to|for)\s+my\b/i.test(s) ||
    /\bgive\s+(me\s+)?(an?\s+)?explanation\s+about\b/i.test(s) ||
    (/\bexplain\b.*\bgdpr\b/i.test(s) && !/\barticle\s*\d+/i.test(s)) ||
    /\bwhat\s+is\s+(the\s+)?gdpr\b/i.test(s) ||
    /\bgdpr\b.*\b(simple|simply|easy|understand|plain)\b/i.test(s)
  );
}

function queryMentionsChildrenOrMinors(q) {
  return /\bchild|children|minor|minors|under\s*1[0-6]|age\s*of\s*consent|parental|parent\s+consent|school|pupil|teenager|adolescent|kids?\s+online\b/i.test(
    String(q || '')
  );
}

/** Drop retrieved articles that usually derail unrelated questions (e.g. child's consent vs grandparents). */
function articleIrrelevantForAskQuery(articleNum, query) {
  const n = Number(articleNum);
  if (!Number.isFinite(n)) return false;
  if (n === 8 && querySeemsLaypersonExplain(query) && !queryMentionsChildrenOrMinors(query)) return true;
  return false;
}

function filterScoredResultsForAskQuery(scored, query) {
  const arr = (scored || []).filter((r) => {
    if (r && r.type === 'article' && articleIrrelevantForAskQuery(r.number, query)) return false;
    return true;
  });
  return arr.length ? arr : scored;
}

/** When sector is General: tell the model not to invent industries or tangential topics. */
function formatGeneralAskBlock(sector) {
  if (!sector || sector.id !== 'GENERAL') return '';
  return (
    'INDUSTRY / SECTOR: General (no specific sector selected).\n' +
    'Answer in ONE coherent narrative for the user’s question only. At most one short “For …” lead-in if it matches their audience (e.g. grandparents). Never add a second section for healthcare workers, businesses, banks, or other roles the user did not name.\n\n'
  );
}

function queryWantsMultipleAudiences(q) {
  return /\b(two|three|several)\s+(different\s+)?(audiences|versions|answers|explanations)\b|\bseparate(ly)?\s+for\b|\b(and|plus)\s+also\s+explain\s+to\b/i.test(
    String(q || '')
  );
}

/** Count "For …:" line starters; skip "For example" / "For instance". */
function countForClauseHeadings(text) {
  const lines = String(text || '').split(/\n/);
  let n = 0;
  for (const line of lines) {
    const s = line.trim();
    if (
      /^For\s+example\b/i.test(s) ||
      /^For\s+instance\b/i.test(s) ||
      /^For\s+clarity\b/i.test(s) ||
      /^For\s+simplicity\b/i.test(s) ||
      /^For\s+more\s+detail\b/i.test(s)
    ) {
      continue;
    }
    if (/^For\s+[^:]+:/.test(s)) n += 1;
  }
  return n;
}

/** Draft mentions a disallowed second audience (healthcare, businesses, …) under General mode. */
const GENERAL_FORBIDDEN_AUDIENCE_LINE =
  /\bFor\s+(healthcare|medical|hospital(?:s)?|business(?:es)?|professionals?|providers?|retail(?:ers)?|banks?|banking|financial\s+services|employers?\s+who|utilities|schools?|universities|developers|marketers)\b[^:\n]*:/i;

function answerViolatesGeneralCoherence(answerText, sector, query) {
  if (!sector || sector.id !== 'GENERAL') return false;
  if (queryWantsMultipleAudiences(query)) return false;
  const t = String(answerText || '');
  if (GENERAL_FORBIDDEN_AUDIENCE_LINE.test(t)) return true;
  if (countForClauseHeadings(t) > 1) return true;
  if (/\n-{3,}\s*\n/m.test(t)) return true;
  return false;
}

function formatNumberedSourcesForAsk(sources) {
  return (sources || []).slice(0, 10).map((s, idx) => {
    const n = idx + 1;
    const label =
      s.kind === 'regulation'
        ? (s.type === 'recital' ? `Recital (${s.number})` : `Article ${s.number}`)
        : 'Web';
    const title = s.title ? ` — ${s.title}` : '';
    const url = s.url || s.sourceUrl || s.eurLexUrl || '';
    const head = `[S${n}] ${label}${title}${url ? ` (${url})` : ''}`;
    return `${head}\n${String(s.excerpt || '').trim()}`;
  }).join('\n\n---\n\n');
}

function buildAnswerPrompt(query, sources, sector) {
  const numbered = formatNumberedSourcesForAsk(sources);

  const focusPhrase = sector && sector.id !== 'GENERAL' ? sectorLabelFocusPhrase(sector) : '';
  const metricsExtra =
    sector && sector.id !== 'GENERAL' && querySeemsMetricsFocused(query)
      ? `
11) The user asked about metrics, KPIs, indicators, examples of measures, or monitoring. List only indicators that are implied by the cited GDPR duties (e.g. documentation, breaches, DSAR handling, DPIAs, security measures). For each bullet or sentence, explicitly tie it to typical processing in "${focusPhrase}" (one short clause) using the sources — do not invent numeric targets or obligations not in the sources.`
      : '';

  const sectorLockHeader =
    sector && sector.id !== 'GENERAL'
      ? `
SECTOR FILTER — LOCK-IN (highest priority; the user chose this in Ask):
- Selected label: "${sector.label}"
- You MUST include this exact phrase verbatim at least once (copy/paste spelling): "${focusPhrase}"
- Forbidden: a generic essay that could apply to any industry — every paragraph must clearly speak to this line of business.
- Forbidden: vague openers like "the industry", "this sector", or "organizations" alone without first using the exact phrase above.
- Reliability: tie illustrations to the cited GDPR text only; do not invent sector-specific laws (e.g. banking/health acts) unless a source snippet names them.
- After the opening, most substantive sentences should include a brief sector hook (who typically processes what, or which relationship — controller/processor/data subject) grounded in the sources, not free speculation.
`
      : '';

  const sectorRule =
    sector && sector.id !== 'GENERAL'
      ? `
7) Follow SECTOR FILTER — LOCK-IN. Sentence 1 or 2 must contain "${focusPhrase}" verbatim.
8) Re-state the sector context at least once later (paraphrase of the label or anchors is OK) so the answer cannot be read as generic compliance advice.
9) Ground every legal point in the sources. Illustrations (e.g. customer accounts, HR files, access logs) are allowed only as plain-language applications of the cited GDPR duties — never as new statutory obligations.
10) If the provided excerpts are generic GDPR only, say so in one short sentence, then still map those duties to typical processing in "${focusPhrase}" without adding rules not in the sources.${metricsExtra}`
      : '';

  const layperson = querySeemsLaypersonExplain(query);
  const generalModeRule =
    sector && sector.id === 'GENERAL'
      ? `
7) GENERAL MODE — no industry is selected: Do NOT add sections for healthcare workers, businesses, banks, retailers, schools, or any other audience the user did not name. FORBIDDEN line starters include: "For healthcare", "For businesses", "For professionals", "For providers", "For retail", "For banks", "For employers" (unless the user explicitly asked for that audience).
8) ONE NARRATIVE ONLY: At most ONE "For …:" line at the very start, and only if it mirrors the user’s audience (e.g. grandparents). Otherwise omit headings. Never use "---" or horizontal rules to split invented multi-part answers.
9) STAY ON THE QUESTION: Do not introduce unrelated topics from excerpts (e.g. children’s online consent) unless the user asked about minors. Prefer principles, definitions, and data-subject rights from the sources.
10) CONCISE & SOBER: State what GDPR requires in plain words tied to citations. Do not write long creative stories, multi-scene analogies, or “chapter 2 for another reader”. At most one short comparison (one sentence) if it directly helps and stays grounded in the sources.${layperson ? ' For simple explainers: use Articles with Recitals only where they add clarity; keep the body to 4–5 tight sentences before "Used sources".' : ''}
11) COHESION: The entire answer must read as a single reply to the user’s question, not a bundle of unrelated mini-essays.`
      : '';

  const rule4Line = layperson && sector && sector.id === 'GENERAL'
    ? '4) For simple explainers, balance GDPR Articles with Recitals when both appear — Recitals often help plain-language context; still cite accurately.'
    : '4) Prefer GDPR Articles (binding provisions) over Recitals when both are available. Use Recitals mainly for context/interpretation.';

  const systemPrompt = `You are a careful GDPR Q&A assistant.
You must answer using ONLY the provided sources below (regulation excerpts and optional web snippets).
${sectorLockHeader}
Hard rules (must follow):
1) If the sources do not contain enough information to answer, say: "I don't have enough source text to answer that." Then ask 1–2 short follow-up questions.
2) Do not hallucinate. Do not add facts not present in sources. Do not invent industries, job roles, or second audiences the user did not request.
3) Every sentence MUST end with at least one citation like [S1] or [S2]. Multiple citations allowed.
${rule4Line}
5) Prefer official regulation sources when present. Use web snippets only if regulation sources are insufficient.
6) Do NOT write "Source:" lines. Do NOT quote large passages. Summarize.${sectorRule}${generalModeRule}

Output format:
- 1–2 short paragraphs (5–9 sentences total when a sector is selected; otherwise 4–7).${layperson && sector && sector.id === 'GENERAL' ? ' For this simple explainer with General sector: maximum 4–5 body sentences before "Used sources".' : ''}
- Then a line: "Used sources: [S1], [S2], ..."
`;

  const sectorBlock = formatSectorUserBlock(sector);
  const generalBlock = formatGeneralAskBlock(sector);
  const verbatimLine =
    sector && sector.id !== 'GENERAL'
      ? `\nMandatory verbatim phrase (include exactly once, unchanged): "${focusPhrase}"\n`
      : '';
  const userPrompt = `${generalBlock}${sectorBlock}Question: ${query}
${verbatimLine}
Sources:
${numbered}

Write the best possible answer grounded in the sources. Remember: every sentence must end with citations like [S1].
${sector && sector.id !== 'GENERAL' ? 'The user applied a sector filter: your answer must be customized for that selection — opening with the mandatory verbatim phrase, then sustained relevance (sector hooks per system rules), and no pretend expertise about other laws unless sourced.' : 'Industry/sector is General: one continuous answer only — no second "For …" block for businesses, healthcare, or other roles; no horizontal rule dividers between invented sections; stay concise and citation-grounded.'}`;

  return { systemPrompt, userPrompt };
}

/** Ordered list: env GROQ_MODEL (single or comma-separated) first, then sensible defaults. */
function groqModelCandidates() {
  const raw = (process.env.GROQ_MODEL || '').trim();
  const fromEnv = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const defaults = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768'
  ];
  const out = [];
  for (const m of [...fromEnv, ...defaults]) {
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/**
 * Try Groq chat/completions with each candidate model until one returns content.
 * Handles HTTP errors and JSON bodies with { error: ... }.
 */
async function groqChatComplete(messages, maxTokens, temperature) {
  const key = (process.env.GROQ_API_KEY || '').trim();
  if (!key) return null;
  const models = groqModelCandidates();
  for (const model of models) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      console.error('Groq answer error:', model, res.status, rawText.slice(0, 500));
      continue;
    }
    if (data && data.error) {
      console.error('Groq API error:', model, data.error);
      continue;
    }
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (content) return { content, model };
  }
  return null;
}

async function answerWithGroq(query, sources, sector) {
  const { systemPrompt, userPrompt } = buildAnswerPrompt(query, sources, sector);
  let maxTok = 950;
  let temp = 0.12;
  if (sector && sector.id !== 'GENERAL') {
    maxTok = 1150;
    temp = 0.1;
  } else if (querySeemsLaypersonExplain(query)) {
    maxTok = 700;
    temp = 0.06;
  } else {
    maxTok = 820;
    temp = 0.08;
  }
  return groqChatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    maxTok,
    temp
  );
}

/**
 * Tavily Search with include_answer — used when Groq fails (quota, outage, empty).
 * See https://docs.tavily.com/api-reference/endpoint/search
 */
function tavilyIncludeAnswerBodyValue() {
  const v = (process.env.TAVILY_INCLUDE_ANSWER || 'advanced').trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'advanced') return 'advanced';
  return 'basic';
}

function parseTavilyAnswerString(data) {
  if (!data || typeof data !== 'object') return '';
  const a = data.answer;
  if (typeof a === 'string' && a.trim()) return a.trim();
  return '';
}

function buildAnswerFromTavilyResults(query, results) {
  if (!Array.isArray(results) || results.length === 0) return '';
  const lines = [];
  for (let i = 0; i < Math.min(6, results.length); i++) {
    const r = results[i];
    const content = String(r.content || '').replace(/\s+/g, ' ').trim();
    if (!content) continue;
    const title = String(r.title || 'Web source').trim();
    const url = r.url ? ` ${r.url}` : '';
    lines.push(`• ${title}${url}\n  ${content.slice(0, 520)}${content.length > 520 ? '…' : ''}`);
  }
  if (!lines.length) return '';
  return (
    `Web research summary (Tavily) for your GDPR question:\n\n${lines.join('\n\n')}\n\n` +
    "—\nNote: Groq did not return a usable answer and Tavily did not return a short LLM summary; this text is built from search result snippets. Use Citations for in-app GDPR articles and recitals."
  );
}

async function tavilySearchRequest(key, query, depth, maxResults, includeAnswer, include_domains) {
  const body = {
    api_key: key,
    query: `EU GDPR Regulation (EU) 2016/679: ${query}`,
    search_depth: depth,
    max_results: maxResults,
    include_answer: includeAnswer,
    topic: 'general'
  };
  if (include_domains && include_domains.length) body.include_domains = include_domains;
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    console.error('Tavily non-JSON response:', res.status, text.slice(0, 400));
    return { ok: false, data: null, status: res.status };
  }
  if (!res.ok) {
    console.error('Tavily search error:', res.status, text.slice(0, 600));
    return { ok: false, data, status: res.status };
  }
  return { ok: true, data, status: res.status };
}

async function answerWithTavily(query, sector) {
  const key = (process.env.TAVILY_API_KEY || '').trim();
  if (!key) return null;

  let tavilyQuery = query;
  if (sector && sector.id !== 'GENERAL') {
    const focus = sectorLabelFocusPhrase(sector);
    const st = String(sector.searchTerms || '').trim();
    const stShort = st
      ? tokenize(st)
          .filter((t) => t.length > 4)
          .slice(0, 5)
          .join(' ')
      : '';
    tavilyQuery = `${query} EU GDPR personal data processing; sector: ${sector.label}`;
    if (focus) tavilyQuery += `; context: ${focus}`;
    if (stShort) tavilyQuery += `; keywords: ${stShort}`;
  }

  try {
    const searchDepthEnv = (process.env.TAVILY_SEARCH_DEPTH || 'advanced').trim().toLowerCase();
    const depths = new Set(['advanced', 'basic', 'fast', 'ultra-fast']);
    const depthPrimary = depths.has(searchDepthEnv) ? searchDepthEnv : 'advanced';

    const includePrimary = tavilyIncludeAnswerBodyValue();
    if (!includePrimary) {
      console.warn('Tavily fallback skipped: TAVILY_INCLUDE_ANSWER is false.');
      return null;
    }

    const maxResults = Math.min(20, Math.max(3, parseInt(process.env.TAVILY_MAX_RESULTS || '6', 10) || 6));
    const domainsRaw = (process.env.TAVILY_INCLUDE_DOMAINS || '').trim();
    const include_domains = domainsRaw
      ? domainsRaw.split(',').map((d) => d.trim().replace(/^https?:\/\//i, '').split('/')[0]).filter(Boolean)
      : undefined;

    const attempts = [];
    attempts.push({ depth: depthPrimary, include: includePrimary, label: `${depthPrimary}/${typeof includePrimary === 'string' ? includePrimary : 'bool'}` });
    if (includePrimary !== 'advanced') {
      attempts.push({ depth: 'advanced', include: 'advanced', label: 'advanced/advanced-retry' });
    } else if (depthPrimary !== 'advanced') {
      attempts.push({ depth: 'advanced', include: 'advanced', label: 'advanced-depth-retry' });
    }

    let lastData = null;
    for (const att of attempts) {
      const r = await tavilySearchRequest(key, tavilyQuery, att.depth, maxResults, att.include, include_domains);
      if (!r.ok || !r.data) continue;
      lastData = r.data;
      const ans = parseTavilyAnswerString(r.data);
      if (ans) {
        const modeLabel = typeof att.include === 'string' ? att.include : 'basic';
        const suffix =
          "\n\n—\nNote: Answered with Tavily (Groq had no usable reply). Citations still list GDPR sources from this app's local corpus where available.";
        return { text: ans + suffix, mode: `search+answer (${modeLabel})`, source: 'tavily-answer' };
      }
    }

    if (lastData && Array.isArray(lastData.results) && lastData.results.length) {
      const fallback = buildAnswerFromTavilyResults(tavilyQuery, lastData.results);
      if (fallback) {
        return { text: fallback, mode: 'search snippets (no Tavily summary)', source: 'tavily-snippets' };
      }
    }

    console.warn('Tavily: no answer field and no usable result snippets.');
    return null;
  } catch (e) {
    console.error('Tavily fallback exception:', e.message);
    return null;
  }
}

function extractCitationIds(text) {
  const t = String(text || '');
  const ids = new Set();
  const re = /\[S(\d+)\]/g;
  let m;
  while ((m = re.exec(t))) ids.add(`S${m[1]}`);
  return Array.from(ids);
}

function splitIntoSentences(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return [];
  return t.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function answerHasCitationsEverySentence(answerText) {
  const lines = String(answerText || '').split('\n').map(l => l.trim()).filter(Boolean);
  const main = lines.filter(l => !/^used sources:/i.test(l)).join(' ');
  const sentences = splitIntoSentences(main);
  if (!sentences.length) return false;
  return sentences.every(s => /\[S\d+\]\s*$/.test(s));
}

/**
 * Second pass when the model answered with generic "the industry" but omitted the selected sector.
 */
async function enforceSectorMentionGroq(query, sources, draftAnswer, sector) {
  if (!sector || sector.id === 'GENERAL') return null;
  const focus = sectorLabelFocusPhrase(sector);
  if (!focus) return null;
  const numbered = formatNumberedSourcesForAsk(sources);
  const focusJson = JSON.stringify(focus);
  const systemPrompt = `You rewrite a GDPR answer that did NOT properly match the user's selected sector filter.
The new answer MUST contain this exact substring (verbatim, same spelling and punctuation): ${focusJson}
Place it in sentence 1 or 2. Do not replace it with vague words like "the industry" alone.
Customize the full reply for that line of business: most sentences should include a short clause linking the cited GDPR point to typical processing in that sector, only where the sources support it.
Do not invent non-GDPR sector statutes. Keep claims grounded in the sources only. Every sentence MUST end with [S1], [S2], etc.
End with one line: "Used sources: [S#], ..." listing only ids you cited.`;
  const userPrompt = `${formatSectorUserBlock(sector)}Question: ${query}

Sources:
${numbered}

Draft (sector wording insufficient):
${String(draftAnswer || '').trim()}

Rewrite the full answer.`;

  const out = await groqChatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    1150,
    0.08
  );
  return out ? out.content : null;
}

/**
 * When General mode draft invents healthcare/business sections or multiple "For …:" blocks.
 */
async function enforceGeneralSingleAudienceGroq(query, sources, draftAnswer, sector) {
  if (!sector || sector.id !== 'GENERAL') return null;
  const numbered = formatNumberedSourcesForAsk(sources);
  const systemPrompt = `You fix GDPR answers that became off-topic, overly creative, or multi-audience.

Rules for this rewrite:
- The user selected GENERAL industry: deliver ONE coherent reply to their question only.
- DELETE all paragraphs or headings aimed at healthcare workers, businesses, banks, professionals, retailers, or any audience the user did not name.
- DELETE horizontal rules (lines of ---) that separate invented sections.
- At most ONE short "For …:" opener, and only if it matches the audience in the user's question (e.g. elderly relatives); otherwise use no heading.
- 4–6 tight sentences before "Used sources". No long store/cashier/story analogies; at most one short sentence of plain comparison if needed.
- Every sentence ends with [S1] or similar. Final line: "Used sources: [S#], ..." listing only cited ids. No new legal claims beyond the sources.`;

  const userPrompt = `${formatGeneralAskBlock(sector)}Question: ${query}

Sources:
${numbered}

Draft (non-compliant):
${String(draftAnswer || '').trim()}

Rewrite fully.`;

  const out = await groqChatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    820,
    0.04
  );
  return out ? out.content : null;
}

async function repairAnswerWithGroq(query, sources, badAnswer, sector) {
  const numbered = formatNumberedSourcesForAsk(sources);
  const focusNeed =
    sector && sector.id !== 'GENERAL' ? sectorLabelFocusPhrase(sector) : '';
  const sectorRepairRule =
    sector && sector.id !== 'GENERAL'
      ? `
5) Sector filter active: ${sector.label}. The rewrite MUST include this exact phrase verbatim at least once: ${JSON.stringify(focusNeed)} (sentence 1 or 2 preferred). Keep the answer customized for that line of business — brief sector hooks per substantive sentence where sources allow; no invented sector laws; do not add obligations not in the sources.`
      : '';

  const generalRepairRule =
    sector && sector.id === 'GENERAL'
      ? `
5) Industry/sector is General: remove every "For healthcare/businesses/professionals/providers" section; remove --- dividers; keep one narrative for the user's audience only. Target 4–7 sentences before "Used sources".`
      : '';

  const systemPrompt = `You edit an existing answer to comply with strict grounding rules.
Do not add new facts. Only rewrite for clarity and to ensure citation format correctness.

Rules:
1) Every sentence MUST end with citations like [S1] or [S2].
2) Remove any "Source:" wording.
3) Keep it concise: 5–8 sentences total.
4) End with: "Used sources: [S#], [S#]" listing ONLY ids actually cited.${sectorRepairRule}${generalRepairRule}`;

  const sectorBlock = formatSectorUserBlock(sector);
  const generalBlock = formatGeneralAskBlock(sector);
  const userPrompt = `${generalBlock}${sectorBlock}Question: ${query}

Sources:
${numbered}

Bad answer:
${String(badAnswer || '').trim()}

Rewrite the answer to comply with the rules.`;

  const out = await groqChatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    900,
    0.05
  );
  return out ? out.content : null;
}

app.get('/api/industry-sectors', (req, res) => {
  const sectors = loadIndustrySectorsList();
  const tree = loadIndustrySectorTree();
  if (tree) return res.json({ sectors, tree });
  res.json(sectors);
});

app.post('/api/answer', async (req, res) => {
  const data = loadContent();
  const query = String(req.body?.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const includeWeb = req.body?.includeWeb != null
    ? Boolean(req.body.includeWeb)
    : true;

  const sector = resolveIndustrySector(req.body?.industrySectorId);
  let webQuery = query;
  if (sector && sector.id !== 'GENERAL') {
    const parts = [query];
    if (String(sector.searchTerms || '').trim()) parts.push(sector.searchTerms);
    const fp = sectorLabelFocusPhrase(sector);
    if (fp && fp.length > 4) parts.push(fp);
    webQuery = parts.join(' ').trim();
  }

  const localSources = buildLocalContext(data, query, sector);
  let webSources = [];
  const skipWebForLaypersonGeneral =
    includeWeb && (!sector || sector.id === 'GENERAL') && querySeemsLaypersonExplain(query);
  if (includeWeb && !skipWebForLaypersonGeneral) {
    try {
      webSources = await fetchWebSnippets(webQuery);
    } catch (e) {
      webSources = [];
    }
  }

  const sources = [...localSources, ...webSources].slice(0, 10);
  let llm = { used: false, provider: null, model: null, note: null };
  let answer = null;
  let answerSources = sources;

  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();

  if (groqKey) {
    const groqOut = await answerWithGroq(query, sources, sector);
    if (groqOut && groqOut.content) {
      answer = groqOut.content;
      if (sector && sector.id !== 'GENERAL' && !answerNamesSelectedSector(answer, sector)) {
        const sectorFixed = await enforceSectorMentionGroq(query, sources, answer, sector);
        if (sectorFixed) answer = sectorFixed;
      }
      if (sector && sector.id === 'GENERAL' && answerViolatesGeneralCoherence(answer, sector, query)) {
        const gFix = await enforceGeneralSingleAudienceGroq(query, sources, answer, sector);
        if (gFix) answer = gFix;
      }
      if (!answerHasCitationsEverySentence(answer)) {
        const repaired = await repairAnswerWithGroq(query, sources, answer, sector);
        if (repaired) answer = repaired;
      }
      if (sector && sector.id !== 'GENERAL' && !answerNamesSelectedSector(answer, sector)) {
        const sectorFixed2 = await enforceSectorMentionGroq(query, sources, answer, sector);
        if (sectorFixed2) answer = sectorFixed2;
      }
      if (sector && sector.id === 'GENERAL' && answerViolatesGeneralCoherence(answer, sector, query)) {
        const gFix2 = await enforceGeneralSingleAudienceGroq(query, sources, answer, sector);
        if (gFix2) answer = gFix2;
      }
      llm = { used: true, provider: 'groq', model: groqOut.model, note: null };
    }
  }

  if (!answer && tavilyKey) {
    const tav = await answerWithTavily(query, sector);
    if (tav && tav.text) {
      answer = tav.text;
      const blendNote = groqKey ? 'Used after Groq had no usable answer.' : null;
      llm = {
        used: true,
        provider: 'tavily',
        model: tav.mode,
        note: blendNote
      };
    }
  }

  // Fallback (non-LLM): keep it explicit to avoid "looks like hallucination"
  if (!answer) {
    let note;
    if (groqKey && tavilyKey) {
      note = 'Groq and Tavily did not return a usable answer (see server logs). Using extractive fallback from top sources.';
    } else if (groqKey) {
      note =
        'Groq returned no usable answer (check the terminal for HTTP errors, model name, or quota). Optional: set TAVILY_API_KEY for Tavily search+answer fallback. Using extractive fallback from top sources.';
    } else if (tavilyKey) {
      note =
        'GROQ_API_KEY not set (primary Ask LLM). Tavily did not return a usable answer. Using extractive fallback from top sources.';
    } else {
      note =
        'LLM not configured — add GROQ_API_KEY to .env (and optionally TAVILY_API_KEY as fallback), then restart this Node process.';
    }
    llm = {
      used: false,
      provider: null,
      model: null,
      note
    };
    answer = buildSummaryFromExcerpts(
      query,
      localSources.map(s => ({ type: s.type, number: s.number, excerpt: s.excerpt })),
      sector
    );
  }

  // Decide which sources to return and keep original S# ids stable (do NOT re-number),
  // otherwise UI hyperlinks break (answer cites [S3] etc).
  let responseSources = sources.map((s, idx) => ({ s, idx }));
  if (llm.used) {
    const cited = new Set(extractCitationIds(answer));
    if (cited.size > 0) {
      responseSources = responseSources.filter(({ idx }) => cited.has(`S${idx + 1}`));
    }
  }

  res.json({
    query,
    contentAsOf: data.meta?.lastRefreshed || null,
    includeWeb,
    industrySector: {
      id: sector.id,
      label: sector.label,
      isicSection: sector.isicSection ?? null,
      isicDivision: sector.isicDivision != null && String(sector.isicDivision).trim()
        ? String(sector.isicDivision).trim().padStart(2, '0')
        : null
    },
    llm,
    answer,
    sources: responseSources.map(({ s, idx }) => {
      const id = `S${idx + 1}`;
      if (s.kind === 'web') {
        return { id, kind: 'web', title: s.title, url: s.url, snippet: s.snippet, excerpt: s.excerpt };
      }
      return {
        id,
        kind: 'regulation',
        type: s.type,
        number: s.number,
        title: s.title,
        chapterTitle: s.chapterTitle || null,
        sourceUrl: s.sourceUrl,
        eurLexUrl: s.eurLexUrl,
        excerpt: s.excerpt
      };
    })
  });
});

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
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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
    const data = await runRegulationScraperAndReloadContent();
    const { validateCorpusFormatting } = require('./document-formatting-guardrails');
    const formattingGuardrails = validateCorpusFormatting(data.recitals || [], data.articles || []);
    res.json({
      success: true,
      lastChecked: data.meta?.lastChecked ?? null,
      lastRefreshed: data.meta?.lastRefreshed,
      etl: data.meta?.etl ?? null,
      formattingGuardrails,
      message: (data.meta?.etl?.fetched && data.meta?.etl?.significant)
        ? `Sources refreshed successfully (significant changes loaded from ${data.meta?.etl?.extractedFrom || 'source'}).`
        : (data.meta?.etl?.fetched
          ? `ETL ran (no significant changes detected from ${data.meta?.etl?.extractedFrom || 'source'}).`
          : 'ETL ran but extract failed (kept existing dataset).')
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

cron.schedule('0 2 * * *', async () => {
  try {
    await runRegulationScraperAndReloadContent();
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
  const server = app.listen(PORT, HOST, async () => {
    const groqOk = Boolean((process.env.GROQ_API_KEY || '').trim());
    const tavilyOk = Boolean((process.env.TAVILY_API_KEY || '').trim());
    console.log(`GDPR Q&A Platform listening on ${HOST}:${PORT}`);
    console.log(groqOk ? 'Ask (LLM): Groq enabled (GROQ_API_KEY loaded).' : 'Ask (LLM): Groq disabled — set GROQ_API_KEY in .env and restart the server.');
    console.log(
      tavilyOk
        ? 'Ask (LLM): Tavily fallback enabled (TAVILY_API_KEY loaded; used if Groq fails).'
        : 'Ask (LLM): Tavily fallback off — set TAVILY_API_KEY to use Tavily search+answer when Groq is unavailable.'
    );
    console.log(
      'News attachments: POST+GET /api/news/article-attachments; batch counts POST /api/news/attachments-summary (restart after pull if Attachments returns HTML).'
    );
    if (!fs.existsSync(CONTENT_FILE)) {
      console.log('No cached content found. Running initial refresh...');
      try {
        await runRegulationScraperAndReloadContent();
      } catch (e) {
        console.log('Initial refresh failed. Using structure only. Use "Refresh sources" in the app to retry.');
      }
    }
  });
}

module.exports = app;
