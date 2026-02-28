/**
 * Crawl GDPR/data protection news from credible sources.
 * Uses RSS feeds (EDPB) and HTML scraping. Returns items with title, url, sourceName, sourceUrl, date, snippet.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const CRAWL_TIMEOUT_MS = 25000;

// Credible source RSS and HTML URLs for GDPR-related news
const EDPB_RSS = 'https://edpb.europa.eu/feed/publications_en';
const EDPB_NEWS_PAGE = 'https://edpb.europa.eu/news_en';
const ICO_NEWS_PAGE = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/';

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
      const title = ($el.find('title').text() || '').trim();
      let link = ($el.find('link').text() || '').trim();
      if (!link && $el.find('link').length) link = $el.find('link').first().attr('href') || '';
      const pubDate = $el.find('pubDate').text() || $el.find('dc\\:date').text() || $el.find('updated').text();
      if (!title || !link) return;
      let date = null;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      const snippet = ($el.find('description').text() || '').trim().replace(/<[^>]+>/g, '').slice(0, 200);
      items.push({ title, url: link, sourceName, sourceUrl, date, snippet: snippet || null });
    });
    $('entry').each((_, el) => {
      const $el = $(el);
      const title = ($el.find('title').text() || '').trim();
      let link = $el.find('link').attr('href') || $el.find('link').text() || '';
      const updated = $el.find('updated').text() || $el.find('published').text();
      if (!title || !link) return;
      let date = null;
      if (updated) {
        const d = new Date(updated);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      items.push({ title, url: link.trim(), sourceName, sourceUrl, date, snippet: null });
    });
  } catch (err) {
    console.warn('News RSS (' + url + '):', err.message || err);
  }
  return items;
}

async function crawlEdpbRss() {
  return fetchRss(
    EDPB_RSS,
    'European Data Protection Board (EDPB)',
    'https://edpb.europa.eu/'
  );
}

async function crawlEdpbHtml() {
  const items = [];
  try {
    const { data } = await axios.get(EDPB_NEWS_PAGE, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { 'User-Agent': 'GDPR-QA-Platform/1.0 (News)' },
      responseType: 'text'
    });
    const $ = cheerio.load(data);
    const sourceName = 'European Data Protection Board (EDPB)';
    const sourceUrl = 'https://edpb.europa.eu/';
    $('h4 a[href*="/news/news/"]').each((_, el) => {
      const $a = $(el);
      let href = $a.attr('href') || '';
      if (href.startsWith('/')) href = 'https://edpb.europa.eu' + href;
      const title = ($a.text() || '').trim();
      if (!href || !title || title.length < 10) return;
      const $block = $a.closest('div[class]');
      let date = null;
      const blockText = $block.length ? $block.text() : $a.parent().nextAll().slice(0, 3).text();
      const dateMatch = blockText.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
      if (dateMatch) {
        const d = new Date(dateMatch[2] + ' ' + dateMatch[1] + ', ' + dateMatch[3]);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      items.push({ title, url: href, sourceName, sourceUrl, date, snippet: null });
    });
  } catch (err) {
    console.warn('News crawler (EDPB HTML):', err.message || err);
  }
  return items;
}

async function crawlIco() {
  const items = [];
  try {
    const { data } = await axios.get(ICO_NEWS_PAGE, {
      timeout: CRAWL_TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GDPR-QA-Platform/1.0)' },
      responseType: 'text'
    });
    const $ = cheerio.load(data);
    const sourceName = 'ICO (UK)';
    const sourceUrl = 'https://ico.org.uk/';
    $('a[href*="/media-centre/news-and-blogs/"]').each((_, el) => {
      const $a = $(el);
      let href = $a.attr('href') || '';
      if (href.startsWith('/')) href = 'https://ico.org.uk' + href;
      const title = ($a.text() || '').trim();
      if (!href || !title || title.length < 15) return;
      if (title.length > 200) return;
      if (href === 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/') return;
      const $row = $a.closest('article, li, .views-row, [class*="view"]');
      const dateEl = $row.find('time').first();
      let date = null;
      if (dateEl.length) {
        const d = new Date(dateEl.attr('datetime') || dateEl.text());
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
      items.push({ title, url: href, sourceName, sourceUrl, date, snippet: null });
    });
  } catch (err) {
    console.warn('News crawler (ICO):', err.message || err);
  }
  return items;
}

async function crawlNews() {
  const [edpbRssItems, edpbHtmlItems, icoItems] = await Promise.all([
    crawlEdpbRss(),
    crawlEdpbHtml(),
    crawlIco()
  ]);
  const combined = [...edpbRssItems, ...edpbHtmlItems, ...icoItems];
  const seen = new Set();
  const deduped = combined.filter((item) => {
    const key = (item.url || '').toLowerCase().replace(/\/$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return !!item.title && !!item.url;
  });
  deduped.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return deduped.slice(0, 60);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

module.exports = { crawlNews, crawlEdpbRss, crawlEdpbHtml, crawlIco, fetchRss, withTimeout };
