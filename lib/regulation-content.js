/**
 * Load regulation corpus (GDPR, EU AI Act, EU Data Act) with per-regulation cache.
 */
const fs = require('fs');
const { buildSearchIndex } = require('../scraper');
const {
  normalizeRegulationId,
  getRegulation,
  getRegulationPaths,
  listRegulations
} = require('./regulations');

const contentLoadCaches = {};

function parseRegulationId(req) {
  const q = (req && req.query && req.query.regulation) || (req && req.body && req.body.regulation);
  return normalizeRegulationId(q);
}

function invalidateRegulationContentCache(regulationId) {
  const id = normalizeRegulationId(regulationId);
  contentLoadCaches[id] = { mtimeMs: null, data: null };
}

function loadContent(regulationId = 'gdpr') {
  const id = normalizeRegulationId(regulationId);
  const paths = getRegulationPaths(id);
  try {
    if (fs.existsSync(paths.contentFile)) {
      const st = fs.statSync(paths.contentFile);
      const cache = contentLoadCaches[id] || { mtimeMs: null, data: null };
      if (cache.data && cache.mtimeMs === st.mtimeMs) {
        return cache.data;
      }
      const raw = JSON.parse(fs.readFileSync(paths.contentFile, 'utf-8'));
      const { normalizeCorpus } = require('../document-formatting-guardrails');
      const norm = normalizeCorpus(raw.recitals || [], raw.articles || []);
      raw.recitals = norm.recitals;
      raw.articles = norm.articles;
      if (!raw.meta) raw.meta = {};
      raw.meta.regulationId = id;
      if (Array.isArray(raw.chapters) && raw.chapters.length) {
        try {
          raw.searchIndex = buildSearchIndex(raw.recitals, raw.articles, raw.chapters);
        } catch (e) {
          console.warn(`[loadContent:${id}] searchIndex rebuild failed:`, e && e.message ? e.message : e);
        }
      }
      contentLoadCaches[id] = { mtimeMs: st.mtimeMs, data: raw };
      return raw;
    }
  } catch (e) {
    console.warn(`loadContent(${id}):`, e && e.message ? e.message : e);
  }
  try {
    const structure = JSON.parse(fs.readFileSync(paths.structureFile, 'utf-8'));
    if (!structure.meta) structure.meta = {};
    structure.meta.regulationId = id;
    return structure;
  } catch (_) {
    const reg = getRegulation(id);
    return {
      meta: { regulationId: id },
      categories: [],
      chapters: [],
      articles: [],
      recitals: [],
      searchIndex: [],
      regulation: reg
    };
  }
}

async function runRegulationScraperAndReloadContent(regulationId = 'gdpr') {
  const id = normalizeRegulationId(regulationId);
  if (id === 'ai-act') {
    await require('../ai-act-scraper').run();
  } else if (id === 'data-act') {
    await require('../data-act-scraper').run();
  } else {
    await require('../scraper').run();
  }
  invalidateRegulationContentCache(id);
  return loadContent(id);
}

module.exports = {
  parseRegulationId,
  loadContent,
  invalidateRegulationContentCache,
  runRegulationScraperAndReloadContent,
  listRegulations,
  getRegulationPaths
};
