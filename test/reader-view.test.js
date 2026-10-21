/**
 * Reader Page | Full — corpus shape + chrome markup for full-document mode.
 * Run: npm test
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadContent } = require('../lib/regulation-content');

const PUBLIC = path.join(__dirname, '..', 'public');

describe('Reader full-view corpus', () => {
  it('GDPR articles and recitals include text for full corpus render', () => {
    const data = loadContent('gdpr');
    assert.ok(Array.isArray(data.articles) && data.articles.length >= 90);
    assert.ok(Array.isArray(data.recitals) && data.recitals.length >= 170);
    for (const a of data.articles) {
      assert.equal(typeof a.number, 'number');
      assert.equal(typeof a.text, 'string');
    }
    for (const r of data.recitals) {
      assert.equal(typeof r.number, 'number');
      assert.equal(typeof r.text, 'string');
    }
  });
});

describe('Reader view-mode chrome', () => {
  it('exposes Page | Full radiogroup in reader toolbar', () => {
    const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
    assert.match(html, /id="readerViewMode"/);
    assert.match(html, /id="readerViewModePage"/);
    assert.match(html, /id="readerViewModeFull"/);
    assert.match(html, /data-mode="page"/);
    assert.match(html, /data-mode="full"/);
  });

  it('app.js persists reader view mode and opens full corpus', () => {
    const js = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8');
    assert.match(js, /READER_VIEW_MODE_KEY/);
    assert.match(js, /function openFullCorpus/);
    assert.match(js, /function setReaderViewMode/);
    assert.match(js, /reader-rec-/);
    assert.match(js, /reader-art-/);
  });
});

describe('Reader jump field (no Go button)', () => {
  it('uses a search form submit instead of a separate Go button', () => {
    const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
    assert.match(html, /id="docNavGoForm"/);
    assert.doesNotMatch(html, /id="docNavGo"/);
    assert.doesNotMatch(html, /btn-doc-nav-go/);
    const js = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8');
    assert.match(js, /docNavGoForm/);
    assert.match(js, /function goToDocNumber/);
    assert.match(js, /navigateDocument\(kind, n\)/);
  });
});

describe('Export PDF respects Page | Full', () => {
  it('buildPdfExportElement branches on full reader mode and clones reader-full-doc', () => {
    const js = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf8');
    assert.match(js, /function buildPdfExportElement/);
    const start = js.indexOf('function buildPdfExportElement');
    const body = js.slice(start, start + 3500);
    assert.match(body, /getReaderViewMode\(\) === 'full'/);
    assert.match(body, /\.reader-full-doc/);
    assert.match(body, /pdf-export-root--full/);
    assert.match(body, /pdf-export-full-doc/);
  });

  it('print CSS styles full-corpus export sections', () => {
    const css = fs.readFileSync(path.join(PUBLIC, 'styles.css'), 'utf8');
    assert.match(css, /\.pdf-export-root \.pdf-export-full-doc \.reader-full-section/);
    assert.match(css, /body\.is-pdf-export-print \.pdf-export-root \.reader-full-section/);
  });
});
