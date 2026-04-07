/**
 * Crawl GDPR / data protection / digital-policy news from credible sources.
 * EDPB (RSS + parallel paginated news HTML), EDPS (RSS), ICO (Umbraco /api/search + sitemap),
 * Commission Press Corner (general + per-policy RSS + thematic API; policy areas for topic gate), CoE (RSS + HTML, Referer).
 */

const axios = require('axios');
const cheerio = require('cheerio');
const {
  assignNewsTopicFields,
  mergeNewsItemTopicFields,
  newsBlobMatchesTopicAnchor,
  getFlatTopicLabelsInOrder,
  NEWS_TOPIC_FALLBACK
} = require('./news-topics');

const CRAWL_TIMEOUT_MS = 25000;
/** Max items to collect per HTML listing source (ICO, CoE link harvest). */
const MAX_PER_HTML_SOURCE = Math.min(
  900,
  Math.max(120, parseInt(process.env.NEWS_MAX_HTML_LINKS_PER_SOURCE || '480', 10) || 480)
);
/** EDPB news listing is paginated (?page=); stop after this many pages or when batches add no new URLs. */
const MAX_EDPB_NEWS_PAGES = Math.min(80, Math.max(12, parseInt(process.env.NEWS_MAX_EDPB_PAGES || '56', 10) || 56));
/** Parallel EDPB listing fetches (page indices fetched together; reduces crawl wall time). */
const EDPB_NEWS_PAGE_CONCURRENCY = 5;
/** Commission press RSS returns up to `pagesize` items per request. */
const COMMISSION_RSS_PAGE_SIZE = Math.min(
  100,
  Math.max(20, parseInt(process.env.NEWS_COMMISSION_RSS_PAGE_SIZE || '100', 10) || 100)
);
/**
 * Commission RSS pagination depth (page=0..N).
 * Note: Presscorner RSS appears to ignore paging parameters (returns same newest slice); we detect and stop early.
 */
const COMMISSION_RSS_MAX_PAGES = Math.min(
  250,
  Math.max(2, parseInt(process.env.NEWS_COMMISSION_RSS_MAX_PAGES || '10', 10) || 10)
);
/** Earliest year to keep when crawling historical pages. */
const NEWS_FROM_YEAR = Math.min(2100, Math.max(1995, parseInt(process.env.NEWS_FROM_YEAR || '2015', 10) || 2015));
const NEWS_FROM_DATE_ISO = `${NEWS_FROM_YEAR}-01-01`;
/**
 * Commission Press Corner policy-area buckets (RSS + search). Broader than GDPR-only codes —
 * `newsItemMatchesApprovedTopic` still filters body text; trusted set keeps detail URLs from being dropped.
 */
const COMMISSION_POLICY_AREA_CODES = [
  'DIGAG',
  'JFRC',
  'CONSUMPOL',
  'COMPETY',
  'RESINSC',
  'CYBER',
  'TECH',
  'JUST',
  'EMPL',
  'HOME',
  'EDUC',
  'SANT',
  'ENV',
  'ENER',
  'TRADE',
  'FISC',
  'REGIO',
  'AGRI',
  'NEAR'
];
/** Parallel Commission RSS fetches (avoid hammering presscorner). */
const COMMISSION_RSS_CONCURRENCY = Math.min(
  10,
  Math.max(2, parseInt(process.env.NEWS_COMMISSION_RSS_CONCURRENCY || '6', 10) || 6)
);
/** Policy codes trusted for Commission press-corner detail URLs (must cover `COMMISSION_POLICY_AREA_CODES`). */
const COMMISSION_PRESS_TRUSTED_POLICY_CODES = new Set(
  COMMISSION_POLICY_AREA_CODES.map((c) => String(c).toUpperCase())
);
/** Max snippet length stored per item (description / content:encoded / Atom summary). */
const SNIPPET_MAX_LEN = 480;

/** Topic-enrichment: try to reduce empty topics by running limited site searches. */
const TOPIC_ENRICH_MAX_TOPICS = Math.min(
  120,
  Math.max(0, parseInt(process.env.NEWS_TOPIC_ENRICH_MAX_TOPICS || '36', 10) || 36)
);
const TOPIC_ENRICH_CONCURRENCY = Math.min(
  8,
  Math.max(1, parseInt(process.env.NEWS_TOPIC_ENRICH_CONCURRENCY || '4', 10) || 4)
);
const TOPIC_ENRICH_ENABLE = String(process.env.NEWS_TOPIC_ENRICH_ENABLE || '1').trim() !== '0';
const TOPIC_ENRICH_TARGET_PER_TOPIC = Math.min(
  25,
  Math.max(1, parseInt(process.env.NEWS_TOPIC_ENRICH_TARGET_PER_TOPIC || '10', 10) || 10)
);
const TOPIC_ENRICH_MAX_QUERIES = Math.min(
  900,
  Math.max(12, parseInt(process.env.NEWS_TOPIC_ENRICH_MAX_QUERIES || '220', 10) || 220)
);

/** Extra queries to improve recall for topics whose label is rarely used verbatim in headlines. */
const TOPIC_QUERY_EXPANSIONS = {
  'Data portability': ['article 20', 'portable format'],
  'Restrictions on rights': ['restriction of processing', 'article 18'],
  'Biometric data and identifiers': ['biometric', 'fingerprint', 'facial biometric'],
  'Processing records': ['records of processing', 'article 30'],
  'Territorial applicability': ['territorial scope', 'article 3', 'extraterritorial'],
  'Cloud services and outsourcing': ['subprocessor', 'outsourcing', 'cloud provider'],
  'Connected vehicles and mobility': ['connected vehicle', 'vehicle data'],
  'Deceptive design patterns': ['dark patterns', 'deceptive design'],
  'Cybersecurity certifications': ['security certification', 'iso 27001', 'iso 27701'],
  'Location data handling': ['geolocation', 'location tracking', 'location data'],
  'International data protection cooperation': ['global privacy assembly', 'cross-border cooperation', 'international cooperation']
};

const EDPB_RSS = 'https://edpb.europa.eu/feed/publications_en';
const EDPB_NEWS_PAGE = 'https://edpb.europa.eu/news_en';
const EDPB_SEARCH_PAGE = 'https://edpb.europa.eu/search?search_api_fulltext=';
/** EDPS aggregated news RSS (press, blog, events digest on site). */
const EDPS_NEWS_RSS = 'https://www.edps.europa.eu/feed/news_en';
const EDPS_SEARCH_PAGE = 'https://www.edps.europa.eu/search?search_api_fulltext=';
const ICO_NEWS_PAGE = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/';
/** Umbraco filter root for “News, blogs and speeches” (see `data-node-id` on #filter-page-container). */
const ICO_NEWS_FILTER_ROOT_PAGE_ID = 2816;
const ICO_SEARCH_API = 'https://ico.org.uk/api/search';
/** ICO search returns ~25 per page; cap pages to bound crawl time. */
const MAX_ICO_SEARCH_PAGES = Math.min(
  64,
  Math.max(10, parseInt(process.env.NEWS_MAX_ICO_SEARCH_PAGES || '64', 10) || 64)
);
const ICO_NEWS_PAGE_P2 = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=1';
const ICO_NEWS_PAGES_EXTRA = [
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=2',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=3',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=4',
  'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/?page=5'
];
const COMMISSION_PRESS_RSS_BASE = 'https://ec.europa.eu/commission/presscorner/api/rss';
/** CoE data-protection RSS candidates (tried in order; Referer sent from `fetchRss`). */
const COE_DP_RSS_URLS = ['https://www.coe.int/en/web/data-protection/rss'];

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

