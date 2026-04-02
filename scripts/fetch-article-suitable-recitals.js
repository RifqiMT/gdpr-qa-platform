/**
 * Maintenance: fetches GDPR-Info article pages and extracts
 * "Suitable Recitals" into data/article-suitable-recitals.json
 *
 * Usage: node scripts/fetch-article-suitable-recitals.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'data', 'article-suitable-recitals.json');
const OUT_PUBLIC = path.join(__dirname, '..', 'public', 'article-suitable-recitals.json');
const BASE = 'https://gdpr-info.eu';
const DELAY_MS = 350;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': 'gdpr-qa-platform-maint/1.0 (+local data refresh)' }
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          res.resume();
          if (!loc) return reject(new Error('Redirect without location'));
          const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
          return resolve(fetchText(next));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error('HTTP ' + res.statusCode));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

/** Extract recital numbers from GDPR-Info "Suitable Recitals" block (link hrefs). */
function parseSuitableRecitalNumbers(html) {
  const lower = html.toLowerCase();
  const marker = 'suitable recitals';
  const i = lower.indexOf(marker);
  if (i === -1) return [];
  const after = html.slice(i, i + 14000);
  const h2 = after.search(/<h2\b/i);
  const chunk = h2 > 100 ? after.slice(0, h2) : after;
  const nums = new Set();
  const re = /recitals\/no-(\d+)\b/gi;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 173) nums.add(n);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

async function main() {
  const map = {};
  const errors = [];
  for (let n = 1; n <= 99; n++) {
    const url = `${BASE}/art-${n}-gdpr/`;
    try {
      const html = await fetchText(url);
      map[String(n)] = parseSuitableRecitalNumbers(html);
      process.stdout.write(n % 10 === 0 ? `.${n}` : '.');
    } catch (e) {
      errors.push({ article: n, error: String(e.message || e) });
      map[String(n)] = [];
    }
    await sleep(DELAY_MS);
  }
  console.log('\n');
  const payload = {
    source: 'https://gdpr-info.eu/',
    fetchedAt: new Date().toISOString(),
    licenseNote:
      'Editorial "Suitable Recitals" blocks as shown on GDPR-Info. For authoritative law, use EUR-Lex.',
    articles: map,
    errors
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const outText = JSON.stringify(payload, null, 2) + '\n';
  fs.writeFileSync(OUT, outText, 'utf-8');
  fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true });
  fs.writeFileSync(OUT_PUBLIC, outText, 'utf-8');
  console.log(
    'Wrote',
    OUT,
    'non-empty:',
    Object.values(map).filter((a) => a.length).length,
    'errors:',
    errors.length
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
