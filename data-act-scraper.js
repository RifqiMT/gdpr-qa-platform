/**
 * EU Data Act content fetcher — articles and recitals from https://data-act-law.eu/
 * Regulation (EU) 2023/2854 (English layout).
 */
const fs = require('fs');
const path = require('path');
let cheerio;
try {
  cheerio = require('cheerio');
} catch (_) {}

const {
  fetchText,
  getGdprInfoEntryPlainText,
  buildSearchIndex,
  mergeWithExisting,
  computeDatasetHash,
  stripLeadingHeadingLinesFromBody
} = require('./scraper');
const { getRegulation, getRegulationPaths, enrichArticlesWithChapter } = require('./lib/regulations');

const REG_ID = 'data-act';

function capBodyText(body) {
  const raw = process.env.DATA_ACT_MAX_ARTICLE_CHARS || process.env.GDPR_MAX_ARTICLE_CHARS;
  const max = raw === undefined || raw === '' ? 500000 : parseInt(raw, 10);
  const s = String(body || '');
  if (!Number.isFinite(max) || max <= 0) return s;
  return s.length <= max ? s : s.slice(0, max);
}

/** Join ETL lines with block breaks before numbered / lettered sub-paragraphs (matches source layout). */
function joinBodyLines(lines) {
  const arr = (lines || []).map((l) => String(l).trim()).filter(Boolean);
  if (!arr.length) return '';
  let out = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i];
    if (/^\d+\.\s/.test(cur) || /^\([a-z]\)\s/i.test(cur)) out += '\n\n' + cur;
    else out += '\n' + cur;
  }
  return out;
}

function cleanLines(text) {
  const isJunkLine = (l) => {
    const s = String(l || '').trim();
    if (!s) return true;
    if (/^skip to content$/i.test(s)) return true;
    if (/imprint\s*\|\s*privacy policy/i.test(s)) return true;
    return false;
  };
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !isJunkLine(l));
}

function parseH1Parts($) {
  const $h1 = $('h1.entry-title, h1').first();
  const numEl = $h1.find('.dsgvo-number').first().text().replace(/\s+/g, ' ').trim();
  const titleEl = $h1.find('.dsgvo-title').first().text().replace(/\s+/g, ' ').trim();
  const full = ($h1.text() || '').replace(/\s+/g, ' ').trim();
  return { numEl, titleEl, full };
}

function extractDataActArticleFromText(n, text, h1Parts, reg) {
  const lines = cleanLines(text);
  let title = (h1Parts.titleEl || '').replace(/\*\s*$/, '').trim();
  if (!title) {
    const m = (h1Parts.full || '').match(new RegExp(`Art\\.\\s*${n}\\s*Data Act\\s*(.+)$`, 'i'));
    title = m ? m[1].trim() : `Article ${n}`;
  }
  const cutIdx = lines.findIndex((l) => /^Suitable Recitals/i.test(l));
  let bodyLines = (cutIdx >= 0 ? lines.slice(0, cutIdx) : lines)
    .filter((l) => !new RegExp(`^Art\\.\\s*${n}\\s*Data Act`, 'i').test(l))
    .filter((l) => !/Table of contents|Report error/i.test(l));
  bodyLines = stripLeadingHeadingLinesFromBody(bodyLines, {
    title,
    articleLabel: `Art\\.\\s*${n}\\s*Data Act`
  });
  return {
    number: n,
    title,
    text: capBodyText(joinBodyLines(bodyLines)),
    sourceUrl: `${reg.infoBaseUrl}${reg.articlePath(n)}`,
    eurLexUrl: reg.eurLexTxtUrl
  };
}

function extractDataActRecitalFromText(n, text, h1Parts, reg) {
  const lines = cleanLines(text);
  let title = (h1Parts.titleEl || '').replace(/\*\s*$/, '').trim();
  if (!title) {
    const m = (h1Parts.full || '').match(new RegExp(`Recital\\s*${n}\\s*(.+)$`, 'i'));
    title = m ? m[1].replace(/^[-–—]\s*/, '').trim() : '';
  }
  const cutIdx = lines.findIndex((l) => /^\*\s*This title is an unofficial description/i.test(l));
  let bodyLines = (cutIdx >= 0 ? lines.slice(0, cutIdx) : lines)
    .filter((l) => !new RegExp(`^Recital\\s*${n}\\b`, 'i').test(l))
    .filter((l) => !/All recitals|Report error/i.test(l));
  bodyLines = stripLeadingHeadingLinesFromBody(bodyLines, {
    title,
    articleLabel: `Recital\\s*${n}`
  });
  return {
    number: n,
    title,
    text: capBodyText(joinBodyLines(bodyLines)),
    sourceUrl: `${reg.infoBaseUrl}${reg.recitalPath(n)}`,
    eurLexUrl: reg.eurLexTxtUrl
  };
}

