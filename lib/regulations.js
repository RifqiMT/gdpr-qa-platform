/**
 * Regulation registry — EU (GDPR, AI Act, Data Act) and Indonesia (UU PDP, Satu Data, AI ethics).
 */
const path = require('path');
const { getDataDir } = require('./paths');

/** Display order for regulation selector and browse welcome cards (EU row, then Indonesia). */
const REGULATION_DISPLAY_ORDER = [
  'gdpr',
  'data-act',
  'ai-act',
  'id-pdp',
  'id-satu-data',
  'id-ai-ethics'
];

const ID_REGULATION_IDS = new Set(['id-pdp', 'id-satu-data', 'id-ai-ethics']);

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
    etlEnvPrefix: 'GDPR',
    hasArticleTopics: true,
    hasSuitableRecitals: true,
    jurisdiction: 'eu',
    jurisdictionLabel: 'European Union',
    officialSiteName: 'EUR-Lex'
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
    etlEnvPrefix: 'AI_ACT',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'eu',
    jurisdictionLabel: 'European Union',
    officialSiteName: 'EUR-Lex'
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
    etlEnvPrefix: 'DATA_ACT',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'eu',
    jurisdictionLabel: 'European Union',
    officialSiteName: 'EUR-Lex'
  },
  'id-pdp': {
    id: 'id-pdp',
    shortName: 'ID PDP Law',
    legalLabel: 'UU PDP',
    fullName: 'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi',
    celex: null,
    contentFile: 'id-pdp-content.json',
    structureFile: 'id-pdp-structure.json',
    suitableRecitalsFile: null,
    chapterSummariesFile: 'chapter-summaries-id-pdp.json',
    maxArticles: 76,
    maxRecitals: 4,
    maxChapters: 16,
    segmentMeta: { recitals: 'Considering a–d', articles: 'Pasal 1–76' },
    infoBaseUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022',
    infoSiteName: 'JDIH Komdigi',
    eurLexUrl: 'https://peraturan.go.id/id/uu-no-27-tahun-2022',
    eurLexLabel: 'UU No. 27 Tahun 2022 (peraturan.go.id)',
    eurLexTxtUrl: 'https://jdih.kemenkoinfra.go.id/cfind/source/files/uu/uu-nomor-27-tahun-2022.pdf',
    recitalsIndexUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022',
    articlePath: (n) => `#pasal-${n}`,
    recitalPath: (n) => `#menimbang-${n}`,
    chapterRanges: [
      [1, 2], [3, 3], [4, 4], [5, 15], [16, 18], [19, 54], [55, 56], [57, 57],
      [58, 61], [62, 62], [63, 63], [64, 64], [65, 66], [67, 73], [74, 75], [76, 76]
    ],
    minArticles: 76,
    minRecitals: 4,
    etlEnvPrefix: 'ID_PDP',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'id',
    jurisdictionLabel: 'Indonesia',
    officialSiteName: 'peraturan.go.id'
  },
  'id-satu-data': {
    id: 'id-satu-data',
    shortName: 'ID Satu Data',
    legalLabel: 'Satu Data',
    fullName: 'Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia',
    celex: null,
    contentFile: 'id-satu-data-content.json',
    structureFile: 'id-satu-data-structure.json',
    suitableRecitalsFile: null,
    chapterSummariesFile: 'chapter-summaries-id-satu-data.json',
    maxArticles: 44,
    maxRecitals: 4,
    maxChapters: 8,
    segmentMeta: { recitals: 'Considering a–d', articles: 'Pasal 1–44' },
    infoBaseUrl: 'https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf',
    infoSiteName: 'JDIH Kemenko Infra',
    eurLexUrl: 'https://peraturan.go.id/id/perpres-no-39-tahun-2019',
    eurLexLabel: 'Perpres No. 39 Tahun 2019 (peraturan.go.id)',
    eurLexTxtUrl: 'https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf',
    recitalsIndexUrl: 'https://peraturan.go.id/id/perpres-no-39-tahun-2019',
    articlePath: (n) => `#pasal-${n}`,
    recitalPath: (n) => `#menimbang-${n}`,
    chapterRanges: [
      [1, 2], [3, 10], [11, 24], [25, 39], [40, 40], [41, 41], [42, 42], [43, 44]
    ],
    minArticles: 40,
    minRecitals: 4,
    etlEnvPrefix: 'ID_SATU_DATA',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'id',
    jurisdictionLabel: 'Indonesia',
    officialSiteName: 'peraturan.go.id'
  },
  'id-ai-ethics': {
    id: 'id-ai-ethics',
    shortName: 'ID AI Ethics',
    legalLabel: 'SE AI Ethics',
    fullName: 'Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial',
    celex: null,
    contentFile: 'id-ai-ethics-content.json',
    structureFile: 'id-ai-ethics-structure.json',
    suitableRecitalsFile: null,
    chapterSummariesFile: 'chapter-summaries-id-ai-ethics.json',
    maxArticles: 7,
    maxRecitals: 9,
    maxChapters: 5,
    segmentMeta: { recitals: 'Nine ethical values', articles: 'Sections 1–7' },
    infoBaseUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    infoSiteName: 'JDIH Komdigi',
    eurLexUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    eurLexLabel: 'SE Menkominfo 9/2023 (JDIH Komdigi)',
    eurLexTxtUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    recitalsIndexUrl: 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    articlePath: (n) => `#bagian-${n}`,
    recitalPath: (n) => `#nilai-${n}`,
    chapterRanges: [[1, 1], [2, 4], [5, 5], [6, 6], [7, 7]],
    minArticles: 7,
    minRecitals: 9,
    etlEnvPrefix: 'ID_AI_ETHICS',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'id',
    jurisdictionLabel: 'Indonesia',
    officialSiteName: 'JDIH Komdigi'
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
  return REGULATION_DISPLAY_ORDER.map((id) => REGULATIONS[id]).filter(Boolean).map((r) => ({
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
    hasSuitableRecitals: r.hasSuitableRecitals,
    jurisdiction: r.jurisdiction || 'eu',
    jurisdictionLabel: r.jurisdictionLabel || 'European Union',
    officialSiteName: r.officialSiteName || 'EUR-Lex'
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

module.exports = {
  normalizeRegulationId,
  getRegulation,
  listRegulations,
  getRegulationPaths,
  enrichArticlesWithChapter,
  ID_REGULATION_IDS
};
