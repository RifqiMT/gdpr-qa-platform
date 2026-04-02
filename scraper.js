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

/** Stored article/recital body max length. Env GDPR_MAX_ARTICLE_CHARS: omit or high number (default 500000); 0 or negative = no cap. */
function capGdprBodyText(body) {
  const raw = process.env.GDPR_MAX_ARTICLE_CHARS;
  const max = raw === undefined || raw === '' ? 500000 : parseInt(raw, 10);
  const s = String(body || '');
  if (!Number.isFinite(max) || max <= 0) return s;
  return s.length <= max ? s : s.slice(0, max);
}
const OUTPUT_FILE = path.join(DATA_DIR, 'gdpr-content.json');
const STRUCTURE_FILE = path.join(DATA_DIR, 'gdpr-structure.json');

const FETCH_HEADERS = {
  'User-Agent': 'GDPR-QA-Platform/1.0',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

async function fetchText(url) {
  if (axios) {
    const resp = await axios.get(url, {
      timeout: 60000,
      responseType: 'text',
      maxRedirects: 8,
      decompress: true,
      headers: {
        ...FETCH_HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      validateStatus: () => true
    });
    const body = resp && typeof resp.data === 'string' ? resp.data : String(resp.data || '');
    if (resp.status >= 400) {
      const e = new Error(`HTTP ${resp.status}`);
      e.response = { status: resp.status, statusText: resp.statusText, data: body };
      throw e;
    }
    if (!body || body.trim().length === 0) throw new Error('Empty body');
    return body;
  }
  return await fetchUrl(url);
}

function isEurLexWafPage(body) {
  const t = String(body || '');
  return /awsWafCookieDomainList|gokuProps|AWS WAF/i.test(t);
}

function cleanLines(text) {
  const isJunkLine = (l) => {
    const s = String(l || '').trim();
    if (!s) return true;
    if (/^skip to content$/i.test(s)) return true;
    // GDPR-Info header/footer links sometimes appear as one combined line or split.
    if (/imprint\s*\|\s*privacy policy\s*\|\s*liability/i.test(s)) return true;
    if (/^imprint$/i.test(s)) return true;
    if (/^privacy policy$/i.test(s)) return true;
    if (/^liability$/i.test(s)) return true;
    return false;
  };
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !isJunkLine(l));
}

function extractGdprInfoArticleFromText(n, text, h1Title) {
  const lines = cleanLines(text);
  const titleLine = (h1Title && String(h1Title).trim()) || lines.find(l => /^Art\.\s*\d+\s*GDPR/i.test(l)) || `Art. ${n} GDPR`;
  let title = String(titleLine)
    .replace(/^Art\.\s*\d+\s*GDPR\s*[–-]\s*/i, '')
    .replace(/\s*-\s*General Data Protection Regulation.*$/i, '')
    .replace(/[←→]/g, '')
    .trim();
  if (!title) title = CANONICAL_ARTICLE_TITLES[n] || `Article ${n}`;

  // Drop everything after "Suitable Recitals"
  const cutIdx = lines.findIndex(l => /^Suitable Recitals/i.test(l));
  const bodyLines = (cutIdx >= 0 ? lines.slice(0, cutIdx) : lines)
    .filter(l => !/^Art\.\s*\d+\s*GDPR/i.test(l))
    .filter(l => !/Table of contents|Report error|GDPR\s*$/i.test(l))
    .filter(l => !/^(←|Art\.)/i.test(l));
  const body = bodyLines.join('\n').trim();
  return {
    number: n,
    title,
    text: capGdprBodyText(body),
    sourceUrl: `${GDPR_INFO_BASE}/art-${n}-gdpr/`,
    eurLexUrl: EUR_LEX_TXT_URL
  };
}

function extractGdprInfoRecitalFromText(n, text, h1Title) {
  const lines = cleanLines(text);
  // Extract unofficial title from first line like:
  // "Recital 43 - Freely Given Consent - General Data Protection Regulation (GDPR)"
  let title = '';
  const h1 = String(h1Title || '').replace(/\s+/g, ' ').trim();
  if (h1) {
    // "Recital 1 - Data Protection as a Fundamental Right*"
    title = h1
      .replace(new RegExp(`^Recital\\s*${n}\\s*[-–—]?\\s*`, 'i'), '')
      .replace(/\*\s*$/, '')
      .trim();
  }

  const idx = lines.findIndex(l => new RegExp(`^Recital\\s*${n}\\b`, 'i').test(l));
  const titleLine = idx >= 0 ? lines[idx] : (lines.find(l => /^Recital\s*\d+\b/i.test(l)) || '');
  if (!title && titleLine) {
    // Case A: "Recital 43 - Freely Given Consent - General ..."
    let m = titleLine.match(/^Recital\s*(\d+)\s*-\s*(.*?)\s*-\s*General Data Protection Regulation/i);
    if (m && parseInt(m[1], 10) === n) title = String(m[2] || '').trim();
    // Case B: "Recital1 Data Protection as a Fundamental Right*"
    if (!title) {
      m = titleLine.match(/^Recital\s*(\d+)\s+(.*)$/i);
      if (m && parseInt(m[1], 10) === n) title = String(m[2] || '').trim();
    }
    // Case C: header split across lines: "Recital1" then next line is the title
    if (!title && idx >= 0 && idx + 1 < lines.length) {
      const next = String(lines[idx + 1] || '').trim();
      if (next && !/^\d/.test(next) && !/^All recitals$/i.test(next)) title = next.trim();
    }
    title = title.replace(/\*\s*$/, '').trim();
  }

  // Drop everything after the unofficial title note or navigation.
  const cutIdx = lines.findIndex(l => /^\*\s*This title is an unofficial description\./i.test(l));
  const trimmed = (cutIdx >= 0 ? lines.slice(0, cutIdx) : lines)
    .filter(l => !/^Recital\s+\d+/i.test(l))
    .filter(l => !/All recitals|Report error/i.test(l))
    .filter(l => !/^(←|Recital)/i.test(l));
  const body = trimmed.join('\n').trim();
  return { number: n, title, text: capGdprBodyText(body) };
}

async function fetchGdprInfoDataset() {
  if (!cheerio) throw new Error('cheerio not available');
  const maxConcurrency = Math.max(1, parseInt(process.env.GDPR_INFO_CONCURRENCY || '6', 10));
  const tasks = [];

  for (let n = 1; n <= 99; n++) tasks.push({ kind: 'article', n, url: `${GDPR_INFO_BASE}/art-${n}-gdpr/` });
  for (let n = 1; n <= 173; n++) tasks.push({ kind: 'recital', n, url: `${GDPR_INFO_BASE}/recitals/no-${n}/` });

  const results = { articles: [], recitals: [] };
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const t = tasks[idx++];
      try {
        const html = await fetchText(t.url);
        const $ = cheerio.load(html);
        // Read headings BEFORE stripping header/nav (they sometimes contain the h1).
        const h1 = ($('h1').first().text() || '').replace(/\s+/g, ' ').trim();
        $('script, style, noscript, svg, header, footer, nav, form, iframe').remove();
        const text = ($('body').text() || $.text() || '').replace(/[ \t\r\f]+/g, ' ').replace(/\n+/g, '\n').trim();
        if (t.kind === 'article') results.articles.push(extractGdprInfoArticleFromText(t.n, text, h1));
        else results.recitals.push(extractGdprInfoRecitalFromText(t.n, text, h1));
      } catch (_) {
        // Skip failures; we will detect incomplete dataset by count.
      }
    }
  }

  const workers = Array.from({ length: maxConcurrency }, () => worker());
  await Promise.all(workers);
  results.articles.sort((a, b) => a.number - b.number);
  results.recitals.sort((a, b) => a.number - b.number);
  return results;
}

