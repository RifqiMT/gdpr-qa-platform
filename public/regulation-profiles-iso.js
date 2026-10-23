/**
 * International analogue UI profiles — ISO/IEC 27701:2025 (GDPR analogue PIMS),
 * ISO/IEC 19941:2017 (Data Act cloud portability analogue), ISO/IEC 23894:2023
 * (AI Act risk-management analogue; related ISO/IEC 42001 noted only), and
 * AICPA SOC 2 / Trust Services Criteria (attestation, not a law).
 * These are voluntary standards / attestation criteria, not statutes.
 */
(function (global) {
  var P = global.REGULATION_PROFILES || {};

  P['iso-27701'] = {
    id: 'iso-27701',
    shortName: 'ISO 27701',
    legalLabel: 'ISO/IEC 27701',
    fullName: 'ISO/IEC 27701:2025 Privacy information management systems — Requirements and guidance',
    maxArticles: 14,
    maxRecitals: 5,
    segmentMeta: { recitals: 'Purpose notes 1–5', articles: 'Clauses 1–14' },
    infoBaseUrl: 'https://www.iso.org/standard/27701',
    infoSiteName: 'ISO.org catalogue',
    eurLexUrl: 'https://www.iso.org/standard/27701',
    eurLexTxtUrl: 'https://www.iso.org/standard/27701.html',
    eurLexLabel: 'ISO/IEC 27701:2025 (ISO.org)',
    officialSiteName: 'ISO',
    recitalsIndexUrl: 'https://www.iso.org/standard/27701',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'intl',
    jurisdictionLabel: 'International',
    articleUrl: function () {
      return 'https://www.iso.org/standard/27701';
    },
    recitalUrl: function () {
      return 'https://www.iso.org/standard/27701';
    },
    articleHeading: function (n) {
      return 'ISO 27701 clause ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('ISO 27701 clause ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about ISO/IEC 27701',
      leadHtml:
        'Get answers grounded in the public ISO.org catalogue for <strong>ISO/IEC 27701:2025</strong> (standalone Privacy Information Management System) — the closest international analogue to the EU GDPR. This is a <strong>voluntary standard</strong>, not a law, and not a substitute for Regulation (EU) 2016/679. Full clause text is sold by ISO; this corpus is an educational overlay.',
      placeholder: 'e.g. What is a PIMS? PII controller vs processor? Standalone vs ISO/IEC 27001? GDPR analogue?',
      queryAriaLabel: 'Ask an ISO/IEC 27701 question',
      signalCorpus: 'Local ISO/IEC 27701 educational corpus & ISO.org catalogue alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced PIMS answers, or narrow by <strong>industry sector</strong> for how a privacy information management system maps to that line of business.',
      metaHtml:
        'Educational overlay from your cache; use <strong>Refresh sources</strong> to re-check the <a href="https://www.iso.org/standard/27701" target="_blank" rel="noopener">ISO.org catalogue</a>. Purchase the standard from ISO for normative requirements.',
      relevantTitle: 'Relevant ISO/IEC 27701 clauses',
      relevantHint:
        'Clause map and purpose notes cited for this answer. Open any item in <strong>Browse ISO 27701</strong>. Buy ISO/IEC 27701:2025 for the full text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced ISO/IEC 27701 Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'ISO 27701: credible sources & documents',
      intro:
        'Official ISO.org catalogue pages for ISO/IEC 27701:2025 and JTC 1/SC 27. Every link opens in a new tab. The paid standard is not reproduced here.'
    },
    newsUi: {
      theme: 'iso-27701',
      eyebrow: 'International privacy management',
      title: 'ISO/IEC 27701–relevant news',
      intro:
        'Headlines ranked for ISO/IEC 27701, privacy information management systems, and ISO/IEC JTC 1/SC 27 — from ISO.org.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing ISO/IEC 27701–related items',
      scopeText:
        'This list is narrowed to ISO privacy / PIMS headlines from official ISO.org (and related ISO committee) pages. If empty, tap Refresh news. EU, Indonesian, and U.S. feeds stay on their instruments.',
      switchToRegulationId: 'iso-19941',
      switchToLabel: 'View ISO 19941 news',
      tags: ['ISO/IEC 27701', 'PIMS', 'PII', 'SC 27', 'ISO 27001'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the ISO 27701 relevance filter.',
      viewModeLabel: 'ISO 27701 filter'
    },
    citationsUi: {
      asideAriaLabel: 'ISO/IEC 27701: official links and cross-references',
      officialLeadHtml:
        'Authoritative catalogue sources for <strong>ISO/IEC 27701:2025</strong> (educational overlay — not the paid standard).',
      relatedArticlesTitle: 'Related ISO 27701 clauses',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other clause-map items cited in this purpose note (<a href="https://www.iso.org/standard/27701" target="_blank" rel="noopener">ISO.org</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this clause.',
      relatedArticlesToggleLabel: 'Show or hide related ISO 27701 clauses',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'iso-27701',
      eyebrow: 'International PIMS standard (voluntary)',
      title: 'ISO 27701',
      subtitle: 'ISO/IEC 27701:2025',
      description:
        'The closest international analogue to the EU GDPR: a standalone Privacy Information Management System (PIMS) for PII controllers and processors, published 14 October 2025 (64 pages, JTC 1/SC 27). Voluntary — not a law, and not a substitute for GDPR. Full text is sold by ISO; this app uses the public catalogue plus an educational clause map.',
      highlights: ['Standalone PIMS', 'PII controller / processor', 'ISO 27001 compatible', 'Not a law'],
      mark: 'PIMS'
    }
  };

  P['iso-19941'] = {
    id: 'iso-19941',
    shortName: 'ISO 19941',
    legalLabel: 'ISO/IEC 19941',
    fullName: 'ISO/IEC 19941:2017 Information technology — Cloud computing — Interoperability and portability',
    maxArticles: 11,
    maxRecitals: 4,
    segmentMeta: { recitals: 'Purpose notes 1–4', articles: 'Clauses 1–11' },
    infoBaseUrl: 'https://www.iso.org/standard/66639.html',
    infoSiteName: 'ISO.org catalogue',
    eurLexUrl: 'https://www.iso.org/standard/66639.html',
    eurLexTxtUrl: 'https://www.iso.org/standard/66639.html',
    eurLexLabel: 'ISO/IEC 19941:2017 (ISO.org)',
    officialSiteName: 'ISO',
    recitalsIndexUrl: 'https://www.iso.org/standard/66639.html',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'intl',
    jurisdictionLabel: 'International',
    articleUrl: function () {
      return 'https://www.iso.org/standard/66639.html';
    },
    recitalUrl: function () {
      return 'https://www.iso.org/standard/66639.html';
    },
    articleHeading: function (n) {
      return 'ISO 19941 clause ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('ISO 19941 clause ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about ISO/IEC 19941',
      leadHtml:
        'Get answers grounded in the public ISO.org catalogue for <strong>ISO/IEC 19941:2017</strong> (cloud interoperability and portability) — the closest international analogue to the EU Data Act’s cloud-switching themes. This is a <strong>voluntary standard</strong>, confirmed 2023, planned to be replaced by ISO/IEC 19941-1 (around November 2026). It is not Regulation (EU) 2023/2854.',
      placeholder:
        'e.g. CSC vs CSP vs CSN? Interoperability vs portability types? Cloud lock-in? 19941-1 replacement?',
      queryAriaLabel: 'Ask an ISO/IEC 19941 question',
      signalCorpus: 'Local ISO/IEC 19941 educational corpus & ISO.org catalogue alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced cloud portability answers, or narrow by <strong>industry sector</strong> for how interoperability types map to that line of business.',
      metaHtml:
        'Educational overlay from your cache; use <strong>Refresh sources</strong> to re-check the <a href="https://www.iso.org/standard/66639.html" target="_blank" rel="noopener">ISO.org catalogue</a>.',
      relevantTitle: 'Relevant ISO/IEC 19941 clauses',
      relevantHint:
        'Clause map and purpose notes cited for this answer. Open any item in <strong>Browse ISO 19941</strong>. Buy the standard from ISO for the full type catalogue.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced ISO/IEC 19941 Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'ISO 19941: credible sources & documents',
      intro:
        'Official ISO.org catalogue pages for ISO/IEC 19941:2017, the forthcoming 19941-1 replacement, and related ISO/IEC 17788 / 17789. Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'iso-19941',
      eyebrow: 'International cloud interoperability',
      title: 'ISO/IEC 19941–relevant news',
      intro:
        'Headlines ranked for ISO/IEC 19941, cloud interoperability and portability, and the forthcoming ISO/IEC 19941-1 — from ISO.org.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing ISO/IEC 19941–related items',
      scopeText:
        'This list is narrowed to ISO cloud interoperability / portability headlines from official ISO.org pages. If empty, tap Refresh news.',
      switchToRegulationId: 'iso-23894',
      switchToLabel: 'View ISO 23894 news',
      tags: ['ISO/IEC 19941', 'Cloud portability', 'Interoperability', 'CSC / CSP', '19941-1'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the ISO 19941 relevance filter.',
      viewModeLabel: 'ISO 19941 filter'
    },
    citationsUi: {
      asideAriaLabel: 'ISO/IEC 19941: official links and cross-references',
      officialLeadHtml: 'Authoritative catalogue sources for <strong>ISO/IEC 19941:2017</strong>.',
      relatedArticlesTitle: 'Related ISO 19941 clauses',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other clause-map items cited in this purpose note (<a href="https://www.iso.org/standard/66639.html" target="_blank" rel="noopener">ISO.org</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this clause.',
      relatedArticlesToggleLabel: 'Show or hide related ISO 19941 clauses',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'iso-19941',
      eyebrow: 'International cloud interoperability standard (voluntary)',
      title: 'ISO 19941',
      subtitle: 'ISO/IEC 19941:2017',
      description:
        'The closest international analogue to the EU Data Act’s cloud-switching themes: types of cloud interoperability and portability, and common terminology for cloud service customers, providers, and partners. Confirmed 2023; ISO.org expects replacement by ISO/IEC 19941-1 around November 2026. Voluntary — not the Data Act.',
      highlights: ['Interoperability types', 'Portability types', 'CSC / CSP / CSN', 'Not a law'],
      mark: 'CLOUD'
    }
  };

  P['iso-23894'] = {
    id: 'iso-23894',
    shortName: 'ISO 23894',
    legalLabel: 'ISO/IEC 23894',
    fullName: 'ISO/IEC 23894:2023 Information technology — Artificial intelligence — Guidance on risk management',
    maxArticles: 12,
    maxRecitals: 5,
    segmentMeta: { recitals: 'Purpose notes 1–5', articles: 'Clauses 1–12' },
    infoBaseUrl: 'https://www.iso.org/standard/77304.html',
    infoSiteName: 'ISO.org catalogue',
    eurLexUrl: 'https://www.iso.org/standard/77304.html',
    eurLexTxtUrl: 'https://www.iso.org/standard/77304.html',
    eurLexLabel: 'ISO/IEC 23894:2023 (ISO.org)',
    officialSiteName: 'ISO',
    recitalsIndexUrl: 'https://www.iso.org/standard/77304.html',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'intl',
    jurisdictionLabel: 'International',
    articleUrl: function () {
      return 'https://www.iso.org/standard/77304.html';
    },
    recitalUrl: function () {
      return 'https://www.iso.org/standard/77304.html';
    },
    articleHeading: function (n) {
      return 'ISO 23894 clause ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('ISO 23894 clause ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about ISO/IEC 23894',
      leadHtml:
        'Get answers grounded in the public ISO.org catalogue for <strong>ISO/IEC 23894:2023</strong> (AI risk-management guidance, an ISO 31000 overlay) — the closest international analogue to the EU AI Act. This is <strong>guidance, not a law</strong>, and not the certifiable AI management system <a href="https://www.iso.org/standard/81230.html" target="_blank" rel="noopener">ISO/IEC 42001</a>. It is not Regulation (EU) 2024/1689.',
      placeholder:
        'e.g. How does 23894 relate to ISO 31000? Human oversight? Related ISO 42001? Not the EU AI Act?',
      queryAriaLabel: 'Ask an ISO/IEC 23894 question',
      signalCorpus: 'Local ISO/IEC 23894 educational corpus & ISO.org catalogue alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced AI risk-management answers, or narrow by <strong>industry sector</strong> for how AI risk guidance maps to that line of business.',
      metaHtml:
        'Educational overlay from your cache; use <strong>Refresh sources</strong> to re-check the <a href="https://www.iso.org/standard/77304.html" target="_blank" rel="noopener">ISO.org catalogue</a>.',
      relevantTitle: 'Relevant ISO/IEC 23894 clauses',
      relevantHint:
        'Clause map and purpose notes cited for this answer. Open any item in <strong>Browse ISO 23894</strong>. Buy the standard from ISO for the full guidance.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced ISO/IEC 23894 Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'ISO 23894: credible sources & documents',
      intro:
        'Official ISO.org catalogue pages for ISO/IEC 23894:2023, related ISO 31000, related ISO/IEC 42001, and JTC 1/SC 42. Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'iso-23894',
      eyebrow: 'International AI risk management',
      title: 'ISO/IEC 23894–relevant news',
      intro:
        'Headlines ranked for ISO/IEC 23894, AI risk management, ISO 31000 overlays, and related ISO/IEC 42001 — from ISO.org.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing ISO/IEC 23894–related items',
      scopeText:
        'This list is narrowed to ISO AI risk-management headlines from official ISO.org pages (SC 42). If empty, tap Refresh news.',
      switchToRegulationId: 'soc2',
      switchToLabel: 'View SOC 2 news',
      tags: ['ISO/IEC 23894', 'AI risk', 'ISO 31000', 'ISO 42001', 'SC 42'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the ISO 23894 relevance filter.',
      viewModeLabel: 'ISO 23894 filter'
    },
    citationsUi: {
      asideAriaLabel: 'ISO/IEC 23894: official links and cross-references',
      officialLeadHtml: 'Authoritative catalogue sources for <strong>ISO/IEC 23894:2023</strong>.',
      relatedArticlesTitle: 'Related ISO 23894 clauses',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other clause-map items cited in this purpose note (<a href="https://www.iso.org/standard/77304.html" target="_blank" rel="noopener">ISO.org</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this clause.',
      relatedArticlesToggleLabel: 'Show or hide related ISO 23894 clauses',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'iso-23894',
      eyebrow: 'International AI risk-management guidance (voluntary)',
      title: 'ISO 23894',
      subtitle: 'ISO/IEC 23894:2023',
      description:
        'The closest international analogue to the EU AI Act: guidance on managing AI-related risk, using ISO 31000 as the foundation (JTC 1/SC 42, 26 pages, February 2023). Related certifiable AIMS: ISO/IEC 42001 (not shipped as a fifth instrument). Voluntary guidance — not Union law.',
      highlights: ['ISO 31000 overlay', 'AI life-cycle risk', 'Related ISO 42001', 'Not a law'],
      mark: 'AI'
    }
  };

  P.soc2 = {
    id: 'soc2',
    shortName: 'SOC 2',
    legalLabel: 'SOC 2',
    fullName:
      'SOC 2 — AICPA 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus — 2022)',
    maxArticles: 20,
    maxRecitals: 6,
    segmentMeta: { recitals: 'Purpose notes 1–6', articles: 'Criteria CC / A / C / PI / P' },
    infoBaseUrl:
      'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
    infoSiteName: 'AICPA & CIMA',
    eurLexUrl:
      'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations',
    eurLexTxtUrl:
      'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
    eurLexLabel: 'AICPA SOC for Service Organizations',
    officialSiteName: 'AICPA',
    recitalsIndexUrl:
      'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'intl',
    jurisdictionLabel: 'International',
    articleUrl: function () {
      return 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022';
    },
    recitalUrl: function () {
      return 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations';
    },
    articleHeading: function (n) {
      return 'SOC 2 criterion ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('SOC 2 criterion ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about SOC 2',
      leadHtml:
        'Get answers grounded in the public AICPA <strong>Trust Services Criteria</strong> (2017 TSC with 2022 Points of Focus) used for <strong>SOC 2</strong> reports. SOC 2 is a <strong>CPA attestation</strong>, not a law and not ISO certification. Security (Common Criteria) is the usual core; Availability, Processing Integrity, Confidentiality, and Privacy are optional categories.',
      placeholder:
        'e.g. Type 1 vs Type 2? CC6 access control? Privacy P1–P8 vs GDPR? Security vs Confidentiality?',
      queryAriaLabel: 'Ask a SOC 2 / Trust Services Criteria question',
      signalCorpus: 'Local SOC 2 educational corpus & AICPA TSC catalogue alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced SOC 2 answers, or narrow by <strong>industry sector</strong> for how TSC categories map to that line of business.',
      metaHtml:
        'Educational overlay from your cache; use <strong>Refresh sources</strong> to re-check <a href="https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022" target="_blank" rel="noopener">AICPA TSC</a>. Obtain the TSC from AICPA for engagements.',
      relevantTitle: 'Relevant Trust Services Criteria',
      relevantHint:
        'Criterion names and purpose notes cited for this answer. Open any item in <strong>Browse SOC 2</strong>. Points of Focus tables are not reproduced here.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced SOC 2 Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'SOC 2: credible sources & documents',
      intro:
        'Official AICPA & CIMA pages for the 2017 Trust Services Criteria (2022 Points of Focus) and SOC for Service Organizations. Every link opens in a new tab. The TSC booklet is not reproduced here.'
    },
    newsUi: {
      theme: 'soc2',
      eyebrow: 'International service-organization attestation',
      title: 'SOC 2–relevant news',
      intro: 'Headlines ranked for SOC 2, Trust Services Criteria, and AICPA service-organization reports — from AICPA.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing SOC 2 / TSC–related items',
      scopeText:
        'This list is narrowed to SOC 2 and Trust Services Criteria headlines from official AICPA pages. If empty, tap Refresh news.',
      switchToRegulationId: 'iso-27701',
      switchToLabel: 'View ISO 27701 news',
      tags: ['SOC 2', 'Trust Services Criteria', 'Type 2', 'CC6', 'Privacy P1–P8'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the SOC 2 relevance filter.',
      viewModeLabel: 'SOC 2 filter'
    },
    citationsUi: {
      asideAriaLabel: 'SOC 2: official links and cross-references',
      officialLeadHtml: 'Authoritative AICPA sources for the <strong>Trust Services Criteria</strong> used in SOC 2.',
      relatedArticlesTitle: 'Related TSC criteria',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other criterion-map items cited in this purpose note (<a href="https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022" target="_blank" rel="noopener">AICPA TSC</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this criterion.',
      relatedArticlesToggleLabel: 'Show or hide related TSC criteria',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'soc2',
      eyebrow: 'International attestation criteria (not a law)',
      title: 'SOC 2',
      subtitle: 'AICPA Trust Services Criteria 2017 / 2022',
      description:
        'A CPA attestation report over the Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Type 1 is design at a point in time; Type 2 adds operating effectiveness over a period. Not GDPR, not ISO certification, not a statute. Criterion titles only — Points of Focus remain AICPA copyright.',
      highlights: ['Common Criteria', 'Type 1 / Type 2', 'Optional categories', 'Not a law'],
      mark: 'SOC'
    }
  };

  global.REGULATION_PROFILES = P;
  if (typeof global.getRegulationProfile !== 'function') {
    global.getRegulationProfile = function (id) {
      return P[id] || P.gdpr;
    };
  }
})(typeof window !== 'undefined' ? window : global);
