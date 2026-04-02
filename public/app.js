(function () {
  const API = '';

  function get(url) {
    return fetch(API + url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
  }

  function post(url, body) {
    return fetch(API + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
  }

  /** GDPR-Info-style article → recitals map (bundled JSON); used if API omits suitableRecitals (stale server). */
  var articleToRecitalsMapPromise = null;
  function loadArticleToRecitalsMap() {
    if (articleToRecitalsMapPromise) return articleToRecitalsMapPromise;
    articleToRecitalsMapPromise = fetch(API + '/article-suitable-recitals.json')
      .then(function (r) {
        if (!r.ok) throw new Error('crossref');
        return r.json();
      })
      .then(function (j) {
        return j && j.articles ? j.articles : {};
      })
      .catch(function () {
        return {};
      });
    return articleToRecitalsMapPromise;
  }

  function resolveSuitableRecitalsForArticle(articleNum, fromApi) {
    if (Array.isArray(fromApi) && fromApi.length > 0) return Promise.resolve(fromApi);
    return loadArticleToRecitalsMap().then(function (map) {
      var arr = map[String(articleNum)];
      return Array.isArray(arr) ? arr : [];
    });
  }

  function resolveSuitableArticlesForRecital(recitalNum, fromApi) {
    if (Array.isArray(fromApi) && fromApi.length > 0) return Promise.resolve(fromApi);
    return loadArticleToRecitalsMap().then(function (map) {
      var out = [];
      for (var artKey in map) {
        if (!Object.prototype.hasOwnProperty.call(map, artKey)) continue;
        var recs = map[artKey];
        if (!Array.isArray(recs)) continue;
        if (recs.indexOf(recitalNum) !== -1) {
          var a = parseInt(artKey, 10);
          if (!isNaN(a) && a >= 1 && a <= 99) out.push(a);
        }
      }
      return out.sort(function (x, y) {
        return x - y;
      });
    });
  }

  const freshnessContentEl = document.getElementById('freshnessTooltipContent');
  const btnFreshnessInfo = document.getElementById('btnFreshnessInfo');
  const freshnessTooltipWrap = document.getElementById('freshnessTooltipWrap');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnBack = document.getElementById('btnBack');
  const btnBackToQuestion = document.getElementById('btnBackToQuestion');
  const btnBackFromCitation = document.getElementById('btnBackFromCitation');
  const viewBrowse = document.getElementById('viewBrowse');
  const viewAsk = document.getElementById('viewAsk');
  const viewSources = document.getElementById('viewSources');
  const viewNews = document.getElementById('viewNews');
  const sourcesList = document.getElementById('sourcesList');
  const newsList = document.getElementById('newsList');
  const newsFeedsList = document.getElementById('newsFeedsList');
  const newsSections = document.getElementById('newsSections');
  const newsFilterSource = document.getElementById('newsFilterSource');
  const newsFilterTopic = document.getElementById('newsFilterTopic');
  const newsFilterClear = document.getElementById('newsFilterClear');
  const browsePlaceholder = document.getElementById('browsePlaceholder');
  const browseRecitals = document.getElementById('browseRecitals');
  const browseChapters = document.getElementById('browseChapters');
  const browseDetail = document.getElementById('browseDetail');
  const citationsSidebarAside = browseDetail
    ? browseDetail.querySelector('aside.citations.citations-sidebar')
    : null;
  const recitalsList = document.getElementById('recitalsList');
  const recitalsSearch = document.getElementById('recitalsSearch');
  const recitalsCountEl = document.getElementById('recitalsCount');
  const recitalsClearSearch = document.getElementById('recitalsClearSearch');
  const chaptersArticlesGrouped = document.getElementById('chaptersArticlesGrouped');
  const chaptersFilterCategory = document.getElementById('chaptersFilterCategory');
  const chaptersFilterChapter = document.getElementById('chaptersFilterChapter');
  const chaptersFilterArticle = document.getElementById('chaptersFilterArticle');
  const chaptersFilterSubcategory = document.getElementById('chaptersFilterSubcategory');
  const chaptersFilterClear = document.getElementById('chaptersFilterClear');
  const detailContent = document.getElementById('detailContent');
  const citationLinks = document.getElementById('citationLinks');
  const relatedArticles = document.getElementById('relatedArticles');
  const relatedRecitals = document.getElementById('relatedRecitals');
  const docNav = document.getElementById('docNav');
  const docNavPrev = document.getElementById('docNavPrev');
  const docNavNext = document.getElementById('docNavNext');
  const docNavLabel = document.getElementById('docNavLabel');
  const docNavNumber = document.getElementById('docNavNumber');
  const docNavSuggestList = document.getElementById('docNavSuggestList');
  const docNavListToggle = document.getElementById('docNavListToggle');
  const docNavGo = document.getElementById('docNavGo');
  const queryInput = document.getElementById('query');
  const btnAsk = document.getElementById('btnAsk');
  const askComposer = document.getElementById('askComposer');
  const btnExportPdf = document.getElementById('btnExportPdf');
  const askResults = document.getElementById('askResults');
  const askRelevantDocs = document.getElementById('askRelevantDocs');
  const askRelevantDocsList = document.getElementById('askRelevantDocsList');
  const askAnswerBox = document.getElementById('askAnswerBox');
  const askAnswerContent = document.getElementById('askAnswerContent');
  const askAnswerStatus = document.getElementById('askAnswerStatus');
  const askAnswerSectorLine = document.getElementById('askAnswerSectorLine');
  const askAnswerLoading = document.getElementById('askAnswerLoading');
  const askAnswerCitations = document.getElementById('askAnswerCitations');

  (function relocateBrowseRegulationMenuToBody() {
    const menu = document.getElementById('browseRegMenu');
    if (menu && menu.parentNode !== document.body) {
      document.body.appendChild(menu);
    }
  })();

  let lastListSection = null;
  let currentDoc = null;
  let cameFromAsk = false;
  /** When set, user opened this article/recital via an in-text citation; "Back" returns there */
  let citationReturnDoc = null;
  let recitalsDataCache = null;
  let recitalsSearchTimer = null;
  let docNavArticlesListCache = null;
  let docNavSuggestTimer = null;
  let docNavSuggestActiveIndex = -1;
  let docNavSuggestItems = [];
  let docNavSuggestKind = null;

  /**
   * Optional paragraph / sub-point after an article number: 9(2), 9(2)(a), or broken / wrapped lines "9(2".
   * Used for in-text links (full label) and related-doc extraction (article N only).
   */
  var ARTICLE_SUBREF_SUFFIX_SRC =
    '(?:\\(\\s*\\d{1,2}\\s*\\)(?:\\s*\\(\\s*[a-z]\\s*\\)){0,2}|\\(\\s*\\d{1,2}(?=[,;:\\.\\s\\)]|$))';

  /** Canonical article titles (Regulation EU 2016/679) for display when parsed title is missing or malformed */
  var CANONICAL_ARTICLE_TITLES = {
    1: 'Subject matter and objectives', 2: 'Material scope', 3: 'Territorial scope', 4: 'Definitions',
    5: 'Principles relating to processing of personal data', 6: 'Lawfulness of processing', 7: 'Conditions for consent',
    8: 'Conditions applicable to child\'s consent in relation to information society services',
    9: 'Processing of special categories of personal data', 10: 'Processing of personal data relating to criminal convictions and offences',
    11: 'Processing which does not require identification', 12: 'Transparent information, communication and modalities for the exercise of the rights of the data subject',
    13: 'Information to be provided where personal data are collected from the data subject',
    14: 'Information to be provided where personal data have not been obtained from the data subject',
    15: 'Right of access by the data subject', 16: 'Right to rectification', 17: 'Right to erasure (\'right to be forgotten\')',
    18: 'Right to restriction of processing', 19: 'Notification obligation regarding rectification or erasure of personal data or restriction of processing',
    20: 'Right to data portability', 21: 'Right to object', 22: 'Automated individual decision-making, including profiling', 23: 'Restrictions',
    24: 'Responsibility of the controller', 25: 'Data protection by design and by default', 26: 'Joint controllers',
    27: 'Representatives of controllers or processors not established in the Union', 28: 'Processor',
    29: 'Processing under the authority of the controller or processor', 30: 'Records of processing activities',
    31: 'Cooperation with the supervisory authority', 32: 'Security of processing',
    33: 'Notification of a personal data breach to the supervisory authority', 34: 'Communication of a personal data breach to the data subject',
    35: 'Data protection impact assessment', 36: 'Prior consultation', 37: 'Designation of the data protection officer',
    38: 'Position of the data protection officer', 39: 'Tasks of the data protection officer', 40: 'Codes of conduct',
    41: 'Monitoring of approved codes of conduct', 42: 'Certification', 43: 'Certification bodies', 44: 'General principle for transfers',
    45: 'Transfers on the basis of an adequacy decision', 46: 'Transfers subject to appropriate safeguards', 47: 'Binding corporate rules',
    48: 'Transfers or disclosures not authorised by Union law', 49: 'Derogations for specific situations', 50: 'International cooperation for the protection of personal data',
    51: 'Supervisory authority', 52: 'Independence', 53: 'General conditions for the members of the supervisory authority', 54: 'Rules on the establishment of the supervisory authority',
    55: 'Competence', 56: 'Competence of the lead supervisory authority', 57: 'Tasks', 58: 'Powers', 59: 'Activity reports',
    60: 'Cooperation between the lead supervisory authority and the other supervisory authorities concerned',
    61: 'Mutual assistance', 62: 'Joint operations of supervisory authorities', 63: 'Consistency mechanism', 64: 'Opinion of the Board',
    65: 'Dispute resolution by the Board', 66: 'Urgency procedure', 67: 'Exchange of information',
    68: 'Procedure for mutual assistance in the field of information exchange', 69: 'Tasks of the Board', 70: 'Procedure of the Board',
    71: 'Reporting', 72: 'Procedure', 73: 'Chair', 74: 'Tasks of the Board', 75: 'Right to lodge a complaint with a supervisory authority',
    76: 'Right to an effective judicial remedy against a supervisory authority', 77: 'Right to an effective judicial remedy against a controller or processor',
    78: 'Right to compensation and liability', 79: 'Penalties', 80: 'Right to an effective judicial remedy against a controller or processor',
    81: 'Suspension of proceedings', 82: 'Right to representation', 83: 'Right to an effective judicial remedy against a supervisory authority',
    84: 'Right to an effective judicial remedy against a controller or processor', 85: 'Processing and freedom of expression and information',
    86: 'Processing and public access to official documents', 87: 'Processing of the national identification number',
    88: 'Processing in the context of employment', 89: 'Safeguards and derogations relating to processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes',
    90: 'Obligations of secrecy', 91: 'Existing data protection rules of churches and religious associations',
    92: 'Exercise of the delegation', 93: 'Committee procedure', 94: 'Repeal of Directive 95/46/EC', 95: 'Relationship with Directive 2002/58/EC',
    96: 'Relationship with the concluded international agreements', 97: 'Commission reports', 98: 'Review of other Union legal acts on data protection',
    99: 'Entry into force and application'
  };

  /** Sub-categories (topics) for articles: keyword-based mapping from article title/text */
  var ARTICLE_TOPICS = [
    { id: 'scope-definitions', label: 'Scope & definitions', keywords: ['subject-matter', 'objectives', 'material scope', 'territorial scope', 'definitions'] },
    { id: 'principles', label: 'Principles', keywords: ['principles relating to processing', 'lawfulness of processing'] },
    { id: 'consent', label: 'Consent', keywords: ['consent', 'conditions for consent', 'child\'s consent', 'information society services'] },
    { id: 'special-categories', label: 'Special categories of data', keywords: ['special categories', 'criminal convictions', 'offences'] },
    { id: 'identification', label: 'Identification', keywords: ['does not require identification'] },
    { id: 'rights-transparency', label: 'Rights & transparency', keywords: ['transparent information', 'modalities for the exercise', 'rights of the data subject'] },
    { id: 'information-provided', label: 'Information to be provided', keywords: ['information to be provided', 'collected from the data subject', 'have not been obtained'] },
    { id: 'right-access', label: 'Right of access', keywords: ['right of access'] },
    { id: 'right-rectification', label: 'Right to rectification', keywords: ['rectification'] },
    { id: 'right-erasure', label: 'Right to erasure', keywords: ['right to erasure', 'right to be forgotten'] },
    { id: 'right-restriction', label: 'Right to restriction', keywords: ['restriction of processing'] },
    { id: 'notification-obligation', label: 'Notification obligation', keywords: ['notification obligation', 'rectification or erasure'] },
    { id: 'right-portability', label: 'Right to data portability', keywords: ['data portability'] },
    { id: 'right-object', label: 'Right to object', keywords: ['right to object'] },
    { id: 'profiling', label: 'Profiling & automated decisions', keywords: ['automated individual decision', 'profiling'] },
    { id: 'restrictions', label: 'Restrictions', keywords: ['restrictions'] },
    { id: 'controller-processor', label: 'Controller & processor', keywords: ['responsibility of the controller', 'joint controllers', 'representatives of controllers', 'processor', 'processing under the authority'] },
    { id: 'design-default', label: 'Data protection by design and by default', keywords: ['by design', 'by default'] },
    { id: 'records', label: 'Records of processing', keywords: ['records of processing'] },
    { id: 'cooperation-supervisory', label: 'Cooperation with supervisory authority', keywords: ['cooperation with the supervisory'] },
    { id: 'security', label: 'Security of processing', keywords: ['security of processing'] },
    { id: 'data-breach', label: 'Personal data breach', keywords: ['personal data breach', 'notification of a personal data breach', 'communication of a personal data breach'] },
    { id: 'impact-assessment', label: 'Impact assessment & consultation', keywords: ['impact assessment', 'prior consultation'] },
    { id: 'dpo', label: 'Data protection officer', keywords: ['data protection officer', 'designation of the data protection officer', 'position of the data protection officer', 'tasks of the data protection officer'] },
    { id: 'codes-certification', label: 'Codes of conduct & certification', keywords: ['codes of conduct', 'monitoring of approved codes', 'certification', 'certification bodies'] },
    { id: 'transfers', label: 'Transfers', keywords: ['transfers', 'third countries', 'international organisations', 'adequacy', 'appropriate safeguards', 'binding corporate', 'derogations', 'international cooperation'] },
    { id: 'supervisory-authority', label: 'Supervisory authority', keywords: ['supervisory authority', 'independence', 'general conditions for the members', 'rules on the establishment', 'competence', 'lead supervisory authority', 'tasks', 'powers', 'activity reports'] },
    { id: 'cooperation-consistency', label: 'Cooperation & consistency', keywords: ['cooperation between the lead', 'mutual assistance', 'joint operations', 'consistency mechanism', 'Opinion of the Board', 'Dispute resolution', 'Urgency procedure', 'Exchange of information'] },
    { id: 'board', label: 'European Data Protection Board', keywords: ['European Data Protection Board', 'Procedure of the Board', 'Chair', 'Secretariat', 'Confidentiality'] },
    { id: 'remedies', label: 'Remedies & penalties', keywords: ['complaint', 'judicial remedy', 'representation', 'suspension of proceedings', 'compensation', 'liability', 'administrative fines', 'penalties'] },
    { id: 'specific-situations', label: 'Specific processing situations', keywords: ['freedom of expression', 'public access to official documents', 'national identification number', 'employment', 'archiving', 'research', 'statistical', 'obligations of secrecy', 'churches and religious'] },
    { id: 'delegated-implementing', label: 'Delegated & implementing acts', keywords: ['delegation', 'committee procedure'] },
    { id: 'final-provisions', label: 'Final provisions', keywords: ['repeal', 'directive 95/46', 'relationship with directive', 'commission reports', 'review of other', 'entry into force'] }
  ];

  /** Always available if /api/chapter-summaries fails, returns HTML, or empty (matches server + data/chapter-summaries.json). */
  var CHAPTER_SUMMARY_FALLBACK = {
    1: 'GDPR Chapter I frames what the Regulation protects and where it applies: its objectives and material and territorial scope, plus key definitions (including personal data and processing) that the rest of the text builds on.',
    2: 'GDPR Chapter II sets out the core principles for processing personal data and the main grounds for lawfulness—including consent and other bases—alongside specific rules for children\'s consent, special categories of data, and related carve-outs.',
    3: 'GDPR Chapter III describes transparency and information duties toward data subjects and their rights of access, rectification, erasure, restriction, portability, objection, and related modalities, including rules on automated decision-making.',
    4: 'GDPR Chapter IV allocates responsibilities between controllers and processors: accountability tools (such as DPIAs and records), security and breach notification, DPOs, codes of conduct and certification, and obligations when using processors or joint arrangements.',
    5: 'GDPR Chapter V governs transfers of personal data outside the EEA: the general rule, adequacy decisions, appropriate safeguard mechanisms (including BCRs), derogations, and cooperation on international enforcement.',
    6: 'GDPR Chapter VI establishes independent supervisory authorities: their independence, powers, tasks, and lead-authority arrangements for cross-border processing.',
    7: 'GDPR Chapter VII sets up cooperation and consistency among authorities, including the EDPB, consistency opinions, binding decisions, and urgency procedures where views diverge.',
    8: 'GDPR Chapter VIII provides remedies for individuals—complaints, judicial review, representation—and rules on compensation, liability, and administrative fines and penalties.',
    9: 'GDPR Chapter IX contains sector-specific and contextual provisions (e.g. freedom of expression, employment processing, archiving and research, churches) that qualify how standard rules apply in particular situations.',
    10: 'GDPR Chapter X covers delegated and implementing EU acts that empower the Commission to adopt supplementary rules under defined procedures.',
    11: 'GDPR Chapter XI contains final provisions: repeal of the old Directive, relationships with other instruments, reporting and review, and entry into force and application of the GDPR.'
  };

  function normalizeChapterSummariesMap(apiSummaries) {
    var out = {};
    var k;
    if (apiSummaries && typeof apiSummaries === 'object') {
      for (k in apiSummaries) {
        if (!Object.prototype.hasOwnProperty.call(apiSummaries, k)) continue;
        var v = apiSummaries[k];
        if (typeof v === 'string' && v.trim()) {
          var num = parseInt(String(k), 10);
          if (!isNaN(num) && num >= 1 && num <= 11) out[String(num)] = v.trim();
        }
      }
    }
    var i;
    for (i = 1; i <= 11; i++) {
      if (!out[String(i)]) out[String(i)] = CHAPTER_SUMMARY_FALLBACK[i];
    }
    return out;
  }

  function getChapterSummaryForSection(chapterNumber, mergedMap) {
    var m = mergedMap || {};
    var t = m[String(chapterNumber)] || m[chapterNumber];
    return typeof t === 'string' ? t.trim() : '';
  }

  function getArticleTopicIds(art) {
    if (!art) return [];
    var text = ((art.title || '') + ' ' + (art.text || '').slice(0, 300)).toLowerCase();
    var ids = [];
    ARTICLE_TOPICS.forEach(function (t) {
      for (var i = 0; i < t.keywords.length; i++) {
        if (text.indexOf(t.keywords[i].toLowerCase()) !== -1) {
          ids.push(t.id);
          break;
        }
      }
    });
    return ids;
  }

  function getArticleDisplayTitle(art) {
    if (!art || art.number == null) return 'Article';
    var canonical = CANONICAL_ARTICLE_TITLES[art.number];
    if (canonical) return canonical;
    var t = (art.title || '').trim();
    if (!t) return 'Article ' + art.number;
    if (t.length > 120 || /^\(Recital\s+\d+\)/i.test(t) || /^\(.*\)\s*of\s+Directive/i.test(t)) return 'Article ' + art.number;
    return t;
  }

  /**
   * Scraper sometimes prefixes the body with “Art. n GDPR … title”. Strip once so structure detection
   * sees the real first line (“This Regulation…”, “1The…”, etc.).
   */
  function stripLeadingArticleHeadingFromBody(articleNumber, dataTitle, displayTitle, rawText) {
    var t = String(rawText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    if (!t) return t;
    var tryPrefixes = [];
    if (dataTitle && String(dataTitle).trim()) tryPrefixes.push(String(dataTitle).trim());
    tryPrefixes.push('Art. ' + articleNumber + ' GDPR');
    if (displayTitle && String(displayTitle).trim()) tryPrefixes.push(String(displayTitle).trim());
    var seen = Object.create(null);
    var maxHeadingPasses = 4;
    while (maxHeadingPasses-- > 0) {
      var progressed = false;
      for (var i = 0; i < tryPrefixes.length; i++) {
        var p = tryPrefixes[i];
        if (!p || seen[p]) continue;
        seen[p] = true;
        if (t.indexOf(p) === 0) {
          t = t.slice(p.length).replace(/^\s+/, '').trim();
          progressed = true;
          break;
        }
      }
      if (!progressed) break;
      seen = Object.create(null);
    }
    return t;
  }

  /** Same heading strip as the article reader — for list/search excerpts only (substance unchanged). */
  function getArticleBodyTextAfterHeading(art) {
    if (!art || art.text == null) return '';
    var displayTitle = getArticleDisplayTitle(art);
    return stripLeadingArticleHeadingFromBody(art.number, art.title, displayTitle, art.text);
  }

  function setMeta(meta) {
    if (!freshnessContentEl) return;
    freshnessContentEl.textContent = '';
    if (meta.lastRefreshed || meta.lastChecked) {
      var refreshed = meta.lastRefreshed ? new Date(meta.lastRefreshed) : null;
      var checked = meta.lastChecked ? new Date(meta.lastChecked) : null;
      var refreshedTxt = refreshed ? refreshed.toLocaleString() : '—';
      var checkedTxt = checked ? checked.toLocaleString() : '—';

      var head = document.createElement('p');
      head.className = 'freshness-tooltip-head';
      head.textContent = 'Official consolidated text';
      freshnessContentEl.appendChild(head);

      var dl = document.createElement('dl');
      dl.className = 'freshness-tooltip-dl';

      var row1 = document.createElement('div');
      row1.className = 'freshness-tooltip-row';
      var dt1 = document.createElement('dt');
      dt1.textContent = 'Content as of';
      var dd1 = document.createElement('dd');
      dd1.appendChild(document.createTextNode(refreshedTxt + ' '));
      var srcSpan = document.createElement('span');
      srcSpan.className = 'freshness-source';
      srcSpan.textContent = '(EUR-Lex)';
      dd1.appendChild(srcSpan);
      row1.appendChild(dt1);
      row1.appendChild(dd1);
      dl.appendChild(row1);

      var row2 = document.createElement('div');
      row2.className = 'freshness-tooltip-row';
      var dt2 = document.createElement('dt');
      dt2.textContent = 'Last checked';
      var dd2 = document.createElement('dd');
      dd2.textContent = checkedTxt;
      row2.appendChild(dt2);
      row2.appendChild(dd2);
      dl.appendChild(row2);

      freshnessContentEl.appendChild(dl);
    } else {
      var headEmpty = document.createElement('p');
      headEmpty.className = 'freshness-tooltip-head';
      headEmpty.textContent = 'Official consolidated text';
      freshnessContentEl.appendChild(headEmpty);
      var note = document.createElement('p');
      note.className = 'freshness-tooltip-note';
      note.textContent =
        'Content not yet loaded from official sources. Use Refresh sources to fetch the latest GDPR text from EUR-Lex.';
      freshnessContentEl.appendChild(note);
    }
  }

  function loadMeta() {
    get('/api/meta')
      .then(setMeta)
      .catch(function () {
        if (!freshnessContentEl) return;
        freshnessContentEl.textContent = '';
        var err = document.createElement('p');
        err.className = 'freshness-tooltip-error';
        err.textContent = 'Could not load freshness information.';
        freshnessContentEl.appendChild(err);
      });
  }

  function loadSources() {
    if (!sourcesList) return;
    renderSourcesInto(sourcesList);
  }

  /** Render all credible sources (from /api/meta) into a given container (Sources tab). */
  function renderSourcesInto(container) {
    if (!container) return;
    get('/api/meta')
      .then(function (data) {
        const sources = data.sources || [];
        container.innerHTML = '';
        sources.forEach(function (src) {
          const card = document.createElement('div');
          card.className = 'source-card';
          card.setAttribute('role', 'listitem');
          const docs = src.documents || (src.url ? [{ label: 'Visit site', url: src.url }] : []);
          let docsHtml = '';
          if (docs.length) {
            docsHtml = '<ul class="source-doc-links">' + docs.map(function (d) {
              return '<li><a href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener">' + escapeHtml(d.label) + '</a></li>';
            }).join('') + '</ul>';
          }
          card.innerHTML = '<h3 class="source-card-title"><a href="' + escapeHtml(src.url) + '" target="_blank" rel="noopener">' + escapeHtml(src.name) + '</a></h3>' +
            (src.description ? '<p class="source-card-desc">' + escapeHtml(src.description) + '</p>' : '') +
            docsHtml;
          container.appendChild(card);
        });
      })
      .catch(function () {
        container.innerHTML = '<p class="excerpt">Could not load sources.</p>';
      });
  }

  var SOURCE_SUMMARIES = {
    'European Data Protection Board (EDPB)': 'EU-level guidance, opinions, and enforcement news. Covers how national supervisors apply GDPR and coordinate across the EU.',
    'EDPB': 'EU-level guidance, opinions, and enforcement news from the European Data Protection Board and national data protection authorities.',
    'ICO (UK)': 'UK regulator updates: enforcement actions, fines, guidance under UK GDPR, and how the ICO interprets data protection law.',
    'European Commission': 'Official EU policy, reform, and publications on data protection and the GDPR from the European Commission.',
    'Council of Europe': 'International data protection standards and updates on Convention 108+ (protection of personal data).'
  };

  var NEWS_TOPIC_ORDER = ['Rights (erasure & access)', 'AI & digital', 'Enforcement & fines', 'Guidance & compliance', 'Transfers & BCR', 'International standards', 'Policy & publications', 'Children & privacy', 'General'];

  var lastNewsItems = [];

  function renderNewsSections(items) {
    if (!newsSections) return;
    newsSections.innerHTML = '';
    if (!items || items.length === 0) {
      newsSections.innerHTML = '<p class="news-empty">No news match the current filters. Try changing or clearing the filters.</p>';
      return;
    }
    var bySource = {};
    items.forEach(function (item) {
      var src = item.sourceName || 'Other';
      if (!bySource[src]) bySource[src] = [];
      bySource[src].push(item);
    });
    var sourceOrder = ['European Data Protection Board (EDPB)', 'EDPB', 'ICO (UK)', 'European Commission', 'Council of Europe'];
    var ordered = sourceOrder.filter(function (s) { return bySource[s] && bySource[s].length; });
    Object.keys(bySource).forEach(function (s) { if (ordered.indexOf(s) === -1) ordered.push(s); });
    ordered.forEach(function (sourceName) {
      var sourceItems = bySource[sourceName];
      sourceItems.sort(function (a, b) {
        var da = a.date ? new Date(a.date).getTime() : 0;
        var db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      var summary = SOURCE_SUMMARIES[sourceName] || 'Updates and publications from this source. Each link goes to the original article.';
      var section = document.createElement('section');
      section.className = 'news-by-source';
      var sectionId = 'news-source-' + sourceName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      section.id = sectionId;
      var firstItem = sourceItems[0];
      var sourceUrl = firstItem && firstItem.sourceUrl ? firstItem.sourceUrl : '#';
      var titleId = sectionId + '-title';
      section.setAttribute('aria-labelledby', titleId);
      section.innerHTML =
        '<h4 class="news-source-heading" id="' + titleId + '"><a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener">' + escapeHtml(sourceName) + '</a></h4>' +
        '<p class="news-source-summary">' + escapeHtml(summary) + '</p>' +
        '<ul class="news-list news-list-in-section" role="list"></ul>';
      var ul = section.querySelector('.news-list');
      sourceItems.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'news-card';
        li.setAttribute('role', 'listitem');
        var dateStr = item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        var title = item.title || 'Untitled';
        var url = item.url || '#';
        var itemSourceUrl = item.sourceUrl || '#';
        var topic = getTopicFromItem(item);
        var summaryHtml = buildNewsCardSummaryHtml(item);
        if (!summaryHtml) li.classList.add('news-card--no-summary');
        li.innerHTML =
          (topic && topic !== 'General' ? '<span class="news-topic-tag">' + escapeHtml(topic) + '</span>' : '') +
          '<h5 class="news-card-title"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(title) + '</a></h5>' +
          summaryHtml +
          '<p class="news-card-meta">' +
          '<a href="' + escapeHtml(itemSourceUrl) + '" target="_blank" rel="noopener" class="news-card-source">' + escapeHtml(sourceName) + '</a>' +
          (dateStr ? ' <span class="news-card-date">' + escapeHtml(dateStr) + '</span>' : '') +
          '</p>';
        ul.appendChild(li);
      });
      newsSections.appendChild(section);
    });
  }

  function applyNewsFilters() {
    var sourceVal = newsFilterSource ? newsFilterSource.value : '';
    var topicVal = newsFilterTopic ? newsFilterTopic.value : '';
    var items = Array.isArray(lastNewsItems) ? lastNewsItems : [];
    var filtered = items.filter(function (item) {
      if (sourceVal && (item.sourceName || '') !== sourceVal) return false;
      if (topicVal) {
        var t = getTopicFromItem(item);
        if (t !== topicVal) return false;
      }
      return true;
    });
    renderNewsSections(filtered);
  }

  function populateNewsFilters(items) {
    if (!items || items.length === 0) return;
    var sources = [];
    var topicsSet = {};
    items.forEach(function (item) {
      var src = item.sourceName || 'Other';
      if (sources.indexOf(src) === -1) sources.push(src);
      var t = getTopicFromItem(item);
      topicsSet[t] = true;
    });
    var sourceOrder = ['European Data Protection Board (EDPB)', 'EDPB', 'ICO (UK)', 'European Commission', 'Council of Europe'];
    sources.sort(function (a, b) {
      var ia = sourceOrder.indexOf(a);
      var ib = sourceOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    if (newsFilterSource) {
      var selSource = newsFilterSource.value;
      newsFilterSource.innerHTML = '<option value="">All sources</option>';
      sources.forEach(function (s) {
        var opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === selSource) opt.selected = true;
        newsFilterSource.appendChild(opt);
      });
    }
    if (newsFilterTopic) {
      var selTopic = newsFilterTopic.value;
      newsFilterTopic.innerHTML = '<option value="">All topics</option>';
      NEWS_TOPIC_ORDER.forEach(function (t) {
        if (!topicsSet[t]) return;
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t === selTopic) opt.selected = true;
        newsFilterTopic.appendChild(opt);
      });
    }
  }

  function getTopicFromItem(item) {
    var t = ((item.title || '') + ' ' + (item.snippet || '')).toLowerCase();
    if (/\b(right to erasure|erasure|article 17|deletion)\b/.test(t)) return 'Rights (erasure & access)';
    if (/\b(ai|artificial intelligence|algorithm|digital)\b/.test(t)) return 'AI & digital';
    if (/\b(fine|penalt|enforcement|sanction)\b/.test(t)) return 'Enforcement & fines';
    if (/\b(guidance|guideline|recommendation|compliance|template)\b/.test(t)) return 'Guidance & compliance';
    if (/\b(bcr|binding corporate|transfer|international)\b/.test(t)) return 'Transfers & BCR';
    if (/\b(convention 108|coe|council of europe)\b/.test(t)) return 'International standards';
    if (/\b(reform|policy|publication)\b/.test(t)) return 'Policy & publications';
    if (/\b(children|child)\b/.test(t)) return 'Children & privacy';
    return 'General';
  }

  function isNewsSummaryBoilerplate(s) {
    var t = String(s || '').trim();
    if (!t) return true;
    return (
      /^This update is from\b/i.test(t) ||
      /^Relevant for GDPR compliance\b/i.test(t) ||
      /^For the full story\b/i.test(t) ||
      /^Open the link above\b/i.test(t)
    );
  }

  /** One short line for the card — real content only (source/date stay in the footer). */
  function getNewsCardSummaryText(item) {
    var parts = [];
    var p = item.summaryParagraphs;
    if (p && Array.isArray(p)) {
      for (var i = 0; i < p.length; i++) {
        var seg = String(p[i] || '').trim().replace(/\s+/g, ' ');
        if (!seg || isNewsSummaryBoilerplate(seg)) continue;
        parts.push(seg);
        if (parts.length >= 2) break;
      }
    }
    var combined = parts.join(' ');
    if (combined.length > 300) combined = combined.slice(0, 297).trim() + '…';
    if (combined) return combined;
    var sn = String(item.snippet || '').trim().replace(/\s+/g, ' ');
    if (sn) {
      if (sn.length > 300) return sn.slice(0, 297).trim() + '…';
      return sn;
    }
    return '';
  }

  function buildNewsCardSummaryHtml(item) {
    var text = getNewsCardSummaryText(item);
    if (!text) return '';
    return '<p class="news-card-snippet">' + escapeHtml(text) + '</p>';
  }

  function renderNewsPayload(data) {
    const feeds = data.newsFeeds || [];
    const items = data.items || [];
    newsFeedsList.innerHTML = '';
    feeds.forEach(function (feed) {
      const li = document.createElement('li');
      li.innerHTML =
        '<a href="' +
        escapeHtml(feed.url || '') +
        '" target="_blank" rel="noopener">' +
        escapeHtml(feed.name || '') +
        '</a>' +
        (feed.description ? ' <span class="news-feed-desc">' + escapeHtml(feed.description) + '</span>' : '');
      newsFeedsList.appendChild(li);
    });
    if (feeds.length === 0) {
      newsFeedsList.innerHTML = '<li class="news-empty">No news feeds configured.</li>';
    }
    if (newsSections) {
      newsSections.innerHTML = '';
      if (items.length === 0) {
        newsSections.innerHTML =
          '<p class="news-empty">No news items yet. Check the links above for the latest from each source.</p>';
      } else {
        lastNewsItems = items;
        populateNewsFilters(items);
        applyNewsFilters();
      }
    } else if (newsList) {
      newsList.innerHTML = '';
      if (items.length === 0) {
        newsList.innerHTML =
          '<li class="news-empty">No news items yet. Check the links above for the latest from each source.</li>';
      } else {
        items.forEach(function (item) {
          const li = document.createElement('li');
          li.className = 'news-card';
          li.setAttribute('role', 'listitem');
          const dateStr = item.date
            ? new Date(item.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '';
          const title = item.title || 'Untitled';
          const url = item.url || '#';
          const sourceName = item.sourceName || 'Source';
          const sourceUrl = item.sourceUrl || '#';
          const summaryHtml = buildNewsCardSummaryHtml(item);
          if (!summaryHtml) li.classList.add('news-card--no-summary');
          li.innerHTML =
            '<h4 class="news-card-title"><a href="' +
            escapeHtml(url) +
            '" target="_blank" rel="noopener">' +
            escapeHtml(title) +
            '</a></h4>' +
            summaryHtml +
            '<p class="news-card-meta">' +
            '<a href="' +
            escapeHtml(sourceUrl) +
            '" target="_blank" rel="noopener" class="news-card-source">' +
            escapeHtml(sourceName) +
            '</a>' +
            (dateStr ? ' <span class="news-card-date">' + escapeHtml(dateStr) + '</span>' : '') +
            '</p>';
          newsList.appendChild(li);
        });
      }
    }
  }

  function loadNews() {
    if (!newsFeedsList) return;
    if (newsSections) newsSections.innerHTML = '';
    if (newsList) newsList.innerHTML = '';
    newsFeedsList.innerHTML = '<li class="news-empty">Loading news…</li>';
    if (newsSections) newsSections.innerHTML = '<p class="news-empty">Loading…</p>';
    get('/api/news')
      .then(renderNewsPayload)
      .catch(function () {
        newsFeedsList.innerHTML = '<li class="news-empty">Could not load news.</li>';
        if (newsSections) {
          newsSections.innerHTML =
            '<p class="news-empty">News could not be loaded. Make sure the server is running and try again.</p>';
        }
        if (newsList) newsList.innerHTML = '';
      });
  }

  function refreshNewsFromAllSources() {
    if (!newsFeedsList) return;
    if (newsSections) newsSections.innerHTML = '';
    if (newsList) newsList.innerHTML = '';
    newsFeedsList.innerHTML = '<li class="news-empty">Refreshing all sources…</li>';
    if (newsSections) newsSections.innerHTML = '<p class="news-empty">Fetching EDPB, ICO, Commission, CoE…</p>';
    post('/api/news/refresh')
      .then(function (data) {
        renderNewsPayload(data);
        if (data && data.ok === false && data.error) {
          const note = document.createElement('li');
          note.className = 'news-empty';
          note.textContent = 'Note: refresh incomplete — ' + String(data.error);
          newsFeedsList.appendChild(note);
        }
      })
      .catch(function () {
        newsFeedsList.innerHTML = '<li class="news-empty">Could not refresh news.</li>';
        if (newsSections) {
          newsSections.innerHTML =
            '<p class="news-empty">Refresh failed. Is the server running? Try again in a moment.</p>';
        }
        if (newsList) newsList.innerHTML = '';
      });
  }

  btnRefresh.addEventListener('click', function () {
    btnRefresh.disabled = true;
    btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refreshing…';
    post('/api/refresh')
      .then((data) => {
        if (data.success) {
          // DOCUMENT_FORMATTING_GUARDRAILS — server already ran normalizeCorpus + validate; reload UI from fresh API/cache.
          if (data.formattingGuardrails && Array.isArray(data.formattingGuardrails.warnings)) {
            data.formattingGuardrails.warnings.forEach(function (w) {
              console.warn('[GDPR document formatting guardrails]', w);
            });
          }
          get('/api/meta')
            .then(function (meta) {
              setMeta(meta);
              if (data.message && freshnessContentEl) {
                var etl = document.createElement('p');
                etl.className = 'freshness-tooltip-etl';
                etl.textContent = data.message;
                freshnessContentEl.appendChild(etl);
              }
            })
            .catch(function () {
              setMeta({ lastRefreshed: data.lastRefreshed, lastChecked: data.lastChecked });
              if (data.message && freshnessContentEl) {
                var etl2 = document.createElement('p');
                etl2.className = 'freshness-tooltip-etl';
                etl2.textContent = data.message;
                freshnessContentEl.appendChild(etl2);
              }
            });
          loadChapters();
          loadRecitals();
          loadSources();
          if (currentDoc && currentDoc.type === 'article') openArticle(currentDoc.number);
          else if (currentDoc && currentDoc.type === 'recital') openRecital(currentDoc.number);
        }
        btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refresh sources';
        btnRefresh.disabled = false;
      })
      .catch(() => {
        btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refresh sources';
        btnRefresh.disabled = false;
        if (freshnessContentEl) {
          freshnessContentEl.textContent = '';
          var err = document.createElement('p');
          err.className = 'freshness-tooltip-error';
          err.textContent = 'Refresh failed. Try again later.';
          freshnessContentEl.appendChild(err);
        }
      });
  });

  if (btnFreshnessInfo && freshnessTooltipWrap) {
    btnFreshnessInfo.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = freshnessTooltipWrap.classList.toggle('freshness-tooltip-wrap--open');
      btnFreshnessInfo.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!freshnessTooltipWrap.contains(e.target)) {
        freshnessTooltipWrap.classList.remove('freshness-tooltip-wrap--open');
        btnFreshnessInfo.setAttribute('aria-expanded', 'false');
      }
    });
    btnFreshnessInfo.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        freshnessTooltipWrap.classList.remove('freshness-tooltip-wrap--open');
        btnFreshnessInfo.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /** Place menu below Browse cluster; position:fixed escapes .tabs overflow clipping */
  function positionBrowseRegMenu() {
    const cluster = document.querySelector('.tab-browse-cluster');
    const menu = document.getElementById('browseRegMenu');
    if (!cluster || !menu) return;
    const r = cluster.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const minW = Math.min(304, vw - margin * 2);
    const width = Math.max(minW, r.width);
    var left = r.left;
    if (left + width > vw - margin) left = Math.max(margin, vw - margin - width);
    menu.style.top = (r.bottom + 2) + 'px';
    menu.style.left = left + 'px';
    menu.style.width = width + 'px';
  }

  let browseMenuHoverLeaveTimer = null;
  function clearBrowseMenuHoverLeaveTimer() {
    if (browseMenuHoverLeaveTimer) {
      clearTimeout(browseMenuHoverLeaveTimer);
      browseMenuHoverLeaveTimer = null;
    }
  }
  function scheduleBrowseRegMenuCloseFromHover(ms) {
    clearBrowseMenuHoverLeaveTimer();
    browseMenuHoverLeaveTimer = setTimeout(function () {
      browseMenuHoverLeaveTimer = null;
      closeBrowseRegMenu();
    }, ms);
  }

  function closeBrowseRegMenu() {
    clearBrowseMenuHoverLeaveTimer();
    const menu = document.getElementById('browseRegMenu');
    const browseMain = document.getElementById('tabBrowseMain');
    if (menu) {
      menu.hidden = true;
      menu.style.top = '';
      menu.style.left = '';
      menu.style.width = '';
    }
    if (browseMain) browseMain.setAttribute('aria-expanded', 'false');
  }

  function openBrowseRegMenu() {
    const menu = document.getElementById('browseRegMenu');
    const browseMain = document.getElementById('tabBrowseMain');
    if (!menu || !browseMain) return;
    menu.hidden = false;
    browseMain.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      requestAnimationFrame(positionBrowseRegMenu);
    });
  }

  function toggleBrowseRegMenu() {
    const menu = document.getElementById('browseRegMenu');
    const browseMain = document.getElementById('tabBrowseMain');
    if (!menu || !browseMain) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    browseMain.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) {
      requestAnimationFrame(function () {
        requestAnimationFrame(positionBrowseRegMenu);
      });
    } else {
      menu.style.top = '';
      menu.style.left = '';
      menu.style.width = '';
    }
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      if (this.id === 'tabBrowseMain') {
        const onBrowse = viewBrowse && viewBrowse.classList.contains('active');
        const browseTabAlreadySelected = this.classList.contains('active');
        if (onBrowse && browseTabAlreadySelected) {
          toggleBrowseRegMenu();
          e.stopPropagation();
          return;
        }
      }
      closeBrowseRegMenu();
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', 'false'));
      document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.setAttribute('hidden', '');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      const viewId = 'view' + this.dataset.view.charAt(0).toUpperCase() + this.dataset.view.slice(1);
      const panel = document.getElementById(viewId);
      if (panel) {
        panel.classList.add('active');
        panel.removeAttribute('hidden');
        if (panel === viewSources) loadSources();
        if (panel === viewNews) loadNews();
        if (panel === viewAsk) initAskIndustrySectorCombobox();
      }
      if (this.id === 'tabBrowseMain' && panel === viewBrowse) {
        openBrowseRegMenu();
      }
      updateBrowseSectionMenu();
    });
  });

  const tabBrowseCluster = document.querySelector('.tab-browse-cluster');
  const browseRegMenuHoverTarget = document.getElementById('browseRegMenu');
  if (tabBrowseCluster) {
    tabBrowseCluster.addEventListener('mouseenter', function () {
      clearBrowseMenuHoverLeaveTimer();
      openBrowseRegMenu();
    });
    tabBrowseCluster.addEventListener('mouseleave', function (e) {
      const menu = document.getElementById('browseRegMenu');
      const to = e.relatedTarget;
      if (menu && to && menu.contains(to)) return;
      scheduleBrowseRegMenuCloseFromHover(280);
    });
  }
  if (browseRegMenuHoverTarget) {
    browseRegMenuHoverTarget.addEventListener('mouseenter', function () {
      clearBrowseMenuHoverLeaveTimer();
    });
    browseRegMenuHoverTarget.addEventListener('mouseleave', function (e) {
      const cluster = document.querySelector('.tab-browse-cluster');
      const to = e.relatedTarget;
      if (cluster && to && cluster.contains(to)) return;
      scheduleBrowseRegMenuCloseFromHover(280);
    });
  }

  function repositionBrowseRegMenuIfOpen() {
    const menu = document.getElementById('browseRegMenu');
    if (menu && !menu.hidden) positionBrowseRegMenu();
  }

  window.addEventListener('resize', repositionBrowseRegMenuIfOpen);
  const mainEl = document.querySelector('.main');
  if (mainEl) mainEl.addEventListener('scroll', repositionBrowseRegMenuIfOpen, { passive: true });

  document.addEventListener('click', function (e) {
    const t = e.target;
    setTimeout(function () {
      const menu = document.getElementById('browseRegMenu');
      if (!menu || menu.hidden) return;
      if (menu.contains(t)) return;
      const cluster = document.querySelector('.tab-browse-cluster');
      if (cluster && cluster.contains(t)) return;
      closeBrowseRegMenu();
    }, 0);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const menu = document.getElementById('browseRegMenu');
    if (menu && !menu.hidden) {
      closeBrowseRegMenu();
      const browseMain = document.getElementById('tabBrowseMain');
      if (browseMain) browseMain.focus();
    }
  });

  const btnRefreshNews = document.getElementById('btnRefreshNews');
  if (btnRefreshNews) btnRefreshNews.addEventListener('click', refreshNewsFromAllSources);

  if (newsFilterSource) newsFilterSource.addEventListener('change', applyNewsFilters);
  if (newsFilterTopic) newsFilterTopic.addEventListener('change', applyNewsFilters);
  if (newsFilterClear) {
    newsFilterClear.addEventListener('click', function () {
      if (newsFilterSource) newsFilterSource.value = '';
      if (newsFilterTopic) newsFilterTopic.value = '';
      applyNewsFilters();
    });
  }

  if (chaptersFilterChapter) {
    chaptersFilterChapter.addEventListener('change', function () {
      if (chaptersFilterCategory) chaptersFilterCategory.value = chaptersFilterChapter.value;
      applyChaptersFilters();
    });
  }
  if (chaptersFilterCategory) {
    chaptersFilterCategory.addEventListener('change', function () {
      if (chaptersFilterChapter) chaptersFilterChapter.value = chaptersFilterCategory.value;
      applyChaptersFilters();
    });
  }
  if (chaptersFilterArticle) chaptersFilterArticle.addEventListener('change', applyChaptersFilters);
  if (chaptersFilterSubcategory) chaptersFilterSubcategory.addEventListener('change', applyChaptersFilters);
  if (chaptersFilterClear) {
    chaptersFilterClear.addEventListener('click', function () {
      if (chaptersFilterCategory) chaptersFilterCategory.value = '';
      if (chaptersFilterChapter) chaptersFilterChapter.value = '';
      if (chaptersFilterArticle) chaptersFilterArticle.value = '';
      if (chaptersFilterSubcategory) chaptersFilterSubcategory.value = '';
      applyChaptersFilters();
    });
  }
  initChaptersFilterComboboxes();
  initAskIndustrySectorCombobox();

  function formatCitationReturnLabel(doc) {
    if (!doc || doc.number == null || !doc.type) return 'Back to previous';
    if (doc.type === 'recital') return 'Back to GDPR Recital (' + doc.number + ')';
    return 'Back to GDPR Article ' + doc.number;
  }

  function applyCitationNavOpts(opts) {
    opts = opts || {};
    if (opts.fromCitationBack) {
      citationReturnDoc = null;
    } else if (opts.citationReturn) {
      citationReturnDoc = opts.citationReturn;
    } else {
      citationReturnDoc = null;
    }
  }

  function updateBrowseSectionMenu() {
    const menu = document.getElementById('browseRegMenu');
    if (!menu || !browsePlaceholder || !browseRecitals || !browseChapters || !browseDetail) return;
    const buttons = menu.querySelectorAll('[data-browse-segment]');
    const browseViewActive = viewBrowse && viewBrowse.classList.contains('active');
    let key = null;
    if (browseViewActive) {
      if (!browsePlaceholder.classList.contains('hidden')) {
        key = null;
      } else if (!browseRecitals.classList.contains('hidden')) {
        key = 'recitals';
      } else if (!browseChapters.classList.contains('hidden')) {
        key = 'chapters';
      } else if (!browseDetail.classList.contains('hidden')) {
        if (currentDoc && currentDoc.type === 'article') key = 'chapters';
        else if (currentDoc && currentDoc.type === 'recital') key = 'recitals';
        else if (lastListSection === browseChapters) key = 'chapters';
        else key = 'recitals';
      }
    }
    buttons.forEach(function (btn) {
      const seg = btn.getAttribute('data-browse-segment');
      const active = browseViewActive && seg === key;
      btn.classList.toggle('tab-browse-menu-item--active', active);
      if (active) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  /** Move focus into the reader after opening a document (keyboard / screen-reader UX). */
  function focusDetailContentForReading() {
    var el = document.getElementById('detailContent');
    if (!el) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          el.focus({ preventScroll: true });
        } catch (err) {}
      });
    });
  }

  function showSection(section) {
    if (!browsePlaceholder || !section) return;
    browsePlaceholder.classList.add('hidden');
    browseRecitals.classList.add('hidden');
    browseChapters.classList.add('hidden');
    browseDetail.classList.add('hidden');
    btnExportPdf.classList.add('hidden');
    btnBackToQuestion.classList.add('hidden');
    if (btnBackFromCitation) btnBackFromCitation.classList.add('hidden');
    section.classList.remove('hidden');
    if (section === browseDetail) {
      lastListSection = lastListSection || browseRecitals;
      if (currentDoc) {
        btnExportPdf.classList.remove('hidden');
      }
      if (cameFromAsk) {
        btnBackToQuestion.classList.remove('hidden');
        btnBack.classList.add('hidden');
      } else if (citationReturnDoc && btnBackFromCitation) {
        var backLabel = formatCitationReturnLabel(citationReturnDoc);
        btnBackFromCitation.textContent = backLabel;
        btnBackFromCitation.setAttribute('aria-label', backLabel);
        btnBackFromCitation.classList.remove('hidden');
        btnBack.classList.add('hidden');
      } else {
        btnBack.classList.remove('hidden');
      }
      updateDocNav();
    } else {
      btnBack.classList.add('hidden');
      currentDoc = null;
      lastListSection = section;
      updateDocNav();
    }
    updateBrowseSectionMenu();
  }

  function ensureRecitalsIndexForSuggest() {
    if (recitalsDataCache && recitalsDataCache.length) {
      return Promise.resolve(recitalsDataCache);
    }
    return get('/api/recitals').then(function (recitals) {
      recitalsDataCache = Array.isArray(recitals) ? recitals : [];
      return recitalsDataCache;
    });
  }

  function ensureArticlesIndexForSuggest() {
    var fromCh = window.__chaptersData && window.__chaptersData.articles;
    if (fromCh && fromCh.length) return Promise.resolve(fromCh);
    if (docNavArticlesListCache && docNavArticlesListCache.length) {
      return Promise.resolve(docNavArticlesListCache);
    }
    return get('/api/articles').then(function (articles) {
      docNavArticlesListCache = Array.isArray(articles) ? articles : [];
      return docNavArticlesListCache;
    });
  }

  function closeDocNavSuggestions() {
    if (!docNavSuggestList) return;
    docNavSuggestList.hidden = true;
    docNavSuggestList.innerHTML = '';
    docNavSuggestList.classList.remove('doc-nav-suggest--browse');
    docNavSuggestActiveIndex = -1;
    docNavSuggestItems = [];
    docNavSuggestKind = null;
    if (docNavNumber) {
      docNavNumber.setAttribute('aria-expanded', 'false');
      docNavNumber.removeAttribute('aria-activedescendant');
    }
    if (docNavListToggle) {
      docNavListToggle.setAttribute('aria-expanded', 'false');
      docNavListToggle.classList.remove('is-open');
    }
  }

  function highlightDocNavSuggestOption(index) {
    if (!docNavSuggestList || !docNavNumber) return;
    var opts = docNavSuggestList.querySelectorAll('.doc-nav-suggest__option');
    opts.forEach(function (el, i) {
      var on = i === index;
      el.classList.toggle('doc-nav-suggest__option--active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (index >= 0 && opts[index]) {
      docNavNumber.setAttribute('aria-activedescendant', opts[index].id);
      opts[index].scrollIntoView({ block: 'nearest' });
    } else {
      docNavNumber.removeAttribute('aria-activedescendant');
    }
  }

  function renderDocNavSuggestions(items, kind, opts) {
    opts = opts || {};
    if (!docNavSuggestList || !docNavNumber) return;
    docNavSuggestItems = items;
    docNavSuggestKind = kind;
    if (!items.length) {
      closeDocNavSuggestions();
      return;
    }
    if (opts.browseAll) {
      docNavSuggestList.classList.add('doc-nav-suggest--browse');
    } else {
      docNavSuggestList.classList.remove('doc-nav-suggest--browse');
    }
    docNavSuggestList.setAttribute(
      'aria-label',
      opts.browseAll
        ? kind === 'recital'
          ? 'All GDPR recitals'
          : 'All GDPR articles'
        : 'Matching GDPR documents'
    );
    docNavSuggestList.innerHTML = '';
    items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.id = 'doc-nav-suggest-opt-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('data-number', item.number);
      li.className = 'doc-nav-suggest__option';
      li.setAttribute('tabindex', '-1');
      var badge = kind === 'recital' ? 'Rec. ' + item.number : 'Art. ' + item.number;
      var title = '';
      var sub = '';
      if (kind === 'recital') {
        title = parseRecitalTopicTitle(item.title, item.number) || 'GDPR Recital (' + item.number + ')';
        sub = truncateExcerptAtWord(summarizeRecitalBodyForCard(item.text || '', 120), 100);
      } else {
        title = getArticleDisplayTitle(item);
        var rawT = String(getArticleBodyTextAfterHeading(item) || '').replace(/\s+/g, ' ').trim();
        sub =
          rawT && rawT.indexOf('(Text not extracted') !== 0 ? truncateExcerptAtWord(rawT, 90) : '';
      }
      li.innerHTML =
        '<span class="doc-nav-suggest__badge">' +
        escapeHtml(badge) +
        '</span><span class="doc-nav-suggest__main"><span class="doc-nav-suggest__title">' +
        escapeHtml(title) +
        '</span>' +
        (sub ? '<span class="doc-nav-suggest__sub">' + escapeHtml(sub) + '</span>' : '') +
        '</span>';
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
      });
      li.addEventListener('click', function () {
        var n = parseInt(li.getAttribute('data-number'), 10);
        closeDocNavSuggestions();
        if (kind === 'recital') openRecital(n);
        else openArticle(n);
      });
      docNavSuggestList.appendChild(li);
    });
    docNavSuggestList.hidden = false;
    docNavNumber.setAttribute('aria-expanded', 'true');
    if (docNavListToggle) {
      docNavListToggle.setAttribute('aria-expanded', 'true');
      docNavListToggle.classList.add('is-open');
    }
    var startIdx = 0;
    if (opts.highlightCurrent && currentDoc && currentDoc.number != null) {
      for (var hi = 0; hi < items.length; hi++) {
        if (items[hi].number === currentDoc.number) {
          startIdx = hi;
          break;
        }
      }
    }
    docNavSuggestActiveIndex = startIdx;
    highlightDocNavSuggestOption(startIdx);
  }

  var DOC_NAV_SUGGEST_MAX = 12;

  function refreshDocNavSuggestions() {
    if (!docNavNumber || !currentDoc || !docNavSuggestList) return;
    var q = docNavValueToFilterQuery(docNavNumber.value);
    if (!q.length) {
      closeDocNavSuggestions();
      return;
    }
    var kind = currentDoc.type === 'recital' ? 'recital' : 'article';
    var p = kind === 'recital' ? ensureRecitalsIndexForSuggest() : ensureArticlesIndexForSuggest();
    p.then(function (all) {
      if (!docNavNumber || document.activeElement !== docNavNumber) return;
      if (!currentDoc) return;
      var mode = currentDoc.type === 'recital' ? 'recital' : 'article';
      if (mode !== kind) return;
      var items =
        kind === 'recital'
          ? filterRecitalsList(all, q).slice(0, DOC_NAV_SUGGEST_MAX)
          : filterArticlesForDocNav(all, q).slice(0, DOC_NAV_SUGGEST_MAX);
      renderDocNavSuggestions(items, kind);
    }).catch(function () {
      closeDocNavSuggestions();
    });
  }

  function scheduleDocNavSuggestions() {
    if (!docNavNumber || !currentDoc) return;
    clearTimeout(docNavSuggestTimer);
    docNavSuggestTimer = setTimeout(refreshDocNavSuggestions, 120);
  }

  function truncateBriefTitleForDocNav(s, maxLen) {
    maxLen = maxLen || 56;
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    return truncateExcerptAtWord(s, maxLen);
  }

  /** Visible value in the Go to field: "2 — Material scope" (article) or "12 — …" (recital topic). */
  function buildDocNavInputDisplay(doc) {
    if (!doc || doc.number == null) return '';
    var brief = (doc.briefTitle || '').replace(/\s+/g, ' ').trim();
    if (!brief && detailContent) {
      var subj = detailContent.querySelector('.art-subject');
      if (subj) brief = subj.textContent.replace(/\s+/g, ' ').trim();
    }
    brief = truncateBriefTitleForDocNav(brief, 56);
    return brief ? String(doc.number) + ' — ' + brief : String(doc.number);
  }

  /** Strip leading "N — " from the Go to field so live search uses keywords (not the full label). */
  function docNavValueToFilterQuery(raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    var m = raw.match(/^(\d{1,3})\s*[—–-]\s*(.+)$/);
    if (m && m[2] && m[2].trim()) return m[2].trim();
    return raw;
  }

  /** Full scrollable list of all recitals (1–173) or articles (1–99), same row layout as search matches. */
  function showDocNavBrowseAllList() {
    if (!docNavNumber || !currentDoc || !docNavSuggestList) return;
    clearTimeout(docNavSuggestTimer);
    var kind = currentDoc.type === 'recital' ? 'recital' : 'article';
    var p = kind === 'recital' ? ensureRecitalsIndexForSuggest() : ensureArticlesIndexForSuggest();
    p.then(function (all) {
      if (!currentDoc || !docNavSuggestList) return;
      var mode = currentDoc.type === 'recital' ? 'recital' : 'article';
      if (mode !== kind) return;
      var sorted = all.slice().sort(function (a, b) {
        return a.number - b.number;
      });
      renderDocNavSuggestions(sorted, kind, { browseAll: true, highlightCurrent: true });
    }).catch(closeDocNavSuggestions);
  }

  /** Update prev/next document nav based on currentDoc. Show only when viewing a single article or recital. */
  function updateDocNav() {
    if (!docNav || !docNavPrev || !docNavNext || !docNavLabel) return;
    const doc = currentDoc;
    if (!doc || !doc.type || doc.number == null) {
      docNav.classList.add('hidden');
      closeDocNavSuggestions();
      return;
    }
    docNav.classList.remove('hidden');
    const isRecital = doc.type === 'recital';
    const num = doc.number;
    const minNum = isRecital ? 1 : 1;
    const maxNum = isRecital ? 173 : 99;
    const prevNum = num - 1;
    const nextNum = num + 1;

    docNavPrev.disabled = prevNum < minNum;
    docNavNext.disabled = nextNum > maxNum;
    docNavPrev.textContent = isRecital ? ('← GDPR Recital (' + prevNum + ')') : ('← GDPR Art. ' + prevNum);
    docNavNext.textContent = isRecital ? ('GDPR Recital (' + nextNum + ') →') : ('GDPR Art. ' + nextNum + ' →');
    docNavLabel.textContent = isRecital ? ('GDPR Recital (' + num + ') / 173') : ('GDPR Art. ' + num + ' / 99');
    closeDocNavSuggestions();
    if (docNavNumber) {
      docNavNumber.value = buildDocNavInputDisplay(doc);
      docNavNumber.placeholder = isRecital ? 'No. or keywords (1–173)' : 'No. or keywords (1–99)';
      var ariaBrief = truncateBriefTitleForDocNav((doc.briefTitle || '').trim(), 72);
      if (!ariaBrief && detailContent) {
        var subj = detailContent.querySelector('.art-subject');
        if (subj) ariaBrief = truncateBriefTitleForDocNav(subj.textContent, 72);
      }
      docNavNumber.setAttribute(
        'aria-label',
        (isRecital ? 'Go to GDPR recital' : 'Go to GDPR article') +
          '. Current ' +
          (isRecital ? 'GDPR recital (' + num + ')' : 'GDPR article ' + num) +
          (ariaBrief ? ': ' + ariaBrief + '.' : '.') +
          ' Type a number or keywords, or open the list.'
      );
    }
    if (docNavListToggle) {
      docNavListToggle.setAttribute(
        'aria-label',
        isRecital ? 'Browse all GDPR recitals in a list' : 'Browse all GDPR articles in a list'
      );
      docNavListToggle.setAttribute(
        'title',
        isRecital ? 'Open full list of GDPR recitals (1–173)' : 'Open full list of GDPR articles (1–99)'
      );
    }
  }

  function goToDocNumber() {
    if (!currentDoc || !docNavNumber) return;
    if (docNavSuggestActiveIndex >= 0 && docNavSuggestItems.length) {
      var pick = docNavSuggestItems[docNavSuggestActiveIndex];
      if (pick && pick.number != null) {
        closeDocNavSuggestions();
        if (currentDoc.type === 'recital') openRecital(pick.number);
        else openArticle(pick.number);
        return;
      }
    }
    const raw = docNavNumber.value.trim();
    if (!raw) return;
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const isRecital = currentDoc.type === 'recital';
    const minNum = 1;
    const maxNum = isRecital ? 173 : 99;
    if (num < minNum || num > maxNum) return;
    closeDocNavSuggestions();
    if (currentDoc.type === 'recital') openRecital(num);
    else openArticle(num);
  }

  if (docNavPrev) {
    docNavPrev.addEventListener('click', function () {
      if (!currentDoc || this.disabled) return;
      const num = currentDoc.number - 1;
      if (currentDoc.type === 'recital') openRecital(num);
      else openArticle(num);
    });
  }
  if (docNavNext) {
    docNavNext.addEventListener('click', function () {
      if (!currentDoc || this.disabled) return;
      const num = currentDoc.number + 1;
      if (currentDoc.type === 'recital') openRecital(num);
      else openArticle(num);
    });
  }
  if (docNavGo) docNavGo.addEventListener('click', goToDocNumber);
  if (docNavListToggle) {
    docNavListToggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!currentDoc) return;
      if (docNavSuggestList && !docNavSuggestList.hidden) {
        if (docNavSuggestList.classList.contains('doc-nav-suggest--browse')) {
          closeDocNavSuggestions();
          return;
        }
        docNavNumber.focus();
        showDocNavBrowseAllList();
        return;
      }
      docNavNumber.focus();
      showDocNavBrowseAllList();
    });
  }
  if (docNavNumber) {
    var docNavCombo = docNavNumber.closest('.doc-nav-goto--combobox');
    docNavNumber.addEventListener('input', scheduleDocNavSuggestions);
    docNavNumber.addEventListener('focus', function () {
      if (docNavValueToFilterQuery(docNavNumber.value).length) scheduleDocNavSuggestions();
    });
    if (docNavCombo) {
      docNavCombo.addEventListener('focusout', function () {
        setTimeout(function () {
          if (docNavCombo.contains(document.activeElement)) return;
          closeDocNavSuggestions();
        }, 180);
      });
    }
    docNavNumber.addEventListener('keydown', function (e) {
      var listOpen =
        docNavSuggestList && !docNavSuggestList.hidden && docNavSuggestItems.length > 0;
      if (e.key === 'ArrowDown') {
        if (listOpen) {
          e.preventDefault();
          docNavSuggestActiveIndex = Math.min(
            docNavSuggestItems.length - 1,
            docNavSuggestActiveIndex + 1
          );
          if (docNavSuggestActiveIndex < 0) docNavSuggestActiveIndex = 0;
          highlightDocNavSuggestOption(docNavSuggestActiveIndex);
        } else if (docNavValueToFilterQuery(docNavNumber.value).length) {
          e.preventDefault();
          refreshDocNavSuggestions();
        } else {
          e.preventDefault();
          showDocNavBrowseAllList();
        }
        return;
      }
      if (e.key === 'ArrowUp' && listOpen) {
        e.preventDefault();
        docNavSuggestActiveIndex = Math.max(0, docNavSuggestActiveIndex - 1);
        highlightDocNavSuggestOption(docNavSuggestActiveIndex);
        return;
      }
      if (e.key === 'Escape') {
        if (listOpen) {
          e.preventDefault();
          closeDocNavSuggestions();
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        goToDocNumber();
      }
    });
  }
  document.addEventListener('mousedown', function (e) {
    if (!docNavSuggestList || docNavSuggestList.hidden) return;
    var combo = docNavNumber && docNavNumber.closest('.doc-nav-goto--combobox');
    if (combo && e.target && combo.contains(e.target)) return;
    closeDocNavSuggestions();
  });

  btnBack.addEventListener('click', function () {
    citationReturnDoc = null;
    if (btnBackFromCitation) btnBackFromCitation.classList.add('hidden');
    if (lastListSection) {
      showSection(lastListSection);
      btnBack.classList.add('hidden');
      lastListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  btnBackToQuestion.addEventListener('click', function () {
    cameFromAsk = false;
    citationReturnDoc = null;
    btnBackToQuestion.classList.add('hidden');
    if (btnBackFromCitation) btnBackFromCitation.classList.add('hidden');
    document.querySelector('.tab[data-view="ask"]').click();
    askResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (btnBackFromCitation) {
    btnBackFromCitation.addEventListener('click', function () {
      if (!citationReturnDoc || citationReturnDoc.number == null || !citationReturnDoc.type) return;
      var t = citationReturnDoc.type;
      var n = citationReturnDoc.number;
      if (t === 'recital') openRecital(n, { fromCitationBack: true });
      else openArticle(n, { fromCitationBack: true });
      if (browseDetail) browseDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /** Go to homepage: switch to Browse tab and show initial placeholder */
  function goToHome() {
    closeBrowseRegMenu();
    const browseTab = document.querySelector('.tab[data-view="browse"]');
    if (browseTab && !browseTab.classList.contains('active')) {
      browseTab.click();
    }
    browsePlaceholder.classList.remove('hidden');
    browseRecitals.classList.add('hidden');
    browseChapters.classList.add('hidden');
    browseDetail.classList.add('hidden');
    btnBack.classList.add('hidden');
    btnExportPdf.classList.add('hidden');
    btnBackToQuestion.classList.add('hidden');
    if (btnBackFromCitation) btnBackFromCitation.classList.add('hidden');
    currentDoc = null;
    lastListSection = null;
    citationReturnDoc = null;
    updateBrowseSectionMenu();
  }

  const logoLink = document.getElementById('logoLink');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      e.preventDefault();
      goToHome();
    });
  }

  function truncateExcerptAtWord(s, max) {
    s = (s || '').trim();
    if (!s) return '';
    if (s.length <= max) return s;
    var cut = s.slice(0, max);
    var sp = cut.lastIndexOf(' ');
    if (sp > max * 0.55) cut = cut.slice(0, sp);
    return cut.trim() + '…';
  }

  /**
   * Topic line from API title: "Recital (1) — Foo" -> "Foo"; optional empty when only the number label exists.
   */
  function parseRecitalTopicTitle(title, fallbackNumber) {
    var t = String(title || '').trim();
    var m = t.match(/^Recital\s*\(\s*(\d+)\s*\)\s*[—–-]\s*(.+)$/i);
    if (m && m[2]) return m[2].replace(/\s+/g, ' ').trim();
    var onlyNum = t.match(/^Recital\s*\(\s*\d+\s*\)\s*$/i);
    if (onlyNum) return '';
    return t
      .replace(/^Recital\s*\(\s*\d+\s*\)\s*[—–-]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Short summary for menu cards: fixes glued clause markers, strips indexed sentences, takes ~1–2 sentences.
   */
  function summarizeRecitalBodyForCard(rawText, maxLen) {
    maxLen = maxLen || 200;
    var t = String(rawText || '')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return '';
    t = t.replace(/(\d)(Articles?|Recitals?|Arts?\.)\b/gi, '$1 $2');
    t = t.replace(/\b(Articles?)(\d{1,2})\b/gi, '$1 $2');
    t = t.replace(/\b(Recitals?)(\d{1,3})\b/gi, '$1 $2');
    t = t.replace(/\b(Arts?\.)(\d{1,2})\b/gi, '$1 $2');
    var rounds = 0;
    while (rounds++ < 14) {
      var u = t
        .replace(/^(\d{1,3})\s+(?=[A-ZÀ-ŸÄÖÆØ])/i, '')
        .replace(/^(\d{1,3})(?=[A-Za-zÀ-ŸÄÖÆØ\u2018'‘])/i, '')
        .replace(/^[\u00B9\u00B2\u00B3]+\s*/, '')
        .trim();
      if (u === t) break;
      t = u;
    }
    var out = '';
    var rest = t;
    var maxSent = 2;
    var nSent = 0;
    while (nSent < maxSent && rest && out.length < maxLen) {
      var ri = 0;
      while (ri++ < 6) {
        var stripped = rest
          .replace(/^(\d{1,3})\s+(?=[A-ZÀ-ŸÄÖÆØ])/i, '')
          .replace(/^(\d{1,3})(?=[A-Za-zÀ-ŸÄÖÆØ\u2018'‘])/i, '')
          .replace(/^[\u00B9\u00B2\u00B3]+\s*/, '')
          .trim();
        if (stripped === rest) break;
        rest = stripped;
      }
      var m = rest.match(/^[\s\S]{12,450}?[.!?](?=\s|$)/);
      if (m) {
        var sent = m[0].trim();
        out = out ? out + ' ' + sent : sent;
        rest = rest.slice(m[0].length).trim();
        nSent++;
      } else {
        if (rest && !out) out = rest;
        break;
      }
    }
    if (!out) out = rest;
    return truncateExcerptAtWord(out.replace(/\s+/g, ' ').trim(), maxLen);
  }

  function getRecitalCardSummary(r) {
    var raw = r && r.text ? String(r.text) : '';
    if (!raw) return '';
    return summarizeRecitalBodyForCard(raw, 265);
  }

  function filterRecitalsList(all, query) {
    query = String(query || '').trim().toLowerCase();
    if (!query) return all.slice();
    if (/^\d{1,3}$/.test(query)) {
      var n = parseInt(query, 10);
      return all.filter(function (r) { return r.number === n; });
    }
    var qStrip = query.replace(/^recital\s*/, '').replace(/^\(\s*|\s*\)$/g, '').trim();
    if (/^\d{1,3}$/.test(qStrip)) {
      var n2 = parseInt(qStrip, 10);
      var byNum = all.filter(function (r) { return r.number === n2; });
      if (byNum.length) return byNum;
    }
    return all.filter(function (r) {
      var title = (r.title || '').toLowerCase();
      var text = (r.text || '').toLowerCase();
      return title.indexOf(query) >= 0 || text.indexOf(query) >= 0;
    });
  }

  /** Same ideas as recital filter: number, “art.” prefixes, title + body keyword match. */
  function filterArticlesForDocNav(all, query) {
    query = String(query || '').trim().toLowerCase();
    if (!query) {
      return all.slice().sort(function (a, b) { return a.number - b.number; });
    }
    if (/^\d{1,2}$/.test(query)) {
      var n = parseInt(query, 10);
      if (n >= 1 && n <= 99) return all.filter(function (a) { return a.number === n; });
    }
    var qStrip = query
      .replace(/^article\s*/i, '')
      .replace(/^art\.?\s*/i, '')
      .trim();
    if (/^\d{1,2}$/.test(qStrip)) {
      var n2 = parseInt(qStrip, 10);
      if (n2 >= 1 && n2 <= 99) {
        var byNum = all.filter(function (a) { return a.number === n2; });
        if (byNum.length) return byNum;
      }
    }
    return all
      .filter(function (a) {
        var title = (a.title || '').toLowerCase();
        var disp = getArticleDisplayTitle(a).toLowerCase();
        var text = (a.text || '').toLowerCase();
        return title.indexOf(query) >= 0 || disp.indexOf(query) >= 0 || text.indexOf(query) >= 0;
      })
      .sort(function (a, b) { return a.number - b.number; });
  }

  function updateRecitalsCountShowing(shown, total) {
    if (!recitalsCountEl) return;
    if (!total) recitalsCountEl.textContent = '';
    else if (shown === total) recitalsCountEl.textContent = total + ' GDPR recitals';
    else recitalsCountEl.textContent = 'Showing ' + shown + ' of ' + total;
  }

  function renderRecitalsIntoList(recitals) {
    if (!recitalsList) return;
    recitalsList.setAttribute('role', 'list');
    recitalsList.setAttribute('aria-busy', 'false');
    recitalsList.innerHTML = '';
    if (!recitals.length) {
      recitalsList.removeAttribute('role');
      var empty = document.createElement('p');
      empty.className = 'recitals-empty';
      empty.setAttribute('role', 'status');
      empty.textContent =
        'No GDPR recitals match your search. Try a number between 1 and 173, or different keywords.';
      recitalsList.appendChild(empty);
      return;
    }
    recitals.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'recital-card';
      card.setAttribute('role', 'listitem');
      var topic = parseRecitalTopicTitle(r.title, r.number);
      var summary = getRecitalCardSummary(r);
      var titleHtml = topic ? '<h3 class="recital-card-title">' + escapeHtml(topic) + '</h3>' : '';
      var summaryHtml = summary
        ? '<p class="recital-card-summary">' + escapeHtml(summary) + '</p>'
        : '';
      if (!summary && !topic) {
        summaryHtml =
          '<p class="recital-card-summary recital-card-summary--placeholder">Full text opens in the reader.</p>';
      }
      var ariaLabel =
        'GDPR Recital ' + r.number + (topic ? ': ' + topic : '') + ' — open full text';
      card.innerHTML =
        '<a href="#" class="recital-card-link" data-type="recital" data-number="' +
        r.number +
        '" aria-label="' +
        escapeHtml(ariaLabel) +
        '">' +
        '<div class="recital-card-body">' +
        '<div class="recital-card-top">' +
        '<span class="recital-card-badge"><span class="recital-card-badge-label">GDPR Recital</span> <span class="recital-card-badge-num">' +
        r.number +
        '</span></span>' +
        '</div>' +
        titleHtml +
        summaryHtml +
        '</div>' +
        '<span class="recital-card-arrow" aria-hidden="true"></span></a>';
      recitalsList.appendChild(card);
    });
    recitalsList.querySelectorAll('a[data-type="recital"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openRecital(parseInt(a.dataset.number, 10));
      });
    });
  }

  function applyRecitalsFilter(query) {
    var all = recitalsDataCache || [];
    var filtered = filterRecitalsList(all, query);
    renderRecitalsIntoList(filtered);
    updateRecitalsCountShowing(filtered.length, all.length);
    if (recitalsClearSearch) {
      if (String(query || '').trim()) recitalsClearSearch.classList.remove('hidden');
      else recitalsClearSearch.classList.add('hidden');
    }
  }

  function loadRecitals() {
    if (recitalsList) {
      recitalsList.removeAttribute('role');
      recitalsList.setAttribute('aria-busy', 'true');
      recitalsList.innerHTML =
        '<div class="docs-browser-loading" role="status"><span class="docs-browser-loading-pulse" aria-hidden="true"></span> Loading GDPR recitals…</div>';
    }
    if (recitalsCountEl) recitalsCountEl.textContent = '';
    get('/api/recitals')
      .then(function (recitals) {
        recitalsDataCache = Array.isArray(recitals) ? recitals : [];
        if (recitalsSearch) recitalsSearch.value = '';
        applyRecitalsFilter('');
      })
      .catch(function () {
        recitalsDataCache = [];
        if (recitalsList) {
          recitalsList.setAttribute('aria-busy', 'false');
          recitalsList.innerHTML =
            '<p class="recitals-empty recitals-empty-error" role="alert">Could not load GDPR recitals. Check your connection and try again.</p>';
        }
        if (recitalsCountEl) recitalsCountEl.textContent = '';
      });
  }

  function resetCitationSidebarPanels() {
    document.querySelectorAll('.citations-sidebar .citation-panel.is-expanded').forEach(function (p) {
      p.classList.remove('is-expanded');
      var b = p.querySelector('.citation-panel-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  /** Counts external source rows in #citationLinks (excludes “text as of” metadata line). */
  function updateCitationOfficialSourcesCount() {
    var badge = document.getElementById('citationOfficialCount');
    if (!badge || !citationLinks) return;
    var n = 0;
    var kids = citationLinks.children;
    for (var i = 0; i < kids.length; i++) {
      var li = kids[i];
      if (li.classList && li.classList.contains('content-as-of')) continue;
      if (li.querySelector && li.querySelector('a[href]')) n++;
    }
    badge.textContent = String(n);
    badge.classList.toggle('is-empty', n === 0);
    badge.setAttribute('aria-label', n === 0 ? 'No official source links' : n + ' official source' + (n === 1 ? '' : 's'));
    var trig = document.getElementById('citationOfficialTrigger');
    if (trig) {
      trig.setAttribute(
        'aria-label',
        (n === 0 ? 'Show or hide citations and official links' : 'Show or hide citations and official links (' + n + ' sources)')
      );
    }
  }

  function initCitationSidebarCollapsibles() {
    var root = document.querySelector('.citations-sidebar');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.citation-panel-toggle');
      if (!btn || !root.contains(btn)) return;
      var panel = btn.closest('.citation-panel');
      if (!panel || !panel.classList.contains('citation-panel--collapsible')) return;
      var open = panel.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function openRecital(number, opts) {
    applyCitationNavOpts(opts);
    get('/api/recitals/' + number)
      .then(function (data) {
        return resolveSuitableArticlesForRecital(number, data.suitableArticles).then(function (suitableArticles) {
          return { data: data, suitableArticles: suitableArticles };
        });
      })
      .then(function (bundle) {
        resetCitationSidebarPanels();
        var data = bundle.data;
        var suitableArticles = bundle.suitableArticles;
        var recitalTitle = (data.title || '').trim();
        var recitalHtml = renderRecitalDocumentHtml(data.text);
        detailContent.innerHTML =
          '<div class="article-doc recital-doc">' +
          '<div class="article-separator"></div>' +
          '<p class="art-num">GDPR Recital (' + data.number + ')</p>' +
          (recitalTitle ? '<h2 class="art-subject">' + escapeHtml(recitalTitle) + '</h2>' : '') +
          '<div class="article-separator"></div>' +
          '<div class="article-body"><div class="prose">' + recitalHtml + '</div></div>' +
          '<div class="article-separator"></div>' +
          '</div>';
        var contentAsOfHtml = data.contentAsOf
          ? '<li class="content-as-of">Text as of ' + formatContentDate(data.contentAsOf) + ' from EUR-Lex consolidated version.</li>'
          : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest from EUR-Lex.</li>';
        var recNum = data.number != null ? parseInt(String(data.number), 10) : number;
        if (isNaN(recNum) || recNum < 1) recNum = number;
        /** Canonical GDPR-Info URL per recital (matches scraper / site structure); do not rely on API alone. */
        var gdprRecitalInfoUrl = 'https://gdpr-info.eu/recitals/no-' + recNum + '/';
        var eurLexUrl = data.eurLexUrl || 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679';
        citationLinks.innerHTML =
          contentAsOfHtml +
          '<li><a href="' + escapeHtml(gdprRecitalInfoUrl) + '" target="_blank" rel="noopener noreferrer">GDPR-Info – GDPR Recital (' + recNum + ')</a></li>' +
          '<li><a href="' + escapeHtml(eurLexUrl) + '" target="_blank" rel="noopener noreferrer">EUR-Lex – Regulation (EU) 2016/679</a></li>';
        updateCitationOfficialSourcesCount();
        var navBrief = parseRecitalTopicTitle(data.title, data.number);
        if (!navBrief && recitalTitle) {
          navBrief = recitalTitle.replace(/^Recital\s*\(\s*\d+\s*\)\s*[—–-]\s*/i, '').trim();
        }
        if (!navBrief && recitalTitle) {
          navBrief = recitalTitle.replace(/^Recital\s*\(\s*\d+\s*\)\s*/i, '').trim();
        }
        currentDoc = { type: 'recital', number: data.number, briefTitle: navBrief || '' };
        populateRelatedDocsForCurrentDocument(currentDoc, data.text || '', {
          suitableArticles: suitableArticles
        });
        showSection(browseDetail);
        detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        focusDetailContentForReading();
      });
  }

  function chaptersFilterGetChapterNumber() {
    var cv = chaptersFilterCategory && chaptersFilterCategory.value;
    var hv = chaptersFilterChapter && chaptersFilterChapter.value;
    var v = cv !== '' && cv != null ? cv : hv !== '' && hv != null ? hv : '';
    if (v === '') return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function chaptersFilterSyncArticleToChapter() {
    var data = window.__chaptersData;
    if (!data || !chaptersFilterArticle || chaptersFilterArticle.value === '') return;
    var an = parseInt(chaptersFilterArticle.value, 10);
    if (isNaN(an)) return;
    var art = data.articles.find(function (a) {
      return a.number === an;
    });
    if (!art || art.chapter == null) return;
    var c = String(art.chapter);
    if (chaptersFilterCategory) chaptersFilterCategory.value = c;
    if (chaptersFilterChapter) chaptersFilterChapter.value = c;
  }

  function chaptersFilterRepopulateChapterSelects() {
    var data = window.__chaptersData;
    if (!data || !chaptersFilterChapter) return;
    var chapters = data.chapters;
    var articles = data.articles;
    var articleTopics = data.articleTopics;
    var sub = chaptersFilterSubcategory && chaptersFilterSubcategory.value;
    var allowed = null;
    if (sub) {
      allowed = new Set();
      articles.forEach(function (a) {
        if (a.chapter == null) return;
        var t = articleTopics[a.number] || [];
        if (t.indexOf(sub) !== -1) allowed.add(a.chapter);
      });
    }
    var preserve = chaptersFilterChapter.value;
    chaptersFilterChapter.innerHTML = '<option value="">All GDPR chapters</option>';
    if (chaptersFilterCategory) chaptersFilterCategory.innerHTML = '<option value="">All GDPR categories</option>';
    chapters.forEach(function (ch) {
      if (allowed && !allowed.has(ch.number)) return;
      var o1 = document.createElement('option');
      o1.value = String(ch.number);
      o1.textContent = 'GDPR Chapter ' + ch.roman + ' – ' + ch.title;
      chaptersFilterChapter.appendChild(o1);
      if (chaptersFilterCategory) {
        var o2 = document.createElement('option');
        o2.value = String(ch.number);
        o2.textContent = ch.title;
        chaptersFilterCategory.appendChild(o2);
      }
    });
    if (preserve && chaptersFilterChapter.querySelector('option[value="' + preserve + '"]')) {
      chaptersFilterChapter.value = preserve;
      if (chaptersFilterCategory) chaptersFilterCategory.value = preserve;
    } else {
      chaptersFilterChapter.value = '';
      if (chaptersFilterCategory) chaptersFilterCategory.value = '';
    }
  }

  function chaptersFilterArticleOptionLabel(art) {
    var disp = getArticleDisplayTitle(art);
    var tail =
      disp && disp !== 'Article ' + art.number
        ? ' – ' + (disp.length > 52 ? disp.slice(0, 52) + '…' : disp)
        : '';
    return 'GDPR Article ' + art.number + tail;
  }

  function chaptersFilterRepopulateArticleSelect() {
    var data = window.__chaptersData;
    if (!data || !chaptersFilterArticle) return;
    var articles = data.articles;
    var articleTopics = data.articleTopics;
    var chNum = chaptersFilterGetChapterNumber();
    var sub = chaptersFilterSubcategory && chaptersFilterSubcategory.value;
    var preserve = chaptersFilterArticle.value;
    chaptersFilterArticle.innerHTML = '<option value="">All GDPR articles</option>';
    articles
      .slice()
      .sort(function (a, b) {
        return a.number - b.number;
      })
      .forEach(function (art) {
        if (chNum != null && art.chapter !== chNum) return;
        if (sub && (!articleTopics[art.number] || articleTopics[art.number].indexOf(sub) === -1)) return;
        var o = document.createElement('option');
        o.value = String(art.number);
        o.textContent = chaptersFilterArticleOptionLabel(art);
        chaptersFilterArticle.appendChild(o);
      });
    if (preserve && chaptersFilterArticle.querySelector('option[value="' + preserve + '"]')) {
      chaptersFilterArticle.value = preserve;
    } else {
      chaptersFilterArticle.value = '';
    }
  }

  function chaptersFilterComboboxOptionsFromSelect(selectEl) {
    var out = [];
    if (!selectEl) return out;
    selectEl.querySelectorAll('option').forEach(function (o) {
      out.push({ value: o.value, label: o.textContent || o.value });
    });
    return out;
  }

  function chaptersFilterComboboxSearchChapters(query) {
    var data = window.__chaptersData;
    if (!data) return [];
    var q = (query || '').trim().toLowerCase();
    if (!q) return chaptersFilterComboboxOptionsFromSelect(chaptersFilterChapter);
    var out = [{ value: '', label: 'All GDPR chapters' }];
    data.chapters.forEach(function (ch) {
      var label = 'GDPR Chapter ' + ch.roman + ' – ' + ch.title;
      var blob = (label + ' ' + ch.number + ' ' + ch.roman).toLowerCase();
      if (blob.indexOf(q) !== -1) out.push({ value: String(ch.number), label: label });
    });
    return out;
  }

  function chaptersFilterComboboxSearchCategories(query) {
    var data = window.__chaptersData;
    if (!data) return [];
    var q = (query || '').trim().toLowerCase();
    if (!q) return chaptersFilterComboboxOptionsFromSelect(chaptersFilterCategory);
    var out = [{ value: '', label: 'All GDPR categories' }];
    data.chapters.forEach(function (ch) {
      var label = ch.title;
      var blob = (label + ' ' + ch.number + ' ' + ch.roman).toLowerCase();
      if (blob.indexOf(q) !== -1) out.push({ value: String(ch.number), label: label });
    });
    return out;
  }

  function chaptersFilterComboboxSearchArticles(query) {
    var data = window.__chaptersData;
    if (!data) return [];
    var q = (query || '').trim().toLowerCase();
    if (!q) return chaptersFilterComboboxOptionsFromSelect(chaptersFilterArticle);
    var out = [{ value: '', label: 'All GDPR articles' }];
    data.articles.forEach(function (art) {
      var label = chaptersFilterArticleOptionLabel(art);
      var blob = (label + ' ' + art.number).toLowerCase();
      if (blob.indexOf(q) !== -1) out.push({ value: String(art.number), label: label });
    });
    return out;
  }

  function chaptersFilterComboboxSearchSubcategories(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return chaptersFilterComboboxOptionsFromSelect(chaptersFilterSubcategory);
    var out = [{ value: '', label: 'All GDPR sub-categories' }];
    chaptersFilterComboboxOptionsFromSelect(chaptersFilterSubcategory).forEach(function (opt) {
      if (opt.value === '') return;
      if ((opt.label || '').toLowerCase().indexOf(q) !== -1) out.push(opt);
    });
    return out;
  }

  function chaptersFilterComboboxSyncInputFromSelect(selectEl, inputEl, placeholder) {
    if (!selectEl || !inputEl) return;
    var opt = selectEl.options[selectEl.selectedIndex];
    if (!selectEl.value || !opt) {
      inputEl.value = '';
      inputEl.placeholder = placeholder;
    } else {
      inputEl.value = opt.textContent || '';
      inputEl.placeholder = placeholder;
    }
  }

  function chaptersFilterComboboxesSyncInputsFromSelects() {
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterCategory,
      document.getElementById('chaptersFilterCategoryInput'),
      'All GDPR categories'
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterSubcategory,
      document.getElementById('chaptersFilterSubcategoryInput'),
      'All GDPR sub-categories'
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterChapter,
      document.getElementById('chaptersFilterChapterInput'),
      'All GDPR chapters'
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterArticle,
      document.getElementById('chaptersFilterArticleInput'),
      'All GDPR articles'
    );
  }

  function normalizeIndustrySectorsPayload(data) {
    if (Array.isArray(data) && data.length) return data;
    if (data && typeof data === 'object' && Array.isArray(data.sectors) && data.sectors.length) return data.sectors;
    return null;
  }

  var builtInIsicSectorsCache = null;
  /** Last-resort list if /api/industry-sectors and /industry-sectors.json both fail (offline, mis-deployed API, etc.). */
  function getBuiltInIsicSectorFallback() {
    if (builtInIsicSectorsCache) return builtInIsicSectorsCache;
    var rows = [
      ['A', 'A — Agriculture, forestry and fishing', 'agriculture forestry fishing farming'],
      ['B', 'B — Mining and quarrying', 'mining quarrying extraction'],
      ['C', 'C — Manufacturing', 'manufacturing factory production'],
      ['D', 'D — Electricity, gas, steam and air conditioning supply', 'energy utility electricity gas power'],
      ['E', 'E — Water supply; sewerage, waste management and remediation', 'water waste sewage environmental'],
      ['F', 'F — Construction', 'construction building civil engineering'],
      ['G', 'G — Wholesale and retail trade', 'retail wholesale commerce ecommerce'],
      ['H', 'H — Transportation and storage', 'transport logistics shipping freight'],
      ['I', 'I — Accommodation and food service activities', 'hospitality hotel restaurant tourism'],
      ['J', 'J — Information and communication', 'ICT software telecom internet digital'],
      ['K', 'K — Financial and insurance activities', 'bank insurance fintech payment'],
      ['L', 'L — Real estate activities', 'real estate property leasing'],
      ['M', 'M — Professional, scientific and technical activities', 'consulting legal accounting engineering'],
      ['N', 'N — Administrative and support service activities', 'outsourcing HR call center'],
      ['O', 'O — Public administration and defence; compulsory social security', 'government public sector defence'],
      ['P', 'P — Education', 'school university training education'],
      ['Q', 'Q — Human health and social work activities', 'healthcare hospital medical patient'],
      ['R', 'R — Arts, entertainment and recreation', 'media sports culture entertainment'],
      ['S', 'S — Other service activities', 'personal services repair services'],
      ['T', 'T — Activities of households as employers; undifferentiated goods and services', 'domestic employer household'],
      ['U', 'U — Activities of extraterritorial organisations and bodies', 'international organisation embassy']
    ];
    builtInIsicSectorsCache = [
      {
        id: 'GENERAL',
        label: 'General — no sector-specific framing',
        isicSection: null,
        searchTerms: '',
        framework: 'Default: balanced GDPR Q&A without industry emphasis.'
      }
    ];
    rows.forEach(function (r) {
      builtInIsicSectorsCache.push({
        id: r[0],
        label: r[1],
        isicSection: r[0],
        searchTerms: r[2],
        framework: 'UN ISIC Rev.4 Section ' + r[0] + '; ILO-compatible industry grouping.'
      });
    });
    return builtInIsicSectorsCache;
  }

  var industrySectorsForAskPromise = null;
  function loadIndustrySectorsForAsk() {
    if (industrySectorsForAskPromise) return industrySectorsForAskPromise;
    industrySectorsForAskPromise = get('/api/industry-sectors')
      .then(normalizeIndustrySectorsPayload)
      .then(function (arr) {
        if (!arr || !arr.length) throw new Error('empty industry sectors from API');
        return arr;
      })
      .catch(function () {
        return fetch(API + '/industry-sectors.json', { credentials: 'same-origin' })
          .then(function (r) {
            if (!r.ok) throw new Error('industry-sectors.json not available');
            return r.json();
          })
          .then(normalizeIndustrySectorsPayload)
          .then(function (arr) {
            if (!arr || !arr.length) throw new Error('empty industry-sectors.json');
            return arr;
          });
      })
      .catch(function () {
        return getBuiltInIsicSectorFallback();
      });
    return industrySectorsForAskPromise;
  }

  function initAskIndustrySectorCombobox() {
    var select = document.getElementById('askIndustrySector');
    var input = document.getElementById('askIndustrySectorInput');
    var list = document.getElementById('askIndustrySectorList');
    var toggle = document.getElementById('askIndustrySectorToggle');
    if (!select || !input || !list || !toggle) return;
    if (list.dataset.askSectorComboReady === '1') return;

    loadIndustrySectorsForAsk().then(function (sectors) {
      if (list.dataset.askSectorComboReady === '1') return;
      if (!Array.isArray(sectors) || sectors.length === 0) sectors = getBuiltInIsicSectorFallback();
      list.dataset.askSectorComboReady = '1';

        select.innerHTML = '';
        sectors.forEach(function (s) {
          var o = document.createElement('option');
          o.value = s.id;
          o.textContent = s.label;
          select.appendChild(o);
        });
        select.value = 'GENERAL';
        var g = sectors.find(function (x) {
          return x.id === 'GENERAL';
        });
        input.value = g ? g.label : '';
        input.placeholder = 'Search sectors (ISIC A–U) or General…';

        var activeIndex = -1;
        var open = false;
        var debounceTimer = null;

        function setOpen(on) {
          open = on;
          list.hidden = !on;
          input.setAttribute('aria-expanded', on ? 'true' : 'false');
          toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
        }

        function filterOpts(q) {
          var t = (q || '').trim().toLowerCase();
          if (!t) return sectors.slice();
          return sectors.filter(function (s) {
            if ((s.label || '').toLowerCase().indexOf(t) !== -1) return true;
            if (String(s.id).toLowerCase().indexOf(t) !== -1) return true;
            if (s.searchTerms && s.searchTerms.toLowerCase().indexOf(t) !== -1) return true;
            return false;
          });
        }

        function renderList() {
          var opts = filterOpts(input.value);
          list.innerHTML = '';
          activeIndex = -1;
          if (!opts.length) {
            var li0 = document.createElement('li');
            li0.className = 'filter-combobox-option filter-combobox-option--hint';
            li0.setAttribute('role', 'presentation');
            li0.textContent = 'No matches';
            list.appendChild(li0);
            return;
          }
          opts.forEach(function (opt, i) {
            var li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.id = 'askIndustrySectorList-opt-' + i;
            li.className = 'filter-combobox-option';
            li.setAttribute('data-value', opt.id);
            li.textContent = opt.label;
            li.addEventListener('mousedown', function (e) {
              e.preventDefault();
              pick(opt.id, opt.label);
            });
            list.appendChild(li);
          });
        }

        function pick(value, label) {
          select.value = value;
          input.value = label;
          setOpen(false);
          activeIndex = -1;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function highlight(idx) {
          var items = list.querySelectorAll('[role="option"]');
          items.forEach(function (el, j) {
            el.classList.toggle('filter-combobox-option--active', j === idx);
          });
          activeIndex = idx;
          if (idx >= 0 && items[idx]) {
            input.setAttribute('aria-activedescendant', items[idx].id);
          } else {
            input.removeAttribute('aria-activedescendant');
          }
        }

        function openList() {
          renderList();
          setOpen(true);
          var items = list.querySelectorAll('[role="option"]');
          var sel = select.value;
          var start = 0;
          for (var s = 0; s < items.length; s++) {
            if (items[s].getAttribute('data-value') === sel) {
              start = s;
              break;
            }
          }
          highlight(items.length ? start : -1);
        }

        function syncFromSelect() {
          var s = sectors.find(function (x) {
            return x.id === select.value;
          });
          input.value = s ? s.label : '';
        }

        toggle.addEventListener('click', function (e) {
          e.preventDefault();
          if (open) setOpen(false);
          else openList();
        });

        input.addEventListener('focus', function () {
          syncFromSelect();
        });

        input.addEventListener('input', function () {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function () {
            if (open) renderList();
            else openList();
          }, 90);
        });

        input.addEventListener('keydown', function (e) {
          var items = list.querySelectorAll('[role="option"]');
          if (e.key === 'Escape') {
            setOpen(false);
            syncFromSelect();
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) openList();
            else highlight(Math.min(activeIndex + 1, items.length - 1));
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) openList();
            else highlight(Math.max(activeIndex - 1, 0));
            return;
          }
          if (e.key === 'Enter') {
            if (open && activeIndex >= 0 && items[activeIndex]) {
              e.preventDefault();
              var el = items[activeIndex];
              pick(el.getAttribute('data-value'), el.textContent);
            }
            return;
          }
          if (e.key === 'Tab') setOpen(false);
        });

        document.addEventListener('click', function (e) {
          if (!open) return;
          var wrap = document.getElementById('askSectorComboboxWrap');
          if (wrap && !wrap.contains(e.target)) setOpen(false);
        });
    });
  }

  function initChaptersFilterComboboxes() {
    var configs = [
      {
        select: chaptersFilterCategory,
        inputId: 'chaptersFilterCategoryInput',
        listId: 'chaptersFilterCategoryList',
        toggleId: 'chaptersFilterCategoryToggle',
        placeholder: 'All GDPR categories',
        getOptions: function (q) {
          return chaptersFilterComboboxSearchCategories(q);
        }
      },
      {
        select: chaptersFilterSubcategory,
        inputId: 'chaptersFilterSubcategoryInput',
        listId: 'chaptersFilterSubcategoryList',
        toggleId: 'chaptersFilterSubcategoryToggle',
        placeholder: 'All GDPR sub-categories',
        getOptions: function (q) {
          return chaptersFilterComboboxSearchSubcategories(q);
        }
      },
      {
        select: chaptersFilterChapter,
        inputId: 'chaptersFilterChapterInput',
        listId: 'chaptersFilterChapterList',
        toggleId: 'chaptersFilterChapterToggle',
        placeholder: 'All GDPR chapters',
        getOptions: function (q) {
          return chaptersFilterComboboxSearchChapters(q);
        }
      },
      {
        select: chaptersFilterArticle,
        inputId: 'chaptersFilterArticleInput',
        listId: 'chaptersFilterArticleList',
        toggleId: 'chaptersFilterArticleToggle',
        placeholder: 'All GDPR articles',
        getOptions: function (q) {
          return chaptersFilterComboboxSearchArticles(q);
        }
      }
    ];

    configs.forEach(function (cfg) {
      if (!cfg.select) return;
      var input = document.getElementById(cfg.inputId);
      var list = document.getElementById(cfg.listId);
      var toggle = document.getElementById(cfg.toggleId);
      if (!input || !list || !toggle) return;

      var activeIndex = -1;
      var open = false;
      var debounceTimer = null;

      function setOpen(on) {
        open = on;
        list.hidden = !on;
        input.setAttribute('aria-expanded', on ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
      }

      function renderList() {
        var q = input.value;
        if (cfg.select === chaptersFilterCategory || cfg.select === chaptersFilterChapter) {
          if (!q.trim()) q = '';
        }
        var opts = cfg.getOptions(q);
        list.innerHTML = '';
        activeIndex = -1;
        if (!opts.length) {
          var li0 = document.createElement('li');
          li0.className = 'filter-combobox-option filter-combobox-option--hint';
          li0.setAttribute('role', 'presentation');
          li0.textContent = 'No matches';
          list.appendChild(li0);
          return;
        }
        opts.forEach(function (opt, i) {
          if (opt.value === '' && i > 0) return;
          var li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.id = cfg.listId + '-opt-' + i;
          li.className = 'filter-combobox-option';
          li.setAttribute('data-value', opt.value);
          li.textContent = opt.label;
          li.addEventListener('mousedown', function (e) {
            e.preventDefault();
            pick(opt.value, opt.label);
          });
          list.appendChild(li);
        });
      }

      function pick(value, label) {
        cfg.select.value = value;
        input.value = value ? label : '';
        input.placeholder = cfg.placeholder;
        setOpen(false);
        activeIndex = -1;
        cfg.select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function highlight(idx) {
        var items = list.querySelectorAll('[role="option"]');
        items.forEach(function (el, j) {
          el.classList.toggle('filter-combobox-option--active', j === idx);
        });
        activeIndex = idx;
        if (idx >= 0 && items[idx]) {
          input.setAttribute('aria-activedescendant', items[idx].id);
        } else {
          input.removeAttribute('aria-activedescendant');
        }
      }

      function openList() {
        renderList();
        setOpen(true);
        var items = list.querySelectorAll('[role="option"]');
        var sel = cfg.select.value;
        var start = 0;
        for (var s = 0; s < items.length; s++) {
          if (items[s].getAttribute('data-value') === sel) {
            start = s;
            break;
          }
        }
        highlight(items.length ? start : -1);
      }

      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        if (open) setOpen(false);
        else openList();
      });

      input.addEventListener('focus', function () {
        chaptersFilterComboboxSyncInputFromSelect(cfg.select, input, cfg.placeholder);
      });

      input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          if (open) renderList();
          else openList();
        }, 90);
      });

      input.addEventListener('keydown', function (e) {
        var items = list.querySelectorAll('[role="option"]');
        if (e.key === 'Escape') {
          setOpen(false);
          chaptersFilterComboboxSyncInputFromSelect(cfg.select, input, cfg.placeholder);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (!open) openList();
          else highlight(Math.min(activeIndex + 1, items.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (!open) openList();
          else highlight(Math.max(activeIndex - 1, 0));
          return;
        }
        if (e.key === 'Enter') {
          if (open && activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            var el = items[activeIndex];
            pick(el.getAttribute('data-value'), el.textContent);
          }
          return;
        }
        if (e.key === 'Tab') setOpen(false);
      });

      document.addEventListener('click', function (e) {
        if (!open) return;
        var wrap = input.closest('.filter-combobox');
        if (wrap && !wrap.contains(e.target)) setOpen(false);
      });
    });
  }

  function loadChapters() {
    if (chaptersArticlesGrouped) {
      chaptersArticlesGrouped.setAttribute('aria-busy', 'true');
      chaptersArticlesGrouped.innerHTML =
        '<p class="docs-browser-loading" role="status"><span class="docs-browser-loading-pulse" aria-hidden="true"></span> Loading GDPR chapters and articles…</p>';
    }
    Promise.all([
      get('/api/chapters'),
      get('/api/articles'),
      get('/api/chapter-summaries').catch(function () {
        return {};
      })
    ]).then(function (results) {
      const chapters = results[0] || [];
      const articles = results[1] || [];
      const sumRes = results[2] || {};
      window.__chapterSummaries = normalizeChapterSummariesMap(sumRes.summaries);
      const articleTopics = {};
      const topicIdsByChapter = {};
      chapters.forEach(ch => { topicIdsByChapter[ch.number] = new Set(); });
      articles.forEach(art => {
        const tids = getArticleTopicIds(art);
        articleTopics[art.number] = tids;
        tids.forEach(tid => {
          if (art.chapter != null) topicIdsByChapter[art.chapter].add(tid);
        });
      });
      window.__chaptersData = { chapters, articles, articleTopics, topicIdsByChapter };
      docNavArticlesListCache = articles;
      applyChaptersFilters();
    }).catch(() => {
      if (chaptersArticlesGrouped) {
        chaptersArticlesGrouped.setAttribute('aria-busy', 'false');
        chaptersArticlesGrouped.innerHTML = '<p class="docs-browser-loading docs-browser-loading--error" role="alert">Could not load GDPR chapters and articles. Check your connection and try again.</p>';
      }
    });
  }

  function fillChaptersSubcategoryDropdown(filterChapterNumber) {
    if (!chaptersFilterSubcategory) return;
    const data = window.__chaptersData;
    if (!data || !data.topicIdsByChapter) return;
    const selected = chaptersFilterSubcategory.value;
    chaptersFilterSubcategory.innerHTML = '<option value="">All GDPR sub-categories</option>';
    const topicSet = filterChapterNumber != null ? data.topicIdsByChapter[filterChapterNumber] : null;
    ARTICLE_TOPICS.forEach(function (t) {
      if (topicSet != null && !topicSet.has(t.id)) return;
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      chaptersFilterSubcategory.appendChild(opt);
    });
    if (selected && chaptersFilterSubcategory.querySelector('option[value="' + selected + '"]')) {
      chaptersFilterSubcategory.value = selected;
    }
  }

  function applyChaptersFilters() {
    const data = window.__chaptersData;
    if (!data || !chaptersArticlesGrouped) return;
    chaptersArticlesGrouped.setAttribute('aria-busy', 'false');
    chaptersFilterSyncArticleToChapter();
    chaptersFilterRepopulateChapterSelects();
    chaptersFilterRepopulateArticleSelect();
    fillChaptersSubcategoryDropdown(chaptersFilterGetChapterNumber());

    const { chapters, articles, articleTopics } = data;
    const categoryVal = chaptersFilterCategory && chaptersFilterCategory.value !== '' ? chaptersFilterCategory.value : '';
    const chapterVal = chaptersFilterChapter && chaptersFilterChapter.value !== '' ? chaptersFilterChapter.value : '';
    const filterChapter = categoryVal !== '' ? parseInt(categoryVal, 10) : (chapterVal !== '' ? parseInt(chapterVal, 10) : null);
    const filterArticle = chaptersFilterArticle && chaptersFilterArticle.value !== '' ? parseInt(chaptersFilterArticle.value, 10) : null;
    const filterSubcategoryAfter = chaptersFilterSubcategory && chaptersFilterSubcategory.value !== '' ? chaptersFilterSubcategory.value : '';

    const byChapter = new Map();
    chapters.forEach(ch => { byChapter.set(ch.number, { chapter: ch, articles: [] }); });
    articles.forEach(art => {
      if (art.chapter == null) return;
      if (filterChapter != null && art.chapter !== filterChapter) return;
      if (filterArticle != null && art.number !== filterArticle) return;
      if (filterSubcategoryAfter && (!articleTopics[art.number] || articleTopics[art.number].indexOf(filterSubcategoryAfter) === -1)) return;
      const entry = byChapter.get(art.chapter);
      if (entry) entry.articles.push(art);
    });

    const totalArticlesByChapter = new Map();
    chapters.forEach(function (ch) {
      var n = articles.filter(function (a) {
        return a.chapter === ch.number;
      }).length;
      totalArticlesByChapter.set(ch.number, n);
    });

    const chapterSumm = window.__chapterSummaries || normalizeChapterSummariesMap(null);

    let html = '';
    const sortedChapters = chapters.slice();
    sortedChapters.forEach(ch => {
      const entry = byChapter.get(ch.number);
      const list = entry ? entry.articles.sort((a, b) => a.number - b.number) : [];
      if (list.length === 0) return;
      var totalInCh = totalArticlesByChapter.get(ch.number) || list.length;
      var countLabel =
        list.length === totalInCh
          ? list.length + ' GDPR article' + (list.length !== 1 ? 's' : '') + ' in this section'
          : 'Showing ' + list.length + ' of ' + totalInCh + ' GDPR articles (filters applied)';
      var chapterUrl =
        ch.sourceUrl ||
        ch.gdprInfoChapterUrl ||
        'https://gdpr-info.eu/chapter-' + ch.number + '/';
      var summaryText = getChapterSummaryForSection(ch.number, chapterSumm);
      if (!summaryText) {
        summaryText =
          'This GDPR chapter covers Articles ' +
          ch.articleRange +
          ' (' +
          ch.title +
          '). Open a card below for full GDPR text, or use the GDPR-Info link for the official chapter page.';
      }
      html += '<section class="chapters-group-section chapters-group-section--panel" data-chapter="' + ch.number + '" role="region" aria-label="GDPR Chapter ' + ch.roman + '">';
      html += '<header class="chapters-group-banner">';
      html += '<h3 class="chapters-group-heading"><span class="chapters-group-roman" aria-hidden="true">' + ch.roman + '</span> <span class="chapters-group-heading-text">GDPR Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</span></h3>';
      html += '<p class="chapters-group-meta">GDPR Articles ' + escapeHtml(ch.articleRange) + '</p>';
      html += '<p class="chapters-group-summary" data-chapter-summary="' + ch.number + '">' + escapeHtml(summaryText) + '</p>';
      html += '<p class="chapters-group-count" role="status">' + escapeHtml(countLabel) + '</p>';
      html +=
        '<p class="chapters-group-source"><a class="chapters-group-source-link" href="' +
        escapeHtml(chapterUrl) +
        '" target="_blank" rel="noopener noreferrer">GDPR Chapter ' +
        escapeHtml(ch.roman) +
        ' on GDPR-Info.eu</a> · <span class="chapters-group-source-hint">Authoritative GDPR chapter outline and navigation</span></p>';
      html += '</header>';
      html += '<ul class="items-list chapters-group-list" role="list">';
      list.forEach(art => {
        var disp = getArticleDisplayTitle(art);
        var titleText = escapeHtml(disp);
        var excerptHtml = '';
        var exSrc = getArticleBodyTextAfterHeading(art);
        if (exSrc && exSrc.trim() && exSrc.indexOf('(Text not extracted') !== 0) {
          excerptHtml =
            escapeHtml(exSrc.replace(/\s+/g, ' ').trim().slice(0, 200)).trim() + '…';
        } else {
          excerptHtml = escapeHtml('Open to read the full article text.');
        }
        var ariaOpen = 'Open GDPR Article ' + art.number + (disp ? ': ' + disp : '');
        html += '<li class="item-card" role="listitem">';
        html += '<a href="#" class="item-card-link" data-type="article" data-number="' + art.number + '" aria-label="' + escapeHtml(ariaOpen) + '">';
        html += '<div class="item-card-main">';
        html += '<span class="item-card-num"><span class="item-card-num-label">Art.</span> <span class="item-card-num-value">' + art.number + '</span></span>';
        html += '<span class="item-card-title">' + titleText + '</span>';
        html += '<p class="item-card-excerpt">' + excerptHtml + '</p>';
        html += '</div><span class="item-card-arrow" aria-hidden="true"></span></a></li>';
      });
      html += '</ul></section>';
    });
    if (!html) {
      html = '<p class="chapters-filter-empty excerpt" role="status">No GDPR articles match the current filters. Try changing or clearing the filters.</p>';
    }
    chaptersArticlesGrouped.innerHTML = html;
    chaptersArticlesGrouped.querySelectorAll('a.item-card-link[data-type="article"]').forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openArticle(parseInt(this.dataset.number, 10));
      });
    });
    chaptersFilterComboboxesSyncInputsFromSelects();
  }

  function openChapter(number) {
    get('/api/chapters/' + number).then(data => {
      resetCitationSidebarPanels();
      const ch = data;
      let html = '<div class="chapter-view">';
      html += '<header class="chapter-view-header">';
      html += '<h2 class="doc-heading chapter-heading">GDPR Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</h2>';
      html += '<p class="chapter-view-sources">Official sources: <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info</a> · <a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex</a></p>';
      html += '</header>';
      if (ch.articles && ch.articles.length) {
        html += '<ul class="items-list" role="list">';
        ch.articles.forEach(art => {
          var disp = getArticleDisplayTitle(art);
          var titleText = escapeHtml(disp);
          var excerptHtml = '';
          var exSrcCh = getArticleBodyTextAfterHeading(art);
          if (exSrcCh && exSrcCh.trim() && exSrcCh.indexOf('(Text not extracted') !== 0) {
            excerptHtml =
              escapeHtml(exSrcCh.replace(/\s+/g, ' ').trim().slice(0, 200)).trim() + '…';
          } else {
            excerptHtml = escapeHtml('Open to read the full article text.');
          }
          var ariaOpen = 'Open GDPR Article ' + art.number + (disp ? ': ' + disp : '');
          html += '<li class="item-card" role="listitem">';
          html += '<a href="#" class="item-card-link" data-type="article" data-number="' + art.number + '" aria-label="' + escapeHtml(ariaOpen) + '">';
          html += '<div class="item-card-main">';
          html += '<span class="item-card-num"><span class="item-card-num-label">Art.</span> <span class="item-card-num-value">' + art.number + '</span></span>';
          html += '<span class="item-card-title">' + titleText + '</span>';
          html += '<p class="item-card-excerpt">' + excerptHtml + '</p>';
          html += '</div><span class="item-card-arrow" aria-hidden="true"></span></a></li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="chapter-empty">GDPR article text will appear after refreshing sources. <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">Read on GDPR-Info</a>.</p>';
      }
      html += '</div>';
      detailContent.innerHTML = html;
      citationLinks.innerHTML = '<li><a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – GDPR Chapter ' + ch.roman + '</a></li><li><a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Full GDPR text</a></li>';
      updateCitationOfficialSourcesCount();
      if (relatedArticles) relatedArticles.innerHTML = '';
      if (relatedRecitals) relatedRecitals.innerHTML = '';
      updateRelatedPanelsCountBadge(0, 0);
      currentDoc = null;
      showSection(browseDetail);
      detailContent.querySelectorAll('a.item-card-link[data-type="article"]').forEach(a => {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          openArticle(parseInt(this.dataset.number, 10));
        });
      });
      detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      focusDetailContentForReading();
    });
  }

  function openArticle(number, opts) {
    applyCitationNavOpts(opts);
    get('/api/articles/' + number)
      .then(function (data) {
        return resolveSuitableRecitalsForArticle(number, data.suitableRecitals).then(function (suitableRecitals) {
          return { data: data, suitableRecitals: suitableRecitals };
        });
      })
      .then(function (bundle) {
        resetCitationSidebarPanels();
        var data = bundle.data;
        var suitableRecitals = bundle.suitableRecitals;
        var displayTitle = getArticleDisplayTitle(data);
        const title = escapeHtml(displayTitle);
        const rawText = (data.text || '').trim();
        const isPlaceholderOrEmpty = !rawText || rawText.indexOf('(Text not extracted') === 0;
        var bodyHtml = '';
        if (isPlaceholderOrEmpty) {
          bodyHtml = '<div class="article-point point-plain"><span class="point-text article-unavailable">Full text for this article was not extracted from the source. Please refer to the official links below for the authoritative text.</span></div>';
        } else {
          var textToParse = stripLeadingArticleHeadingFromBody(data.number, data.title, displayTitle, rawText);
          var manual = renderManualNumberedParagraphs(textToParse);
          if (manual) {
            bodyHtml = manual;
          } else {
            var auto = renderAutoArticleBody(data.number, textToParse);
            if (auto) {
              bodyHtml = auto;
            } else {
              bodyHtml =
                '<div class="article-point point-plain"><span class="point-text">' +
                injectRegulationCitationLinks(
                  formatInlineFootnotes(escapeHtml(stripParentheticalRecitalsFromArticlePlain(textToParse)))
                ) +
                '</span></div>';
            }
          }
        }
        detailContent.innerHTML =
          '<div class="article-doc">' +
          '<div class="article-separator"></div>' +
          '<p class="art-num">Art. ' + data.number + ' GDPR</p>' +
          '<h2 class="art-subject">' + title + '</h2>' +
          '<div class="article-separator"></div>' +
          '<div class="article-body">' + bodyHtml + '</div>' +
          '<div class="article-separator"></div>' +
          '</div>';
        var contentAsOfHtml = data.contentAsOf
          ? '<li class="content-as-of">Text as of ' + formatContentDate(data.contentAsOf) + ' from EUR-Lex consolidated version.</li>'
          : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest from EUR-Lex.</li>';
        citationLinks.innerHTML =
          contentAsOfHtml +
          '<li><a href="' + data.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – GDPR Article ' + data.number + '</a></li>' +
          '<li><a href="' + data.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Regulation (EU) 2016/679</a></li>';
        updateCitationOfficialSourcesCount();
        var artBrief = (displayTitle || '').trim();
        if (/^Article\s+\d+\s*$/i.test(artBrief)) artBrief = '';
        currentDoc = {
          type: 'article',
          number: data.number,
          briefTitle: artBrief
        };
        populateRelatedDocsForCurrentDocument(currentDoc, rawText, {
          suitableRecitals: suitableRecitals
        });
        showSection(browseDetail);
        detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        focusDetailContentForReading();
      });
  }

  /** GDPR-Info URLs for PDF (same patterns as browse / scraper). */
  function resolveGdprInfoProvisionUrlForPdf(type, numStr) {
    var n = parseInt(String(numStr), 10);
    if (isNaN(n) || n < 1) return '';
    if (type === 'recital') {
      if (n > 173) return '';
      return 'https://gdpr-info.eu/recitals/no-' + n + '/';
    }
    if (type === 'article') {
      if (n > 99) return '';
      return 'https://gdpr-info.eu/art-' + n + '-gdpr/';
    }
    return '';
  }

  function convertInAppLinksForPdfClone(root) {
    if (!root) return;
    root.querySelectorAll('a[data-type][data-number]').forEach(function (a) {
      var t = a.getAttribute('data-type');
      var n = a.getAttribute('data-number');
      if (!t || n == null) return;
      var url = resolveGdprInfoProvisionUrlForPdf(t, n);
      if (!url) return;
      var href = a.getAttribute('href') || '';
      if (href === '#' || href === '' || href.indexOf('javascript:') === 0) {
        a.setAttribute('href', url);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function pdfRelatedListHasExportableItems(ul) {
    if (!ul || ul.children.length === 0) return false;
    var first = ul.children[0];
    if (first.classList.contains('related-panel-empty')) return false;
    if (first.classList.contains('related-panel-loading')) return false;
    return true;
  }

  function cloneElementForPdfExport(el, listClass) {
    var copy = el.cloneNode(true);
    convertInAppLinksForPdfClone(copy);
    copy.className = listClass;
    copy.removeAttribute('id');
    return copy;
  }

  /**
   * Build a print-oriented document: main provision text only, then optional
   * official sources + related articles/recitals (no UI chrome).
   */
  function buildPdfExportElement() {
    var wrap = document.createElement('div');
    wrap.className = 'pdf-export-root';

    var kicker = document.createElement('p');
    kicker.className = 'pdf-export-kicker';
    kicker.textContent = 'Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR)';
    wrap.appendChild(kicker);

    var articleDoc = detailContent.querySelector('.article-doc');
    if (!articleDoc) {
      var fallback = document.createElement('div');
      fallback.className = 'pdf-export-fallback';
      fallback.appendChild(detailContent.cloneNode(true));
      convertInAppLinksForPdfClone(fallback);
      wrap.appendChild(fallback);
      return wrap;
    }

    var mainClone = articleDoc.cloneNode(true);
    convertInAppLinksForPdfClone(mainClone);
    mainClone.classList.add('pdf-export-article');

    var docShell = document.createElement('div');
    docShell.className = 'pdf-export-document';
    docShell.appendChild(mainClone);
    wrap.appendChild(docShell);

    var hasOfficial = citationLinks && citationLinks.children.length > 0;
    var hasArts = pdfRelatedListHasExportableItems(relatedArticles);
    var hasRecs = pdfRelatedListHasExportableItems(relatedRecitals);

    if (!hasOfficial && !hasArts && !hasRecs) {
      return wrap;
    }

    var refSection = document.createElement('section');
    refSection.className = 'pdf-export-references';

    var refPreface = document.createElement('div');
    refPreface.className = 'pdf-export-references-preface';

    var refH = document.createElement('h2');
    refH.className = 'pdf-export-references-title';
    refH.textContent = 'Sources and cross-references';

    var refLead = document.createElement('p');
    refLead.className = 'pdf-export-references-lead';
    refLead.textContent =
      'Authoritative online sources for the consolidated text, plus related articles and recitals referenced from this provision. Links open the corresponding pages on GDPR-Info (unofficial but widely used) where available.';
    refPreface.appendChild(refH);
    refPreface.appendChild(refLead);
    refSection.appendChild(refPreface);

    if (hasOfficial) {
      var hOff = document.createElement('h3');
      hOff.className = 'pdf-export-references-subtitle';
      hOff.textContent = 'Official sources and document freshness';
      refSection.appendChild(hOff);
      refSection.appendChild(cloneElementForPdfExport(citationLinks, 'pdf-export-ref-list pdf-export-ref-list--official'));
    }

    if (hasArts) {
      var hA = document.createElement('h3');
      hA.className = 'pdf-export-references-subtitle';
      hA.textContent = 'Related GDPR articles';
      refSection.appendChild(hA);
      refSection.appendChild(cloneElementForPdfExport(relatedArticles, 'pdf-export-ref-list pdf-export-ref-list--articles'));
    }

    if (hasRecs) {
      var hR = document.createElement('h3');
      hR.className = 'pdf-export-references-subtitle';
      hR.textContent = 'Related GDPR recitals';
      refSection.appendChild(hR);
      refSection.appendChild(cloneElementForPdfExport(relatedRecitals, 'pdf-export-ref-list pdf-export-ref-list--recitals'));
    }

    wrap.appendChild(refSection);
    return wrap;
  }

  /**
   * Export as PDF via the browser print pipeline (vector / native pagination at line boundaries).
   * html2pdf+html2canvas rasterizes a tall bitmap and slices it into pages, which chops lines — avoided here.
   */
  function exportCurrentDocumentToPdf() {
    if (!currentDoc) return;
    var mount = document.getElementById('pdfPrintMount');
    if (!mount) return;

    mount.innerHTML = '';
    mount.appendChild(buildPdfExportElement());
    document.body.classList.add('is-pdf-export-print');

    var cleaned = false;
    function cleanupPdfExportPrint() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('is-pdf-export-print');
      mount.innerHTML = '';
      btnExportPdf.disabled = false;
      btnExportPdf.textContent = 'Export PDF';
      window.removeEventListener('afterprint', cleanupPdfExportPrint);
      if (printMqRemove) printMqRemove();
    }

    var printMqRemove = null;
    var pm = window.matchMedia && window.matchMedia('print');
    if (pm && pm.addEventListener) {
      var onPrintMq = function () {
        if (!pm.matches) cleanupPdfExportPrint();
      };
      pm.addEventListener('change', onPrintMq);
      printMqRemove = function () {
        pm.removeEventListener('change', onPrintMq);
      };
    } else if (pm && pm.addListener) {
      var onPrintMqLegacy = function () {
        if (!pm.matches) cleanupPdfExportPrint();
      };
      pm.addListener(onPrintMqLegacy);
      printMqRemove = function () {
        pm.removeListener(onPrintMqLegacy);
      };
    }

    window.addEventListener('afterprint', cleanupPdfExportPrint);

    btnExportPdf.disabled = true;
    btnExportPdf.textContent = 'Preparing…';

    var runPrint = function () {
      btnExportPdf.textContent = 'Print dialog…';
      try {
        window.print();
      } catch (e) {
        cleanupPdfExportPrint();
      }
    };

    void mount.offsetHeight;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(runPrint).catch(runPrint);
    } else {
      requestAnimationFrame(runPrint);
    }

    /* If afterprint / matchMedia are unavailable, avoid leaving the UI stuck disabled. */
    setTimeout(function () {
      if (!cleaned && btnExportPdf.disabled && pm && !pm.matches) {
        cleanupPdfExportPrint();
      }
    }, 2500);
  }

  btnExportPdf.addEventListener('click', exportCurrentDocumentToPdf);

  function activateBrowseRegulationSegment(seg) {
    closeBrowseRegMenu();
    if (seg === 'recitals') {
      if (viewBrowse && !viewBrowse.classList.contains('active')) {
        const main = document.getElementById('tabBrowseMain');
        if (main) main.click();
      }
      showSection(browseRecitals);
      loadRecitals();
    } else if (seg === 'chapters') {
      if (viewBrowse && !viewBrowse.classList.contains('active')) {
        const main = document.getElementById('tabBrowseMain');
        if (main) main.click();
      }
      showSection(browseChapters);
      loadChapters();
    }
  }

  const browseRegMenu = document.getElementById('browseRegMenu');
  if (browseRegMenu) {
    browseRegMenu.querySelectorAll('[data-browse-segment]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const seg = this.getAttribute('data-browse-segment');
        activateBrowseRegulationSegment(seg);
      });
    });
  }

  const browseQuickRecitals = document.getElementById('browseQuickRecitals');
  const browseQuickChapters = document.getElementById('browseQuickChapters');
  if (browseQuickRecitals) {
    browseQuickRecitals.addEventListener('click', function () {
      activateBrowseRegulationSegment('recitals');
    });
  }
  if (browseQuickChapters) {
    browseQuickChapters.addEventListener('click', function () {
      activateBrowseRegulationSegment('chapters');
    });
  }

  /** From Ask results: switch to Browse and open the given article or recital */
  document.body.addEventListener('click', function (e) {
    const a = e.target.closest('a.app-goto-doc');
    if (!a) return;
    e.preventDefault();
    const type = (a.getAttribute('data-type') || '').trim();
    const num = parseInt(a.getAttribute('data-number'), 10);
    if (!type || num !== num /* NaN */) return;
    if (a.classList.contains('from-ask')) cameFromAsk = true;
    const fromInTextCitation =
      !a.classList.contains('from-ask') &&
      !cameFromAsk &&
      a.classList.contains('regulation-citation') &&
      currentDoc &&
      (currentDoc.type === 'article' || currentDoc.type === 'recital');
    const citationReturn = fromInTextCitation
      ? { type: currentDoc.type, number: currentDoc.number }
      : null;
    const browseTab = document.querySelector('.tab[data-view="browse"]');
    if (browseTab) browseTab.click();
    setTimeout(function () {
      const openOpts = citationReturn ? { citationReturn } : {};
      if (type === 'recital') openRecital(num, openOpts);
      else if (type === 'article') openArticle(num, openOpts);
    }, 0);
  });

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /** Normalize regulation text for readable display: collapse huge gaps, keep (a)(b)(c) and (Recital N) with their content */
  function normalizeAnswerText(text) {
    if (!text || typeof text !== 'string') return '';
    var t = text.trim();
    if (!t) return '';
    // Collapse 3+ newlines (with optional spaces) to a single double newline
    t = t.replace(/\n\s*\n\s*\n+/g, '\n\n');
    // Join lettered sub-points on their own line with the next line: "(a)\n\n describe" -> "(a) describe"
    t = t.replace(/\n\s*\(([a-z])\)\s*\n\s*/g, ' ($1) ');
    // Join "(Recital N)" on its own line with the following line to avoid huge gaps
    t = t.replace(/\n\s*\((Recital \d+)\)\s*\n\s*/g, ' ($1) ');
    // Collapse multiple spaces into one (optional, keeps single spaces)
    t = t.replace(/[ \t]+/g, ' ');
    // Trim spaces around newlines
    t = t.replace(/\n /g, '\n').replace(/ \n/g, '\n');
    // Final pass: collapse any remaining 3+ newlines
    return t.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
  }

  /** Remove duplicate title at start of excerpt when it matches the provision title */
  function stripDuplicateTitle(excerpt, title) {
    if (!excerpt || !title) return excerpt;
    var titleTrim = title.trim();
    if (!titleTrim) return excerpt;
    if (excerpt.indexOf(titleTrim) === 0) {
      return excerpt.slice(titleTrim.length).replace(/^\s*\n+\s*/, '').trim();
    }
    var firstLine = excerpt.split('\n')[0].trim();
    if (firstLine === titleTrim) {
      return excerpt.replace(new RegExp('^' + firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n?'), '').trim();
    }
    return excerpt;
  }

  function formatContentDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function excerptPlain(text, maxLen) {
    if (!text) return '';
    var t = String(text).replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (t.length <= maxLen) return t;
    return t.slice(0, Math.max(0, maxLen - 1)).trim() + '…';
  }

  /** One-line topic for related-article / related-recital cards (sidebar). */
  function shortenTitleForRelatedPanel(raw, maxLen) {
    maxLen = maxLen || 52;
    var t = String(raw || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return '';
    if (t.length <= maxLen) return t;
    var cut = t.slice(0, maxLen);
    var sp = cut.lastIndexOf(' ');
    if (sp > maxLen * 0.5) cut = cut.slice(0, sp);
    return cut.trim() + '…';
  }

  /**
   * Short, readable blurb for sidebar “Related …” cards — avoids long mid-sentence cuts and EUR-Lex noise.
   */
  function summarizeProvisionForRelatedPanel(rawText, provisionTitle) {
    if (!rawText || String(rawText).trim().indexOf('(Text not extracted') === 0) return '';
    var t = String(rawText).replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (provisionTitle && String(provisionTitle).trim()) {
      t = stripDuplicateTitle(t, provisionTitle) || t;
    }
    t = t
      .replace(/^\d{1,3}(?=[A-ZÀ-ŸÄÖÆØa-z])/,'')
      .replace(/^[\u00B9\u00B2\u00B3]+\s*/, '')
      .trim();
    if (!t) return '';

    var maxChars = 72;
    var maxWords = 12;
    var oneSent = t.match(/^.{1,160}?[.!?](?=\s|$)/);
    var out = (oneSent ? oneSent[0] : t).trim();
    if (out.length > maxChars || out.split(/\s+/).length > maxWords) {
      out = excerptPlain(out, maxChars);
      var w = out.replace(/\s*…\s*$/, '').split(/\s+/);
      if (w.length > maxWords) {
        out = w.slice(0, maxWords).join(' ') + '…';
      }
    }
    return out;
  }

  function extractRelevantProvisionsFromText(rawText) {
    var text = String(rawText || '');
    var articles = new Set();
    var recitals = new Set();

    function addRange(set, a, b, min, max) {
      a = parseInt(a, 10);
      b = parseInt(b, 10);
      if (isNaN(a) || isNaN(b)) return;
      if (a > b) { var t = a; a = b; b = t; }
      if (a < min) a = min;
      if (b > max) b = max;
      for (var i = a; i <= b; i++) set.add(i);
    }

    function addList(set, listText, min, max) {
      if (!listText) return;
      var m;
      var re = /\d{1,3}/g;
      while ((m = re.exec(listText))) {
        var n = parseInt(m[0], 10);
        if (!isNaN(n) && n >= min && n <= max) set.add(n);
      }
    }

    // Article ranges (to/–/-)
    text.replace(/\b(?:Articles?|Arts?\.)\s*(\d{1,2})\s*(?:to|[–-])\s*(\d{1,2})\b/gi, function (_, a, b) {
      addRange(articles, a, b, 1, 99);
      return _;
    });
    // Recital ranges
    text.replace(/\bRecitals?\s*(\d{1,3})\s*(?:to|[–-])\s*(\d{1,3})\b/gi, function (_, a, b) {
      addRange(recitals, a, b, 1, 173);
      return _;
    });

    // Article lists: "9, 10", "9, Article 10", "46 or 47", etc.
    var articleListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Articles?\\s+)?';
    var articleListTail = '(?:' + articleListSep + '\\d{1,2})+';
    text.replace(new RegExp('\\bArticles?\\s+((?:\\d{1,2})' + articleListTail + ')\\b', 'gi'), function (_, list) {
      addList(articles, list, 1, 99);
      return _;
    });
    text.replace(new RegExp('\\bArts?\\.\\s*((?:\\d{1,2})' + articleListTail + ')\\b', 'gi'), function (_, list) {
      addList(articles, list, 1, 99);
      return _;
    });
    // Recital lists (incl. "Recital 5, Recital 6")
    var recitalListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Recitals?\\s+)?';
    var recitalListTail = '(?:' + recitalListSep + '\\d{1,3})+';
    text.replace(new RegExp('\\bRecitals?\\s+((?:\\d{1,3})' + recitalListTail + ')\\b', 'gi'), function (_, list) {
      addList(recitals, list, 1, 173);
      return _;
    });

    // Singles (incl. Article 9(2)(a), broken "Article 9(2")
    text.replace(
      new RegExp('\\b(?:Article|Articles)\\s+(\\d{1,2})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi'),
      function (_, n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= 99) articles.add(x);
        return _;
      }
    );
    text.replace(
      new RegExp('\\bArts?\\.\\s*(\\d{1,2})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi'),
      function (_, n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= 99) articles.add(x);
        return _;
      }
    );
    text.replace(/\bRecital\s*\(?\s*(\d{1,3})\s*\)?\b/gi, function (_, n) {
      var y = parseInt(n, 10);
      if (!isNaN(y) && y >= 1 && y <= 173) recitals.add(y);
      return _;
    });

    return { articles: articles, recitals: recitals };
  }

  function renderRelatedDocsListItems(items, kind) {
    var emptyMsg =
      kind === 'article'
        ? 'No related articles (none cited here and no suggestions for this recital).'
        : 'No related recitals (none cited here and no suggestions for this article).';
    if (!items || !items.length) return '<li class="related-panel-empty">' + emptyMsg + '</li>';
    return items.map(function (it) {
      var numLabel = it.type === 'recital' ? 'Recital ' + it.number : 'Art. ' + it.number;
      var topicRaw =
        it.type === 'recital'
          ? parseRecitalTopicTitle(it.title, it.number) || ''
          : String(it.title || '').trim();
      var topicShort = shortenTitleForRelatedPanel(topicRaw, it.type === 'recital' ? 56 : 50);
      var desc = it.desc ? escapeHtml(it.desc) : '';
      var openTitle =
        'Open ' + (it.type === 'recital' ? 'Recital' : 'Article') + ' ' + it.number + ' in this app';
      var openTitleEsc = escapeHtml(openTitle);
      var inner =
        '<span class="related-doc-num">' +
        escapeHtml(numLabel) +
        '</span>' +
        (topicShort
          ? '<span class="related-doc-topic">' + escapeHtml(topicShort) + '</span>'
          : '');
      return (
        '<li class="related-doc-item" role="listitem">' +
        '<a href="#" class="app-goto-doc regulation-citation citation-in-app related-doc-link" data-type="' +
        escapeHtml(it.type) +
        '" data-number="' +
        String(it.number) +
        '" title="' +
        openTitleEsc +
        '" aria-label="' +
        openTitleEsc +
        '">' +
        inner +
        '</a>' +
        (desc ? '<div class="related-doc-desc">' + desc + '</div>' : '') +
        '</li>'
      );
    }).join('');
  }

  function updateRelatedPanelsCountBadge(articleCount, recitalCount) {
    var ba = document.getElementById('relatedArticlesCount');
    var br = document.getElementById('relatedRecitalsCount');
    if (ba) {
      ba.textContent = String(articleCount);
      ba.classList.toggle('is-empty', articleCount === 0);
      ba.setAttribute('aria-label', articleCount === 0 ? 'No related GDPR articles' : articleCount + ' related GDPR articles');
    }
    if (br) {
      br.textContent = String(recitalCount);
      br.classList.toggle('is-empty', recitalCount === 0);
      br.setAttribute('aria-label', recitalCount === 0 ? 'No related GDPR recitals' : recitalCount + ' related GDPR recitals');
    }
  }

  function populateRelatedDocsForCurrentDocument(doc, rawText, crossRefOpts) {
    if (!relatedArticles || !relatedRecitals) return;
    if (!doc || !doc.type || doc.number == null) {
      relatedArticles.innerHTML = '';
      relatedRecitals.innerHTML = '';
      updateRelatedPanelsCountBadge(0, 0);
      return;
    }
    var extracted = extractRelevantProvisionsFromText(rawText);
    if (doc.type === 'article') extracted.articles.delete(doc.number);
    if (doc.type === 'recital') extracted.recitals.delete(doc.number);

    if (crossRefOpts && doc.type === 'article' && Array.isArray(crossRefOpts.suitableRecitals)) {
      crossRefOpts.suitableRecitals.forEach(function (n) {
        var y = parseInt(n, 10);
        if (!isNaN(y) && y >= 1 && y <= 173) extracted.recitals.add(y);
      });
    }
    if (crossRefOpts && doc.type === 'recital' && Array.isArray(crossRefOpts.suitableArticles)) {
      crossRefOpts.suitableArticles.forEach(function (n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= 99) extracted.articles.add(x);
      });
    }

    var articleNums = Array.from(extracted.articles).sort(function (a, b) { return a - b; });
    var recitalNums = Array.from(extracted.recitals).sort(function (a, b) { return a - b; });

    var MAX_ARTICLES = 12;
    var MAX_RECITALS = 16;
    var artRefs = articleNums.slice(0, MAX_ARTICLES).map(function (n) { return { type: 'article', number: n }; });
    var recRefs = recitalNums.slice(0, MAX_RECITALS).map(function (n) { return { type: 'recital', number: n }; });

    if (!artRefs.length && !recRefs.length) {
      relatedArticles.innerHTML = renderRelatedDocsListItems([], 'article');
      relatedRecitals.innerHTML = renderRelatedDocsListItems([], 'recital');
      updateRelatedPanelsCountBadge(0, 0);
      return;
    }

    updateRelatedPanelsCountBadge(artRefs.length, recRefs.length);

    relatedArticles.innerHTML =
      artRefs.length
        ? '<li class="related-panel-loading" role="status">Loading GDPR articles…</li>'
        : renderRelatedDocsListItems([], 'article');
    relatedRecitals.innerHTML =
      recRefs.length
        ? '<li class="related-panel-loading" role="status">Loading GDPR recitals…</li>'
        : renderRelatedDocsListItems([], 'recital');

    var fetches = [];
    artRefs.forEach(function (ref) {
      fetches.push(
        get('/api/articles/' + ref.number).then(function (data) {
          var title = getArticleDisplayTitle(data);
          var bodyForSummary = getArticleBodyTextAfterHeading(data) || data.text || '';
          var desc = summarizeProvisionForRelatedPanel(bodyForSummary, title);
          return { kind: 'article', item: { type: 'article', number: ref.number, title: title, desc: desc } };
        }).catch(function () {
          return { kind: 'article', item: { type: 'article', number: ref.number, title: '', desc: '' } };
        })
      );
    });
    recRefs.forEach(function (ref) {
      fetches.push(
        get('/api/recitals/' + ref.number).then(function (data) {
          var title = (data.title || '').trim();
          var topicStrip = parseRecitalTopicTitle(title, data.number) || title;
          var desc =
            summarizeRecitalBodyForCard(data.text || '', 88) ||
            summarizeProvisionForRelatedPanel(data.text || '', topicStrip);
          return { kind: 'recital', item: { type: 'recital', number: ref.number, title: title, desc: desc } };
        }).catch(function () {
          return { kind: 'recital', item: { type: 'recital', number: ref.number, title: '', desc: '' } };
        })
      );
    });

    Promise.all(fetches).then(function (results) {
      var arts = [];
      var recs = [];
      results.forEach(function (r) {
        if (r.kind === 'article') arts.push(r.item);
        else recs.push(r.item);
      });
      arts.sort(function (a, b) { return a.number - b.number; });
      recs.sort(function (a, b) { return a.number - b.number; });
      relatedArticles.innerHTML = renderRelatedDocsListItems(arts, 'article');
      relatedRecitals.innerHTML = renderRelatedDocsListItems(recs, 'recital');
      updateRelatedPanelsCountBadge(arts.length, recs.length);
    });
  }

  /** Add line breaks and spacing around "Recital xx" references for readability */
  function formatRecitalRefs(escapedText) {
    if (!escapedText) return '';
    return escapedText
      .replace(/\((Recital\s+\d+)\)/g, '<br><span class="recital-ref">($1)</span><br>')
      .replace(/(\s)(Recital\s+\d+)(?=\s|\.|,|\)|;|$)/g, '$1<br><span class="recital-ref">$2</span>');
  }

  /**
   * EUR-Lex / consolidated HTML often encodes sub-sentences as "1Where … 2Where …" or "3Member …".
   * These are not footnotes; rendering them as <sup> duplicates bullets/numbering (e.g. Art. 8 GDPR).
   * Strip ASCII clause indexes; keep Unicode ¹²³ footnote references unchanged.
   * Skip "1 Directive …" style (rare ASCII; most sources use ¹).
   */
  function stripEurLexClauseNumberMarkers(escapedText) {
    if (!escapedText) return '';
    var t = String(escapedText);
    var notFootnote = '(?!\\s*Directive\\b)';
    // Unicode superscript clause markers (¹Where … ²In …) — same role as ASCII; not directive footnotes.
    t = t.replace(
      new RegExp('([.;?])\\s*[\u00B9\u00B2\u00B3]\s*(?=[A-ZÀ-ŸÄÖÆØ])', 'g'),
      '$1 '
    );
    t = t.replace(
      new RegExp('(^|[\\n]|<br\\s*/?>)\s*[\u00B9\u00B2\u00B3]\s*(?=[A-ZÀ-ŸÄÖÆØ])', 'gim'),
      '$1'
    );
    t = t.replace(
      new RegExp('([.;?])\\s*(\\d{1,2})(?=[A-ZÀ-ŸÄÖÆØ])' + notFootnote, 'g'),
      '$1 '
    );
    t = t.replace(
      new RegExp('(^|[\\n]|<br\\s*/?>)\\s*(\\d{1,2})(?=[A-ZÀ-ŸÄÖÆØ])' + notFootnote, 'gim'),
      '$1'
    );
    return t;
  }

  /** Normalize EU text markers; clause numbers are stripped, not shown as superscripts. */
  function formatInlineFootnotes(escapedText) {
    if (!escapedText) return '';
    return stripEurLexClauseNumberMarkers(escapedText);
  }

  /**
   * After “Article 12” / “Recital 58”, EU text often continues with “of the Charter”, “of Directive…”, etc.
   * Only link references that plausibly point to GDPR articles/recitals.
   */
  function isProbablyGdprArticleCitation(escapedText, endIndex) {
    var tail = String(escapedText).slice(endIndex, endIndex + 160).toLowerCase();
    var near = tail.slice(0, 100);
    /* EU primary-law references (Charter, TFEU, directives) — not GDPR Article numbers. */
    if (/of\s+the\s+charter\b/.test(near)) return false;
    if (/of\s+the\s+treaty\b/.test(near)) return false;
    if (/of\s+the\s+treaties\b/.test(near)) return false;
    if (/\btfeu\b/.test(near)) return false;
    if (/^\s*of\s+directive/.test(tail)) return false;
    if (/^\s*of\s+council\s+directive/.test(tail)) return false;
    if (/^\s*of\s+european\s+parliament/.test(tail)) return false;
    if (/^\s*of\s+the\s+european\s+parliament/.test(tail)) return false;
    if (/^\s*\(\s*['\u2018\u2019]?charter['\u2018\u2019]?\s*\)/.test(tail)) return false;
    return true;
  }

  function regulationCitationLink(type, num, innerEscapedHtml) {
    var kind = type === 'recital' ? 'Recital' : 'Article';
    var n = parseInt(num, 10);
    var title = 'Open ' + kind + ' ' + n + ' in this app';
    var titleEsc = escapeHtml(title);
    return (
      '<a href="#" class="app-goto-doc regulation-citation citation-in-app" data-type="' +
      escapeHtml(type) +
      '" data-number="' +
      String(num) +
      '" title="' +
      titleEsc +
      '" aria-label="' +
      titleEsc +
      '">' +
      innerEscapedHtml +
      '</a>'
    );
  }

  /**
   * escapeHtml() uses innerHTML, which serializes NBSP / narrow NBSP as entities. Citation regexes use \s*, which
   * does not match "&nbsp;", so lists like "Articles 15, 16, 18,&nbsp;19,&nbsp;20 and 21" were truncated after 18
   * (word boundary before the comma) and only the first numbers were linked (e.g. Art. 89 GDPR).
   */
  function normalizeSpaceEntitiesForCitationPlainText(text) {
    if (!text) return text;
    return String(text)
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&#x0*A0;/gi, ' ')
      .replace(/&#8239;/g, ' ')
      .replace(/&#x0*202F;/gi, ' ')
      .replace(/&ThinSpace;/gi, ' ')
      .replace(/&#8201;/g, ' ');
  }

  /**
   * EU primary-law citations (Charter, TFEU) — open authoritative EUR-Lex HTML; not the same as GDPR in-app articles.
   * @see https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12012P/TXT (Charter)
   * @see https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E/TXT (TFEU consolidated)
   */
  var EUR_LEX_CHARTER_HTML = 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:12012P/TXT';
  var EUR_LEX_TFEU_HTML = 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:12016E/TXT';

  /** GDPR Regulation (EU) 2016/679 has Articles 1–99; dual-link same number for in-app Browse. */
  var GDPR_ARTICLE_MAX = 99;

  /**
   * Charter / TFEU: first segment "Article n(…)" → GDPR Article n in-app; remainder → EUR-Lex.
   * (Escaped HTML text nodes only — do not escapeHtml(rest), it is already entity-safe.)
   */
  function wrapCharterAndTfeuCitationsInPlainText(text) {
    if (!text) return text;
    text = normalizeSpaceEntitiesForCitationPlainText(text);
    if (!/\bArticle\s+\d/i.test(text)) return text;
    /* Longer phrase first (TFEU), then Charter — avoids partial overlaps. */
    text = text.replace(
      /\bArticle\s+(\d{1,2})(\s*\(\s*\d{1,2}\s*\))?\s+of\s+the\s+Treaty\s+on\s+the\s+Functioning\s+of\s+the\s+European\s+Union(?:\s*\(\s*TFEU\s*\))?/gi,
      function (full, art, sub) {
        var n = parseInt(art, 10);
        if (n < 1 || n > 358) return full;
        var url = EUR_LEX_TFEU_HTML + '#Article_' + n;
        var extTitle = 'TFEU, Article ' + n + ' (EUR-Lex, consolidated)';
        var extLabel = 'TFEU Article ' + n + ' — opens EUR-Lex in a new tab';
        var articlePrefix = 'Article ' + art + (sub || '');
        var rest = full.slice(articlePrefix.length);
        if (n >= 1 && n <= GDPR_ARTICLE_MAX) {
          var gdpr = regulationCitationLink('article', String(n), escapeHtml(articlePrefix));
          var ext =
            '<a href="' +
            escapeHtml(url) +
            '" class="external-eu-law-link citation-external-web" target="_blank" rel="noopener noreferrer" title="' +
            escapeHtml(extTitle) +
            '" aria-label="' +
            escapeHtml(extLabel) +
            '">' +
            rest +
            '</a>';
          return '<span class="citation-charter-tfeu-dual">' + gdpr + ext + '</span>';
        }
        return (
          '<a href="' +
          escapeHtml(url) +
          '" class="external-eu-law-link citation-external-web" target="_blank" rel="noopener noreferrer" title="' +
          escapeHtml(extTitle) +
          '" aria-label="' +
          escapeHtml(extLabel) +
          '">' +
          full +
          '</a>'
        );
      }
    );
    text = text.replace(
      /\bArticle\s+(\d{1,2})(\s*\(\s*\d{1,2}\s*\))?\s+of\s+the\s+Charter(?:\s+of\s+Fundamental\s+Rights(?:\s+of\s+the\s+European\s+Union)?)?/gi,
      function (full, art, sub) {
        var n = parseInt(art, 10);
        if (n < 1 || n > 54) return full;
        var url = EUR_LEX_CHARTER_HTML + '#Article_' + n;
        var chTitle = 'EU Charter of Fundamental Rights, Article ' + n + ' (EUR-Lex)';
        var chLabel = 'EU Charter Article ' + n + ' — opens EUR-Lex in a new tab';
        var articlePrefix = 'Article ' + art + (sub || '');
        var rest = full.slice(articlePrefix.length);
        if (n >= 1 && n <= GDPR_ARTICLE_MAX) {
          var gdpr = regulationCitationLink('article', String(n), escapeHtml(articlePrefix));
          var ext =
            '<a href="' +
            escapeHtml(url) +
            '" class="external-eu-law-link citation-external-web" target="_blank" rel="noopener noreferrer" title="' +
            escapeHtml(chTitle) +
            '" aria-label="' +
            escapeHtml(chLabel) +
            '">' +
            rest +
            '</a>';
          return '<span class="citation-charter-tfeu-dual">' + gdpr + ext + '</span>';
        }
        return (
          '<a href="' +
          escapeHtml(url) +
          '" class="external-eu-law-link citation-external-web" target="_blank" rel="noopener noreferrer" title="' +
          escapeHtml(chTitle) +
          '" aria-label="' +
          escapeHtml(chLabel) +
          '">' +
          full +
          '</a>'
        );
      }
    );
    return text;
  }

  /** After GDPR links, wrap Charter / TFEU “Article n of the …” phrases (text nodes only). */
  function injectExternalEuLawCitationLinks(escapedHtml) {
    if (!escapedHtml) return '';
    var parts = String(escapedHtml).split(/(<[^>]+>)/g);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].charAt(0) === '<') continue;
      parts[i] = wrapCharterAndTfeuCitationsInPlainText(parts[i]);
    }
    return parts.join('');
  }

  /** Link “Article n”, “Art. n”, “Recital n”, “(Recital n)” inside escaped HTML text nodes only (preserves tags). */
  function injectRegulationCitationLinks(escapedHtml) {
    if (!escapedHtml) return '';
    var html = String(escapedHtml);
    var parts = html.split(/(<[^>]+>)/g);
    for (var pi = 0; pi < parts.length; pi++) {
      if (parts[pi].charAt(0) === '<') continue;
      parts[pi] = linkRegulationCitationsInEscapedTextSegment(parts[pi]);
    }
    return injectExternalEuLawCitationLinks(parts.join(''));
  }

  function linkRegulationCitationsInEscapedTextSegment(text) {
    if (!text) return text;
    text = normalizeSpaceEntitiesForCitationPlainText(text);
    /* EUR-Lex / ETL glues: "2Article 5", "Article4", "Art.6", "3Recital 12" — need separators for \b matchers. */
    text = text.replace(/\b(Articles?)(\d{1,2})\b/gi, '$1 $2');
    text = text.replace(/\b(Recitals?)(\d{1,3})\b/gi, '$1 $2');
    text = text.replace(/\b(Arts?\.)(\d{1,2})\b/gi, '$1 $2');
    text = text.replace(/(\d)(Articles?)\b/gi, '$1 $2');
    text = text.replace(/(\d)(Recitals?)\b/gi, '$1 $2');
    text = text.replace(/(\d)(Arts?\.)/gi, '$1 $2');
    var cand = [];
    function pushCandidate(start, end, type, num) {
      var n = parseInt(num, 10);
      if (type === 'recital') {
        if (n < 1 || n > 173) return;
      } else {
        if (n < 1 || n > 99) return;
      }
      if (type === 'article' && !isProbablyGdprArticleCitation(text, end)) return;
      cand.push({
        start: start,
        end: end,
        type: type,
        num: n
      });
    }

    function prefixBeforeFirstDigit(fullMatch) {
      var idx = String(fullMatch).search(/\d/);
      if (idx < 0) return fullMatch;
      return fullMatch.slice(0, idx);
    }

    function formatProvisionListWithLinks(type, nums) {
      var parts = nums.map(function (n) {
        return regulationCitationLink(type, n, String(n));
      });
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return parts[0] + ' and ' + parts[1];
      var last = parts.pop();
      return parts.join(', ') + ' and ' + last;
    }

    function pushArticleRange(start, end, n1, n2, fullMatch) {
      var a = parseInt(n1, 10);
      var b = parseInt(n2, 10);
      if (isNaN(a) || isNaN(b)) return;
      if (a < 1 || a > 99 || b < 1 || b > 99) return;
      if (a > b) {
        var t = a;
        a = b;
        b = t;
      }
      if (!isProbablyGdprArticleCitation(text, end)) return;
      cand.push({
        start: start,
        end: end,
        kind: 'expandedRange',
        type: 'article',
        n1: a,
        n2: b,
        prefix: prefixBeforeFirstDigit(fullMatch)
      });
    }

    function pushRecitalRange(start, end, n1, n2, fullMatch) {
      var a = parseInt(n1, 10);
      var b = parseInt(n2, 10);
      if (isNaN(a) || isNaN(b)) return;
      if (a < 1 || a > 173 || b < 1 || b > 173) return;
      if (a > b) {
        var t2 = a;
        a = b;
        b = t2;
      }
      if (!isProbablyGdprArticleCitation(text, end)) return;
      cand.push({
        start: start,
        end: end,
        kind: 'expandedRange',
        type: 'recital',
        n1: a,
        n2: b,
        prefix: prefixBeforeFirstDigit(fullMatch)
      });
    }

    var re;
    var m;
    /* Ranges first: expand to one in-app link per article/recital (keeps prefix, e.g. “Articles ”) */
    re = /\bArts?\.\s*(\d{1,2})\s+to\s+(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bArts?\.\s*(\d{1,2})\s*[–-]\s*(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bArticles\s+(\d{1,2})\s+to\s+(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bArticle\s+(\d{1,2})\s+to\s+(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bArticles\s+(\d{1,2})\s*[–-]\s*(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bArticle\s+(\d{1,2})\s*[–-]\s*(\d{1,2})\b/gi;
    while ((m = re.exec(text))) {
      pushArticleRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bRecitals\s+(\d{1,3})\s+to\s+(\d{1,3})\b/gi;
    while ((m = re.exec(text))) {
      pushRecitalRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bRecital\s+(\d{1,3})\s+to\s+(\d{1,3})\b/gi;
    while ((m = re.exec(text))) {
      pushRecitalRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bRecitals\s+(\d{1,3})\s*[–-]\s*(\d{1,3})\b/gi;
    while ((m = re.exec(text))) {
      pushRecitalRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }
    re = /\bRecital\s+(\d{1,3})\s*[–-]\s*(\d{1,3})\b/gi;
    while ((m = re.exec(text))) {
      pushRecitalRange(m.index, m.index + m[0].length, m[1], m[2], m[0]);
    }

    /* Lists: "9, 10" and "9, Article 10"; link each article number */
    var artListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Articles?\\s+)?';
    var artListSeg = '(?:\\d{1,2})(?:' + artListSep + '\\d{1,2})+';
    re = new RegExp('\\bArticles?\\s+(' + artListSeg + ')\\b', 'gi');
    while ((m = re.exec(text))) {
      var listText = m[1];
      var listStart = m.index + (m[0].length - listText.length);
      var nm;
      var numRe = /\d{1,2}/g;
      while ((nm = numRe.exec(listText))) {
        var s = listStart + nm.index;
        pushCandidate(s, s + nm[0].length, 'article', nm[0]);
      }
    }
    re = new RegExp('\\bArts?\\.\\s+(' + artListSeg + ')\\b', 'gi');
    while ((m = re.exec(text))) {
      listText = m[1];
      listStart = m.index + (m[0].length - listText.length);
      numRe = /\d{1,2}/g;
      while ((nm = numRe.exec(listText))) {
        s = listStart + nm.index;
        pushCandidate(s, s + nm[0].length, 'article', nm[0]);
      }
    }
    var recListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Recitals?\\s+)?';
    var recListSeg = '(?:\\d{1,3})(?:' + recListSep + '\\d{1,3})+';
    re = new RegExp('\\bRecitals?\\s+(' + recListSeg + ')\\b', 'gi');
    while ((m = re.exec(text))) {
      var rListText = m[1];
      var rListStart = m.index + (m[0].length - rListText.length);
      var rm;
      var rNumRe = /\d{1,3}/g;
      while ((rm = rNumRe.exec(rListText))) {
        var rs = rListStart + rm.index;
        pushCandidate(rs, rs + rm[0].length, 'recital', rm[0]);
      }
    }

    re = /\((Recital\s+(\d{1,3}))\)/gi;
    while ((m = re.exec(text))) {
      pushCandidate(m.index, m.index + m[0].length, 'recital', m[2]);
    }
    re = /\bRecitals?\s+(\d{1,3})\b/gi;
    while ((m = re.exec(text))) {
      var tailR = text.slice(m.index + m[0].length);
      if (/^\s*(?:(?:,\s*(?!\s*Recitals?\b)|\s+and\s+|\s+or\s+|\s*&\s+)\d{1,3}\b)/i.test(tailR)) continue;
      pushCandidate(m.index, m.index + m[0].length, 'recital', m[1]);
    }
    re = new RegExp('\\b(?:Article|Articles)\\s+(\\d{1,2})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi');
    while ((m = re.exec(text))) {
      var endIdx = m.index + m[0].length;
      var tailA = text.slice(endIdx);
      if (/^\s*(?:(?:,\s*(?!\s*Articles?\b)|\s+and\s+|\s+or\s+|\s*&\s+)\d{1,2}\b)/i.test(tailA)) continue;
      pushCandidate(m.index, endIdx, 'article', m[1]);
    }
    re = new RegExp('\\bArts?\\.\\s*(\\d{1,2})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi');
    while ((m = re.exec(text))) {
      var end2 = m.index + m[0].length;
      var tailArt = text.slice(end2);
      if (/^\s*(?:(?:,\s*(?!\s*Arts?\.)|\s+and\s+|\s+or\s+|\s*&\s+)\d{1,2}\b)/i.test(tailArt)) continue;
      pushCandidate(m.index, end2, 'article', m[1]);
    }

    cand.sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - b.start - (a.end - a.start);
    });
    var picked = [];
    cand.forEach(function (c) {
      var conflict = picked.some(function (p) {
        return c.start < p.end && c.end > p.start;
      });
      if (!conflict) picked.push(c);
    });
    picked.sort(function (a, b) {
      return a.start - b.start;
    });

    var out = '';
    var pos = 0;
    picked.forEach(function (p) {
      out += text.slice(pos, p.start);
      if (p.kind === 'expandedRange') {
        var lo = p.n1;
        var hi = p.n2;
        var nums = [];
        for (var ni = lo; ni <= hi; ni++) nums.push(ni);
        out += p.prefix + formatProvisionListWithLinks(p.type, nums);
      } else {
        out += regulationCitationLink(p.type, p.num, text.slice(p.start, p.end));
      }
      pos = p.end;
    });
    out += text.slice(pos);
    return out;
  }

  function splitByNewItemStarts(lines, isStart) {
    var out = [];
    var buf = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (isStart(l) && buf.length) {
        out.push(buf);
        buf = [];
      }
      buf.push(l);
    }
    if (buf.length) out.push(buf);
    return out;
  }

  /**
   * Strip fake “5.1.”, “7.2.”, “5.a.”, “5. (a).” prefixes (ETL / national numbering) so we never show a
   * second numeric tier beside the article paragraph number. Applied to list lines and line-starts in prose.
   */
  function stripNestedEnumerationMarkersFromLine(line) {
    var t = String(line || '').trim();
    var rounds = 0;
    while (rounds++ < 6) {
      var next = t
        .replace(/^\d{1,2}\.\d{1,2}\.?\s+/, '')
        .replace(/^\d{1,2}\.\s*\(?[a-z]\)?\.?\s+/i, '')
        .replace(/^\d{1,2}\.\s+/, '');
      if (next === t) break;
      t = next;
    }
    return t;
  }

  /** Article reader only: drop “(Recital N)” / “[Recital N]” before escape (recitals have dedicated documents). */
  function stripParentheticalRecitalsFromArticlePlain(text) {
    var t = String(text || '');
    t = t.replace(/\(\s*Recital\s+\d{1,3}\s*\)/gi, ' ');
    t = t.replace(/\[\s*Recital\s+\d{1,3}\s*\]/gi, ' ');
    t = t.replace(/[ \t]{2,}/g, ' ');
    return t.trim();
  }

  /** Line starts only (preserve mid-sentence “Art. 6(1)”-style refs). */
  function stripCompoundEnumerationAtLineStarts(raw) {
    return String(raw || '')
      .split(/\n+/)
      .map(function (ln) {
        var t = ln.trim();
        var rounds = 0;
        while (rounds++ < 4) {
          var u = t
            .replace(/^\d{1,2}\.\d{1,2}\.?\s+/, '')
            .replace(/^\d{1,2}\.\s*\(?[a-z]\)?\.?\s+/i, '');
          if (u === t) break;
          t = u;
        }
        return t;
      })
      .join('\n');
  }

  /** Before auto (a)(b)(c) markers, drop duplicate “(a) …” / “5.a.” noise from source lines. */
  function normalizeEitherAlternativeLine(line) {
    return stripNestedEnumerationMarkersFromLine(String(line || '').replace(/^\(?[a-z]\)\s+/i, '').trim());
  }

  function renderLetterListFromLines(lines) {
    var merged = mergeOrphanDigitParenLines(mergeOrphanParenLetterLines(lines || []));
    var items = merged.map(function (l) { return normalizeEitherAlternativeLine(l); }).filter(Boolean);
    if (items.length < 2) return null;
    var lis = items.map(function (txt, idx) {
      var marker = String.fromCharCode(97 + idx); // a,b,c
      var safe = injectRegulationCitationLinks(
        formatInlineFootnotes(escapeHtml(stripParentheticalRecitalsFromArticlePlain(txt)))
      );
      return '<li><span class="li-marker">(' + marker + ')</span><span class="li-text">' + safe + '</span></li>';
    }).join('');
    return '<ul class="letter-list">' + lis + '</ul>';
  }

  /** One escaped + footnoted line for article bodies (no “Recital N” chrome — see fmtRecitalLine). */
  function fmtArticleLine(raw) {
    var t = stripParentheticalRecitalsFromArticlePlain(String(raw || '').trim());
    t = stripCompoundEnumerationAtLineStarts(t);
    return injectRegulationCitationLinks(formatInlineFootnotes(escapeHtml(t)));
  }

  /** Recital documents: same as article line plus optional recital-ref line breaks for cross-refs. */
  function fmtRecitalLine(raw) {
    var t = stripCompoundEnumerationAtLineStarts(String(raw || '').trim());
    return injectRegulationCitationLinks(formatRecitalRefs(formatInlineFootnotes(escapeHtml(t))));
  }

  function fmtArticleMultiline(raw) {
    return String(raw || '')
      .split(/\n+/)
      .map(function (ln) { return ln.trim(); })
      .filter(Boolean)
      .map(fmtArticleLine)
      .join('<br>');
  }

  /** @deprecated Use `renderDocBulletList`; kept so call sites stay obvious. Nested = bullets only. */
  function renderNumericSublist(lines) {
    return renderDocBulletList(lines);
  }

  function renderManualPara(numStr, innerContentHtml) {
    return (
      '<li>' +
      '<span class="para-num">' + escapeHtml(String(numStr)) + '.</span>' +
      '<div class="para-content">' + innerContentHtml + '</div>' +
      '</li>'
    );
  }

  function renderArt5PersonalDataPrinciples(lines) {
    var idx = -1;
    for (var i = 0; i < lines.length; i++) {
      if (/^The controller shall be responsible/i.test(lines[i])) {
        idx = i;
        break;
      }
    }
    if (idx < 1) return '';
    var head = lines[0];
    var subs = lines.slice(1, idx);
    var inner1 = '<div class="para-text">' + fmtArticleLine(head) + '</div>' + renderDocBulletList(subs);
    var inner2 = '<div class="para-text">' + fmtArticleMultiline(lines.slice(idx).join('\n')) + '</div>';
    return '<ol class="art-para-list manual">' + renderManualPara('1', inner1) + renderManualPara('2', inner2) + '</ol>';
  }

  function renderArt6Paragraph3Block(block) {
    if (!block.length) return '';
    var out = '';
    var i = 0;
    var first = block[i++];
    out += '<div class="para-text">' + fmtArticleLine(first) + '</div>';
    var sub = [];
    if (/:\s*$/.test(first)) {
      while (i < block.length && /^(Union law; or|Member State law)/i.test(block[i])) {
        sub.push(block[i++]);
      }
      out += renderDocBulletList(sub);
    }
    while (i < block.length) {
      out += '<div class="para-text para-continuation">' + fmtArticleLine(block[i]) + '</div>';
      i++;
    }
    return out;
  }

  function renderArt6Lawfulness(lines) {
    var idxMember = -1;
    var idxBasis = -1;
    var idxWhere = -1;
    for (var j = 0; j < lines.length; j++) {
      if (idxMember < 0 && /^Member States may/i.test(lines[j])) idxMember = j;
      if (idxBasis < 0 && /^1The basis for the processing/i.test(lines[j])) idxBasis = j;
      if (idxWhere < 0 && /^Where the processing for a purpose other than/i.test(lines[j])) idxWhere = j;
    }
    if (idxMember < 1 || idxBasis <= idxMember || idxWhere <= idxBasis) return '';

    var block1 = lines.slice(0, idxMember);
    var block2 = lines.slice(idxMember, idxBasis);
    var block3 = lines.slice(idxBasis, idxWhere);
    var block4 = lines.slice(idxWhere);

    var head0 = block1[0];
    var pointIdx = -1;
    for (var p = 0; p < block1.length; p++) {
      if (/^Point \(f\) of the first subparagraph/i.test(block1[p])) {
        pointIdx = p;
        break;
      }
    }
    var subEnd = pointIdx >= 0 ? pointIdx : block1.length;
    var subs = block1.slice(1, subEnd);
    var inner1 = '<div class="para-text">' + fmtArticleLine(head0) + '</div>' + renderDocBulletList(subs);
    if (pointIdx >= 0) {
      inner1 +=
        '<div class="para-text para-continuation">' +
        fmtArticleMultiline(block1.slice(pointIdx).join('\n')) +
        '</div>';
    }

    var inner4Head = block4[0];
    var subs4 = block4.slice(1);
    var inner4 = '<div class="para-text">' + fmtArticleLine(inner4Head) + '</div>';
    if (subs4.length >= 2) inner4 += renderDocBulletList(subs4);
    else if (subs4.length === 1) inner4 += '<div class="para-text">' + fmtArticleLine(subs4[0]) + '</div>';

    var parts =
      renderManualPara('1', inner1) +
      renderManualPara('2', '<div class="para-text">' + fmtArticleMultiline(block2.join('\n')) + '</div>') +
      renderManualPara('3', renderArt6Paragraph3Block(block3)) +
      renderManualPara('4', inner4);

    return '<ol class="art-para-list manual">' + parts + '</ol>';
  }

  function renderArt7Consent(lines) {
    var i1 = -1;
    var i2 = -1;
    var i3 = -1;
    for (var k = 0; k < lines.length; k++) {
      if (i1 < 0 && /^1If the data subject/i.test(lines[k])) i1 = k;
      if (i2 < 0 && /^1The data subject shall have the right/i.test(lines[k])) i2 = k;
      if (i3 < 0 && /^When assessing whether consent/i.test(lines[k])) i3 = k;
    }
    if (i1 < 1 || i2 <= i1 || i3 <= i2) return '';
    var parts =
      renderManualPara('1', '<div class="para-text">' + fmtArticleMultiline(lines.slice(0, i1).join('\n')) + '</div>') +
      renderManualPara('2', '<div class="para-text">' + fmtArticleMultiline(lines.slice(i1, i2).join('\n')) + '</div>') +
      renderManualPara('3', '<div class="para-text">' + fmtArticleMultiline(lines.slice(i2, i3).join('\n')) + '</div>') +
      renderManualPara('4', '<div class="para-text">' + fmtArticleMultiline(lines.slice(i3).join('\n')) + '</div>');
    return '<ol class="art-para-list manual">' + parts + '</ol>';
  }

  /**
   * Art. 8 GDPR — ETL splits paragraph 1 across lines (“1Where… 2Where…” then “3Member…”).
   * Generic block logic treats “3Member…” as a new top-level §, yielding four numbers instead of three.
   * Merge paragraph-1 lines, split EUR-Lex clause markers, then bullet the sub-clauses.
   */
  function renderArt8ChildConsent(lines) {
    if (!lines || lines.length < 3) return '';
    var idxCtrl = -1;
    var idxPar = -1;
    for (var i = 0; i < lines.length; i++) {
      var ln = String(lines[i] || '').trim();
      if (idxCtrl < 0 && /^The controller shall make reasonable efforts to verify/i.test(ln)) idxCtrl = i;
      if (idxPar < 0 && /^Paragraph 1 shall not affect/i.test(ln)) idxPar = i;
    }
    if (idxCtrl < 1 || idxPar <= idxCtrl) return '';
    var head0 = String(lines[0] || '').trim();
    if (!/^(?:\d{1,2})?Where point \(a\) of Article 6\(1\) applies/i.test(head0)) return '';

    var para1Text = lines
      .slice(0, idxCtrl)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    var parts = splitInlineNumberedClauses(para1Text);
    if (parts.length < 2) return '';

    var inner1 = '<div class="art8-para1-inner">' + renderDocBulletList(parts) + '</div>';
    var inner2 = '<div class="para-text">' + fmtArticleMultiline(lines.slice(idxCtrl, idxPar).join('\n')) + '</div>';
    var inner3 = '<div class="para-text">' + fmtArticleMultiline(lines.slice(idxPar).join('\n')) + '</div>';

    return (
      '<ol class="art-para-list manual art8-doc">' +
      renderManualPara('1', inner1) +
      renderManualPara('2', inner2) +
      renderManualPara('3', inner3) +
      '</ol>'
    );
  }

  /**
   * Split “1First sentence 2Second sentence …” (EUR-Lex / GDPR-Info / our ETL) into clauses.
   * Uses word boundary so “Article 12” / “10 000 000” are not split.
   */
  function splitInlineNumberedClauses(text) {
    var t = String(text || '').trim();
    if (!t) return [t];
    // "1'term' … 2However" (Art. 4(9) style) — digit glued to quote or next sentence.
    t = t.replace(/(\d{1,3})(['\u2018])(?=\S)/g, '$1 $2');
    if (!/\d{1,3}(?=[A-ZÀ-ŸÄÖÆØ\u2018''])/.test(t)) return [t];
    var parts = t.split(/\s+(?=\d{1,3}(?=[A-ZÀ-ŸÄÖÆØ\u2018'']))/);
    return parts.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  /**
   * Recitals: same EUR-Lex pattern as articles (“1Those … 2Natural …”) — bullets, not a second numeric tier.
   */
  function renderRecitalDocumentHtml(rawText) {
    var t = String(rawText || '')
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    if (!t) return '';

    var paras = t.split(/\n{2,}/).map(function (p) {
      return p
        .trim()
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }).filter(Boolean);

    if (paras.length <= 1 && paras[0]) {
      var plain = paras[0];
      if (splitInlineNumberedClauses(plain).length <= 1) {
        var sentences = plain.split(/(?<=[.!?])\s+(?=(?:<sup|[A-Z0-9]))/).filter(Boolean);
        if (sentences.length >= 6) {
          paras = [];
          for (var si = 0; si < sentences.length; si += 2) {
            paras.push(sentences.slice(si, si + 2).join(' ').trim());
          }
        }
      }
    }

    if (!paras.length) {
      paras = [
        t
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      ];
    }

    return paras
      .map(function (p) {
        var parts = splitInlineNumberedClauses(p);
        if (parts.length > 1) {
          return '<div class="recital-block">' + renderDocBulletList(parts, 'recital-clause-list') + '</div>';
        }
        return '<p>' + fmtRecitalLine(p) + '</p>';
      })
      .join('');
  }

  function headEndsWithListIntro(text) {
    var t = String(text || '').trim();
    return (
      /:\s*$/.test(t) ||
      /either:\s*$/i.test(t) ||
      /following applies:?\s*$/i.test(t) ||
      /following conditions:\s*$/i.test(t) ||
      /one of the following conditions:\s*$/i.test(t) ||
      /all of the following information:?\s*$/i.test(t) ||
      /all of the following [\w\s]{3,80}:\s*$/i.test(t) ||
      /following (?:investigative|corrective|authorisation|authorization|advisory) powers:\s*$/i.test(t) ||
      /inter alia:\s*$/i.test(t) ||
      /as appropriate:\s*$/i.test(t) ||
      /take into account, inter alia:\s*$/i.test(t) ||
      /\bto safeguard:\s*$/i.test(t) ||
      /\bas to:\s*$/i.test(t)
    );
  }

  /** Start of a new top-level paragraph (GDPR-Info style) — excludes typical sub-list lines (“processing is…”, “the identity…”). */
  function shouldStartNewBlock(line) {
    var s = String(line || '').trim();
    if (!s) return false;

    if (/^Personal data shall be:/i.test(s)) return true;
    if (/^Processing shall be lawful/i.test(s)) return true;

    if (/^\d+\.\s+\S/.test(s)) return true;
    if (/^\d{1,3}['\u2018]\S/.test(s)) return true;
    if (/^\d{1,3}(?=[A-ZÀ-ŸÄÖÆØ])/.test(s)) return true;

    if (/^This Regulation /i.test(s)) return true;

    if (/^Where /i.test(s)) return true;
    if (/^If /i.test(s)) return true;
    if (/^When /i.test(s)) return true;

    if (/^Without prejudice/i.test(s)) return true;
    if (/^The Commission shall/i.test(s)) return true;
    if (/^The Commission may/i.test(s)) return true;
    if (/^A supervisory authority shall/i.test(s)) return true;
    if (/^A supervisory authority may/i.test(s)) return true;

    if (/^Taking into account/i.test(s)) return true;
    if (/^In assessing/i.test(s)) return true;
    if (/^In order to /i.test(s)) return true;

    if (/^Processing of personal data revealing/i.test(s)) return true;
    if (/^Paragraph \d+/i.test(s)) return true;

    if (/^Personal data referred/i.test(s)) return true;
    if (/^Member States may /i.test(s)) return true;
    if (/^Member States shall /i.test(s)) return true;

    if (/^Each supervisory authority/i.test(s)) return true;
    if (/^Each processor/i.test(s)) return true;

    if (/^Union or Member State law /i.test(s)) return true;

    if (/^The controller shall/i.test(s)) return true;
    if (/^The processor shall/i.test(s)) return true;
    if (/^The representative shall/i.test(s)) return true;
    if (/^The representatives shall/i.test(s)) return true;

    if (/^The controller and processor shall/i.test(s)) return true;
    if (/^The controller and the processor shall/i.test(s)) return true;

    if (/^Infringements of the following provisions/i.test(s)) return true;
    if (/^Non-compliance with an order/i.test(s)) return true;
    if (/^Non-compliance with/i.test(s)) return true;

    if (/^The contract or the other legal act/i.test(s)) return true;
    if (/^Adherence of /i.test(s)) return true;
    if (/^Adherence to /i.test(s)) return true;

    if (/^Transfers of personal data to a third country/i.test(s)) return true;
    if (/^Subject to the agreement in question/i.test(s)) return true;
    if (/^The free movement of personal data/i.test(s)) return true;

    if (/^Administrative fines shall/i.test(s)) return true;

    return false;
  }

  function genericSplitBlocks(lines) {
    var blocks = [];
    var cur = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var start = shouldStartNewBlock(line);
      if (start && cur.length) {
        var s = String(line || '').trim();
        var mergeIntoCur = false;
        var dm = s.match(/^(\d{1,3})(?=[A-ZÀ-ŸÄÖÆØ])/);
        if (dm) {
          var d = parseInt(dm[1], 10);
          if (d > 1) {
            var bag = cur.join('\n');
            if (/\beither:/i.test(bag)) mergeIntoCur = true;
          }
        }
        if (mergeIntoCur) cur.push(line);
        else {
          blocks.push(cur);
          cur = [line];
        }
      } else {
        cur.push(line);
      }
    }
    if (cur.length) blocks.push(cur);
    return blocks;
  }

  /**
   * EUR-Lex / GDPR-Info ETL often emits “(a)” on its own line with the clause body on the next line.
   * Join those so `looksLikeExplicitParenLetterLines` and letter lists match gdpr-info.eu layout.
   */
  function mergeOrphanParenLetterLines(lines) {
    var arr = (lines || []).map(function (l) {
      return String(l);
    });
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i].trim();
      var m = t.match(/^\(([a-z])\)\s*$/i);
      if (m) {
        var j = i + 1;
        while (j < arr.length && !String(arr[j]).trim()) j++;
        if (j < arr.length) {
          var next = String(arr[j]).trim();
          if (next && !/^\(([a-z])\)\s*$/i.test(next)) {
            out.push('(' + m[1].toLowerCase() + ') ' + next);
            i = j;
            continue;
          }
        }
      }
      out.push(arr[i]);
    }
    return out;
  }

  /** EUR-Lex-style “(1)” / “(2)” on their own line before the clause body. */
  function mergeOrphanDigitParenLines(lines) {
    var arr = (lines || []).map(function (l) {
      return String(l);
    });
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i].trim();
      var m = t.match(/^\((\d{1,2})\)\s*$/);
      if (m) {
        var j = i + 1;
        while (j < arr.length && !String(arr[j]).trim()) j++;
        if (j < arr.length) {
          var next = String(arr[j]).trim();
          if (next && !/^\((\d{1,2})\)\s*$/.test(next)) {
            out.push('(' + m[1] + ') ' + next);
            i = j;
            continue;
          }
        }
      }
      out.push(arr[i]);
    }
    return out;
  }

  /** Lines explicitly marked “(a) … (b) …” at line start (after trim). */
  function looksLikeExplicitParenLetterLines(lines) {
    if (lines.length < 2) return false;
    for (var i = 0; i < lines.length; i++) {
      if (!/^\([a-z]\)\s+/i.test(lines[i].trim())) return false;
    }
    return true;
  }

  function renderExplicitParenLetterLines(lines) {
    var lis = lines.map(function (line) {
      var m = line.trim().match(/^\(([a-z])\)\s*(.*)$/i);
      var marker = m ? m[1].toLowerCase() : 'a';
      var body = m ? stripNestedEnumerationMarkersFromLine(m[2]) : stripNestedEnumerationMarkersFromLine(line);
      return (
        '<li><span class="li-marker">(' + escapeHtml(marker) + ')</span><span class="li-text">' + fmtArticleLine(body) + '</span></li>'
      );
    }).join('');
    return '<ul class="letter-list">' + lis + '</ul>';
  }

  /** Art. 58-style “to order…”, “to carry out…” powers list. */
  function restLinesLookLikeBulletInfinitives(lines) {
    if (lines.length < 2) return false;
    for (var i = 0; i < lines.length; i++) {
      if (!/^to [a-zà-ÿ]/i.test(lines[i].trim())) return false;
    }
    return true;
  }

  /** Strip duplicate / compound enumeration at list line starts (see stripNestedEnumerationMarkersFromLine). */
  function stripDuplicateEnumerationPrefix(line) {
    return stripNestedEnumerationMarkersFromLine(line);
  }

  function renderDocBulletList(lines, extraListClass) {
    var merged = mergeOrphanDigitParenLines(mergeOrphanParenLetterLines((lines || []).slice()));
    if (merged.length >= 2 && looksLikeExplicitParenLetterLines(merged.map(function (l) { return String(l).trim(); }))) {
      return renderExplicitParenLetterLines(merged.map(function (l) { return String(l).trim(); }));
    }
    var fmtLine = extraListClass === 'recital-clause-list' ? fmtRecitalLine : fmtArticleLine;
    var lis = merged.map(function (line) {
      var cleaned = stripDuplicateEnumerationPrefix(line);
      return '<li class="doc-bullet-item"><span class="li-text">' + fmtLine(cleaned) + '</span></li>';
    }).join('');
    var listCls = 'doc-bullet-list' + (extraListClass ? ' ' + extraListClass : '');
    return '<ul class="' + listCls + '">' + lis + '</ul>';
  }

  /** Short semicolon-separated policy lines (Art. 23(1) safeguards) — not Art. 49 transfer conditions. */
  function restLinesLookLikeSemicolonBulletClauses(lines) {
    if (lines.length < 2) return false;
    if (
      lines.some(function (l) {
        var x = l.trim();
        return (
          /^the transfer is necessary/i.test(x) ||
          /^the data subject has explicitly consented/i.test(x) ||
          /^in the course of an activity/i.test(x) ||
          /^by the Member States when carrying out/i.test(x) ||
          /^by a natural person in the course/i.test(x) ||
          /^by competent authorities for the purposes/i.test(x)
        );
      })
    ) {
      return false;
    }
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (s.length > 320) return false;
      if (i < lines.length - 1) {
        if (!/;\s*$/.test(s) && !/;\s*and\s*$/i.test(s)) return false;
      } else if (!/\.\s*$/.test(s)) {
        return false;
      }
    }
    return true;
  }

  /** “may either:” + two alternatives → (a)/(b) per GDPR-Info-style lettering. */
  function shouldUseLetterListForEitherBlock(lastSeg, rest) {
    if (!/either:\s*$/i.test(String(lastSeg || ''))) return false;
    if (rest.length < 2 || rest.length > 12) return false;
    if (looksLikeExplicitParenLetterLines(rest)) return false;
    return true;
  }

  /**
   * Nested enumeration under an outer § (5., 7., …) must not read as “5.1.”, “5.a.”, etc.: bullets,
   * or lettered (a)(b) when the source uses “either:” / explicit “(a)” lines — never a second numeric column.
   */
  function renderSublistAfterIntro(lastSeg, rest) {
    function nestedAlwaysBullets(lines) {
      return renderDocBulletList(lines);
    }
    if (!rest.length) return '';
    rest = mergeOrphanDigitParenLines(mergeOrphanParenLetterLines(rest.slice())).map(function (l) {
      return String(l).trim();
    }).filter(Boolean);
    if (looksLikeExplicitParenLetterLines(rest)) return renderExplicitParenLetterLines(rest);
    var segTail = String(lastSeg || '').trim();
    /* Art. 2(2) / Art. 3(2): bullets so nested 1. 2. 3. is not confused with main article numbering */
    if (
      rest.length >= 2 &&
      (/related to:\s*$/i.test(segTail) ||
        /does not apply to the processing of personal data:\s*$/i.test(segTail))
    ) {
      return renderDocBulletList(rest);
    }
    // “either:” + two “processing of personal data …” clauses (e.g. Art. 4(23))
    if (
      /either:\s*$/i.test(segTail) &&
      rest.length >= 2 &&
      rest.every(function (l) {
        return /^processing of personal data/i.test(String(l || '').trim());
      })
    ) {
      return nestedAlwaysBullets(rest);
    }
    if (shouldUseLetterListForEitherBlock(lastSeg, rest)) {
      var ll = renderLetterListFromLines(rest);
      return ll || nestedAlwaysBullets(rest);
    }
    if (restLinesLookLikeBulletInfinitives(rest)) return renderDocBulletList(rest);
    if (restLinesLookLikeSemicolonBulletClauses(rest)) return renderDocBulletList(rest);
    return nestedAlwaysBullets(rest);
  }

  /** Under “either:”, alternatives then often a further “3The …” clause on its own line (Art. 12(5)). */
  function partitionRestAfterEitherLead(lastSeg, rest) {
    var seg = String(lastSeg || '').trim();
    if (!/either:\s*$/i.test(seg)) return { sub: rest, tail: [] };
    var sub = [];
    var tail = [];
    var i = 0;
    for (; i < rest.length; i++) {
      var t = String(rest[i] || '').trim();
      if (/^\d{1,3}(?=[A-ZÀ-ŸÄÖÆØ])/.test(t)) break;
      sub.push(rest[i]);
    }
    for (; i < rest.length; i++) tail.push(rest[i]);
    return { sub: sub, tail: tail };
  }

  function renderOneGenericBlock(blockLines) {
    if (!blockLines.length) return '';
    var first = blockLines[0];
    var rest = blockLines.slice(1);

    var headParts = splitInlineNumberedClauses(first);
    var inner = '';
    var lastSeg = headParts[headParts.length - 1];
    var listIntro = headEndsWithListIntro(lastSeg);

    if (headParts.length > 1) {
      if (listIntro) {
        var early = headParts.slice(0, -1);
        var eitherIntro = /either:\s*$/i.test(String(lastSeg || '').trim());
        if (early.length) {
          if (eitherIntro) {
            for (var ei = 0; ei < early.length; ei++) {
              inner += '<div class="para-text">' + fmtArticleLine(early[ei]) + '</div>';
            }
          } else {
            inner += renderDocBulletList(early);
          }
        }
        inner += '<div class="para-text">' + fmtArticleLine(lastSeg) + '</div>';
      } else {
        // One official paragraph with “1Clause 2Clause …” (Arts 11–12, many others). Bullets here
        // duplicated outer numbering and looked like footnotes; run strip via one fmt pass.
        inner +=
          '<div class="para-text">' +
          fmtArticleLine(String(first || '').replace(/\s+/g, ' ').trim()) +
          '</div>';
      }
    } else {
      var headEsc = fmtArticleLine(headParts[0]);
      var headLettered = extractLetteredSubpointsFromText(headEsc);
      if (headLettered && headLettered.items.length >= 2) {
        inner =
          (headLettered.lead ? '<div class="para-text">' + headLettered.lead + '</div>' : '') +
          renderLetteredSubpoints(headLettered);
      } else {
        inner += '<div class="para-text">' + headEsc + '</div>';
      }
      lastSeg = headParts[0];
      listIntro = headEndsWithListIntro(lastSeg);
    }

    if (rest.length && listIntro) {
      var pr = partitionRestAfterEitherLead(lastSeg, rest);
      inner += renderSublistAfterIntro(lastSeg, pr.sub);
      for (var t = 0; t < pr.tail.length; t++) {
        inner += '<div class="para-text para-continuation">' + fmtArticleLine(pr.tail[t]) + '</div>';
      }
    } else if (rest.length) {
      for (var r = 0; r < rest.length; r++) {
        inner += '<div class="para-text para-continuation">' + fmtArticleLine(rest[r]) + '</div>';
      }
    }

    return inner;
  }

  /**
   * Join ETL line breaks that split a single sentence (lowercase continuations). Never join after
   * sentence/list punctuation, and never merge “charge / refuse” lines under either: (they stay as list rows).
   */
  function mergeArticleSoftLineBreaks(lines) {
    var arr = (lines || [])
      .map(function (l) {
        return String(l || '').trim();
      })
      .filter(Boolean);
    if (arr.length <= 1) return arr;
    var out = [];
    var buf = arr[0];
    for (var i = 1; i < arr.length; i++) {
      var s = arr[i];
      var p = String(buf).trim();
      var merge = false;
      if (/^charge\b|^refuse\b/i.test(s)) merge = false;
      else if (/^[a-z(‘'`'„«]/.test(s) && !/[.!?:;]\s*$/.test(p)) merge = true;
      if (merge) buf = buf + ' ' + s;
      else {
        out.push(buf);
        buf = s;
      }
    }
    out.push(buf);
    return out;
  }

  /**
   * When the whole article (or a single line) is only EUR-Lex “1Clause 2Clause…” markers, split into
   * separate lines so genericSplitBlocks yields one outer § per clause (e.g. Art. 10). Do not expand when a
   * prose paragraph precedes clause lines (e.g. Art. 11 §1 + §2 with 1Where 2In on the same line).
   */
  function expandEurLexClauseLinesForGenericArticle(lines) {
    var norm = (lines || [])
      .map(function (l) {
        return String(l || '').trim();
      })
      .filter(Boolean);
    if (!norm.length) return norm;

    var allLinesStartWithClauseDigit = norm.every(function (ln) {
      return /^\d{1,3}(?=[A-ZÀ-ŸÄÖÆØ])/.test(ln);
    });
    var singleLineMultiClause =
      norm.length === 1 && splitInlineNumberedClauses(norm[0]).length >= 2;

    if (!allLinesStartWithClauseDigit && !singleLineMultiClause) return norm;

    var expanded = [];
    for (var i = 0; i < norm.length; i++) {
      var parts = splitInlineNumberedClauses(norm[i]);
      if (parts.length > 1) {
        for (var p = 0; p < parts.length; p++) expanded.push(parts[p]);
      } else {
        expanded.push(norm[i]);
      }
    }
    return expanded;
  }

  /**
   * Broad GDPR-Info-style formatter for Arts 1–99 when the extract has no leading “1. 2.” but line breaks
   * and optional “1Foo 2Bar” inline numbering (see https://gdpr-info.eu/).
   */
  function renderGenericStructuredArticle(lines) {
    if (!lines.length) return '';
    var norm = lines
      .map(function (l) {
        return String(l || '').trim();
      })
      .filter(Boolean);
    norm = mergeArticleSoftLineBreaks(norm);
    var expanded = expandEurLexClauseLinesForGenericArticle(norm);
    var blocks = genericSplitBlocks(expanded);
    if (!blocks.length) return '';
    var items = [];
    for (var b = 0; b < blocks.length; b++) {
      items.push(renderManualPara(String(b + 1), renderOneGenericBlock(blocks[b])));
    }
    return '<ol class="art-para-list manual">' + items.join('') + '</ol>';
  }

  /**
   * Art. 4 GDPR definitions — full line grouping (continuations + nested “means:” / “either:” / “because:”
   * sublists). The old def-list shortcut only kept lines starting with ‘ and dropped continuations.
   */
  function renderArt4Definitions(lines) {
    if (!lines || lines.length < 2) return '';
    var first = String(lines[0] || '').trim();
    if (!/^For the purposes of this Regulation/i.test(first)) return '';
    var bodyLines = lines.slice(1).map(function (l) { return String(l || '').trim(); }).filter(Boolean);
    if (
      !bodyLines.some(function (l) {
        return /^‘/.test(l) || /^\d{1,3}['\u2018]/.test(l);
      })
    ) {
      return '';
    }

    var footnoteParts = [];
    while (bodyLines.length) {
      var tail = bodyLines[bodyLines.length - 1];
      if (/^[\u00B9\u00B2\u00B3]+\s/.test(tail) || /^¹\s/.test(tail)) {
        footnoteParts.unshift(bodyLines.pop());
      } else {
        break;
      }
    }

    function isDefStart(line) {
      var s = String(line || '').trim();
      return /^‘/.test(s) || /^\d{1,3}['\u2018]/.test(s);
    }

    var blocks = [];
    var cur = [];
    for (var i = 0; i < bodyLines.length; i++) {
      var ln = bodyLines[i];
      if (isDefStart(ln) && cur.length) {
        blocks.push(cur);
        cur = [ln];
      } else {
        cur.push(ln);
      }
    }
    if (cur.length) blocks.push(cur);

    var lis = blocks.map(function (bl) {
      var inner = renderOneGenericBlock(bl);
      return '<li><div class="def-item-inner">' + inner + '</div></li>';
    }).join('');

    var footnoteHtml = '';
    if (footnoteParts.length) {
      footnoteHtml =
        '<p class="art-footnote">' +
        injectRegulationCitationLinks(
          formatInlineFootnotes(escapeHtml(stripParentheticalRecitalsFromArticlePlain(footnoteParts.join('\n'))))
        ).replace(/\n+/g, '<br>') +
        '</p>';
    }

    return (
      '<div class="prose art-4-prose">' +
      '<p class="def-intro">' +
      fmtArticleLine(first) +
      '</p>' +
      '<ol class="def-list art-4-def-list">' +
      lis +
      '</ol>' +
      footnoteHtml +
      '</div>'
    );
  }

  function extractLetteredSubpointsFromText(escapedHtmlText) {
    var t = String(escapedHtmlText || '').trim();
    if (!t) return null;
    var starts = t.match(/\([a-z]\)/gi);
    if (!starts || starts.length < 2) return null;
    var parts = t.split(/(\([a-z]\))/gi).filter(Boolean);
    var lead = '';
    var items = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var m = p.match(/^\(([a-z])\)$/i);
      if (m) {
        var marker = m[1].toLowerCase();
        var next = (parts[i + 1] || '').trim();
        if (next) items.push({ marker: marker, text: next });
        i += 1;
      } else if (!items.length) {
        lead += (lead ? ' ' : '') + p.trim();
      }
    }
    if (items.length < 2) return null;
    return { lead: lead.trim(), items: items };
  }

  function renderLetteredSubpoints(lettered) {
    if (!lettered || !lettered.items || lettered.items.length < 2) return '';
    var lis = lettered.items.map(function (it) {
      return '<li><span class="li-marker">(' + escapeHtml(it.marker) + ')</span><span class="li-text">' + it.text + '</span></li>';
    }).join('');
    return '<ul class="letter-list">' + lis + '</ul>';
  }

  /**
   * Body of one “1. … / 2. …” segment: split multiline, apply same sublists as line-based renderer
   * (bullets for Art. 2(2) / 3(2), etc.) when ETL includes outer numbering so manual path runs first.
   */
  function renderManualParagraphBody(rawBody) {
    var trimmed = String(rawBody || '').trim();
    if (!trimmed) return '';
    var lines = trimmed.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return '';

    if (lines.length === 1) {
      var esc = fmtArticleLine(lines[0]);
      var lettered = extractLetteredSubpointsFromText(esc);
      if (lettered && lettered.items.length >= 2) {
        return (
          (lettered.lead ? '<div class="para-text">' + lettered.lead + '</div>' : '') + renderLetteredSubpoints(lettered)
        );
      }
      return '<div class="para-text">' + esc + '</div>';
    }

    var head = lines[0];
    var tail = lines.slice(1);
    if (headEndsWithListIntro(head) || /:\s*$/.test(head.trim())) {
      return '<div class="para-text">' + fmtArticleLine(head) + '</div>' + renderSublistAfterIntro(head, tail);
    }

    return '<div class="para-text">' + fmtArticleMultiline(trimmed) + '</div>';
  }

  function renderManualNumberedParagraphs(textToParse) {
    var normalized = String(textToParse || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    /* Only split before a *line* that begins a numbered paragraph (optional horizontal space then "N. ").
       A plain \s* after \n also matches newlines, so "\n \n \n 2." used to split three times and broke lists. */
    var segments = normalized.split(/(?=\n[ \t\u00a0\u202f]*\d+\.\s+)/).filter(Boolean);
    if (!segments.length) return '';

    var merged = [];
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var m = seg.match(/^\s*(\d+)\.\s*([\s\S]*)/);
      var num = m ? parseInt(m[1], 10) : 0;
      var rest = m ? m[2].trim() : '';
      if (m && num > 15 && rest.length < 25 && merged.length > 0) {
        var prev = merged[merged.length - 1];
        if (prev.endsWith('Article ') || prev.endsWith('article ')) {
          merged[merged.length - 1] = prev + m[1] + (rest ? '. ' + rest : '.');
          continue;
        }
      }
      merged.push(seg);
    }
    segments = merged;

    var introParts = [];
    var items = [];
    segments.forEach(function (seg) {
      var pointMatch = seg.match(/^\s*(\d+)\.\s*([\s\S]*)/);
      if (!pointMatch) {
        var p = seg.trim();
        if (p) introParts.push(p);
        return;
      }
      var n = pointMatch[1];
      var rawInner = pointMatch[2].trim();
      if (!rawInner) return;

      items.push(
        '<li>' +
        '<span class="para-num">' + escapeHtml(n) + '.</span>' +
        '<div class="para-content">' +
        renderManualParagraphBody(rawInner) +
        '</div>' +
        '</li>'
      );
    });

    if (!items.length) return '';
    var introHtml = '';
    if (introParts.length) {
      var introEsc = injectRegulationCitationLinks(
        formatInlineFootnotes(escapeHtml(stripParentheticalRecitalsFromArticlePlain(introParts.join('\n\n'))))
      );
      introHtml = '<div class="prose"><p class="art-intro">' + introEsc.replace(/\n+/g, '<br>') + '</p></div>';
    }
    return introHtml + '<ol class="art-para-list manual">' + items.join('') + '</ol>';
  }

  function renderAutoArticleBody(articleNumber, rawText) {
    var lines = String(rawText || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return '';

    var first = lines[0] || '';
    if (
      /^For the purposes of this Regulation/i.test(String(first).trim()) &&
      lines.slice(1).some(function (l) {
        var s = String(l || '').trim();
        return /^‘/.test(s) || /^\d{1,3}['\u2018]/.test(s);
      })
    ) {
      var r4 = renderArt4Definitions(lines);
      if (r4) return r4;
    }

    if (/^Personal data shall be:/i.test(first)) {
      var r5 = renderArt5PersonalDataPrinciples(lines);
      if (r5) return r5;
    }
    if (/^Processing shall be lawful/i.test(first)) {
      var r6 = renderArt6Lawfulness(lines);
      if (r6) return r6;
    }
    if (/^Where processing is based on consent/i.test(first)) {
      var r7 = renderArt7Consent(lines);
      if (r7) return r7;
    }
    if (articleNumber === 8) {
      var r8 = renderArt8ChildConsent(lines);
      if (r8) return r8;
    }

    /* Arts 1–3 (“This Regulation…”) are formatted by genericSplitBlocks + renderGenericStructuredArticle.
       A former “regulation scope” path treated EUR-Lex lines like “1For the processing…” as new §§,
       which broke Art. 2(3), Art. 3, etc. */

    var generic = renderGenericStructuredArticle(lines);
    if (generic) return generic;

    var groups = splitByNewItemStarts(lines, function (l) { return /^This Regulation applies to the processing/i.test(l); });
    var items = groups.map(function (g) {
      var head = g[0] || '';
      var rest = g.slice(1);
      var content = '<span class="li-text">' + fmtArticleLine(head) + '</span>';
      if (rest.length) {
        var list = renderLetterListFromLines(rest);
        if (list) content += list;
        else content += '<div class="li-sub">' + fmtArticleLine(rest.join(' ')) + '</div>';
      }
      return '<li>' + content + '</li>';
    }).join('');
    return '<ol class="art-para-list">' + items + '</ol>';
  }

  /** Build concise summary from results when the server call fails */
  function buildClientSummary(query, results) {
    if (!results || results.length === 0) return 'No provisions were found to summarize. Use the GDPR text on the left.';
    function getFirstSentences(text, maxChars) {
      var t = (text || '').trim().replace(/\s+/g, ' ');
      if (!t) return '';
      var re = /[^.!?]*[.!?]/g;
      var out = '';
      var m;
      while ((m = re.exec(t)) && out.length + m[0].length + 1 <= maxChars) {
        out += (out ? ' ' : '') + m[0].trim();
      }
      return out || t.slice(0, maxChars).trim();
    }
    var first = results[0];
    var text = (first.excerpt || '').trim();
    var label = first.type === 'recital' ? 'Recital ' + first.number : 'Article ' + first.number;
    var core = getFirstSentences(text, 320);
    if (!core) return 'See ' + label + ' in the GDPR text on the left.';
    var others = [];
    for (var i = 1; i < Math.min(3, results.length); i++) {
      var r = results[i];
      others.push(r.type === 'recital' ? 'Recital ' + r.number : 'Article ' + r.number);
    }
    var sourceLine = others.length ? 'Source: ' + label + ' (see also ' + others.join(', ') + ').' : 'Source: ' + label + '.';
    return core + ' ' + sourceLine;
  }

  btnAsk.addEventListener('click', doAsk);
  queryInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAsk(); });

  function setAskLoading(busy) {
    var on = Boolean(busy);
    if (askComposer) askComposer.classList.toggle('is-busy', on);
    if (btnAsk) {
      btnAsk.disabled = on;
      btnAsk.setAttribute('aria-busy', on ? 'true' : 'false');
    }
    if (queryInput) queryInput.disabled = on;
    if (askAnswerBox) askAnswerBox.classList.toggle('is-awaiting-answer', on);
    if (askAnswerLoading) {
      askAnswerLoading.classList.toggle('is-visible', on);
      askAnswerLoading.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (askAnswerContent) askAnswerContent.classList.toggle('is-content-muted', on);
  }

  function doAsk() {
    const q = queryInput.value.trim();
    if (!q) return;

    // Refresh UI: show Ask results, then re-render answer + relevant provisions cleanly
    askResults.classList.remove('hidden');
    if (askAnswerBox) {
      askAnswerBox.classList.add('hidden');
    }
    if (askAnswerContent) {
      askAnswerContent.textContent = '';
    }
    if (askAnswerStatus) {
      askAnswerStatus.textContent = '';
    }
    if (askAnswerCitations) {
      askAnswerCitations.innerHTML = '';
      askAnswerCitations.classList.add('hidden');
    }
    if (askRelevantDocs) {
      askRelevantDocs.classList.add('hidden');
      if (askRelevantDocsList) askRelevantDocsList.innerHTML = '';
    }

    setAskLoading(true);

    // Grounded answer: local GDPR + web snippets + LLM (server default)
    if (askAnswerBox && askAnswerContent) {
      askAnswerBox.classList.remove('hidden');
      askAnswerContent.textContent = '';
      if (askAnswerStatus) askAnswerStatus.textContent = 'Retrieving sources and synthesizing…';
    }
    var sectorSel = document.getElementById('askIndustrySector');
    var sectorId = sectorSel && sectorSel.value ? sectorSel.value : 'GENERAL';
    post('/api/answer', { query: q, includeWeb: true, industrySectorId: sectorId })
      .then(function (ans) {
        if (!askAnswerBox || !askAnswerContent) return;
        if (askAnswerStatus) {
          var llmLabel;
          if (ans && ans.llm && ans.llm.used) {
            var prov = (ans.llm.provider || '').toLowerCase();
            var provName = prov === 'tavily' ? 'Tavily' : prov === 'groq' ? 'Groq' : (ans.llm.provider || 'LLM');
            llmLabel = provName + ' · ' + (ans.llm.model || 'LLM') + ' · Ready';
            if (ans.llm.note) llmLabel = provName + ' · ' + (ans.llm.model || 'LLM') + ' · ' + ans.llm.note;
          } else {
            llmLabel = 'Extractive fallback · Ready';
            if (ans && ans.llm && ans.llm.note) llmLabel = 'Extractive fallback · ' + ans.llm.note;
          }
          askAnswerStatus.textContent = llmLabel;
        }
        if (askAnswerSectorLine) {
          var is = ans && ans.industrySector;
          if (is && is.id && String(is.id).toUpperCase() !== 'GENERAL' && is.label) {
            askAnswerSectorLine.textContent =
              'Sector context for this answer: ' + String(is.label).trim() + '.';
            askAnswerSectorLine.classList.remove('hidden');
          } else {
            askAnswerSectorLine.textContent = '';
            askAnswerSectorLine.classList.add('hidden');
          }
        }
        if (ans && ans.answer) {
          askAnswerContent.innerHTML = formatAnswerHtml(ans.answer, ans.sources || []);
        } else {
          askAnswerContent.textContent = 'No answer was generated.';
        }
        renderAnswerCitations(ans);
        renderRelevantProvisionsFromAnswer(ans);
      })
      .catch(function () {
        if (!askAnswerBox || !askAnswerContent) return;
        if (askAnswerStatus) askAnswerStatus.textContent = 'Answer failed (check GROQ_API_KEY, TAVILY_API_KEY, or server logs)';
        if (askAnswerSectorLine) {
          askAnswerSectorLine.textContent = '';
          askAnswerSectorLine.classList.add('hidden');
        }
        askAnswerContent.textContent = 'Could not generate an LLM-grounded answer. You can still use the matching provisions below.';
        if (askRelevantDocs) { askRelevantDocs.classList.add('hidden'); if (askRelevantDocsList) askRelevantDocsList.innerHTML = ''; }
      })
      .finally(function () {
        setAskLoading(false);
      });
  }

  function formatAnswerHtml(answerText, sources) {
    var raw = String(answerText || '').trim();
    if (!raw) return '';
    var map = {};
    (Array.isArray(sources) ? sources : []).forEach(function (s) {
      if (s && s.id) map[String(s.id)] = s;
    });
    var escaped = formatRecitalRefs(formatInlineFootnotes(escapeHtml(raw)));
    escaped = escaped.replace(/\[S(\d+)\]/g, function (_, n) {
      var id = 'S' + n;
      var s = map[id];
      var titleHint = '';
      if (s && s.kind === 'regulation' && s.type && s.number != null) {
        titleHint = formatAnswerCitationHeadline(s.type, s.number, s.title || '');
      } else if (s && s.kind === 'web' && s.title) {
        titleHint = String(s.title);
      }
      var titleAttr = '';
      if (titleHint) {
        titleAttr =
          ' title="' +
          escapeHtml(titleHint).replace(/"/g, '&quot;') +
          (s && s.kind === 'regulation' ? ' · Click to open in app' : '') +
          '"';
      }
      if (s && s.kind === 'regulation' && s.type && s.number != null) {
        return (
          '<a href="#" class="app-goto-doc from-ask citation-link citation-chip" data-type="' +
          escapeHtml(s.type) +
          '" data-number="' +
          String(s.number) +
          '"' +
          titleAttr +
          '><span class="citation-chip-inner">[' +
          escapeHtml(id) +
          ']</span></a>'
        );
      }
      if (s && s.kind === 'web' && s.url) {
        return (
          '<a href="' +
          escapeHtml(s.url) +
          '" target="_blank" rel="noopener" class="citation-link citation-chip citation-chip--web"' +
          titleAttr +
          '><span class="citation-chip-inner">[' +
          escapeHtml(id) +
          ']</span></a>'
        );
      }
      return '[' + escapeHtml(id) + ']';
    });
    escaped = injectRegulationCitationLinks(escaped);
    var segments = escaped.split(/\n{2,}/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!segments.length) return '';
    var body = segments
      .map(function (seg) {
        var singleLine = seg.replace(/\s+/g, ' ').trim();
        var callout = singleLine.match(/^\*\*(.+?)\*\*:?\s*$/);
        if (callout) {
          return (
            '<p class="ask-answer-callout" role="presentation"><strong class="ask-answer-callout-label">' +
            callout[1] +
            '</strong></p>'
          );
        }
        var inner = seg.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        return '<p class="ask-answer-para">' + inner + '</p>';
      })
      .join('');
    return '<div class="ask-answer-prose-inner">' + body + '</div>';
  }

  function renderRelevantProvisionsFromAnswer(ans) {
    if (!askRelevantDocs || !askRelevantDocsList) return;
    var prevExtra = document.getElementById('askCrossrefExtra');
    if (prevExtra) prevExtra.remove();
    askRelevantDocsList.innerHTML = '';
    var sources = ans && Array.isArray(ans.sources) ? ans.sources : [];
    var regs = sources.filter(function (s) { return s && s.kind === 'regulation' && s.type && s.number != null; });
    if (!regs.length) {
      askRelevantDocs.classList.add('hidden');
      return;
    }
    regs.forEach(function (s, idx) {
      var label = s.type === 'recital'
        ? 'GDPR Recital (' + s.number + ')'
        : (getArticleDisplayTitle({ number: s.number, title: s.title }) + (s.chapterTitle ? ' · ' + s.chapterTitle : ''));
      var li = document.createElement('li');
      li.className = 'ask-relevant-doc-card';
      li.setAttribute('role', 'listitem');
      li.style.setProperty('--stagger', String(idx));
      var badge =
        s.type === 'recital'
          ? '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--recital">Recital</span>'
          : '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--article">Article</span>';
      li.innerHTML =
        badge +
        '<div class="ask-relevant-doc-card-body">' +
        '<span class="ask-relevant-doc-label">' +
        escapeHtml(label) +
        '</span>' +
        '<div class="ask-relevant-doc-links">' +
        '<a href="#" class="app-goto-doc from-ask link-in-app" data-type="' +
        escapeHtml(s.type) +
        '" data-number="' +
        s.number +
        '">View in app</a>' +
        (s.sourceUrl
          ? '<a href="' + escapeHtml(s.sourceUrl) + '" target="_blank" rel="noopener" class="ask-relevant-doc-link">GDPR-Info</a>'
          : '') +
        (s.eurLexUrl
          ? '<a href="' + escapeHtml(s.eurLexUrl) + '" target="_blank" rel="noopener" class="ask-relevant-doc-link">EUR-Lex</a>'
          : '') +
        '</div></div>';
      askRelevantDocsList.appendChild(li);
    });
    askRelevantDocs.classList.remove('hidden');

    var articlesOnly = regs.filter(function (s) {
      return s.type === 'article';
    });
    if (!articlesOnly.length) return;
    Promise.all(
      articlesOnly.map(function (s) {
        return resolveSuitableRecitalsForArticle(s.number, null).then(function (recs) {
          return { num: s.number, recs: recs || [] };
        });
      })
    ).then(function (pairs) {
      var lines = pairs.filter(function (p) {
        return p.recs && p.recs.length;
      });
      if (!lines.length || !askRelevantDocs) return;
      var extra = document.createElement('div');
      extra.id = 'askCrossrefExtra';
      extra.className = 'ask-crossref-extra';
      var h = document.createElement('h4');
      h.className = 'ask-relevant-docs-subtitle';
      h.textContent = 'Suitable GDPR recitals (GDPR-Info)';
      extra.appendChild(h);
      var ul = document.createElement('ul');
      ul.className = 'ask-relevant-docs-list';
      lines.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'ask-relevant-doc-card ask-relevant-doc-card--crossref';
        li.setAttribute('role', 'listitem');
        var links = p.recs
          .slice(0, 12)
          .map(function (r) {
            return (
              '<a href="#" class="app-goto-doc from-ask link-in-app" data-type="recital" data-number="' +
              r +
              '">(' +
              r +
              ')</a>'
            );
          })
          .join(', ');
        li.innerHTML =
          '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--article">Article ' +
          p.num +
          '</span><div class="ask-relevant-doc-card-body"><span class="ask-relevant-doc-label">Suitable recitals</span>' +
          '<div class="ask-relevant-doc-links ask-relevant-doc-links--wrap">' +
          links +
          '</div></div>';
        ul.appendChild(li);
      });
      extra.appendChild(ul);
      askRelevantDocs.appendChild(extra);
    });
  }

  /** Remove leading "Art. N …" / "Recital (N) …" segments already implied by type+number (avoids "Article 83 — Art. 83 GDPR …"). */
  function stripRedundantProvisionTitle(type, number, rawTitle) {
    if (rawTitle == null || rawTitle === '') return '';
    var t = String(rawTitle).trim();
    if (!t) return '';
    var esc = String(number).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var prev;
    var i = 0;
    do {
      prev = t;
      i++;
      if (type === 'recital') {
        t = t.replace(new RegExp('^Recital\\s*\\(\\s*' + esc + '\\s*\\)\\s*(?:[—–-]\\s*)+', 'i'), '').trim();
        t = t.replace(new RegExp('^Recital\\s*\\(\\s*' + esc + '\\s*\\)\\s*$', 'i'), '').trim();
        t = t.replace(new RegExp('^Recital\\s+' + esc + '\\b\\s*(?:[—–-]\\s*)+', 'i'), '').trim();
      } else {
        t = t.replace(
          new RegExp('^(?:Article|Art\\.?)\\s*' + esc + '\\b(?:\\s*GDPR)?\\s*(?:[—–-]\\s*)+', 'i'),
          ''
        ).trim();
        t = t.replace(new RegExp('^(?:Article|Art\\.?)\\s*' + esc + '\\b(?:\\s*GDPR)?\\s+', 'i'), '').trim();
        t = t.replace(new RegExp('^(?:Article|Art\\.?)\\s*' + esc + '\\b\\s*$', 'i'), '').trim();
        t = t.replace(/^GDPR\s+/i, '').trim();
      }
    } while (t !== prev && t.length && i < 12);
    return t;
  }

  function formatAnswerCitationHeadline(type, number, rawTitle) {
    var label = type === 'recital' ? 'Recital (' + number + ')' : 'Art. ' + number;
    var rest = stripRedundantProvisionTitle(type, number, rawTitle);
    return rest ? label + ' — ' + rest : label;
  }

  function renderAnswerCitations(ans) {
    if (!askAnswerCitations) return;
    askAnswerCitations.innerHTML = '';
    var sources = ans && Array.isArray(ans.sources) ? ans.sources : [];
    if (!sources.length) {
      askAnswerCitations.classList.add('hidden');
      return;
    }
    var html =
      '<div class="answer-citations-intro">' +
      '<span class="answer-citations-intro-icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
      '</span><div class="answer-citations-intro-text">' +
      '<h4 class="answer-citations-title">Sources used in this answer</h4>' +
      '<p class="answer-citations-lead">Hover a green <strong>[S#]</strong> in the answer for the provision title. Open the full text below.</p>' +
      '</div></div>';
    html += '<ul class="answer-citations-list" role="list">';
    sources.forEach(function (s) {
      var label = s.id || '';
      if (s.kind === 'regulation') {
        var docLine = formatAnswerCitationHeadline(s.type, s.number, s.title || '');
        var inApp = '<a href="#" class="app-goto-doc from-ask" data-type="' + escapeHtml(s.type) + '" data-number="' + s.number + '">View in app</a>';
        var links = (s.sourceUrl ? (' · <a href="' + escapeHtml(s.sourceUrl) + '" target="_blank" rel="noopener">GDPR-Info</a>') : '') +
          (s.eurLexUrl ? (' · <a href="' + escapeHtml(s.eurLexUrl) + '" target="_blank" rel="noopener">EUR-Lex</a>') : '');
        html += '<li class="answer-citation-item" role="listitem">' +
          '<div class="answer-citation-head"><span class="answer-citation-id">[' + escapeHtml(label) + ']</span> ' +
          '<span class="answer-citation-doc">' + escapeHtml(docLine) + '</span></div>' +
          '<div class="answer-citation-links">' + inApp + links + '</div>' +
          (s.excerpt ? '<div class="answer-citation-excerpt">' + escapeHtml(s.excerpt.slice(0, 320)).trim() + '…</div>' : '') +
          '</li>';
      } else {
        var url = s.url || '';
        html += '<li class="answer-citation-item" role="listitem">' +
          '<div class="answer-citation-head"><span class="answer-citation-id">[' + escapeHtml(label) + ']</span> ' +
          (s.title ? '<span class="answer-citation-doc">' + escapeHtml(s.title) + '</span>' : '<span class="answer-citation-doc">Web source</span>') +
          '</div>' +
          '<div class="answer-citation-links">' +
          (url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Open source</a>' : '') +
          '</div>' +
          (s.snippet ? '<div class="answer-citation-excerpt">' + escapeHtml(s.snippet) + '</div>' : '') +
          '</li>';
      }
    });
    html += '</ul>';
    askAnswerCitations.innerHTML = html;
    askAnswerCitations.classList.remove('hidden');
  }

  if (recitalsSearch) {
    recitalsSearch.addEventListener('input', function () {
      clearTimeout(recitalsSearchTimer);
      recitalsSearchTimer = setTimeout(function () {
        applyRecitalsFilter(recitalsSearch.value);
      }, 180);
    });
    recitalsSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        recitalsSearch.value = '';
        applyRecitalsFilter('');
        recitalsSearch.blur();
      }
    });
  }
  if (recitalsClearSearch) {
    recitalsClearSearch.addEventListener('click', function () {
      if (recitalsSearch) recitalsSearch.value = '';
      applyRecitalsFilter('');
      if (recitalsSearch) recitalsSearch.focus();
    });
  }

  initCitationSidebarCollapsibles();
  updateBrowseSectionMenu();
  loadMeta();
})();
