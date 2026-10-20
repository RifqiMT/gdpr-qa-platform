/**
 * Indonesian regulation ETL — re-fetch official JDIH HTML when available,
 * otherwise keep the bundled corpus built from JDIH / peraturan.go.id / official PDFs.
 */
const fs = require('fs');
let cheerio;
try {
  cheerio = require('cheerio');
} catch (_) {}

const {
  fetchText,
  buildSearchIndex,
  mergeWithExisting,
  computeDatasetHash
} = require('./scraper');
const { getRegulation, getRegulationPaths, enrichArticlesWithChapter, ID_REGULATION_IDS } = require('./lib/regulations');

function parsePasalFromPlainText(text, reg) {
  const body = String(text || '').replace(/\r/g, '\n');
  const chunks = body.split(/(?:^|\n)\s*Pasal\s+(\d+)\s*(?:\n|$)/);
  const articles = [];
  const seen = new Set();
  for (let i = 1; i + 1 < chunks.length; i += 2) {
    const n = parseInt(chunks[i], 10);
    if (!Number.isFinite(n) || n < 1 || n > (reg.maxArticles || 99) || seen.has(n)) continue;
    seen.add(n);
    let raw = chunks[i + 1] || '';
    raw = raw.split(/\n\s*BAB\s+[IVXLCDM]+\b/)[0];
    raw = raw.split(/\n\s*Bagian\s+/)[0];
    raw = raw.replace(/\s+/g, ' ').trim();
    if (raw.length < 20) continue;
    articles.push({
      number: n,
      title: `Pasal ${n}`,
      text: raw,
      sourceUrl: `${reg.infoBaseUrl}${reg.articlePath ? reg.articlePath(n) : ''}`,
      eurLexUrl: reg.eurLexTxtUrl || reg.eurLexUrl
    });
  }
  articles.sort((a, b) => a.number - b.number);
  return articles;
}

async function fetchJdihDataset(reg) {
  if (!cheerio) return { articles: [], recitals: [] };
  const html = await fetchText(reg.infoBaseUrl);
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, header, footer, nav, form, iframe').remove();
  const plain = ($('body').text() || $.text() || '').replace(/\s+\n/g, '\n');
  const articles = parsePasalFromPlainText(plain, reg);
  return { articles, recitals: [] };
}

async function run(regulationId) {
  const id = String(regulationId || '').trim();
  if (!ID_REGULATION_IDS.has(id)) {
    throw new Error(`id-law-scraper: unsupported regulation ${id}`);
  }
  const reg = getRegulation(id);
  const paths = getRegulationPaths(id);
  const structure = JSON.parse(fs.readFileSync(paths.structureFile, 'utf-8'));
  let existing = { recitals: [], articles: [] };
  if (fs.existsSync(paths.contentFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(paths.contentFile, 'utf-8'));
    } catch (_) {}
  }

  const minArt = Math.max(1, parseInt(process.env[`MIN_${reg.etlEnvPrefix}_ARTICLES`] || String(reg.minArticles), 10));
  const minRec = Math.max(1, parseInt(process.env[`MIN_${reg.etlEnvPrefix}_RECITALS`] || String(reg.minRecitals), 10));

  let extractedFrom = existing.meta?.etl?.extractedFrom || 'bundled-official';
  let out = {
    articles: existing.articles || [],
    recitals: existing.recitals || []
  };

  const existingOk =
    (out.articles || []).length >= minArt && (out.recitals || []).length >= minRec;

  try {
    console.log(`ETL: checking ${reg.shortName} at ${reg.infoBaseUrl} …`);
    const live = await fetchJdihDataset(reg);
    const liveOk = (live.articles || []).length >= minArt;
    if (!existingOk && liveOk) {
      const arts = enrichArticlesWithChapter(live.articles, reg.chapterRanges);
      out = {
        articles: arts,
        recitals: (live.recitals || []).length >= minRec ? live.recitals : existing.recitals || []
      };
      extractedFrom = 'jdih-live';
    } else if (existingOk) {
      console.log(
        `ETL: keeping bundled official ${reg.shortName} corpus (live pasal ${live.articles.length}; refresh confirms source reachability).`
      );
    } else {
      console.log(
        `ETL: live ${reg.shortName} extract incomplete (articles ${live.articles.length}/${minArt}); keeping existing.`
      );
    }
  } catch (e) {
    console.warn(`ETL: live ${reg.shortName} fetch failed:`, e && e.message ? e.message : e);
  }

  if ((out.articles || []).length < minArt) {
    out.articles = existing.articles || [];
  }
  if ((out.recitals || []).length < minRec) {
    out.recitals = existing.recitals || [];
  }
  if ((out.articles || []).length < minArt) {
    throw new Error(
      `${reg.shortName} ETL incomplete: articles ${(out.articles || []).length}/${minArt}, recitals ${(out.recitals || []).length}/${minRec}`
    );
  }

  const { recitals, articles } = mergeWithExisting(existing, out.recitals, out.articles);
  const { normalizeCorpus } = require('./document-formatting-guardrails');
  const norm = normalizeCorpus(recitals, articles);
  const chapters = structure.chapters || [];
  const searchIndex = buildSearchIndex(norm.recitals, norm.articles, chapters, {
    recitalsIndexUrl: reg.recitalsIndexUrl || reg.infoBaseUrl,
    eurLexTxtUrl: reg.eurLexTxtUrl || reg.eurLexUrl
  });

  const now = new Date().toISOString();
  const newHash = computeDatasetHash(norm.recitals, norm.articles);
  const oldHash = existing.meta?.datasetHash || computeDatasetHash(existing.recitals || [], existing.articles || []);
  const forceWrite =
    process.env[`${reg.etlEnvPrefix}_FORCE_CORPUS_WRITE`] === '1' || process.env.GDPR_FORCE_CORPUS_WRITE === '1';

  const output = {
    ...structure,
    meta: {
      ...structure.meta,
      regulationId: id,
      lastChecked: now,
      lastRefreshed: now,
      datasetHash: newHash,
      etl: {
        extractedFrom,
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

  if (newHash !== oldHash || forceWrite || !fs.existsSync(paths.contentFile) || !(existing.searchIndex || []).length) {
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
  const id = process.argv[2] || 'id-pdp';
  run(id).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
