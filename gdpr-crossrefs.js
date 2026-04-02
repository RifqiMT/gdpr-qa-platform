const fs = require('fs');
const path = require('path');

/**
 * Article numbers mentioned in recital/article body text (GDPR articles 1–99).
 * Strips common non-GDPR citations to reduce false positives.
 */
function extractArticleNumbersFromText(text) {
  const articles = new Set();
  let t = String(text || '');
  t = t.replace(/\bArticle\s+\d{1,3}\s+TFEU\b/gi, '');
  t = t.replace(/\bArticle\s+\d{1,3}\s+of\s+Directive\b[^.]{0,120}/gi, '');
  t = t.replace(/\bArticles?\s+\d{1,3}\s+and\s+\d{1,3}\s+TFEU\b/gi, '');

  function addRange(a, b) {
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    if (a > b) {
      const x = a;
      a = b;
      b = x;
    }
    for (let i = Math.max(1, a); i <= Math.min(99, b); i++) articles.add(i);
  }

  t.replace(/\b(?:Articles?|Arts?\.)\s*(\d{1,2})\s*(?:to|[–-])\s*(\d{1,2})\b/gi, (_, a, b) => {
    addRange(a, b);
    return _;
  });
  t.replace(/\b(?:Article|Articles)\s+(\d{1,2})\b/gi, (_, n) => {
    const x = parseInt(n, 10);
    if (!Number.isNaN(x) && x >= 1 && x <= 99) articles.add(x);
    return _;
  });
  t.replace(/\bArts?\.\s*(\d{1,2})\b/gi, (_, n) => {
    const x = parseInt(n, 10);
    if (!Number.isNaN(x) && x >= 1 && x <= 99) articles.add(x);
    return _;
  });

  return articles;
}

function buildRecitalsCitingArticlesMap(recitals) {
  const map = new Map();
  for (const r of recitals || []) {
    const nums = extractArticleNumbersFromText(r.text);
    for (const a of nums) {
      if (!map.has(a)) map.set(a, new Set());
      map.get(a).add(r.number);
    }
  }
  return map;
}

function loadEditorialArticleSuitableRecitals(dataDir) {
  const p = path.join(dataDir, 'article-suitable-recitals.json');
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return raw.articles || {};
  } catch (_) {
    return {};
  }
}

/**
 * Editorial lists (GDPR-Info) + recitals whose text cites this article;
 * if still empty, union of neighbors' editorial lists (avoids bare articles on GDPR-Info).
 */
function mergedSuitableRecitalsForArticle(articleNum, editorialByArticle, citingMap) {
  const ed = editorialByArticle[String(articleNum)] || [];
  const cite = citingMap.has(articleNum) ? [...citingMap.get(articleNum)] : [];
  const set = new Set([...ed, ...cite]);
  let list = [...set].filter((n) => n >= 1 && n <= 173).sort((a, b) => a - b);

  if (list.length === 0 && articleNum >= 1 && articleNum <= 99) {
    const neigh = new Set();
    for (let d = -3; d <= 3; d++) {
      if (d === 0) continue;
      const k = articleNum + d;
      if (k < 1 || k > 99) continue;
      (editorialByArticle[String(k)] || []).forEach((x) => neigh.add(x));
    }
    list = [...neigh].filter((n) => n >= 1 && n <= 173).sort((a, b) => a - b);
  }

  if (list.length === 0 && articleNum >= 94 && articleNum <= 99) {
    const tail = new Set();
    [93, 94, 95].forEach((k) => {
      (editorialByArticle[String(k)] || []).forEach((x) => tail.add(x));
    });
    list = [...tail].filter((n) => n >= 1 && n <= 173).sort((a, b) => a - b);
  }

  return list;
}

/** Articles whose GDPR-Info "Suitable Recitals" list includes this recital number. */
function articlesReferencingRecitalInEditorial(recitalNum, editorialByArticle) {
  const out = new Set();
  const r = parseInt(recitalNum, 10);
  if (Number.isNaN(r)) return out;
  for (const [artKey, recs] of Object.entries(editorialByArticle || {})) {
    if (!Array.isArray(recs) || !recs.includes(r)) continue;
    const a = parseInt(artKey, 10);
    if (!Number.isNaN(a) && a >= 1 && a <= 99) out.add(a);
  }
  return out;
}

/** Inverse of suitable recitals: editorial links plus articles explicitly cited in the recital body. */
function mergedSuitableArticlesForRecital(recitalNum, editorialByArticle, recitalBodyText) {
  const fromEditorial = articlesReferencingRecitalInEditorial(recitalNum, editorialByArticle);
  const fromText = extractArticleNumbersFromText(recitalBodyText);
  const set = new Set([...fromEditorial, ...fromText]);
  return [...set].filter((n) => n >= 1 && n <= 99).sort((a, b) => a - b);
}

module.exports = {
  extractArticleNumbersFromText,
  buildRecitalsCitingArticlesMap,
  loadEditorialArticleSuitableRecitals,
  mergedSuitableRecitalsForArticle,
  articlesReferencingRecitalInEditorial,
  mergedSuitableArticlesForRecital
};
