/**
 * United States analogue UI profiles — CCPA/CPRA (GDPR analogue), OPEN Government Data Act
 * (Data Act public-sector analogue), and Colorado ADMT Act (AI Act analogue).
 * The United States has no federal GDPR, AI Act, or private-sector Data Act.
 */
(function (global) {
  var P = global.REGULATION_PROFILES || {};

  P['us-ccpa'] = {
    id: 'us-ccpa',
    shortName: 'US CCPA',
    legalLabel: 'CCPA/CPRA',
    fullName: 'California Consumer Privacy Act of 2018 (Cal. Civ. Code Title 1.81.5), as amended by the CPRA',
    maxArticles: 33,
    maxRecitals: 5,
    segmentMeta: { recitals: 'Purpose notes 1–5', articles: '§§ 1798.100–1798.199.95' },
    infoBaseUrl: 'https://cppa.ca.gov/',
    infoSiteName: 'California Privacy Protection Agency',
    eurLexUrl:
      'https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=CIV&division=3.&title=1.81.5.&part=4.&chapter=&article=',
    eurLexTxtUrl: 'https://cppa.ca.gov/regulations/pdf/ccpa_text.pdf',
    eurLexLabel: 'Cal. Civ. Code Title 1.81.5 (leginfo)',
    officialSiteName: 'California Legislative Information',
    recitalsIndexUrl: 'https://cppa.ca.gov/',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'us',
    jurisdictionLabel: 'United States',
    articleUrl: function () {
      return 'https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=CIV&division=3.&title=1.81.5.&part=4.&chapter=&article=';
    },
    recitalUrl: function () {
      return 'https://cppa.ca.gov/regulations/pdf/ccpa_text.pdf';
    },
    articleHeading: function (n) {
      return 'CCPA § ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('CCPA § ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about the California CCPA / CPRA',
      leadHtml:
        'Get answers grounded in the <strong>California Consumer Privacy Act of 2018</strong> as amended by the CPRA (Cal. Civ. Code Title 1.81.5) — the closest in-force U.S. analogue to the EU GDPR. There is <strong>no federal GDPR</strong>. Text is the CPPA January 2025 compilation.',
      placeholder:
        'e.g. Right to delete? Sensitive personal information? Sale vs share? CPPA vs Attorney General enforcement…',
      queryAriaLabel: 'Ask a CCPA / CPRA question',
      signalCorpus: 'Local CCPA/CPRA corpus & CPPA / leginfo alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced CCPA answers, or narrow by <strong>industry sector</strong> for how California consumer rights map to that line of business.',
      metaHtml:
        'Consolidated CCPA/CPRA text is loaded from your cache; use <strong>Refresh sources</strong> to re-check <a href="https://cppa.ca.gov/regulations/pdf/ccpa_text.pdf" target="_blank" rel="noopener">CPPA</a> and <a href="https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=CIV&division=3.&title=1.81.5.&part=4.&chapter=&article=" target="_blank" rel="noopener">leginfo</a>.',
      relevantTitle: 'Relevant CCPA / CPRA provisions',
      relevantHint:
        'Civil Code sections and purpose notes cited for this answer. Open any item in <strong>Browse US CCPA</strong> for the full legal text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced CCPA/CPRA Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'US CCPA: credible sources & documents',
      intro:
        'Official California sources for Cal. Civ. Code Title 1.81.5 (CPPA compilation, Legislative Counsel, Attorney General). Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'us-ccpa',
      eyebrow: 'California consumer privacy',
      title: 'CCPA/CPRA–relevant news',
      intro:
        'Headlines ranked for the California Consumer Privacy Act, CPRA, CPPA rulemaking, and related U.S. privacy enforcement.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing CCPA/CPRA–related items',
      scopeText:
        'This list is narrowed to California consumer-privacy headlines from official U.S. sources (CPPA/CalPrivacy, California OAG, FTC). If empty, tap Refresh news. EU and Indonesian feeds stay on their instruments.',
      switchToRegulationId: 'us-open-data',
      switchToLabel: 'View OPEN Data news',
      tags: ['CCPA', 'CPRA', 'CPPA', 'Sensitive PI', 'Opt-out of sale'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the CCPA relevance filter.',
      viewModeLabel: 'CCPA filter'
    },
    citationsUi: {
      asideAriaLabel: 'CCPA/CPRA: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>CCPA/CPRA</strong> text.',
      relatedArticlesTitle: 'Related CCPA sections',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other Civil Code sections cited in this purpose note or cross-referenced in the text (<a href="https://cppa.ca.gov/" target="_blank" rel="noopener">CPPA</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this section.',
      relatedArticlesToggleLabel: 'Show or hide related CCPA sections',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'us-ccpa',
      eyebrow: 'California consumer privacy statute',
      title: 'US CCPA',
      subtitle: 'Cal. Civ. Code Title 1.81.5',
      description:
        'The closest in-force U.S. analogue to the EU GDPR: California consumer rights of access, deletion, correction, opt-out of sale/share, and limit on sensitive personal information, plus CPPA administrative enforcement. Binding California law — not a federal GDPR.',
      policySummary:
        'The California Consumer Privacy Act / California Privacy Rights Act (Cal. Civ. Code Title 1.81.5) is the leading in-force U.S. analogue to the EU GDPR. It gives California consumers rights of access, deletion, correction, opt-out of sale or sharing, and limits on sensitive personal information, with CPPA rulemaking and enforcement. It is binding California law—not a federal GDPR. This browse view organises statutory sections and purpose notes with official California Legislative Information links.',
      highlights: ['Consumer rights', 'Sale / share opt-out', 'Sensitive PI', 'CPPA enforcement'],
      mark: 'CA'
    }
  };

  P['us-open-data'] = {
    id: 'us-open-data',
    shortName: 'US OPEN Data',
    legalLabel: 'OPEN Data Act',
    fullName:
      'OPEN Government Data Act (Title II of the Foundations for Evidence-Based Policymaking Act of 2018, Pub. L. 115-435)',
    maxArticles: 10,
    maxRecitals: 4,
    segmentMeta: { recitals: 'Purpose notes 1–4', articles: 'Title II §§ 201–202' },
    infoBaseUrl: 'https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm',
    infoSiteName: 'govinfo (GPO)',
    eurLexUrl: 'https://www.congress.gov/115/plaws/publ435/PLAW-115publ435.pdf',
    eurLexTxtUrl: 'https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm',
    eurLexLabel: 'Pub. L. 115-435 (Congress.gov PDF)',
    officialSiteName: 'govinfo',
    recitalsIndexUrl: 'https://data.gov/',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'us',
    jurisdictionLabel: 'United States',
    articleUrl: function () {
      return 'https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm';
    },
    recitalUrl: function () {
      return 'https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm';
    },
    articleHeading: function (n) {
      return 'OPEN Data § ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('OPEN Data § ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about the OPEN Government Data Act',
      leadHtml:
        'Get answers grounded in <strong>Title II of Public Law 115-435</strong> (OPEN Government Data Act) — the closest in-force U.S. analogue to the EU Data Act for <em>public-sector</em> open data, inventories, and data.gov. This is <strong>not</strong> the 2014 DATA Act (federal spending transparency), and the U.S. has no private-sector IoT/cloud-switching statute like the EU Data Act.',
      placeholder:
        'e.g. What is an open Government data asset? Federal data catalogue? Agency inventory? Chief Data Officer?',
      queryAriaLabel: 'Ask an OPEN Government Data Act question',
      signalCorpus: 'Local P.L. 115-435 Title II corpus & govinfo alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced OPEN Data Act answers, or narrow by <strong>industry sector</strong> for how federal open-data duties affect that line of business.',
      metaHtml:
        'Consolidated Title II text is loaded from your cache; use <strong>Refresh sources</strong> to re-check <a href="https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm" target="_blank" rel="noopener">govinfo</a> and <a href="https://data.gov/" target="_blank" rel="noopener">data.gov</a>.',
      relevantTitle: 'Relevant OPEN Data Act provisions',
      relevantHint:
        'Title II sections and purpose notes cited for this answer. Open any item in <strong>Browse US OPEN Data</strong> for the full legal text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced OPEN Government Data Act Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'US OPEN Data: credible sources & documents',
      intro:
        'Official federal sources for Pub. L. 115-435 Title II and the Federal data catalogue (data.gov). Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'us-open-data',
      eyebrow: 'U.S. open government data',
      title: 'OPEN Data Act–relevant news',
      intro:
        'Headlines ranked for the OPEN Government Data Act, data.gov, federal data catalogues, and open Government data assets — not the 2014 DATA Act.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing OPEN Government Data Act–related items',
      scopeText:
        'This list is narrowed to U.S. open-government-data headlines (data.gov, Federal Data Strategy, GSA). If empty, tap Refresh news. The 2014 DATA Act (spending transparency) is out of scope.',
      switchToRegulationId: 'us-admt',
      switchToLabel: 'View Colorado ADMT news',
      tags: ['OPEN Data Act', 'data.gov', 'Federal data catalogue', 'CDO', 'Machine-readable'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the OPEN Data relevance filter.',
      viewModeLabel: 'OPEN Data filter'
    },
    citationsUi: {
      asideAriaLabel: 'OPEN Government Data Act: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>P.L. 115-435 Title II</strong> text.',
      relatedArticlesTitle: 'Related OPEN Data sections',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other Title II provisions cited in this purpose note (<a href="https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm" target="_blank" rel="noopener">govinfo</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this section.',
      relatedArticlesToggleLabel: 'Show or hide related OPEN Data sections',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'us-open-data',
      eyebrow: 'U.S. public-sector open data law',
      title: 'US OPEN Data',
      subtitle: 'Pub. L. 115-435 Title II',
      description:
        'The OPEN Government Data Act requires federal agencies to inventory data assets and publish public data as open Government data assets by default, and directs GSA to maintain the Federal data catalogue (data.gov). It is the public-sector analogue to the EU Data Act — not the 2014 DATA Act on spending transparency.',
      policySummary:
        'Title II of Pub. L. 115-435 (OPEN Government Data Act) requires U.S. federal agencies to inventory data assets and publish public data as open Government data assets by default, and directs GSA to maintain the Federal data catalogue (data.gov), with Chief Data Officer roles and machine-readable expectations. It is the public-sector analogue to the EU Data Act’s sharing agenda—not the 2014 DATA Act on federal spending transparency. This browse view covers the Act’s sections and purpose notes with govinfo references.',
      highlights: ['Open by default', 'Federal data catalogue', 'Chief Data Officers', 'Machine-readable'],
      mark: 'OG'
    }
  };

  P['us-admt'] = {
    id: 'us-admt',
    shortName: 'US CO ADMT',
    legalLabel: 'CO ADMT',
    fullName:
      'Colorado Automated Decision-Making Technology Act (SB 26-189; 2026 Colo. Sess. Laws ch. 131; C.R.S. 6-1-1701 et seq.)',
    maxArticles: 14,
    maxRecitals: 5,
    segmentMeta: { recitals: 'Purpose notes 1–5', articles: 'C.R.S. 6-1-1701–1709' },
    infoBaseUrl: 'https://leg.colorado.gov/bills/sb26-189',
    infoSiteName: 'Colorado General Assembly',
    eurLexUrl: 'https://www.leg.colorado.gov/laws/session-laws/SB26-189/131/download',
    eurLexTxtUrl: 'https://www.leg.colorado.gov/laws/session-laws/SB26-189/131/download',
    eurLexLabel: '2026 Colo. Sess. Laws ch. 131',
    officialSiteName: 'Colorado General Assembly',
    recitalsIndexUrl: 'https://coag.gov/ai/',
    hasArticleTopics: false,
    hasSuitableRecitals: false,
    jurisdiction: 'us',
    jurisdictionLabel: 'United States',
    articleUrl: function () {
      return 'https://leg.colorado.gov/bills/sb26-189';
    },
    recitalUrl: function () {
      return 'https://www.leg.colorado.gov/laws/session-laws/SB26-189/131/download';
    },
    articleHeading: function (n) {
      return 'ADMT § ' + n;
    },
    recitalHeading: function (n) {
      return 'Purpose note (' + n + ')';
    },
    bodyStripPrefixes: function (n, dataTitle, displayTitle) {
      var p = [];
      if (dataTitle) p.push(String(dataTitle).trim());
      p.push('ADMT § ' + n);
      if (displayTitle) p.push(String(displayTitle).trim());
      return p;
    },
    askUi: {
      heading: 'Ask about Colorado’s ADMT Act',
      leadHtml:
        'Get answers grounded in <strong>Colorado Senate Bill 26-189</strong> (2026 Session Laws ch. 131; C.R.S. 6-1-1701 et seq.) — the in-force U.S. analogue to the EU AI Act for automated decision-making in consequential decisions. There is <strong>no federal AI Act</strong>. SB 26-189 repealed and reenacted SB 24-205; duties generally apply from <strong>1 January 2027</strong>.',
      placeholder:
        'e.g. What is a covered ADMT? Consequential decision? Developer documentation? Human review after an adverse outcome?',
      queryAriaLabel: 'Ask a Colorado ADMT Act question',
      signalCorpus: 'Local SB 26-189 corpus & Colorado session-law alignment',
      sectorExplainer:
        'Choose <strong>General</strong> for balanced ADMT answers, or narrow by <strong>industry sector</strong> for how covered-domain duties (employment, housing, credit, insurance, health, education, government services) map to that line of business.',
      metaHtml:
        'Consolidated SB 26-189 text is loaded from your cache; use <strong>Refresh sources</strong> to re-check the <a href="https://leg.colorado.gov/bills/sb26-189" target="_blank" rel="noopener">Colorado General Assembly</a> and <a href="https://coag.gov/ai/" target="_blank" rel="noopener">Attorney General AI page</a>.',
      relevantTitle: 'Relevant ADMT provisions',
      relevantHint:
        'C.R.S. sections and purpose notes cited for this answer. Open any item in <strong>Browse US CO ADMT</strong> for the full legal text.',
      crossrefTitle: null,
      sectorFrameworkGeneral: 'Default: balanced Colorado ADMT Q&A without industry emphasis.'
    },
    sourcesUi: {
      title: 'US CO ADMT: credible sources & documents',
      intro:
        'Official Colorado sources for SB 26-189 / C.R.S. 6-1-1701 et seq. (General Assembly bill page, session laws, Attorney General). Every link opens in a new tab.'
    },
    newsUi: {
      theme: 'us-admt',
      eyebrow: 'Colorado automated decision-making',
      title: 'ADMT Act–relevant news',
      intro:
        'Headlines ranked for Colorado SB 26-189, automated decision-making technology, consequential decisions, and related U.S. AI governance — not the EU AI Act corpus.',
      filterForRegulation: true,
      scopeMode: 'filtered',
      scopeEyebrow: 'Relevance filter active',
      scopeTitle: 'Showing Colorado ADMT–related items',
      scopeText:
        'This list is narrowed to Colorado ADMT / U.S. automated-decision headlines from official sources (Colorado AG, FTC). If empty, tap Refresh news.',
      switchToRegulationId: 'us-ccpa',
      switchToLabel: 'View CCPA news',
      tags: ['SB 26-189', 'ADMT', 'Consequential decisions', 'Human review', 'Colorado AG'],
      refreshLabel: 'Refresh feeds',
      refreshHint: 'Updates the shared corpus, then reapplies the ADMT relevance filter.',
      viewModeLabel: 'ADMT filter'
    },
    citationsUi: {
      asideAriaLabel: 'Colorado ADMT Act: official links and cross-references',
      officialLeadHtml:
        'Authoritative sources and freshness of the consolidated <strong>SB 26-189</strong> text.',
      relatedArticlesTitle: 'Related ADMT sections',
      relatedRecitalsTitle: 'Related purpose notes',
      relatedArticlesLeadHtml:
        'Other C.R.S. sections cited in this purpose note (<a href="https://leg.colorado.gov/bills/sb26-189" target="_blank" rel="noopener">Colorado General Assembly</a>).',
      relatedRecitalsLeadHtml: 'Purpose notes cited in this section.',
      relatedArticlesToggleLabel: 'Show or hide related ADMT sections',
      relatedRecitalsToggleLabel: 'Show or hide related purpose notes'
    },
    browseUi: {
      theme: 'us-admt',
      eyebrow: 'Colorado automated decision-making law',
      title: 'US CO ADMT',
      subtitle: 'SB 26-189 · C.R.S. 6-1-1701 et seq.',
      description:
        'Colorado’s in-force analogue to the EU AI Act: developer documentation, deployer notices, consumer correction and meaningful human review after adverse ADMT outcomes in education, employment, housing, credit, insurance, health care, and essential government services. Signed 14 May 2026; duties generally from 1 January 2027. Not a federal AI Act.',
      policySummary:
        'Colorado SB 26-189 (C.R.S. 6-1-1701 et seq.) is the state’s in-force analogue to the EU AI Act for automated decision-making technology (ADMT). It requires developer documentation, deployer notices, and consumer correction plus meaningful human review after adverse ADMT outcomes in education, employment, housing, credit, insurance, health care, and essential government services. Signed 14 May 2026 with duties generally from 1 January 2027—it is not a federal AI Act. This browse view maps sections and purpose notes to the Colorado General Assembly text.',
      highlights: ['Covered ADMT', 'Consequential decisions', 'Human review', 'AG enforcement'],
      mark: 'CO'
    }
  };

  global.REGULATION_PROFILES = P;
  if (typeof global.getRegulationProfile !== 'function') {
    global.getRegulationProfile = function (id) {
      return P[id] || P.gdpr;
    };
  }
})(typeof window !== 'undefined' ? window : global);
