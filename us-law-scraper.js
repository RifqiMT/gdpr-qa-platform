/**
 * United States analogue ETL — confirm official sources are reachable,
 * otherwise keep the bundled corpus built from CPPA / Colorado session laws / govinfo.
 */
const fs = require('fs');

const { fetchText, buildSearchIndex, mergeWithExisting, computeDatasetHash } = require('./scraper');
const {
  getRegulation,
  getRegulationPaths,
  enrichArticlesWithChapter,
  US_REGULATION_IDS
} = require('./lib/regulations');

async function pingOfficialSource(reg) {
  const url = reg.infoBaseUrl || reg.eurLexUrl || reg.eurLexTxtUrl;
  try {
    const text = await fetchText(url);
    const n = String(text || '').length;
    return { ok: n > 500, bytes: n, url };
  } catch (e) {
    return { ok: false, bytes: 0, url, error: e && e.message ? e.message : String(e) };
  }
}

async function run(regulationId) {
  const id = String(regulationId || '').trim();
  if (!US_REGULATION_IDS.has(id)) {
    throw new Error(`us-law-scraper: unsupported regulation ${id}`);
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

  const existingOk = (out.articles || []).length >= minArt && (out.recitals || []).length >= minRec;

  try {
    console.log(`ETL: checking ${reg.shortName} at ${reg.infoBaseUrl} …`);
    const live = await pingOfficialSource(reg);
    if (existingOk) {
      console.log(
        `ETL: keeping bundled official ${reg.shortName} corpus (source ${live.ok ? 'reachable' : 'unreachable'}${
          live.error ? ': ' + live.error : ''
        }).`
      );
    } else if (!live.ok) {
      console.log(`ETL: live ${reg.shortName} source unreachable; bundled corpus incomplete.`);
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
  const id = process.argv[2] || 'us-ccpa';
  run(id).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
