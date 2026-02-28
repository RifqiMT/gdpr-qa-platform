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
  const browseDetail = document.getElementById('browseDetail');
  const recitalsList = document.getElementById('recitalsList');
  const chaptersList = document.getElementById('chaptersList');
  const chapterList = document.getElementById('chapterList');
  const detailContent = document.getElementById('detailContent');
  const citationLinks = document.getElementById('citationLinks');
  const queryInput = document.getElementById('query');
  const btnAsk = document.getElementById('btnAsk');
  const btnExportPdf = document.getElementById('btnExportPdf');
  const askResults = document.getElementById('askResults');
  const resultsList = document.getElementById('resultsList');
  const overallSummaryEl = document.getElementById('overallSummary');
  const askSummaryBox = document.getElementById('askSummaryBox');
  const askSummaryContent = document.getElementById('askSummaryContent');

  let lastListSection = null;
  let currentDoc = null;
  let cameFromAsk = false;

  function setMeta(meta) {
    if (meta.lastRefreshed) {
      const d = new Date(meta.lastRefreshed);
      lastRefreshedEl.textContent = 'Last refreshed: ' + d.toLocaleString();
    } else {
      lastRefreshedEl.textContent = 'Content not yet refreshed. Click "Refresh sources" to load from official sites.';
    }
  }

  function loadMeta() {
    get('/api/meta').then(setMeta).catch(() => { lastRefreshedEl.textContent = 'Could not load meta.'; });
  }

  function loadSources() {
    if (!sourcesList) return;
    get('/api/meta')
      .then(function (data) {
        const sources = data.sources || [];
        sourcesList.innerHTML = '';
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
          sourcesList.appendChild(card);
        });
      })
      .catch(function () {
        sourcesList.innerHTML = '<p class="excerpt">Could not load sources.</p>';
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

  function showSection(section) {
    browsePlaceholder.classList.add('hidden');
    browseRecitals.classList.add('hidden');
    browseChapters.classList.add('hidden');
    browseDetail.classList.add('hidden');
    btnExportPdf.classList.add('hidden');
    btnBackToQuestion.classList.add('hidden');
    section.classList.remove('hidden');
    if (section === browseDetail) {
      btnBack.classList.remove('hidden');
      lastListSection = lastListSection || browseRecitals;
      if (currentDoc) btnExportPdf.classList.remove('hidden');
      if (cameFromAsk) btnBackToQuestion.classList.remove('hidden');
    } else {
      btnBack.classList.add('hidden');
      currentDoc = null;
      lastListSection = section;
    }
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
      citationLinks.innerHTML =
        '<li><a href="' + data.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – Recitals</a></li>' +
        '<li><a href="' + data.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Regulation (EU) 2016/679</a></li>';
      currentDoc = { type: 'recital', number: data.number };
      showSection(browseDetail);
      detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function loadChapters() {
    get('/api/chapters').then(chapters => {
      chapterList.innerHTML = '';
      chapters.forEach(ch => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = 'Chapter ' + ch.roman + ': ' + ch.title;
        a.dataset.number = ch.number;
        a.addEventListener('click', function (e) { e.preventDefault(); openChapter(parseInt(this.dataset.number, 10)); });
        chapterList.appendChild(a);
      });
      chaptersList.innerHTML = '';
      chapters.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = '<h4>Chapter ' + ch.roman + '</h4><p>' + escapeHtml(ch.title) + '</p><p>Articles ' + ch.articleRange + '</p>' +
          '<a href="#" data-open-chapter="' + ch.number + '">View articles</a>';
        chaptersList.appendChild(card);
      });
      chaptersList.querySelectorAll('a[data-open-chapter]').forEach(a => {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          openChapter(parseInt(this.dataset.openChapter, 10));
        });
      });
    }).catch(() => { chaptersList.innerHTML = '<p class="excerpt">Could not load chapters.</p>'; });
  }

  function openChapter(number) {
    get('/api/chapters/' + number).then(data => {
      const ch = data;
      let html = '<h2 class="doc-heading">Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</h2>';
      html += '<p class="source-links" style="margin-bottom:1.25rem">Official sources: <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info</a> · <a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex</a></p>';
      if (ch.articles && ch.articles.length) {
        html += '<ul class="items-list">';
        ch.articles.forEach(art => {
          html += '<li class="item-card"><a href="#" data-type="article" data-number="' + art.number + '">Article ' + art.number + ' – ' + escapeHtml(art.title) + '</a>' +
            (art.text ? '<p class="excerpt">' + escapeHtml(art.text.slice(0, 160)) + '…</p>' : '') + '</li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="excerpt">Article text will appear after refreshing sources. <a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">Read on GDPR-Info</a>.</p>';
      }
      detailContent.innerHTML = html;
      citationLinks.innerHTML = '<li><a href="' + ch.sourceUrl + '" target="_blank" rel="noopener">GDPR-Info – Chapter ' + ch.roman + '</a></li><li><a href="' + ch.eurLexUrl + '" target="_blank" rel="noopener">EUR-Lex – Full Regulation</a></li>';
      currentDoc = null;
      showSection(browseDetail);
      detailContent.querySelectorAll('a[data-type="article"]').forEach(a => {
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
      const title = escapeHtml(data.title || '');
      const rawText = (data.text || '').trim();
      const segments = rawText.split(/(?=\d+\.\s)/).filter(Boolean);
      let bodyHtml = '';
      if (segments.length) {
        segments.forEach(seg => {
          const m = seg.match(/^(\d+)\.\s*([\s\S]*)/);
          if (m) {
            var pointText = formatRecitalRefs(escapeHtml(m[2].trim()));
            bodyHtml += '<div class="article-point"><span class="point-num">' + m[1] + '.</span><span class="point-text">' + pointText + '</span></div>';
          } else {
            var plainText = formatRecitalRefs(escapeHtml(seg.trim()));
            bodyHtml += '<div class="article-point point-plain"><span class="point-text">' + plainText + '</span></div>';
          }
        });
      } else {
        bodyHtml = '<div class="article-point point-plain"><span class="point-text">' + formatRecitalRefs(escapeHtml(rawText)) + '</span></div>';
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
      citationLinks.innerHTML =
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

    post('/api/ask', { query: q })
      .then(data => {
        resultsList.innerHTML = '';
        if (overallSummaryEl) { overallSummaryEl.innerHTML = ''; overallSummaryEl.classList.add('hidden'); }
        if (!data.results || data.results.length === 0) {
          resultsList.innerHTML = '<p class="excerpt">No matching articles or recitals. Try different keywords or browse the chapters.</p>';
          if (askSummaryBox) askSummaryBox.classList.add('hidden');
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
          summaryItems.push({ label: sourceLabel, text: fullExcerpt, type: r.type, number: r.number });
        });
        var sourceLabels = results.slice(0, maxItems).map(function (r) {
          return r.type === 'recital' ? 'Recital (' + r.number + ')' : 'Article ' + r.number;
        }).join(', ');
        if (overallSummaryEl && summaryItems.length) {
          var answerText = summaryItems.map(function (item) { return item.text; }).join('\n\n');
          var viewInAppLinks = summaryItems.map(function (item) {
            return '<a href="#" class="app-goto-doc" data-type="' + escapeHtml(item.type) + '" data-number="' + item.number + '">' + escapeHtml(item.label) + '</a>';
          }).join(' · ');
          overallSummaryEl.innerHTML =
            '<p class="qa-question"><strong>Question:</strong> ' + escapeHtml(queryUsed) + '</p>' +
            '<p class="qa-answer"><strong>Answer:</strong> ' + escapeHtml(answerText) + '</p>' +
            '<p class="overall-summary-sources">Source: ' + escapeHtml(sourceLabels) + ' — <a href="https://gdpr-info.eu/" target="_blank" rel="noopener">GDPR-Info</a> · <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" target="_blank" rel="noopener">EUR-Lex</a></p>' +
            '<p class="qa-view-in-app">View in app: ' + viewInAppLinks + '</p>';
          overallSummaryEl.classList.remove('hidden');
        }

        results.forEach(r => {
          const card = document.createElement('div');
          card.className = 'result-card qa-result-card';
          card.setAttribute('role', 'listitem');
          const typeLabel = r.type === 'recital' ? 'Recital (' + r.number + ')' : 'Article ' + r.number + (r.chapterTitle ? ' · ' + r.chapterTitle : '');
          const answerText = (r.excerpt || '').trim() || 'No text available for this provision.';
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
      });
  }

  loadMeta();
})();
