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

  const lastRefreshedEl = document.getElementById('lastRefreshed');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnBack = document.getElementById('btnBack');
  const btnBackToQuestion = document.getElementById('btnBackToQuestion');
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
  const browseSources = document.getElementById('browseSources');
  const browseDetail = document.getElementById('browseDetail');
  const browseSourcesList = document.getElementById('browseSourcesList');
  const recitalsList = document.getElementById('recitalsList');
  const chapterList = document.getElementById('chapterList');
  const chaptersArticlesGrouped = document.getElementById('chaptersArticlesGrouped');
  const chaptersFilterCategory = document.getElementById('chaptersFilterCategory');
  const chaptersFilterChapter = document.getElementById('chaptersFilterChapter');
  const chaptersFilterArticle = document.getElementById('chaptersFilterArticle');
  const chaptersFilterSubcategory = document.getElementById('chaptersFilterSubcategory');
  const chaptersFilterClear = document.getElementById('chaptersFilterClear');
  const detailContent = document.getElementById('detailContent');
  const citationLinks = document.getElementById('citationLinks');
  const docNav = document.getElementById('docNav');
  const docNavPrev = document.getElementById('docNavPrev');
  const docNavNext = document.getElementById('docNavNext');
  const docNavLabel = document.getElementById('docNavLabel');
  const docNavNumber = document.getElementById('docNavNumber');
  const docNavGo = document.getElementById('docNavGo');
  const queryInput = document.getElementById('query');
  const btnAsk = document.getElementById('btnAsk');
  const btnExportPdf = document.getElementById('btnExportPdf');
  const askResults = document.getElementById('askResults');
  const resultsList = document.getElementById('resultsList');
  const overallSummaryEl = document.getElementById('overallSummary');
  const askSummaryBox = document.getElementById('askSummaryBox');
  const askSummaryContent = document.getElementById('askSummaryContent');
  const askRelevantDocs = document.getElementById('askRelevantDocs');
  const askRelevantDocsList = document.getElementById('askRelevantDocsList');

  let lastListSection = null;
  let currentDoc = null;
  let cameFromAsk = false;

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

  function setMeta(meta) {
    if (meta.lastRefreshed) {
      const d = new Date(meta.lastRefreshed);
      lastRefreshedEl.textContent = 'Last refreshed: ' + d.toLocaleString() + ' (EUR-Lex consolidated text)';
    } else {
      lastRefreshedEl.textContent = 'Content not yet loaded from official sources. Click "Refresh sources" to fetch the latest regulation from EUR-Lex.';
    }
  }

  function loadMeta() {
    get('/api/meta').then(setMeta).catch(() => { lastRefreshedEl.textContent = 'Could not load meta.'; });
  }

  function loadSources() {
    if (!sourcesList) return;
    renderSourcesInto(sourcesList);
  }

  /** Render all credible sources (from /api/meta) into a given container. Used by both Sources tab and Browse > Credible sources. */
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

  function loadBrowseSources() {
    if (!browseSourcesList) return;
    renderSourcesInto(browseSourcesList);
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
        var paragraphs = getThreeParagraphSummary(item, sourceName);
        var summaryHtml = '<div class="news-card-summary"><h6 class="news-card-summary-title">Summary</h6>' +
          '<p class="news-card-summary-p">' + escapeHtml(paragraphs[0]) + '</p>' +
          '<p class="news-card-summary-p">' + escapeHtml(paragraphs[1]) + '</p>' +
          '<p class="news-card-summary-p">' + escapeHtml(paragraphs[2]) + '</p></div>';
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

  function getThreeParagraphSummary(item, sourceName) {
    var p = item.summaryParagraphs;
    if (p && Array.isArray(p) && p.length >= 3) return [p[0], p[1], p[2]];
    if (p && Array.isArray(p) && p.length >= 1) {
      var first = p[0];
      var second = p[1] || 'This update is from ' + sourceName + '. For the full story and official wording, open the link above.';
      var third = p[2] || 'Relevant for GDPR compliance and data protection practice.';
      return [first, second, third];
    }
    var intro = item.snippet || ('This item: ' + (item.title || 'Untitled') + '.');
    return [
      intro,
      'This update is from ' + sourceName + '. For the full story and official wording, open the link above.',
      'Relevant for GDPR compliance and data protection practice.'
    ];
  }

  function loadNews() {
    if (!newsFeedsList) return;
    if (newsSections) newsSections.innerHTML = '';
    if (newsList) newsList.innerHTML = '';
    newsFeedsList.innerHTML = '<li class="news-empty">Loading news…</li>';
    if (newsSections) newsSections.innerHTML = '<p class="news-empty">Loading…</p>';
    get('/api/news')
      .then(function (data) {
        const feeds = data.newsFeeds || [];
        const items = data.items || [];
        newsFeedsList.innerHTML = '';
        feeds.forEach(function (feed) {
          const li = document.createElement('li');
          li.innerHTML = '<a href="' + escapeHtml((feed.url || '')) + '" target="_blank" rel="noopener">' + escapeHtml(feed.name || '') + '</a>' +
            (feed.description ? ' <span class="news-feed-desc">' + escapeHtml(feed.description) + '</span>' : '');
          newsFeedsList.appendChild(li);
        });
        if (feeds.length === 0) {
          newsFeedsList.innerHTML = '<li class="news-empty">No news feeds configured.</li>';
        }
        if (newsSections) {
          newsSections.innerHTML = '';
          if (items.length === 0) {
            newsSections.innerHTML = '<p class="news-empty">No news items yet. Check the links above for the latest from each source.</p>';
          } else {
            lastNewsItems = items;
            populateNewsFilters(items);
            applyNewsFilters();
          }
        } else if (newsList) {
          newsList.innerHTML = '';
          if (items.length === 0) {
            newsList.innerHTML = '<li class="news-empty">No news items yet. Check the links above for the latest from each source.</li>';
          } else {
            items.forEach(function (item) {
              const li = document.createElement('li');
              li.className = 'news-card';
              li.setAttribute('role', 'listitem');
              const dateStr = item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
              const title = item.title || 'Untitled';
              const url = item.url || '#';
              const sourceName = item.sourceName || 'Source';
              const sourceUrl = item.sourceUrl || '#';
              const paragraphs = getThreeParagraphSummary(item, sourceName);
              const summaryHtml = '<div class="news-card-summary"><h6 class="news-card-summary-title">Summary</h6>' +
                '<p class="news-card-summary-p">' + escapeHtml(paragraphs[0]) + '</p>' +
                '<p class="news-card-summary-p">' + escapeHtml(paragraphs[1]) + '</p>' +
                '<p class="news-card-summary-p">' + escapeHtml(paragraphs[2]) + '</p></div>';
              li.innerHTML =
                '<h4 class="news-card-title"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(title) + '</a></h4>' +
                summaryHtml +
                '<p class="news-card-meta">' +
                '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener" class="news-card-source">' + escapeHtml(sourceName) + '</a>' +
                (dateStr ? ' <span class="news-card-date">' + escapeHtml(dateStr) + '</span>' : '') +
                '</p>';
              newsList.appendChild(li);
            });
          }
        }
      })
      .catch(function () {
        newsFeedsList.innerHTML = '<li class="news-empty">Could not load news.</li>';
        if (newsSections) newsSections.innerHTML = '<p class="news-empty">News could not be loaded. Make sure the server is running and try again.</p>';
        if (newsList) newsList.innerHTML = '';
      });
  }

  btnRefresh.addEventListener('click', function () {
    btnRefresh.disabled = true;
    btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refreshing…';
    post('/api/refresh')
      .then((data) => {
        if (data.success) setMeta({ lastRefreshed: data.lastRefreshed });
        btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refresh sources';
        btnRefresh.disabled = false;
        if (data.success) {
          if (!browseRecitals.classList.contains('hidden')) loadRecitals();
          if (!browseChapters.classList.contains('hidden')) loadChapters();
        }
      })
      .catch(() => {
        btnRefresh.innerHTML = '<span class="btn-icon" aria-hidden="true">↻</span> Refresh sources';
        btnRefresh.disabled = false;
        lastRefreshedEl.textContent = 'Refresh failed. Try again later.';
      });
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
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
      }
    });
  });

  const btnRefreshNews = document.getElementById('btnRefreshNews');
  if (btnRefreshNews) btnRefreshNews.addEventListener('click', loadNews);

  if (newsFilterSource) newsFilterSource.addEventListener('change', applyNewsFilters);
  if (newsFilterTopic) newsFilterTopic.addEventListener('change', applyNewsFilters);
  if (newsFilterClear) {
    newsFilterClear.addEventListener('click', function () {
      if (newsFilterSource) newsFilterSource.value = '';
      if (newsFilterTopic) newsFilterTopic.value = '';
      applyNewsFilters();
    });
  }

  if (chaptersFilterChapter) chaptersFilterChapter.addEventListener('change', function () {
    if (chaptersFilterCategory) chaptersFilterCategory.value = chaptersFilterChapter.value;
    applyChaptersFilters();
  });
  if (chaptersFilterArticle) chaptersFilterArticle.addEventListener('change', applyChaptersFilters);
  if (chaptersFilterCategory) chaptersFilterCategory.addEventListener('change', function () {
    if (chaptersFilterChapter) chaptersFilterChapter.value = chaptersFilterCategory.value;
    applyChaptersFilters();
  });
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

  function showSection(section) {
    browsePlaceholder.classList.add('hidden');
    browseRecitals.classList.add('hidden');
    browseChapters.classList.add('hidden');
    browseSources.classList.add('hidden');
    browseDetail.classList.add('hidden');
    btnExportPdf.classList.add('hidden');
    btnBackToQuestion.classList.add('hidden');
    section.classList.remove('hidden');
    if (section === browseDetail) {
      btnBack.classList.remove('hidden');
      lastListSection = lastListSection || browseRecitals;
      if (currentDoc) btnExportPdf.classList.remove('hidden');
      if (cameFromAsk) btnBackToQuestion.classList.remove('hidden');
      updateDocNav();
    } else {
      btnBack.classList.add('hidden');
      currentDoc = null;
      lastListSection = section;
      updateDocNav();
    }
  }

  /** Update prev/next document nav based on currentDoc. Show only when viewing a single article or recital. */
  function updateDocNav() {
    if (!docNav || !docNavPrev || !docNavNext || !docNavLabel) return;
    const doc = currentDoc;
    if (!doc || !doc.type || doc.number == null) {
      docNav.classList.add('hidden');
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
    docNavPrev.textContent = isRecital ? ('← Recital (' + prevNum + ')') : ('← Article ' + prevNum);
    docNavNext.textContent = isRecital ? ('Recital (' + nextNum + ') →') : ('Article ' + nextNum + ' →');
    docNavLabel.textContent = isRecital ? ('Recital (' + num + ') of 173') : ('Article ' + num + ' of 99');
    if (docNavNumber) {
      docNavNumber.min = minNum;
      docNavNumber.max = maxNum;
      docNavNumber.value = num;
      docNavNumber.placeholder = minNum + '–' + maxNum;
      docNavNumber.setAttribute('aria-label', isRecital ? 'Recital number (1–173)' : 'Article number (1–99)');
    }
  }

  function goToDocNumber() {
    if (!currentDoc || !docNavNumber) return;
    const raw = docNavNumber.value.trim();
    if (!raw) return;
    const num = parseInt(docNavNumber.value, 10);
    if (isNaN(num)) return;
    const isRecital = currentDoc.type === 'recital';
    const minNum = isRecital ? 1 : 1;
    const maxNum = isRecital ? 173 : 99;
    if (num < minNum || num > maxNum) return;
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
  if (docNavNumber) {
    docNavNumber.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); goToDocNumber(); }
    });
  }

  btnBack.addEventListener('click', function () {
    if (lastListSection) {
      showSection(lastListSection);
      btnBack.classList.add('hidden');
      lastListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  btnBackToQuestion.addEventListener('click', function () {
    cameFromAsk = false;
    btnBackToQuestion.classList.add('hidden');
    document.querySelector('.tab[data-view="ask"]').click();
    askResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function loadRecitals() {
    get('/api/recitals').then(recitals => {
      recitalsList.innerHTML = '';
      recitals.forEach(r => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.setAttribute('role', 'listitem');
        const excerpt = r.text ? escapeHtml(r.text.slice(0, 100)).trim() + '…' : '';
        card.innerHTML = '<a href="#" data-type="recital" data-number="' + r.number + '">' +
          '<span class="doc-title">Recital (' + r.number + ')</span>' +
          (excerpt ? '<p class="excerpt">' + excerpt + '</p>' : '') + '</a>';
        recitalsList.appendChild(card);
      });
      recitalsList.querySelectorAll('a[data-type="recital"]').forEach(a => {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          openRecital(parseInt(this.dataset.number, 10));
        });
      });
    }).catch(() => { recitalsList.innerHTML = '<p class="excerpt">Could not load recitals.</p>'; });
  }

  function openRecital(number) {
    get('/api/recitals/' + number).then(data => {
      detailContent.innerHTML =
        '<div class="article-doc recital-doc">' +
        '<div class="article-separator"></div>' +
        '<p class="art-num">Recital (' + data.number + ')</p>' +
        '<div class="article-separator"></div>' +
        '<div class="article-body"><div class="article-point point-plain"><span class="point-text">' + formatRecitalRefs(escapeHtml(data.text)) + '</span></div></div>' +
        '<div class="article-separator"></div>' +
        '</div>';
      var contentAsOfHtml = data.contentAsOf
        ? '<li class="content-as-of">Text as of ' + formatContentDate(data.contentAsOf) + ' from EUR-Lex consolidated version.</li>'
        : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest from EUR-Lex.</li>';
      citationLinks.innerHTML =
        contentAsOfHtml +
        '<li><a href="' + data.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – Recitals</a></li>' +
        '<li><a href="' + data.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Regulation (EU) 2016/679</a></li>';
      currentDoc = { type: 'recital', number: data.number };
      showSection(browseDetail);
      detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function loadChapters() {
    Promise.all([get('/api/chapters'), get('/api/articles')]).then(function (results) {
      const chapters = results[0] || [];
      const articles = results[1] || [];
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

      chapterList.innerHTML = '';
      chapters.forEach(ch => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = 'Chapter ' + ch.roman + ': ' + ch.title;
        a.dataset.number = ch.number;
        a.addEventListener('click', function (e) { e.preventDefault(); openChapter(parseInt(this.dataset.number, 10)); });
        chapterList.appendChild(a);
      });

      if (chaptersFilterChapter) {
        chaptersFilterChapter.innerHTML = '<option value="">All chapters</option>';
        chapters.forEach(ch => {
          const opt = document.createElement('option');
          opt.value = ch.number;
          opt.textContent = 'Chapter ' + ch.roman + ' – ' + ch.title;
          chaptersFilterChapter.appendChild(opt);
        });
      }
      if (chaptersFilterCategory) {
        chaptersFilterCategory.innerHTML = '<option value="">All categories</option>';
        chapters.forEach(ch => {
          const opt = document.createElement('option');
          opt.value = ch.number;
          opt.textContent = ch.title;
          chaptersFilterCategory.appendChild(opt);
        });
      }
      if (chaptersFilterArticle) {
        chaptersFilterArticle.innerHTML = '<option value="">All articles</option>';
        articles.sort((a, b) => a.number - b.number).forEach(art => {
          const opt = document.createElement('option');
          opt.value = art.number;
          opt.textContent = 'Article ' + art.number + (art.title ? ' – ' + (art.title.length > 45 ? art.title.slice(0, 45) + '…' : art.title) : '');
          chaptersFilterArticle.appendChild(opt);
        });
      }
      fillChaptersSubcategoryDropdown(null);
      applyChaptersFilters();
    }).catch(() => {
      if (chaptersArticlesGrouped) chaptersArticlesGrouped.innerHTML = '<p class="excerpt">Could not load chapters and articles.</p>';
    });
  }

  function fillChaptersSubcategoryDropdown(filterChapterNumber) {
    if (!chaptersFilterSubcategory) return;
    const data = window.__chaptersData;
    if (!data || !data.topicIdsByChapter) return;
    const selected = chaptersFilterSubcategory.value;
    chaptersFilterSubcategory.innerHTML = '<option value="">All sub-categories</option>';
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
    const { chapters, articles, articleTopics } = data;
    const categoryVal = chaptersFilterCategory && chaptersFilterCategory.value !== '' ? chaptersFilterCategory.value : '';
    const chapterVal = chaptersFilterChapter && chaptersFilterChapter.value !== '' ? chaptersFilterChapter.value : '';
    const filterChapter = categoryVal !== '' ? parseInt(categoryVal, 10) : (chapterVal !== '' ? parseInt(chapterVal, 10) : null);
    const filterArticle = chaptersFilterArticle && chaptersFilterArticle.value !== '' ? parseInt(chaptersFilterArticle.value, 10) : null;
    const filterSubcategory = chaptersFilterSubcategory && chaptersFilterSubcategory.value !== '' ? chaptersFilterSubcategory.value : '';

    fillChaptersSubcategoryDropdown(filterChapter);
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

    let html = '';
    const sortedChapters = chapters.slice();
    sortedChapters.forEach(ch => {
      const entry = byChapter.get(ch.number);
      const list = entry ? entry.articles.sort((a, b) => a.number - b.number) : [];
      if (list.length === 0) return;
      html += '<section class="chapters-group-section" data-chapter="' + ch.number + '" role="region" aria-label="Chapter ' + ch.roman + '">';
      html += '<h3 class="chapters-group-heading">Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</h3>';
      html += '<p class="chapters-group-meta">Articles ' + ch.articleRange + '</p>';
      html += '<ul class="items-list chapters-group-list" role="list">';
      list.forEach(art => {
        var titleText = escapeHtml(getArticleDisplayTitle(art));
        var excerptHtml = '';
        if (art.text && art.text.trim() && art.text.indexOf('(Text not extracted') !== 0) {
          excerptHtml = escapeHtml(art.text.slice(0, 200)).trim() + '…';
        } else {
          excerptHtml = escapeHtml('View full text in the official source.');
        }
        html += '<li class="item-card" role="listitem">';
        html += '<a href="#" class="item-card-link" data-type="article" data-number="' + art.number + '">';
        html += '<span class="item-card-num">Article ' + art.number + '</span>';
        html += '<span class="item-card-title">' + titleText + '</span>';
        html += '<p class="item-card-excerpt">' + excerptHtml + '</p>';
        html += '</a></li>';
      });
      html += '</ul></section>';
    });
    if (!html) {
      html = '<p class="excerpt">No articles match the current filters. Try changing or clearing the filters.</p>';
    }
    chaptersArticlesGrouped.innerHTML = html;
    chaptersArticlesGrouped.querySelectorAll('a.item-card-link[data-type="article"]').forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openArticle(parseInt(this.dataset.number, 10));
      });
    });
  }

  function openChapter(number) {
    get('/api/chapters/' + number).then(data => {
      const ch = data;
      let html = '<div class="chapter-view">';
      html += '<header class="chapter-view-header">';
      html += '<h2 class="doc-heading chapter-heading">Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</h2>';
      html += '<p class="chapter-view-sources">Official sources: <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info</a> · <a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex</a></p>';
      html += '</header>';
      if (ch.articles && ch.articles.length) {
        html += '<ul class="items-list" role="list">';
        ch.articles.forEach(art => {
          var titleText = escapeHtml(getArticleDisplayTitle(art));
          var excerptHtml = '';
          if (art.text && art.text.trim() && art.text.indexOf('(Text not extracted') !== 0) {
            excerptHtml = escapeHtml(art.text.slice(0, 200)).trim() + '…';
          } else {
            excerptHtml = escapeHtml('View full text in the official source.');
          }
          html += '<li class="item-card" role="listitem">';
          html += '<a href="#" class="item-card-link" data-type="article" data-number="' + art.number + '">';
          html += '<span class="item-card-num">Article ' + art.number + '</span>';
          html += '<span class="item-card-title">' + titleText + '</span>';
          html += '<p class="item-card-excerpt">' + excerptHtml + '</p>';
          html += '</a></li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="chapter-empty">Article text will appear after refreshing sources. <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">Read on GDPR-Info</a>.</p>';
      }
      html += '</div>';
      detailContent.innerHTML = html;
      citationLinks.innerHTML = '<li><a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – Chapter ' + ch.roman + '</a></li><li><a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Full Regulation</a></li>';
      currentDoc = null;
      showSection(browseDetail);
      detailContent.querySelectorAll('a.item-card-link[data-type="article"]').forEach(a => {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          openArticle(parseInt(this.dataset.number, 10));
        });
      });
      detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openArticle(number) {
    get('/api/articles/' + number).then(data => {
      var displayTitle = getArticleDisplayTitle(data);
      const title = escapeHtml(displayTitle);
      const rawText = (data.text || '').trim();
      const isPlaceholderOrEmpty = !rawText || rawText.indexOf('(Text not extracted') === 0;
      let bodyHtml = '';
      if (isPlaceholderOrEmpty) {
        bodyHtml = '<div class="article-point point-plain"><span class="point-text article-unavailable">Full text for this article was not extracted from the source. Please refer to the official links below for the authoritative text.</span></div>';
      } else {
        var textToParse = rawText;
        // Remove duplicate title at start of body (e.g. "Material scope\n\n1.") so it matches GDPR-Info layout
        var titleToStrip = (displayTitle || '').trim();
        if (titleToStrip && textToParse.indexOf(titleToStrip) === 0) {
          textToParse = textToParse.slice(titleToStrip.length).replace(/^\s*\n+\s*/, '').trim();
        }
        // Split only on paragraph numbers at line/document start (not "Article 98." in the middle of a sentence)
        var segments = textToParse.split(/(?=(?:^|\n)\s*\d+\.\s+)/).filter(Boolean);
        var merged = [];
        for (var i = 0; i < segments.length; i++) {
          var seg = segments[i];
          var m = seg.match(/^\s*(\d+)\.\s*([\s\S]*)/);
          var num = m ? parseInt(m[1], 10) : 0;
          var rest = m ? m[2].trim() : '';
          // Orphan article reference: "98. " or "89. " with no/short content, and previous segment ends with "Article "
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
        if (segments.length) {
          segments.forEach(seg => {
            var pointMatch = seg.match(/^\s*(\d+)\.\s*([\s\S]*)/);
            if (pointMatch) {
              var pointText = formatRecitalRefs(escapeHtml(pointMatch[2].trim()));
              if (pointText) {
                bodyHtml += '<div class="article-point"><span class="point-num">' + escapeHtml(pointMatch[1]) + '.</span><span class="point-text">' + pointText + '</span></div>';
              }
            } else {
              var plainText = formatRecitalRefs(escapeHtml(seg.trim()));
              if (plainText) {
                bodyHtml += '<div class="article-point point-plain"><span class="point-text">' + plainText + '</span></div>';
              }
            }
          });
        } else {
          bodyHtml = '<div class="article-point point-plain"><span class="point-text">' + formatRecitalRefs(escapeHtml(rawText)) + '</span></div>';
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
        '<li><a href="' + data.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – Article ' + data.number + '</a></li>' +
        '<li><a href="' + data.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Regulation (EU) 2016/679</a></li>';
      currentDoc = { type: 'article', number: data.number };
      showSection(browseDetail);
      detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function exportCurrentDocumentToPdf() {
    if (!currentDoc || typeof html2pdf === 'undefined') return;
    var filename = currentDoc.type === 'recital'
      ? 'gdpr-recital-' + currentDoc.number + '.pdf'
      : 'gdpr-art-' + currentDoc.number + '.pdf';
    var element = document.getElementById('browseDetail');
    var opt = {
      margin: [12, 12, 12, 12],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    btnExportPdf.disabled = true;
    btnExportPdf.textContent = 'Generating…';
    html2pdf().set(opt).from(element).save().then(function () {
      btnExportPdf.disabled = false;
      btnExportPdf.textContent = 'Export PDF';
    }).catch(function () {
      btnExportPdf.disabled = false;
      btnExportPdf.textContent = 'Export PDF';
    });
  }

  btnExportPdf.addEventListener('click', exportCurrentDocumentToPdf);

  document.querySelectorAll('[data-open]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const open = this.dataset.open;
      if (open === 'recitals') { showSection(browseRecitals); loadRecitals(); }
      else if (open === 'chapters') { showSection(browseChapters); loadChapters(); }
      else if (open === 'sources') { showSection(browseSources); loadBrowseSources(); }
    });
  });

  /** From Ask results: switch to Browse and open the given article or recital */
  document.body.addEventListener('click', function (e) {
    const a = e.target.closest('a.app-goto-doc');
    if (!a) return;
    e.preventDefault();
    const type = a.dataset.type;
    const num = parseInt(a.dataset.number, 10);
    if (!type || !num) return;
    cameFromAsk = true;
    const browseTab = document.querySelector('.tab[data-view="browse"]');
    if (browseTab) browseTab.click();
    setTimeout(function () {
      if (type === 'recital') openRecital(num);
      else if (type === 'article') openArticle(num);
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

  /** Add line breaks and spacing around "Recital xx" references for readability */
  function formatRecitalRefs(escapedText) {
    if (!escapedText) return '';
    return escapedText
      .replace(/\((Recital\s+\d+)\)/g, '<br><span class="recital-ref">($1)</span><br>')
      .replace(/(\s)(Recital\s+\d+)(?=\s|\.|,|\)|;|$)/g, '$1<br><span class="recital-ref">$2</span>');
  }

  /** Build concise summary from results when the server call fails */
  function buildClientSummary(query, results) {
    if (!results || results.length === 0) return 'No provisions were found to summarize. Use the regulation text on the left.';
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
    if (!core) return 'See ' + label + ' in the regulation text on the left.';
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

  function doAsk() {
    const q = queryInput.value.trim();
    if (!q) return;

    // Refresh UI: clear any previous answer and summary so only this question's results are shown
    resultsList.innerHTML = '<p class="excerpt">Searching…</p>';
    askResults.classList.remove('hidden');
    if (overallSummaryEl) {
      overallSummaryEl.innerHTML = '';
      overallSummaryEl.classList.add('hidden');
    }
    if (askSummaryBox) {
      askSummaryBox.classList.add('hidden');
      askSummaryContent.textContent = '';
    }
    if (askRelevantDocs) {
      askRelevantDocs.classList.add('hidden');
      if (askRelevantDocsList) askRelevantDocsList.innerHTML = '';
    }

    post('/api/ask', { query: q })
      .then(data => {
        resultsList.innerHTML = '';
        if (overallSummaryEl) { overallSummaryEl.innerHTML = ''; overallSummaryEl.classList.add('hidden'); }
        if (!data.results || data.results.length === 0) {
          resultsList.innerHTML = '<p class="excerpt">No matching articles or recitals. Try different keywords or browse the chapters.</p>';
          if (askSummaryBox) askSummaryBox.classList.add('hidden');
          if (askRelevantDocs) askRelevantDocs.classList.add('hidden');
          return;
        }
        var results = data.results;
        var queryUsed = (data.query || q).trim();
        var articles = results.filter(function (r) { return r.type === 'article'; });
        var recitals = results.filter(function (r) { return r.type === 'recital'; });
        var sourceCount = articles.length + recitals.length;
        var maxItems = 5;
        var summaryItems = [];
        results.slice(0, maxItems).forEach(function (r) {
          var sourceLabel = r.type === 'recital' ? 'Recital (' + r.number + ')' : 'Article ' + r.number;
          var fullExcerpt = (r.excerpt || '').trim();
          if (!fullExcerpt) return;
          summaryItems.push({ label: sourceLabel, text: fullExcerpt, type: r.type, number: r.number, title: r.title });
        });
        var sourceLabels = results.slice(0, maxItems).map(function (r) {
          return r.type === 'recital' ? 'Recital (' + r.number + ')' : 'Article ' + r.number;
        }).join(', ');
        if (overallSummaryEl && summaryItems.length) {
          var answerText = summaryItems.map(function (item) { return stripDuplicateTitle(item.text, item.title); }).join('\n\n');
          answerText = normalizeAnswerText(answerText);
          var viewInAppLinks = summaryItems.map(function (item) {
            return '<a href="#" class="app-goto-doc" data-type="' + escapeHtml(item.type) + '" data-number="' + item.number + '">' + escapeHtml(item.label) + '</a>';
          }).join(' · ');
          var contentAsOfLine = data.contentAsOf
            ? '<p class="content-as-of-inline">Regulation text as of ' + formatContentDate(data.contentAsOf) + ' from <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679" target="_blank" rel="noopener">EUR-Lex</a> consolidated version.</p>'
            : '<p class="content-as-of-inline">Regulation text not yet refreshed. Click <strong>Refresh sources</strong> in the header to load the latest from EUR-Lex.</p>';
          overallSummaryEl.innerHTML =
            '<p class="qa-question"><strong>Question:</strong> ' + escapeHtml(queryUsed) + '</p>' +
            '<p class="qa-answer"><strong>Answer:</strong> ' + escapeHtml(answerText) + '</p>' +
            contentAsOfLine +
            '<p class="overall-summary-sources">Source: ' + escapeHtml(sourceLabels) + ' — <a href="https://gdpr-info.eu/" target="_blank" rel="noopener">GDPR-Info</a> · <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" target="_blank" rel="noopener">EUR-Lex</a></p>' +
            '<p class="qa-view-in-app">View in app: ' + viewInAppLinks + '</p>';
          overallSummaryEl.classList.remove('hidden');
        }

        if (askRelevantDocs && askRelevantDocsList) {
          askRelevantDocsList.innerHTML = '';
          results.forEach(function (r) {
            var label = r.type === 'recital'
              ? 'Recital (' + r.number + ')'
              : (getArticleDisplayTitle({ number: r.number, title: r.title }) + (r.chapterTitle ? ' · ' + r.chapterTitle : ''));
            var li = document.createElement('li');
            li.className = 'ask-relevant-doc-item';
            li.setAttribute('role', 'listitem');
            li.innerHTML =
              '<span class="ask-relevant-doc-label">' + escapeHtml(label) + '</span>' +
              '<span class="ask-relevant-doc-links">' +
              '<a href="#" class="app-goto-doc link-in-app" data-type="' + escapeHtml(r.type) + '" data-number="' + r.number + '">View in app</a>' +
              ' · <a href="' + escapeHtml(r.sourceUrl || '') + '" target="_blank" rel="noopener">GDPR-Info</a>' +
              ' · <a href="' + escapeHtml(r.eurLexUrl || '') + '" target="_blank" rel="noopener">EUR-Lex</a>' +
              '</span>';
            askRelevantDocsList.appendChild(li);
          });
          askRelevantDocs.classList.remove('hidden');
        }

        results.forEach(r => {
          const card = document.createElement('div');
          card.className = 'result-card qa-result-card';
          card.setAttribute('role', 'listitem');
          const typeLabel = r.type === 'recital'
            ? 'Recital (' + r.number + ')'
            : (getArticleDisplayTitle({ number: r.number, title: r.title }) + (r.chapterTitle ? ' · ' + r.chapterTitle : ''));
          const answerText = normalizeAnswerText(stripDuplicateTitle((r.excerpt || '').trim(), r.title)) || 'No text available for this provision.';
          card.innerHTML = '<p class="qa-question"><strong>Question:</strong> ' + escapeHtml(queryUsed) + '</p>' +
            '<p class="qa-answer"><strong>Answer:</strong> ' + escapeHtml(answerText) + '</p>' +
            '<p class="qa-source">Source: ' + escapeHtml(typeLabel) + ' — ' +
            '<a href="' + r.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info</a>' +
            ' · <a href="' + r.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex</a>' +
            ' · <a href="#" class="app-goto-doc" data-type="' + escapeHtml(r.type) + '" data-number="' + r.number + '">View in app</a></p>';
          resultsList.appendChild(card);
        });

        if (askSummaryBox && askSummaryContent) {
          askSummaryBox.classList.remove('hidden');
          askSummaryContent.textContent = 'Generating summary…';
          askSummaryContent.classList.add('summary-loading');
          post('/api/summarize', {
            query: queryUsed,
            excerpts: results.slice(0, 5).map(function (r) { return { type: r.type, number: r.number, excerpt: r.excerpt }; })
          })
            .then(function (sumData) {
              askSummaryContent.textContent = sumData.summary || 'No summary available.';
              askSummaryContent.classList.remove('summary-loading');
            })
            .catch(function () {
              askSummaryContent.textContent = buildClientSummary(queryUsed, results);
              askSummaryContent.classList.remove('summary-loading');
            });
        }
      })
      .catch(() => {
        resultsList.innerHTML = '<p class="excerpt">Search failed. Please try again.</p>';
        if (overallSummaryEl) { overallSummaryEl.innerHTML = ''; overallSummaryEl.classList.add('hidden'); }
        if (askSummaryBox) { askSummaryBox.classList.add('hidden'); askSummaryContent.textContent = ''; }
        if (askRelevantDocs) { askRelevantDocs.classList.add('hidden'); if (askRelevantDocsList) askRelevantDocsList.innerHTML = ''; }
      });
  }

  loadMeta();
})();
