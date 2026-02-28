/**
 * GDPR content fetcher and indexer.
 * Fetches from EUR-Lex and builds searchable content with citations.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
let axios, cheerio;
try { axios = require('axios'); cheerio = require('cheerio'); } catch (_) {}

const EUR_LEX_HTML_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679';
const EUR_LEX_TXT_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679';
const GDPR_INFO_BASE = 'https://gdpr-info.eu';
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'gdpr-content.json');
const STRUCTURE_FILE = path.join(DATA_DIR, 'gdpr-structure.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.get(url, { headers: { 'User-Agent': 'GDPR-QA-Platform/1.0' }, timeout: 60000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseEurLexText(html) {
  let text = html;
  if (cheerio) {
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer').remove();
    text = ($('body').text() || $.text() || '').replace(/\s+/g, ' ');
  } else {
    text = html.replace(/<[^>]+>/g, ' ');
  }
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*(\d+)\s*\)\s*/g, '\n(Recital $1)\n')
    .replace(/\s*CHAPTER\s+([IVXLCDM]+)\s*/gi, '\n\nCHAPTER $1\n')
    .replace(/\s*Article\s+(\d+)\s*/gi, '\n\nArticle $1\n')
    .trim();

  const recitals = [];
  const seenRecital = new Map(); // number -> item (last occurrence wins, no duplicates)
  const recitalBlocks = text.split(/(?=\(Recital\s+\d+\))/i);
  for (const block of recitalBlocks) {
    const numMatch = block.match(/\(Recital\s+(\d+)\)\s*/i);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      const body = block.replace(/\(Recital\s+\d+\)\s*/i, '').trim();
      if (num >= 1 && num <= 173 && body.length > 20) {
        seenRecital.set(num, { number: num, text: body });
      }
    }
  }
  recitals.push(...Array.from(seenRecital.values()));
  recitals.sort((a, b) => a.number - b.number);

  const articles = [];
  const seenArticle = new Map(); // number -> item (last occurrence wins, no duplicates)
  const articleBlocks = text.split(/\s*(?=Article\s+\d+)/i).filter(Boolean);
  const chapterRanges = [
    [1, 4], [5, 11], [12, 23], [24, 43], [44, 50], [51, 59], [60, 76], [77, 84], [85, 91], [92, 93], [94, 99]
  ];
  for (const block of articleBlocks) {
    const artMatch = block.match(/^Article\s+(\d+)\s*([\s\S]*?)(?=Article\s+\d+|$)/i);
    if (artMatch) {
      const num = parseInt(artMatch[1], 10);
      if (num >= 1 && num <= 99) {
        let body = artMatch[2].trim();
        const titleMatch = body.match(/^([^\d].*?)(?=\s*\d+\.\s|$)/s);
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 200) : `Article ${num}`;
        if (body.length > 10) {
          const chapterIndex = chapterRanges.findIndex(([a, b]) => num >= a && num <= b);
          const chapter = chapterIndex >= 0 ? chapterIndex + 1 : 1;
          seenArticle.set(num, {
            number: num,
            chapter,
            title,
            text: body.slice(0, 8000),
            sourceUrl: `${GDPR_INFO_BASE}/art-${num}-gdpr/`,
            eurLexUrl: EUR_LEX_TXT_URL
          });
        }
      }
    }
  }
  articles.push(...Array.from(seenArticle.values()));
  articles.sort((a, b) => a.number - b.number);

  return { recitals, articles };
}

function buildSearchIndex(recitals, articles, chapters) {
  const index = [];
  const seenId = new Set(); // avoid duplicate index entries
  for (const r of recitals) {
    const id = `recital-${r.number}`;
    if (seenId.has(id)) continue;
    seenId.add(id);
    index.push({
      type: 'recital',
      id,
      number: r.number,
      title: `Recital (${r.number})`,
      text: r.text.slice(0, 2000),
      sourceUrl: 'https://gdpr-info.eu/recitals/',
      eurLexUrl: EUR_LEX_TXT_URL
    });
  }
  for (const a of articles) {
    const id = `article-${a.number}`;
    if (seenId.has(id)) continue;
    seenId.add(id);
    const ch = chapters.find(c => c.number === a.chapter);
    index.push({
      type: 'article',
      id,
      number: a.number,
      chapter: a.chapter,
      chapterTitle: ch ? ch.title : '',
      title: a.title,
      text: (a.title + ' ' + a.text).slice(0, 3000),
      sourceUrl: a.sourceUrl,
      eurLexUrl: a.eurLexUrl
    });
  }
  return index;
}

/** Merge new recitals/articles with existing by number; latest (new) wins. No duplicates. */
function mergeWithExisting(existing, newRecitals, newArticles) {
  const recitalsByNum = new Map();
  for (const r of (existing.recitals || [])) recitalsByNum.set(r.number, r);
  for (const r of (newRecitals || [])) recitalsByNum.set(r.number, r);
  const recitals = Array.from(recitalsByNum.values()).sort((a, b) => a.number - b.number);

  const articlesByNum = new Map();
  for (const a of (existing.articles || [])) articlesByNum.set(a.number, a);
  for (const a of (newArticles || [])) articlesByNum.set(a.number, a);
  const articles = Array.from(articlesByNum.values()).sort((a, b) => a.number - b.number);

  return { recitals, articles };
}

async function run() {
  const structure = JSON.parse(fs.readFileSync(STRUCTURE_FILE, 'utf-8'));
  let existing = { recitals: [], articles: [] };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch (_) {}
  }

  let newRecitals = [];
  let newArticles = [];

  try {
    const url = axios ? EUR_LEX_HTML_URL : EUR_LEX_TXT_URL;
    const raw = axios
      ? (await axios.get(url, { timeout: 60000, responseType: 'text', headers: { 'User-Agent': 'GDPR-QA-Platform/1.0' } })).data
      : await fetchUrl(url);
    const parsed = parseEurLexText(raw);
    newRecitals = parsed.recitals;
    newArticles = parsed.articles;
  } catch (err) {
    console.error('Fetch/parse EUR-Lex failed:', err.message);
  }

  const { recitals, articles } = mergeWithExisting(existing, newRecitals, newArticles);
  const searchIndex = buildSearchIndex(recitals, articles, structure.chapters);

  if (newRecitals.length === 0 && newArticles.length === 0) {
    console.log('No new content from EUR-Lex; keeping existing data. Recitals:', recitals.length, 'Articles:', articles.length);
  }

  const output = {
    meta: {
      lastRefreshed: new Date().toISOString(),
      sources: structure.meta.sources
    },
    categories: structure.categories,
    chapters: structure.chapters,
    recitals,
    articles,
    searchIndex
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log('Refresh complete. Recitals:', recitals.length, 'Articles:', articles.length, 'Index entries:', searchIndex.length);
  return output;
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run, fetchUrl, parseEurLexText, buildSearchIndex, mergeWithExisting };
