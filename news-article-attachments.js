/**
 * Fetch a news article page (allowlisted hosts only) and extract downloadable file links.
 * Used by GET /api/news/article-attachments — mitigates SSRF by host rules and same-registrable checks.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

/** Match crawler-style browser UA — some EU sites redirect “bot” clients away from article HTML. */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Cache-Control': 'no-cache'
};

/** Article URLs we ever crawl in news — fetch target must match this set (SSRF guard). */
function articleHostAllowed(hostname) {
  const h = String(hostname || '')
    .toLowerCase()
    .replace(/\.$/, '');
  if (!h) return false;
  if (h === 'edpb.europa.eu') return true;
  if (h === 'edps.europa.eu') return true;
  if (h === 'ec.europa.eu') return true;
  if (h === 'commission.europa.eu') return true;
  if (h === 'ico.org.uk') return true;
  if (h === 'coe.int') return true;
  if (h.endsWith('.ico.org.uk')) return true;
  if (h.endsWith('.coe.int')) return true;
  if (h.endsWith('.edpb.europa.eu')) return true;
  if (h.endsWith('.edps.europa.eu')) return true;
  return false;
}

function isEuropaHost(h) {
  return /\.europa\.eu$/i.test(h);
}

/**
 * Attachment targets: same hostname as article, or both under .europa.eu / .ico.org.uk / .coe.int.
 */
function isAttachmentUrlSafe(articleUrl, attachmentUrl) {
  let base;
  let target;
  try {
    base = new URL(articleUrl);
    target = new URL(attachmentUrl, articleUrl);
  } catch {
    return false;
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return false;
  const bh = base.hostname.toLowerCase();
  const th = target.hostname.toLowerCase();
  if (th === bh) return true;
  if (isEuropaHost(bh) && isEuropaHost(th)) return true;
  if (/\.ico\.org\.uk$/i.test(bh) && /\.ico\.org\.uk$/i.test(th)) return true;
  if (/\.coe\.int$/i.test(bh) && /\.coe\.int$/i.test(th)) return true;
  return false;
}

const EXT_IN_PATH = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|odt|ods|odp|rtf|txt)(\?|#|$)/i;

function looksLikeDownloadable(absoluteUrl, linkText, mimeHint) {
  const u = String(absoluteUrl || '').toLowerCase();
  const t = String(linkText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const mime = String(mimeHint || '').toLowerCase();
  if (/^javascript:|^mailto:|^tel:/i.test(u)) return false;
  if (EXT_IN_PATH.test(u)) return true;
  if (/[?&]format=pdf\b|[?&]download=1\b|opendocument\.|\/application\/pdf/i.test(u)) return true;
  if (/\/sites\/default\/files\/[^?]+\.(pdf|docx?|xlsx?|pptx?|zip)/i.test(u)) return true;
  if (/\/system\/files\/[^?]+\.(pdf|docx?|xlsx?|pptx?|zip|csv)/i.test(u)) return true;
  if (mime.includes('pdf') || mime.includes('msword') || mime.includes('wordprocessing') || mime.includes('spreadsheet')) {
    return true;
  }
  if (/\b(annex|appendix|download)\b/.test(t) && /\.(pdf|docx?)\b/i.test(u)) return true;
  return false;
}

function fileNameFromUrl(u) {
  try {
    const p = new URL(u).pathname.split('/').filter(Boolean);
    return decodeURIComponent(p[p.length - 1] || 'document').slice(0, 180);
  } catch {
    return 'document';
  }
}

function guessKind(url) {
  const u = url.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(u) || /format=pdf|application\/pdf/.test(u)) return 'pdf';
  if (/\.docx(\?|#|$)/.test(u)) return 'docx';
  if (/\.doc(\?|#|$)/.test(u)) return 'doc';
  if (/\.xlsx(\?|#|$)/.test(u)) return 'xlsx';
  if (/\.xls(\?|#|$)/.test(u)) return 'xls';
  if (/\.pptx(\?|#|$)/.test(u)) return 'pptx';
  if (/\.ppt(\?|#|$)/.test(u)) return 'ppt';
  if (/\.zip(\?|#|$)/.test(u)) return 'zip';
  if (/\.csv(\?|#|$)/.test(u)) return 'csv';
  return 'file';
}

/**
 * @param {string} pageUrl
 * @param {{ timeout?: number }} [opts]
 * @returns {Promise<{ url: string, attachments: { url: string, label: string, kind: string }[] }>}
 */
async function fetchNewsArticleAttachments(pageUrl, opts) {
  const timeout = opts && opts.timeout != null ? opts.timeout : DEFAULT_TIMEOUT_MS;
  let u;
  try {
    u = new URL(String(pageUrl).trim());
  } catch (err) {
    const e = new Error('Invalid URL');
    e.code = 'BAD_URL';
    throw e;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    const e = new Error('Invalid URL scheme');
    e.code = 'BAD_URL';
    throw e;
  }
  if (!articleHostAllowed(u.hostname)) {
    const e = new Error('URL host not allowed');
    e.code = 'NOT_ALLOWED';
    throw e;
  }

  let data;
  let status;
  try {
    const res = await axios.get(u.href, {
      timeout,
      headers: BROWSER_HEADERS,
      responseType: 'text',
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      validateStatus: (s) => s >= 200 && s < 400
    });
    data = res.data;
    status = res.status;
  } catch (err) {
    const e = new Error(err.response ? `HTTP ${err.response.status}` : 'Failed to load article page');
    e.code = 'FETCH_FAILED';
    throw e;
  }

  if (status >= 400 || typeof data !== 'string') {
    const e = new Error('Failed to load article page');
    e.code = 'FETCH_FAILED';
    throw e;
  }

  const $ = cheerio.load(data);
  const seen = new Set();
  const attachments = [];

  function push(href, label, mimeHint) {
    if (!href || typeof href !== 'string') return;
    const trimmed = href.trim();
    if (!trimmed || /^javascript:|^mailto:|^#/i.test(trimmed)) return;
    let abs;
    try {
      abs = new URL(trimmed, u.href).href;
    } catch {
      return;
    }
    if (!isAttachmentUrlSafe(u.href, abs)) return;
    if (!looksLikeDownloadable(abs, label, mimeHint)) return;
    const key = abs.replace(/#.*$/, '');
    if (seen.has(key)) return;
    seen.add(key);
    const lab = String(label || '')
      .replace(/\s+/g, ' ')
      .trim();
    attachments.push({
      url: abs,
      label: lab && lab.length < 400 ? lab : fileNameFromUrl(abs),
      kind: guessKind(abs)
    });
  }

  $('a[href]').each((_, el) => {
    const $el = $(el);
    push($el.attr('href'), $el.text(), $el.attr('type'));
  });

  $('link[rel="alternate"][href]').each((_, el) => {
    const $el = $(el);
    push($el.attr('href'), $el.attr('title') || $el.attr('hreflang'), $el.attr('type'));
  });

  return { url: u.href, attachments };
}

module.exports = {
  fetchNewsArticleAttachments,
  articleHostAllowed,
  isAttachmentUrlSafe,
  looksLikeDownloadable
};
