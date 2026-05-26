/**
 * Data directory resolution for local Node vs Vercel serverless.
 * On Vercel, the deployment bundle is read-only; writable copies live under /tmp.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLED_DATA_DIR = path.join(ROOT, 'data');

const IS_VERCEL = Boolean(process.env.VERCEL);

const SEED_FILES = [
  'gdpr-content.json',
  'gdpr-structure.json',
  'ai-act-content.json',
  'ai-act-structure.json',
  'gdpr-news.json',
  'chapter-summaries.json',
  'chapter-summaries-ai-act.json',
  'article-suitable-recitals.json'
];

function seedBundledDataTo(targetDir) {
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const name of SEED_FILES) {
      const src = path.join(BUNDLED_DATA_DIR, name);
      const dst = path.join(targetDir, name);
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
  } catch (e) {
    console.warn('seedBundledDataTo:', e && e.message ? e.message : e);
  }
}

/**
 * Active data directory: bundled `data/` locally; `/tmp/gdpr-qa-data` on Vercel (seeded once per instance).
 * Override with GDPR_DATA_DIR for custom deployments.
 */
function getDataDir() {
  if (process.env.GDPR_DATA_DIR) {
    return path.resolve(process.env.GDPR_DATA_DIR);
  }
  if (IS_VERCEL) {
    const tmpDir = path.join('/tmp', 'gdpr-qa-data');
    seedBundledDataTo(tmpDir);
    return tmpDir;
  }
  return BUNDLED_DATA_DIR;
}

module.exports = {
  ROOT,
  IS_VERCEL,
  BUNDLED_DATA_DIR,
  getDataDir,
  seedBundledDataTo
};
