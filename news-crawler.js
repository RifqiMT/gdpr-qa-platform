/**
 * Crawl GDPR / data protection / digital-policy news from credible sources.
 * EDPB (RSS + paginated news HTML), ICO (listing HTML), Commission press RSS (paginated + filtered), CoE (links).
 */

const axios = require('axios');
const cheerio = require('cheerio');

const CRAWL_TIMEOUT_MS = 25000;
/** Max items to collect per HTML listing source (ICO, CoE link harvest). */
const MAX_PER_HTML_SOURCE = 220;
/** EDPB news listing is paginated (?page=); stop after this many pages or when a page adds no new URLs. */
const MAX_EDPB_NEWS_PAGES = 24;
/** Commission press RSS returns at most 100 items; `page` does not paginate — use search API for depth. */
const COMMISSION_RSS_PAGE_SIZE = 100;
/** Thematic search buckets (press corner API); each returns up to ~20 items; combined they cover far more than RSS alone. */
const COMMISSION_SEARCH_POLICY_CODES = ['DIGAG', 'JFRC', 'CONSUMPOL', 'COMPETY', 'RESINSC', 'CYBER', 'TECH'];
/** Max snippet length stored per item (description / content:encoded / Atom summary). */
const SNIPPET_MAX_LEN = 480;

const EDPB_RSS = 'https://edpb.europa.eu/feed/publications_en';
const EDPB_NEWS_PAGE = 'https://edpb.europa.eu/news_en';
const ICO_NEWS_PAGE = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/';
const ICO_NEWS_PAGE_P2 = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=1';
const ICO_NEWS_PAGES_EXTRA = [
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=2',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=3',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=4',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=5'
];
const COMMISSION_PRESS_RSS_BASE = 'https://ec.europa.eu/commission/presscorner/api/rss';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9'
};

function stripTagsAndCollapse(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bestSnippetFromRssItem($, $el) {
  let fromDesc = stripTagsAndCollapse($el.find('description').first().text());
  let fromEncoded =
    stripTagsAndCollapse($el.find('content\\:encoded').first().text()) ||
    stripTagsAndCollapse($el.find('encoded').first().text());
  const pick =
    fromDesc.length >= 60
      ? fromDesc
      : fromEncoded.length >= 60
        ? fromEncoded
        : fromDesc || fromEncoded;
  const t = pick.slice(0, SNIPPET_MAX_LEN);
  return t || null;
}

async function fetchRss(url, sourceName, sourceUrl) {
  const items = [];
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { 'User-Agent': 'GDPR-QA-Platform/1.0 (News)' },
      responseType: 'text'
    });
    const $ = cheerio.load(data, { xmlMode: true });
    $('item').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').first().text() || '').trim();
      let link = ($el.find('link').first().text() || '').trim();
      if (!link && $el.find('link').length) link = $el.find('link').first().attr('href') || '';
      const pubDate = $el.find('pubDate').text() || $el.find('dc\\:date').text() || $el.find('updated').text();
      if (!title || !link) return;
      let date = null;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const snippet = bestSnippetFromRssItem($, $el);
      items.push({ title, url: link, sourceName, sourceUrl, date, snippet: snippet || null });
    });
    $('entry').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').first().text() || '').trim();
      let link = $el.find('link[rel="alternate"]').attr('href') || $el.find('link').attr('href') || $el.find('link').text() || '';
      const updated = $el.find('updated').text() || $el.find('published').text();
      if (!title || !link) return;
      let date = null;
      if (updated) {
        const d = new Date(updated);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const sum = stripTagsAndCollapse($el.find('summary').first().text());
      const content = stripTagsAndCollapse($el.find('content').first().text());
      const snippetRaw = (sum && sum.length >= 40 ? sum : content || sum).slice(0, SNIPPET_MAX_LEN);
      items.push({
        title,
        url: link.trim(),
        sourceName,
        sourceUrl,
        date,
        snippet: snippetRaw || null
      });
    });
  } catch (err) {
    console.warn('News RSS (' + url + '):', err.message || err);
  }
  return items;
}

async function crawlEdpbRss() {
  return fetchRss(EDPB_RSS, 'European Data Protection Board (EDPB)', 'https://edpb.europa.eu/');
}

/**
 * Commission policy-area codes (from <category>POLICY_AREA=…</category>) that usually cover digital,
 * justice, fundamental rights, consumer digital, or cyber — used as a fast include before text match.
 */
function commissionPolicyAreasSuggestRelevance(codes) {
  if (!codes || !codes.length) return false;
  const blob = ',' + codes.map((c) => String(c).toUpperCase()).join(',') + ',';
  /** RESINSC is broad (R&I); only auto-include tighter digital/justice/consumer codes. */
  return /,(DIGAG|CYBER|TECH|JFRC|CONSUMPOL|COMPETY|COMPETITIVE),/.test(blob);
}