function normalizeTopicQuery(label) {
  const raw = String(label || '').trim();
  if (!raw) return '';
  // Remove UI bullets and punctuation; keep useful acronyms (DPIA, SCC, etc.).
  return raw
    .replace(/^\s*[·•]\s*/, '')
    .replace(/[()]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function computeTopicCounts(items) {
  const counts = Object.create(null);
  (items || []).forEach((it) => {
    const t = String((it && it.topic) || '').trim() || NEWS_TOPIC_FALLBACK;
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function newsItemRelevanceBlob(it) {
  const title = it && it.title ? String(it.title) : '';
  const snippet = it && it.snippet ? String(it.snippet) : '';
  const url = it && it.url ? String(it.url) : '';
  return `${title} ${snippet} ${url}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasDpAnchorForEnrichment(normalizedBlob) {
  const b = String(normalizedBlob || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!b) return false;
  return /\b(gdpr|data protection|personal data|privacy|data subject|supervisory authorit|information commissioner|\bedpb\b|\bedps\b|\bico\b)\b/.test(
    b
  );
}

/** RSS/Atom endpoints often behave better with a browser-like UA and XML Accept (avoids empty or blocked responses). */
const RSS_REQUEST_HEADERS = {
  'User-Agent': BROWSER_HEADERS['User-Agent'],
  Accept: 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*;q=0.8',
  'Accept-Language': BROWSER_HEADERS['Accept-Language']
};

async function fetchRss(url, sourceName, sourceUrl, extraHeaders) {
  const items = [];
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { ...BROWSER_HEADERS, ...RSS_REQUEST_HEADERS, ...(extraHeaders || {}) },
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
 * EDPS RSS <link> values under /press-publications/press-news/news/… often redirect (302) to the news index for
 * non-interactive clients, breaking “open article” and /api/news/article-attachments. The feed <description>
 * embeds the real destination in field-edpsweb-news-link or in the body (press releases, publications, blog).
 */
function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/g, '&');
}

function resolveEdpsItemUrlFromFeed(rssLink, descriptionInner) {
  const fallback = String(rssLink || '').trim();
  const raw = String(descriptionInner || '').trim();
  if (!raw) return fallback;
  const html = decodeXmlEntities(raw);
  let $inner;
  try {
    $inner = cheerio.load(`<div id="edps-rss-desc">${html}</div>`, { decodeEntities: false });
  } catch {
    return fallback;
  }
  const newsLink = $inner('.field--name-field-edpsweb-news-link a[href]').first().attr('href');
  if (newsLink && /^https?:\/\//i.test(newsLink.trim())) {
    return newsLink.replace(/&amp;/g, '&').trim();
  }
  const bodyHrefs = [];
  $inner('.field--name-field-edpsweb-body a[href]').each((_, el) => {
    const h = $inner(el).attr('href');
    if (h && /edps\.europa\.eu/i.test(h)) {
      bodyHrefs.push(h.replace(/&amp;/g, '&').trim());
    }
  });
  const score = (u) => {
    const p = u.toLowerCase();
    if (p.includes('/press-publications/press-news/press-releases/')) return 100;
    if (p.includes('/data-protection/our-work/publications/')) return 95;
    if (p.includes('/press-publications/publications/podcasts/')) return 90;
    if (p.includes('/press-publications/press-news/blog/')) return 88;
    if (p.includes('/data-protection/our-work/publications/events/')) return 85;
    if (/\/press-publications\/press-news\/news\/\d{4}\//i.test(p) && !/_en$/i.test(p)) return 5;
    if (/\/press-publications\/press-news\/news\//i.test(p)) return 15;
    return 50;
  };
  bodyHrefs.sort((a, b) => score(b) - score(a));
  if (bodyHrefs.length) return bodyHrefs[0];
  return fallback;
}

async function crawlEdpsRss() {
  const sourceName = 'European Data Protection Supervisor (EDPS)';
  const sourceUrl = 'https://www.edps.europa.eu/';
  const items = [];
  try {
    const { data } = await axios.get(EDPS_NEWS_RSS, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { ...BROWSER_HEADERS, ...RSS_REQUEST_HEADERS },
      responseType: 'text'
    });
    const $ = cheerio.load(data, { xmlMode: true });
    $('item').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').first().text() || '').trim();
      let link = ($el.find('link').first().text() || '').trim();
      if (!link && $el.find('link').length) link = $el.find('link').first().attr('href') || '';
      link = String(link || '').trim();
      const pubDate = $el.find('pubDate').text() || $el.find('dc\\:date').text() || '';
      if (!title || !link) return;
      let date = null;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const descEl = $el.find('description').first();
      let descInner = typeof descEl.html === 'function' ? descEl.html() : null;
      if (descInner == null || String(descInner).trim() === '') {
        descInner = descEl.text() || '';
      }
      const url = resolveEdpsItemUrlFromFeed(link, descInner);
      const snippet = bestSnippetFromRssItem($, $el);
      items.push({ title, url, sourceName, sourceUrl, date, snippet: snippet || null });
    });
  } catch (err) {
    console.warn('News RSS (EDPS):', err.message || err);
  }
  return items;
}

function freedomOfInformationOnlyWithoutDpContext(b) {
  const blob = String(b || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!blob) return false;
  return (
    /\bfreedom of information\b/.test(blob) &&
    !/\b(personal data|data protection|privacy|gdpr|uk[\s-]*gdpr|information rights|subject access|breach)\b/.test(
      blob
    )
  );
}

/**
 * Single gate for all news sources: keep items that tie to GDPR / personal data / privacy protection
 * (and close combinations). Hub-scoped crawls (EDPB, EDPS, ICO news hub, Commission Press Corner
 * policy buckets, CoE data-protection) are trusted after the global FOI-only exclusion.
 */
function newsItemMatchesApprovedTopic(item) {
  const title = String(item.title || '');
  const snippet = String(item.snippet || '');
  const url = String(item.url || '');
  const b = `${title} ${snippet} ${url}`.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!b) return false;

  if (freedomOfInformationOnlyWithoutDpContext(b)) return false;

  if (/edpb\.europa\.eu/i.test(url)) return true;
  if (/edps\.europa\.eu/i.test(url)) return true;

  if (/coe\.int/i.test(url)) {
    const u = url.toLowerCase();
    if (
      /data-protection|dataprotection|convention[-_\s]?108|108\+|privacy|datenschutz|\/cd\/|\/en\/web\/data-protection/i.test(
        u
      ) ||
      /\b(convention\s*108|108\+|data protection|personal data|privacy|treaty|coe\.int\/en\/web\/data-protection)\b/.test(
        b
      )
    ) {
      return true;
    }
  }

  const cap = item.commissionPolicyAreas;
  if (
    Array.isArray(cap) &&
    cap.length > 0 &&
    /ec\.europa\.eu\/commission\/presscorner\/detail\//i.test(url)
  ) {
    if (cap.some((c) => COMMISSION_PRESS_TRUSTED_POLICY_CODES.has(String(c).toUpperCase().trim()))) {
      return true;
    }
  }

  if (/\bgdpr\b/.test(b)) return true;
  if (/general data protection regulation/.test(b)) return true;
  if (/\buk[\s-]*gdpr\b/.test(b)) return true;
  if (/data privacy|data privacy protection/.test(b)) return true;
  if (/personal data|personal data protection|personal privacy protection/.test(b)) return true;
  if (/\bprivacy protection\b/.test(b)) return true;
  if (/data protection/.test(b)) return true;
  if (/\bprivacy\b/.test(b) && /\b(data|personal|information|digital|online|protect|gdpr)\b/.test(b)) return true;
  if (
    /\bdata\b/.test(b) &&
    /\b(personal|privacy|protect|gdpr|subject|breach|data controller|data processor|joint controller)\b/.test(b)
  ) {
    return true;
  }
  if (/data subject|lawful(?:ness)? of processing|purpose limitation|storage limitation/.test(b)) return true;
  if (/\beprivacy\b|e-privacy|electronic communications privacy|electronic privacy/.test(b)) return true;
  if (/convention\s*108|convention-108|108\+/.test(b)) return true;
  if (/\bdpo\b|data protection officer/.test(b)) return true;
  if (
    /supervisory authorit|data protection authorit|european data protection board|european data protection supervisor|\bedpb\b|\bedps\b|data protection supervisor/.test(
      b
    )
  ) {
    return true;
  }
  if (/\binformation commissioner\b/.test(b)) return true;
  if (/persoonsgegevens|personuppgifter|personen?gegeven/.test(b)) return true;
  if (/adequacy.{0,70}(data|personal|transfer|third|privacy|protection)/.test(b)) return true;
  if (/international.{0,50}data transfer|transfer.{0,60}personal data|third countr.{0,50}data/.test(b)) return true;
  if (/personal data breach|data breach.{0,50}(personal|notification|protection)/.test(b)) return true;
  if (/standard contractual clauses|\bscc\b|binding corporate rules|\bbcrs?\b/.test(b)) return true;
  if (/\bprofiling\b/.test(b) && /\b(data|personal|privacy|automated)\b/.test(b)) return true;
  if (
    /\b(children|child|minor)\b/.test(b) &&
    /\b(privacy|personal data|data protection|gdpr|online|data subject)\b/.test(b)
  ) {
    return true;
  }
  if (
    /cookie|targeted ad|behavioural advertising|behavioral advertising|tracking.{0,40}(personal|privacy|user)/.test(b)
  ) {
    return true;
  }
  if (/(consent|processing).{0,50}(personal data|data subject|privacy)/.test(b)) return true;
  if (/(personal data|privacy).{0,50}(consent|processing)/.test(b)) return true;

  if (/ico\.org\.uk/i.test(url)) {
    /**
     * “News, blogs and speeches” items live under …/news-and-blogs/{year}/… — the crawl is already limited
     * to that hub via /api/search + sitemap. A keyword list with trailing \\b falsely dropped plural/stem
     * forms (“reprimanded”, “Fines”, “guidance”) and empty snippets. Pure-FOI pieces are still removed by
     * the global gate at the top of this function (freedom of information without DP/privacy terms in b).
     */
    if (/\/about-the-ico\/media-centre\/news-and-blogs\/\d{4}\//i.test(url)) {
      return true;
    }
    const t = `${title} ${snippet}`.toLowerCase().replace(/\s+/g, ' ');
    if (
      /\b(fines?\b|penalt|enforcement|reprimand|reprimanded|warning|monetary penalty)\b/.test(t) &&
      /\b(data protection|privacy|personal|gdpr|marketing|email|nuisance|cookie|breach|spam|track|pecr|electronic communications)\b/.test(
        t
      )
    ) {
      return true;
    }
  }

  if (newsBlobMatchesTopicAnchor(b)) return true;

  return false;
}

/** @deprecated Use newsItemMatchesApprovedTopic; kept for callers/tests that pass a single text blob. */
function commissionPressTextRelevant(blob) {
  return newsItemMatchesApprovedTopic({ title: String(blob || ''), snippet: '', url: '' });
}

function commissionPressItemRelevant(item) {
  return newsItemMatchesApprovedTopic(item);
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

function mergeCommissionPolicyAreas(a, b) {
  const out = new Set();
  if (Array.isArray(a)) a.forEach((x) => out.add(String(x).toUpperCase().trim()));
  if (Array.isArray(b)) b.forEach((x) => out.add(String(x).toUpperCase().trim()));
  return out.size ? [...out] : undefined;
}

function mergeCommissionPressItemIntoMap(byRef, item) {
  if (!item || !item.title || !item.url) return;
  const k = normalizeNewsUrlKey(item.url);
  if (!k) return;
  const existing = byRef.get(k);
  if (!existing) {
    byRef.set(k, { ...item });
    return;
  }
  byRef.set(k, {
    ...existing,
    snippet: pickRicherNewsSnippet(existing.snippet, item.snippet),
    date: existing.date || item.date,
    title: (existing.title || '').length >= (item.title || '').length ? existing.title : item.title,
    commissionPolicyAreas: mergeCommissionPolicyAreas(existing.commissionPolicyAreas, item.commissionPolicyAreas)
  });
}

function parseCommissionPressRssItems(data, opts) {
  const sourceName = opts && opts.sourceName;
  const sourceUrl = opts && opts.sourceUrl;
  const defaultPolicyCode = opts && opts.defaultPolicyCode;
  const items = [];
  try {
    const $ = cheerio.load(data, { xmlMode: true });
    $('item').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').first().text() || '').trim();
      let link = ($el.find('link').first().text() || '').trim();
      if (!link && $el.find('link').length) link = $el.find('link').first().attr('href') || '';
      link = String(link || '').trim();
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
      if (defaultPolicyCode) {
        const up = String(defaultPolicyCode).toUpperCase().trim();
        if (up && !commissionPolicyAreas.includes(up)) commissionPolicyAreas.push(up);
      }
      const snippet = bestSnippetFromRssItem($, $el);
      items.push({
        title,
        url: link,
        sourceName,
        sourceUrl,
        date,
        snippet: snippet || null,
        commissionPolicyAreas: commissionPolicyAreas.length ? commissionPolicyAreas : undefined
      });
    });
  } catch (err) {
    console.warn('News RSS (Commission parse):', err.message || err);
  }
  return items;
}

function isOnOrAfterFromYear(dateIso) {
  const d = String(dateIso || '').trim();
  if (!d) return true;
  return d >= NEWS_FROM_DATE_ISO;
}

function oldestIsoDate(items) {
  let oldest = null;
  for (const it of items || []) {
    const d = it && it.date ? String(it.date) : '';
    if (!d) continue;
    if (!oldest || d < oldest) oldest = d;
  }
  return oldest;
}

async function fetchCommissionPressRssXml(url) {
  const { data } = await axios.get(url, {
    timeout: CRAWL_TIMEOUT_MS,
    headers: { ...BROWSER_HEADERS, ...RSS_REQUEST_HEADERS },
    responseType: 'text'
  });
  return data;
}

async function fetchCommissionRssPaged(opts) {
  const sourceName = opts && opts.sourceName;
  const sourceUrl = opts && opts.sourceUrl;
  const policyCode = opts && opts.policyCode;
  const maxPages = opts && opts.maxPages != null ? opts.maxPages : COMMISSION_RSS_MAX_PAGES;
  const out = [];
  const seen = new Set();
  let prevFirstKey = '';
  for (let page = 0; page < maxPages; page++) {
    const url =
      `${COMMISSION_PRESS_RSS_BASE}?` +
      (policyCode ? `policyAreaCodes=${encodeURIComponent(policyCode)}&` : '') +
      `pagesize=${COMMISSION_RSS_PAGE_SIZE}&page=${page}`;
    let xml = '';
    try {
      xml = await fetchCommissionPressRssXml(url);
    } catch (err) {
      console.warn('News RSS (Commission paged' + (policyCode ? ' ' + policyCode : '') + ' p' + page + '):', err.message || err);
      break;
    }
    const batch = parseCommissionPressRssItems(xml, {
      sourceName,
      sourceUrl,
      defaultPolicyCode: policyCode || undefined
    });
    if (!batch.length) break;
    // If the feed ignores paging, pages will repeat. Detect by first item key.
    const first = batch[0] && batch[0].url ? normalizeNewsUrlKey(batch[0].url) : '';
    if (page > 0 && first && prevFirstKey && first === prevFirstKey) break;
    if (first) prevFirstKey = first;
    let batchNew = 0;
    for (const it of batch) {
      const k = normalizeNewsUrlKey(it.url);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      // Keep items from NEWS_FROM_YEAR onward.
      if (!isOnOrAfterFromYear(it.date)) continue;
      out.push(it);
      batchNew += 1;
    }
    if (page > 0 && batchNew === 0) break;
    const oldest = oldestIsoDate(batch);
    if (oldest && !isOnOrAfterFromYear(oldest)) {
      // We've crossed the from-year boundary; stop fetching older pages.
      break;
    }
  }
  return out;
}

async function fetchCommissionPolicyRssAll() {
  const sourceName = 'European Commission';
  const sourceUrl = 'https://commission.europa.eu/';
  const out = [];
  // General feed supports pagination — use it to reach back to NEWS_FROM_YEAR.
  out.push(...(await fetchCommissionRssPaged({ sourceName, sourceUrl, maxPages: COMMISSION_RSS_MAX_PAGES })));
  for (let i = 0; i < COMMISSION_POLICY_AREA_CODES.length; i += COMMISSION_RSS_CONCURRENCY) {
    const chunk = COMMISSION_POLICY_AREA_CODES.slice(i, i + COMMISSION_RSS_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (code) => {
        // Policy feeds are additional signals; fetch only first page to avoid an explosion of requests.
        const url = `${COMMISSION_PRESS_RSS_BASE}?policyAreaCodes=${encodeURIComponent(code)}&pagesize=${COMMISSION_RSS_PAGE_SIZE}&page=0`;
        try {
          const xml = await fetchCommissionPressRssXml(url);
          return parseCommissionPressRssItems(xml, { sourceName, sourceUrl, defaultPolicyCode: code }).filter((it) =>
            isOnOrAfterFromYear(it.date)
          );
        } catch (err) {
          console.warn('News RSS (Commission ' + code + '):', err.message || err);
          return [];
        }
      })
    );
    for (const arr of chunkResults) out.push(...arr);
  }
  return out;
}

async function fetchAllCommissionPolicySearches() {
  const conc = Math.min(8, Math.max(2, COMMISSION_RSS_CONCURRENCY));
  const all = [];
  for (let i = 0; i < COMMISSION_POLICY_AREA_CODES.length; i += conc) {
    const slice = COMMISSION_POLICY_AREA_CODES.slice(i, i + conc);
    const batch = await Promise.all(slice.map((c) => fetchCommissionPressPolicySearch(c)));
    all.push(...batch);
  }
  return all;
}

async function fetchCommissionPressPolicySearch(code) {
  const url =
    'https://ec.europa.eu/commission/presscorner/api/search?language=en&documentTypeIds=1&rows=100&policyAreaCodes=' +
    encodeURIComponent(code);
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { ...BROWSER_HEADERS, Accept: 'application/json' }
    });
    return { code, resources: data.docuLanguageListResources || [] };
  } catch (err) {
    console.warn('News API (Commission ' + code + '):', err.message || err);
    return { code, resources: [] };
  }
}

async function crawlCommissionPress() {
  const [rssItems, searchBatches] = await Promise.all([
    fetchCommissionPolicyRssAll(),
    fetchAllCommissionPolicySearches()
  ]);

  const byRef = new Map();
  for (const item of rssItems) {
    mergeCommissionPressItemIntoMap(byRef, item);
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
      mergeCommissionPressItemIntoMap(byRef, item);
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
  let emptyStreak = 0;
  for (let batchStart = 0; batchStart < MAX_EDPB_NEWS_PAGES; batchStart += EDPB_NEWS_PAGE_CONCURRENCY) {
    const slice = [];
    for (let p = batchStart; p < Math.min(batchStart + EDPB_NEWS_PAGE_CONCURRENCY, MAX_EDPB_NEWS_PAGES); p++) {
      slice.push(p === 0 ? EDPB_NEWS_PAGE : `${EDPB_NEWS_PAGE}?page=${p}`);
    }
    const pageResults = await Promise.all(
      slice.map(async (pageUrl) => {
        try {
          const { data } = await axios.get(pageUrl, {
            timeout: CRAWL_TIMEOUT_MS,
            headers: BROWSER_HEADERS,
            responseType: 'text'
          });
          const $ = cheerio.load(data);
          return extractEdpbNewsLinksFromPage($, sourceName, sourceUrl);
        } catch (err) {
          console.warn('News crawler (EDPB HTML ' + pageUrl + '):', err.message || err);
          return [];
        }
      })
    );
    let batchNew = 0;
    for (const batch of pageResults) {
      for (const item of batch) {
        const k = normalizeNewsUrlKey(item.url);
        if (!k || byKey.has(k)) continue;
        byKey.set(k, item);
        batchNew += 1;
      }
    }
    if (batchNew === 0) {
      emptyStreak += 1;
      if (emptyStreak >= 2) break;
    } else {
      emptyStreak = 0;
    }
  }
  return Array.from(byKey.values());
}

function extractLinksFromGenericSearchHtml($, baseHost, sourceName, sourceUrl) {
  const out = [];
  const seen = new Set();
  $('a[href]').each((_, el) => {
    let href = ($(el).attr('href') || '').trim();
    if (!href) return;
    if (href.startsWith('/')) href = baseHost.replace(/\/$/, '') + href;
    if (!/^https?:\/\//i.test(href)) return;
    if (!href.toLowerCase().includes(baseHost.replace(/^https?:\/\//i, '').toLowerCase())) return;
    href = href.split('#')[0];
    const k = normalizeNewsUrlKey(href);
    if (!k || seen.has(k)) return;
    const title = stripTagsAndCollapse($(el).text() || '').trim();
    if (!title || title.length < 10) return;
    // Avoid nav/footer junk in search pages.
    if (/privacy policy|cookies|accessibility|contact|search/i.test(title) && title.length < 40) return;
    seen.add(k);
    out.push({ title, url: href, sourceName, sourceUrl, date: null, snippet: null });
  });
  return out;
}

async function crawlEdpbSearch(query) {
  const q = normalizeTopicQuery(query);
  if (!q) return [];
  const sourceName = 'European Data Protection Board (EDPB)';
  const sourceUrl = 'https://edpb.europa.eu/';
  const url = EDPB_SEARCH_PAGE + encodeURIComponent(q);
  try {
    const { data } = await axios.get(url, {
      timeout: Math.min(CRAWL_TIMEOUT_MS, 15000),
      headers: BROWSER_HEADERS,
      responseType: 'text'
    });
    const $ = cheerio.load(data);
    // Prefer “news” and “publications” style links; fallback to generic.
    const found = [];
    const seen = new Set();
    const selectors = [
      'a[href*="/news/news/"]',
      'a[href*="/publications/"]',
      'a[href*="/our-work-tools/"]',
      'h3 a[href], h4 a[href]'
    ];
    selectors.forEach((sel) => {
      $(sel).each((_, el) => {
        const $a = $(el);
        let href = ($a.attr('href') || '').trim();
        if (!href) return;
        if (href.startsWith('/')) href = 'https://edpb.europa.eu' + href;
        if (!/^https?:\/\//i.test(href)) return;
        href = href.split('#')[0];
        const k = normalizeNewsUrlKey(href);
        if (!k || seen.has(k)) return;
        const title = stripTagsAndCollapse($a.text() || '').trim();
        if (!title || title.length < 10) return;
        const $row = $a.closest('.views-row, article, li, .search-results, .view-content');
        let snippet = null;
        if ($row && $row.length) {
          let raw = stripTagsAndCollapse($row.text() || '');
          if (raw && title && raw.toLowerCase().indexOf(title.toLowerCase()) === 0) {
            raw = raw.slice(title.length).trim();
          }
          raw = raw.replace(/\s+/g, ' ').trim();
          if (raw.length >= 40) snippet = raw.slice(0, SNIPPET_MAX_LEN);
        }
        seen.add(k);
        found.push({ title, url: href, sourceName, sourceUrl, date: null, snippet: snippet || null });
      });
    });
    if (found.length) return found.slice(0, 120);
    return extractLinksFromGenericSearchHtml($, 'https://edpb.europa.eu', sourceName, sourceUrl).slice(0, 120);
  } catch (err) {
    console.warn('News crawler (EDPB search ' + q + '):', err.message || err);
    return [];
  }
}

async function crawlEdpsSearch(query) {
  const q = normalizeTopicQuery(query);
  if (!q) return [];
  const sourceName = 'European Data Protection Supervisor (EDPS)';
  const sourceUrl = 'https://www.edps.europa.eu/';
  const url = EDPS_SEARCH_PAGE + encodeURIComponent(q);
  try {
    const { data } = await axios.get(url, {
      timeout: Math.min(CRAWL_TIMEOUT_MS, 15000),
      headers: BROWSER_HEADERS,
      responseType: 'text'
    });
    const $ = cheerio.load(data);
    // EDPS search markup varies; extract useful internal links and filter paths.
    const raw = extractLinksFromGenericSearchHtml($, 'https://www.edps.europa.eu', sourceName, sourceUrl).map(
      (it) => {
        // Best-effort: grab surrounding text for snippet so keyword inference can work.
        try {
          const $a = $(`a[href="${it.url.replace(/"/g, '\\"')}"]`).first();
          const $row = $a && $a.length ? $a.closest('article, li, .views-row, .search-results, .view-content') : null;
          if ($row && $row.length) {
            let raw = stripTagsAndCollapse($row.text() || '');
            if (raw && it.title && raw.toLowerCase().indexOf(String(it.title).toLowerCase()) === 0) {
              raw = raw.slice(String(it.title).length).trim();
            }
            raw = raw.replace(/\s+/g, ' ').trim();
            if (raw.length >= 40) return { ...it, snippet: raw.slice(0, SNIPPET_MAX_LEN) };
          }
        } catch {}
        return it;
      }
    );
    const keep = raw.filter((it) => {
      const u = String(it.url || '').toLowerCase();
      return (
        u.includes('/press-publications/') ||
        u.includes('/data-protection/') ||
        u.includes('/our-work/') ||
        u.includes('/news/') ||
        u.includes('/blog/')
      );
    });
    return (keep.length ? keep : raw).slice(0, 120);
  } catch (err) {
    console.warn('News crawler (EDPS search ' + q + '):', err.message || err);
    return [];
  }
}