function sha256Hex(input) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
}

function itemFingerprint(item) {
  if (!item) return '';
  const num = item.number != null ? String(item.number) : '';
  const title = String(item.title || '');
  const text = String(item.text || '');
  return sha256Hex(`${num}\n${title}\n${text}`);
}

function diffByNumber(oldItems, newItems) {
  const oldMap = new Map();
  (oldItems || []).forEach((it) => {
    if (it && it.number != null) oldMap.set(it.number, itemFingerprint(it));
  });
  const newMap = new Map();
  (newItems || []).forEach((it) => {
    if (it && it.number != null) newMap.set(it.number, itemFingerprint(it));
  });

  let changed = 0;
  let added = 0;
  let removed = 0;
  for (const [num, fp] of newMap.entries()) {
    if (!oldMap.has(num)) { added += 1; continue; }
    if (oldMap.get(num) !== fp) changed += 1;
  }
  for (const num of oldMap.keys()) {
    if (!newMap.has(num)) removed += 1;
  }
  return { changed, added, removed };
}

function computeDatasetHash(recitals, articles) {
  const r = (recitals || []).map((x) => `${x.number}:${itemFingerprint({ number: x.number, title: x.title || '', text: x.text || '' })}`).join('|');
  const a = (articles || []).map((x) => `${x.number}:${itemFingerprint({ number: x.number, title: x.title || '', text: x.text || '' })}`).join('|');
  return sha256Hex(`recitals:${r}\narticles:${a}`);
}

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
          ? capGdprBodyText(body)
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
    const recitalTitle = (r && r.title) ? String(r.title).trim() : '';
    const fullTitle = recitalTitle ? `Recital (${r.number}) — ${recitalTitle}` : `Recital (${r.number})`;
    index.push({
      type: 'recital',
      id,
      number: r.number,
      title: fullTitle,
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
  let extractedFrom = null; // 'eur-lex' | 'gdpr-info' | null

  try {
    const urlsToTry = [
      // TXT tends to be less protected than the HTML renderer.
      EUR_LEX_TXT_URL,
      EUR_LEX_HTML_URL
    ];

    let lastErr = null;
    for (const url of urlsToTry) {
      try {
        const raw = await fetchText(url);
        if (isEurLexWafPage(raw)) throw new Error('Blocked by EUR-Lex WAF challenge page');

        const parsed = parseEurLexText(raw);
        newRecitals = parsed.recitals;
        newArticles = parsed.articles;
        if (newRecitals.length || newArticles.length) {
          extractedFrom = 'eur-lex';
          break;
        }
        lastErr = new Error('Parsed 0 items from EUR-Lex response');
      } catch (e) {
        lastErr = e;
      }
    }
    if (!newRecitals.length && !newArticles.length && lastErr) throw lastErr;
  } catch (err) {
    console.error('Fetch/parse EUR-Lex failed:', err && err.message ? err.message : String(err));
    try {
      const status = err && err.response && err.response.status ? err.response.status : null;
      const statusText = err && err.response && err.response.statusText ? err.response.statusText : null;
      if (status) console.error('EUR-Lex status:', status, statusText || '');
      const data = err && err.response && err.response.data ? err.response.data : null;
      if (data) console.error('EUR-Lex error body (truncated):', String(data).slice(0, 600));
    } catch (_) {}
  }

  // Fallback ETL extractor if EUR-Lex is blocked (WAF).
  if (!newRecitals.length && !newArticles.length) {
    try {
      const out = await fetchGdprInfoDataset();
      if (out.articles.length >= 80 && out.recitals.length >= 140) {
        // Enrich with chapter + EUR-Lex URL fields to match our schema expectations.
        // We rely on existing chapter mapping by number ranges (same as parseEurLexText).
        const chapterRanges = [
          [1, 4], [5, 11], [12, 23], [24, 43], [44, 50], [51, 59], [60, 76], [77, 84], [85, 91], [92, 93], [94, 99]
        ];
        newArticles = out.articles.map((a) => {
          const chapterIndex = chapterRanges.findIndex(([x, y]) => a.number >= x && a.number <= y);
          const chapter = chapterIndex >= 0 ? chapterIndex + 1 : 1;
          return { ...a, chapter };
        });
        newRecitals = out.recitals;
        extractedFrom = 'gdpr-info';
        console.log('ETL: used GDPR-Info fallback extractor. Recitals:', newRecitals.length, 'Articles:', newArticles.length);
      } else {
        console.log('ETL: GDPR-Info fallback extractor incomplete. Recitals:', out.recitals.length, 'Articles:', out.articles.length);
      }
    } catch (e) {
      console.log('ETL: GDPR-Info fallback extractor failed:', e && e.message ? e.message : String(e));
    }
  }

  const fetched = newRecitals.length > 0 || newArticles.length > 0;
  const existingMeta = existing.meta || {};

  // ETL approach:
  // - Extract/transform always (attempted each run).
  // - Load (overwrite OUTPUT_FILE) only if there is a significant difference vs existing dataset.
  const baselineRecitals = Array.isArray(existing.recitals) ? existing.recitals : [];
  const baselineArticles = Array.isArray(existing.articles) ? existing.articles : [];

  const candidateRecitals = fetched ? newRecitals : [];
  const candidateArticles = fetched ? newArticles : [];

  const oldHash = existingMeta.datasetHash || computeDatasetHash(baselineRecitals, baselineArticles);
  const newHash = fetched ? computeDatasetHash(candidateRecitals, candidateArticles) : oldHash;

  const recitalDiff = fetched ? diffByNumber(baselineRecitals, candidateRecitals) : { changed: 0, added: 0, removed: 0 };
  const articleDiff = fetched ? diffByNumber(baselineArticles, candidateArticles) : { changed: 0, added: 0, removed: 0 };
  const changedItems = recitalDiff.changed + recitalDiff.added + recitalDiff.removed + articleDiff.changed + articleDiff.added + articleDiff.removed;
  const totalItems = 173 + 99;
  const changeRatio = totalItems ? (changedItems / totalItems) : 0;

  // Load whenever extracted content differs from disk. Per-item thresholds hid real updates
  // (e.g. one article body extended after raising GDPR_MAX_ARTICLE_CHARS).
  const significant = fetched && newHash !== oldHash;

  // "Load" step: only overwrite stored dataset when significant.
  const recitals = significant ? candidateRecitals : baselineRecitals;
  const articles = significant ? candidateArticles : baselineArticles;
  const searchIndex = buildSearchIndex(recitals, articles, structure.chapters);

  const output = {
    meta: {
      // lastChecked updates every time refresh runs (even if no content changes)
      lastChecked: new Date().toISOString(),
      // lastRefreshed only updates when we actually fetched new content from EUR-Lex
      lastRefreshed: significant ? new Date().toISOString() : (existingMeta.lastRefreshed || null),
      etl: {
        extractedFrom: extractedFrom,
        fetched: fetched,
        significant,
        datasetHash: significant ? newHash : (existingMeta.datasetHash || oldHash),
        candidateHash: fetched ? newHash : null,
        diff: {
          recitals: recitalDiff,
          articles: articleDiff,
          changedItems,
          changeRatio
        }
      },
      sources: structure.meta.sources
    },
    categories: structure.categories,
    chapters: structure.chapters,
    recitals,
    articles,
    searchIndex
  };

  if (!fetched) {
    console.log('ETL: extract failed (EUR-Lex blocked and fallback unavailable); keeping existing dataset. Recitals:', recitals.length, 'Articles:', articles.length);
    // Still write meta.lastChecked and etl status so UI can reflect that refresh ran.
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  } else if (!significant) {
    console.log('ETL: extracted from', extractedFrom, 'but change not significant; keeping existing "Content as of". Changed items:', changedItems, 'ratio:', changeRatio.toFixed(4));
    // Write output so lastChecked/etl info is persisted, but keep lastRefreshed unchanged.
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  } else {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    console.log('ETL: loaded new dataset from', extractedFrom, '. Recitals:', recitals.length, 'Articles:', articles.length, 'Index entries:', searchIndex.length, 'Changed items:', changedItems);
  }
  return output;
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run, fetchUrl, parseEurLexText, buildSearchIndex, mergeWithExisting };
