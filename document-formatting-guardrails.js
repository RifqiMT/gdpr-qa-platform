/**
 * DOCUMENT_FORMATTING_GUARDRAILS.md — server-side enforcement (binding for every regulation refresh).
 *
 * `scraper.js` **must** call `normalizeCorpus` on the merged `articles` / `recitals` immediately before
 * `buildSearchIndex` and every `gdpr-content.json` write (button, POST /api/refresh, daily cron,
 * `npm run refresh`). `server.js` `loadContent()` applies the same normalization on read so the API
 * stays aligned even if the file predates a guardrail change.
 *
 * Does not paraphrase substantive law; whitespace, glue, article-only recital-stripping, and
 * presentation-safe line merges only (see the doc).
 */

'use strict';

/** §3.2 — CRLF and lone CR → LF */
function normalizeLineEndings(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * §4.2 — NBSP / narrow NBSP → ASCII space so comma-separated Article lists match \s in regexes
 * after client escapeHtml (or when corpus is inspected as plain UTF-8).
 */
function normalizeNarrowSpacesToAscii(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ');
}

/**
 * Mirror public/app.js linkRegulationCitationsInEscapedTextSegment glue fixes on plain Unicode
 * (§3.3 — before citation linking runs in the client).
 */
function normalizeEurLexGlue(text) {
  let t = String(text || '');
  t = t.replace(/\b(Articles?)(\d{1,2})\b/gi, '$1 $2');
  t = t.replace(/\b(Recitals?)(\d{1,3})\b/gi, '$1 $2');
  t = t.replace(/\b(Arts?\.)(\d{1,2})\b/gi, '$1 $2');
  t = t.replace(/(\d)(Articles?)\b/gi, '$1 $2');
  t = t.replace(/(\d)(Recitals?)\b/gi, '$1 $2');
  t = t.replace(/(\d)(Arts?\.)/gi, '$1 $2');
  return t;
}

/**
 * Collapse noisy whitespace from mixed ETL (e.g. " \\n \\n \\n 1." from EUR-Lex) so numbered
 * paragraphs align with GDPR-Info-style blocks (double newline between logical blocks).
 */
function collapseWhitespaceNoiseForReader(text) {
  let t = String(text || '');
  t = t.replace(/[ \t]+\n/g, '\n');
  t = t.replace(/\n[ \t]+/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Join lines that are only “(a)” / “(b)” with the following non-empty line (EUR-Lex HTML → plain text).
 * Keeps lettered sub-clauses on one logical line for the reader (matches gdpr-info.eu-style blocks).
 */
function mergeOrphanParenLetterLinesFlat(lines) {
  const arr = Array.isArray(lines) ? lines.map((l) => String(l)) : [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i].trim();
    const m = t.match(/^\(([a-z])\)\s*$/i);
    if (m) {
      let j = i + 1;
      while (j < arr.length && !arr[j].trim()) j++;
      if (j < arr.length) {
        const next = arr[j].trim();
        if (next && !/^\(([a-z])\)\s*$/i.test(next)) {
          out.push(`(${m[1].toLowerCase()}) ${next}`);
          i = j;
          continue;
        }
      }
    }
    out.push(arr[i]);
  }
  return out;
}

function mergeOrphanParenLetterMarkersInText(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  const merged = mergeOrphanParenLetterLinesFlat(lines);
  return merged
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** “(1)” / “(2)” alone on a line (EUR-Lex) + body on the next line — same idea as lettered (a)(b). */
function mergeOrphanDigitParenLinesFlat(lines) {
  const arr = Array.isArray(lines) ? lines.map((l) => String(l)) : [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i].trim();
    const m = t.match(/^\((\d{1,2})\)\s*$/);
    if (m) {
      let j = i + 1;
      while (j < arr.length && !arr[j].trim()) j++;
      if (j < arr.length) {
        const next = arr[j].trim();
        if (next && !/^\((\d{1,2})\)\s*$/.test(next)) {
          out.push(`(${m[1]}) ${next}`);
          i = j;
          continue;
        }
      }
    }
    out.push(arr[i]);
  }
  return out;
}

function mergeOrphanDigitParenMarkersInText(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  const merged = mergeOrphanDigitParenLinesFlat(lines);
  return merged
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Recitals / long EUR-Lex paragraphs: “…purposes. 2In such a case…” — insert a block break before the clause digit.
 * Conservative: only after . ! ? ; and only for 1–2 digit markers before a capital letter (clause starts).
 */
function splitGluedNumericClauseMarkers(text) {
  const t = normalizeLineEndings(String(text || ''));
  return t
    .replace(/([.!?;])\s+(\d{1,2})(?=[A-ZÀ-ŸÄÖÆØ\u2018''])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** EUR-Lex paste often prefixes “CHAPTER II”, standalone “Article 5”, etc. Strip only from the start. */
function stripLeadingStructuralNoiseLines(text) {
  const raw = normalizeLineEndings(String(text || '')).split('\n');
  let i = 0;
  while (i < raw.length) {
    const t = raw[i].trim();
    if (!t) {
      i++;
      continue;
    }
    if (
      /^CHAPTER\s+[IVXLCDM]+$/i.test(t) ||
      /^Section\s+\d+$/i.test(t) ||
      /^Article\s+\d+\s*$/i.test(t)
    ) {
      i++;
      continue;
    }
    break;
  }
  return raw.slice(i).join('\n').trim();
}

/** “… Article 89\n(Recital 1)\n, not considered …” → glue lone “(Recital n)” to previous line. */
function glueOrphanRecitalRefLinesFlat(lines) {
  const arr = Array.isArray(lines) ? lines.map((l) => String(l)) : [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i].trim();
    if (/^\(Recital\s+\d+\)\s*,?\s*$/i.test(t) && out.length > 0) {
      const prev = out.pop();
      out.push((prev.replace(/\s+$/, '') + ' ' + t).trim());
      continue;
    }
    out.push(arr[i]);
  }
  return out;
}

function glueOrphanRecitalRefLinesInText(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  const merged = glueOrphanRecitalRefLinesFlat(lines);
  return merged
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Article bodies only: remove “(Recital N)” / “[Recital N]” (recitals have their own documents). */
function stripParentheticalRecitalsFromArticleText(text) {
  let t = normalizeLineEndings(String(text || ''));
  t = t.replace(/\(\s*Recital\s+\d{1,3}\s*\)/gi, ' ');
  t = t.replace(/\[\s*Recital\s+\d{1,3}\s*\]/gi, ' ');
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n');
  return t.trim();
}

/** After recital-link stripping, “• , the legitimate interests…” → glue to previous line. */
function mergeOrphanCommaContinuationLinesFlat(lines) {
  const arr = Array.isArray(lines) ? lines.map((l) => String(l)) : [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i].trim();
    if (/^[,;:]\s*\S/.test(t) && out.length > 0) {
      while (out.length > 0 && !String(out[out.length - 1]).trim()) {
        out.pop();
      }
      if (out.length === 0) {
        out.push(arr[i]);
        continue;
      }
      const prev = out[out.length - 1].replace(/\s+$/, '');
      out[out.length - 1] = `${prev}${t}`.trim();
      continue;
    }
    out.push(arr[i]);
  }
  return out;
}

function mergeOrphanCommaContinuationInText(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  const merged = mergeOrphanCommaContinuationLinesFlat(lines);
  return merged
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function removeJunkOnlyLinesFromText(text) {
  return normalizeLineEndings(String(text || ''))
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^[.\u2022•·‧]+$/.test(t)) return false;
      if (/^\*+$/.test(t)) return false;
      return true;
    })
    .join('\n');
}

/** Remove back-to-back duplicate lines (e.g. repeated title from mixed ETL). */
function dedupeConsecutiveIdenticalTrimmedLines(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  const out = [];
  let prevNonEmpty = null;
  for (const line of lines) {
    const t = line.trim();
    if (t && prevNonEmpty === t) continue;
    out.push(line);
    if (t) prevNonEmpty = t;
  }
  return out.join('\n');
}

/** First line only: “Title Title” (same phrase twice) from EUR-Lex / merged headings. */
function dedupeAdjacentRepeatedFirstLine(text) {
  const lines = normalizeLineEndings(String(text || '')).split('\n');
  if (lines.length === 0) return String(text || '');
  const s0 = lines[0]
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s0.length < 40) return lines.join('\n');
  const mid = Math.floor(s0.length / 2);
  for (const delta of [0, 1, -1, 2, -2, 3, -3]) {
    const m = mid + delta;
    if (m < 25 || m > s0.length - 25) continue;
    const left = s0.slice(0, m).trimEnd();
    const right = s0.slice(m).trimStart();
    if (left.length >= 20 && left === right) {
      lines[0] = left;
      return lines.join('\n');
    }
  }
  const m2 = s0.match(/^(.{20,}?)\s+\1\s*$/);
  if (m2) lines[0] = m2[1].trim();
  return lines.join('\n');
}

/**
 * Full pipeline for a single provision body or title.
 * @param {{ splitGluedNumericClauses?: boolean }} [options] — when true (recital bodies only), split “. 2In …” clause glue; disabled for articles to avoid breaking “Article 8. 2…”-style references.
 */
function normalizeProvisionText(text, options) {
  const splitNumeric = Boolean(options && options.splitGluedNumericClauses === true);
  let t = normalizeLineEndings(text);
  t = normalizeNarrowSpacesToAscii(t);
  t = normalizeEurLexGlue(t);
  t = collapseWhitespaceNoiseForReader(t);
  t = stripLeadingStructuralNoiseLines(t);
  if (splitNumeric) t = splitGluedNumericClauseMarkers(t);
  t = mergeOrphanParenLetterMarkersInText(t);
  t = mergeOrphanDigitParenMarkersInText(t);
  t = glueOrphanRecitalRefLinesInText(t);
  t = dedupeConsecutiveIdenticalTrimmedLines(t);
  t = dedupeAdjacentRepeatedFirstLine(t);
  t = collapseWhitespaceNoiseForReader(t);
  return t;
}

function normalizeArticle(a) {
  if (!a || typeof a !== 'object') return a;
  const noSplit = { splitGluedNumericClauses: false };
  let text = normalizeProvisionText(a.text || '', noSplit);
  text = stripParentheticalRecitalsFromArticleText(text);
  text = mergeOrphanCommaContinuationInText(text);
  text = removeJunkOnlyLinesFromText(text);
  text = collapseWhitespaceNoiseForReader(text);
  return {
    ...a,
    title: normalizeProvisionText(a.title || '', noSplit),
    text
  };
}

function normalizeRecital(r) {
  if (!r || typeof r !== 'object') return r;
  const noSplit = { splitGluedNumericClauses: false };
  return {
    ...r,
    title: normalizeProvisionText(r.title || '', noSplit),
    text: normalizeProvisionText(r.text || '', { splitGluedNumericClauses: true })
  };
}

/**
 * Apply all DOCUMENT_FORMATTING_GUARDRAILS normalizations to corpus arrays.
 * Returns new arrays (immutable-style).
 */
function normalizeCorpus(recitals, articles) {
  const rec = (Array.isArray(recitals) ? recitals : []).map(normalizeRecital);
  const art = (Array.isArray(articles) ? articles : []).map(normalizeArticle);
  return { recitals: rec, articles: art };
}

/**
 * §8 — Automated checks (warnings only; do not block refresh).
 */
function validateCorpusFormatting(recitals, articles) {
  const warnings = [];
  const checks = [];

  const rCount = Array.isArray(recitals) ? recitals.length : 0;
  const aCount = Array.isArray(articles) ? articles.length : 0;

  checks.push({ id: 'recitals-count', ok: rCount >= 173, detail: `recitals=${rCount}` });
  checks.push({ id: 'articles-count', ok: aCount >= 99, detail: `articles=${aCount}` });
  if (rCount < 173) warnings.push(`Expected 173 recitals; got ${rCount}.`);
  if (aCount < 99) warnings.push(`Expected 99 articles; got ${aCount}.`);

  const byNum = (arr, n) => (Array.isArray(arr) ? arr.find((x) => x && x.number === n) : null);
  const a89 = byNum(articles, 89);
  if (a89 && a89.text) {
    const t = a89.text;
    const hasList =
      /Articles?\s+15/i.test(t) &&
      /21/i.test(t) &&
      (/18/.test(t) || /19/.test(t) || /20/.test(t));
    checks.push({ id: 'art-89-citation-line', ok: hasList, detail: 'Articles 15…21 style line' });
    if (!hasList) {
      warnings.push(
        'Article 89: expected a line referencing Articles 15–21 (citation-link smoke test). Inspect formatting.'
      );
    }
  } else {
    checks.push({ id: 'art-89-present', ok: false, detail: 'missing' });
    warnings.push('Article 89 missing from corpus.');
  }

  const a4 = byNum(articles, 4);
  if (a4 && a4.text) {
    const ok4 = /For the purposes of this Regulation/i.test(a4.text) || /‘[^’]+’/.test(a4.text);
    checks.push({ id: 'art-4-definitions', ok: ok4, detail: 'definitions hook' });
    if (!ok4) warnings.push('Article 4: "For the purposes…" / definition quotes not found — check Art. 4 layout.');
  }

  const a1 = byNum(articles, 1);
  if (a1 && a1.text) {
    const t1 = normalizeLineEndings(a1.text);
    const ok1 =
      /(?:^|\n)[ \t\u00a0\u202f]*1\.\s+\S/m.test(t1) ||
      /This Regulation lays down rules relating to the protection of natural persons/i.test(t1);
    checks.push({ id: 'art-1-open', ok: ok1, detail: 'numbered §1 or GDPR-Info Art. 1 list' });
    if (!ok1) warnings.push('Article 1: expected "1. …" or GDPR-Info opening clause — verify extraction.');
  }

  const a5 = byNum(articles, 5);
  if (a5 && a5.text) {
    const t5 = normalizeLineEndings(a5.text);
    const ok5 =
      /Personal data shall be:/i.test(t5) &&
      /processed lawfully, fairly and in a transparent manner/i.test(t5) &&
      /The controller shall be responsible/i.test(t5);
    checks.push({ id: 'art-5-principles', ok: ok5, detail: 'GDPR-Info-style principles block' });
    if (!ok5) {
      warnings.push(
        'Article 5: expected "Personal data shall be", first principle, and accountability — check GDPR-Info list extraction.'
      );
    }
  }

  const r50 = byNum(recitals, 50);
  if (r50 && r50.text) {
    const t50 = normalizeLineEndings(r50.text);
    const clauses = t50.split(/\n\s*\n/).filter((x) => x.trim());
    const ok50 =
      clauses.length >= 6 &&
      /\b1[A-Za-zÀ-Ÿ]/.test(t50.replace(/\s+/g, ' ')) &&
      /compatible lawful processing/i.test(t50);
    checks.push({ id: 'recital-50-clauses', ok: ok50, detail: `~${clauses.length} blocks, substance` });
    if (!ok50) {
      warnings.push(
        'Recital 50: expected multiple clause blocks and “compatible lawful processing” — check <sup> splitting / refresh from GDPR-Info.'
      );
    }
  }

  const ok = warnings.length === 0;
  return { ok, checks, warnings };
}

function logFormattingGuardrailsReport(recitals, articles) {
  const report = validateCorpusFormatting(recitals, articles);
  const label = '[document-formatting-guardrails]';
  console.log(`${label} normalization applied to corpus before search index.`);
  for (const c of report.checks) {
    const status = c.ok ? 'OK' : 'CHECK';
    console.log(`${label} ${status} ${c.id}: ${c.detail || ''}`);
  }
  for (const w of report.warnings) {
    console.warn(`${label} ${w}`);
  }
  return report;
}

module.exports = {
  normalizeLineEndings,
  normalizeNarrowSpacesToAscii,
  normalizeEurLexGlue,
  collapseWhitespaceNoiseForReader,
  stripLeadingStructuralNoiseLines,
  mergeOrphanParenLetterLinesFlat,
  mergeOrphanParenLetterMarkersInText,
  glueOrphanRecitalRefLinesFlat,
  glueOrphanRecitalRefLinesInText,
  stripParentheticalRecitalsFromArticleText,
  mergeOrphanCommaContinuationLinesFlat,
  mergeOrphanCommaContinuationInText,
  removeJunkOnlyLinesFromText,
  mergeOrphanDigitParenLinesFlat,
  mergeOrphanDigitParenMarkersInText,
  splitGluedNumericClauseMarkers,
  dedupeConsecutiveIdenticalTrimmedLines,
  dedupeAdjacentRepeatedFirstLine,
  normalizeProvisionText,
  normalizeArticle,
  normalizeRecital,
  normalizeCorpus,
  validateCorpusFormatting,
  logFormattingGuardrailsReport
};
