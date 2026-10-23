/**
 * Merge official ISO / AICPA catalogue notices into data/gdpr-news.json
 * so News has International items without a live crawl.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { assignNewsTopicFields } = require('../news-topics');
const { internationalCatalogueNewsSeed, newsItemMatchesApprovedTopic } = require('../news-crawler');

const NEWS_FILE = path.join(__dirname, '..', 'data', 'gdpr-news.json');

const FEEDS = [
  {
    name: 'ISO',
    url: 'https://www.iso.org/news.html',
    description: 'International Organization for Standardization — news and insights (ISO/IEC 27701, 19941, 23894)'
  },
  {
    name: 'ISO Insights',
    url: 'https://www.iso.org/insights/standards-world',
    description: 'ISO Standards world — featured International Standards including privacy and AI'
  },
  {
    name: 'AICPA',
    url: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations',
    description: 'AICPA & CIMA — SOC for Service Organizations and Trust Services Criteria'
  }
];

function main() {
  const raw = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  const feeds = Array.isArray(raw.newsFeeds) ? raw.newsFeeds.slice() : [];
  const feedUrls = new Set(feeds.map((f) => f && f.url).filter(Boolean));
  for (const d of FEEDS) {
    if (d.url && !feedUrls.has(d.url)) {
      feeds.push({ ...d });
      feedUrls.add(d.url);
    }
  }
  const items = Array.isArray(raw.items) ? raw.items.slice() : [];
  const urls = new Set(items.map((i) => String(i.url || '')));
  let added = 0;
  for (const seed of internationalCatalogueNewsSeed()) {
    if (!seed.url || urls.has(seed.url)) continue;
    if (!newsItemMatchesApprovedTopic(seed)) {
      console.warn('seed skipped (off-scope):', seed.title);
      continue;
    }
    items.push(assignNewsTopicFields({ ...seed }));
    urls.add(seed.url);
    added += 1;
  }
  raw.newsFeeds = feeds;
  raw.items = items;
  fs.writeFileSync(NEWS_FILE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`seed-iso-soc-news: added ${added} items; feeds=${feeds.length}; items=${items.length}`);
}

main();