async function crawlIcoSearchQuery(query) {
  // ICO's public /api/search currently blocks keyworded requests (403) in many environments.
  // We already crawl the full ICO hub via /api/search (without searchTerm) + sitemap enrichment,
  // so topic enrichment skips ICO to avoid noisy failures and unnecessary load.
  return [];
}

async function fetchCommissionPressQuerySearch(query) {
  const q = normalizeTopicQuery(query);
  if (!q) return [];
  const url =
    'https://ec.europa.eu/commission/presscorner/api/search?language=en&documentTypeIds=1&rows=100&query=' +
    encodeURIComponent(q);
  try {
    const { data } = await axios.get(url, {
      timeout: Math.min(CRAWL_TIMEOUT_MS, 15000),
      headers: { ...BROWSER_HEADERS, Accept: 'application/json' }
    });
    const resources = data && Array.isArray(data.docuLanguageListResources) ? data.docuLanguageListResources : [];
    const byRef = new Map();
    const seenRef = new Set();
    for (const r of resources) {
      const ref = (r.refCode || '').trim();
      if (!ref || seenRef.has(ref)) continue;
      seenRef.add(ref);
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
        snippet: lead || null
      };
      mergeCommissionPressItemIntoMap(byRef, item);
    }
    return Array.from(byRef.values());
  } catch (err) {
    console.warn('News API (Commission query ' + q + '):', err.message || err);
    return [];
  }
}

