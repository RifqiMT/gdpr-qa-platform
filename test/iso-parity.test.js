/**
 * International analogue parity — ISO/IEC 27701, 19941, 23894, and SOC 2.
 * Run: npm test
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  getRegulation,
  INTL_REGULATION_IDS,
  listRegulations,
  normalizeRegulationId
} = require('../lib/regulations');
const { loadContent } = require('../lib/regulation-content');
const {
  internationalPolicyNewsRe,
  internationalNewsItemIsOnScope,
  newsItemMatchesApprovedTopic
} = require('../news-crawler');
const { assignNewsTopicFields } = require('../news-topics');

const DATA = path.join(__dirname, '..', 'data');
const INTL_REGS = ['iso-27701', 'iso-19941', 'iso-23894', 'soc2'];

describe('International regulation registry', () => {
  it('registers ISO 27701, 19941, 23894, and SOC 2', () => {
    for (const id of INTL_REGS) {
      assert.equal(normalizeRegulationId(id), id);
      assert.ok(INTL_REGULATION_IDS.has(id));
      const reg = getRegulation(id);
      assert.equal(reg.id, id);
      assert.equal(reg.jurisdiction, 'intl');
    }
    const ids = listRegulations().map((r) => r.id);
    for (const id of INTL_REGS) assert.ok(ids.includes(id));
    assert.equal(ids.length, 13);
  });

  it('maps analogues honestly (not EU copies)', () => {
    assert.match(getRegulation('iso-27701').fullName, /27701:2025/i);
    assert.match(getRegulation('iso-19941').fullName, /19941:2017/i);
    assert.match(getRegulation('iso-23894').fullName, /23894:2023/i);
    assert.match(getRegulation('soc2').fullName, /Trust Services Criteria/i);
    assert.doesNotMatch(getRegulation('iso-27701').fullName, /2016\/679/);
    assert.doesNotMatch(getRegulation('iso-19941').fullName, /2023\/2854/);
    assert.doesNotMatch(getRegulation('iso-23894').fullName, /2024\/1689/);
  });
});

describe('International corpora for Ask / Browse', () => {
  for (const id of INTL_REGS) {
    it(`loads searchable corpus for ${id}`, () => {
      const data = loadContent(id);
      assert.ok(Array.isArray(data.articles) && data.articles.length > 0, 'articles');
      assert.ok(Array.isArray(data.searchIndex) && data.searchIndex.length > 0, 'searchIndex');
      assert.ok(Array.isArray(data.meta?.sources) && data.meta.sources.length > 0, 'meta.sources');
      const euBleed = /gdpr-info\.eu|eur-lex\.europa\.eu\/eli\/reg\/2016\/679/i;
      for (const s of data.meta.sources) {
        assert.ok(!euBleed.test(String(s.url || '')), 'INTL sources must not be GDPR EUR-Lex/GDPR-Info');
      }
    });
  }

  it('ISO 27701 corpus is a 2025 standalone PIMS analogue, not GDPR text', () => {
    const data = loadContent('iso-27701');
    assert.ok(data.articles.length >= 14);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /privacy information management system|PIMS/i);
    assert.match(blob, /PII controller/i);
    const notes = (data.recitals || []).map((r) => r.text).join(' ');
    assert.match(notes, /not a statute|not a law|voluntary/i);
    assert.match(notes, /2019.{0,40}withdrawn|withdrawn/i);
    const urls = (data.meta.sources || []).map((s) => s.url).join(' ');
    assert.match(urls, /iso\.org/);
  });

  it('ISO 19941 corpus is cloud interoperability, not the EU Data Act', () => {
    const data = loadContent('iso-19941');
    assert.ok(data.articles.length >= 11);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /interoperability/i);
    assert.match(blob, /portability/i);
    assert.match(blob, /19941-1/);
    const notes = (data.recitals || []).map((r) => r.text).join(' ');
    assert.match(notes, /not the EU Data Act/i);
  });

  it('ISO 23894 corpus is AI risk guidance overlaying ISO 31000, not the AI Act', () => {
    const data = loadContent('iso-23894');
    assert.ok(data.articles.length >= 12);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /ISO 31000/i);
    assert.match(blob, /42001/);
    const notes = (data.recitals || []).map((r) => r.text).join(' ');
    assert.match(notes, /not the EU Artificial Intelligence Act|not the EU AI Act/i);
  });

  it('SOC 2 corpus uses TSC category names, not GDPR', () => {
    const data = loadContent('soc2');
    assert.ok(data.articles.length >= 20);
    const titles = data.articles.map((a) => a.title).join(' ');
    assert.match(titles, /CC6/);
    assert.match(titles, /P1/);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /Trust Services Criteria/i);
    const notes = (data.recitals || []).map((r) => r.text).join(' ');
    assert.match(notes, /not a statute|attestation/i);
    assert.match(notes, /Type 1/i);
  });
});

describe('International news helpers', () => {
  it('matches ISO / SOC 2 phrasing', () => {
    const re = internationalPolicyNewsRe();
    assert.ok(re.test('ISO/IEC 27701:2025 privacy information management system published'));
    assert.ok(re.test('ISO/IEC 19941 cloud computing interoperability and portability'));
    assert.ok(re.test('ISO/IEC 23894 AI risk management guidance'));
    assert.ok(re.test('AICPA updates Trust Services Criteria used in SOC 2 reports'));
    assert.ok(!re.test('Local high-school football scores from last weekend'));
  });

  it('scopes news items for international standards', () => {
    assert.ok(
      internationalNewsItemIsOnScope({
        title: 'ISO/IEC 27701:2025 Privacy information management systems',
        snippet: '',
        url: 'https://www.iso.org/standard/27701'
      })
    );
    assert.ok(
      !internationalNewsItemIsOnScope({
        title: 'National parks announce summer opening hours',
        snippet: '',
        url: 'https://www.nps.gov/news/1'
      })
    );
    assert.ok(
      newsItemMatchesApprovedTopic({
        title: 'ISO/IEC 27701:2025 Privacy information management systems — Requirements and guidance',
        snippet: 'standalone PIMS',
        url: 'https://www.iso.org/standard/27701'
      })
    );
  });

  it('classifies international items into ISO / SOC 2 topic categories', () => {
    const pims = assignNewsTopicFields({
      title: 'ISO/IEC 27701:2025 privacy information management system published',
      snippet: 'PIMS PII controller',
      url: 'https://www.iso.org/standard/27701',
      sourceName: 'ISO'
    });
    assert.equal(pims.topicCategory, 'International ISO 27701');

    const cloud = assignNewsTopicFields({
      title: 'ISO/IEC 19941 cloud computing interoperability and portability',
      snippet: '',
      url: 'https://www.iso.org/standard/66639.html',
      sourceName: 'ISO'
    });
    assert.equal(cloud.topicCategory, 'International ISO 19941');

    const ai = assignNewsTopicFields({
      title: 'ISO/IEC 23894 AI risk management guidance overlaying ISO 31000',
      snippet: '',
      url: 'https://www.iso.org/standard/77304.html',
      sourceName: 'ISO'
    });
    assert.equal(ai.topicCategory, 'International ISO 23894');

    const soc = assignNewsTopicFields({
      title: 'AICPA Trust Services Criteria used in SOC 2 reports',
      snippet: 'SOC for Service Organizations',
      url: 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
      sourceName: 'AICPA'
    });
    assert.equal(soc.topicCategory, 'International SOC 2');
  });
});

describe('Persisted corpora exist on disk', () => {
  it('International structure and chapter-summary files are present', () => {
    for (const id of INTL_REGS) {
      assert.ok(fs.existsSync(path.join(DATA, `${id}-content.json`)));
      assert.ok(fs.existsSync(path.join(DATA, `${id}-structure.json`)));
      assert.ok(fs.existsSync(path.join(DATA, `chapter-summaries-${id}.json`)));
    }
  });
});

describe('Persisted news corpus includes International items', () => {
  it('gdpr-news.json has ISO / AICPA items', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'gdpr-news.json'), 'utf8'));
    const items = raw.items || [];
    const intl = items.filter((i) => /iso\.org|aicpa-cima\.com/i.test(`${i.sourceName || ''} ${i.url || ''}`));
    assert.ok(intl.length >= 5, `expected ISO/AICPA-source items, got ${intl.length}`);
    const iso27701 = items.filter((i) => /International ISO 27701/i.test(i.topicCategory || ''));
    assert.ok(iso27701.length >= 1, `expected ISO 27701 topic category, got ${iso27701.length}`);
    const iso19941 = items.filter((i) => /International ISO 19941/i.test(i.topicCategory || ''));
    assert.ok(iso19941.length >= 1, `expected ISO 19941 topic category, got ${iso19941.length}`);
    const iso23894 = items.filter((i) => /International ISO 23894/i.test(i.topicCategory || ''));
    assert.ok(iso23894.length >= 1, `expected ISO 23894 topic category, got ${iso23894.length}`);
    const soc2 = items.filter((i) => /International SOC 2/i.test(i.topicCategory || ''));
    assert.ok(soc2.length >= 1, `expected SOC 2 topic category, got ${soc2.length}`);
    const feeds = raw.newsFeeds || [];
    assert.ok(feeds.some((f) => /iso\.org/i.test(String(f.url || ''))), 'ISO feed listed');
    assert.ok(feeds.some((f) => /aicpa-cima\.com/i.test(String(f.url || ''))), 'AICPA feed listed');
  });
});

describe('International Ask retrieval and credible sources', () => {
  const app = require('../server');
  const euBleed = /gdpr-info\.eu|eur-lex\.europa\.eu\/eli\/reg\/2016\/679|\bEDPB\b/i;
  const general = { id: 'GENERAL' };

  it('never returns GDPR-Info / EUR-Lex fallback for International instruments', () => {
    for (const id of INTL_REGS) {
      const fromCorpus = app.resolveCredibleSourcesForRegulation(id, loadContent(id));
      assert.ok(fromCorpus.length >= 1, `${id} corpus sources`);
      for (const s of fromCorpus) {
        assert.ok(!euBleed.test(`${s.name || ''} ${s.url || ''}`), `${id} source ${s.name}`);
      }
      const fromEmptyMeta = app.resolveCredibleSourcesForRegulation(id, { meta: { sources: [] } });
      for (const s of fromEmptyMeta) {
        assert.ok(!euBleed.test(`${s.name || ''} ${s.url || ''}`), `${id} empty-meta ${s.name}`);
      }
    }
  });

  it('retrieves on-instrument excerpts for ISO / SOC 2 questions', () => {
    const pims = app.buildLocalContext(
      loadContent('iso-27701'),
      'What is a privacy information management system under ISO 27701?',
      general,
      'iso-27701'
    );
    assert.ok(pims.length >= 1, 'ISO 27701 retrieval');
    const pimsBlob = pims.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(pimsBlob, /PIMS|privacy information management|PII/i);
    assert.doesNotMatch(pimsBlob, euBleed);

    const cloud = app.buildLocalContext(
      loadContent('iso-19941'),
      'What is cloud portability under ISO 19941?',
      general,
      'iso-19941'
    );
    assert.ok(cloud.length >= 1, 'ISO 19941 retrieval');
    const cloudBlob = cloud.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(cloudBlob, /portability|interoperability|CSC|CSP/i);

    const ai = app.buildLocalContext(
      loadContent('iso-23894'),
      'How does ISO 23894 relate to ISO 31000 AI risk management?',
      general,
      'iso-23894'
    );
    assert.ok(ai.length >= 1, 'ISO 23894 retrieval');
    const aiBlob = ai.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(aiBlob, /31000|risk management|artificial intelligence/i);

    const soc = app.buildLocalContext(
      loadContent('soc2'),
      'What is SOC 2 Type 2 and the Trust Services Criteria for security?',
      general,
      'soc2'
    );
    assert.ok(soc.length >= 1, 'SOC 2 retrieval');
    const socBlob = soc.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(socBlob, /Trust Services Criteria|Type 2|Common Criteria|Security/i);
  });
});

describe('International UI source blurbs and provision labels', () => {
  it('app.js SOURCE_SUMMARIES and provision labels cover ISO / SOC 2', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    for (const needle of [
      'ISO — ISO/IEC 27701:2025 catalogue',
      'ISO — ISO/IEC 19941:2017 catalogue',
      'ISO — ISO/IEC 23894:2023 catalogue',
      'AICPA — 2017 Trust Services Criteria with 2022 Points of Focus',
      'AICPA — SOC for Service Organizations'
    ]) {
      assert.ok(js.includes(needle), `missing UI blurb for ${needle}`);
    }
    assert.match(js, /id\.indexOf\('iso-'\) === 0/);
    assert.match(js, /article: 'Clause'/);
    assert.match(js, /article: 'Criterion'/);
    assert.match(js, /jurisdiction === 'intl'/);
  });
});
