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
          'Choose <strong>General</strong> for balanced GDPR answers, or <strong>expand a macro industry</strong>, then an <strong>ISIC section</strong>, and pick <strong>Whole ISIC section</strong> or a <strong>division</strong>. <strong>Type in the box</strong> to search paths, codes, and keywords.',
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
        eyebrow: 'Regulators & EU institutions',
        title: 'GDPR & data protection news',
        intro:
          'Headlines from the EDPB, EDPS, ICO, European Commission, Council of Europe, and other configured feeds—grouped by source, tagged by theme, with optional file attachments when the page links any.',
        filterForRegulation: false,
        bannerHtml: ''
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
        eyebrow: 'AI governance & data protection',
        title: 'AI Act–relevant news',
        intro:
          'Headlines from EU regulators and the Commission, filtered for artificial intelligence governance, high-risk systems, GPAI, biometrics, and overlapping data-protection themes.',
        filterForRegulation: true,
        bannerHtml:
          'Showing items relevant to the <strong>EU AI Act</strong> and AI/data-protection overlap. Select <strong>GDPR</strong> in the header for the full data-protection news corpus.'
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
        eyebrow: 'Data economy & data protection',
        title: 'Data Act–relevant news',
        intro:
          'Headlines from EU regulators and the Commission, filtered for data access, cloud switching, connected products, interoperability, and overlapping data-protection themes.',
        filterForRegulation: true,
        bannerHtml:
          'Showing items relevant to the <strong>EU Data Act</strong> and data-economy themes. Select <strong>GDPR</strong> in the header for the full data-protection news corpus.'
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
      }
    }
  };

  function get(id) {
    return PROFILES[id] || PROFILES.gdpr;
  }

  global.REGULATION_PROFILES = PROFILES;
  global.getRegulationProfile = get;
})(typeof window !== 'undefined' ? window : global);
