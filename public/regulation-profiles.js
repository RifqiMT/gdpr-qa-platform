/**
 * Per-regulation UI copy and link patterns — keeps Browse/reader UX consistent across GDPR, EU AI Act, and EU Data Act.
 */
(function (global) {
  var PROFILES = {
    gdpr: {
      id: 'gdpr',
      shortName: 'GDPR',
      legalLabel: 'GDPR',
      fullName: 'General Data Protection Regulation (EU) 2016/679',
      maxArticles: 99,
      maxRecitals: 173,
      segmentMeta: { recitals: '1–173', articles: '1–99' },
      infoBaseUrl: 'https://gdpr-info.eu',
      infoSiteName: 'GDPR-Info',
      eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng',
      eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679',
      eurLexLabel: 'Regulation (EU) 2016/679',
      recitalsIndexUrl: 'https://gdpr-info.eu/recitals/',
      hasArticleTopics: true,
      hasSuitableRecitals: true,
      articleUrl: function (n) {
        return 'https://gdpr-info.eu/art-' + n + '-gdpr/';
      },
      recitalUrl: function (n) {
        return 'https://gdpr-info.eu/recitals/no-' + n + '/';
      },
      articleHeading: function (n) {
        return 'Art. ' + n + ' GDPR';
      },
      recitalHeading: function (n) {
        return 'GDPR Recital (' + n + ')';
      },
      bodyStripPrefixes: function (n, dataTitle, displayTitle) {
        var p = [];
        if (dataTitle) p.push(String(dataTitle).trim());
        p.push('Art. ' + n + ' GDPR');
        if (displayTitle) p.push(String(displayTitle).trim());
        return p;
      },
      askUi: {
        heading: 'Ask about the GDPR',
        leadHtml:
          'Get answers grounded in the official <strong>Regulation (EU) 2016/679</strong> text, augmented with curated web snippets and LLM synthesis—Groq when available, Tavily as a fallback. Use <strong>API keys</strong> in the header to bring your own Groq/Tavily credentials (stored in this browser only).',
        placeholder:
          'e.g. What counts as personal data? When is consent valid? Right to erasure…',
        queryAriaLabel: 'Ask a GDPR question',
        signalCorpus: 'Local GDPR corpus & EUR-Lex alignment',
        sectorExplainer:
          'Leave on <strong>General</strong> for balanced GDPR answers, or browse / search ISIC sectors to frame examples for your industry.',
        metaHtml:
          'Consolidated EU law text is loaded from your cache; use <strong>Refresh sources</strong> in the page header to pull the latest from <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679" target="_blank" rel="noopener">EUR-Lex</a>.',
        relevantTitle: 'Relevant GDPR provisions',
        relevantHint:
          'Articles and recitals behind this answer. For articles, related recitals from <a href="https://gdpr-info.eu/" target="_blank" rel="noopener">GDPR-Info</a> appear below when available.',
        crossrefTitle: 'Suitable GDPR recitals (GDPR-Info)',
        sectorFrameworkGeneral: 'Default: balanced GDPR Q&A without industry emphasis.'
      },
      sourcesUi: {
        title: 'GDPR: credible sources & documents',
        intro:
          'Official and specialist GDPR and data-protection guidance. Every link opens in a new tab.'
      },
      newsUi: {
        theme: 'gdpr',
        eyebrow: 'EU & UK supervisory news',
        title: 'GDPR & data protection news',
        intro:
          'All relevant headlines from EU/UK credible sources (EDPB, EDPS, ICO, Commission, Council of Europe, Digital Strategy)—scoped to personal-data supervision, not other jurisdictions.',
        filterForRegulation: true,
        scopeMode: 'filtered',
        scopeEyebrow: 'Relevant to GDPR',
        scopeTitle: 'EU/UK credible sources',
        scopeText:
          'Official links list every configured EU/UK news hub. Headlines keep EDPB/EDPS/ICO/CoE in full and add Commission / Digital Strategy items when they match data-protection themes.',
        switchToRegulationId: '',
        switchToLabel: '',
        tags: ['Supervisory guidance', 'Enforcement', 'Rights & consent', 'Transfers', 'Breach'],
        refreshLabel: 'Refresh feeds',
        refreshHint: 'Pulls the latest items from each regulator feed (may take a few seconds).',
        viewModeLabel: 'GDPR filter'
      },
      citationsUi: {
        asideAriaLabel: 'GDPR: official links and cross-references',
        officialLeadHtml:
          'Authoritative sources and freshness of the consolidated <strong>GDPR</strong> text.',
        relatedArticlesTitle: 'Related GDPR articles',
        relatedRecitalsTitle: 'Related GDPR recitals',
        relatedArticlesLeadHtml:
          'Mentioned in the text or suggested for this recital (<a href="https://gdpr-info.eu/" target="_blank" rel="noopener">GDPR-Info</a>).',
        relatedRecitalsLeadHtml:
          'Mentioned in the text or suggested for this article (<a href="https://gdpr-info.eu/" target="_blank" rel="noopener">GDPR-Info</a>).',
        relatedArticlesToggleLabel: 'Show or hide related GDPR articles',
        relatedRecitalsToggleLabel: 'Show or hide related GDPR recitals'
      },
      browseUi: {
        theme: 'gdpr',
        eyebrow: 'EU data protection law',
        title: 'GDPR',
        subtitle: 'Regulation (EU) 2016/679',
        description:
          'The General Data Protection Regulation sets EU-wide rules for processing personal data—lawfulness and transparency, data-subject rights, accountability, and international transfers. Browse recitals and articles with official links, or use Ask for answers cited to this corpus.',
        policySummary:
          'Regulation (EU) 2016/679 (GDPR) is the EU’s primary personal-data law. It sets when controllers and processors may process personal data (lawfulness, fairness, transparency), what rights individuals hold (access, erasure, objection, portability, and more), and how organisations must demonstrate accountability—including records, DPIAs, security, and breach notification. It also frames international transfers, supervisory cooperation, and administrative fines. This browse view opens the consolidated articles and recitals with official EUR-Lex / GDPR-Info links.',
        highlights: ['Lawfulness & consent', 'Data-subject rights', 'Accountability & DPIAs', 'International transfers'],
        mark: 'GDPR'
      }
    },
    'ai-act': {
      id: 'ai-act',
      shortName: 'EU AI Act',
      legalLabel: 'AI Act',
      fullName: 'Artificial Intelligence Act (EU) 2024/1689',
      maxArticles: 113,
      maxRecitals: 180,
      segmentMeta: { recitals: '1–180', articles: '1–113' },
      infoBaseUrl: 'https://ai-act-law.eu',
      infoSiteName: 'AI Act Law',
      eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng',
      eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
      eurLexLabel: 'Regulation (EU) 2024/1689',
      recitalsIndexUrl: 'https://ai-act-law.eu/recital/',
      hasArticleTopics: false,
      hasSuitableRecitals: false,
      articleUrl: function (n) {
        return 'https://ai-act-law.eu/article/' + n + '/';
      },
      recitalUrl: function (n) {
        return 'https://ai-act-law.eu/recital/' + n + '/';
      },
      articleHeading: function (n) {
        return 'Art. ' + n + ' AI Act';
      },
      recitalHeading: function (n) {
        return 'Recital ' + n;
      },
      bodyStripPrefixes: function (n, dataTitle, displayTitle) {
        var p = [];
        if (dataTitle) p.push(String(dataTitle).trim());
        p.push('Art. ' + n + ' AI Act');
        if (displayTitle) p.push(String(displayTitle).trim());
        return p;
      },
      askUi: {
        heading: 'Ask about the EU AI Act',
        leadHtml:
          'Get answers grounded in <strong>Regulation (EU) 2024/1689</strong> (Artificial Intelligence Act), augmented with curated web snippets and LLM synthesis—Groq when available, Tavily as a fallback. Use <strong>API keys</strong> in the header to bring your own credentials (stored in this browser only).',
        placeholder:
          'e.g. What is a high-risk AI system? GPAI provider duties? Prohibited AI practices? Transparency for deployers…',
        queryAriaLabel: 'Ask an EU AI Act question',
        signalCorpus: 'Local AI Act corpus & EUR-Lex alignment',
        sectorExplainer:
          'Choose <strong>General</strong> for balanced AI Act answers, or narrow by <strong>industry sector</strong> so examples map to typical AI system roles in that line of business (providers, deployers, importers).',
        metaHtml:
          'Consolidated AI Act text is loaded from your cache; use <strong>Refresh sources</strong> in the header to pull the latest from <a href="https://ai-act-law.eu/" target="_blank" rel="noopener">AI Act Law</a> and <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689" target="_blank" rel="noopener">EUR-Lex</a>.',
        relevantTitle: 'Relevant AI Act provisions',
        relevantHint:
          'Articles and recitals cited for this answer. Open any item in <strong>Browse EU AI Act</strong> for the full legal text.',
        crossrefTitle: null,
        sectorFrameworkGeneral: 'Default: balanced EU AI Act Q&A without industry emphasis.'
      },
      sourcesUi: {
        title: 'EU AI Act: credible sources & documents',
        intro:
          'Authoritative AI Act text (AI Act Law, EUR-Lex) and European Commission policy on the EU regulatory framework for AI. Every link opens in a new tab.'
      },
      newsUi: {
        theme: 'ai-act',
        eyebrow: 'AI governance',
        title: 'AI Act–relevant news',
        intro:
          'All AI Act–relevant headlines from EU/UK credible sources—Digital Strategy (AI), Commission, EDPB, EDPS, ICO, and Council of Europe—when the story matches high-risk AI, GPAI, AI Office, or related themes.',
        filterForRegulation: true,
        scopeMode: 'filtered',
        scopeEyebrow: 'Relevant to EU AI Act',
        scopeTitle: 'EU credible sources · AI Act filter',
        scopeText:
          'Official links show the full EU/UK news hub set. Digital Strategy (AI) items are included in full; other EU sources appear when the headline is AI Act–related (not general GDPR-only enforcement).',
        switchToRegulationId: 'gdpr',
        switchToLabel: 'View GDPR news',
        tags: ['High-risk AI', 'GPAI', 'Biometrics', 'AI Office', 'Generative AI'],
        refreshLabel: 'Refresh feeds',
        refreshHint: 'Updates the shared corpus, then reapplies the AI Act relevance filter.',
        viewModeLabel: 'AI Act filter'
      },
      citationsUi: {
        asideAriaLabel: 'EU AI Act: official links and cross-references',
        officialLeadHtml:
          'Authoritative sources and freshness of the consolidated <strong>EU AI Act</strong> text.',
        relatedArticlesTitle: 'Related AI Act articles',
        relatedRecitalsTitle: 'Related AI Act recitals',
        relatedArticlesLeadHtml:
          'Other articles cited in this recital or cross-referenced in the text (<a href="https://ai-act-law.eu/" target="_blank" rel="noopener">AI Act Law</a>).',
        relatedRecitalsLeadHtml:
          'Other recitals cited in this article or cross-referenced in the text (<a href="https://ai-act-law.eu/" target="_blank" rel="noopener">AI Act Law</a>).',
        relatedArticlesToggleLabel: 'Show or hide related AI Act articles',
        relatedRecitalsToggleLabel: 'Show or hide related AI Act recitals'
      },
      browseUi: {
        theme: 'ai-act',
        eyebrow: 'EU artificial intelligence law',
        title: 'EU AI Act',
        subtitle: 'Regulation (EU) 2024/1689',
        description:
          'The Artificial Intelligence Act introduces a risk-based framework for AI systems on the EU market—prohibited practices, requirements for high-risk AI, transparency duties, and rules for general-purpose AI models and governance roles.',
        policySummary:
          'Regulation (EU) 2024/1689 (EU AI Act) is the Union’s horizontal AI law. It bans certain AI practices, imposes strict duties on high-risk AI systems (data governance, transparency, human oversight, conformity assessment), and sets obligations for general-purpose AI (GPAI) models and providers/deployers. Governance includes the AI Office, market surveillance, and penalties. This browse view maps the Act’s articles and recitals for structured reading alongside official AI Act Law / EUR-Lex text.',
        highlights: ['Risk-based classification', 'High-risk AI systems', 'GPAI obligations', 'Providers & deployers'],
        mark: 'AI'
      }
    },
    'data-act': {
      id: 'data-act',
      shortName: 'EU Data Act',
      legalLabel: 'Data Act',
      fullName: 'Data Act (EU) 2023/2854',
      maxArticles: 50,
      maxRecitals: 119,
      segmentMeta: { recitals: '1–119', articles: '1–50' },
      infoBaseUrl: 'https://data-act-law.eu',
      infoSiteName: 'Data Act Law',
      eurLexUrl: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj/eng',
      eurLexTxtUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854',
      eurLexLabel: 'Regulation (EU) 2023/2854',
      recitalsIndexUrl: 'https://data-act-law.eu/recital/',
      hasArticleTopics: false,
      hasSuitableRecitals: false,
      articleUrl: function (n) {
        return 'https://data-act-law.eu/article/' + n + '/';
      },
      recitalUrl: function (n) {
        return 'https://data-act-law.eu/recital/' + n + '/';
      },
      articleHeading: function (n) {
        return 'Art. ' + n + ' Data Act';
      },
      recitalHeading: function (n) {
        return 'Recital ' + n;
      },
      bodyStripPrefixes: function (n, dataTitle, displayTitle) {
        var p = [];
        if (dataTitle) p.push(String(dataTitle).trim());
        p.push('Art. ' + n + ' Data Act');
        if (displayTitle) p.push(String(displayTitle).trim());
        return p;
      },
      askUi: {
        heading: 'Ask about the EU Data Act',
        leadHtml:
          'Get answers grounded in <strong>Regulation (EU) 2023/2854</strong> (Data Act on fair access to and use of data), augmented with curated web snippets and LLM synthesis—Groq when available, Tavily as a fallback. Use <strong>API keys</strong> in the header to bring your own credentials (stored in this browser only).',
        placeholder:
          'e.g. When must product data be shared with users? Cloud switching obligations? Unfair data contract terms? Public-sector exceptional need…',
        queryAriaLabel: 'Ask an EU Data Act question',
        signalCorpus: 'Local Data Act corpus & EUR-Lex alignment',
        sectorExplainer:
          'Choose <strong>General</strong> for balanced Data Act answers, or narrow by <strong>industry sector</strong> for connected products, cloud, or B2B data sharing in that line of business.',
        metaHtml:
          'Consolidated Data Act text is loaded from your cache; use <strong>Refresh sources</strong> in the header to pull the latest from <a href="https://data-act-law.eu/" target="_blank" rel="noopener">Data Act Law</a> and <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854" target="_blank" rel="noopener">EUR-Lex</a>.',
        relevantTitle: 'Relevant Data Act provisions',
        relevantHint:
          'Articles and recitals cited for this answer. Open any item in <strong>Browse EU Data Act</strong> for the full legal text.',
        crossrefTitle: null,
        sectorFrameworkGeneral: 'Default: balanced EU Data Act Q&A without industry emphasis.'
      },
      sourcesUi: {
        title: 'EU Data Act: credible sources & documents',
        intro:
          'Authoritative Data Act text (Data Act Law, EUR-Lex) and European Commission policy on fair access to data. Every link opens in a new tab.'
      },
      newsUi: {
        theme: 'data-act',
        eyebrow: 'Data economy & data protection',
        title: 'Data Act–relevant news',
        intro:
          'Headlines from EU regulators and the Commission, ranked for fair data access, cloud switching, connected products, interoperability, and related digital-policy themes.',
        filterForRegulation: true,
        scopeMode: 'filtered',
        scopeEyebrow: 'Relevance filter active',
        scopeTitle: 'Showing EU Data Act–related items',
        scopeText:
          'Official links show the full EU/UK news hub set. Headlines are kept when they match Data Act themes (access, cloud switching, connected products) from those regional sources.',
        switchToRegulationId: 'gdpr',
        switchToLabel: 'View GDPR news',
        tags: ['Data access', 'Cloud switching', 'Connected products', 'Interoperability', 'B2B data sharing'],
        refreshLabel: 'Refresh feeds',
        refreshHint: 'Updates the shared corpus, then reapplies the Data Act relevance filter.',
        viewModeLabel: 'Data Act filter'
      },
      citationsUi: {
        asideAriaLabel: 'EU Data Act: official links and cross-references',
        officialLeadHtml:
          'Authoritative sources and freshness of the consolidated <strong>EU Data Act</strong> text.',
        relatedArticlesTitle: 'Related Data Act articles',
        relatedRecitalsTitle: 'Related Data Act recitals',
        relatedArticlesLeadHtml:
          'Other articles cited in this recital or cross-referenced in the text (<a href="https://data-act-law.eu/" target="_blank" rel="noopener">Data Act Law</a>).',
        relatedRecitalsLeadHtml:
          'Other recitals cited in this article or cross-referenced in the text (<a href="https://data-act-law.eu/" target="_blank" rel="noopener">Data Act Law</a>).',
        relatedArticlesToggleLabel: 'Show or hide related Data Act articles',
        relatedRecitalsToggleLabel: 'Show or hide related Data Act recitals'
      },
      browseUi: {
        theme: 'data-act',
        eyebrow: 'EU data economy law',
        title: 'EU Data Act',
        subtitle: 'Regulation (EU) 2023/2854',
        description:
          'The Data Act governs fair access to and use of data across the EU—user rights over connected-product data, cloud switching, B2B data sharing, interoperability, and protection against unfair terms in data-related contracts.',
        policySummary:
          'Regulation (EU) 2023/2854 (EU Data Act) is the EU’s data-economy framework for fair access to and use of data. It gives users rights over data from connected products and related services, facilitates B2B sharing and public-sector access in defined cases, enables switching between data-processing services (including cloud), and promotes interoperability while guarding against unfair contractual terms. This browse view covers the Act’s chapters, articles, and recitals with official Data Act Law / EUR-Lex references.',
        highlights: ['Connected-product data', 'Cloud switching', 'B2B data sharing', 'Interoperability'],
        mark: 'DA'
      }
    }
  };

  function get(id) {
    return PROFILES[id] || PROFILES.gdpr;
  }

  global.REGULATION_PROFILES = PROFILES;
  global.getRegulationProfile = get;
})(typeof window !== 'undefined' ? window : global);
