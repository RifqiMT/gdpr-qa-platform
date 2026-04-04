/**
 * Browser mirror of server-side news deduplication (see news-crawler.js).
 * Keep URL merge + semantic (source + date + title) keys aligned when changing either file.
 */
(function () {
  function mergeCommissionPolicyAreas(a, b) {
    var out = new Set();
    if (Array.isArray(a)) a.forEach(function (x) { out.add(String(x).toUpperCase().trim()); });
    if (Array.isArray(b)) b.forEach(function (x) { out.add(String(x).toUpperCase().trim()); });
    return out.size ? Array.from(out) : undefined;
  }

  function normalizeNewsUrlKey(url) {
    if (!url || typeof url !== 'string') return '';
    try {
      var u = new URL(url.trim());
      var host = u.hostname.toLowerCase();
      if (host.indexOf('www.') === 0) host = host.slice(4);
      var path = u.pathname.replace(/\/$/, '') || '/';
      return host + path + (u.search || '').toLowerCase();
    } catch (e) {
      return String(url)
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
    }
  }

  function newsUrlPreferenceScore(url) {
    var u = String(url || '').toLowerCase();
    if (!u) return 0;
    if (u.indexOf('edps.europa.eu') !== -1) {
      if (u.indexOf('/data-protection/our-work/publications/') !== -1) return 100;
      if (u.indexOf('/press-publications/press-news/press-releases/') !== -1) return 95;
      if (u.indexOf('/press-publications/press-news/blog/') !== -1) return 88;
      if (u.indexOf('/press-publications/press-news/news/') !== -1) return 70;
      return 50;
    }
    if (u.indexOf('edpb.europa.eu') !== -1) {
      if (u.indexOf('/documents/') !== -1 || u.indexOf('/our-work-tools/') !== -1) return 92;
      if (u.indexOf('/news/news/') !== -1) return 78;
      return 50;
    }
    if (u.indexOf('ico.org.uk') !== -1 && u.indexOf('/media-centre/news-and-blogs/') !== -1) return 85;
    if (u.indexOf('ec.europa.eu/commission/presscorner/detail/') !== -1) return 80;
    return 50;
  }

  function pickPreferredNewsUrl(a, b) {
    var ua = String(a || '');
    var ub = String(b || '');
    var sa = newsUrlPreferenceScore(ua);
    var sb = newsUrlPreferenceScore(ub);
    if (sb > sa) return ub;
    if (sa > sb) return ua;
    return ub.length < ua.length ? ub : ua;
  }

  function pickRicherNewsSnippet(a, b) {
    var sa = String(a || '').trim();
    var sb = String(b || '').trim();
    if (sb.length > sa.length) return sb || null;
    return sa || null;
  }

  function mergeNewsDuplicate(existing, incoming) {
    var ex = existing;
    var inc = incoming;
    return Object.assign({}, ex, inc, {
      title: (ex.title || '').length >= (inc.title || '').length ? ex.title : inc.title,
      url: pickPreferredNewsUrl(ex.url, inc.url),
      sourceName: ex.sourceName || inc.sourceName,
      sourceUrl: ex.sourceUrl || inc.sourceUrl,
      date: ex.date || inc.date,
      snippet: pickRicherNewsSnippet(ex.snippet, inc.snippet),
      commissionPolicyAreas: mergeCommissionPolicyAreas(
        ex.commissionPolicyAreas,
        inc.commissionPolicyAreas
      )
    });
  }

  function normalizeNewsTitleFingerprint(title) {
    return String(title || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\u2018\u2019\u201c\u201d\u2032\u2033]/g, "'")
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim()
      .slice(0, 220);
  }

  function newsItemSemanticDedupeKey(item) {
    var src = String(item.sourceName || '').trim();
    var date = String(item.date || '').trim();
    var fp = normalizeNewsTitleFingerprint(item.title);
    if (!src || !fp || fp.length < 10) return '';
    return src + '\u0001' + (date || '—') + '\u0001' + fp;
  }

  function dedupeNewsItemsConsolidated(items) {
    var list = Array.isArray(items) ? items : [];
    var byUrl = new Map();
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item || !item.title || !item.url) continue;
      var key = normalizeNewsUrlKey(item.url);
      if (!key) continue;
      var prev = byUrl.get(key);
      if (!prev) byUrl.set(key, Object.assign({}, item));
      else byUrl.set(key, mergeNewsDuplicate(prev, item));
    }
    var afterUrl = Array.from(byUrl.values());
    var bySem = new Map();
    var anon = 0;
    for (var j = 0; j < afterUrl.length; j++) {
      var it = afterUrl[j];
      var k = newsItemSemanticDedupeKey(it);
      if (!k) {
        bySem.set('\u0000orphan\u0000' + anon++, it);
        continue;
      }
      var p = bySem.get(k);
      if (!p) bySem.set(k, it);
      else bySem.set(k, mergeNewsDuplicate(p, it));
    }
    return Array.from(bySem.values());
  }

  window.GDPR_NEWS_DEDUPE = {
    dedupeNewsItemsConsolidated: dedupeNewsItemsConsolidated,
    normalizeNewsUrlKey: normalizeNewsUrlKey
  };
})();