async function fetchDataActLawDataset(reg) {
  if (!cheerio) throw new Error('cheerio not available');
  const maxConcurrency = Math.max(
    1,
    parseInt(process.env.DATA_ACT_INFO_CONCURRENCY || process.env.GDPR_INFO_CONCURRENCY || '6', 10)
  );
  const tasks = [];
  for (let n = 1; n <= reg.maxArticles; n++) {
    tasks.push({ kind: 'article', n, url: `${reg.infoBaseUrl}${reg.articlePath(n)}` });
  }
  for (let n = 1; n <= reg.maxRecitals; n++) {
    tasks.push({ kind: 'recital', n, url: `${reg.infoBaseUrl}${reg.recitalPath(n)}` });
  }

  const results = { articles: [], recitals: [] };
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const t = tasks[idx++];
      try {
        const html = await fetchText(t.url);
        const $ = cheerio.load(html);
        const h1Parts = parseH1Parts($);
        $('script, style, noscript, svg, header, footer, nav, form, iframe').remove();
        const plain = getGdprInfoEntryPlainText($, cheerio);
        if (t.kind === 'article') {
          results.articles.push(extractDataActArticleFromText(t.n, plain, h1Parts, reg));
        } else {
          results.recitals.push(extractDataActRecitalFromText(t.n, plain, h1Parts, reg));
        }
      } catch (_) {
        /* skip failed page */
      }
    }
  }

  await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));
  results.articles.sort((a, b) => a.number - b.number);
  results.recitals.sort((a, b) => a.number - b.number);
  return results;
}

async function run() {
  const reg = getRegulation(REG_ID);
  const paths = getRegulationPaths(REG_ID);
  const structure = JSON.parse(fs.readFileSync(paths.structureFile, 'utf-8'));
  let existing = { recitals: [], articles: [] };
  if (fs.existsSync(paths.contentFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(paths.contentFile, 'utf-8'));
    } catch (_) {}
  }

  const minArt = Math.max(1, parseInt(process.env.MIN_DATA_ACT_ARTICLES || String(reg.minArticles), 10));
  const minRec = Math.max(1, parseInt(process.env.MIN_DATA_ACT_RECITALS || String(reg.minRecitals), 10));

  console.log(`ETL: fetching EU Data Act from ${reg.infoBaseUrl} …`);
  const out = await fetchDataActLawDataset(reg);
  const arts = enrichArticlesWithChapter(out.articles, reg.chapterRanges);
  if (arts.length < minArt || out.recitals.length < minRec) {
    throw new Error(
      `Data Act ETL incomplete: articles ${arts.length}/${minArt}, recitals ${out.recitals.length}/${minRec}`
    );
  }

  const { recitals, articles } = mergeWithExisting(existing, out.recitals, arts);
  const { normalizeCorpus } = require('./document-formatting-guardrails');
  const norm = normalizeCorpus(recitals, articles);
  const chapters = structure.chapters || [];
  const searchIndex = buildSearchIndex(norm.recitals, norm.articles, chapters, {
    recitalsIndexUrl: reg.recitalsIndexUrl || `${reg.infoBaseUrl}/recital/`,
    eurLexTxtUrl: reg.eurLexTxtUrl
  });

  const now = new Date().toISOString();
  const newHash = computeDatasetHash(norm.recitals, norm.articles);
  const oldHash =
    existing.meta?.datasetHash || computeDatasetHash(existing.recitals || [], existing.articles || []);
  const forceWrite =
    process.env.DATA_ACT_FORCE_CORPUS_WRITE === '1' || process.env.GDPR_FORCE_CORPUS_WRITE === '1';

  const output = {
    ...structure,
    meta: {
      ...structure.meta,
      regulationId: REG_ID,
      lastChecked: now,
      lastRefreshed: now,
      datasetHash: newHash,
      etl: {
        extractedFrom: 'data-act-law',
        fetched: true,
        significant: newHash !== oldHash || forceWrite,
        datasetHash: newHash,
        articleCount: norm.articles.length,
        recitalCount: norm.recitals.length
      }
    },
    recitals: norm.recitals,
    articles: norm.articles,
    searchIndex
  };

  if (newHash !== oldHash || forceWrite || !fs.existsSync(paths.contentFile)) {
    fs.writeFileSync(paths.contentFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(
      'ETL: wrote',
      paths.contentFile,
      '— articles:',
      norm.articles.length,
      'recitals:',
      norm.recitals.length
    );
  } else {
    console.log('ETL: no significant change; skipped write.');
  }
  return output;
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run, fetchDataActLawDataset };
