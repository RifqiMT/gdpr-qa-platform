/**
 * Browse hash routing — guards against intermittent bounce to home (#/browse)
 * when opening chapters / recitals / documents.
 * Run: npm test
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const APP_JS = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

describe('Browse route navigation hardening', () => {
  it('builds real provision hashes instead of href="#"', () => {
    assert.match(APP_JS, /function buildDocRouteHash/);
    assert.match(APP_JS, /buildDocRouteHash\('recital'/);
    assert.match(APP_JS, /buildDocRouteHash\('article'/);
    assert.doesNotMatch(
      APP_JS,
      /href="#" class="(?:recital-card-link|item-card-link|app-goto-doc)/
    );
  });

  it('opens chapters/recitals without tabBrowseMain.click home sync', () => {
    assert.match(APP_JS, /function activateBrowseRegulationSegment/);
    const fnStart = APP_JS.indexOf('function activateBrowseRegulationSegment');
    const fnBody = APP_JS.slice(fnStart, fnStart + 800);
    assert.match(fnBody, /activateMainViewOnly\('browse'\)/);
    assert.doesNotMatch(fnBody, /\.click\(\)/);
  });

  it('batches regulation + segment activation under suppressAppRouteSync', () => {
    const fnStart = APP_JS.indexOf('function activateBrowseForRegulation');
    const fnBody = APP_JS.slice(fnStart, fnStart + 900);
    assert.match(fnBody, /suppressAppRouteSync = true/);
    assert.match(fnBody, /syncAppRouteToUrl\(true\)/);
  });

  it('defers clearing suppress after location.hash assignment', () => {
    const fnStart = APP_JS.indexOf('function syncAppRouteToUrl');
    const fnBody = APP_JS.slice(fnStart, fnStart + 1200);
    assert.match(fnBody, /usedHashAssignment/);
    assert.match(fnBody, /setTimeout\(function \(\) \{\s*suppressAppRouteSync = false;/);
  });

  it('Ask/citation goto does not click Browse tab (avoids #/browse flash)', () => {
    assert.match(APP_JS, /From Ask results: switch to Browse/);
    const marker = APP_JS.indexOf('From Ask results: switch to Browse');
    const block = APP_JS.slice(marker, marker + 1200);
    assert.match(block, /activateMainViewOnly\('browse'\)/);
    assert.doesNotMatch(block, /browseTab\.click\(\)/);
  });

  it('gates URL sync until appRouteReady after hash restore', () => {
    assert.match(APP_JS, /var appRouteReady = false/);
    const syncStart = APP_JS.indexOf('function syncAppRouteToUrl');
    const syncBody = APP_JS.slice(syncStart, syncStart + 400);
    assert.match(syncBody, /!appRouteReady/);
    assert.match(APP_JS, /appRouteReady = true/);
  });

  it('clears and reloads browse content when regulation changes', () => {
    assert.match(APP_JS, /function exitReaderForRegulationChange/);
    const setStart = APP_JS.indexOf('function setCurrentRegulation');
    const setBody = APP_JS.slice(setStart, setStart + 2200);
    assert.match(setBody, /exitReaderForRegulationChange\(\)/);
    assert.match(setBody, /reloadActiveBrowseSegment\(\)/);
    assert.doesNotMatch(setBody, /btnBack\.click\(\)/);
    assert.match(APP_JS, /data-regulation="/);
    assert.match(APP_JS, /loadRecitalsRequestId/);
  });
});

describe('App route parse contract (hash shapes)', () => {
  function parseAppRouteFromHash(hash) {
    const APP_ROUTE_KNOWN_REG_IDS = {
      gdpr: 1,
      'data-act': 1,
      'ai-act': 1,
      'id-pdp': 1,
      'id-satu-data': 1,
      'id-ai-ethics': 1
    };
    const APP_ROUTE_KNOWN_VIEWS = { browse: 1, ask: 1, news: 1, sources: 1 };
    var raw = (hash || '').replace(/^#\/?/, '').trim();
    if (!raw) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var parts = raw.split('/').filter(Boolean);
    if (!parts.length) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var first = parts[0].toLowerCase();
    if (APP_ROUTE_KNOWN_VIEWS[first] && first !== 'browse') {
      return { view: first, segment: null, regulationId: null, docType: null, docNumber: null };
    }
    if (first === 'browse') {
      if (parts.length === 1) {
        return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
      }
      parts.shift();
      first = parts[0] ? parts[0].toLowerCase() : '';
    }
    if (!APP_ROUTE_KNOWN_REG_IDS[first]) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var regId = first;
    var segment = 'home';
    var docType = null;
    var docNumber = null;
    if (parts.length >= 2) {
      var second = parts[1].toLowerCase();
      if (second === 'chapters' || second === 'recitals') {
        segment = second;
      } else if (second === 'article' || second === 'recital') {
        segment = 'detail';
        docType = second;
        docNumber = parseInt(parts[2], 10);
        if (isNaN(docNumber) || docNumber < 1) {
          segment = 'home';
          docType = null;
          docNumber = null;
        }
      }
    }
    return {
      view: 'browse',
      segment: segment,
      regulationId: regId,
      docType: docType,
      docNumber: docNumber
    };
  }

  it('parses chapters and recitals routes', () => {
    assert.deepEqual(parseAppRouteFromHash('#/gdpr/chapters').segment, 'chapters');
    assert.deepEqual(parseAppRouteFromHash('#/gdpr/recitals').segment, 'recitals');
    assert.equal(parseAppRouteFromHash('#/gdpr/chapters').regulationId, 'gdpr');
  });

  it('treats empty / bare # / #/browse as home — not chapters', () => {
    assert.equal(parseAppRouteFromHash('').segment, 'home');
    assert.equal(parseAppRouteFromHash('#').segment, 'home');
    assert.equal(parseAppRouteFromHash('#/browse').segment, 'home');
  });

  it('parses article and recital detail routes', () => {
    const art = parseAppRouteFromHash('#/gdpr/article/7');
    assert.equal(art.segment, 'detail');
    assert.equal(art.docType, 'article');
    assert.equal(art.docNumber, 7);
    const rec = parseAppRouteFromHash('#/ai-act/recital/12');
    assert.equal(rec.docType, 'recital');
    assert.equal(rec.regulationId, 'ai-act');
  });
});
