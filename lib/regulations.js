/**
 * Regulation registry — GDPR (default), EU AI Act, and EU Data Act.
 */
const path = require('path');
const { getDataDir } = require('./paths');

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

const REGULATIONS = {
  gdpr: {
    id: 'gdpr',
    shortName: 'GDPR',
    legalLabel: 'GDPR',
    fullName: 'General Data Protection Regulation (EU) 2016/679',
    celex: '32016R0679',
    contentFile: 'gdpr-content.json',
    structureFile: 'gdpr-structure.json',
    suitableRecitalsFile: 'article-suitable-recitals.json',
    chapterSummariesFile: 'chapter-summaries.json',
    maxArticles: 99,
    maxRecitals: 173,
    maxChapters: 11,
    segmentMeta: { recitals: '1–173', articles: '1–99' },
    infoBaseUrl: 'https://gdpr-info.eu',
    infoSiteName: 'GDPR-Info',
    eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng',
    eurLexLabel: 'Regulation (EU) 2016/679',
    eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
    articlePath: (n) => `/art-${n}-gdpr/`,
    recitalPath: (n) => `/recitals/no-${n}/`,
    chapterRanges: [[1, 4], [5, 11], [12, 23], [24, 43], [44, 50], [51, 59], [60, 76], [77, 84], [85, 91], [92, 93], [94, 99]],
    minArticles: 99,
    minRecitals: 173,
    etlEnvPrefix: 'GDPR'
  },
  'ai-act': {
    id: 'ai-act',
    shortName: 'EU AI Act',
    legalLabel: 'AI Act',
    fullName: 'Artificial Intelligence Act (EU) 2024/1689',
    celex: '32024R1689',
    contentFile: 'ai-act-content.json',
    structureFile: 'ai-act-structure.json',
    suitableRecitalsFile: null,
    chapterSummariesFile: 'chapter-summaries-ai-act.json',
    maxArticles: 113,
    maxRecitals: 180,
    maxChapters: 13,
    segmentMeta: { recitals: '1–180', articles: '1–113' },
    infoBaseUrl: 'https://ai-act-law.eu',
    infoSiteName: 'AI Act Law',
    eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng',
    eurLexLabel: 'Regulation (EU) 2024/1689',
    eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
    articlePath: (n) => `/article/${n}/`,
    recitalPath: (n) => `/recital/${n}/`,
    chapterRanges: [
      [1, 4], [5, 5], [6, 49], [50, 50], [51, 56], [57, 63], [64, 70], [71, 71],
      [72, 94], [95, 96], [97, 98], [99, 101], [102, 113]
    ],
    minArticles: 113,
    minRecitals: 180,
    etlEnvPrefix: 'AI_ACT'
  },
  'data-act': {
    id: 'data-act',
    shortName: 'EU Data Act',
    legalLabel: 'Data Act',
    fullName: 'Data Act (EU) 2023/2854',
    celex: '32023R2854',
    contentFile: 'data-act-content.json',
    structureFile: 'data-act-structure.json',
    suitableRecitalsFile: null,
    chapterSummariesFile: 'chapter-summaries-data-act.json',
    maxArticles: 50,
    maxRecitals: 119,
    maxChapters: 11,
    segmentMeta: { recitals: '1–119', articles: '1–50' },
    infoBaseUrl: 'https://data-act-law.eu',
    infoSiteName: 'Data Act Law',
    eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj/eng',
    eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854',
    eurLexLabel: 'Regulation (EU) 2023/2854',
    articlePath: (n) => `/article/${n}/`,
    recitalPath: (n) => `/recital/${n}/`,
    chapterRanges: [
      [1, 2], [3, 7], [8, 12], [13, 13], [14, 22], [23, 31], [32, 32], [33, 36],
      [37, 42], [43, 43], [44, 50]
    ],
    minArticles: 50,
    minRecitals: 119,
    etlEnvPrefix: 'DATA_ACT'
  }
};

function normalizeRegulationId(id) {
  const key = String(id || 'gdpr').trim().toLowerCase();
  return REGULATIONS[key] ? key : 'gdpr';
}

function getRegulation(id) {
  return REGULATIONS[normalizeRegulationId(id)];
}

function listRegulations() {
  return Object.values(REGULATIONS).map((r) => ({
    id: r.id,
    shortName: r.shortName,
    legalLabel: r.legalLabel,
    fullName: r.fullName,
    maxArticles: r.maxArticles,
    maxRecitals: r.maxRecitals,
    maxChapters: r.maxChapters,
    segmentMeta: r.segmentMeta,
    infoBaseUrl: r.infoBaseUrl,
    infoSiteName: r.infoSiteName,
    eurLexUrl: r.eurLexUrl,
    eurLexLabel: r.eurLexLabel,
    hasArticleTopics: r.hasArticleTopics,
    hasSuitableRecitals: r.hasSuitableRecitals
  }));
}

function getRegulationPaths(id) {
  const reg = getRegulation(id);
  const dataDir = getDataDir();
  return {
    regulation: reg,
    contentFile: path.join(dataDir, reg.contentFile),
    structureFile: path.join(dataDir, reg.structureFile),
    suitableRecitalsFile: reg.suitableRecitalsFile
      ? path.join(dataDir, reg.suitableRecitalsFile)
      : null,
    chapterSummariesFile: path.join(dataDir, reg.chapterSummariesFile)
  };
}

function enrichArticlesWithChapter(articles, chapterRanges) {
  const ranges = chapterRanges || [];
  return (articles || []).map((a) => {
    const chapterIndex = ranges.findIndex(([x, y]) => a.number >= x && a.number <= y);
    const chapter = chapterIndex >= 0 ? chapterIndex + 1 : 1;
    return { ...a, chapter };
  });
}

function chapterRoman(n) {
  return ROMAN[n] || String(n);
}

module.exports = {
  REGULATIONS,
  normalizeRegulationId,
  getRegulation,
  listRegulations,
  getRegulationPaths,
  enrichArticlesWithChapter,
  chapterRoman
};