/**
 * Title + description text match: GDPR, privacy, data, platforms, AI governance touching personal data, cyber, etc.
 * Kept as one alternation group for speed; extend when new themes appear often in Commission press.
 */
function commissionPressTextRelevant(blob) {
  const b = blob.toLowerCase();
  return (
    /(data protection|gdpr|\bgdpr\b|\bled\b|privacy|personal data|personen?gegeven|personuppgifter)/i.test(b) ||
    /(eurodac|schengen information|eprivacy|e-privacy|electronic privacy|cookie|consent.{0,40}data|tracking|profiling|targeted ad)/i.test(
      b
    ) ||
    /(data breach|breach notification|security of processing|pseudonymis|anonymis|encryption|cybersecurity|cyber security|cybercrime|ransomware|malware|nis\s*2|critical entit)/i.test(
      b
    ) ||
    /(\bdpo\b|supervisory authorit|data protection authorit|edpb|national.{0,30}authority.{0,40}data|ica\.?o|information commissioner)/i.test(
      b
    ) ||
    /(adequacy decision|standard contractual|transfer.{0,50}personal|third countr.{0,40}data|binding corporate rules|\bbcrs?\b)/i.test(b) ||
    /(digital service|information society|online platform|intermediary|content moderation|dsa|digital markets act|\bdma\b|app store|gatekeeper)/i.test(
      b
    ) ||
    /(algorithmic|artificial intelligence|machine learning|high-risk ai|ai act|fundamental rights.{0,90}data|biometric|facial recognition|surveillance)/i.test(
      b
    ) ||
    /(convention 108|child.{0,30}(online|safety|data)|minor.{0,20}protection|age verification|eidas|digital identity|digital wallet)/i.test(
      b
    ) ||
    /(consumer.{0,40}data|smart device|iot|cloud.{0,30}(data|service)|software.{0,20}(update|security)|open data.{0,40}(governance|high-value))/i.test(
      b
    ) ||
    /(health data|clinical trial.{0,40}data|genetic data|research data|statistical.{0,30}data)/i.test(b) ||
    /(whistleblow|journalist.{0,30}data|law enforcement.{0,40}data|cross-border.{0,40}evidence)/i.test(b)
  );
}

function commissionPressItemRelevant(item) {
  const blob = `${item.title || ''} ${item.snippet || ''}`;
  const areas = item.commissionPolicyAreas || [];
  if (commissionPolicyAreasSuggestRelevance(areas)) return true;
  return commissionPressTextRelevant(blob);
}

function commissionDetailUrlFromRefCode(refCode) {
  const slug = String(refCode || '')
    .trim()
    .replace(/\//g, '_')
    .replace(/\s+/g, '')
    .toLowerCase();
  if (!slug) return '';
  return `https://ec.europa.eu/commission/presscorner/detail/en/${slug}`;
}

async function fetchCommissionPressRssBatch() {
  const url = `${COMMISSION_PRESS_RSS_BASE}?pagesize=${COMMISSION_RSS_PAGE_SIZE}&page=0`;
  const items = [];
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { 'User-Agent': 'GDPR-QA-Platform/1.0 (News)' },
      responseType: 'text'
    });
    const $ = cheerio.load(data, { xmlMode: true });
    $('item').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').first().text() || '').trim();
      let link = ($el.find('link').first().text() || '').trim();
      if (!link && $el.find('link').length) link = $el.find('link').first().attr('href') || '';
      const pubDate = $el.find('pubDate').text();
      if (!title || !link) return;
      let date = null;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const commissionPolicyAreas = [];
      $el.find('category').each((_, c) => {
        const t = ($(c).text() || '').replace(/^POLICY_AREA=/i, '').trim();
        t.split(',').forEach((p) => {
          const x = p.trim().toUpperCase();
          if (x) commissionPolicyAreas.push(x);
        });
      });
      const snippet = bestSnippetFromRssItem($, $el);
      items.push({
        title,
        url: link,
        sourceName: 'European Commission',
        sourceUrl: 'https://commission.europa.eu/',
        date,
        snippet: snippet || null,
        commissionPolicyAreas
      });
    });
  } catch (err) {
    console.warn('News RSS (Commission):', err.message || err);
  }
  return items;
}

async function fetchCommissionPressPolicySearch(code) {
  const url =
    'https://ec.europa.eu/commission/presscorner/api/search?language=en&documentTypeIds=1&rows=100&policyAreaCodes=' +
    encodeURIComponent(code);
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { 'User-Agent': 'GDPR-QA-Platform/1.0 (News)', Accept: 'application/json' }
    });
    return { code, resources: data.docuLanguageListResources || [] };
  } catch (err) {
    console.warn('News API (Commission ' + code + '):', err.message || err);
    return { code, resources: [] };
  }
}

