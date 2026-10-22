/**
 * United States analogue parity — Ask corpora, credible sources, news scope helpers.
 * Run: npm test
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  getRegulation,
  US_REGULATION_IDS,
  listRegulations,
  normalizeRegulationId
} = require('../lib/regulations');
const { loadContent } = require('../lib/regulation-content');
const {
  unitedStatesPolicyNewsRe,
  unitedStatesNewsItemIsOnScope,
  newsItemMatchesApprovedTopic
} = require('../news-crawler');
const { assignNewsTopicFields } = require('../news-topics');

const DATA = path.join(__dirname, '..', 'data');
const US_REGS = ['us-ccpa', 'us-open-data', 'us-admt'];

describe('United States regulation registry', () => {
  it('registers all three US analogue instruments', () => {
    for (const id of US_REGS) {
      assert.equal(normalizeRegulationId(id), id);
      assert.ok(US_REGULATION_IDS.has(id));
      const reg = getRegulation(id);
      assert.equal(reg.id, id);
      assert.equal(reg.jurisdiction, 'us');
    }
    const ids = listRegulations().map((r) => r.id);
    for (const id of US_REGS) assert.ok(ids.includes(id));
  });

  it('does not treat the 2014 DATA Act as the Data Act analogue', () => {
    const open = getRegulation('us-open-data');
    assert.match(open.fullName, /OPEN Government Data Act/i);
    assert.doesNotMatch(open.fullName, /Digital Accountability and Transparency Act/i);
  });
});

describe('United States corpora for Ask / Browse', () => {
  for (const id of US_REGS) {
    it(`loads searchable corpus for ${id}`, () => {
      const data = loadContent(id);
      assert.ok(Array.isArray(data.articles) && data.articles.length > 0, 'articles');
      assert.ok(Array.isArray(data.searchIndex) && data.searchIndex.length > 0, 'searchIndex');
      assert.ok(Array.isArray(data.meta?.sources) && data.meta.sources.length > 0, 'meta.sources');
      const euBleed = /gdpr-info\.eu|eur-lex\.europa\.eu\/eli\/reg\/2016\/679/i;
      for (const s of data.meta.sources) {
        assert.ok(!euBleed.test(String(s.url || '')), 'US sources must not be GDPR EUR-Lex/GDPR-Info');
      }
    });
  }

  it('CCPA corpus cites Civil Code 1798 and CPPA / leginfo', () => {
    const data = loadContent('us-ccpa');
    assert.ok(data.articles.length >= 30, `expected >=30 CCPA sections, got ${data.articles.length}`);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /1798\.100/);
    assert.match(blob, /personal information/i);
    const urls = (data.meta.sources || []).map((s) => s.url).join(' ');
    assert.match(urls, /cppa\.ca\.gov|leginfo\.legislature\.ca\.gov/i);
  });

  it('Colorado ADMT corpus cites C.R.S. 6-1-1701 and 1 January 2027', () => {
    const data = loadContent('us-admt');
    assert.ok(data.articles.length >= 12);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /6-1-1701|automated decision-making technology/i);
    assert.match(blob, /january 1, 2027/i);
  });

  it('OPEN Data corpus is Title II of P.L. 115-435, not the 2014 DATA Act', () => {
    const data = loadContent('us-open-data');
    assert.ok(data.articles.length >= 8);
    const blob = data.articles.map((a) => a.title + ' ' + a.text).join(' ');
    assert.match(blob, /open government data act/i);
    assert.match(blob, /federal data catalogue/i);
    const titles = data.articles.map((a) => a.title).join(' ');
    assert.doesNotMatch(titles, /Digital Accountability and Transparency Act/);
    const note = (data.recitals || []).map((r) => r.text).join(' ');
    assert.match(note, /false friend|not the 2014 DATA Act|spending-transparency/i);
  });
});

describe('United States news helpers', () => {
  it('matches CCPA / ADMT / OPEN Data phrasing', () => {
    const re = unitedStatesPolicyNewsRe();
    assert.ok(re.test('CPPA adopts regulations under the California Consumer Privacy Act'));
    assert.ok(re.test('CalPrivacy Brings New Round of Enforcement Actions Against Data Brokers'));
    assert.ok(re.test('Colorado Attorney General announces ADMT rulemaking for consequential decisions'));
    assert.ok(re.test('GSA updates the Federal data catalogue on data.gov'));
    assert.ok(!re.test('Local high-school football scores from last weekend'));
    assert.ok(!re.test('Colorado domestic violence report highlights persistent fatalities'));
  });

  it('scopes news items for US policy', () => {
    assert.ok(
      unitedStatesNewsItemIsOnScope({
        title: 'CPPA issues enforcement advisory on CCPA opt-out of sale',
        snippet: '',
        url: 'https://cppa.ca.gov/announcements/1'
      })
    );
    assert.ok(
      !unitedStatesNewsItemIsOnScope({
        title: 'National parks announce summer opening hours',
        snippet: '',
        url: 'https://www.nps.gov/news/1'
      })
    );
    assert.ok(
      !unitedStatesNewsItemIsOnScope({
        title: 'Curiosity is not an excuse: protecting patient data in healthcare',
        snippet: 'Guidance on sensitive personal information in NHS records.',
        url: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/x'
      })
    );
    assert.ok(
      !unitedStatesNewsItemIsOnScope({
        title: 'Attorney General Remarks: Colorado’s Path Forward in Fighting Discrimination',
        snippet: '',
        url: 'https://coag.gov/blog-post/attorney-general-remarks-colorados-path-forward-in-fighting-discrimination-oct-3-2026/'
      })
    );
    assert.ok(
      unitedStatesNewsItemIsOnScope({
        title: 'FTC Takes Action to Protect Consumers’ Privacy Online',
        snippet: '',
        url: 'https://www.ftc.gov/news-events/news/press-releases/2026/04/example'
      })
    );
    assert.ok(
      newsItemMatchesApprovedTopic({
        title: 'CalPrivacy Brings New Round of Enforcement Actions Against Data Brokers',
        snippet: '',
        url: 'https://cppa.ca.gov/announcements/2026/20260401.html'
      })
    );
  });

  it('classifies US items into US topic categories', () => {
    const ccpa = assignNewsTopicFields({
      title: 'CPPA announces CCPA enforcement sweep',
      snippet: 'California Consumer Privacy Act',
      url: 'https://cppa.ca.gov/announcements/x',
      sourceName: 'CPPA'
    });
    assert.equal(ccpa.topicCategory, 'United States CCPA');

    const calprivacy = assignNewsTopicFields({
      title: 'CalPrivacy Brings New Round of Enforcement Actions Against Data Brokers',
      snippet: '',
      url: 'https://cppa.ca.gov/announcements/2026/20260401_data_broker.html',
      sourceName: 'CPPA'
    });
    assert.equal(calprivacy.topicCategory, 'United States CCPA');

    const open = assignNewsTopicFields({
      title: 'Agencies update comprehensive data inventories on data.gov',
      snippet: 'OPEN Government Data Act Federal data catalogue',
      url: 'https://data.gov/meta/x',
      sourceName: 'data.gov'
    });
    assert.equal(open.topicCategory, 'United States OPEN Data');

    const admt = assignNewsTopicFields({
      title: 'Colorado AG posts ADMT guidance for consequential decisions',
      snippet: 'SB 26-189 automated decision-making technology',
      url: 'https://coag.gov/ai/x',
      sourceName: 'Colorado AG'
    });
    assert.equal(admt.topicCategory, 'United States ADMT');
  });
});

describe('Persisted corpora exist on disk', () => {
  it('US structure and chapter-summary files are present', () => {
    for (const id of US_REGS) {
      assert.ok(fs.existsSync(path.join(DATA, `${id}-content.json`)));
      assert.ok(fs.existsSync(path.join(DATA, `${id}-structure.json`)));
      assert.ok(fs.existsSync(path.join(DATA, `chapter-summaries-${id}.json`)));
    }
  });
});

describe('Persisted news corpus includes United States items', () => {
  it('gdpr-news.json has CPPA / FTC / OAG items', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'gdpr-news.json'), 'utf8'));
    const items = raw.items || [];
    const us = items.filter((i) =>
      /ftc|cppa|colorado ag|california oag|data\.gov|gsa|federal data strategy/i.test(
        `${i.sourceName || ''} ${i.url || ''}`
      )
    );
    assert.ok(us.length >= 15, `expected US-source items, got ${us.length}`);
    const ccpaSrc = items.filter((i) => /cppa\.ca\.gov/i.test(String(i.url || '')));
    assert.ok(ccpaSrc.length >= 5, `expected CPPA announcement items, got ${ccpaSrc.length}`);
    const ccpaCat = items.filter((i) => /United States CCPA/i.test(i.topicCategory || ''));
    assert.ok(ccpaCat.length >= 5, `expected CCPA topic category, got ${ccpaCat.length}`);
    const openCat = items.filter((i) => /United States OPEN Data/i.test(i.topicCategory || ''));
    assert.ok(openCat.length >= 5, `expected OPEN Data topic category, got ${openCat.length}`);
    const admtCat = items.filter((i) => /United States ADMT/i.test(i.topicCategory || ''));
    assert.ok(admtCat.length >= 1, `expected ADMT topic category, got ${admtCat.length}`);
    const feeds = raw.newsFeeds || [];
    assert.ok(feeds.some((f) => /cppa\.ca\.gov/i.test(String(f.url || ''))), 'CPPA feed listed');
    assert.ok(feeds.some((f) => /ftc\.gov/i.test(String(f.url || ''))), 'FTC feed listed');
    assert.ok(feeds.some((f) => /oag\.ca\.gov/i.test(String(f.url || ''))), 'California OAG feed listed');
  });
});

describe('United States Ask retrieval and credible sources', () => {
  const app = require('../server');
  const euBleed = /gdpr-info\.eu|eur-lex\.europa\.eu\/eli\/reg\/2016\/679|\bEDPB\b/i;
  const general = { id: 'GENERAL' };

  it('never returns GDPR-Info / EUR-Lex fallback for US instruments', () => {
    for (const id of US_REGS) {
      const fromCorpus = app.resolveCredibleSourcesForRegulation(id, loadContent(id));
      assert.ok(fromCorpus.length >= 2, `${id} corpus sources`);
      for (const s of fromCorpus) {
        assert.ok(!euBleed.test(`${s.name || ''} ${s.url || ''}`), `${id} source ${s.name}`);
      }
      const fromEmptyMeta = app.resolveCredibleSourcesForRegulation(id, { meta: { sources: [] } });
      for (const s of fromEmptyMeta) {
        assert.ok(!euBleed.test(`${s.name || ''} ${s.url || ''}`), `${id} empty-meta ${s.name}`);
      }
      const injected = app.resolveCredibleSourcesForRegulation(id, {
        meta: {
          sources: [{ name: 'CPPA test', url: 'https://cppa.ca.gov/', description: 'test', documents: [] }]
        }
      });
      assert.equal(injected.length, 1);
      assert.equal(injected[0].name, 'CPPA test');
    }
  });

  it('retrieves on-instrument excerpts for CCPA / OPEN Data / ADMT questions', () => {
    const ccpa = app.buildLocalContext(
      loadContent('us-ccpa'),
      'What is the right to delete personal information under the CCPA?',
      general,
      'us-ccpa'
    );
    assert.ok(ccpa.length >= 1, 'CCPA retrieval');
    const ccpaBlob = ccpa.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(ccpaBlob, /delete|deletion|1798\.105|personal information/i);
    assert.doesNotMatch(ccpaBlob, euBleed);

    const open = app.buildLocalContext(
      loadContent('us-open-data'),
      'What is an open government data asset?',
      general,
      'us-open-data'
    );
    assert.ok(open.length >= 1, 'OPEN Data retrieval');
    const openBlob = open.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(openBlob, /open government data asset|federal data catalogu?e|chief data officer|machine-readable/i);
    assert.doesNotMatch(openBlob, euBleed);

    const admt = app.buildLocalContext(
      loadContent('us-admt'),
      'What is a consequential decision under ADMT?',
      general,
      'us-admt'
    );
    assert.ok(admt.length >= 1, 'ADMT retrieval');
    const admtBlob = admt.map((s) => `${s.title} ${s.excerpt}`).join('\n');
    assert.match(admtBlob, /consequential decision|automated decision-making|developer|deployer/i);
    assert.doesNotMatch(admtBlob, euBleed);
  });
});

describe('United States UI source blurbs and provision labels', () => {
  it('app.js SOURCE_SUMMARIES and provision labels cover CCPA / OPEN Data / ADMT', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    for (const needle of [
      'California Privacy Protection Agency',
      'California Legislative Information (leginfo)',
      'Colorado Attorney General — AI / ADMT',
      'U.S. Government Publishing Office (govinfo)',
      'data.gov — Federal data catalogue',
      'Federal Data Strategy',
      "FTC:",
      "CPPA:"
    ]) {
      assert.ok(js.includes(needle), `missing UI blurb for ${needle}`);
    }
    assert.match(js, /id\.indexOf\('us-'\) === 0/);
    assert.match(js, /article: 'Section'/);
    assert.match(js, /recital: 'Purpose note'/);
  });
});
