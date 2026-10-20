/**
 * Indonesian regulation parity — Ask corpora, credible sources, news scope helpers.
 * Run: npm test
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  getRegulation,
  ID_REGULATION_IDS,
  listRegulations,
  normalizeRegulationId
} = require('../lib/regulations');
const { loadContent } = require('../lib/regulation-content');
const { indonesiaPolicyNewsRe, indonesiaNewsItemIsOnScope } = require('../news-crawler');
const { assignNewsTopicFields } = require('../news-topics');

const DATA = path.join(__dirname, '..', 'data');
const ID_REGS = ['id-pdp', 'id-satu-data', 'id-ai-ethics'];

describe('Indonesian regulation registry', () => {
  it('registers all three Indonesian instruments', () => {
    for (const id of ID_REGS) {
      assert.equal(normalizeRegulationId(id), id);
      assert.ok(ID_REGULATION_IDS.has(id));
      const reg = getRegulation(id);
      assert.equal(reg.id, id);
      assert.equal(reg.jurisdiction, 'id');
    }
    const ids = listRegulations().map((r) => r.id);
    for (const id of ID_REGS) assert.ok(ids.includes(id));
  });
});

describe('Indonesian corpora for Ask / Browse', () => {
  for (const id of ID_REGS) {
    it(`loads searchable corpus for ${id}`, () => {
      const data = loadContent(id);
      assert.ok(Array.isArray(data.articles) && data.articles.length > 0, 'articles');
      assert.ok(Array.isArray(data.searchIndex) && data.searchIndex.length > 0, 'searchIndex');
      assert.ok(Array.isArray(data.meta?.sources) && data.meta.sources.length > 0, 'meta.sources');
      const euBleed = /gdpr-info\.eu|eur-lex\.europa\.eu\/eli\/reg\/2016\/679/i;
      for (const s of data.meta.sources) {
        assert.ok(!euBleed.test(String(s.url || '')), 'Indo sources must not be GDPR EUR-Lex/GDPR-Info');
      }
    });
  }
});

describe('Indonesian news helpers', () => {
  it('matches UU PDP / Satu Data / AI ethics phrasing', () => {
    const re = indonesiaPolicyNewsRe();
    assert.ok(re.test('Mengawal pelindungan data pribadi dari regulasi ke pengawasan'));
    assert.ok(re.test('Forum Satu Data Indonesia memperkuat walidata'));
    assert.ok(re.test('Etika kecerdasan artifisial bagi PSE'));
    assert.ok(!re.test('Mengenal bagaimana modus pencucian uang bekerja'));
  });

  it('scopes news items for Indo policy', () => {
    assert.ok(
      indonesiaNewsItemIsOnScope({
        title: 'UMKM perlu dukungan sistem keamanan dalam penerapan UU PDP',
        snippet: '',
        url: 'https://www.antaranews.com/berita/1/uu-pdp'
      })
    );
    assert.ok(
      !indonesiaNewsItemIsOnScope({
        title: 'Ini alasan mengapa laptop lemot saat buka whatsapp',
        snippet: '',
        url: 'https://www.antaranews.com/berita/2/laptop'
      })
    );
  });

  it('classifies Indo items into Indo topic categories', () => {
    const pdp = assignNewsTopicFields({
      title: 'Asosiasi: UMKM perlu dukungan dalam penerapan UU PDP',
      snippet: 'pelindungan data pribadi',
      url: 'https://www.antaranews.com/berita/1/x',
      sourceName: 'Antara (Hukum)'
    });
    assert.equal(pdp.topicCategory, 'Indonesia Personal Data Protection');

    const satu = assignNewsTopicFields({
      title: 'Pemda perkuat Satu Data Indonesia dan walidata',
      snippet: 'portal satu data',
      url: 'https://www.antaranews.com/berita/2/x',
      sourceName: 'Satu Data Indonesia'
    });
    assert.equal(satu.topicCategory, 'Indonesia Satu Data');

    const ai = assignNewsTopicFields({
      title: 'Komdigi dorong etika kecerdasan artifisial',
      snippet: 'SE Kominfo 9/2023',
      url: 'https://www.antaranews.com/berita/3/x',
      sourceName: 'Antara (Tekno)'
    });
    assert.equal(ai.topicCategory, 'Indonesia AI Ethics');
  });
});

describe('Persisted news corpus includes Indonesian items', () => {
  it('gdpr-news.json has Antara / Satu Data items', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'gdpr-news.json'), 'utf8'));
    const items = raw.items || [];
    assert.ok(items.length > 1000, 'expected merged EU+Indo corpus');
    const indo = items.filter((i) =>
      /antara|satu data indonesia|setkab|komdigi/i.test(String(i.sourceName || ''))
    );
    assert.ok(indo.length >= 50, `expected Indo-source items, got ${indo.length}`);
    const pdpCat = items.filter((i) => /Indonesia Personal Data Protection/i.test(i.topicCategory || ''));
    const satuCat = items.filter((i) => /Indonesia Satu Data/i.test(i.topicCategory || ''));
    const aiCat = items.filter((i) => /Indonesia AI Ethics/i.test(i.topicCategory || ''));
    assert.ok(pdpCat.length >= 10, 'PDP topic category');
    assert.ok(satuCat.length >= 5, 'Satu Data topic category');
    assert.ok(aiCat.length >= 5, 'AI Ethics topic category');
  });
});
