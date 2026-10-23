/**
 * Indonesian regulation UI profiles — UU PDP (GDPR analogue), Satu Data Indonesia (Data Act analogue),
 * and SE Kominfo 9/2023 AI ethics (AI Act analogue, currently in-force soft law).
 */
(function (global) {
  var P = global.REGULATION_PROFILES || {};

  ['gdpr', 'ai-act', 'data-act'].forEach(function (id) {
    if (P[id] && !P[id].officialSiteName) P[id].officialSiteName = 'EUR-Lex';
  });

  P['id-pdp'] = {
    id: 'id-pdp',
    shortName: 'ID PDP Law',
    legalLabel: 'UU PDP',
    fullName: 'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi',
    maxArticles: 76,
    maxRecitals: 4,
    segmentMeta: { recitals: 'Considering a–d', articles: 'Pasal 1–76' },
    infoBaseUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022',
    infoSiteName: 'JDIH Komdigi',
    eurLexUrl: 'https://peraturan.go.id/id/uu-no-27-tahun-2022',
    eurLexTxtUrl: 'https://jdih.kemenkoinfra.go.id/cfind/source/files/uu/uu-nomor-27-tahun-2022.pdf',
    eurLexLabel: 'UU No. 27 Tahun 2022 (peraturan.go.id)',
    officialSiteName: 'peraturan.go.id',
    recitalsIndexUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    articleUrl: function () {
      return 'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022';
    },
    recitalUrl: function () {
      return 'https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022';
    },
    articleHeading: function (n) {
      return 'Pasal ' + n + ' UU PDP';
    },
    recitalHeading: function (n) {
      return 'Considering (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('Pasal ' + n + ' UU PDP');
      p.push('Pasal ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about Indonesia’s PDP Law',
      leadHtml:
        'Get answers grounded in <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi</strong> (Indonesia’s GDPR analogue), from official JDIH / peraturan.go.id text, augmented with curated web snippets and LLM synthesis. Use <strong>API keys</strong> in the header to bring your own Groq/Tavily credentials (stored in this browser only).',
      placeholder:
        'e.g. What is specific personal data? When is consent valid? Cross-border transfer tests? 3x24-hour breach notice…',
      queryAriaLabel: 'Ask an Indonesian PDP Law question',
      signalCorpus: 'Local UU PDP corpus & JDIH / peraturan.go.id alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced UU PDP answers, or narrow by <strong>industry sector</strong> so examples map to typical controller/processor roles in that line of business.',
      metaHtml:
        'Consolidated UU PDP text is loaded from your cache; use <strong>Refresh sources</strong> in the header to pull the latest from <a href="https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022" target="_blank" rel="noopener">JDIH Komdigi</a> and <a href="https://peraturan.go.id/id/uu-no-27-tahun-2022" target="_blank" rel="noopener">peraturan.go.id</a>.',
      relevantTitle: 'Relevant UU PDP provisions',
      relevantHint:
        'Pasal and considering clauses cited for this answer. Open any item in <strong>Browse ID PDP Law</strong> for the full legal text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced UU PDP Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'ID PDP Law: credible sources & documents',
      intro:
        'Official Indonesian government sources for UU 27/2022 (JDIH Komdigi, peraturan.go.id, JDIH Kemenkeu). Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'id-pdp',
      eyebrow: 'Indonesia personal data protection',
      title: 'PDP Law–relevant news',
      intro:
        'Headlines ranked for Indonesia’s Personal Data Protection Law (UU 27/2022), Komdigi supervision, and related digital-rights themes.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing UU PDP–related items',
      scopeText:
        'This list is narrowed to Indonesian personal-data headlines from official and state-agency sources (Komdigi, Setkab, Antara, data.go.id). If empty, tap Refresh news. EU supervisory feeds stay on GDPR, the AI Act, and the Data Act.',
      switchToRegulationId: 'id-satu-data',
      switchToLabel: 'View Satu Data news',
      tags: ['UU PDP', 'Data-subject rights', 'Cross-border transfers', 'Breach notification', 'Komdigi'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the UU PDP relevance filter.',
      viewModeLabel: 'UU PDP filter'
    },
    citationsUi: {
      asideAriaLabel: 'UU PDP: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>UU PDP</strong> text.',
      relatedArticlesTitle: 'Related UU PDP articles',
      relatedRecitalsTitle: 'Related considering clauses',
      relatedArticlesLeadHtml:
        'Other pasal cited in this considering clause or cross-referenced in the text (<a href="https://jdih.komdigi.go.id/" target="_blank" rel="noopener">JDIH Komdigi</a>).',
      relatedRecitalsLeadHtml:
        'Considering clauses cited in this pasal (<a href="https://peraturan.go.id/id/uu-no-27-tahun-2022" target="_blank" rel="noopener">peraturan.go.id</a>).',
      relatedArticlesToggleLabel: 'Show or hide related UU PDP articles',
      relatedRecitalsToggleLabel: 'Show or hide related considering clauses'
    },
    browseUi: {
      theme: 'id-pdp',
      eyebrow: 'Indonesian personal data protection law',
      title: 'ID PDP Law',
      subtitle: 'UU No. 27 Tahun 2022',
      description:
        'Indonesia’s comprehensive personal data protection statute — data-subject rights, controller and processor duties, cross-border transfers, administrative fines, and criminal offences. Browse pasal with official JDIH and peraturan.go.id links, or use Ask for answers cited to this corpus.',
      policySummary:
        'Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) is Indonesia’s comprehensive personal-data statute and the closest national analogue to the EU GDPR. It defines personal and specific personal data, sets lawful bases and consent rules, grants data-subject rights, and assigns duties to controllers and processors—including security, breach notification, and cross-border transfer conditions. It also establishes administrative fines and criminal offences. This browse view opens pasal and considering clauses with official JDIH Komdigi / peraturan.go.id links.',
      highlights: ['Data-subject rights', 'Legal bases & consent', 'Cross-border transfers', 'Fines & criminal sanctions'],
      mark: 'PDP'
    }
  };

  P['id-satu-data'] = {
    id: 'id-satu-data',
    shortName: 'ID Satu Data',
    legalLabel: 'Satu Data',
    fullName: 'Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia',
    maxArticles: 44,
    maxRecitals: 4,
    segmentMeta: { recitals: 'Considering a–d', articles: 'Pasal 1–44' },
    infoBaseUrl:
      'https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf',
    infoSiteName: 'JDIH Kemenko Infra',
    eurLexUrl: 'https://peraturan.go.id/id/perpres-no-39-tahun-2019',
    eurLexTxtUrl:
      'https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf',
    eurLexLabel: 'Perpres No. 39 Tahun 2019 (peraturan.go.id)',
    officialSiteName: 'peraturan.go.id',
    recitalsIndexUrl: 'https://peraturan.go.id/id/perpres-no-39-tahun-2019',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    articleUrl: function () {
      return 'https://peraturan.go.id/id/perpres-no-39-tahun-2019';
    },
    recitalUrl: function () {
      return 'https://peraturan.go.id/id/perpres-no-39-tahun-2019';
    },
    articleHeading: function (n) {
      return 'Pasal ' + n + ' Satu Data';
    },
    recitalHeading: function (n) {
      return 'Considering (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('Pasal ' + n + ' Satu Data');
      p.push('Pasal ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about Satu Data Indonesia',
      leadHtml:
        'Get answers grounded in <strong>Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia</strong> (Indonesia’s closest analogue to the EU Data Act for public-sector data sharing, standards, metadata, and interoperability), from official government sources.',
      placeholder:
        'e.g. What is interoperabilitas data? Who is Walidata? Access without an MoU? Priority data…',
      queryAriaLabel: 'Ask a Satu Data Indonesia question',
      signalCorpus: 'Local Perpres 39/2019 corpus & peraturan.go.id alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced Satu Data answers, or narrow by <strong>industry sector</strong> for how government data standards and sharing affect that line of business.',
      metaHtml:
        'Consolidated Perpres 39/2019 text is loaded from your cache; use <strong>Refresh sources</strong> in the header to pull the latest from <a href="https://peraturan.go.id/id/perpres-no-39-tahun-2019" target="_blank" rel="noopener">peraturan.go.id</a> and the official PDF salinan.',
      relevantTitle: 'Relevant Satu Data provisions',
      relevantHint:
        'Pasal and considering clauses cited for this answer. Open any item in <strong>Browse ID Satu Data</strong> for the full legal text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced Satu Data Indonesia Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'Satu Data Indonesia: credible sources & documents',
      intro:
        'Official government sources for Perpres 39/2019 and the national data portal. Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'id-satu-data',
      eyebrow: 'Indonesia data governance & sharing',
      title: 'Satu Data–relevant news',
      intro:
        'Headlines ranked for Satu Data Indonesia, interoperability, metadata, and public-sector data sharing.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing Satu Data Indonesia–related items',
      scopeText:
        'This list is narrowed to Satu Data Indonesia, interoperability, and public-sector data-sharing headlines from Indonesian official and state-agency sources. If empty, tap Refresh news.',
      switchToRegulationId: 'id-ai-ethics',
      switchToLabel: 'View AI ethics news',
      tags: ['Satu Data', 'Interoperability', 'Metadata', 'Walidata', 'data.go.id'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the Satu Data relevance filter.',
      viewModeLabel: 'Satu Data filter'
    },
    citationsUi: {
      asideAriaLabel: 'Satu Data Indonesia: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>Perpres 39/2019</strong> text.',
      relatedArticlesTitle: 'Related Satu Data articles',
      relatedRecitalsTitle: 'Related considering clauses',
      relatedArticlesLeadHtml:
        'Other pasal cited in this considering clause or cross-referenced in the text (<a href="https://peraturan.go.id/id/perpres-no-39-tahun-2019" target="_blank" rel="noopener">peraturan.go.id</a>).',
      relatedRecitalsLeadHtml:
        'Considering clauses cited in this pasal.',
      relatedArticlesToggleLabel: 'Show or hide related Satu Data articles',
      relatedRecitalsToggleLabel: 'Show or hide related considering clauses'
    },
    browseUi: {
      theme: 'id-satu-data',
      eyebrow: 'Indonesian government data-sharing law',
      title: 'ID Satu Data',
      subtitle: 'Perpres No. 39 Tahun 2019',
      description:
        'Satu Data Indonesia is the national framework for accurate, up-to-date, shareable government data — standards, metadata, interoperability, reference codes, and Portal Satu Data Indonesia (data.go.id). It is the closest in-force analogue to the EU Data Act’s data-sharing and interoperability agenda in the public sector.',
      policySummary:
        'Peraturan Presiden Nomor 39 Tahun 2019 tentang Satu Data Indonesia is the national public-sector framework for accurate, up-to-date, and interoperable government data. It assigns roles to pembina data, walidata, and produsen data; requires data standards, metadata, and reference codes; and channels sharing through Portal Satu Data Indonesia (data.go.id), including access without MoU in defined cases. It is the closest in-force Indonesian analogue to the EU Data Act’s sharing and interoperability agenda for government data—not a private-sector IoT data law.',
      highlights: ['Data standards', 'Interoperability', 'Walidata & producers', 'Portal access without MoU'],
      mark: 'SDI'
    }
  };

  P['id-ai-ethics'] = {
    id: 'id-ai-ethics',
    shortName: 'ID AI Ethics',
    legalLabel: 'SE AI Ethics',
    fullName: 'Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial',
    maxArticles: 7,
    maxRecitals: 9,
    segmentMeta: { recitals: 'Nine ethical values', articles: 'Sections 1–7' },
    infoBaseUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    infoSiteName: 'JDIH Komdigi',
    eurLexUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    eurLexTxtUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    eurLexLabel: 'SE Menkominfo 9/2023 (JDIH Komdigi)',
    officialSiteName: 'JDIH Komdigi',
    recitalsIndexUrl:
      'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    articleUrl: function () {
      return 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023';
    },
    recitalUrl: function () {
      return 'https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023';
    },
    articleHeading: function (n) {
      return 'Section ' + n + ' SE 9/2023';
    },
    recitalHeading: function (n) {
      return 'Ethical value ' + n;
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('Section ' + n + ' SE 9/2023');
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about Indonesia’s AI ethics circular',
      leadHtml:
        'Get answers grounded in <strong>Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial</strong> — Indonesia’s in-force AI ethics instrument (soft law). Two Presidential Regulations on AI ethics and the national AI roadmap were still awaiting signature as of September 2026; this circular remains the official Kominfo/Komdigi guidance.',
      placeholder:
        'e.g. Is the circular legally binding? Nine ethical values? May AI decide humanitarian matters? Who is in scope (KBLI 62015 / PSE)?',
      queryAriaLabel: 'Ask an Indonesian AI ethics question',
      signalCorpus: 'Local SE 9/2023 corpus & JDIH Komdigi alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced AI-ethics answers, or narrow by <strong>industry sector</strong> for how electronic system operators in that line of business should apply the circular.',
      metaHtml:
        'SE 9/2023 text is loaded from your cache; use <strong>Refresh sources</strong> in the header to pull the latest from <a href="https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023" target="_blank" rel="noopener">JDIH Komdigi</a>. Binding Perpres on AI ethics/roadmap are tracked from official Komdigi notices.',
      relevantTitle: 'Relevant SE 9/2023 provisions',
      relevantHint:
        'Sections and ethical values cited for this answer. Open any item in <strong>Browse ID AI Ethics</strong> for the full official text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced Indonesian AI ethics Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'ID AI Ethics: credible sources & documents',
      intro:
        'Official Komdigi/Kominfo sources for SE 9/2023 and notices on forthcoming AI Presidential Regulations. Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'id-ai-ethics',
      eyebrow: 'Indonesia AI governance',
      title: 'AI ethics–relevant news',
      intro:
        'Headlines ranked for Indonesian AI ethics, SE 9/2023, forthcoming Perpres, and AI/privacy overlap.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing Indonesian AI ethics–related items',
      scopeText:
        'This list is narrowed to Indonesian AI ethics, SE 9/2023, and related Komdigi/Kominfo headlines — not the EU AI Act corpus. If empty, tap Refresh news.',
      switchToRegulationId: 'id-pdp',
      switchToLabel: 'View UU PDP news',
      tags: ['SE 9/2023', 'AI ethics', 'PSE duties', 'Perpres AI', 'Komdigi'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the AI ethics relevance filter.',
      viewModeLabel: 'AI ethics filter'
    },
    citationsUi: {
      asideAriaLabel: 'SE 9/2023: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>SE Menkominfo 9/2023</strong> text.',
      relatedArticlesTitle: 'Related circular sections',
      relatedRecitalsTitle: 'Related ethical values',
      relatedArticlesLeadHtml:
        'Other sections cited in this value or cross-referenced in the text (<a href="https://jdih.komdigi.go.id/" target="_blank" rel="noopener">JDIH Komdigi</a>).',
      relatedRecitalsLeadHtml:
        'Ethical values cited in this section.',
      relatedArticlesToggleLabel: 'Show or hide related circular sections',
      relatedRecitalsToggleLabel: 'Show or hide related ethical values'
    },
    browseUi: {
      theme: 'id-ai-ethics',
      eyebrow: 'Indonesian AI ethics guidance',
      title: 'ID AI Ethics',
      subtitle: 'SE Menkominfo No. 9 Tahun 2023',
      description:
        'The 2023 ministerial circular is Indonesia’s official in-force AI ethics instrument: nine values, implementation duties, and developer responsibilities for KBLI 62015 programmers and public/private electronic system operators. It is not legally binding in itself; UU ITE and UU PDP remain the hard-law backbone. Forthcoming Perpres on AI ethics and the 2026–2029 AI roadmap are tracked via Komdigi.',
      policySummary:
        'Surat Edaran Menkominfo Nomor 9 Tahun 2023 is Indonesia’s in-force AI ethics instrument. It sets nine ethical values, implementation duties for public and private electronic system operators, and developer responsibilities (including KBLI 62015 programmers), and it discourages sole AI decisions on humanitarian matters. Soft-law status means UU ITE and UU PDP remain the hard-law backbone; Komdigi tracks related Perpres and roadmap work. This browse view covers the circular’s sections and ethical values with official JDIH references.',
      highlights: ['Nine ethical values', 'PSE & KBLI 62015', 'No sole humanitarian AI decisions', 'Soft-law status'],
      mark: 'AI'
    }
  };

  global.REGULATION_PROFILES = P;
  if (typeof global.getRegulationProfile !== 'function') {
    global.getRegulationProfile = function (id) {
      return P[id] || P.gdpr;
    };
  }
})(typeof window !== 'undefined' ? window : global);
