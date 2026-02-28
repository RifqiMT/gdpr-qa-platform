/**
 * GDPR content fetcher and indexer.
 * Fetches from EUR-Lex (official consolidated text, CELEX 32016R0679) and builds searchable content with citations.
 * Regulation (EU) 2016/679 — English consolidated version.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
let axios, cheerio;
try { axios = require('axios'); cheerio = require('cheerio'); } catch (_) {}

// Official EUR-Lex consolidated text for Regulation (EU) 2016/679 (English)
const EUR_LEX_HTML_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679';
const EUR_LEX_TXT_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679';
const GDPR_INFO_BASE = 'https://gdpr-info.eu';
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'gdpr-content.json');
const STRUCTURE_FILE = path.join(DATA_DIR, 'gdpr-structure.json');

const FETCH_HEADERS = {
  'User-Agent': 'GDPR-QA-Platform/1.0',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Official article titles (GDPR-Info / EUR-Lex). Used when extracted title is a fragment.
const CANONICAL_ARTICLE_TITLES = {
  1: 'Subject matter and objectives', 2: 'Material scope', 3: 'Territorial scope', 4: 'Definitions',
  5: 'Principles relating to processing of personal data', 6: 'Lawfulness of processing', 7: 'Conditions for consent',
  8: "Conditions applicable to child's consent in relation to information society services",
  9: 'Processing of special categories of personal data', 10: 'Processing of personal data relating to criminal convictions and offences',
  11: 'Processing which does not require identification', 12: 'Transparent information, communication and modalities for the exercise of the rights of the data subject',
  13: 'Information to be provided where personal data are collected from the data subject',
  14: 'Information to be provided where personal data have not been obtained from the data subject',
  15: 'Right of access by the data subject', 16: 'Right to rectification', 17: "Right to erasure ('right to be forgotten')",
  18: 'Right to restriction of processing', 19: 'Notification obligation regarding rectification or erasure of personal data or restriction of processing',
  20: 'Right to data portability', 21: 'Right to object', 22: 'Automated individual decision-making, including profiling', 23: 'Restrictions',
  24: 'Responsibility of the controller', 25: 'Data protection by design and by default', 26: 'Joint controllers',
  27: 'Representatives of controllers or processors not established in the Union', 28: 'Processor',
  29: 'Processing under the authority of the controller or processor', 30: 'Records of processing activities',
  31: 'Cooperation with the supervisory authority', 32: 'Security of processing',
  33: 'Notification of a personal data breach to the supervisory authority', 34: 'Communication of a personal data breach to the data subject',
  35: 'Data protection impact assessment', 36: 'Prior consultation', 37: 'Designation of the data protection officer',
  38: 'Position of the data protection officer', 39: 'Tasks of the data protection officer', 40: 'Codes of conduct',
  41: 'Monitoring of approved codes of conduct', 42: 'Certification', 43: 'Certification bodies', 44: 'General principle for transfers',
  45: 'Transfers on the basis of an adequacy decision', 46: 'Transfers subject to appropriate safeguards', 47: 'Binding corporate rules',
  48: 'Transfers or disclosures not authorised by Union law', 49: 'Derogations for specific situations', 50: 'International cooperation for the protection of personal data',
  51: 'Supervisory authority', 52: 'Independence', 53: 'General conditions for the members of the supervisory authority', 54: 'Rules on the establishment of the supervisory authority',
  55: 'Competence', 56: 'Competence of the lead supervisory authority', 57: 'Tasks', 58: 'Powers', 59: 'Activity reports',
  60: 'Cooperation between the lead supervisory authority and the other supervisory authorities concerned',
  61: 'Mutual assistance', 62: 'Joint operations of supervisory authorities', 63: 'Consistency mechanism', 64: 'Opinion of the Board',
  65: 'Dispute resolution by the Board', 66: 'Urgency procedure', 67: 'Exchange of information',
  68: 'European Data Protection Board', 69: 'Independence', 70: 'Tasks of the Board', 71: 'Reports', 72: 'Procedure', 73: 'Chair', 74: 'Tasks of the Chair', 75: 'Secretariat', 76: 'Confidentiality',
  77: 'Right to lodge a complaint with a supervisory authority', 78: 'Right to an effective judicial remedy against a supervisory authority', 79: 'Right to an effective judicial remedy against a controller or processor',
  80: 'Representation of data subjects', 81: 'Suspension of proceedings', 82: 'Right to compensation and liability', 83: 'General conditions for imposing administrative fines', 84: 'Penalties',
  85: 'Processing and freedom of expression and information', 86: 'Processing and public access to official documents', 87: 'Processing of the national identification number',
  88: 'Processing in the context of employment', 89: 'Safeguards and derogations relating to processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes',
  90: 'Obligations of secrecy', 91: 'Existing data protection rules of churches and religious associations',
  92: 'Exercise of the delegation', 93: 'Committee procedure', 94: 'Repeal of Directive 95/46/EC', 95: 'Relationship with Directive 2002/58/EC',
  96: 'Relationship with previously concluded Agreements', 97: 'Commission reports', 98: 'Review of other Union legal acts on data protection',
  99: 'Entry into force and application'
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.get(url, { headers: FETCH_HEADERS, timeout: 60000 }, (res) => {
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
    text = ($('body').text() || $.text() || '');
    text = text.replace(/[ \t\r\f]+/g, ' ').replace(/\n+/g, '\n').trim();
  } else {
    text = html.replace(/<[^>]+>/g, ' ');
  }
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/\s*\(\s*(\d+)\s*\)\s*/g, '\n(Recital $1)\n')
    .replace(/\s*CHAPTER\s+([IVXLCDM]+)\s*/gi, '\n\nCHAPTER $1\n')
    // Only add newlines before "Article N" at line/document start — not in-text refs like "Article 89(1)"
    .replace(/(?:^|\n)\s*Article\s+(\d+)\s*/gi, '\n\nArticle $1\n')
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
  const seenArticle = new Map(); // number -> item (first occurrence wins: avoid cross-refs like "Article 5 thereof" overwriting real Art. 5)
  const chapterRanges = [
    [1, 4], [5, 11], [12, 23], [24, 43], [44, 50], [51, 59], [60, 76], [77, 84], [85, 91], [92, 93], [94, 99]
  ];
  // Match only article headings at line/document start; content runs until next such heading (in-text "Article 89" is not split)
  const articleRegex = /(?:^|\n)\s*Article\s+(\d+)\s*\n?([\s\S]*?)(?=\n\s*Article\s+\d+(?:\s|$)|$)/gi;
  let artMatch;
  while ((artMatch = articleRegex.exec(text)) !== null) {
    const num = parseInt(artMatch[1], 10);
    if (num >= 1 && num <= 99) {
      let body = artMatch[2].trim();
      // Skip if we already have this article (first occurrence wins — later matches are often cross-references)
      if (seenArticle.has(num)) continue;
      // Skip bodies that are clearly fragments (e.g. "Article 5 thereof" in Art. 95/96)
      if (body.length < 80 && (/^(thereof|and|of Regulation|in conjunction with|,\s*shall apply)/i.test(body) || /\bCHAPTER\s+[IVXLCDM]+\s*$/i.test(body))) continue;
        // Title: take segment before first numbered paragraph " 1. " or "1. " (max 150 chars); avoid capturing recital refs or run-on text
        let title = `Article ${num}`;
        const firstNumPara = body.match(/\s+(1\.\s)/);
        if (firstNumPara && firstNumPara.index > 0) {
          const raw = body.slice(0, firstNumPara.index).replace(/\s+/g, ' ').trim();
          if (raw.length > 0 && raw.length <= 150 && !/^[\(\-\–—\s\d]/.test(raw) && !/^\(Recital\s+\d+\)/i.test(raw)) {
            title = raw.slice(0, 200);
          }
        } else if (body.length > 0 && body.length <= 150 && !/^[\(\-\–—\s\d]/.test(body) && !/^\(Recital\s+\d+\)/i.test(body)) {
          title = body.replace(/\s+/g, ' ').trim().slice(0, 200);
        }
        if (!title || /^\s*[\-\–—\(\)\d\s]+\s*$/.test(title)) title = `Article ${num}`;
        if (CANONICAL_ARTICLE_TITLES[num] && (
          title.length < 25 ||
          /\bCHAPTER\s+[IVXLCDM]+\b/i.test(title) ||
          /thereof|of Regulation|in conjunction with|^and\s+/i.test(title)
        )) {
          title = CANONICAL_ARTICLE_TITLES[num];
        }
        const chapterIndex = chapterRanges.findIndex(([a, b]) => num >= a && num <= b);
        const chapter = chapterIndex >= 0 ? chapterIndex + 1 : 1;
        const textContent = body.length > 10
          ? body.slice(0, 8000)
          : (body.length > 0 ? body : '(Text not extracted from source. Please see the official links below.)');
        seenArticle.set(num, {
          number: num,
          chapter,
          title,
          text: textContent,
          sourceUrl: `${GDPR_INFO_BASE}/art-${num}-gdpr/`,
          eurLexUrl: EUR_LEX_TXT_URL
        });
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
      ? (await axios.get(url, { timeout: 60000, responseType: 'text', headers: FETCH_HEADERS })).data
      : await fetchUrl(url);
    const parsed = parseEurLexText(raw);
    newRecitals = parsed.recitals;
    newArticles = parsed.articles;
  } catch (err) {
    console.error('Fetch/parse EUR-Lex failed:', err.message);
  }

  const { recitals, articles } = mergeWithExisting(existing, newRecitals, newArticles);
  const searchIndex = buildSearchIndex(recitals, articles, structure.chapters);

  const fetchedFromEurLex = newRecitals.length > 0 || newArticles.length > 0;
  if (!fetchedFromEurLex) {
    console.log('No new content from EUR-Lex; keeping existing data. Recitals:', recitals.length, 'Articles:', articles.length);
  }

  const existingMeta = existing.meta || {};
  const output = {
    meta: {
      lastRefreshed: fetchedFromEurLex ? new Date().toISOString() : (existingMeta.lastRefreshed || null),
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