async function enrichMissingTopicsViaSearch(itemsAlready) {
  if (!TOPIC_ENRICH_ENABLE || TOPIC_ENRICH_MAX_TOPICS <= 0) return [];
  const labels = getFlatTopicLabelsInOrder().filter((t) => t && t !== NEWS_TOPIC_FALLBACK);
  const counts = computeTopicCounts(itemsAlready);
  // We aim to *fill up to* TOPIC_ENRICH_TARGET_PER_TOPIC per leaf, not just avoid zeros.
  const deficits = labels
    .map((t) => ({ t, n: counts[t] || 0 }))
    .filter((x) => x.n < TOPIC_ENRICH_TARGET_PER_TOPIC)
    .sort((a, b) => a.n - b.n);
  if (!deficits.length) return [];
  const wanted = deficits.slice(0, TOPIC_ENRICH_MAX_TOPICS).map((x) => x.t);

  const enriched = [];
  let queryBudgetUsed = 0;
  for (let i = 0; i < wanted.length; i += TOPIC_ENRICH_CONCURRENCY) {
    const slice = wanted.slice(i, i + TOPIC_ENRICH_CONCURRENCY);
    const batch = await Promise.all(
      slice.map(async (topicLabel) => {
        if (queryBudgetUsed >= TOPIC_ENRICH_MAX_QUERIES) return [];
        const baseQ = normalizeTopicQuery(topicLabel);
        const extra = TOPIC_QUERY_EXPANSIONS[topicLabel] || [];
        const queries = [baseQ, ...extra.map((x) => normalizeTopicQuery(x))].filter(Boolean);
        // Bound per-topic work: base label + at most 2 expansions.
        const qSlice = queries.slice(0, 3);
        const all = [];
        for (const q of qSlice) {
          if (queryBudgetUsed >= TOPIC_ENRICH_MAX_QUERIES) break;
          queryBudgetUsed += 3; // approx: EDPB + EDPS + Commission (ICO skipped)
          const [edpb, edps, ico, comm] = await Promise.all([
            crawlEdpbSearch(q),
            crawlEdpsSearch(q),
            crawlIcoSearchQuery(q),
            fetchCommissionPressQuerySearch(q)
          ]);
          all.push(...edpb, ...edps, ...ico, ...comm);
        }
        return all;
      })
    );
    batch.forEach((arr) => enriched.push(...arr));
    if (queryBudgetUsed >= TOPIC_ENRICH_MAX_QUERIES) break;
  }

  // Gate: keep only items that are clearly DP-related for our taxonomy (avoid polluting corpus).
  const gated = [];
  for (const it of enriched) {
    const norm = newsItemRelevanceBlob(it);
    if (!newsItemMatchesApprovedTopic({ ...it, snippet: it.snippet || null })) continue;
    // Use a simpler anchor check for enrichment; topic assignment is decided by classifier.
    if (!hasDpAnchorForEnrichment(norm)) continue;
    gated.push(it);
  }
  // Classify and then keep items that actually help fill under-covered topics.
  const wantNow = computeTopicCounts(itemsAlready);
  const out = [];
  for (const raw of gated) {
    const classified = assignNewsTopicFields(raw);
    const t = String((classified && classified.topic) || '').trim();
    if (!t || t === NEWS_TOPIC_FALLBACK) continue;
    const cur = wantNow[t] || 0;
    if (cur >= TOPIC_ENRICH_TARGET_PER_TOPIC) continue;
    wantNow[t] = cur + 1;
    out.push(classified);
  }
  return out;
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

function icoSearchResultToNewsItem(row, sourceName, sourceUrl) {
  const path = String(row.url || '').trim();
  const title = String(row.title || '').trim();
  if (!path || !title || title.length < 8) return null;
  if (!/^\/about-the-ico\/media-centre\/news-and-blogs\/\d{4}\//i.test(path)) return null;
  const url = path.startsWith('http') ? path : `https://ico.org.uk${path}`;
  let date = null;
  if (row.createdDateTime) {
    const d = new Date(row.createdDateTime);
    if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
  }
  const desc = stripTagsAndCollapse(row.description || '').slice(0, SNIPPET_MAX_LEN);
  return {
    title,
    url,
    sourceName,
    sourceUrl,
    date,
    snippet: desc || null
  };
}

/**
 * ICO “News, blogs and speeches” is populated client-side; static HTML has almost no article links.
 * POST /api/search (rootPageId from #filter-page-container) returns listing JSON, but a single `order`
 * leaves “holes” (empty `results` for some page numbers). Merging `newest` + `oldest` covers almost
 * all rows; the public sitemap fills occasional gaps (e.g. very new items not yet in the API index).
 */
async function crawlIcoFromSearchApiMergedOrders(sourceName, sourceUrl) {
  const byKey = new Map();
  const orders = ['newest', 'oldest'];
  for (const order of orders) {
    let totalPages = MAX_ICO_SEARCH_PAGES;
    for (let page = 1; page <= totalPages; page++) {
      const { data } = await axios.post(
        ICO_SEARCH_API,
        {
          filters: [],
          pageNumber: page,
          order,
          rootPageId: ICO_NEWS_FILTER_ROOT_PAGE_ID
        },
        {
          timeout: CRAWL_TIMEOUT_MS,
          headers: {
            'User-Agent': BROWSER_HEADERS['User-Agent'],
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': BROWSER_HEADERS['Accept-Language'],
            Referer: ICO_NEWS_PAGE
          },
          responseType: 'json',
          validateStatus: (status) => status === 200
        }
      );
      if (page === 1 && data && data.pagination) {
        const tp = Number(data.pagination.totalPages);
        if (Number.isFinite(tp) && tp > 0) {
          totalPages = Math.min(tp, MAX_ICO_SEARCH_PAGES);
        }
      }
      const rows = data && Array.isArray(data.results) ? data.results : [];
      for (const row of rows) {
        const item = icoSearchResultToNewsItem(row, sourceName, sourceUrl);
        if (!item) continue;
        const k = normalizeNewsUrlKey(item.url);
        if (!k) continue;
        const prev = byKey.get(k);
        if (!prev) byKey.set(k, item);
        else byKey.set(k, mergeNewsDuplicate(prev, item));
      }
    }
  }
  return byKey;
}

const ICO_SITEMAP_URL = 'https://ico.org.uk/sitemap.xml';
/** Cap HTML meta fetches for sitemap URLs missing from the ICO search API (parallel batches). */
const MAX_ICO_SITEMAP_ENRICH_FETCHES = Math.min(
  450,
  Math.max(50, parseInt(process.env.NEWS_MAX_ICO_SITEMAP_FETCHES || '280', 10) || 280)
);
/** Concurrent ICO article page fetches (wall-clock); avoids blowing server crawl timeouts. */
const ICO_SITEMAP_ENRICH_CONCURRENCY = 10;

function titleFromIcoUrlSlug(slug) {
  const s = String(slug || '')
    .replace(/\/$/, '')
    .split('/')
    .pop();
  if (!s) return '';
  return s
    .replace(/\.(html?|aspx)$/i, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function fetchIcoArticleMetaForNewsItem(url, sourceName, sourceUrl) {
  try {
    const { data } = await axios.get(url, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: BROWSER_HEADERS,
      responseType: 'text'
    });
    const $ = cheerio.load(data);
    let title =
      ($('meta[property="og:title"]').attr('content') || '').trim() ||
      ($('title').first().text() || '').trim();
    title = title.replace(/\s*\|\s*ICO\s*$/i, '').trim();
    let snippet =
      ($('meta[name="description"]').attr('content') || '').trim() ||
      ($('meta[property="og:description"]').attr('content') || '').trim();
    snippet = stripTagsAndCollapse(snippet).slice(0, SNIPPET_MAX_LEN);
    let date = null;
    const dt =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').first().attr('datetime') ||
      '';
    if (dt) {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
    }
    if (!title || title.length < 8) return null;
    return {
      title,
      url,
      sourceName,
      sourceUrl,
      date,
      snippet: snippet || null
    };
  } catch (err) {
    console.warn('News crawler (ICO article meta ' + url + '):', err.message || err);
    return null;
  }
}

function icoSitemapGapToSlugItem(path, url, sourceName, sourceUrl) {
  const slugTitle = titleFromIcoUrlSlug(path);
  if (!slugTitle || slugTitle.length < 12) return null;
  const ym = path.match(/\/(\d{4})\/(\d{2})\//);
  let date = null;
  if (ym) date = `${ym[1]}-${ym[2]}-01`;
  return { title: slugTitle, url, sourceName, sourceUrl, date, snippet: null };
}

async function mergeIcoSitemapOnlyGaps(byKey, sourceName, sourceUrl) {
  let paths = [];
  try {
    const { data } = await axios.get(ICO_SITEMAP_URL, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        Referer: ICO_NEWS_PAGE
      },
      responseType: 'text',
      validateStatus: (s) => s === 200
    });
    const $ = cheerio.load(data, { xmlMode: true });
    const seen = new Set();
    $('loc').each((_, el) => {
      const u = ($(el).text() || '').trim();
      const m = u.match(
        /^https:\/\/ico\.org\.uk(\/about-the-ico\/media-centre\/news-and-blogs\/\d{4}\/\d{2}\/[^/?#]+)\/?$/i
      );
      if (!m) return;
      const path = m[1].replace(/\/$/, '');
      if (seen.has(path)) return;
      seen.add(path);
      paths.push(path);
    });
  } catch (err) {
    console.warn('News crawler (ICO sitemap):', err.message || err);
    return;
  }
  const gaps = [];
  for (const path of paths) {
    const url = `https://ico.org.uk${path}`;
    const k = normalizeNewsUrlKey(url);
    if (!k || byKey.has(k)) continue;
    gaps.push({ path, url, k });
  }
  const fetchList = gaps.slice(0, MAX_ICO_SITEMAP_ENRICH_FETCHES);
  const slugOnly = gaps.slice(MAX_ICO_SITEMAP_ENRICH_FETCHES);
  for (let i = 0; i < fetchList.length; i += ICO_SITEMAP_ENRICH_CONCURRENCY) {
    const chunk = fetchList.slice(i, i + ICO_SITEMAP_ENRICH_CONCURRENCY);
    const metas = await Promise.all(
      chunk.map(({ url }) => fetchIcoArticleMetaForNewsItem(url, sourceName, sourceUrl))
    );
    chunk.forEach((g, j) => {
      let item = metas[j];
      if (!item) item = icoSitemapGapToSlugItem(g.path, g.url, sourceName, sourceUrl);
      if (item) byKey.set(g.k, item);
    });
  }
  for (const g of slugOnly) {
    const item = icoSitemapGapToSlugItem(g.path, g.url, sourceName, sourceUrl);
    if (item) byKey.set(g.k, item);
  }
}

async function crawlIcoHtmlPages(sourceName, sourceUrl) {
  const items = [];
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
      console.warn('News crawler (ICO HTML ' + pageUrl + '):', err.message || err);
    }
  }
  return items;
}

async function crawlIco() {
  const sourceName = 'ICO (UK)';
  const sourceUrl = 'https://ico.org.uk/';
  try {
    const byKey = await crawlIcoFromSearchApiMergedOrders(sourceName, sourceUrl);
    await mergeIcoSitemapOnlyGaps(byKey, sourceName, sourceUrl);
    if (byKey.size > 0) {
      return Array.from(byKey.values());
    }
  } catch (err) {
    console.warn('News crawler (ICO API):', err.message || err);
  }
  return crawlIcoHtmlPages(sourceName, sourceUrl);
}

async function crawlCouncilOfEuropeRss() {
  const sourceName = 'Council of Europe';
  const sourceUrl = 'https://www.coe.int/en/web/data-protection';
  const merged = [];
  const seen = new Set();
  for (const feedUrl of COE_DP_RSS_URLS) {
    const batch = await fetchRss(feedUrl, sourceName, sourceUrl, {
      Referer: 'https://www.coe.int/en/web/data-protection'
    });
    if (!batch.length) continue;
    for (const it of batch) {
      const k = normalizeNewsUrlKey(it.url);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      merged.push(it);
    }
    if (merged.length) break;
  }
  return merged;
}

async function crawlCouncilOfEuropeHtml() {
  const items = [];
  const pageUrls = [
    'https://www.coe.int/en/web/data-protection',
    'https://www.coe.int/en/web/data-protection/news'
  ];
  const sourceName = 'Council of Europe';
  const sourceUrl = 'https://www.coe.int/en/web/data-protection';
  for (const pageUrl of pageUrls) {
    try {
      const { data } = await axios.get(pageUrl, {
        timeout: CRAWL_TIMEOUT_MS,
        headers: {
          ...BROWSER_HEADERS,
          Referer: 'https://www.coe.int/en/web/data-protection'
        },
        responseType: 'text'
      });
      const $ = cheerio.load(data);
      let n = 0;
      $('a[href*="coe.int"]').each((_, el) => {
        if (n >= MAX_PER_HTML_SOURCE) return false;
        let href = ($(el).attr('href') || '').trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        if (
          !/data-protection|dataprotection|convention-108|convention_108|privacy|108\+|\/news\/|\/en\/web\/data-protection\/|\/cd\//i.test(
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

async function crawlCouncilOfEurope() {
  const [rssItems, htmlItems] = await Promise.all([crawlCouncilOfEuropeRss(), crawlCouncilOfEuropeHtml()]);
  const byKey = new Map();
  for (const item of rssItems) {
    if (!item.title || !item.url) continue;
    const k = normalizeNewsUrlKey(item.url);
    if (!k) continue;
    byKey.set(k, { ...item });
  }
  for (const item of htmlItems) {
    const k = normalizeNewsUrlKey(item.url);
    if (!k || byKey.has(k)) continue;
    byKey.set(k, item);
  }
  return Array.from(byKey.values());
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

/** Prefer canonical / stable article URLs when the same story appears under multiple paths (e.g. EDPS RSS link vs body link). */
function newsUrlPreferenceScore(url) {
  const u = String(url || '').toLowerCase();
  if (!u) return 0;
  if (u.includes('edps.europa.eu')) {
    if (u.includes('/data-protection/our-work/publications/')) return 100;
    if (u.includes('/press-publications/press-news/press-releases/')) return 95;
    if (u.includes('/press-publications/press-news/blog/')) return 88;
    if (u.includes('/press-publications/press-news/news/')) return 70;
    return 50;
  }
  if (u.includes('edpb.europa.eu')) {
    if (u.includes('/documents/') || u.includes('/our-work-tools/')) return 92;
    if (u.includes('/news/news/')) return 78;
    return 50;
  }
  if (u.includes('ico.org.uk') && u.includes('/media-centre/news-and-blogs/')) return 85;
  if (u.includes('ec.europa.eu/commission/presscorner/detail/')) return 80;
  return 50;
}

function pickPreferredNewsUrl(a, b) {
  const ua = String(a || '');
  const ub = String(b || '');
  const sa = newsUrlPreferenceScore(ua);
  const sb = newsUrlPreferenceScore(ub);
  if (sb > sa) return ub;
  if (sa > sb) return ua;
  return ub.length < ua.length ? ub : ua;
}

function pickRicherNewsSnippet(a, b) {
  const sa = String(a || '').trim();
  const sb = String(b || '').trim();
  if (sb.length > sa.length) return sb || null;
  return sa || null;
}

function mergeNewsDuplicate(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    title: (existing.title || '').length >= (incoming.title || '').length ? existing.title : incoming.title,
    url: pickPreferredNewsUrl(existing.url, incoming.url),
    sourceName: existing.sourceName || incoming.sourceName,
    sourceUrl: existing.sourceUrl || incoming.sourceUrl,
    date: existing.date || incoming.date,
    snippet: pickRicherNewsSnippet(existing.snippet, incoming.snippet),
    commissionPolicyAreas: mergeCommissionPolicyAreas(
      existing.commissionPolicyAreas,
      incoming.commissionPolicyAreas
    ),
    ...mergeNewsItemTopicFields(existing, incoming)
  };
}

/**
 * ICO news URLs use `/news-and-blogs/YYYY/MM/…` — treat that as canonical month (and year) when
 * `createdDateTime` or page meta disagrees (fixes wrong month in merged JSON).
 */
function normalizeIcoBlogDate(item) {
  if (!item || typeof item !== 'object') return item;
  const u = String(item.url || '');
  const pathMatch = u.match(
    /ico\.org\.uk\/about-the-ico\/media-centre\/news-and-blogs\/(\d{4})\/(\d{2})\//i
  );
  if (!pathMatch) return item;
  const py = pathMatch[1];
  const pm = pathMatch[2];
  let day = '01';
  const em = item.date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(item.date).trim()) : null;
  if (em && em[1] === py && em[2] === pm && em[3]) {
    day = em[3];
  }
  const next = `${py}-${pm}-${day}`;
  if (String(item.date || '').trim() === next) return item;
  return { ...item, date: next };
}

/** Drop calendar dates more than ~2 days ahead of “now” (bad CMS or parsing). */
function clampImpossibleFutureNewsDate(item) {
  if (!item || !item.date) return item;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(item.date).trim());
  if (!m) return item;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const noonLocal = new Date(y, mo, d, 12, 0, 0, 0).getTime();
  const limit = Date.now() + 2 * 86400000;
  if (noonLocal <= limit) return item;
  return { ...item, date: null };
}

function sanitizeNewsItemDates(item) {
  if (!item || typeof item !== 'object') return item;
  return clampImpossibleFutureNewsDate(normalizeIcoBlogDate({ ...item }));
}

/**
 * Same article often ships twice from EDPS (e.g. /press-publications/press-news/news/… vs
 * /data-protection/our-work/publications/…). URL keys differ; collapse by source + date + title fingerprint.
 */
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
  const src = String(item.sourceName || '').trim();
  const date = String(item.date || '').trim();
  const fp = normalizeNewsTitleFingerprint(item.title);
  if (!src || !fp || fp.length < 10) return '';
  return `${src}\u0001${date || '—'}\u0001${fp}`;
}

/**
 * Dedupe by normalized URL, then by semantic key (source + date + title). Preserves order roughly by
 * re-sorting callers; crawlNews re-sorts by date after this.
 */
function dedupeNewsItemsConsolidated(items) {
  const list = Array.isArray(items) ? items : [];
  const byUrl = new Map();
  for (const item of list) {
    if (!item || !item.title || !item.url) continue;
    const key = normalizeNewsUrlKey(item.url);
    if (!key) continue;
    const prev = byUrl.get(key);
    if (!prev) byUrl.set(key, { ...item });
    else byUrl.set(key, mergeNewsDuplicate(prev, item));
  }
  const afterUrl = Array.from(byUrl.values());
  const bySem = new Map();
  let anon = 0;
  for (const item of afterUrl) {
    const k = newsItemSemanticDedupeKey(item);
    if (!k) {
      bySem.set(`\u0000orphan\u0000${anon++}`, item);
      continue;
    }
    const prev = bySem.get(k);
    if (!prev) bySem.set(k, item);
    else bySem.set(k, mergeNewsDuplicate(prev, item));
  }
  return Array.from(bySem.values());
}

async function crawlNews() {
  const [edpbRssItems, edpbHtmlItems, edpsRssItems, icoItems, commissionItems, coeItems] = await Promise.all([
    crawlEdpbRss(),
    crawlEdpbHtml(),
    crawlEdpsRss(),
    crawlIco(),
    crawlCommissionPress(),
    crawlCouncilOfEurope()
  ]);
  const combined = [
    ...edpbRssItems,
    ...edpbHtmlItems,
    ...edpsRssItems,
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
  let deduped = dedupeNewsItemsConsolidated(Array.from(byKey.values()));
  deduped.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  let base = deduped.filter(newsItemMatchesApprovedTopic).map(sanitizeNewsItemDates).map(assignNewsTopicFields);

  // Enrich by running a bounded set of topical searches (EDPB/EDPS/ICO/Commission support keyword search).
  // This is intentionally conservative: only fill missing topics, capped by env vars, and re-gated by taxonomy anchor.
  try {
    const extra = await enrichMissingTopicsViaSearch(base);
    if (extra && extra.length) {
      extra.forEach((item) => {
        if (!item.title || !item.url) return;
        const key = normalizeNewsUrlKey(item.url);
        if (!key) return;
        const prev = byKey.get(key);
        if (!prev) byKey.set(key, { ...item });
        else byKey.set(key, mergeNewsDuplicate(prev, item));
      });
      const again = dedupeNewsItemsConsolidated(Array.from(byKey.values()));
      again.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      base = again.filter(newsItemMatchesApprovedTopic).map(sanitizeNewsItemDates).map(assignNewsTopicFields);
    }
  } catch (err) {
    console.warn('News crawler (topic enrichment):', err.message || err);
  }

  return base;
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
  crawlEdpsRss,
  crawlIco,
  crawlCommissionPress,
  crawlCouncilOfEurope,
  fetchRss,
  withTimeout,
  normalizeNewsUrlKey,
  dedupeNewsItemsConsolidated,
  newsItemMatchesApprovedTopic,
  commissionPressItemRelevant,
  commissionPressTextRelevant,
  sanitizeNewsItemDates
};