async function crawlCommissionPress() {
  const [rssBatch, ...searchBatches] = await Promise.all([
    fetchCommissionPressRssBatch(),
    ...COMMISSION_SEARCH_POLICY_CODES.map((c) => fetchCommissionPressPolicySearch(c))
  ]);

  const byRef = new Map();

  for (const item of rssBatch) {
    if (!commissionPressItemRelevant(item)) continue;
    const { commissionPolicyAreas: _a, ...rest } = item;
    const k = normalizeNewsUrlKey(rest.url);
    if (k) byRef.set(k, rest);
  }

  const seenRefCodes = new Set();
  for (const { code, resources } of searchBatches) {
    const upper = String(code).toUpperCase();
    for (const r of resources) {
      const ref = (r.refCode || '').trim();
      if (!ref || seenRefCodes.has(ref)) continue;
      seenRefCodes.add(ref);
      const url = commissionDetailUrlFromRefCode(ref);
      if (!url) continue;
      const title = (r.title || '').trim();
      if (!title) continue;
      const lead = stripTagsAndCollapse(r.leadText || '').slice(0, SNIPPET_MAX_LEN);
      let date = null;
      if (r.eventDate) {
        const d = new Date(r.eventDate);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const item = {
        title,
        url,
        sourceName: 'European Commission',
        sourceUrl: 'https://commission.europa.eu/',
        date,
        snippet: lead || null,
        commissionPolicyAreas: [upper]
      };
      if (!commissionPressItemRelevant(item)) continue;
      const { commissionPolicyAreas: _b, ...rest } = item;
      const k = normalizeNewsUrlKey(rest.url);
      if (!k) continue;
      const existing = byRef.get(k);
      if (!existing) {
        byRef.set(k, rest);
      } else {
        byRef.set(k, {
          ...existing,
          snippet: existing.snippet || rest.snippet,
          date: existing.date || rest.date
        });
      }
    }
  }

  return Array.from(byRef.values());
}

function extractEdpbNewsLinksFromPage($, sourceName, sourceUrl) {
  const found = [];
  const selectors = [
    'a[rel="bookmark"][href*="/news/news/"]',
    'h4.node__title a[href*="/news/news/"]',
    'h4 a[href*="/news/news/"]'
  ];
  const seenHref = new Set();
  selectors.forEach((sel) => {
    $(sel).each((_, el) => {
      const $a = $(el);
      let href = $a.attr('href') || '';
      if (href.startsWith('/')) href = 'https://edpb.europa.eu' + href;
      href = href.split('#')[0];
      if (!href || seenHref.has(href)) return;
      seenHref.add(href);
      const title = ($a.text() || $a.attr('title') || '').trim();
      if (!title || title.length < 8) return;
      let date = null;
      const $row = $a.closest('.views-row, .node--type-edpb-news, article, .view-content');
      const blockText = $row.length ? $row.text() : $a.parent().text();
      const dateMatch = blockText.match(
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
      );
      if (dateMatch) {
        const d = new Date(dateMatch[2] + ' ' + dateMatch[1] + ', ' + dateMatch[3]);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      found.push({ title, url: href, sourceName, sourceUrl, date, snippet: null });
    });
  });
  return found;
}

async function crawlEdpbHtml() {
  const sourceName = 'European Data Protection Board (EDPB)';
  const sourceUrl = 'https://edpb.europa.eu/';
  const byKey = new Map();
  for (let page = 0; page < MAX_EDPB_NEWS_PAGES; page++) {
    const pageUrl = page === 0 ? EDPB_NEWS_PAGE : `${EDPB_NEWS_PAGE}?page=${page}`;
    try {
      const { data } = await axios.get(pageUrl, {
        timeout: CRAWL_TIMEOUT_MS,
        headers: { 'User-Agent': 'GDPR-QA-Platform/1.0 (News)' },
        responseType: 'text'
      });
      const $ = cheerio.load(data);
      const batch = extractEdpbNewsLinksFromPage($, sourceName, sourceUrl);
      let newCount = 0;
      for (const item of batch) {
        const k = normalizeNewsUrlKey(item.url);
        if (!k || byKey.has(k)) continue;
        byKey.set(k, item);
        newCount += 1;
      }
      if (newCount === 0) break;
    } catch (err) {
      console.warn('News crawler (EDPB HTML ' + pageUrl + '):', err.message || err);
      break;
    }
  }
  return Array.from(byKey.values());
}

function pushIcoNewsLinks($, items, sourceName, sourceUrl) {
  let n = 0;
  $('a[href*="/media-centre/news-and-blogs/"]').each((_, el) => {
    if (n >= MAX_PER_HTML_SOURCE) return false;
    const $a = $(el);
    let href = $a.attr('href') || '';
    if (href.startsWith('/')) href = 'https://ico.org.uk' + href;
    const title = ($a.text() || '').trim();
    if (!href || !title || title.length < 12) return;
    if (title.length > 220) return;
    if (href === 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/') return;
    if (href.includes('/media-centre/news-and-blogs?page')) return;
    n += 1;
    const $row = $a.closest('article, li, .views-row, [class*="view"]');
    const dateEl = $row.find('time').first();
    let date = null;
    if (dateEl.length) {
      const d = new Date(dateEl.attr('datetime') || dateEl.text());
      if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
    }
    items.push({ title, url: href, sourceName, sourceUrl, date, snippet: null });
  });
}

async function crawlIco() {
  const items = [];
  const sourceName = 'ICO (UK)';
  const sourceUrl = 'https://ico.org.uk/';
  const pages = [ICO_NEWS_PAGE, ICO_NEWS_PAGE_P2, ...ICO_NEWS_PAGES_EXTRA];
  for (const pageUrl of pages) {
    try {
      const { data } = await axios.get(pageUrl, {
        timeout: CRAWL_TIMEOUT_MS,
        headers: BROWSER_HEADERS,
        responseType: 'text'
      });
      const $ = cheerio.load(data);
      pushIcoNewsLinks($, items, sourceName, sourceUrl);
    } catch (err) {
      console.warn('News crawler (ICO ' + pageUrl + '):', err.message || err);
    }
  }
  return items;
}

async function crawlCouncilOfEurope() {
  const items = [];
  const pageUrls = ['https://www.coe.int/en/web/data-protection', 'https://www.coe.int/en/web/data-protection/news'];
  const sourceName = 'Council of Europe';
  const sourceUrl = 'https://www.coe.int/en/web/data-protection';
  for (const pageUrl of pageUrls) {
    try {
      const { data } = await axios.get(pageUrl, {
        timeout: CRAWL_TIMEOUT_MS,
        headers: BROWSER_HEADERS,
        responseType: 'text'
      });
      const $ = cheerio.load(data);
      let n = 0;
      $('a[href*="coe.int"]').each((_, el) => {
        if (n >= MAX_PER_HTML_SOURCE) return false;
        let href = ($(el).attr('href') || '').trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        if (
          !/data-protection|convention-108|convention_108|privacy|108\+|\/news\/|\/en\/web\/data-protection\//i.test(
            href
          )
        )
          return;
        if (!/^https?:\/\//i.test(href)) {
          if (href.startsWith('/')) href = 'https://www.coe.int' + href;
          else return;
        }
        const title = ($(el).text() || '').trim().replace(/\s+/g, ' ');
        if (!title || title.length < 10 || title.length > 240) return;
        if (/^(read more|here|link|click|home|english|français|deutsch|italiano)$/i.test(title)) return;
        n += 1;
        items.push({ title, url: href, sourceName, sourceUrl, date: null, snippet: null });
      });
    } catch (err) {
      console.warn('News crawler (CoE ' + pageUrl + '):', err.message || err);
    }
  }
  return items;
}

function normalizeNewsUrlKey(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url.trim());
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    const path = u.pathname.replace(/\/$/, '') || '/';
    return host + path + (u.search || '').toLowerCase();
  } catch {
    return String(url)
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
}

function mergeNewsDuplicate(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    title: (existing.title || '').length >= (incoming.title || '').length ? existing.title : incoming.title,
    url: existing.url,
    sourceName: existing.sourceName || incoming.sourceName,
    sourceUrl: existing.sourceUrl || incoming.sourceUrl,
    date: existing.date || incoming.date,
    snippet: existing.snippet || incoming.snippet || null
  };
}

async function crawlNews() {
  const [edpbRssItems, edpbHtmlItems, icoItems, commissionItems, coeItems] = await Promise.all([
    crawlEdpbRss(),
    crawlEdpbHtml(),
    crawlIco(),
    crawlCommissionPress(),
    crawlCouncilOfEurope()
  ]);
  const combined = [
    ...edpbRssItems,
    ...edpbHtmlItems,
    ...icoItems,
    ...commissionItems,
    ...coeItems
  ];
  const byKey = new Map();
  combined.forEach((item) => {
    if (!item.title || !item.url) return;
    const key = normalizeNewsUrlKey(item.url);
    if (!key) return;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...item });
    } else {
      byKey.set(key, mergeNewsDuplicate(prev, item));
    }
  });
  const deduped = Array.from(byKey.values());
  deduped.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return deduped;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

module.exports = {
  crawlNews,
  crawlEdpbRss,
  crawlEdpbHtml,
  crawlIco,
  crawlCommissionPress,
  crawlCouncilOfEurope,
  fetchRss,
  withTimeout,
  normalizeNewsUrlKey,
  commissionPressItemRelevant,
  commissionPressTextRelevant
};
