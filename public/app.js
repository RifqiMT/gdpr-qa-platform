(function () {
  const API = (function () {
    try {
      var el = document.querySelector('meta[name="gdpr-api-base"]');
      var v = el && el.getAttribute('content');
      if (v && typeof v === 'string') {
        v = v.trim().replace(/\/$/, '');
        if (v) return v;
      }
    } catch (e) {}
    return '';
  })();

  var REG_STORAGE_KEY = 'gdpr-qa-regulation-v1';
  var REGION_STORAGE_KEY = 'gdpr-qa-region-v1';
  var REGION_IDS = { all: 1, eu: 1, id: 1, us: 1, intl: 1 };
  var currentRegion = 'all';
  var currentRegulation = {
    id: 'gdpr',
    shortName: 'GDPR',
    maxArticles: 99,
    maxRecitals: 173,
    segmentMeta: { recitals: '1–173', articles: '1–99' }
  };
  var regulationsCatalog = [];

  function regulationMaxArticles() {
    return currentRegulation.maxArticles || 99;
  }

  function regulationMaxRecitals() {
    return currentRegulation.maxRecitals || 173;
  }

  function regulationShortLabel() {
    return currentRegulation.shortName || 'GDPR';
  }

  function regulationFilterPlaceholder(kind) {
    var sn = regulationShortLabel();
    if (kind === 'categories') return 'All ' + sn + ' categories';
    if (kind === 'subcategories') return 'All ' + sn + ' sub-categories';
    if (kind === 'chapters') return 'All ' + sn + ' chapters';
    if (kind === 'articles') return 'All ' + sn + ' ' + provisionKindLabels().articles;
    return '';
  }

  function regulationChapterFilterLabel(ch) {
    return regulationShortLabel() + ' Chapter ' + ch.roman + ' – ' + ch.title;
  }

  function provisionKindLabels() {
    var id = (getRegProfile() && getRegProfile().id) || '';
    if (id === 'id-pdp' || id === 'id-satu-data') {
      return {
        article: 'Pasal',
        articles: 'pasal',
        recital: 'Considering',
        recitals: 'considering clauses',
        articleShort: 'Pasal',
        recitalShort: 'Cons.'
      };
    }
    if (id === 'id-ai-ethics') {
      return {
        article: 'Section',
        articles: 'sections',
        recital: 'Ethical value',
        recitals: 'ethical values',
        articleShort: 'Sec.',
        recitalShort: 'Value'
      };
    }
    if (id.indexOf('us-') === 0) {
      return {
        article: 'Section',
        articles: 'sections',
        recital: 'Purpose note',
        recitals: 'purpose notes',
        articleShort: '§',
        recitalShort: 'Note'
      };
    }
    if (id.indexOf('iso-') === 0) {
      return {
        article: 'Clause',
        articles: 'clauses',
        recital: 'Purpose note',
        recitals: 'purpose notes',
        articleShort: 'Cl.',
        recitalShort: 'Note'
      };
    }
    if (id === 'soc2') {
      return {
        article: 'Criterion',
        articles: 'criteria',
        recital: 'Purpose note',
        recitals: 'purpose notes',
        articleShort: 'CC',
        recitalShort: 'Note'
      };
    }
    return {
      article: 'Article',
      articles: 'articles',
      recital: 'Recital',
      recitals: 'recitals',
      articleShort: 'Art.',
      recitalShort: 'Rec.'
    };
  }

  function relatedPanelBadgeAriaLabel(kind, count) {
    var legal = getRegProfile().legalLabel;
    var kinds = provisionKindLabels();
    var noun = kind === 'article' ? kinds.articles : kinds.recitals;
    if (!count) return 'No related ' + legal + ' ' + noun;
    return count + ' related ' + legal + ' ' + noun;
  }

  function syncCitationSidebarChrome(reg) {
    reg = reg || getRegProfile();
    var ui = reg.citationsUi || {};
    var aside = document.getElementById('citationsSidebar');
    if (aside) {
      aside.setAttribute('aria-label', ui.asideAriaLabel || reg.shortName + ': official links and cross-references');
    }
    var officialLead = document.getElementById('citationOfficialLead');
    if (officialLead) {
      officialLead.innerHTML =
        ui.officialLeadHtml ||
        'Authoritative sources and freshness of the consolidated <strong>' +
          escapeHtml(reg.shortName) +
          '</strong> text.';
    }
    var artTitle = document.getElementById('relatedArticlesTitleLabel');
    if (artTitle) {
      artTitle.textContent = ui.relatedArticlesTitle || 'Related ' + reg.legalLabel + ' articles';
    }
    var recTitle = document.getElementById('relatedRecitalsTitleLabel');
    if (recTitle) {
      recTitle.textContent = ui.relatedRecitalsTitle || 'Related ' + reg.legalLabel + ' recitals';
    }
    var artLead = document.getElementById('relatedArticlesLead');
    if (artLead) {
      artLead.innerHTML =
        ui.relatedArticlesLeadHtml ||
        'Mentioned in the text or cross-referenced from this provision (<a href="' +
          escapeHtml(reg.infoBaseUrl) +
          '/" target="_blank" rel="noopener">' +
          escapeHtml(reg.infoSiteName) +
          '</a>).';
    }
    var recLead = document.getElementById('relatedRecitalsLead');
    if (recLead) {
      recLead.innerHTML =
        ui.relatedRecitalsLeadHtml ||
        'Mentioned in the text or cross-referenced from this provision (<a href="' +
          escapeHtml(reg.infoBaseUrl) +
          '/" target="_blank" rel="noopener">' +
          escapeHtml(reg.infoSiteName) +
          '</a>).';
    }
    var artTrig = document.getElementById('relatedArticlesTrigger');
    if (artTrig) {
      artTrig.setAttribute(
        'aria-label',
        ui.relatedArticlesToggleLabel || 'Show or hide related ' + reg.legalLabel + ' articles'
      );
    }
    var recTrig = document.getElementById('relatedRecitalsTrigger');
    if (recTrig) {
      recTrig.setAttribute(
        'aria-label',
        ui.relatedRecitalsToggleLabel || 'Show or hide related ' + reg.legalLabel + ' recitals'
      );
    }
    var ba = document.getElementById('relatedArticlesCount');
    var br = document.getElementById('relatedRecitalsCount');
    var artCount = ba ? parseInt(ba.textContent, 10) || 0 : 0;
    var recCount = br ? parseInt(br.textContent, 10) || 0 : 0;
    if (ba) ba.setAttribute('aria-label', relatedPanelBadgeAriaLabel('article', artCount));
    if (br) br.setAttribute('aria-label', relatedPanelBadgeAriaLabel('recital', recCount));
  }

  function syncChaptersFilterPlaceholders() {
    chaptersFilterComboboxesSyncInputsFromSelects();
  }

  function officialSiteName(profile) {
    profile = profile || getRegProfile();
    return (profile && (profile.officialSiteName || profile.eurLexLabel)) || 'Official text';
  }

  function getRegProfile() {
    var api = currentRegulation || {};
    var base =
      typeof getRegulationProfile === 'function'
        ? getRegulationProfile(api.id || 'gdpr')
        : null;
    if (!base && typeof REGULATION_PROFILES !== 'undefined') {
      base = REGULATION_PROFILES[api.id] || REGULATION_PROFILES.gdpr;
    }
    base = base || {};
    return Object.assign({}, base, {
      id: api.id || base.id || 'gdpr',
      shortName: api.shortName || base.shortName || 'GDPR',
      fullName: api.fullName || base.fullName || '',
      maxArticles: api.maxArticles || base.maxArticles || 99,
      maxRecitals: api.maxRecitals || base.maxRecitals || 173,
      segmentMeta: api.segmentMeta || base.segmentMeta || { recitals: '', articles: '' },
      jurisdiction: api.jurisdiction || base.jurisdiction || (String(api.id || base.id || '').indexOf('id-') === 0 ? 'id' : 'eu')
    });
  }

  var loadChaptersRequestId = 0;
  var loadRecitalsRequestId = 0;
  var readerFullLoadToken = 0;

  function clearRegulationBrowseCaches() {
    recitalsDataCache = null;
    docNavArticlesListCache = null;
    window.__chaptersData = null;
    window.__chapterSummaries = null;
    articleToRecitalsMapPromise = null;
    loadChaptersRequestId += 1;
    loadRecitalsRequestId += 1;
    /* Cancel in-flight Full corpus renders so a prior regulation cannot paint after switch. */
    readerFullLoadToken += 1;
  }

  /**
   * Leave the article/recital reader when the active regulation changes, then
   * land on the matching list (chapters vs recitals) so reload can fetch the new corpus.
   */
  function exitReaderForRegulationChange() {
    if (!browseDetail || browseDetail.classList.contains('hidden')) return;
    var resume =
      currentDoc && currentDoc.type === 'recital'
        ? browseRecitals
        : currentDoc && currentDoc.type === 'article'
          ? browseChapters
          : lastListSection || browseChapters;
    citationReturnDoc = null;
    cameFromAsk = false;
    currentDoc = null;
    if (btnBackFromCitation) btnBackFromCitation.classList.add('hidden');
    if (btnBackToQuestion) btnBackToQuestion.classList.add('hidden');
    if (btnExportPdf) btnExportPdf.classList.add('hidden');
    if (btnBack) btnBack.classList.add('hidden');
    if (detailContent) detailContent.innerHTML = '';
    if (citationLinks) citationLinks.innerHTML = '';
    if (relatedArticles) relatedArticles.innerHTML = '';
    if (relatedRecitals) relatedRecitals.innerHTML = '';
    if (resume) {
      lastListSection = resume;
      showSection(resume);
    } else if (browsePlaceholder) {
      browsePlaceholder.classList.remove('hidden');
      if (browseRecitals) browseRecitals.classList.add('hidden');
      if (browseChapters) browseChapters.classList.add('hidden');
      browseDetail.classList.add('hidden');
      updateBrowseSectionMenu();
    }
  }

  function normalizeChapterNumber(value) {
    if (value == null || value === '') return null;
    var n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }

  function resetChaptersFilters() {
    if (chaptersFilterCategory) chaptersFilterCategory.value = '';
    if (chaptersFilterChapter) chaptersFilterChapter.value = '';
    if (chaptersFilterArticle) chaptersFilterArticle.value = '';
    if (chaptersFilterSubcategory) chaptersFilterSubcategory.value = '';
    chaptersFilterComboboxesSyncInputsFromSelects();
    updateChaptersFiltersToggleMeta();
  }

  function chaptersFiltersAreActive() {
    if (chaptersFilterChapter && chaptersFilterChapter.value !== '') return true;
    if (chaptersFilterCategory && chaptersFilterCategory.value !== '') return true;
    if (chaptersFilterArticle && chaptersFilterArticle.value !== '') return true;
    var profile = getRegProfile();
    if (
      profile.hasArticleTopics &&
      chaptersFilterSubcategory &&
      chaptersFilterSubcategory.value !== ''
    ) {
      return true;
    }
    return false;
  }

  function getChaptersFilterSubcategoryValue() {
    var profile = getRegProfile();
    if (!profile.hasArticleTopics || !chaptersFilterSubcategory) return '';
    return chaptersFilterSubcategory.value !== '' ? chaptersFilterSubcategory.value : '';
  }

  function describeChaptersActiveFilters() {
    var parts = [];
    var profile = getRegProfile();
    var sn = profile.shortName;
    var chNum = chaptersFilterGetChapterNumber();
    if (chNum != null) {
      parts.push(sn + ' chapter ' + chNum);
    }
    if (profile.hasArticleTopics && chaptersFilterSubcategory && chaptersFilterSubcategory.value !== '') {
      var subOpt = chaptersFilterSubcategory.options[chaptersFilterSubcategory.selectedIndex];
      parts.push(subOpt && subOpt.textContent ? subOpt.textContent : 'sub-category');
    }
    if (chaptersFilterArticle && chaptersFilterArticle.value !== '') {
      parts.push(sn + ' article ' + chaptersFilterArticle.value);
    }
    return parts;
  }

  function updateChaptersFiltersToggleMeta() {
    var meta = document.getElementById('chaptersFiltersToggleMeta');
    var activeEl = document.getElementById('chaptersActiveFilters');
    var parts = describeChaptersActiveFilters();
    if (meta) {
      meta.textContent = parts.length ? parts.join(' · ') : 'All chapters & articles';
    }
    if (activeEl) {
      if (!parts.length) {
        activeEl.classList.add('hidden');
        activeEl.innerHTML = '';
      } else {
        activeEl.classList.remove('hidden');
        activeEl.innerHTML =
          '<span class="chapters-active-filters-label">Active filters:</span> ' +
          escapeHtml(parts.join(' · ')) +
          ' <button type="button" class="chapters-active-filters-clear" id="chaptersActiveFiltersClear">Clear all</button>';
      }
    }
  }

  (function bindChaptersActiveFiltersClear() {
    var host = document.getElementById('chaptersActiveFilters');
    if (!host || host.dataset.bound === '1') return;
    host.dataset.bound = '1';
    host.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'chaptersActiveFiltersClear') {
        resetChaptersFilters();
        applyChaptersFilters();
      }
    });
  })();

  function initChaptersFiltersPanelToggle() {
    var toggle = document.getElementById('chaptersFiltersToggle');
    var panel = document.getElementById('chaptersFiltersPanel');
    if (!toggle || !panel || toggle.dataset.bound === '1') return;
    toggle.dataset.bound = '1';
    var mq = window.matchMedia('(min-width: 900px)');
    function syncPanelForViewport() {
      if (mq.matches) {
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.classList.add('chapters-filters-toggle--desktop');
      } else {
        toggle.classList.remove('chapters-filters-toggle--desktop');
        if (toggle.getAttribute('data-user-expanded') !== 'true') {
          panel.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    }
    toggle.addEventListener('click', function () {
      if (mq.matches) return;
      var open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('data-user-expanded', open ? 'true' : 'false');
    });
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', syncPanelForViewport);
    } else if (mq.addListener) {
      mq.addListener(syncPanelForViewport);
    }
    syncPanelForViewport();
  }

  function renderRegulationSourceLinks(el, profile) {
    if (!el || !profile) return;
    el.innerHTML =
      'Official sources: <a href="' +
      escapeHtml(profile.recitalsIndexUrl || profile.infoBaseUrl) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(profile.infoSiteName) +
      '</a> · <a href="' +
      escapeHtml(profile.eurLexUrl) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(officialSiteName(profile)) +
      '</a>';
  }

  function loadStoredRegulationId() {
    try {
      var s = localStorage.getItem(REG_STORAGE_KEY);
      if (
        s === 'ai-act' ||
        s === 'gdpr' ||
        s === 'data-act' ||
        s === 'id-pdp' ||
        s === 'id-satu-data' ||
        s === 'id-ai-ethics' ||
        s === 'us-ccpa' ||
        s === 'us-admt' ||
        s === 'us-open-data' ||
        s === 'iso-27701' ||
        s === 'iso-19941' ||
        s === 'iso-23894' ||
        s === 'soc2'
      )
        return s;
    } catch (e) {}
    return 'gdpr';
  }

  function saveRegulationId(id) {
    try {
      localStorage.setItem(REG_STORAGE_KEY, id);
    } catch (e) {}
  }

  function loadStoredRegion() {
    try {
      var s = localStorage.getItem(REGION_STORAGE_KEY);
      if (s && REGION_IDS[s]) return s;
    } catch (e) {}
    return 'all';
  }

  function saveRegion(id) {
    try {
      localStorage.setItem(REGION_STORAGE_KEY, id);
    } catch (e) {}
  }

  function regulationJurisdiction(reg) {
    if (!reg) return 'eu';
    if (reg.jurisdiction === 'id' || reg.jurisdiction === 'eu' || reg.jurisdiction === 'us' || reg.jurisdiction === 'intl') {
      return reg.jurisdiction;
    }
    var id = String(reg.id || '');
    if (id.indexOf('id-') === 0) return 'id';
    if (id.indexOf('us-') === 0) return 'us';
    if (id.indexOf('iso-') === 0 || id === 'soc2') return 'intl';
    return 'eu';
  }

  function catalogForRegion(region) {
    var list =
      regulationsCatalog && regulationsCatalog.length ? regulationsCatalog.slice() : fallbackRegulationsCatalog();
    if (!region || region === 'all') return list;
    return list.filter(function (r) {
      return regulationJurisdiction(r) === region;
    });
  }

  function fallbackRegulationsCatalog() {
    var ids = [
      'gdpr',
      'data-act',
      'ai-act',
      'id-pdp',
      'id-satu-data',
      'id-ai-ethics',
      'us-ccpa',
      'us-open-data',
      'us-admt',
      'iso-27701',
      'iso-19941',
      'iso-23894',
      'soc2'
    ];
    return ids.map(function (id) {
      var p = getRegulationProfileById(id) || { id: id, shortName: id };
      var juris = regulationJurisdiction(p);
      return {
        id: p.id || id,
        shortName: p.shortName || id,
        jurisdiction: juris,
        jurisdictionLabel:
          juris === 'id'
            ? 'Indonesia'
            : juris === 'us'
              ? 'United States'
              : juris === 'intl'
                ? 'International'
                : 'European Union'
      };
    });
  }

  function defaultRegulationForRegion(region) {
    var list = catalogForRegion(region);
    if (!list.length) return null;
    if (region === 'id') {
      return (
        list.find(function (r) {
          return r.id === 'id-pdp';
        }) || list[0]
      );
    }
    if (region === 'eu') {
      return (
        list.find(function (r) {
          return r.id === 'gdpr';
        }) || list[0]
      );
    }
    if (region === 'us') {
      return (
        list.find(function (r) {
          return r.id === 'us-ccpa';
        }) || list[0]
      );
    }
    if (region === 'intl') {
      return (
        list.find(function (r) {
          return r.id === 'iso-27701';
        }) || list[0]
      );
    }
    return (
      list.find(function (r) {
        return r.id === (currentRegulation && currentRegulation.id);
      }) || list[0]
    );
  }

  function populateRegulationSelect() {
    var sel = document.getElementById('regulationSelect');
    if (!sel) return;
    var list = catalogForRegion(currentRegion);
    sel.innerHTML = '';
    if (currentRegion === 'all') {
      var lastGroup = null;
      var og = null;
      list.forEach(function (r) {
        var groupLabel =
          r.jurisdictionLabel ||
          (regulationJurisdiction(r) === 'id'
            ? 'Indonesia'
            : regulationJurisdiction(r) === 'us'
              ? 'United States'
              : regulationJurisdiction(r) === 'intl'
                ? 'International'
                : 'European Union');
        if (groupLabel !== lastGroup) {
          og = document.createElement('optgroup');
          og.label = groupLabel;
          sel.appendChild(og);
          lastGroup = groupLabel;
        }
        var opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.shortName;
        (og || sel).appendChild(opt);
      });
    } else {
      list.forEach(function (r) {
        var opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.shortName;
        sel.appendChild(opt);
      });
    }
    if (currentRegulation && currentRegulation.id) sel.value = currentRegulation.id;
    sel.title =
      currentRegion === 'id'
        ? 'Switch Indonesian regulation'
        : currentRegion === 'eu'
          ? 'Switch EU regulation'
          : currentRegion === 'us'
            ? 'Switch United States regulation'
            : currentRegion === 'intl'
              ? 'Switch international standard'
              : 'Switch between EU, Indonesian, United States, and international instruments';
  }

  function positionRegionFilterThumb() {
    var root = document.getElementById('regionFilter');
    var thumb = document.getElementById('regionFilterThumb');
    if (!root || !thumb) return;
    var active = root.querySelector('.region-filter-btn.is-active');
    if (!active) {
      thumb.style.width = '0px';
      thumb.classList.remove('is-ready');
      return;
    }
    var rootRect = root.getBoundingClientRect();
    var btnRect = active.getBoundingClientRect();
    if (!rootRect.width || !btnRect.width) {
      thumb.classList.remove('is-ready');
      return;
    }
    var left = Math.max(0, btnRect.left - rootRect.left);
    var width = Math.min(btnRect.width, Math.max(0, rootRect.width - left));
    thumb.style.left = left + 'px';
    thumb.style.width = width + 'px';
    thumb.classList.add('is-ready');
  }

  function positionTabsTrackThumb() {
    var track = document.getElementById('tabsTrack');
    var thumb = document.getElementById('tabsTrackThumb');
    if (!track || !thumb) return;
    var active = track.querySelector('.tab.active');
    if (!active) {
      thumb.style.width = '0px';
      thumb.classList.remove('is-ready');
      return;
    }
    var target = active.closest('.tab-browse-cluster') || active;
    var trackRect = track.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    if (!trackRect.width || !targetRect.width) {
      thumb.classList.remove('is-ready');
      return;
    }
    var pad = 0;
    var left = Math.max(0, targetRect.left - trackRect.left - pad);
    var width = Math.min(targetRect.width, Math.max(0, trackRect.width - left - pad));
    thumb.style.left = left + 'px';
    thumb.style.width = width + 'px';
    thumb.classList.add('is-ready');
  }

  function scheduleTabsTrackThumb() {
    requestAnimationFrame(function () {
      positionTabsTrackThumb();
      requestAnimationFrame(positionTabsTrackThumb);
    });
  }

  function syncRegulationJurisdictionChip(reg) {
    var chip = document.getElementById('regulationJurisdictionChip');
    if (!chip) return;
    reg = reg || getRegProfile();
    var jur = regulationJurisdiction(reg);
    var label =
      (reg && reg.jurisdictionLabel) ||
      (jur === 'id'
        ? 'Indonesia'
        : jur === 'us'
          ? 'United States'
          : jur === 'intl'
            ? 'International'
            : 'European Union');
    var prev = chip.getAttribute('data-jurisdiction');
    chip.textContent = label;
    chip.setAttribute('data-jurisdiction', jur);
    if (prev && prev !== jur) {
      chip.classList.add('is-updating');
      window.setTimeout(function () {
        chip.classList.remove('is-updating');
      }, 220);
    }
  }

  function syncRegionFilterUi() {
    var root = document.getElementById('regionFilter');
    if (root) {
      root.setAttribute('data-region', currentRegion);
      root.querySelectorAll('.region-filter-btn[data-region]').forEach(function (btn) {
        var on = btn.getAttribute('data-region') === currentRegion;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });
      requestAnimationFrame(function () {
        positionRegionFilterThumb();
        requestAnimationFrame(positionRegionFilterThumb);
      });
    }
    var chrome = document.getElementById('appChrome');
    if (chrome) chrome.setAttribute('data-region', currentRegion);
    document.documentElement.setAttribute('data-region', currentRegion);
  }

  function applyRegionToWelcomeGrid() {
    var grid = document.getElementById('browseWelcomeGrid');
    if (!grid) return;
    grid.querySelectorAll('.browse-welcome-region').forEach(function (section) {
      var id = section.getAttribute('data-region');
      var show = currentRegion === 'all' || currentRegion === id;
      section.hidden = !show;
    });
    grid.classList.toggle('browse-welcome-grid--single-region', currentRegion !== 'all');
  }

  function syncBrowseWelcomeHero() {
    var kicker = document.querySelector('.browse-welcome-hero-kicker');
    var title = document.querySelector('.browse-welcome-hero-title');
    var lead = document.getElementById('browseWelcomeGridLead');
    if (currentRegion === 'eu') {
      if (kicker) kicker.textContent = 'European Union';
      if (title) title.textContent = 'Choose an EU regulation';
      if (lead) {
        lead.textContent =
          'Three binding EU instruments. Select a card to focus Browse and Ask, or pick another regulation in the header.';
      }
    } else if (currentRegion === 'id') {
      if (kicker) kicker.textContent = 'Indonesia';
      if (title) title.textContent = 'Choose an Indonesian instrument';
      if (lead) {
        lead.textContent =
          'In-force national instruments. Select a card to focus Browse and Ask, or pick another regulation in the header.';
      }
    } else if (currentRegion === 'us') {
      if (kicker) kicker.textContent = 'United States';
      if (title) title.textContent = 'Choose a U.S. analogue';
      if (lead) {
        lead.textContent =
          'In-force U.S. analogues — not federal GDPR, AI Act, or Data Act copies. Select a card to focus Browse and Ask.';
      }
    } else if (currentRegion === 'intl') {
      if (kicker) kicker.textContent = 'International';
      if (title) title.textContent = 'Choose an international standard';
      if (lead) {
        lead.textContent =
          'Voluntary ISO and AICPA instruments — not laws. Analogues of the GDPR, Data Act, and AI Act, plus SOC 2 attestation.';
      }
    } else {
      if (kicker) kicker.textContent = 'Regulation workspace';
      if (title) title.textContent = 'Choose a regulation';
      if (lead) {
        lead.textContent =
          'Thirteen instruments across the European Union, Indonesia, the United States, and international standards. Filter by region in the header, then select a card.';
      }
    }
  }

  function alignRegionWithRegulation(reg) {
    if (currentRegion === 'all' || !reg) return;
    var nextRegion = regulationJurisdiction(reg);
    if (nextRegion === currentRegion) return;
    currentRegion = nextRegion;
    saveRegion(currentRegion);
    populateRegulationSelect();
    syncRegionFilterUi();
  }

  function setCurrentRegion(region, opts) {
    opts = opts || {};
    if (!REGION_IDS[region]) region = 'all';
    if (currentRegion === region && !opts.force) {
      syncRegionFilterUi();
      applyRegionToWelcomeGrid();
      syncBrowseWelcomeHero();
      return;
    }
    var regionChanged = true;
    currentRegion = region;
    saveRegion(currentRegion);
    syncRegionFilterUi();
    populateRegulationSelect();
    applyRegionToWelcomeGrid();
    syncBrowseWelcomeHero();
    if (opts.skipRegulationAdjust) return;
    var allowed = catalogForRegion(currentRegion);
    var stillValid = allowed.some(function (r) {
      return r.id === (currentRegulation && currentRegulation.id);
    });
    if (!stillValid) {
      var next = defaultRegulationForRegion(currentRegion);
      if (next) {
        setCurrentRegulation(next);
        reloadActiveBrowseSegment();
      }
    } else if (regionChanged && viewNews && viewNews.classList.contains('active') && lastNewsItems.length) {
      applyNewsFilters();
    }
  }

  function appendRegulationParam(url) {
    if (!url || url.indexOf('/api/') !== 0) return url;
    if (
      url.indexOf('/api/regulations') === 0 ||
      url.indexOf('/api/news') === 0 ||
      url.indexOf('/api/industry-sectors') === 0 ||
      url.indexOf('/api/validate-api-keys') === 0
    ) {
      return url;
    }
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return url + sep + 'regulation=' + encodeURIComponent(currentRegulation.id);
  }

  function mergeRegulationBody(url, body) {
    var out = body && typeof body === 'object' ? Object.assign({}, body) : {};
    if (
      url === '/api/refresh' ||
      url === '/api/answer'
    ) {
      out.regulation = currentRegulation.id;
    }
    return out;
  }

  function get(url) {
    return fetch(API + appendRegulationParam(url)).then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    });
  }

  function post(url, body) {
    return fetch(API + appendRegulationParam(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergeRegulationBody(url, body))
    }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
  }

  /** Headlines that match EU AI Act selection in the News tab (title, snippet, topic). */
  var AI_ACT_NEWS_SCOPE_RE =
    /ai\s+act|artificial intelligence act|regulation\s*\(eu\)\s*2024\s*\/\s*1689|high[- ]risk\s+ai|general[- ]purpose\s+ai|\bgpai\b|ai\s+office|foundation\s+model|prohibited\s+ai|conformity\s+assessment.*ai|market\s+surveillance.*ai|deployer.*ai\s+system|provider.*ai\s+system|algorithmic|automated\s+decision/i;

  var DATA_ACT_NEWS_SCOPE_RE =
    /data\s+act|regulation\s*\(eu\)\s*2023\s*\/\s*2854|fair\s+access\s+to\s+and\s+use\s+of\s+data|product\s+data|related\s+service\s+data|data\s+holder|data\s+recipient|cloud\s+switching|switching\s+between\s+data\s+processing|interoperability.*data\s+space|connected\s+product|internet\s+of\s+things.*data|edib|european\s+data\s+innovation\s+board/i;

  var ID_PDP_NEWS_SCOPE_RE =
    /\buu\s*pdp\b|uu\s*(nomor|no\.?)\s*27|uu\s*27\s*\/?\s*2022|undang[- ]undang\s*(nomor\s*)?27|pelindungan data pribadi|perlindungan data pribadi|data pribadi|privasi data|pengendali data|indonesia.{0,40}personal data|komdigi.{0,40}(pdp|data pribadi|privasi)|lembaga pelindungan data|notifikasi pelanggaran.{0,20}data/i;

  var ID_SATU_DATA_NEWS_SCOPE_RE =
    /satu data indonesia|\bsatu data\b|perpres\s*(no\.?\s*)?39\s*\/?\s*2019|walidata|pembina data|produsen data|portal satu data|data\.go\.id|interoperabilitas data|standar data nasional|one data indonesia|kode referensi data/i;

  var ID_AI_ETHICS_NEWS_SCOPE_RE =
    /se\s*(menkominfo|kominfo|komdigi)?\s*(no\.?\s*)?9\s*\/?\s*2023|etika kecerdasan artifisial|etika kecerdasan buatan|etika\s+ai|indonesia.{0,40}(ai ethics|artificial intelligence)|perpres.{0,30}(etika\s*)?ai|rperpres.{0,20}ai|kominfo.{0,40}kecerdasan|komdigi.{0,40}(ai|kecerdasan)|kecerdasan artifisial|kbli\s*62015|roadmap.{0,20}ai.{0,20}indonesia/i;

  var US_CCPA_NEWS_SCOPE_RE =
    /\bccpa\b|\bcpra\b|calprivacy|california consumer privacy|california privacy protection agency|\bcppa\b|cal\.\s*civ\.\s*code.{0,12}1798|opt[- ]out of sale|california privacy rights act|data broker|commercial surveillance|(?:california|ccpa|cpra).{0,40}sensitive personal information|sensitive personal information.{0,40}(?:california|ccpa|cpra)|23andme/i;

  var US_OPEN_DATA_NEWS_SCOPE_RE =
    /open government data act|\bopen data act\b|federal data catalogue|federal data catalog|federal data strategy|\bdata\.gov\b|resources\.data\.gov|open government data asset|chief data officer|foundations for evidence-based policymaking|pub(?:lic)?\.\s*l(?:aw)?\.?\s*115-435|44\s*u\.?s\.?c\.?\s*§?\s*3511/i;

  var US_ADMT_NEWS_SCOPE_RE =
    /\badmt\b|\badai\b|automated decision-making technology|anti-discrimination in ai|colorado.{0,40}(ai act|artificial intelligence)|sb\s*26-189|sb26-189|sb\s*24-205|consequential decision|meaningful human review|colorado attorney general.{0,20}ai|c\.?r\.?s\.?\s*6-1-170/i;

  var ISO_27701_NEWS_SCOPE_RE =
    /iso\/?iec\s*27701|\b27701\b|privacy information management system|\bpims\b|pii controller|pii processor|iso\/?iec\s*27001.{0,20}privacy/i;

  var ISO_19941_NEWS_SCOPE_RE =
    /iso\/?iec\s*19941|\b19941\b|cloud computing.{0,24}(interoperability|portability)|cloud (interoperability|portability)|iso\/?iec\s*19941-1|csc.{0,12}csp.{0,12}csn/i;

  var ISO_23894_NEWS_SCOPE_RE =
    /iso\/?iec\s*23894|\b23894\b|ai risk management|artificial intelligence.{0,24}risk management|iso\s*31000.{0,20}ai|iso\/?iec\s*42001|artificial intelligence management system|\baims\b.{0,12}iso/i;

  var SOC2_NEWS_SCOPE_RE =
    /\bsoc\s*2\b|trust services criteria|\btsc\b.{0,12}(aicpa|soc)|soc for service organizations|points of focus.{0,12}2022|type\s*[12]\s+soc/i;

  function newsItemTextBlob(item) {
    return (
      (item.title || '') +
      ' ' +
      (item.snippet || '') +
      ' ' +
      (item.topic || '') +
      ' ' +
      (item.topicCategory || '') +
      ' ' +
      (item.sourceName || '') +
      ' ' +
      (item.url || '')
    );
  }

  function itemMatchesNewsRegulationScope(item) {
    var reg = getRegProfile();
    if (!reg.newsUi || !reg.newsUi.filterForRegulation) return true;
    var text = newsItemTextBlob(item);
    var cat = String(item.topicCategory || '');
    var topic = String(item.topic || '');
    if (reg.id === 'ai-act') {
      if (AI_ACT_NEWS_SCOPE_RE.test(text)) return true;
      if (/EU Artificial Intelligence Act|AI and Emerging Tech/i.test(cat)) return true;
      if (
        /high-risk|prohibited|gpai|general-purpose|ai office|ai act|foundation model|deepfake|facial recognition|biometric|artificial intelligence/i.test(
          topic
        )
      ) {
        return true;
      }
      return false;
    }
    if (reg.id === 'data-act') {
      if (DATA_ACT_NEWS_SCOPE_RE.test(text)) return true;
      if (/^EU Data Act$/i.test(cat)) return true;
      return false;
    }
    if (reg.id === 'id-pdp') {
      if (ID_PDP_NEWS_SCOPE_RE.test(text)) return true;
      if (/Indonesia Personal Data Protection/i.test(cat)) return true;
      return false;
    }
    if (reg.id === 'id-satu-data') {
      if (ID_SATU_DATA_NEWS_SCOPE_RE.test(text)) return true;
      if (/Indonesia Satu Data/i.test(cat)) return true;
      return false;
    }
    if (reg.id === 'id-ai-ethics') {
      if (ID_AI_ETHICS_NEWS_SCOPE_RE.test(text)) return true;
      if (/Indonesia AI Ethics/i.test(cat)) return true;
      return false;
    }
    if (reg.id === 'us-ccpa') {
      if (!newsFeedIsUnitedStates({ name: item.sourceName, url: item.url })) return false;
      if (/cppa\.ca\.gov/i.test(item.url || '') || /^CPPA$/i.test(item.sourceName || '')) return true;
      if (US_CCPA_NEWS_SCOPE_RE.test(text)) return true;
      if (/United States CCPA|California Consumer Privacy/i.test(cat)) return true;
      if (
        /ftc\.gov/i.test(item.url || '') &&
        /privacy|ccpa|cpra|data broker|commercial surveillance|personal information|consumer data|\bcoppa\b|children.?s online privacy/i.test(
          text
        )
      ) {
        return true;
      }
      if (
        /oag\.ca\.gov/i.test(item.url || '') &&
        /privacy|ccpa|cpra|data broker|consumer data|personal information|23andme/i.test(text)
      ) {
        return true;
      }
      return false;
    }
    if (reg.id === 'us-open-data') {
      if (!newsFeedIsUnitedStates({ name: item.sourceName, url: item.url })) return false;
      if (/data\.gov|resources\.data\.gov|strategy\.data\.gov/i.test(item.url || '')) return true;
      if (US_OPEN_DATA_NEWS_SCOPE_RE.test(text)) return true;
      if (/United States OPEN Data|OPEN Government Data|Federal Data Strategy/i.test(cat)) return true;
      if (
        /gsa\.gov/i.test(item.url || '') &&
        /open data|data\.gov|federal data|chief data officer|open government data/i.test(text)
      ) {
        return true;
      }
      return false;
    }
    if (reg.id === 'us-admt') {
      if (!newsFeedIsUnitedStates({ name: item.sourceName, url: item.url })) return false;
      if (US_ADMT_NEWS_SCOPE_RE.test(text)) return true;
      if (/United States ADMT|Colorado ADMT/i.test(cat)) return true;
      if (
        /ftc\.gov/i.test(item.url || '') &&
        /artificial intelligence|\bai\b|automated decision|algorithmic|biometric|facial recognition/i.test(text)
      ) {
        return true;
      }
      return false;
    }
    if (reg.id === 'iso-27701') {
      if (!newsFeedIsInternational({ name: item.sourceName, url: item.url })) return false;
      if (ISO_27701_NEWS_SCOPE_RE.test(text)) return true;
      if (/International ISO 27701|ISO\/IEC 27701|Privacy information management/i.test(cat)) return true;
      if (/iso\.org/i.test(item.url || '') && /27701|pims|privacy information|sc\s*27/i.test(text)) return true;
      return false;
    }
    if (reg.id === 'iso-19941') {
      if (!newsFeedIsInternational({ name: item.sourceName, url: item.url })) return false;
      if (ISO_19941_NEWS_SCOPE_RE.test(text)) return true;
      if (/International ISO 19941|ISO\/IEC 19941|cloud interoperability/i.test(cat)) return true;
      if (/iso\.org/i.test(item.url || '') && /19941|interoperability|portability|cloud computing/i.test(text)) return true;
      return false;
    }
    if (reg.id === 'iso-23894') {
      if (!newsFeedIsInternational({ name: item.sourceName, url: item.url })) return false;
      if (ISO_23894_NEWS_SCOPE_RE.test(text)) return true;
      if (/International ISO 23894|ISO\/IEC 23894|AI risk management/i.test(cat)) return true;
      if (/iso\.org/i.test(item.url || '') && /23894|42001|ai risk|artificial intelligence.{0,20}risk|sc\s*42/i.test(text))
        return true;
      return false;
    }
    if (reg.id === 'soc2') {
      if (!newsFeedIsInternational({ name: item.sourceName, url: item.url })) return false;
      if (SOC2_NEWS_SCOPE_RE.test(text)) return true;
      if (/International SOC 2|Trust Services Criteria|SOC for Service Organizations/i.test(cat)) return true;
      if (/aicpa-cima\.com/i.test(item.url || '') && /soc\s*2|trust services|service organization/i.test(text)) return true;
      return false;
    }
    return true;
  }

  function syncSourcesHeroChrome(reg, sourcesUi) {
    reg = reg || getRegProfile();
    var sources = sourcesUi || (reg && reg.sourcesUi) || {};
    var news = (reg && reg.newsUi) || {};
    var browse = (reg && reg.browseUi) || {};
    var theme = browse.theme || news.theme || (reg && reg.id) || 'gdpr';
    var layout = document.getElementById('sourcesLayout');
    if (layout) layout.setAttribute('data-sources-theme', theme);
    var hero = document.getElementById('sourcesHero');
    if (hero) hero.setAttribute('data-sources-theme', theme);
    var pillLabel = document.getElementById('sourcesRegulationPillLabel');
    if (pillLabel) pillLabel.textContent = (reg && reg.shortName) || 'Regulation';
    var eyebrow = document.getElementById('sourcesEyebrow');
    if (eyebrow) {
      eyebrow.textContent =
        sources.eyebrow ||
        (reg && regulationJurisdiction(reg) === 'id'
          ? 'Indonesian official references'
          : regulationJurisdiction(reg) === 'us'
            ? 'United States official references'
            : regulationJurisdiction(reg) === 'intl'
              ? 'Official ISO and AICPA references'
              : 'Official & specialist references');
    }
    var sourcesTitle = document.getElementById('sourcesHeaderTitle');
    if (sourcesTitle) sourcesTitle.textContent = sources.title || ((reg && reg.shortName) || 'Regulation') + ': credible sources';
    var sourcesIntro = document.getElementById('sourcesIntro');
    if (sourcesIntro) sourcesIntro.textContent = sources.intro || '';
  }

  function syncNewsHeroChrome(reg, newsUi) {
    reg = reg || getRegProfile();
    var news = newsUi || reg.newsUi || {};
    var hero = document.getElementById('newsHero');
    if (hero) {
      hero.setAttribute('data-news-theme', news.theme || reg.id || 'gdpr');
    }
    var pillLabel = document.getElementById('newsRegulationPillLabel');
    if (pillLabel) pillLabel.textContent = reg.shortName || reg.legalLabel || 'Regulation';
    var eyebrow = document.getElementById('newsEyebrow');
    if (eyebrow) eyebrow.textContent = news.eyebrow || 'EU regulatory news';
    var title = document.getElementById('newsHeroTitle');
    if (title) title.textContent = news.title || 'News';
    var intro = document.getElementById('newsIntro');
    if (intro) intro.textContent = news.intro || '';
    var refreshLabel = document.getElementById('newsRefreshLabel');
    if (refreshLabel) refreshLabel.textContent = news.refreshLabel || 'Refresh feeds';
    var refreshHint = document.getElementById('newsRefreshHint');
    if (refreshHint) refreshHint.textContent = news.refreshHint || 'Fetches the latest headlines from configured sources.';
    if (btnRefreshNews) {
      btnRefreshNews.title = news.refreshHint || news.refreshLabel || 'Refresh news feeds';
    }
    var tagsEl = document.getElementById('newsHeroTags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      var tags = Array.isArray(news.tags) ? news.tags : [];
      tags.forEach(function (tag) {
        var li = document.createElement('li');
        li.className = 'news-hero-tag';
        li.textContent = tag;
        tagsEl.appendChild(li);
      });
      tagsEl.classList.toggle('is-empty', tags.length === 0);
    }
    var scopeCard = document.getElementById('newsScopeCard');
    var scopeMode = news.scopeMode || (news.filterForRegulation ? 'filtered' : 'full');
    var showScope = scopeMode === 'filtered' || scopeMode === 'full';
    if (scopeCard) {
      if (!showScope) {
        scopeCard.classList.add('hidden');
      } else {
        scopeCard.classList.remove('hidden');
        scopeCard.classList.toggle('news-scope-card--filtered', scopeMode === 'filtered');
        scopeCard.classList.toggle('news-scope-card--full', scopeMode === 'full');
        var scopeEyebrow = document.getElementById('newsScopeCardEyebrow');
        if (scopeEyebrow) scopeEyebrow.textContent = news.scopeEyebrow || (scopeMode === 'filtered' ? 'Relevance filter' : 'Coverage');
        var scopeTitle = document.getElementById('newsScopeCardTitle');
        if (scopeTitle) scopeTitle.textContent = news.scopeTitle || '';
        var scopeText = document.getElementById('newsScopeCardText');
        if (scopeText) scopeText.textContent = news.scopeText || '';
      }
    }
    var switchBtn = document.getElementById('newsScopeSwitchBtn');
    var switchLabel = document.getElementById('newsScopeSwitchLabel');
    if (switchBtn && switchLabel) {
      if (news.switchToRegulationId && news.switchToLabel) {
        switchBtn.hidden = false;
        switchBtn.dataset.regulationId = news.switchToRegulationId;
        switchLabel.textContent = news.switchToLabel;
      } else {
        switchBtn.hidden = true;
        switchBtn.removeAttribute('data-regulation-id');
      }
    }
    var viewLabel = document.getElementById('newsHeroStatViewLabel');
    if (viewLabel) viewLabel.textContent = news.viewModeLabel || (scopeMode === 'filtered' ? 'Filtered' : 'Full index');
  }

  function updateNewsHeroStats(visibleCount, loadedCount) {
    var meta = document.getElementById('newsHeroMeta');
    if (!meta) return;
    var loaded = typeof loadedCount === 'number' ? loadedCount : 0;
    var visible = typeof visibleCount === 'number' ? visibleCount : loaded;
    if (loaded <= 0) {
      meta.hidden = true;
      return;
    }
    meta.hidden = false;
    var countEl = document.getElementById('newsHeroStatCount');
    if (countEl) {
      countEl.textContent =
        visible !== loaded ? visible + ' / ' + loaded : String(visible);
    }
    var sourcesEl = document.getElementById('newsHeroStatSources');
    if (sourcesEl) {
      var srcs = getOrderedSourcesFromItems(lastNewsItems || []);
      sourcesEl.textContent = String(srcs.length || '—');
    }
  }

  function syncAskSourcesNewsChrome(reg) {
    reg = reg || getRegProfile();
    var ask = reg.askUi || {};
    var sources = reg.sourcesUi || {};
    var news = reg.newsUi || {};

    var askHeading = document.getElementById('askHeading');
    if (askHeading) askHeading.textContent = ask.heading || 'Ask about the ' + reg.shortName;
    var askLead = document.getElementById('askLead');
    if (askLead) askLead.innerHTML = ask.leadHtml || '';
    var askSignal = document.getElementById('askSignalCorpus');
    if (askSignal) askSignal.textContent = ask.signalCorpus || 'Local regulation corpus';
    var askMeta = document.getElementById('askMeta');
    if (askMeta) askMeta.innerHTML = ask.metaHtml || '';
    var askDesc = document.getElementById('askIndustrySectorDesc');
    if (askDesc) askDesc.innerHTML = ask.sectorExplainer || '';
    var askRelTitle = document.getElementById('askRelevantDocsTitle');
    if (askRelTitle) askRelTitle.textContent = ask.relevantTitle || 'Relevant provisions';
    var askRelHint = document.getElementById('askRelevantDocsHint');
    if (askRelHint) askRelHint.innerHTML = ask.relevantHint || '';
    var askPanel = document.getElementById('askSummaryPanel');
    if (askPanel) askPanel.setAttribute('aria-label', ask.relevantTitle || 'Relevant provisions');
    var askRelWrap = document.getElementById('askRelevantDocs');
    if (askRelWrap) askRelWrap.setAttribute('aria-label', ask.relevantTitle || 'Relevant provisions');
    if (queryInput) {
      queryInput.placeholder = ask.placeholder || 'Ask a question…';
      queryInput.setAttribute('aria-label', ask.queryAriaLabel || 'Ask a question');
    }
    var ql = document.querySelector('label[for="query"]');
    if (ql) ql.textContent = 'Your ' + reg.shortName + ' question';

    syncSourcesHeroChrome(reg, sources);
    syncNewsHeroChrome(reg, news);

    var genOpt = document.querySelector('#askIndustrySector option[value="GENERAL"]');
    if (genOpt && ask.sectorFrameworkGeneral) {
      genOpt.textContent = 'General — ' + ask.sectorFrameworkGeneral.replace(/^Default:\s*/i, '');
    }
  }

  var BROWSE_WELCOME_GRID_ORDER = [
    'gdpr',
    'data-act',
    'ai-act',
    'id-pdp',
    'id-satu-data',
    'id-ai-ethics',
    'us-ccpa',
    'us-open-data',
    'us-admt',
    'iso-27701',
    'iso-19941',
    'iso-23894',
    'soc2'
  ];
  var BROWSE_WELCOME_REGIONS = [
    { id: 'eu', label: 'European Union', hint: 'Binding EU regulations', ids: ['gdpr', 'data-act', 'ai-act'] },
    { id: 'id', label: 'Indonesia', hint: 'In-force national instruments', ids: ['id-pdp', 'id-satu-data', 'id-ai-ethics'] },
    {
      id: 'us',
      label: 'United States',
      hint: 'In-force analogues — not federal GDPR, AI Act, or Data Act copies',
      ids: ['us-ccpa', 'us-open-data', 'us-admt']
    },
    {
      id: 'intl',
      label: 'International',
      hint: 'Voluntary ISO and AICPA instruments — not laws',
      ids: ['iso-27701', 'iso-19941', 'iso-23894', 'soc2']
    }
  ];
  var BROWSE_WELCOME_LAYOUT = 'regions-v2';

  function sortRegulationsCatalog(catalog) {
    if (!catalog || !catalog.length) return catalog || [];
    return catalog.slice().sort(function (a, b) {
      var ia = BROWSE_WELCOME_GRID_ORDER.indexOf(a.id);
      var ib = BROWSE_WELCOME_GRID_ORDER.indexOf(b.id);
      if (ia < 0) ia = 999;
      if (ib < 0) ib = 999;
      return ia - ib;
    });
  }

  function getRegulationProfileById(regId) {
    if (typeof getRegulationProfile === 'function') return getRegulationProfile(regId);
    if (typeof REGULATION_PROFILES !== 'undefined') {
      return REGULATION_PROFILES[regId] || REGULATION_PROFILES.gdpr;
    }
    return null;
  }

  function findRegulationInCatalog(regId) {
    if (!regulationsCatalog || !regulationsCatalog.length) return null;
    return (
      regulationsCatalog.find(function (r) {
        return r.id === regId;
      }) || null
    );
  }

  function activateBrowseForRegulation(regId, segment) {
    var match = findRegulationInCatalog(regId);
    /* Batch regulation switch + segment open so syncAppRouteToUrl never writes an
       intermediate #/browse that a late hashchange can restore as "home". */
    suppressAppRouteSync = true;
    try {
      if (match) setCurrentRegulation(match);
      if (segment === 'recitals' || segment === 'chapters') {
        activateBrowseRegulationSegment(segment);
      }
    } finally {
      suppressAppRouteSync = false;
      syncAppRouteToUrl(true);
    }
  }

  function renderBrowseWelcomeTagsHtml(highlights) {
    if (!highlights || !highlights.length) return '';
    return highlights
      .map(function (t) {
        return '<li><span class="browse-welcome-tag">' + escapeHtml(t) + '</span></li>';
      })
      .join('');
  }

  function welcomeCtaLabels(profile) {
    var id = profile && profile.id ? profile.id : '';
    if (id === 'id-pdp' || id === 'id-satu-data') {
      return { articles: 'Pasal', recitals: 'Considering' };
    }
    if (id === 'id-ai-ethics') {
      return { articles: 'Sections', recitals: 'Ethical values' };
    }
    if (id === 'us-ccpa' || id === 'us-admt' || id === 'us-open-data') {
      return { articles: 'Sections', recitals: 'Purpose notes' };
    }
    if (id.indexOf('iso-') === 0) {
      return { articles: 'Clauses', recitals: 'Purpose notes' };
    }
    if (id === 'soc2') {
      return { articles: 'Criteria', recitals: 'Purpose notes' };
    }
    return { articles: 'Articles', recitals: 'Recitals' };
  }

  function welcomeJurisdiction(profile) {
    var id = profile && profile.id ? String(profile.id) : '';
    if (profile && profile.jurisdiction === 'id') return { id: 'id', label: 'ID' };
    if (profile && profile.jurisdiction === 'us') return { id: 'us', label: 'US' };
    if (profile && profile.jurisdiction === 'intl') return { id: 'intl', label: 'INTL' };
    if (profile && profile.jurisdiction === 'eu') return { id: 'eu', label: 'EU' };
    if (id.indexOf('id-') === 0) return { id: 'id', label: 'ID' };
    if (id.indexOf('us-') === 0) return { id: 'us', label: 'US' };
    if (id.indexOf('iso-') === 0 || id === 'soc2') return { id: 'intl', label: 'INTL' };
    return { id: 'eu', label: 'EU' };
  }

  function buildBrowseWelcomeCardHtml(profile, compact) {
    var browse = profile.browseUi || {};
    var sn = profile.shortName || profile.id;
    var sm = profile.segmentMeta || {};
    var theme = browse.theme || profile.id || 'gdpr';
    var cta = welcomeCtaLabels(profile);
    var juris = welcomeJurisdiction(profile);
    var site = officialSiteName(profile);
    var highlights = browse.highlights || [];
    if (compact && highlights.length > 3) highlights = highlights.slice(0, 3);
    var tags = renderBrowseWelcomeTagsHtml(highlights);
    var tagsBlock = tags
      ? '<ul class="browse-welcome-tags" aria-label="Key themes for ' +
        escapeHtml(sn) +
        '">' +
        tags +
        '</ul>'
      : '';

    var navLead = compact
      ? ''
      : '<p class="browse-welcome-nav-lead">Open chapters or recitals below, or switch instruments from the header.</p>';

    return (
      '<article class="placeholder-content browse-welcome browse-welcome-card' +
      (compact ? ' browse-welcome-card--compact' : '') +
      '" data-regulation-id="' +
      escapeHtml(profile.id) +
      '" data-browse-theme="' +
      escapeHtml(theme) +
      '" data-jurisdiction="' +
      escapeHtml(juris.id) +
      '" role="listitem" tabindex="0" aria-labelledby="browseWelcomeTitle-' +
      escapeHtml(profile.id) +
      '">' +
      '<div class="browse-welcome-shell">' +
      '<div class="browse-welcome-accent" aria-hidden="true"></div>' +
      '<span class="browse-welcome-active-badge" hidden>Selected</span>' +
      '<header class="browse-welcome-head">' +
      '<div class="browse-welcome-mark" aria-hidden="true">' +
      escapeHtml(browse.mark || profile.legalLabel || sn) +
      '</div>' +
      '<p class="browse-welcome-eyebrow">' +
      '<span class="browse-welcome-jurisdiction">' +
      escapeHtml(juris.label) +
      '</span>' +
      '<span class="browse-welcome-eyebrow-text">' +
      escapeHtml(browse.eyebrow || 'Regulation') +
      '</span></p>' +
      '<h2 class="browse-welcome-title" id="browseWelcomeTitle-' +
      escapeHtml(profile.id) +
      '">' +
      escapeHtml(browse.title || sn) +
      '</h2>' +
      '<p class="browse-welcome-subtitle">' +
      escapeHtml(browse.subtitle || profile.fullName || '') +
      '</p>' +
      '</header>' +
      '<p class="browse-welcome-desc">' +
      escapeHtml(
        browse.description ||
          'Browse recitals and articles with official links, or use Ask for cited answers grounded in this regulation.'
      ) +
      '</p>' +
      tagsBlock +
      navLead +
      '<div class="browse-quick-actions browse-welcome-card__actions" role="group" aria-label="Open ' +
      escapeHtml(sn) +
      ' sections">' +
      '<button type="button" class="btn btn-primary browse-quick-btn" data-browse-quick="chapters" data-regulation-id="' +
      escapeHtml(profile.id) +
      '" aria-label="Open ' +
      escapeHtml(sn) +
      ' chapters and articles">' +
      '<span class="browse-quick-btn-label">' +
      escapeHtml(cta.articles) +
      '</span>' +
      '<span class="browse-quick-btn-meta">' +
      escapeHtml(sm.articles || '') +
      '</span></button>' +
      '<button type="button" class="btn btn-secondary browse-quick-btn" data-browse-quick="recitals" data-regulation-id="' +
      escapeHtml(profile.id) +
      '" aria-label="Open ' +
      escapeHtml(sn) +
      ' recitals">' +
      '<span class="browse-quick-btn-label">' +
      escapeHtml(cta.recitals) +
      '</span>' +
      '<span class="browse-quick-btn-meta">' +
      escapeHtml(sm.recitals || '') +
      '</span></button>' +
      '</div>' +
      '<p class="browse-welcome-official">' +
      '<a class="browse-welcome-official-link" href="' +
      escapeHtml(profile.eurLexUrl || '#') +
      '" target="_blank" rel="noopener noreferrer" title="Open official text on ' +
      escapeHtml(site) +
      ' (new tab)">' +
      '<span class="browse-welcome-official-label">Official text · ' +
      escapeHtml(site) +
      '</span>' +
      '<span class="browse-welcome-official-cue" aria-hidden="true">↗</span></a></p>' +
      '</div></article>'
    );
  }

  function initBrowseWelcomeGrid() {
    var grid = document.getElementById('browseWelcomeGrid');
    if (!grid || grid.getAttribute('data-layout') === BROWSE_WELCOME_LAYOUT) return;
    var html = '';
    BROWSE_WELCOME_REGIONS.forEach(function (region) {
      html +=
        '<section class="browse-welcome-region" data-region="' +
        escapeHtml(region.id) +
        '" aria-labelledby="browseRegion-' +
        escapeHtml(region.id) +
        '">' +
        '<header class="browse-welcome-region-head">' +
        '<h3 class="browse-welcome-region-title" id="browseRegion-' +
        escapeHtml(region.id) +
        '">' +
        escapeHtml(region.label) +
        '</h3>' +
        '<p class="browse-welcome-region-hint">' +
        escapeHtml(region.hint) +
        '</p>' +
        '</header>' +
        '<div class="browse-welcome-region-grid" role="list">';
      region.ids.forEach(function (regId) {
        var profile = getRegulationProfileById(regId);
        if (profile) html += buildBrowseWelcomeCardHtml(profile, true);
      });
      html += '</div></section>';
    });
    grid.innerHTML = html;
    grid.setAttribute('data-layout', BROWSE_WELCOME_LAYOUT);
    grid.dataset.built = String(BROWSE_WELCOME_REGIONS.length);
  }

  function syncBrowseWelcomeGridActive(activeRegId) {
    var grid = document.getElementById('browseWelcomeGrid');
    if (!grid) return;
    grid.querySelectorAll('.browse-welcome-card').forEach(function (card) {
      var isActive = card.getAttribute('data-regulation-id') === activeRegId;
      card.classList.toggle('browse-welcome-card--active', isActive);
      if (isActive) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      var badge = card.querySelector('.browse-welcome-active-badge');
      if (badge) badge.hidden = !isActive;
    });
  }

  function syncBrowseWelcomeSolo(reg) {
    if (!reg) reg = getRegProfile();
    var browse = reg.browseUi || {};
    var sn = reg.shortName;
    var card = document.getElementById('browseWelcome');
    if (!card) return;

    card.setAttribute('data-browse-theme', browse.theme || reg.id || 'gdpr');

    var mark = document.getElementById('browseWelcomeMark');
    if (mark) mark.textContent = browse.mark || reg.legalLabel || sn;

    var eyebrow = document.getElementById('browseWelcomeEyebrow');
    if (eyebrow) eyebrow.textContent = browse.eyebrow || 'EU regulation';

    var title = document.getElementById('browseWelcomeTitle');
    if (title) title.textContent = browse.title || sn;

    var subtitle = document.getElementById('browseWelcomeSubtitle');
    if (subtitle) subtitle.textContent = browse.subtitle || reg.fullName || '';

    var desc = document.getElementById('browseWelcomeDesc');
    if (desc) {
      desc.textContent =
        browse.description ||
        'Browse recitals and articles with official links, or use Ask for cited answers grounded in this regulation.';
    }

    var tagsEl = document.getElementById('browseWelcomeTags');
    if (tagsEl) {
      var highlights = browse.highlights || [];
      if (!highlights.length) {
        tagsEl.innerHTML = '';
        tagsEl.hidden = true;
      } else {
        tagsEl.hidden = false;
        tagsEl.setAttribute('aria-label', 'Key themes for ' + sn);
        tagsEl.innerHTML = renderBrowseWelcomeTagsHtml(highlights);
      }
    }

    var navLead = document.getElementById('browseWelcomeNavLead');
    if (navLead) {
      navLead.innerHTML =
        'Open <strong>Browse ' +
        escapeHtml(sn) +
        '</strong> in the tab bar and click it again for the full menu—or jump straight in below.';
    }

    var officialLink = document.getElementById('browseWelcomeOfficialLink');
    var officialLabel = document.getElementById('browseWelcomeOfficialLabel');
    if (officialLink) {
      officialLink.href = reg.eurLexUrl || '#';
      officialLink.title = 'Open official text on ' + officialSiteName(reg) + ' (new tab)';
    }
    if (officialLabel) {
      officialLabel.textContent = reg.eurLexLabel || 'View official text';
    }
  }

  function syncBrowseWelcomeChrome(reg) {
    if (!reg) reg = getRegProfile();
    initBrowseWelcomeGrid();
    applyRegionToWelcomeGrid();
    syncBrowseWelcomeHero();
    syncBrowseWelcomeSolo(reg);
    syncBrowseWelcomeGridActive(reg.id || 'gdpr');
  }

  function syncRegulationChrome() {
    var reg = getRegProfile();
    var sn = reg.shortName;
    var sm = reg.segmentMeta || {};
    var ctas = welcomeCtaLabels(reg);
    var articlesNoun = String(ctas.articles || 'Articles').toLowerCase();
    var recitalsNoun = String(ctas.recitals || 'Recitals').toLowerCase();

    var tagline = document.getElementById('appTagline') || document.querySelector('.tagline');
    if (tagline) tagline.textContent = reg.fullName;

    var logo = document.getElementById('logoLink');
    if (logo) logo.title = sn + ' — Regulation Q&A';

    var tabBrowse = document.getElementById('tabBrowseMain');
    if (tabBrowse) {
      tabBrowse.innerHTML =
        '<span class="tab-label tab-label--long">Browse ' +
        escapeHtml(sn) +
        '</span><span class="tab-label tab-label--short">' +
        escapeHtml(sn) +
        '</span> <span class="tab-browse-cue" aria-hidden="true">▾</span>';
      tabBrowse.title = 'Choose section: ' + sn + ' ' + recitalsNoun + ' or chapters & ' + articlesNoun;
    }

    var menu = document.getElementById('browseRegMenu');
    if (menu) {
      menu.setAttribute('aria-label', 'Browse ' + sn + ' sections');
      var chaptersItem = menu.querySelector('[data-browse-segment="chapters"]');
      var recitalsItem = menu.querySelector('[data-browse-segment="recitals"]');
      if (chaptersItem) {
        chaptersItem.querySelector('.tab-browse-menu-label').textContent = sn + ' chapters & ' + articlesNoun;
        var mCh = chaptersItem.querySelector('.tab-browse-menu-meta');
        if (mCh) mCh.textContent = sm.articles;
      }
      if (recitalsItem) {
        recitalsItem.querySelector('.tab-browse-menu-label').textContent = sn + ' ' + recitalsNoun;
        var mRec = recitalsItem.querySelector('.tab-browse-menu-meta');
        if (mRec) mRec.textContent = sm.recitals;
      }
    }

    var qr = document.getElementById('browseQuickRecitals');
    var qc = document.getElementById('browseQuickChapters');
    var qa = document.querySelector('.browse-quick-actions');
    if (qa) qa.setAttribute('aria-label', 'Open ' + sn + ' regulation sections');
    if (qr) {
      qr.querySelector('.browse-quick-btn-label').textContent = sn + ' ' + recitalsNoun;
      qr.querySelector('.browse-quick-btn-meta').textContent = sm.recitals;
    }
    if (qc) {
      qc.querySelector('.browse-quick-btn-label').textContent = sn + ' chapters & ' + articlesNoun;
      qc.querySelector('.browse-quick-btn-meta').textContent = sm.articles;
    }

    syncBrowseWelcomeChrome(reg);

    var rh = document.querySelector('#browseRecitals .recitals-header h2');
    if (rh) rh.textContent = sn + ' ' + recitalsNoun;
    var rl = document.getElementById('recitalsLead');
    if (rl) {
      rl.textContent =
        sn +
        ' ' +
        recitalsNoun +
        ' (' +
        sm.recitals +
        ') explain the context and objectives of the regulation. Search by number or keyword, then open a card for the full text.';
    }
    renderRegulationSourceLinks(document.getElementById('recitalsSourceLinks'), reg);

    var ch = document.querySelector('#browseChapters .chapters-browser-header h2');
    if (ch) ch.textContent = sn + ' chapters & ' + articlesNoun;
    var cl = document.getElementById('chaptersLead');
    if (cl) {
      cl.textContent =
        'All ' +
        sm.articles +
        ' ' +
        sn +
        ' ' +
        articlesNoun +
        ' are grouped by chapter. Filter by category, chapter, or section number—then open any card for the full legal text.';
    }
    renderRegulationSourceLinks(document.getElementById('chaptersSourceLinks'), reg);

    if (recitalsSearch) {
      recitalsSearch.placeholder =
        'Search ' + sn + ' ' + recitalsNoun + ' by number (e.g. 12) or keywords…';
      var rsLabel = document.querySelector('label[for="recitalsSearch"]');
      if (rsLabel) rsLabel.textContent = 'Search ' + sn + ' ' + recitalsNoun + ' by number or text';
    }

    if (detailContent) {
      detailContent.setAttribute('aria-label', sn + ' regulation text');
    }

    if (btnRefresh) {
      btnRefresh.title = 'Fetch the latest ' + sn + ' text from official sources (' + reg.infoSiteName + ' / ' + officialSiteName(reg) + ')';
    }
    if (btnFreshnessInfo) {
      btnFreshnessInfo.setAttribute(
        'aria-label',
        reg.shortName + ' consolidated text: show content and check timestamps'
      );
    }

    var catWrap = document.getElementById('chaptersFilterCategoryWrap');
    if (catWrap) {
      catWrap.classList.toggle('hidden', !reg.hasArticleTopics);
    }
    var subWrap = document.getElementById('chaptersFilterSubcategoryWrap');
    if (subWrap) {
      subWrap.classList.toggle('hidden', !reg.hasArticleTopics);
    }
    if (!reg.hasArticleTopics) {
      if (chaptersFilterCategory) chaptersFilterCategory.value = '';
      if (chaptersFilterSubcategory) chaptersFilterSubcategory.value = '';
      chaptersFilterComboboxesSyncInputsFromSelects();
    }
    var cfBar = document.querySelector('.chapters-filters');
    if (cfBar) {
      cfBar.setAttribute('aria-label', 'Filter ' + sn + ' documents by category, chapter, and ' + articlesNoun.replace(/s$/, ''));
    }
    var artFilterLabel = document.querySelector('label[for="chaptersFilterArticleInput"]');
    if (artFilterLabel) {
      artFilterLabel.textContent = String(ctas.articles || 'Articles').replace(/s$/, '') || 'Article';
    }
    var grouped = document.getElementById('chaptersArticlesGrouped');
    if (grouped) {
      grouped.setAttribute('aria-label', sn + ' ' + articlesNoun + ' by chapter');
    }
    var jumpLabel = document.querySelector('label[for="docNavNumber"]');
    if (jumpLabel) {
      jumpLabel.textContent = 'Jump to ' + articlesNoun.replace(/s$/, '') + ' or ' + recitalsNoun.replace(/s$/, '');
    }
    if (docNavNumber) {
      docNavNumber.setAttribute(
        'aria-label',
        'Jump to ' + articlesNoun.replace(/s$/, '') + ' or ' + recitalsNoun.replace(/s$/, '') + ' number'
      );
    }

    var sel = document.getElementById('regulationSelect');
    if (sel && sel.value !== reg.id) sel.value = reg.id;

    syncRegulationJurisdictionChip(reg);
    document.title = sn + ' — Regulation Q&A Platform';
    syncAskSourcesNewsChrome(reg);
    syncCitationSidebarChrome(reg);
    syncChaptersFilterPlaceholders();
  }

  function setCurrentRegulation(reg) {
    if (!reg || !reg.id) return;
    var prevId = currentRegulation.id;
    var switched = prevId !== reg.id;
    currentRegulation = {
      id: reg.id,
      shortName: reg.shortName || reg.id,
      fullName: reg.fullName || reg.shortName || reg.id,
      maxArticles: reg.maxArticles || 99,
      maxRecitals: reg.maxRecitals || 173,
      segmentMeta: reg.segmentMeta || { recitals: '', articles: '' },
      infoBaseUrl: reg.infoBaseUrl,
      eurLexUrl: reg.eurLexUrl,
      hasArticleTopics: reg.hasArticleTopics,
      hasSuitableRecitals: reg.hasSuitableRecitals,
      jurisdiction: reg.jurisdiction || regulationJurisdiction(reg),
      jurisdictionLabel: reg.jurisdictionLabel || ''
    };
    saveRegulationId(reg.id);
    alignRegionWithRegulation(reg);
    if (switched) {
      clearRegulationBrowseCaches();
      resetChaptersFilters();
      if (newsFilterTopic) newsFilterTopic.value = '';
      if (newsFilterSource) newsFilterSource.value = '';
      var sourcesSearch = document.getElementById('sourcesSearch');
      if (sourcesSearch) sourcesSearch.value = '';
      sourcesSearchQuery = '';
      /* Drop stale reader HTML before chrome/API catch up to the new instrument. */
      exitReaderForRegulationChange();
    }
    syncRegulationChrome();
    loadMeta();
    if (viewSources && viewSources.classList.contains('active')) loadSources();
    if (viewNews && viewNews.classList.contains('active') && lastNewsItems.length) applyNewsFilters();
    if (switched && viewBrowse && viewBrowse.classList.contains('active')) {
      reloadActiveBrowseSegment();
    }
    if (
      appRouteReady &&
      viewBrowse &&
      viewBrowse.classList.contains('active') &&
      !suppressAppRouteSync &&
      !appRouteRestorePending
    ) {
      syncAppRouteToUrl(switched);
    }
  }

  function reloadActiveBrowseSegment() {
    if (!viewBrowse || !viewBrowse.classList.contains('active')) return;
    if (browseDetail && !browseDetail.classList.contains('hidden')) {
      /* Still on a reader — leave it so we never show the previous regulation's text. */
      exitReaderForRegulationChange();
    }
    if (browseChapters && !browseChapters.classList.contains('hidden')) loadChapters();
    else if (browseRecitals && !browseRecitals.classList.contains('hidden')) loadRecitals();
  }

  function initRegulationSelector() {
    currentRegion = loadStoredRegion();
    return get('/api/regulations')
      .then(function (payload) {
        regulationsCatalog = sortRegulationsCatalog(payload.regulations || []);
        var stored = loadStoredRegulationId();
        var allowed = catalogForRegion(currentRegion);
        var match =
          allowed.find(function (r) {
            return r.id === stored;
          }) ||
          defaultRegulationForRegion(currentRegion) ||
          regulationsCatalog[0];
        populateRegulationSelect();
        syncRegionFilterUi();
        if (match) setCurrentRegulation(match);
        var sel = document.getElementById('regulationSelect');
        if (sel && !sel.dataset.boundChange) {
          sel.dataset.boundChange = '1';
          sel.addEventListener('change', function () {
            var next = regulationsCatalog.find(function (r) {
              return r.id === sel.value;
            });
            if (next) {
              setCurrentRegulation(next);
              reloadActiveBrowseSegment();
            }
          });
        }
        initRegionFilterControls();
      })
      .catch(function () {
        initRegionFilterControls();
        populateRegulationSelect();
        syncRegionFilterUi();
        applyRegionToWelcomeGrid();
        syncBrowseWelcomeHero();
        syncRegulationChrome();
      });
  }

  function initRegionFilterControls() {
    var root = document.getElementById('regionFilter');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.region-filter-btn[data-region]'));
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.region-filter-btn[data-region]');
      if (!btn || !root.contains(btn)) return;
      setCurrentRegion(btn.getAttribute('data-region'));
    });
    if (!window.__regionFilterThumbResizeBound) {
      window.__regionFilterThumbResizeBound = true;
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          positionRegionFilterThumb();
          positionTabsTrackThumb();
        }, 80);
      });
    }
    root.addEventListener('keydown', function (e) {
      var btn = e.target.closest('.region-filter-btn[data-region]');
      if (!btn || !root.contains(btn)) return;
      var index = buttons.indexOf(btn);
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = buttons[index + 1] || buttons[0];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = buttons[index - 1] || buttons[buttons.length - 1];
      else if (e.key === 'Home') next = buttons[0];
      else if (e.key === 'End') next = buttons[buttons.length - 1];
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setCurrentRegion(btn.getAttribute('data-region'));
        return;
      }
      if (next) {
        e.preventDefault();
        next.focus();
        setCurrentRegion(next.getAttribute('data-region'));
      }
    });
  }

  var BYOK_STORAGE_KEY = 'gdpr-qa-byok-v1';
  var serverLlmMeta = { askGroqServerConfigured: false, askTavilyServerConfigured: false, byokSupported: true };
  var lastAppMeta = null;

  function loadByokSettings() {
    try {
      var raw = localStorage.getItem(BYOK_STORAGE_KEY);
      if (!raw) return { useOwnKeys: false, groqApiKey: '', tavilyApiKey: '' };
      var parsed = JSON.parse(raw);
      return {
        useOwnKeys: Boolean(parsed && parsed.useOwnKeys),
        groqApiKey: parsed && parsed.groqApiKey ? String(parsed.groqApiKey).trim() : '',
        tavilyApiKey: parsed && parsed.tavilyApiKey ? String(parsed.tavilyApiKey).trim() : ''
      };
    } catch (e) {
      return { useOwnKeys: false, groqApiKey: '', tavilyApiKey: '' };
    }
  }

  function saveByokSettings(settings) {
    var payload = {
      useOwnKeys: Boolean(settings && settings.useOwnKeys),
      groqApiKey: settings && settings.groqApiKey ? String(settings.groqApiKey).trim() : '',
      tavilyApiKey: settings && settings.tavilyApiKey ? String(settings.tavilyApiKey).trim() : ''
    };
    localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function clearByokSettings() {
    localStorage.removeItem(BYOK_STORAGE_KEY);
  }

  /** Merge BYOK keys into Ask (and similar) POST bodies when enabled. */
  function withByokApiKeys(body) {
    var out = body && typeof body === 'object' ? Object.assign({}, body) : {};
    var cfg = loadByokSettings();
    if (!cfg.useOwnKeys) return out;
    var apiKeys = {};
    if (cfg.groqApiKey) apiKeys.groqApiKey = cfg.groqApiKey;
    if (cfg.tavilyApiKey) apiKeys.tavilyApiKey = cfg.tavilyApiKey;
    if (Object.keys(apiKeys).length) out.apiKeys = apiKeys;
    return out;
  }

  function hasEffectiveAskLlmKeys() {
    var cfg = loadByokSettings();
    if (cfg.useOwnKeys && (cfg.groqApiKey || cfg.tavilyApiKey)) return true;
    return Boolean(serverLlmMeta.askGroqServerConfigured || serverLlmMeta.askTavilyServerConfigured);
  }

  function formatLocaleDateTime(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function getFreshnessStatusLines(meta) {
    meta = meta || lastAppMeta;
    if (!meta) {
      return { primary: 'Loading source timestamps…', tone: 'neutral' };
    }
    var refreshed = formatLocaleDateTime(meta.lastRefreshed);
    var checked = formatLocaleDateTime(meta.lastChecked);
    if (refreshed && checked) {
      return {
        primary: 'Content as of ' + refreshed,
        secondary: 'Last checked ' + checked,
        tone: 'ok'
      };
    }
    if (refreshed) {
      return { primary: 'Content as of ' + refreshed, tone: 'ok' };
    }
    if (checked) {
      return {
        primary: 'Last checked ' + checked,
        secondary: 'Run Refresh sources to load consolidated text',
        tone: 'warn'
      };
    }
    return {
      primary: 'Not loaded from official sources yet',
      secondary: 'Use Refresh sources in Tools',
      tone: 'warn'
    };
  }

  function getApiKeysStatusLines() {
    var cfg = loadByokSettings();
    if (cfg.useOwnKeys) {
      var hasGroq = Boolean(cfg.groqApiKey);
      var hasTavily = Boolean(cfg.tavilyApiKey);
      if (hasGroq && hasTavily) {
        return {
          primary: 'Your keys active',
          secondary: 'Groq & Tavily (browser storage)',
          tone: 'ok'
        };
      }
      if (hasGroq || hasTavily) {
        return {
          primary: 'Partial BYOK setup',
          secondary: (hasGroq ? 'Groq set' : 'Groq missing') + ' · ' + (hasTavily ? 'Tavily set' : 'Tavily missing'),
          tone: 'warn'
        };
      }
      return {
        primary: 'BYOK enabled',
        secondary: 'No keys saved — tap to add',
        tone: 'warn'
      };
    }
    var groq = Boolean(serverLlmMeta.askGroqServerConfigured);
    var tavily = Boolean(serverLlmMeta.askTavilyServerConfigured);
    if (groq && tavily) {
      return {
        primary: 'Server keys ready',
        secondary: 'Groq & Tavily for Ask',
        tone: 'ok'
      };
    }
    if (groq) {
      return {
        primary: 'Groq ready (server)',
        secondary: 'Tavily not configured on server',
        tone: 'warn'
      };
    }
    if (tavily) {
      return {
        primary: 'Tavily ready (server)',
        secondary: 'Groq not configured on server',
        tone: 'warn'
      };
    }
    return {
      primary: 'No Ask keys configured',
      secondary: 'Tap to add your keys or contact admin',
      tone: 'warn'
    };
  }

  /** Header Tools rows only — full freshness detail stays in tooltip; Ask tab keeps askLlmKeysStatus. */
  function syncHeaderToolbarStatus(meta) {
    if (meta) lastAppMeta = meta;
    var freshLines = getFreshnessStatusLines(meta);
    var keysLines = getApiKeysStatusLines();
    var freshHint = document.getElementById('headerFreshnessHint');
    var keysHint = document.getElementById('headerApiKeysHint');
    function toneHint(el, lines) {
      if (!el || !lines) return;
      el.textContent = lines.secondary
        ? lines.primary + ' · ' + lines.secondary
        : lines.primary;
      el.classList.remove('header-toolbar-hint--ok', 'header-toolbar-hint--warn', 'header-toolbar-hint--neutral');
      el.classList.add('header-toolbar-hint--' + (lines.tone || 'neutral'));
    }
    toneHint(freshHint, freshLines);
    toneHint(keysHint, keysLines);
    var btnFresh = document.getElementById('btnFreshnessInfo');
    if (btnFresh) {
      var freshAria = freshLines.primary;
      if (freshLines.secondary) freshAria += '. ' + freshLines.secondary;
      btnFresh.setAttribute('aria-label', 'Source freshness: ' + freshAria);
    }
    var btnByok = document.getElementById('btnByokSettings');
    if (btnByok) {
      var keysAria = keysLines.primary;
      if (keysLines.secondary) keysAria += '. ' + keysLines.secondary;
      btnByok.setAttribute('aria-label', 'API keys: ' + keysAria);
    }
  }

  function updateAskLlmKeysStatus() {
    var el = document.getElementById('askLlmKeysStatus');
    if (!el) return;
    var cfg = loadByokSettings();
    var parts = [];
    if (cfg.useOwnKeys) {
      var own = [];
      if (cfg.groqApiKey) own.push('Groq (your key)');
      if (cfg.tavilyApiKey) own.push('Tavily (your key)');
      if (own.length) {
        parts.push('BYOK active: ' + own.join(', ') + '.');
        el.className = 'ask-llm-keys-status ask-llm-keys-status--ok';
      } else {
        parts.push('BYOK enabled but no keys saved — open API keys in the header.');
        el.className = 'ask-llm-keys-status ask-llm-keys-status--warn';
      }
    } else if (serverLlmMeta.askGroqServerConfigured || serverLlmMeta.askTavilyServerConfigured) {
      var srv = [];
      if (serverLlmMeta.askGroqServerConfigured) srv.push('Groq (server)');
      if (serverLlmMeta.askTavilyServerConfigured) srv.push('Tavily (server)');
      parts.push('Using server keys: ' + srv.join(', ') + '. Optional: API keys in the header for your own credentials.');
      el.className = 'ask-llm-keys-status';
    } else {
      parts.push('No LLM keys configured. Open API keys in the header or ask your administrator to set server keys.');
      el.className = 'ask-llm-keys-status ask-llm-keys-status--warn';
    }
    el.textContent = parts.join(' ');
    syncHeaderToolbarStatus();
  }

  var BYOK_ICON = {
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    minus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path d="M5 12h14"/></svg>',
    spin:
      '<svg class="byok-validation-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  };

  function byokValidationCardState(item) {
    if (!item || !item.provided) {
      return { card: 'skipped', badge: 'Skipped', icon: BYOK_ICON.minus };
    }
    if (item.valid === true) {
      return { card: 'valid', badge: 'Valid', icon: BYOK_ICON.check };
    }
    if (item.valid === false) {
      return { card: 'invalid', badge: 'Invalid', icon: BYOK_ICON.x };
    }
    return { card: 'skipped', badge: 'Skipped', icon: BYOK_ICON.minus };
  }

  function byokValidationSummaryFromData(data) {
    var groq = data && data.groq;
    var tavily = data && data.tavily;
    var invalid = (groq && groq.valid === false) || (tavily && tavily.valid === false);
    var valid =
      (groq && groq.valid === true) || (tavily && tavily.valid === true);
    var panel = 'success';
    var title = 'All checked keys are valid';
    var icon = BYOK_ICON.check;
    if (invalid) {
      panel = 'warning';
      title = 'Some keys need attention';
      icon = BYOK_ICON.x;
    } else if (!valid) {
      panel = 'warning';
      title = 'No keys were verified';
      icon = BYOK_ICON.minus;
    }
    var meta = 'Checked just now';
    if (data && data.checkedAt) {
      try {
        meta = 'Checked ' + new Date(data.checkedAt).toLocaleTimeString();
      } catch (e) {}
    }
    return { panel: panel, title: title, meta: meta, icon: icon };
  }

  function byokValidationCardHtml(providerLabel, roleLabel, item, pending) {
    var st = pending
      ? { card: 'pending', badge: 'Checking…', icon: BYOK_ICON.spin }
      : byokValidationCardState(item);
    return (
      '<li class="byok-validation-card byok-validation-card--' +
      st.card +
      '">' +
      '<span class="byok-validation-card-icon">' +
      st.icon +
      '</span>' +
      '<div class="byok-validation-card-body">' +
      '<div class="byok-validation-card-head">' +
      '<span class="byok-validation-card-provider">' +
      escapeHtml(providerLabel) +
      '</span>' +
      '<span class="byok-validation-card-role">' +
      escapeHtml(roleLabel) +
      '</span>' +
      '<span class="byok-validation-card-badge">' +
      escapeHtml(st.badge) +
      '</span>' +
      '</div>' +
      '<p class="byok-validation-card-message">' +
      escapeHtml((item && item.message) || (pending ? 'Contacting provider…' : '')) +
      '</p>' +
      '</div></li>'
    );
  }

  function renderByokValidationPanel(opts) {
    var box = document.getElementById('byokValidationResults');
    if (!box) return;
    if (!opts) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    var summary = opts.summary || {};
    var panelClass = summary.panel || 'loading';
    var cards = opts.cardsHtml || '';
    box.innerHTML =
      '<div class="byok-validation-panel byok-validation-panel--' +
      escapeHtml(panelClass) +
      '">' +
      '<div class="byok-validation-summary">' +
      '<span class="byok-validation-summary-icon">' +
      (summary.icon || BYOK_ICON.shield) +
      '</span>' +
      '<div class="byok-validation-summary-text">' +
      '<p class="byok-validation-summary-title">' +
      escapeHtml(summary.title || '') +
      '</p>' +
      '<p class="byok-validation-summary-meta">' +
      escapeHtml(summary.meta || '') +
      '</p>' +
      '</div></div>' +
      '<ul class="byok-validation-list">' +
      cards +
      '</ul></div>';
    box.classList.remove('hidden');
  }

  function renderByokValidationLoading(groqProvided, tavilyProvided) {
    var cards = '';
    if (groqProvided) {
      cards += byokValidationCardHtml('Groq', 'Primary Ask LLM', null, true);
    }
    if (tavilyProvided) {
      cards += byokValidationCardHtml('Tavily', 'Fallback search', null, true);
    }
    renderByokValidationPanel({
      summary: {
        panel: 'loading',
        title: 'Verifying API keys…',
        meta: 'This usually takes a few seconds',
        icon: BYOK_ICON.spin
      },
      cardsHtml: cards
    });
  }

  function renderByokValidationResults(data) {
    if (!data) {
      renderByokValidationPanel(null);
      return;
    }
    var summary = byokValidationSummaryFromData(data);
    var cards = '';
    if (data.groq) {
      cards += byokValidationCardHtml('Groq', 'Primary Ask LLM', data.groq, false);
    }
    if (data.tavily) {
      cards += byokValidationCardHtml('Tavily', 'Fallback search', data.tavily, false);
    }
    if (!cards) {
      renderByokValidationPanel(null);
      return;
    }
    renderByokValidationPanel({ summary: summary, cardsHtml: cards });
  }

  function initByokSettingsUi() {
    var dialog = document.getElementById('byokSettingsDialog');
    var btnOpen = document.getElementById('btnByokSettings');
    var btnClose = document.getElementById('byokSettingsDialogClose');
    var form = document.getElementById('byokSettingsForm');
    var chk = document.getElementById('byokUseOwnKeys');
    var groqIn = document.getElementById('byokGroqApiKey');
    var tavIn = document.getElementById('byokTavilyApiKey');
    var btnCheck = document.getElementById('byokCheckKeys');
    var btnClear = document.getElementById('byokClearKeys');
    var msg = document.getElementById('byokSettingsMessage');
    if (!dialog || !form) return;

    function fillFormFromStorage() {
      var cfg = loadByokSettings();
      if (chk) chk.checked = cfg.useOwnKeys;
      if (groqIn) groqIn.value = cfg.groqApiKey || '';
      if (tavIn) tavIn.value = cfg.tavilyApiKey || '';
    }

    function setDialogMessage(text, ok) {
      if (!msg) return;
      if (!text) {
        msg.textContent = '';
        msg.className = 'byok-settings-toast hidden';
        return;
      }
      msg.textContent = text;
      msg.className =
        'byok-settings-toast ' + (ok ? 'byok-settings-toast--ok' : 'byok-settings-toast--error');
    }

    function setCheckBusy(busy) {
      var on = Boolean(busy);
      if (btnCheck) {
        btnCheck.disabled = on;
        btnCheck.setAttribute('aria-busy', on ? 'true' : 'false');
        btnCheck.classList.toggle('is-checking', on);
        var lbl = btnCheck.querySelector('.btn-byok-check-label');
        if (lbl) lbl.textContent = on ? 'Checking…' : 'Check validity';
      }
      if (btnClear) btnClear.disabled = on;
    }

    function openDialog() {
      fillFormFromStorage();
      resetKeyRevealButtons();
      setDialogMessage('');
      renderByokValidationPanel(null);
      if (typeof dialog.showModal === 'function') dialog.showModal();
    }

    function closeDialog() {
      if (typeof dialog.close === 'function') dialog.close();
    }

    function resetKeyRevealButtons() {
      form.querySelectorAll('.byok-settings-reveal[data-reveal-for]').forEach(function (btn) {
        var inputId = btn.getAttribute('data-reveal-for');
        var input = inputId ? document.getElementById(inputId) : null;
        if (input) input.type = 'password';
        btn.setAttribute('aria-pressed', 'false');
        var showLabel = btn.getAttribute('aria-label') || '';
        if (/Hide /i.test(showLabel)) {
          btn.setAttribute('aria-label', showLabel.replace(/^Hide /i, 'Show '));
        }
      });
    }

    form.querySelectorAll('.byok-settings-reveal[data-reveal-for]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inputId = btn.getAttribute('data-reveal-for');
        var input = inputId ? document.getElementById(inputId) : null;
        if (!input) return;
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.setAttribute('aria-pressed', showing ? 'false' : 'true');
        var base = (btn.getAttribute('aria-label') || 'API key').replace(/^(Show|Hide)\s+/i, '');
        btn.setAttribute('aria-label', (showing ? 'Show ' : 'Hide ') + base);
      });
    });

    if (btnOpen) btnOpen.addEventListener('click', openDialog);
    if (btnClose) btnClose.addEventListener('click', closeDialog);
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeDialog();
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog();
    });
    dialog.addEventListener('close', resetKeyRevealButtons);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveByokSettings({
        useOwnKeys: chk && chk.checked,
        groqApiKey: groqIn ? groqIn.value : '',
        tavilyApiKey: tavIn ? tavIn.value : ''
      });
      updateAskLlmKeysStatus();
      setDialogMessage('Saved. Keys stay in this browser only.', true);
      setTimeout(closeDialog, 700);
    });

    if (btnClear) {
      btnClear.addEventListener('click', function () {
        clearByokSettings();
        fillFormFromStorage();
        renderByokValidationPanel(null);
        updateAskLlmKeysStatus();
        setDialogMessage('Cleared saved keys from this browser.', true);
      });
    }

    if (btnCheck) {
      btnCheck.addEventListener('click', function () {
        var groqVal = groqIn ? String(groqIn.value || '').trim() : '';
        var tavVal = tavIn ? String(tavIn.value || '').trim() : '';
        if (!groqVal && !tavVal) {
          renderByokValidationPanel(null);
          setDialogMessage('Enter at least one API key to check, or save server keys in .env.', false);
          return;
        }
        setDialogMessage('');
        setCheckBusy(true);
        renderByokValidationLoading(Boolean(groqVal), Boolean(tavVal));
        post('/api/validate-api-keys', {
          apiKeys: {
            groqApiKey: groqVal,
            tavilyApiKey: tavVal
          }
        })
          .then(function (data) {
            renderByokValidationResults(data);
            var groqOk = data && data.groq && data.groq.valid === true;
            var tavOk = data && data.tavily && data.tavily.valid === true;
            var groqBad = data && data.groq && data.groq.valid === false;
            var tavBad = data && data.tavily && data.tavily.valid === false;
            if (groqBad || tavBad) {
              setDialogMessage('Review the results below and update any invalid keys.', false);
            } else if (groqOk || tavOk) {
              setDialogMessage('');
            } else {
              setDialogMessage('No keys were checked — enter a Groq or Tavily key.', false);
            }
          })
          .catch(function () {
            renderByokValidationPanel(null);
            setDialogMessage('Could not run validation. Is the Node server running?', false);
          })
          .finally(function () {
            setCheckBusy(false);
          });
      });
    }
  }

  /**
   * News attachments API returns JSON. Proxies sometimes omit Content-Type; static hosts return HTML.
   * Do not rely on Content-Type — detect HTML by body, then JSON.parse. POST first, GET fallback.
   */
  function parseAttachmentsApiBody(status, text) {
    var trimmed = String(text || '').trim();
    if (
      /^\s*<!DOCTYPE\b/i.test(trimmed) ||
      /^\s*<\s*html[\s>]/i.test(trimmed) ||
      /^\s*<\s*head[\s>]/i.test(trimmed)
    ) {
      throw new Error(
        'Attachments need the Node API. Open the app from the same host as the server (e.g. run npm start and use http://localhost:3847). ' +
          'If the UI is on another domain, set <meta name="gdpr-api-base" content="https://your-api-origin"> in index.html. ' +
          'Static file / preview-only hosting cannot run this feature.'
      );
    }
    var j;
    try {
      j = JSON.parse(trimmed);
    } catch (parseErr) {
      throw new Error(
        'Could not read the attachments response. Restart or redeploy the server (npm start), or try again in a moment.'
      );
    }
    if (status >= 400 || (j && j.ok === false)) {
      throw new Error((j && j.error) || 'Request failed (' + status + ')');
    }
    return j;
  }

  function fetchArticleAttachments(articleUrl) {
    var u = String(articleUrl || '').trim();
    if (!u) return Promise.reject(new Error('Missing article URL.'));

    var base = API + '/api/news/article-attachments';
    var initPost = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*'
      },
      body: JSON.stringify({ url: u })
    };
    var initGet = {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' }
    };

    function tryRequest(method) {
      var reqUrl = method === 'GET' ? base + '?url=' + encodeURIComponent(u) : base;
      var init = method === 'GET' ? initGet : initPost;
      return fetch(reqUrl, init).then(function (r) {
        return r.text().then(function (text) {
          return parseAttachmentsApiBody(r.status, text);
        });
      });
    }

    return tryRequest('POST').catch(function () {
      return tryRequest('GET');
    });
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
    if (!getRegProfile().hasSuitableRecitals) return Promise.resolve([]);
    if (Array.isArray(fromApi) && fromApi.length > 0) return Promise.resolve(fromApi);
    return loadArticleToRecitalsMap().then(function (map) {
      var arr = map[String(articleNum)];
      return Array.isArray(arr) ? arr : [];
    });
  }

  function resolveSuitableArticlesForRecital(recitalNum, fromApi) {
    if (!getRegProfile().hasSuitableRecitals) return Promise.resolve([]);
    if (Array.isArray(fromApi) && fromApi.length > 0) return Promise.resolve(fromApi);
    return loadArticleToRecitalsMap().then(function (map) {
      var maxArt = regulationMaxArticles();
      var out = [];
      for (var artKey in map) {
        if (!Object.prototype.hasOwnProperty.call(map, artKey)) continue;
        var recs = map[artKey];
        if (!Array.isArray(recs)) continue;
        if (recs.indexOf(recitalNum) !== -1) {
          var a = parseInt(artKey, 10);
          if (!isNaN(a) && a >= 1 && a <= maxArt) out.push(a);
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

  function setBtnRefreshLabels(fullText, shortText) {
    if (!btnRefresh) return;
    var full = fullText || 'Refresh sources';
    var short = shortText != null ? shortText : 'Refresh';
    btnRefresh.innerHTML =
      '<span class="btn-icon" aria-hidden="true">↻</span>' +
      '<span class="btn-text btn-text--full">' +
      escapeHtml(full) +
      '</span>' +
      '<span class="btn-text btn-text--short">' +
      escapeHtml(short) +
      '</span>';
  }
  const btnBack = document.getElementById('btnBack');
  const btnBackToQuestion = document.getElementById('btnBackToQuestion');
  const btnBackFromCitation = document.getElementById('btnBackFromCitation');
  const viewBrowse = document.getElementById('viewBrowse');
  const viewAsk = document.getElementById('viewAsk');
  const viewSources = document.getElementById('viewSources');
  const viewNews = document.getElementById('viewNews');
  const sourcesList = document.getElementById('sourcesList');
  const newsFeedsList = document.getElementById('newsFeedsList');
  const newsFeedsAsideTop = document.getElementById('newsFeedsAsideTop');
  const newsFeedsSectionToggle = document.getElementById('newsFeedsSectionToggle');
  const newsSections = document.getElementById('newsSections');
  const newsFilterSource = document.getElementById('newsFilterSource');
  const newsFilterTopic = document.getElementById('newsFilterTopic');
  const newsFilterClear = document.getElementById('newsFilterClear');
  const newsSearchInput = document.getElementById('newsSearchInput');
  const newsSearchClear = document.getElementById('newsSearchClear');
  const newsResultStatus = document.getElementById('newsResultStatus');
  const newsTocNav = document.getElementById('newsTocNav');
  const newsTocList = document.getElementById('newsTocList');
  const btnRefreshNews = document.getElementById('btnRefreshNews');
  const newsControlsPanel = document.getElementById('newsControlsPanel');
  const newsSidebarFilters = document.getElementById('newsSidebarFilters');
  const newsSidebarFiltersCard = document.getElementById('newsSidebarFiltersCard');
  const newsSidebarFiltersToggle = document.getElementById('newsSidebarFiltersToggle');
  const newsSidebarFiltersBadge = document.getElementById('newsSidebarFiltersBadge');
  const newsSearchInputAside = document.getElementById('newsSearchInputAside');
  const newsSearchClearAside = document.getElementById('newsSearchClearAside');
  const newsFilterSourceAside = document.getElementById('newsFilterSourceAside');
  const newsFilterTopicAside = document.getElementById('newsFilterTopicAside');
  const newsFilterClearAside = document.getElementById('newsFilterClearAside');
  const newsResultStatusAside = document.getElementById('newsResultStatusAside');
  var newsToolbarDockObserver = null;
  const newsAttachmentsDialog = document.getElementById('newsAttachmentsDialog');
  const newsAttachmentsDialogArticle = document.getElementById('newsAttachmentsDialogArticle');
  const newsAttachmentsDialogBody = document.getElementById('newsAttachmentsDialogBody');
  const newsAttachmentsDialogClose = document.getElementById('newsAttachmentsDialogClose');
  const browsePlaceholder = document.getElementById('browsePlaceholder');
  const browseRecitals = document.getElementById('browseRecitals');
  const browseChapters = document.getElementById('browseChapters');
  const browseDetail = document.getElementById('browseDetail');
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
  const docNavGoForm = document.getElementById('docNavGoForm');
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

  /** Reader chrome: 'page' = one provision; 'full' = all articles or all recitals. */
  var READER_VIEW_MODE_KEY = 'gdprQaReaderViewMode';
  var readerViewMode = 'page';
  try {
    var storedReaderMode = localStorage.getItem(READER_VIEW_MODE_KEY);
    if (storedReaderMode === 'full' || storedReaderMode === 'page') readerViewMode = storedReaderMode;
  } catch (eReaderMode) {}
  var readerViewModeEl = document.getElementById('readerViewMode');
  var readerViewModePageBtn = document.getElementById('readerViewModePage');
  var readerViewModeFullBtn = document.getElementById('readerViewModeFull');

  var APP_ROUTE_KNOWN_REG_IDS = {
    gdpr: 1,
    'data-act': 1,
    'ai-act': 1,
    'id-pdp': 1,
    'id-satu-data': 1,
    'id-ai-ethics': 1,
    'us-ccpa': 1,
    'us-admt': 1,
    'us-open-data': 1,
    'iso-27701': 1,
    'iso-19941': 1,
    'iso-23894': 1,
    soc2: 1
  };
  var APP_ROUTE_KNOWN_VIEWS = { browse: 1, ask: 1, news: 1, sources: 1 };
  var suppressAppRouteSync = false;
  var appRouteRestorePending = false;
  /** False until initial hash restore finishes — prevents setCurrentRegulation from wiping deep links to #/browse. */
  var appRouteReady = false;

  function parseAppRouteFromHash() {
    var raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
    if (!raw) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var parts = raw.split('/').filter(Boolean);
    if (!parts.length) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var first = parts[0].toLowerCase();
    if (APP_ROUTE_KNOWN_VIEWS[first] && first !== 'browse') {
      return { view: first, segment: null, regulationId: null, docType: null, docNumber: null };
    }
    if (first === 'browse') {
      if (parts.length === 1) {
        return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
      }
      parts.shift();
      first = parts[0] ? parts[0].toLowerCase() : '';
    }
    if (!APP_ROUTE_KNOWN_REG_IDS[first]) {
      return { view: 'browse', segment: 'home', regulationId: null, docType: null, docNumber: null };
    }
    var regId = first;
    var segment = 'home';
    var docType = null;
    var docNumber = null;
    if (parts.length >= 2) {
      var second = parts[1].toLowerCase();
      if (second === 'chapters' || second === 'recitals') {
        segment = second;
      } else if (second === 'article' || second === 'recital') {
        segment = 'detail';
        docType = second;
        docNumber = parseInt(parts[2], 10);
        if (isNaN(docNumber) || docNumber < 1) {
          segment = 'home';
          docType = null;
          docNumber = null;
        }
      }
    }
    return {
      view: 'browse',
      segment: segment,
      regulationId: regId,
      docType: docType,
      docNumber: docNumber
    };
  }

  function currentRouteRegulationId() {
    return currentRegulation && currentRegulation.id ? currentRegulation.id : 'gdpr';
  }

  /** Deep-link hash for a provision — never use href="#" (that clears the route to home). */
  function buildDocRouteHash(docType, docNumber, regId) {
    var id = regId || currentRouteRegulationId();
    var kind = docType === 'recital' ? 'recital' : 'article';
    var n = parseInt(docNumber, 10);
    if (!id || isNaN(n) || n < 1) return '#/browse';
    return '#/' + id + '/' + kind + '/' + n;
  }

  function buildAppRouteHash() {
    if (viewAsk && viewAsk.classList.contains('active')) return '#/ask';
    if (viewNews && viewNews.classList.contains('active')) return '#/news';
    if (viewSources && viewSources.classList.contains('active')) return '#/sources';
    var regId = currentRouteRegulationId();
    if (browseDetail && !browseDetail.classList.contains('hidden') && currentDoc && currentDoc.type && currentDoc.number != null) {
      return buildDocRouteHash(currentDoc.type, currentDoc.number, regId);
    }
    if (browseChapters && !browseChapters.classList.contains('hidden')) {
      return '#/' + regId + '/chapters';
    }
    if (browseRecitals && !browseRecitals.classList.contains('hidden')) {
      return '#/' + regId + '/recitals';
    }
    return '#/browse';
  }

  function syncAppRouteToUrl(replace) {
    if (!appRouteReady || suppressAppRouteSync || appRouteRestorePending) return;
    var hash = buildAppRouteHash();
    if (window.location.hash === hash) return;
    suppressAppRouteSync = true;
    var usedHashAssignment = false;
    try {
      if (replace && history.replaceState) {
        /* replaceState does not fire hashchange — safe for in-place URL correction. */
        history.replaceState(null, '', hash);
      } else {
        /* Prefer location.hash so Back still fires hashchange → restoreAppRouteFromHash. */
        window.location.hash = hash;
        usedHashAssignment = true;
      }
    } catch (err) {
      try {
        window.location.hash = hash;
        usedHashAssignment = true;
      } catch (err2) {}
    }
    /* location.hash fires hashchange asynchronously; keep suppress until after it
       so a stale restore cannot overwrite the UI mid-navigation. */
    if (usedHashAssignment) {
      setTimeout(function () {
        suppressAppRouteSync = false;
      }, 0);
    } else {
      suppressAppRouteSync = false;
    }
  }

  function activateMainViewOnly(viewName) {
    closeBrowseRegMenu();
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.remove('active');
      v.setAttribute('hidden', '');
    });
    var tab = document.querySelector('.tab[data-view="' + viewName + '"]');
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }
    var panel = document.getElementById('view' + viewName.charAt(0).toUpperCase() + viewName.slice(1));
    if (panel) {
      panel.classList.add('active');
      panel.removeAttribute('hidden');
    }
    if (viewName === 'sources') loadSources();
    if (viewName === 'news') loadNews();
    if (viewName === 'ask') initAskIndustrySectorCombobox();
    updateBrowseSectionMenu();
    scheduleTabsTrackThumb();
  }

  function applyAppRoute(route) {
    if (!route) return;
    suppressAppRouteSync = true;
    appRouteRestorePending = true;
    try {
      if (route.view === 'ask' || route.view === 'news' || route.view === 'sources') {
        activateMainViewOnly(route.view);
        return;
      }
      activateMainViewOnly('browse');
      if (route.regulationId) {
        var match = findRegulationInCatalog(route.regulationId);
        if (match) setCurrentRegulation(match);
      }
      if (route.segment === 'detail' && route.docType && route.docNumber != null) {
        if (route.docType === 'recital') openRecital(route.docNumber);
        else openArticle(route.docNumber);
        return;
      }
      if (route.segment === 'chapters') {
        showSection(browseChapters);
        loadChapters();
        return;
      }
      if (route.segment === 'recitals') {
        showSection(browseRecitals);
        loadRecitals();
        return;
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
    } finally {
      appRouteRestorePending = false;
      suppressAppRouteSync = false;
    }
  }

  function restoreAppRouteFromHash() {
    applyAppRoute(parseAppRouteFromHash());
  }

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
    if (!art || !getRegProfile().hasArticleTopics) return [];
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
    if (!art || art.number == null) return provisionKindLabels().article;
    var profile = getRegProfile();
    var fallback = typeof profile.articleHeading === 'function' ? profile.articleHeading(art.number) : 'Article ' + art.number;
    var t = (art.title || '').trim();
    if (profile.id === 'gdpr') {
      var canonical = CANONICAL_ARTICLE_TITLES[art.number];
      if (canonical) return canonical;
      if (!t) return fallback;
      if (t.length > 120 || /^\(Recital\s+\d+\)/i.test(t) || /^\(.*\)\s+of\s+Directive/i.test(t)) return fallback;
      return t;
    }
    if (!t) return fallback;
    return t;
  }

  /** Recital topic line from corpus title (regulation-agnostic). */
  function getRecitalDisplayTitle(r) {
    if (!r) return '';
    var topic = parseRecitalTopicTitle(r.title, r.number);
    if (topic) return topic;
    var t = String(r.title || '').trim();
    if (!t) return '';
    if (getRegProfile().id === 'gdpr' && (t.length > 200 || /^\(.*\)\s*of\s+Directive/i.test(t))) return '';
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
    var profile = getRegProfile();
    var tryPrefixes =
      typeof profile.bodyStripPrefixes === 'function'
        ? profile.bodyStripPrefixes(articleNumber, dataTitle, displayTitle)
        : [];
    if (!tryPrefixes.length) {
      if (dataTitle && String(dataTitle).trim()) tryPrefixes.push(String(dataTitle).trim());
      tryPrefixes.push('Art. ' + articleNumber + ' GDPR');
      if (displayTitle && String(displayTitle).trim()) tryPrefixes.push(String(displayTitle).trim());
    }
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
      dd1.appendChild(document.createTextNode(refreshedTxt));
      var srcSpan = document.createElement('span');
      srcSpan.className = 'freshness-source';
      var regProfile = getRegProfile();
      var sourceLabel =
        (regProfile && regProfile.freshnessSourceLabel) ||
        (regulationJurisdiction(regProfile) === 'id' ? 'Official text' : 'EUR-Lex');
      srcSpan.textContent = sourceLabel;
      dd1.appendChild(document.createTextNode(' '));
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
        'Content not yet loaded from official sources. Use Refresh sources to fetch the latest ' + regulationShortLabel() + ' text.';
      freshnessContentEl.appendChild(note);
    }
    syncHeaderToolbarStatus(meta);
  }

  function loadMeta() {
    get('/api/meta')
      .then(function (meta) {
        serverLlmMeta.askGroqServerConfigured = Boolean(meta && meta.askGroqServerConfigured);
        serverLlmMeta.askTavilyServerConfigured = Boolean(meta && meta.askTavilyServerConfigured);
        serverLlmMeta.byokSupported = meta && meta.byokSupported != null ? Boolean(meta.byokSupported) : true;
        updateAskLlmKeysStatus();
        setMeta(meta);
      })
      .catch(function () {
        if (freshnessContentEl) {
          freshnessContentEl.textContent = '';
          var err = document.createElement('p');
          err.className = 'freshness-tooltip-error';
          err.textContent = 'Could not load freshness information.';
          freshnessContentEl.appendChild(err);
        }
        syncHeaderToolbarStatus({
          lastRefreshed: null,
          lastChecked: null
        });
        var freshHint = document.getElementById('headerFreshnessHint');
        if (freshHint) {
          freshHint.textContent = 'Could not load timestamps — tap for details';
          freshHint.classList.add('header-toolbar-hint--warn');
        }
      });
  }

  var lastSourcesItems = [];
  var sourcesSearchQuery = '';

  function sourceHostname(url) {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (err) {
      return '';
    }
  }

  function sourceMonogram(name) {
    var clean = String(name || '')
      .replace(/\(.*?\)/g, ' ')
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .trim();
    if (!clean) return 'SRC';
    var parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || '')).toUpperCase();
  }

  function externalLinkIconSvg() {
    return (
      '<svg class="source-card-ext" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>' +
      '</svg>'
    );
  }

  function updateSourcesCount(visible, total) {
    var el = document.getElementById('sourcesCount');
    if (!el) return;
    if (!total) {
      el.textContent = '0 sources';
      return;
    }
    if (visible === total) el.textContent = total === 1 ? '1 source' : total + ' sources';
    else el.textContent = visible + ' / ' + total;
  }

  function sourceMatchesQuery(src, q) {
    if (!q) return true;
    var host = sourceHostname(src.url);
    var docs = (src.documents || [])
      .map(function (d) {
        return (d.label || '') + ' ' + (d.url || '');
      })
      .join(' ');
    var blob = [src.name, src.description, host, docs, SOURCE_SUMMARIES[src.name] || ''].join(' ').toLowerCase();
    return blob.indexOf(q) !== -1;
  }

  function applySourcesFilter() {
    if (!sourcesList) return;
    var q = (sourcesSearchQuery || '').trim().toLowerCase();
    var cards = sourcesList.querySelectorAll('.source-card');
    var visible = 0;
    cards.forEach(function (card) {
      var idx = parseInt(card.getAttribute('data-source-index'), 10);
      var src = lastSourcesItems[idx];
      var show = src ? sourceMatchesQuery(src, q) : false;
      card.hidden = !show;
      if (show) visible += 1;
    });
    updateSourcesCount(visible, lastSourcesItems.length);
    var empty = document.getElementById('sourcesEmpty');
    if (empty) empty.hidden = !(q && visible === 0 && lastSourcesItems.length > 0);
    var clearBtn = document.getElementById('sourcesSearchClear');
    if (clearBtn) clearBtn.hidden = !q;
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
        lastSourcesItems = sources;
        container.innerHTML = '';
        var extIcon = externalLinkIconSvg();
        sources.forEach(function (src, index) {
          const card = document.createElement('article');
          card.className = 'source-card';
          card.setAttribute('role', 'listitem');
          card.setAttribute('data-source-index', String(index));
          const docs = src.documents || (src.url ? [{ label: 'Visit site', url: src.url }] : []);
          const primaryDocs = docs.filter(function (d) {
            return d && d.url && d.url !== src.url;
          });
          const docsForList = primaryDocs.length ? primaryDocs : docs.filter(function (d) {
            return d && d.url;
          });
          let docsHtml = '';
          if (docsForList.length) {
            docsHtml =
              '<ul class="source-doc-links">' +
              docsForList
                .map(function (d) {
                  return (
                    '<li><a href="' +
                    escapeHtml(d.url) +
                    '" target="_blank" rel="noopener noreferrer">' +
                    '<span class="source-doc-label">' +
                    escapeHtml(d.label || 'Open document') +
                    '</span>' +
                    extIcon +
                    '</a></li>'
                  );
                })
                .join('') +
              '</ul>';
          }
          var desc = src.description || SOURCE_SUMMARIES[src.name] || '';
          var host = sourceHostname(src.url);
          var mark = sourceMonogram(src.name);
          var primaryHref = src.url || (docs[0] && docs[0].url) || '#';
          card.innerHTML =
            '<div class="source-card-body">' +
            '<div class="source-card-head">' +
            '<span class="source-card-mark" aria-hidden="true">' +
            escapeHtml(mark) +
            '</span>' +
            '<div class="source-card-head-copy">' +
            '<h3 class="source-card-title"><a href="' +
            escapeHtml(primaryHref) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(src.name) +
            '</a></h3>' +
            (host ? '<span class="source-card-host">' + escapeHtml(host) + '</span>' : '') +
            '</div></div>' +
            (desc ? '<p class="source-card-desc">' + escapeHtml(desc) + '</p>' : '') +
            (src.url
              ? '<div class="source-card-actions"><a class="source-card-primary" href="' +
                escapeHtml(src.url) +
                '" target="_blank" rel="noopener noreferrer">Open official site' +
                extIcon +
                '</a></div>'
              : '') +
            '</div>' +
            docsHtml;
          container.appendChild(card);
        });
        applySourcesFilter();
      })
      .catch(function () {
        lastSourcesItems = [];
        container.innerHTML = '<p class="excerpt">Could not load sources.</p>';
        updateSourcesCount(0, 0);
        var empty = document.getElementById('sourcesEmpty');
        if (empty) empty.hidden = true;
      });
  }

  (function initSourcesSearch() {
    var input = document.getElementById('sourcesSearch');
    var clearBtn = document.getElementById('sourcesSearchClear');
    if (!input || input.dataset.bound === '1') return;
    input.dataset.bound = '1';
    var timer = null;
    input.addEventListener('input', function () {
      sourcesSearchQuery = input.value || '';
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(applySourcesFilter, 80);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        sourcesSearchQuery = '';
        applySourcesFilter();
        input.focus();
      });
    }
  })();

  var SOURCE_SUMMARIES = {
    'European Data Protection Board (EDPB)': 'EU-level guidance, opinions, and enforcement news. Covers how national supervisors apply GDPR and coordinate across the EU.',
    'EDPB': 'EU-level guidance, opinions, and enforcement news from the European Data Protection Board and national data protection authorities.',
    'European Data Protection Supervisor (EDPS)':
      'EU institutional data protection: how the EDPS supervises processing by EU institutions and bodies, and coordinates with the EDPB on consistency.',
    'EDPS': 'Press, blogs, and updates from the European Data Protection Supervisor on EU institutions, Regulation 2018/1725, and cooperation with the EDPB.',
    'ICO (UK)': 'UK regulator updates: enforcement actions, fines, guidance under UK GDPR, and how the ICO interprets data protection law.',
    'European Commission': 'Official EU policy, reform, and publications on data protection and the GDPR from the European Commission.',
    'Council of Europe': 'International data protection standards and updates on Convention 108+ (protection of personal data).',
    'AI Act Law':
      'Readable English layout of Regulation (EU) 2024/1689 with articles, recitals, chapters, and annexes—aligned with the official structure.',
    'EUR-Lex (Official Journal)':
      'Authoritative EU publication of the Artificial Intelligence Act (Regulation (EU) 2024/1689) in the Official Journal.',
    'EU Digital Strategy (AI)':
      'European Commission hub for the AI Act regulatory framework, implementation timelines, and policy updates.',
    'Data Act Law':
      'Readable English layout of Regulation (EU) 2023/2854 with articles, recitals, chapters, and annexes.',
    'European Commission':
      'Official EU policy on the Data Act, fair access to data, and the European data strategy (also data protection when selected for GDPR).',
    FTC: 'U.S. Federal Trade Commission press releases on consumer privacy, data brokers, COPPA, and AI/automated decision-making.',
    CPPA: 'California Privacy Protection Agency (CalPrivacy) announcements — CCPA/CPRA rulemaking, data-broker enforcement, and Delete Act updates.',
    'California OAG': 'California Attorney General consumer-privacy news, including CCPA enforcement and related settlements.',
    'Colorado AG':
      'Colorado Attorney General — ADAI / ADMT Act rulemaking, automated decision-making technology, and consumer-protection AI policy.',
    'data.gov': 'Federal data catalogue (data.gov) and resources.data.gov guidance under the OPEN Government Data Act.',
    GSA: 'U.S. General Services Administration newsroom — open government data and data.gov operations.',
    'Federal Data Strategy': 'Federal Data Strategy action plans and progress for open Government data assets.',
    'California Privacy Protection Agency':
      'Official CPPA compilation and landing pages for Cal. Civ. Code Title 1.81.5 (CCPA/CPRA).',
    'California Legislative Information (leginfo)': 'Official California Civil Code Title 1.81.5 as maintained by the Legislative Counsel.',
    'California Department of Justice — Office of the Attorney General':
      'Attorney General CCPA guidance and enforcement landing page for consumers and businesses.',
    'Colorado General Assembly — SB26-189 (became law)':
      'Official bill page for Colorado SB 26-189 (Automated Decision-Making Technology Act).',
    'Colorado General Assembly — Session Laws Chapter 131':
      'Enrolled session-law text of SB 26-189 (C.R.S. 6-1-1701 et seq.).',
    'Colorado Attorney General — AI / ADMT': 'Colorado Department of Law ADAI / ADMT rulemaking and enforcement hub (coag.gov/ai).',
    'U.S. Government Publishing Office (govinfo)':
      'Official HTML/PDF of Public Law 115-435, including Title II (OPEN Government Data Act).',
    'data.gov — Federal data catalogue': 'Public interface maintained under 44 U.S.C. § 3511 as the Federal data catalogue.',
    'U.S. General Services Administration': 'GSA administers the Federal data catalogue interface required by the OPEN Government Data Act.',
    ISO: 'International Organization for Standardization — news and catalogue pages for ISO/IEC 27701, 19941, 23894, and related JTC 1 committees.',
    'ISO Insights': 'ISO Standards world and insights featuring published International Standards (privacy, AI, cloud).',
    AICPA: 'AICPA & CIMA — SOC for Service Organizations and Trust Services Criteria updates.',
    'ISO — ISO/IEC 27701:2025 catalogue':
      'Official ISO.org catalogue for ISO/IEC 27701:2025 (standalone PIMS, 2nd edition, published 14 October 2025).',
    'ISO/IEC JTC 1/SC 27': 'ISO/IEC committee for information security, cybersecurity and privacy protection — developer of ISO/IEC 27701.',
    'ISO — ISO/IEC 19941:2017 catalogue':
      'Official ISO.org catalogue for ISO/IEC 19941:2017 cloud interoperability and portability (replacement ISO/IEC 19941-1 forthcoming).',
    'ISO — ISO/IEC 17788 and 17789 (related cloud vocabulary and architecture)':
      'Related cloud computing vocabulary and reference architecture used by ISO/IEC 19941.',
    'ISO — ISO/IEC 23894:2023 catalogue':
      'Official ISO.org catalogue for ISO/IEC 23894:2023 AI risk-management guidance (ISO 31000 overlay, JTC 1/SC 42).',
    'ISO — ISO/IEC 42001 (related AIMS)':
      'Related certifiable Artificial Intelligence Management System — distinct from ISO/IEC 23894 guidance.',
    'ISO/IEC JTC 1/SC 42': 'ISO/IEC committee for artificial intelligence — developer of ISO/IEC 23894 and ISO/IEC 42001.',
    'AICPA — 2017 Trust Services Criteria with 2022 Points of Focus':
      'Official AICPA download page for the Trust Services Criteria used in SOC 2 reports (TSP section 100).',
    'AICPA — SOC for Service Organizations':
      'Official AICPA landing page for System and Organization Controls reports, including SOC 2.'
  };

  /** Catch-all leaf topic; must match `NEWS_TOPIC_FALLBACK` in `news-topics.js`. */
  var NEWS_TOPIC_FALLBACK = 'Other GDPR & data protection topics';

  /**
   * `<option value>` prefix for “whole topic group” rows in the News topic filter.
   * Value is prefix + category name from `topicTaxonomy.groups[].category` (see `news-topics.js`).
   */
  var NEWS_TOPIC_GROUP_VALUE_PREFIX = '__news_topic_group__:';

  /** Preferred order for grouping news sections and filter dropdowns. */
  var NEWS_SOURCE_DISPLAY_ORDER = [
    'Komdigi',
    'Setkab',
    'Antara (Hukum)',
    'Antara (Tekno)',
    'Antara (English)',
    'Satu Data Indonesia',
    'FTC',
    'CPPA',
    'California OAG',
    'Colorado AG',
    'data.gov',
    'GSA',
    'Federal Data Strategy',
    'ISO',
    'ISO Insights',
    'AICPA',
    'European Data Protection Board (EDPB)',
    'EDPB',
    'European Data Protection Supervisor (EDPS)',
    'EDPS',
    'ICO (UK)',
    'European Commission',
    'Council of Europe'
  ];

  var lastNewsItems = [];
  var lastNewsFeedsAll = [];
  /** Per-source and per-topic leaf counts for the loaded corpus (`lastNewsItems`); drives filter badges. */
  var lastNewsFilterCounts = {
    source: {},
    topicLeaf: {},
    allSourcesRow: 0,
    allTopicsRow: 0,
    total: 0
  };
  /** From GET /api/news `topicTaxonomy` — optgroup labels + topic list (mirrors server `news-topics.js`). */
  var lastNewsTopicTaxonomy = null;
  /** url -> count from POST /api/news/attachments-summary (0, or null on per-URL scan error). Undefined = not in capped batch. */
  var newsAttachmentCountsByUrl = Object.create(null);
  var newsAttachmentsSummaryReady = false;
  var newsAttachmentsSummaryFailed = false;
  var newsAttachmentsSummaryRequestSeq = 0;

  var newsBrowseHeading = document.getElementById('newsBrowseHeading');
  var newsListIntro = document.getElementById('newsListIntro');
  var newsViewBySourceBtn = document.getElementById('newsViewBySourceBtn');
  var newsViewAllBtn = document.getElementById('newsViewAllBtn');
  var NEWS_VIEW_MODE_KEY = 'gdpr_news_view_mode';
  var newsViewMode = 'by_source';

  (function restoreNewsViewMode() {
    try {
      var v = sessionStorage.getItem(NEWS_VIEW_MODE_KEY);
      if (v === 'all') newsViewMode = 'all';
    } catch (err) {}
  })();

  function syncNewsViewToggleUi() {
    var bySource = newsViewMode !== 'all';
    if (newsViewBySourceBtn) newsViewBySourceBtn.setAttribute('aria-pressed', bySource ? 'true' : 'false');
    if (newsViewAllBtn) newsViewAllBtn.setAttribute('aria-pressed', bySource ? 'false' : 'true');
    if (newsBrowseHeading) newsBrowseHeading.textContent = bySource ? 'Articles by source' : 'All articles';
    if (newsListIntro) {
      newsListIntro.textContent = bySource
        ? 'Collapse a source to save space. Jump via On this page when several sources are listed.'
        : 'One chronological feed across all sources. Narrow with Source, Topic, or search.';
    }
    if (newsTocNav) newsTocNav.hidden = !bySource;
  }

  function buildNewsEmptyPanelHtml(opts) {
    var o = opts || {};
    var title = o.title || 'Nothing to show';
    var text = o.text || '';
    var actions = '';
    if (o.refresh) {
      actions +=
        '<button type="button" class="btn btn-primary news-empty-refresh" data-news-empty-action="refresh">Refresh feeds</button>';
    }
    if (o.clear) {
      actions +=
        '<button type="button" class="btn btn-secondary news-empty-clear" data-news-empty-action="clear">Clear all filters</button>';
    }
    return (
      '<div class="news-empty-panel" role="status">' +
      '<p class="news-empty-panel-title">' +
      escapeHtml(title) +
      '</p>' +
      (text ? '<p class="news-empty-panel-text">' + escapeHtml(text) + '</p>' : '') +
      actions +
      '</div>'
    );
  }

  function setNewsViewMode(mode) {
    var m = mode === 'all' ? 'all' : 'by_source';
    if (newsViewMode === m) return;
    newsViewMode = m;
    try {
      sessionStorage.setItem(NEWS_VIEW_MODE_KEY, newsViewMode === 'all' ? 'all' : 'by_source');
    } catch (err) {}
    closeAllNewsFilterDropdowns();
    applyNewsFilters();
  }

  /**
   * Attachments control only when we know this article page links at least one allowed file (PDF/Office, etc.).
   * Hidden while the batch summary loads; hidden on batch failure, scan errors, or URLs past the client batch cap.
   */
  function shouldShowNewsAttachmentsButton(url) {
    if (!url || url === '#') return false;
    if (!newsAttachmentsSummaryReady) return false;
    if (newsAttachmentsSummaryFailed) return false;
    var c = newsAttachmentCountsByUrl[url];
    return typeof c === 'number' && c > 0;
  }

  function buildNewsCardAttachmentsBlock(url, title) {
    if (!shouldShowNewsAttachmentsButton(url)) return '';
    return (
      '<div class="news-card-actions">' +
      '<button type="button" class="btn btn-secondary btn-sm btn-news-attachments" data-article-url="' +
      escapeHtml(url) +
      '" data-article-title="' +
      escapeHtml(title) +
      '" aria-label="Review downloadable files linked from this article">Attachments</button>' +
      '</div>'
    );
  }

  var NEWS_CARD_EXTERNAL_ICON_SVG =
    '<svg class="news-card-external-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /** `YYYY-MM-DD` as local calendar date (avoids UTC midnight shifting the displayed day). */
  function parseNewsDateOnlyLocal(raw) {
    var s = String(raw || '').trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) {
      var d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    var y = parseInt(m[1], 10);
    var mo = parseInt(m[2], 10) - 1;
    var day = parseInt(m[3], 10);
    var dt = new Date(y, mo, day, 12, 0, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== day) return null;
    return dt;
  }

  function newsItemSortTime(item) {
    var d = parseNewsDateOnlyLocal(item && item.date);
    return d ? d.getTime() : 0;
  }

  function newsCardFormatDate(item) {
    var d = parseNewsDateOnlyLocal(item && item.date);
    if (!d) return { display: '', iso: '' };
    var iso =
      d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return {
      iso: iso,
      display: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    };
  }

  /**
   * Shared news card DOM (section list + legacy flat list). Structured for scanability: meta row → title
   * (with external-link cue) → summary → footer (source + attachments).
   */
  function buildNewsCardMarkupHtml(item, headingTag) {
    var tag = headingTag || 'h5';
    var title = item.title || 'Untitled';
    var url = item.url || '#';
    var itemSourceUrl = item.sourceUrl || '#';
    var sourceName = item.sourceName || 'Source';
    var df = newsCardFormatDate(item);
    var topic = getTopicFromItem(item);
    var summaryHtml = buildNewsCardSummaryHtml(item);
    var showTopic = topic && topic !== NEWS_TOPIC_FALLBACK;
    var headerHtml = '';
    if (df.display || showTopic) {
      headerHtml =
        '<div class="news-card-header-row">' +
        (df.display
          ? '<time class="news-card-time" datetime="' + escapeHtml(df.iso) + '">' + escapeHtml(df.display) + '</time>'
          : '') +
        (showTopic ? '<span class="news-topic-tag">' + escapeHtml(topic) + '</span>' : '') +
        '</div>';
    }
    return (
      '<div class="news-card-inner">' +
      headerHtml +
      '<' +
      tag +
      ' class="news-card-title">' +
      '<a class="news-card-title-link" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<span class="news-card-title-text">' +
      escapeHtml(title) +
      '</span>' +
      NEWS_CARD_EXTERNAL_ICON_SVG +
      '<span class="visually-hidden"> Opens in a new tab</span>' +
      '</a></' +
      tag +
      '>' +
      summaryHtml +
      '<footer class="news-card-footer">' +
      '<a href="' +
      escapeHtml(itemSourceUrl) +
      '" target="_blank" rel="noopener noreferrer" class="news-card-source">' +
      escapeHtml(sourceName) +
      '<span class="visually-hidden"> (opens in new tab)</span>' +
      '</a>' +
      buildNewsCardAttachmentsBlock(url, title) +
      '</footer></div>'
    );
  }

  function scheduleNewsAttachmentsSummaryForItems(items) {
    newsAttachmentsSummaryReady = false;
    newsAttachmentsSummaryFailed = false;
    newsAttachmentCountsByUrl = Object.create(null);
    var seq = ++newsAttachmentsSummaryRequestSeq;
    applyNewsFilters();

    if (!items || items.length === 0) {
      newsAttachmentsSummaryReady = true;
      applyNewsFilters();
      return;
    }
    var urls = [];
    var seen = Object.create(null);
    for (var i = 0; i < items.length; i++) {
      var u = items[i] && items[i].url;
      if (!u || u === '#' || seen[u]) continue;
      seen[u] = true;
      urls.push(u);
      /* Batch cap must match server POST /api/news/attachments-summary. */
      if (urls.length >= 96) break;
    }
    if (!urls.length) {
      newsAttachmentsSummaryReady = true;
      applyNewsFilters();
      return;
    }
    fetch(API + '/api/news/attachments-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ urls: urls })
    })
      .then(function (r) {
        return r.text().then(function (text) {
          if (seq !== newsAttachmentsSummaryRequestSeq) return;
          try {
            var data = parseAttachmentsApiBody(r.status, text);
            newsAttachmentsSummaryReady = true;
            newsAttachmentsSummaryFailed = false;
            (data.items || []).forEach(function (row) {
              if (row && row.url != null) {
                if (row.count === null || row.count === undefined) {
                  newsAttachmentCountsByUrl[row.url] = null;
                } else {
                  newsAttachmentCountsByUrl[row.url] = Number(row.count);
                }
              }
            });
          } catch (err) {
            newsAttachmentsSummaryFailed = true;
            newsAttachmentsSummaryReady = true;
          }
          applyNewsFilters();
        });
      })
      .catch(function () {
        if (seq !== newsAttachmentsSummaryRequestSeq) return;
        newsAttachmentsSummaryFailed = true;
        newsAttachmentsSummaryReady = true;
        applyNewsFilters();
      });
  }

  function newsSectionIdFromSource(sourceName) {
    return 'news-source-' + String(sourceName || '').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  }

  function getOrderedSourcesFromItems(items) {
    if (!items || !items.length) return [];
    var seen = Object.create(null);
    items.forEach(function (item) {
      var src = item.sourceName || 'Other';
      seen[src] = true;
    });
    var ordered = NEWS_SOURCE_DISPLAY_ORDER.filter(function (s) {
      return seen[s];
    });
    Object.keys(seen).forEach(function (s) {
      if (ordered.indexOf(s) === -1) ordered.push(s);
    });
    return ordered;
  }

  /** Lowercase blob for client-side search (title, snippet, summary paragraphs). */
  function getNewsSearchBlob(item) {
    var chunks = [item.title || '', item.snippet || ''];
    var p = item.summaryParagraphs;
    if (p && Array.isArray(p)) {
      for (var i = 0; i < p.length; i++) {
        var seg = String(p[i] || '').trim();
        if (seg) chunks.push(seg);
      }
    }
    return chunks.join(' ').toLowerCase().replace(/\s+/g, ' ');
  }

  /** When `topicVal` is a group prefix, returns a set of leaf labels; otherwise `null` (leaf or “all”). */
  function buildTopicAllowedLeafSetFromTopicVal(topicVal) {
    if (!topicVal || topicVal.indexOf(NEWS_TOPIC_GROUP_VALUE_PREFIX) !== 0) return null;
    var gcat = topicVal.slice(NEWS_TOPIC_GROUP_VALUE_PREFIX.length);
    var labels = getAllowedLeafTopicsForNewsGroup(gcat);
    if (!labels) return Object.create(null);
    var set = Object.create(null);
    labels.forEach(function (lab) {
      set[lab] = true;
    });
    return set;
  }

  function itemMatchesTopicFilter(topicVal, item, allowedLeafSet) {
    if (!topicVal) return true;
    var t = getTopicFromItem(item);
    if (allowedLeafSet) return !!allowedLeafSet[t];
    return t === topicVal;
  }

  function itemMatchesSourceFilter(sourceVal, item) {
    if (!sourceVal) return true;
    return (item.sourceName || '') === sourceVal;
  }

  function itemMatchesNewsSearch(q, item) {
    if (!q) return true;
    return getNewsSearchBlob(item).indexOf(q) !== -1;
  }

  function renderNewsToc(orderedSourceNames) {
    if (!newsTocNav || !newsTocList) return;
    if (!orderedSourceNames || orderedSourceNames.length < 2) {
      newsTocNav.hidden = true;
      newsTocList.innerHTML = '';
      return;
    }
    newsTocNav.hidden = false;
    newsTocList.innerHTML = orderedSourceNames
      .map(function (name) {
        var id = newsSectionIdFromSource(name);
        return (
          '<li role="listitem"><a href="#' +
          escapeHtml(id) +
          '">' +
          escapeHtml(name) +
          '</a></li>'
        );
      })
      .join('');
  }

  function syncNewsSearchClearVisible() {
    var has = newsSearchInput && newsSearchInput.value.trim();
    if (newsSearchClear) newsSearchClear.classList.toggle('hidden', !has);
    var hasAside = newsSearchInputAside && newsSearchInputAside.value.trim();
    if (newsSearchClearAside) newsSearchClearAside.classList.toggle('hidden', !hasAside);
  }

  function copyNewsFilterSelectsMainToAside() {
    if (newsFilterSourceAside && newsFilterSource) {
      newsFilterSourceAside.innerHTML = newsFilterSource.innerHTML;
      newsFilterSourceAside.value = newsFilterSource.value;
    }
    if (newsFilterTopicAside && newsFilterTopic) {
      newsFilterTopicAside.innerHTML = newsFilterTopic.innerHTML;
      newsFilterTopicAside.value = newsFilterTopic.value;
    }
  }

  function syncAllAsideFromMain() {
    copyNewsFilterSelectsMainToAside();
    if (newsSearchInputAside && newsSearchInput) {
      newsSearchInputAside.value = newsSearchInput.value;
    }
    syncNewsSearchClearVisible();
  }

  function refreshNewsFilterDropdownsUi() {
    rebuildAllNewsFilterPanels();
    syncAllNewsFilterTriggersAndSelection();
  }

  function markNewsFilterOptionSelected(panelEl, selectValue) {
    if (!panelEl) return;
    var sel = selectValue === undefined || selectValue === null ? '' : String(selectValue);
    var buttons = panelEl.querySelectorAll('[data-news-filter-value]');
    for (var b = 0; b < buttons.length; b++) {
      var btn = buttons[b];
      var v = btn.getAttribute('data-news-filter-value');
      if (v === null || v === undefined) v = '';
      var match = String(v) === sel;
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
      btn.classList.toggle('news-filter-option--selected', match);
    }
  }

  /** Counts per source when topic + search match the current filter (source dimension ignored). */
  function computeNewsSourceCountsForFilterContext(items, topicVal, q) {
    var allowedLeafSet = buildTopicAllowedLeafSetFromTopicVal(topicVal);
    var perSource = Object.create(null);
    var allSourcesRow = 0;
    (items || []).forEach(function (item) {
      if (!itemMatchesTopicFilter(topicVal, item, allowedLeafSet)) return;
      if (!itemMatchesNewsSearch(q, item)) return;
      allSourcesRow++;
      var src = String(item.sourceName || 'Other').trim() || 'Other';
      perSource[src] = (perSource[src] || 0) + 1;
    });
    return { perSource: perSource, allSourcesRow: allSourcesRow };
  }

  /** Per–topic-tag counts when source + search match (topic dimension ignored). */
  function computeNewsTopicCountsForFilterContext(items, sourceVal, q) {
    var topicLeaf = Object.create(null);
    var allTopicsRow = 0;
    (items || []).forEach(function (item) {
      if (!itemMatchesSourceFilter(sourceVal, item)) return;
      if (!itemMatchesNewsSearch(q, item)) return;
      allTopicsRow++;
      var t = getTopicFromItem(item);
      topicLeaf[t] = (topicLeaf[t] || 0) + 1;
    });
    return { topicLeaf: topicLeaf, allTopicsRow: allTopicsRow };
  }

  function sumLeafTopicCounts(leafLabels, topicLeafCounts) {
    var n = 0;
    if (!leafLabels || !topicLeafCounts) return 0;
    for (var i = 0; i < leafLabels.length; i++) {
      n += topicLeafCounts[leafLabels[i]] || 0;
    }
    return n;
  }

  function makeNewsFilterOptionButton(opts) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.className = opts.className;
    var val = opts.value;
    if (val === undefined || val === null) val = '';
    btn.setAttribute('data-news-filter-value', val);
    var labelSpan = document.createElement('span');
    labelSpan.className = 'news-filter-option-label';
    labelSpan.textContent = opts.labelText;
    var countSpan = document.createElement('span');
    countSpan.className = 'news-filter-option-count';
    var c = typeof opts.count === 'number' ? opts.count : 0;
    countSpan.textContent = String(c);
    countSpan.setAttribute('aria-hidden', 'true');
    btn.appendChild(labelSpan);
    btn.appendChild(countSpan);
    btn.setAttribute(
      'aria-label',
      opts.labelText + ', ' + c + (c === 1 ? ' article' : ' articles')
    );
    return btn;
  }

  function getNewsFilterOptionLabel(btn) {
    if (!btn) return '';
    var span = btn.querySelector && btn.querySelector('.news-filter-option-label');
    return String((span && span.textContent) || btn.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function ensureNewsFilterPanelSearch(selectEl, panelEl) {
    if (!selectEl || !panelEl) return;
    // Panels are rebuilt often (panelEl.innerHTML=''), so we must check for the actual node,
    // not a sticky flag on the panel element.
    if (panelEl.querySelector && panelEl.querySelector('.news-filter-search-input')) return;

    var wrap = document.createElement('div');
    wrap.className = 'news-filter-search';
    var input = document.createElement('input');
    input.type = 'search';
    input.className = 'news-filter-search-input';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = /Topic/i.test(selectEl.id || '') ? 'Search topics…' : 'Search sources…';
    input.setAttribute('aria-label', input.placeholder.replace(/…$/, ''));
    wrap.appendChild(input);

    // Insert above all options.
    if (panelEl.firstChild) panelEl.insertBefore(wrap, panelEl.firstChild);
    else panelEl.appendChild(wrap);

    function applyFilter() {
      var q = String(input.value || '')
        .toLowerCase()
        .trim();
      var isTopic = /Topic/i.test(selectEl.id || '');

      if (!q) {
        // Reset: show everything.
        panelEl.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
          btn.hidden = false;
        });
        if (isTopic) {
          panelEl.querySelectorAll('.news-filter-topic-section').forEach(function (sec) {
            sec.hidden = false;
            sec.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
              btn.hidden = false;
            });
          });
        }
        return;
      }

      if (!isTopic) {
        panelEl.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
          var lab = getNewsFilterOptionLabel(btn);
          btn.hidden = lab.indexOf(q) === -1;
        });
        return;
      }

      // Topic panel: keep group wrappers readable while filtering.
      panelEl.querySelectorAll('.news-filter-topic-section').forEach(function (sec) {
        var head = sec.querySelector('.news-filter-option--group');
        var headLabel = getNewsFilterOptionLabel(head);
        var leafWrap = sec.querySelector('.news-filter-topic-leaves');
        var any = false;

        if (head && headLabel.indexOf(q) !== -1) {
          // If group title matches, show group + all leaves.
          sec.hidden = false;
          head.hidden = false;
          if (leafWrap) {
            leafWrap.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
              btn.hidden = false;
            });
          }
          return;
        }

        if (leafWrap) {
          leafWrap.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
            var lab = getNewsFilterOptionLabel(btn);
            var show = lab.indexOf(q) !== -1;
            btn.hidden = !show;
            if (show) any = true;
          });
        }

        // Show group header only when it has visible leaves.
        if (head) head.hidden = !any;
        sec.hidden = !any;
      });

      // Flat topic items (outside groups) + "All topics" row.
      panelEl.querySelectorAll('.news-filter-option--all, .news-filter-option--flat').forEach(function (btn) {
        var lab = getNewsFilterOptionLabel(btn);
        btn.hidden = lab.indexOf(q) === -1;
      });
    }

    input.addEventListener('input', applyFilter);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        applyFilter();
        e.stopPropagation();
        return;
      }
      if (e.key !== 'Enter') return;
      // Select first visible option (excluding the search field itself).
      var first = null;
      panelEl.querySelectorAll('[data-news-filter-value]').forEach(function (btn) {
        if (first) return;
        if (btn.hidden) return;
        first = btn;
      });
      if (first) {
        first.click();
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  function updateNewsFilterTriggerForSelect(selectEl, triggerEl) {
    if (!selectEl || !triggerEl) return;
    var span = triggerEl.querySelector('.news-filter-trigger-text');
    if (!span) return;
    var isTopic = /Topic/i.test(selectEl.id || '');
    var fmt = function (base, n) {
      var num = typeof n === 'number' ? n : 0;
      return base + ' (' + num + ')';
    };
    if (!isTopic) {
      var srcOpt = selectEl.options[selectEl.selectedIndex];
      var baseSrc = srcOpt ? String(srcOpt.textContent || '').trim() : 'All sources';
      var cntSrc =
        !srcOpt || !srcOpt.value
          ? lastNewsFilterCounts.allSourcesRow
          : lastNewsFilterCounts.source[srcOpt.value] || 0;
      span.textContent = fmt(baseSrc, cntSrc);
      return;
    }
    var opt = selectEl.options[selectEl.selectedIndex];
    if (!opt || !opt.value) {
      span.textContent = fmt('All topics', lastNewsFilterCounts.allTopicsRow);
      return;
    }
    var base = '';
    var cntTopic = 0;
    if (opt.value.indexOf(NEWS_TOPIC_GROUP_VALUE_PREFIX) === 0) {
      base = String(opt.textContent || '').trim();
      var gcat = opt.value.slice(NEWS_TOPIC_GROUP_VALUE_PREFIX.length);
      var glabels = getAllowedLeafTopicsForNewsGroup(gcat);
      cntTopic = sumLeafTopicCounts(glabels, lastNewsFilterCounts.topicLeaf);
    } else {
      base = String(opt.textContent || '')
        .replace(/^\s*[·•]\s*/, '')
        .trim();
      cntTopic = lastNewsFilterCounts.topicLeaf[opt.value] || 0;
    }
    span.textContent = fmt(base, cntTopic);
  }

  function buildSourceFilterPanel(selectEl, panelEl, sourceCountCtx) {
    if (!selectEl || !panelEl) return;
    if (!sourceCountCtx) {
      sourceCountCtx = computeNewsSourceCountsForFilterContext(
        lastNewsItems,
        newsFilterTopic ? newsFilterTopic.value : '',
        newsSearchInput ? newsSearchInput.value.trim().toLowerCase() : ''
      );
    }
    panelEl.innerHTML = '';
    ensureNewsFilterPanelSearch(selectEl, panelEl);
    var opts = selectEl.querySelectorAll('option');
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var cnt = o.value === '' ? sourceCountCtx.allSourcesRow : sourceCountCtx.perSource[o.value] || 0;
      // Hide 0-count rows to avoid a long list of irrelevant sources.
      // Always keep the active selection visible so users can change/clear it.
      if (o.value !== '' && cnt === 0 && selectEl.value !== o.value) continue;
      var btn = makeNewsFilterOptionButton({
        className: 'news-filter-option' + (o.value === '' ? ' news-filter-option--all' : ''),
        value: o.value,
        labelText: String(o.textContent || '').trim(),
        count: cnt
      });
      panelEl.appendChild(btn);
    }
    markNewsFilterOptionSelected(panelEl, selectEl.value);
  }

  function parseTopicSelectStructure(selectEl) {
    var opts = selectEl.querySelectorAll('option');
    var sections = [];
    var i = 1;
    while (i < opts.length) {
      var o = opts[i];
      var v = o.value;
      if (v.indexOf(NEWS_TOPIC_GROUP_VALUE_PREFIX) === 0) {
        var sec = { title: String(o.textContent || '').trim(), value: v, items: [] };
        i++;
        while (i < opts.length && opts[i].value.indexOf(NEWS_TOPIC_GROUP_VALUE_PREFIX) !== 0) {
          var leaf = opts[i];
          var leafLabel = String(leaf.textContent || '')
            .replace(/^\s*[·•]\s*/, '')
            .trim();
          sec.items.push({ value: leaf.value, label: leafLabel || String(leaf.textContent || '').trim() });
          i++;
        }
        sections.push({ type: 'group', data: sec });
      } else {
        sections.push({ type: 'item', value: o.value, label: String(o.textContent || '').trim() });
        i++;
      }
    }
    return sections;
  }

  function buildTopicFilterPanel(selectEl, panelEl, topicLeafCounts, allTopicsRowCount) {
    if (!selectEl || !panelEl) return;
    if (!topicLeafCounts || typeof allTopicsRowCount !== 'number') {
      var tctx = computeNewsTopicCountsForFilterContext(
        lastNewsItems,
        newsFilterSource ? newsFilterSource.value : '',
        newsSearchInput ? newsSearchInput.value.trim().toLowerCase() : ''
      );
      topicLeafCounts = tctx.topicLeaf;
      allTopicsRowCount = tctx.allTopicsRow;
    }
    panelEl.innerHTML = '';
    ensureNewsFilterPanelSearch(selectEl, panelEl);
    var allOpt = selectEl.querySelector('option[value=""]');
    var allBtn = makeNewsFilterOptionButton({
      className: 'news-filter-option news-filter-option--all',
      value: '',
      labelText: allOpt ? String(allOpt.textContent || '').trim() : 'All topics',
      count: allTopicsRowCount
    });
    panelEl.appendChild(allBtn);

    var sections = parseTopicSelectStructure(selectEl);
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      if (sec.type === 'group') {
        var wrap = document.createElement('div');
        wrap.className = 'news-filter-topic-section';
        var leafVals = sec.data.items.map(function (it) {
          return it.value;
        });
        var groupCnt = sumLeafTopicCounts(leafVals, topicLeafCounts);
        var activeVal = selectEl.value;
        var activeIsGroup = activeVal && activeVal.indexOf(NEWS_TOPIC_GROUP_VALUE_PREFIX) === 0;
        var activeInThisGroup =
          activeIsGroup && activeVal === sec.data.value
            ? true
            : sec.data.items.some(function (it) {
                return it.value === activeVal;
              });
        // Drop whole groups that have no matching items in the current context.
        // Keep active group/leaf visible even if count hits 0 (e.g. when combined with search).
        if (groupCnt === 0 && !activeInThisGroup) continue;
        var head = makeNewsFilterOptionButton({
          className: 'news-filter-option news-filter-option--group',
          value: sec.data.value,
          labelText: sec.data.title,
          count: groupCnt
        });
        wrap.appendChild(head);
        var leaves = document.createElement('div');
        leaves.className = 'news-filter-topic-leaves';
        for (var j = 0; j < sec.data.items.length; j++) {
          var it = sec.data.items[j];
          var leafCnt = topicLeafCounts[it.value] || 0;
          if (leafCnt === 0 && activeVal !== it.value) continue;
          var leafBtn = makeNewsFilterOptionButton({
            className: 'news-filter-option news-filter-option--leaf',
            value: it.value,
            labelText: it.label,
            count: leafCnt
          });
          leaves.appendChild(leafBtn);
        }
        // If all leaves were filtered out (only possible when active group kept, but no leaves match),
        // keep the group header only.
        if (!leaves.childNodes || leaves.childNodes.length === 0) {
          // still show wrap with header
        } else {
          wrap.appendChild(leaves);
        }
        panelEl.appendChild(wrap);
      } else {
        var flatCnt = topicLeafCounts[sec.value] || 0;
        if (flatCnt === 0 && selectEl.value !== sec.value) continue;
        var flatBtn = makeNewsFilterOptionButton({
          className: 'news-filter-option news-filter-option--flat',
          value: sec.value,
          labelText: sec.label,
          count: flatCnt
        });
        panelEl.appendChild(flatBtn);
      }
    }
    markNewsFilterOptionSelected(panelEl, selectEl.value);
  }

  function rebuildAllNewsFilterPanels() {
    var items = Array.isArray(lastNewsItems) ? lastNewsItems : [];
    var topicVal = newsFilterTopic ? newsFilterTopic.value : '';
    var sourceVal = newsFilterSource ? newsFilterSource.value : '';
    var q = newsSearchInput ? newsSearchInput.value.trim().toLowerCase() : '';
    var srcAgg = computeNewsSourceCountsForFilterContext(items, topicVal, q);
    var topicAgg = computeNewsTopicCountsForFilterContext(items, sourceVal, q);
    lastNewsFilterCounts = {
      source: srcAgg.perSource,
      topicLeaf: topicAgg.topicLeaf,
      allSourcesRow: srcAgg.allSourcesRow,
      allTopicsRow: topicAgg.allTopicsRow,
      total: items.length
    };
    var pairs = [
      [newsFilterSource, document.getElementById('newsFilterSourcePanel')],
      [newsFilterTopic, document.getElementById('newsFilterTopicPanel')],
      [newsFilterSourceAside, document.getElementById('newsFilterSourceAsidePanel')],
      [newsFilterTopicAside, document.getElementById('newsFilterTopicAsidePanel')]
    ];
    for (var p = 0; p < pairs.length; p++) {
      var sel = pairs[p][0];
      var pan = pairs[p][1];
      if (!sel || !pan) continue;
      if (/Topic/i.test(sel.id || '')) {
        buildTopicFilterPanel(sel, pan, topicAgg.topicLeaf, topicAgg.allTopicsRow);
      } else {
        buildSourceFilterPanel(sel, pan, srcAgg);
      }
    }
  }

  function syncAllNewsFilterTriggersAndSelection() {
    var m = [
      [newsFilterSource, document.getElementById('newsFilterSourceTrigger'), document.getElementById('newsFilterSourcePanel')],
      [newsFilterTopic, document.getElementById('newsFilterTopicTrigger'), document.getElementById('newsFilterTopicPanel')],
      [newsFilterSourceAside, document.getElementById('newsFilterSourceAsideTrigger'), document.getElementById('newsFilterSourceAsidePanel')],
      [newsFilterTopicAside, document.getElementById('newsFilterTopicAsideTrigger'), document.getElementById('newsFilterTopicAsidePanel')]
    ];
    for (var i = 0; i < m.length; i++) {
      var sel = m[i][0];
      var trig = m[i][1];
      var pan = m[i][2];
      if (!sel || !trig) continue;
      updateNewsFilterTriggerForSelect(sel, trig);
      if (pan) markNewsFilterOptionSelected(pan, sel.value);
    }
  }

  function closeAllNewsFilterDropdowns() {
    document.querySelectorAll('.news-filter-dropdown').forEach(function (dd) {
      dd.classList.remove('news-filter-dropdown--open');
    });
    document.querySelectorAll('.news-filter-dropdown .news-filter-trigger').forEach(function (t) {
      if (t.getAttribute('aria-expanded') !== 'true') return;
      t.setAttribute('aria-expanded', 'false');
      var id = t.getAttribute('aria-controls');
      if (id) {
        var p = document.getElementById(id);
        if (p) p.hidden = true;
      }
    });
  }

  var newsFilterDropdownUiBound = false;
  function initNewsFilterDropdownUiOnce() {
    if (newsFilterDropdownUiBound) return;
    newsFilterDropdownUiBound = true;
    document.addEventListener(
      'mousedown',
      function (e) {
        if (e.target.closest && e.target.closest('.news-filter-dropdown')) return;
        closeAllNewsFilterDropdowns();
      },
      true
    );
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllNewsFilterDropdowns();
    });
    document.querySelectorAll('.news-filter-dropdown').forEach(function (dd) {
      var trigger = dd.querySelector('.news-filter-trigger');
      var panel = dd.querySelector('.news-filter-panel');
      var select = dd.querySelector('select');
      if (!trigger || !panel || !select) return;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = trigger.getAttribute('aria-expanded') === 'true';
        closeAllNewsFilterDropdowns();
        if (!wasOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
          dd.classList.add('news-filter-dropdown--open');
          // Focus the in-panel search field when available.
          var search = panel.querySelector && panel.querySelector('.news-filter-search-input');
          if (search && typeof search.focus === 'function') {
            try {
              search.focus({ preventScroll: true });
            } catch (err) {
              search.focus();
            }
          }
        }
      });
      panel.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-news-filter-value]');
        if (!btn || !panel.contains(btn)) return;
        e.preventDefault();
        e.stopPropagation();
        var val = btn.getAttribute('data-news-filter-value');
        if (val === null || val === undefined) val = '';
        if (select.value !== val) select.value = val;
        closeAllNewsFilterDropdowns();
        if (/Aside$/i.test(select.id || '')) syncMainFromAsideAndApply();
        else applyNewsFilters();
      });
    });
  }

  function isNewsSidebarDockAllowed() {
    return typeof window.matchMedia !== 'undefined' && window.matchMedia('(min-width: 1100px)').matches;
  }

  function setNewsSidebarFiltersDockVisible(show) {
    var body = document.querySelector('.news-body');
    var layout = document.querySelector('.news-layout');
    if (!newsSidebarFilters || !body || !layout) return;
    if (!isNewsSidebarDockAllowed()) {
      newsSidebarFilters.hidden = true;
      newsSidebarFilters.setAttribute('aria-hidden', 'true');
      body.classList.remove('news-body--sidebar-filters-visible');
      layout.classList.remove('news-layout--sidebar-filters-active');
      return;
    }
    if (show) {
      newsSidebarFilters.removeAttribute('hidden');
      newsSidebarFilters.setAttribute('aria-hidden', 'false');
      syncAllAsideFromMain();
      refreshNewsFilterDropdownsUi();
      initNewsSidebarExpandableToolbarOnce();
      applyNewsSidebarCollapsedPreference();
      updateNewsSidebarToolbarChrome();
      body.classList.add('news-body--sidebar-filters-visible');
      layout.classList.add('news-layout--sidebar-filters-active');
    } else {
      newsSidebarFilters.hidden = true;
      newsSidebarFilters.setAttribute('aria-hidden', 'true');
      body.classList.remove('news-body--sidebar-filters-visible');
      layout.classList.remove('news-layout--sidebar-filters-active');
    }
  }

  function teardownNewsToolbarDock() {
    if (newsToolbarDockObserver) {
      newsToolbarDockObserver.disconnect();
      newsToolbarDockObserver = null;
    }
    setNewsSidebarFiltersDockVisible(false);
  }

  function applyNewsSidebarCollapsedPreference() {
    if (!newsSidebarFiltersCard || !newsSidebarFiltersToggle) return;
    var collapsed = false;
    try {
      collapsed = sessionStorage.getItem('gdpr_news_sidebar_collapsed') === '1';
    } catch (err) {
      collapsed = false;
    }
    newsSidebarFiltersCard.classList.toggle('news-sidebar-filters-card--collapsed', collapsed);
    newsSidebarFiltersToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function updateNewsSidebarToolbarChrome() {
    var badge = newsSidebarFiltersBadge || document.getElementById('newsSidebarFiltersBadge');
    var toggleBtn = newsSidebarFiltersToggle || document.getElementById('newsSidebarFiltersToggle');
    var n = 0;
    if (newsSearchInput && newsSearchInput.value.trim()) n += 1;
    if (newsFilterSource && newsFilterSource.value) n += 1;
    if (newsFilterTopic && newsFilterTopic.value) n += 1;
    if (badge) {
      badge.textContent = String(n);
      badge.classList.toggle('hidden', n === 0);
    }
    if (toggleBtn) {
      var label =
        n > 0
          ? 'Quick filters — ' + n + ' active. Click to expand or collapse.'
          : 'Quick filters. Click to expand or collapse the filter panel.';
      toggleBtn.setAttribute('aria-label', label);
    }
  }

  function initNewsSidebarExpandableToolbarOnce() {
    var toggle = newsSidebarFiltersToggle || document.getElementById('newsSidebarFiltersToggle');
    var card = newsSidebarFiltersCard || document.getElementById('newsSidebarFiltersCard');
    if (!toggle || !card || toggle.getAttribute('data-expandable-bound') === '1') return;
    toggle.setAttribute('data-expandable-bound', '1');
    toggle.addEventListener('click', function () {
      var nowCollapsed = card.classList.toggle('news-sidebar-filters-card--collapsed');
      toggle.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
      try {
        if (nowCollapsed) sessionStorage.setItem('gdpr_news_sidebar_collapsed', '1');
        else sessionStorage.removeItem('gdpr_news_sidebar_collapsed');
      } catch (err) {}
      updateNewsSidebarToolbarChrome();
    });
  }

  function initNewsToolbarDockObserver() {
    var main = document.querySelector('.main');
    if (!newsControlsPanel || !main || typeof IntersectionObserver === 'undefined') return;
    teardownNewsToolbarDock();
    newsToolbarDockObserver = new IntersectionObserver(
      function (entries) {
        var vis = viewNews && viewNews.classList.contains('active') && !viewNews.hasAttribute('hidden');
        if (!vis) {
          setNewsSidebarFiltersDockVisible(false);
          return;
        }
        var e = entries[0];
        var toolbarOff = e && !e.isIntersecting;
        setNewsSidebarFiltersDockVisible(!!toolbarOff && isNewsSidebarDockAllowed());
      },
      { root: main, rootMargin: '0px 0px -8px 0px', threshold: 0 }
    );
    newsToolbarDockObserver.observe(newsControlsPanel);
  }

  function updateNewsResultStatus(displayedCount, loadedCount, queryTrimmed) {
    var loaded = typeof loadedCount === 'number' ? loadedCount : 0;
    var shown = typeof displayedCount === 'number' ? displayedCount : 0;
    var q = queryTrimmed || '';
    var msg = '';
    if (loaded === 0 && shown === 0) {
      msg = '';
    } else if (shown === 0 && loaded > 0) {
      var regNews = getRegProfile().newsUi || {};
      var jx = regulationJurisdiction(getRegProfile());
      var refreshHint =
        jx === 'id'
          ? 'Tap Refresh news to pull Indonesian official/state-agency feeds, or clear topic/source filters.'
          : jx === 'us'
            ? 'Tap Refresh news to pull U.S. official feeds (FTC, CPPA/CalPrivacy, California OAG, Colorado AG, data.gov), or clear topic/source filters.'
            : 'Tap Refresh news, or clear topic/source filters.';
      msg = regNews.filterForRegulation
        ? 'No headlines match the ' +
          (getRegProfile().shortName || 'regulation') +
          ' relevance filter yet. ' +
          refreshHint
        : 'No articles match your filters or search. Try clearing all or using different keywords.';
    } else {
      var head = q
        ? 'Showing ' + shown + (shown === 1 ? ' article' : ' articles') + ' matching your search'
        : 'Showing ' + shown + (shown === 1 ? ' article' : ' articles');
      msg = loaded !== shown ? head + ' (' + loaded + ' loaded in total).' : head + '.';
    }
    if (newsResultStatus) newsResultStatus.textContent = msg;
    if (newsResultStatusAside) newsResultStatusAside.textContent = msg;
  }

  function setNewsRefreshBusy(busy) {
    if (!btnRefreshNews) return;
    btnRefreshNews.disabled = !!busy;
    btnRefreshNews.setAttribute('aria-busy', busy ? 'true' : 'false');
    btnRefreshNews.classList.toggle('is-loading', !!busy);
  }

  function renderNewsSections(items) {
    if (!newsSections) return;
    newsSections.innerHTML = '';
    if (!items || items.length === 0) {
      newsSections.innerHTML = buildNewsEmptyPanelHtml({
        title: 'No matching articles',
        text: 'Nothing matches the current filters or search. Clear all filters, or try different keywords.',
        clear: true
      });
      return;
    }
    var bySource = {};
    items.forEach(function (item) {
      var src = item.sourceName || 'Other';
      if (!bySource[src]) bySource[src] = [];
      bySource[src].push(item);
    });
    var ordered = getOrderedSourcesFromItems(items);
    ordered.forEach(function (sourceName) {
      var sourceItems = bySource[sourceName];
      sourceItems.sort(function (a, b) {
        return newsItemSortTime(b) - newsItemSortTime(a);
      });
      var summary = SOURCE_SUMMARIES[sourceName] || 'Updates and publications from this source. Each link goes to the original article.';
      var sectionId = newsSectionIdFromSource(sourceName);
      var firstItem = sourceItems[0];
      var sourceUrl = firstItem && firstItem.sourceUrl ? firstItem.sourceUrl : '#';
      var titleId = sectionId + '-title';
      var panelId = sectionId + '-panel';

      var wrap = document.createElement('section');
      wrap.className = 'news-by-source-wrap';
      wrap.id = sectionId;
      wrap.setAttribute('aria-labelledby', titleId);

      var details = document.createElement('details');
      details.className = 'news-by-source';
      details.open = true;

      var summaryEl = document.createElement('summary');
      summaryEl.className = 'news-source-details-summary';
      summaryEl.id = titleId;
      summaryEl.setAttribute('aria-controls', panelId);
      summaryEl.innerHTML =
        '<span class="news-source-details-summary-row">' +
        '<span class="news-source-chevron" aria-hidden="true"></span>' +
        '<span class="news-source-name-text">' +
        escapeHtml(sourceName) +
        '</span>' +
        '<span class="news-source-article-count">' +
        escapeHtml(String(sourceItems.length)) +
        '</span></span>';

      var body = document.createElement('div');
      body.className = 'news-source-details-body';
      body.id = panelId;

      var pDesc = document.createElement('p');
      pDesc.className = 'news-source-summary';
      pDesc.textContent = summary;
      body.appendChild(pDesc);

      if (sourceUrl && sourceUrl !== '#') {
        var pHub = document.createElement('p');
        pHub.className = 'news-source-hub-line';
        var aHub = document.createElement('a');
        aHub.className = 'news-source-hub-link';
        aHub.href = sourceUrl;
        aHub.target = '_blank';
        aHub.rel = 'noopener noreferrer';
        aHub.textContent = 'Open regulator news hub';
        pHub.appendChild(aHub);
        body.appendChild(pHub);
      }

      var ul = document.createElement('ul');
      ul.className = 'news-list news-list-in-section';
      ul.setAttribute('role', 'list');
      sourceItems.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'news-card';
        li.setAttribute('role', 'listitem');
        var summaryHtml = buildNewsCardSummaryHtml(item);
        if (!summaryHtml) li.classList.add('news-card--no-summary');
        li.innerHTML = buildNewsCardMarkupHtml(item, 'h5');
        ul.appendChild(li);
      });
      body.appendChild(ul);

      details.appendChild(summaryEl);
      details.appendChild(body);
      wrap.appendChild(details);
      newsSections.appendChild(wrap);
    });
  }

  function renderNewsAllCards(items) {
    if (!newsSections) return;
    newsSections.innerHTML = '';
    if (!items || items.length === 0) {
      newsSections.innerHTML = buildNewsEmptyPanelHtml({
        title: 'No matching articles',
        text: 'Nothing matches the current filters or search. Clear all filters, or try different keywords.',
        clear: true
      });
      return;
    }
    var copy = items.slice();
    copy.sort(function (a, b) {
      return newsItemSortTime(b) - newsItemSortTime(a);
    });

    var wrap = document.createElement('section');
    wrap.className = 'news-all-feed';
    wrap.id = 'news-all';
    wrap.setAttribute('aria-labelledby', 'news-all-title');

    var meta = document.createElement('div');
    meta.className = 'news-all-feed-meta';
    meta.innerHTML =
      '<h4 class="news-all-feed-title" id="news-all-title">All sources</h4>' +
      '<span class="news-all-feed-count">' +
      escapeHtml(String(copy.length)) +
      '</span>';
    wrap.appendChild(meta);

    var ul = document.createElement('ul');
    ul.className = 'news-list news-list-in-section';
    ul.setAttribute('role', 'list');
    copy.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'news-card';
      li.setAttribute('role', 'listitem');
      var summaryHtml = buildNewsCardSummaryHtml(item);
      if (!summaryHtml) li.classList.add('news-card--no-summary');
      li.innerHTML = buildNewsCardMarkupHtml(item, 'h5');
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    newsSections.appendChild(wrap);
  }

  function getAllowedLeafTopicsForNewsGroup(category) {
    if (!lastNewsTopicTaxonomy || !lastNewsTopicTaxonomy.groups) return null;
    var cat = String(category || '').trim();
    for (var gi = 0; gi < lastNewsTopicTaxonomy.groups.length; gi++) {
      var g = lastNewsTopicTaxonomy.groups[gi];
      if (String(g.category || '').trim() !== cat) continue;
      var out = [];
      (g.topics || []).forEach(function (t) {
        var lab = String((t && t.label) || '').trim();
        if (lab) out.push(lab);
      });
      return out;
    }
    return null;
  }

  function applyNewsFilters() {
    var sourceVal = newsFilterSource ? newsFilterSource.value : '';
    var topicVal = newsFilterTopic ? newsFilterTopic.value : '';
    var q = newsSearchInput ? newsSearchInput.value.trim().toLowerCase() : '';
    var items = Array.isArray(lastNewsItems) ? lastNewsItems : [];
    var scoped = items.filter(itemMatchesNewsRegulationScope);
    populateNewsFilters(scoped);
    renderNewsFeedsList(lastNewsFeedsAll);
    var allowedLeafSet = buildTopicAllowedLeafSetFromTopicVal(topicVal);
    var filtered = scoped.filter(function (item) {
      if (!itemMatchesSourceFilter(sourceVal, item)) return false;
      if (!itemMatchesTopicFilter(topicVal, item, allowedLeafSet)) return false;
      if (!itemMatchesNewsSearch(q, item)) return false;
      return true;
    });
    syncNewsViewToggleUi();
    if (newsViewMode === 'all') {
      renderNewsAllCards(filtered);
      renderNewsToc([]);
    } else {
      renderNewsSections(filtered);
      renderNewsToc(getOrderedSourcesFromItems(filtered));
    }
    updateNewsResultStatus(filtered.length, items.length, q);
    updateNewsHeroStats(filtered.length, items.length);
    syncNewsSearchClearVisible();
    syncAllAsideFromMain();
    refreshNewsFilterDropdownsUi();
    updateNewsSidebarToolbarChrome();
  }

  function newsFeedIsIndonesian(feed) {
    var blob =
      String((feed && feed.name) || '') +
      ' ' +
      String((feed && feed.url) || '') +
      ' ' +
      String((feed && feed.description) || '');
    return /komdigi|setkab|data\.go\.id|antara|jdih|indonesia/i.test(blob);
  }

  function newsFeedIsUnitedStates(feed) {
    var blob =
      String((feed && feed.name) || '') +
      ' ' +
      String((feed && feed.url) || '') +
      ' ' +
      String((feed && feed.description) || '');
    return /ftc\.gov|\bcppa\b|cppa\.ca\.gov|calprivacy|coag\.gov|\bcolorado ag\b|colorado attorney general|federal trade commission|california privacy protection|oag\.ca\.gov|california oag|california attorney general|data\.gov|gsa\.gov|federal data strategy|resources\.data\.gov/i.test(
      blob
    );
  }

  function newsFeedIsInternational(feed) {
    var blob =
      String((feed && feed.name) || '') +
      ' ' +
      String((feed && feed.url) || '') +
      ' ' +
      String((feed && feed.description) || '');
    return /iso\.org|\biso\b|aicpa-cima\.com|\baicpa\b|trust services criteria|soc for service organizations/i.test(blob);
  }

  function newsFeedsForCurrentScope(feeds) {
    var list = Array.isArray(feeds) ? feeds : [];
    var id = (getRegProfile() && getRegProfile().id) || 'gdpr';
    if (currentRegion === 'id' || String(id).indexOf('id-') === 0) {
      return list.filter(newsFeedIsIndonesian);
    }
    if (currentRegion === 'us' || String(id).indexOf('us-') === 0) {
      return list.filter(newsFeedIsUnitedStates);
    }
    if (currentRegion === 'intl' || String(id).indexOf('iso-') === 0 || id === 'soc2') {
      return list.filter(newsFeedIsInternational);
    }
    if (currentRegion === 'eu' || id === 'ai-act' || id === 'data-act') {
      return list.filter(function (f) {
        return !newsFeedIsIndonesian(f) && !newsFeedIsUnitedStates(f) && !newsFeedIsInternational(f);
      });
    }
    return list;
  }

  function newsTaxonomyGroupsForCurrentRegulation() {
    var groups = (lastNewsTopicTaxonomy && lastNewsTopicTaxonomy.groups) || [];
    var id = (getRegProfile() && getRegProfile().id) || 'gdpr';
    var allow = null;
    if (id === 'id-pdp') {
      allow = {
        'Indonesia Personal Data Protection': 1,
        'Core Rights': 1,
        'Data Transfers': 1,
        'Enforcement and Compliance': 1,
        General: 1
      };
    } else if (id === 'id-satu-data') {
      allow = { 'Indonesia Satu Data': 1, General: 1 };
    } else if (id === 'id-ai-ethics') {
      allow = { 'Indonesia AI Ethics': 1, 'AI and Emerging Tech': 1, General: 1 };
    } else if (id === 'ai-act') {
      allow = { 'EU Artificial Intelligence Act': 1, 'AI and Emerging Tech': 1, General: 1 };
    } else if (id === 'data-act') {
      allow = { 'EU Data Act': 1, General: 1 };
    } else if (id === 'us-ccpa') {
      allow = {
        'United States CCPA': 1,
        'Core Rights': 1,
        'Enforcement and Compliance': 1,
        General: 1
      };
    } else if (id === 'us-open-data') {
      allow = { 'United States OPEN Data': 1, General: 1 };
    } else if (id === 'us-admt') {
      allow = { 'United States ADMT': 1, 'AI and Emerging Tech': 1, General: 1 };
    } else if (id === 'iso-27701') {
      allow = { 'International ISO 27701': 1, General: 1 };
    } else if (id === 'iso-19941') {
      allow = { 'International ISO 19941': 1, General: 1 };
    } else if (id === 'iso-23894') {
      allow = { 'International ISO 23894': 1, 'AI and Emerging Tech': 1, General: 1 };
    } else if (id === 'soc2') {
      allow = { 'International SOC 2': 1, General: 1 };
    }
    if (!allow) return groups;
    return groups.filter(function (g) {
      return allow[String(g.category || '').trim()];
    });
  }

  function populateNewsFilters(items) {
    items = Array.isArray(items) ? items : [];
    var sources = [];
    var topicsSet = {};
    items.forEach(function (item) {
      var src = item.sourceName || 'Other';
      if (sources.indexOf(src) === -1) sources.push(src);
      var t = getTopicFromItem(item);
      topicsSet[t] = true;
    });
    sources.sort(function (a, b) {
      var ia = NEWS_SOURCE_DISPLAY_ORDER.indexOf(a);
      var ib = NEWS_SOURCE_DISPLAY_ORDER.indexOf(b);
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
      if (lastNewsTopicTaxonomy && lastNewsTopicTaxonomy.groups && lastNewsTopicTaxonomy.groups.length) {
        /** No `<optgroup>`: native group labels are not selectable, which duplicated “Core Rights” + “All in…”. Flat list: category row selects all leaves; leaves are indented for hierarchy. */
        var leafIndent = '    \u00B7 ';
        newsTaxonomyGroupsForCurrentRegulation().forEach(function (g) {
          var cat = String(g.category || '').trim() || 'Topics';
          var leafRows = [];
          (g.topics || []).forEach(function (t) {
            var lab = String((t && t.label) || '').trim();
            if (!lab) return;
            leafRows.push(lab);
          });
          if (leafRows.length === 0) return;
          if (leafRows.length > 1) {
            var optGroup = document.createElement('option');
            optGroup.value = NEWS_TOPIC_GROUP_VALUE_PREFIX + cat;
            optGroup.textContent = cat;
            if (optGroup.value === selTopic) optGroup.selected = true;
            newsFilterTopic.appendChild(optGroup);
          }
          leafRows.forEach(function (lab) {
            var opt = document.createElement('option');
            opt.value = lab;
            opt.textContent = leafRows.length > 1 ? leafIndent + lab : lab;
            if (lab === selTopic) opt.selected = true;
            newsFilterTopic.appendChild(opt);
          });
        });
      } else {
        var topicsArr = Object.keys(topicsSet).sort(function (a, b) {
          if (a === NEWS_TOPIC_FALLBACK) return 1;
          if (b === NEWS_TOPIC_FALLBACK) return -1;
          return a.localeCompare(b);
        });
        topicsArr.forEach(function (t) {
          var opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          if (t === selTopic) opt.selected = true;
          newsFilterTopic.appendChild(opt);
        });
      }
    }
    syncAllAsideFromMain();
  }

  function getTopicFromItem(item) {
    if (item && item.topic) return String(item.topic).trim();
    return NEWS_TOPIC_FALLBACK;
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

  /**
   * Feeds often repeat the headline and CMS bylines (e.g. EDPS: title + author + duplicate datelines)
   * before the real lead. Strip that noise so the card shows one readable summary line.
   */
  function tidyNewsSnippetForCard(snippet, title) {
    var s = String(snippet || '').trim().replace(/\s+/g, ' ');
    var tit = String(title || '').trim();
    if (tit.length >= 12) {
      var low = s.toLowerCase();
      var tlow = tit.toLowerCase().replace(/\s+/g, ' ');
      if (low.indexOf(tlow) === 0) {
        s = s.slice(tit.length).trim();
        s = s.replace(/^[\s:–\-—.|]+/, '').trim();
      }
    }
    var reLine =
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,\s*\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}:\d{2}\s*/i;
    var guard = 0;
    while (reLine.test(s) && guard < 4) {
      s = s.replace(reLine, '').trim();
      guard += 1;
    }
    s = s.replace(/^\s*\b[A-Za-z][\w.-]{0,40}\b\s+(?=Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i, '').trim();
    return s;
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
    var sn = tidyNewsSnippetForCard(String(item.snippet || '').trim().replace(/\s+/g, ' '), item.title);
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

  function closeNewsAttachmentsDialog() {
    if (!newsAttachmentsDialog) return;
    if (typeof newsAttachmentsDialog.close === 'function') {
      newsAttachmentsDialog.close();
    } else {
      newsAttachmentsDialog.removeAttribute('open');
    }
  }

  function openNewsAttachmentsReview(articleUrl, articleTitle) {
    if (!newsAttachmentsDialog || !newsAttachmentsDialogBody) return;
    if (!articleUrl || articleUrl === '#') return;
    if (typeof newsAttachmentsDialog.showModal === 'function') {
      newsAttachmentsDialog.showModal();
    } else {
      newsAttachmentsDialog.setAttribute('open', '');
    }
    if (newsAttachmentsDialogArticle) {
      newsAttachmentsDialogArticle.textContent = articleTitle || articleUrl;
    }
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      newsAttachmentsDialogBody.innerHTML =
        '<p class="news-attachments-error">Attachments need an HTTP server. From the project folder run <code>npm start</code> and open <code>http://localhost:3847</code> (do not open <code>index.html</code> as a file).</p>';
      return;
    }
    newsAttachmentsDialogBody.innerHTML = '<p class="news-attachments-loading">Loading attachments…</p>';
    fetchArticleAttachments(articleUrl)
      .then(function (data) {
        if (!data.attachments || data.attachments.length === 0) {
          newsAttachmentsDialogBody.innerHTML =
            '<p class="news-attachments-empty">No PDF or Office files were linked from this page — many press items are web-only.</p>' +
            '<p class="news-attachments-empty-actions"><a class="btn btn-primary btn-sm" href="' +
            escapeHtml(articleUrl) +
            '" target="_blank" rel="noopener noreferrer">Open full article</a></p>';
          if (newsAttachmentsSummaryReady && articleUrl && articleUrl !== '#') {
            newsAttachmentCountsByUrl[articleUrl] = 0;
            applyNewsFilters();
          }
          return;
        }
        var ul = document.createElement('ul');
        ul.className = 'news-attachments-list';
        ul.setAttribute('role', 'list');
        data.attachments.forEach(function (att) {
          var li = document.createElement('li');
          li.className = 'news-attachments-item';
          li.setAttribute('role', 'listitem');
          var kind = String(att.kind || 'file').toUpperCase();
          var safeUrl = String(att.url || '');
          var safeLabel = String(att.label || safeUrl);
          li.innerHTML =
            '<span class="news-attachments-kind">' +
            escapeHtml(kind) +
            '</span>' +
            '<span class="news-attachments-label">' +
            escapeHtml(safeLabel) +
            '</span>' +
            '<a class="btn btn-secondary btn-sm news-attachments-open" href="' +
            escapeHtml(safeUrl) +
            '" target="_blank" rel="noopener noreferrer">Open</a>';
          ul.appendChild(li);
        });
        newsAttachmentsDialogBody.innerHTML = '';
        newsAttachmentsDialogBody.appendChild(ul);
      })
      .catch(function (err) {
        newsAttachmentsDialogBody.innerHTML =
          '<p class="news-attachments-error">' + escapeHtml(String(err.message || err)) + '</p>';
      });
  }

  function dedupeNewsItemsClient(raw) {
    var arr = Array.isArray(raw) ? raw : [];
    var g = typeof window !== 'undefined' && window.GDPR_NEWS_DEDUPE;
    if (g && typeof g.dedupeNewsItemsConsolidated === 'function') {
      return g.dedupeNewsItemsConsolidated(arr);
    }
    return arr.slice();
  }

  function renderNewsFeedsList(feeds) {
    if (!newsFeedsList) return;
    var scoped = newsFeedsForCurrentScope(feeds);
    newsFeedsList.innerHTML = '';
    scoped.forEach(function (feed) {
      var li = document.createElement('li');
      li.innerHTML =
        '<a href="' +
        escapeHtml(feed.url || '') +
        '" target="_blank" rel="noopener">' +
        escapeHtml(feed.name || '') +
        '</a>' +
        (feed.description ? ' <span class="news-feed-desc">' + escapeHtml(feed.description) + '</span>' : '');
      newsFeedsList.appendChild(li);
    });
    if (scoped.length === 0) {
      newsFeedsList.innerHTML = '<li class="news-empty">No news feeds configured for this region.</li>';
    }
  }

  function renderNewsPayload(data) {
    lastNewsTopicTaxonomy = data.topicTaxonomy || null;
    lastNewsFeedsAll = data.newsFeeds || [];
    const items = dedupeNewsItemsClient(data.items || []);
    renderNewsFeedsList(lastNewsFeedsAll);
    if (newsSections) {
      newsSections.innerHTML = '';
      if (items.length === 0) {
        lastNewsItems = [];
        scheduleNewsAttachmentsSummaryForItems([]);
        if (newsTocNav) {
          newsTocNav.hidden = true;
          if (newsTocList) newsTocList.innerHTML = '';
        }
        if (newsResultStatus) newsResultStatus.textContent = '';
        if (newsResultStatusAside) newsResultStatusAside.textContent = '';
        if (newsSearchInput) newsSearchInput.value = '';
        if (newsSearchInputAside) newsSearchInputAside.value = '';
        syncNewsSearchClearVisible();
        teardownNewsToolbarDock();
        newsSections.innerHTML = buildNewsEmptyPanelHtml({
          title: 'No news items yet',
          text:
            'Use the official feed links, or refresh to pull EU, Indonesian, and United States official/state-agency headlines.',
          refresh: true
        });
        populateNewsFilters([]);
        refreshNewsFilterDropdownsUi();
        updateNewsHeroStats(0, 0);
      } else {
        lastNewsItems = items;
        populateNewsFilters(items);
        applyNewsFilters();
        scheduleNewsAttachmentsSummaryForItems(items);
        initNewsToolbarDockObserver();
      }
    }
    applyNewsFeedsSectionCollapsedPreference();
  }

  function loadNews() {
    if (!newsFeedsList) return;
    teardownNewsToolbarDock();
    setNewsRefreshBusy(true);
    if (newsSections) newsSections.innerHTML = '';
    if (newsResultStatus) newsResultStatus.textContent = 'Loading…';
    if (newsTocNav) {
      newsTocNav.hidden = true;
      if (newsTocList) newsTocList.innerHTML = '';
    }
    newsFeedsList.innerHTML = '<li class="news-empty">Loading news…</li>';
    if (newsSections) {
      newsSections.innerHTML = buildNewsEmptyPanelHtml({
        title: 'Loading news',
        text: 'Fetching the latest headlines from configured sources…'
      });
    }
    get('/api/news')
      .then(function (data) {
        setNewsRefreshBusy(false);
        renderNewsPayload(data);
      })
      .catch(function () {
        setNewsRefreshBusy(false);
        teardownNewsToolbarDock();
        if (newsResultStatus) newsResultStatus.textContent = '';
        newsFeedsList.innerHTML = '<li class="news-empty">Could not load news.</li>';
        if (newsSections) {
          newsSections.innerHTML = buildNewsEmptyPanelHtml({
            title: 'Could not load news',
            text: 'Make sure the server is running, then try refreshing feeds.',
            refresh: true
          });
        }
      });
  }

  function refreshNewsFromAllSources() {
    if (!newsFeedsList) return;
    teardownNewsToolbarDock();
    setNewsRefreshBusy(true);
    if (newsSections) newsSections.innerHTML = '';
    if (newsResultStatus) newsResultStatus.textContent = 'Refreshing feeds…';
    if (newsTocNav) {
      newsTocNav.hidden = true;
      if (newsTocList) newsTocList.innerHTML = '';
    }
    newsFeedsList.innerHTML = '<li class="news-empty">Refreshing all sources…</li>';
    if (newsSections) {
      newsSections.innerHTML = buildNewsEmptyPanelHtml({
        title: 'Refreshing feeds',
        text:
          'Fetching EDPB, EDPS, ICO, Commission, CoE, Indonesian sources (Antara, Setkab, Komdigi, Satu Data), and U.S. sources (FTC, CPPA, Colorado AG, data.gov)…'
      });
    }
    post('/api/news/refresh')
      .then(function (data) {
        setNewsRefreshBusy(false);
        renderNewsPayload(data);
        if (data && data.ok === false && data.error) {
          const note = document.createElement('li');
          note.className = 'news-empty';
          note.textContent = 'Note: refresh incomplete — ' + String(data.error);
          newsFeedsList.appendChild(note);
        }
      })
      .catch(function () {
        setNewsRefreshBusy(false);
        teardownNewsToolbarDock();
        if (newsResultStatus) newsResultStatus.textContent = '';
        newsFeedsList.innerHTML = '<li class="news-empty">Could not refresh news.</li>';
        if (newsSections) {
          newsSections.innerHTML = buildNewsEmptyPanelHtml({
            title: 'Refresh failed',
            text: 'Is the server running? Try again in a moment.',
            refresh: true
          });
        }
      });
  }

  btnRefresh.addEventListener('click', function () {
    btnRefresh.disabled = true;
    setBtnRefreshLabels('Refreshing…', '…');
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
        setBtnRefreshLabels('Refresh sources', 'Refresh');
        btnRefresh.disabled = false;
      })
      .catch(() => {
        setBtnRefreshLabels('Refresh sources', 'Refresh');
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

  (function initHeaderActionsToggle() {
    var toggle = document.getElementById('headerActionsToggle');
    var panel = document.getElementById('headerActionsPanel');
    if (!toggle || !panel) return;

    function syncAppChromeHeight() {
      var chromeEl = document.getElementById('appChrome');
      if (!chromeEl) return;
      var h = chromeEl.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--app-chrome-height', Math.ceil(h) + 'px');
      }
      scheduleTabsTrackThumb();
    }

    function setHeaderActionsOpen(open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Hide tools and settings' : 'Show tools and settings');
      requestAnimationFrame(syncAppChromeHeight);
    }

    function isDesktopChrome() {
      return window.matchMedia('(min-width: 900px)').matches;
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setHeaderActionsOpen(!panel.classList.contains('is-open'));
    });

    document.addEventListener('click', function (e) {
      if (isDesktopChrome() || !panel.classList.contains('is-open')) return;
      var chrome = document.getElementById('appChrome');
      if (chrome && !chrome.contains(e.target)) setHeaderActionsOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) setHeaderActionsOpen(false);
    });

    var mqDesktop = window.matchMedia('(min-width: 900px)');
    function onChromeBreakpoint() {
      if (mqDesktop.matches) setHeaderActionsOpen(false);
      syncAppChromeHeight();
    }
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onChromeBreakpoint);
    else if (mqDesktop.addListener) mqDesktop.addListener(onChromeBreakpoint);

    var chromeEl = document.getElementById('appChrome');
    if (chromeEl && typeof ResizeObserver !== 'undefined') {
      var chromeRo = new ResizeObserver(syncAppChromeHeight);
      chromeRo.observe(chromeEl);
    }
    syncAppChromeHeight();
    window.addEventListener('resize', syncAppChromeHeight, { passive: true });
  })();

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
      if (panel !== viewNews) teardownNewsToolbarDock();
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
      scheduleTabsTrackThumb();
      syncAppRouteToUrl();
    });
  });
  scheduleTabsTrackThumb();

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

  if (btnRefreshNews) btnRefreshNews.addEventListener('click', refreshNewsFromAllSources);

  (function initNewsHeroDetails() {
    var toggle = document.getElementById('newsHeroDetailsToggle');
    var details = document.getElementById('newsHeroDetails');
    if (!toggle || !details) return;

    function setDetailsOpen(open) {
      details.classList.toggle('is-expanded', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute(
        'aria-label',
        open ? 'Hide news overview and coverage' : 'Show news overview and coverage'
      );
    }

    function applyNewsHeroLayoutMode() {
      var desktop = window.matchMedia('(min-width: 900px)').matches;
      if (desktop) {
        setDetailsOpen(true);
        toggle.hidden = true;
      } else {
        toggle.hidden = false;
        setDetailsOpen(false);
      }
    }

    toggle.addEventListener('click', function () {
      setDetailsOpen(!details.classList.contains('is-expanded'));
    });

    var mqNewsHero = window.matchMedia('(min-width: 900px)');
    if (mqNewsHero.addEventListener) mqNewsHero.addEventListener('change', applyNewsHeroLayoutMode);
    else if (mqNewsHero.addListener) mqNewsHero.addListener(applyNewsHeroLayoutMode);

    applyNewsHeroLayoutMode();
  })();

  var newsScopeSwitchBtn = document.getElementById('newsScopeSwitchBtn');
  if (newsScopeSwitchBtn) {
    newsScopeSwitchBtn.addEventListener('click', function () {
      var targetId = newsScopeSwitchBtn.dataset.regulationId || 'gdpr';
      var match = findRegulationInCatalog(targetId);
      if (match) {
        if (currentRegion !== 'all' && regulationJurisdiction(match) !== currentRegion) {
          setCurrentRegion(regulationJurisdiction(match), { skipRegulationAdjust: true });
        }
        setCurrentRegulation(match);
        reloadActiveBrowseSegment();
      }
      if (viewNews && !viewNews.classList.contains('hidden')) {
        loadNews();
      }
    });
  }

  initNewsFilterDropdownUiOnce();

  if (newsFilterSource) newsFilterSource.addEventListener('change', applyNewsFilters);
  if (newsFilterTopic) newsFilterTopic.addEventListener('change', applyNewsFilters);
  if (newsSearchInput) {
    newsSearchInput.addEventListener('input', applyNewsFilters);
    newsSearchInput.addEventListener('search', function () {
      applyNewsFilters();
    });
  }
  if (newsSearchClear) {
    newsSearchClear.addEventListener('click', function () {
      if (newsSearchInput) newsSearchInput.value = '';
      if (newsSearchInput) newsSearchInput.focus();
      applyNewsFilters();
    });
  }
  if (newsFilterClear) {
    newsFilterClear.addEventListener('click', function () {
      if (newsFilterSource) newsFilterSource.value = '';
      if (newsFilterTopic) newsFilterTopic.value = '';
      if (newsSearchInput) newsSearchInput.value = '';
      applyNewsFilters();
    });
  }

  if (newsViewBySourceBtn) {
    newsViewBySourceBtn.addEventListener('click', function () {
      setNewsViewMode('by_source');
    });
  }
  if (newsViewAllBtn) {
    newsViewAllBtn.addEventListener('click', function () {
      setNewsViewMode('all');
    });
  }

  function syncMainFromAsideAndApply() {
    if (newsSearchInput && newsSearchInputAside) {
      newsSearchInput.value = newsSearchInputAside.value;
    }
    if (newsFilterSource && newsFilterSourceAside) {
      newsFilterSource.value = newsFilterSourceAside.value;
    }
    if (newsFilterTopic && newsFilterTopicAside) {
      newsFilterTopic.value = newsFilterTopicAside.value;
    }
    applyNewsFilters();
  }

  if (newsFilterSourceAside) {
    newsFilterSourceAside.addEventListener('change', syncMainFromAsideAndApply);
  }
  if (newsFilterTopicAside) {
    newsFilterTopicAside.addEventListener('change', syncMainFromAsideAndApply);
  }
  if (newsSearchInputAside) {
    newsSearchInputAside.addEventListener('input', syncMainFromAsideAndApply);
    newsSearchInputAside.addEventListener('search', syncMainFromAsideAndApply);
  }
  if (newsSearchClearAside) {
    newsSearchClearAside.addEventListener('click', function () {
      if (newsSearchInputAside) newsSearchInputAside.value = '';
      if (newsSearchInput) newsSearchInput.value = '';
      if (newsSearchInputAside) newsSearchInputAside.focus();
      applyNewsFilters();
    });
  }
  if (newsFilterClearAside) {
    newsFilterClearAside.addEventListener('click', function () {
      if (newsFilterSource) newsFilterSource.value = '';
      if (newsFilterTopic) newsFilterTopic.value = '';
      if (newsSearchInput) newsSearchInput.value = '';
      if (newsSearchInputAside) newsSearchInputAside.value = '';
      applyNewsFilters();
    });
  }

  window.addEventListener('resize', function () {
    if (!isNewsSidebarDockAllowed()) setNewsSidebarFiltersDockVisible(false);
  });

  initNewsSidebarExpandableToolbarOnce();

  function applyNewsFeedsSectionCollapsedPreference() {
    var top = newsFeedsAsideTop || document.getElementById('newsFeedsAsideTop');
    var toggle = newsFeedsSectionToggle || document.getElementById('newsFeedsSectionToggle');
    if (!top || !toggle) return;
    var collapsed = false;
    var stored = null;
    try {
      stored = sessionStorage.getItem('gdpr_news_feeds_section_collapsed');
    } catch (err) {
      stored = null;
    }
    if (stored === '1') collapsed = true;
    else if (stored === '0') collapsed = false;
    else {
      try {
        collapsed = window.matchMedia('(max-width: 899px)').matches;
      } catch (errMq) {
        collapsed = false;
      }
    }
    top.classList.toggle('news-feeds-aside-top--collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function initNewsFeedsSectionExpandableOnce() {
    var top = newsFeedsAsideTop || document.getElementById('newsFeedsAsideTop');
    var toggle = newsFeedsSectionToggle || document.getElementById('newsFeedsSectionToggle');
    if (!top || !toggle || toggle.getAttribute('data-feeds-section-bound') === '1') return;
    toggle.setAttribute('data-feeds-section-bound', '1');
    toggle.addEventListener('click', function () {
      var nowCollapsed = top.classList.toggle('news-feeds-aside-top--collapsed');
      toggle.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
      try {
        sessionStorage.setItem('gdpr_news_feeds_section_collapsed', nowCollapsed ? '1' : '0');
      } catch (err) {}
    });
  }

  initNewsFeedsSectionExpandableOnce();
  applyNewsFeedsSectionCollapsedPreference();

  function onNewsAttachmentsButtonClick(e) {
    var emptyAction =
      e.target && e.target.closest && e.target.closest('[data-news-empty-action]');
    if (emptyAction && newsSections && newsSections.contains(emptyAction)) {
      e.preventDefault();
      var action = emptyAction.getAttribute('data-news-empty-action');
      if (action === 'refresh' && btnRefreshNews) {
        btnRefreshNews.click();
      } else if (action === 'clear' && newsFilterClear) {
        newsFilterClear.click();
      }
      return;
    }
    var btn = e.target && e.target.closest && e.target.closest('.btn-news-attachments');
    if (!btn || !newsSections || !newsSections.contains(btn)) return;
    e.preventDefault();
    var u = btn.getAttribute('data-article-url');
    var t = btn.getAttribute('data-article-title') || '';
    openNewsAttachmentsReview(u, t);
  }
  if (newsSections) newsSections.addEventListener('click', onNewsAttachmentsButtonClick);
  if (newsAttachmentsDialogClose) {
    newsAttachmentsDialogClose.addEventListener('click', closeNewsAttachmentsDialog);
  }
  if (newsAttachmentsDialog) {
    newsAttachmentsDialog.addEventListener('click', function (e) {
      if (e.target === newsAttachmentsDialog) closeNewsAttachmentsDialog();
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
      resetChaptersFilters();
      applyChaptersFilters();
    });
  }
  initChaptersFilterComboboxes();
  initChaptersFiltersPanelToggle();
  initAskIndustrySectorCombobox();

  function formatCitationReturnLabel(doc) {
    if (!doc || doc.number == null || !doc.type) return 'Back to previous';
    var profile = getRegProfile();
    if (doc.type === 'recital') return 'Back to ' + profile.recitalHeading(doc.number);
    return 'Back to ' + profile.articleHeading(doc.number);
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
      setReaderViewModeControlVisible(false);
      updateDocNav();
    }
    updateBrowseSectionMenu();
    if (!suppressAppRouteSync && !appRouteRestorePending) {
      syncAppRouteToUrl();
    }
  }

  function ensureRecitalsIndexForSuggest() {
    if (recitalsDataCache && recitalsDataCache.length) {
      return Promise.resolve(recitalsDataCache);
    }
    var regId = currentRegulation.id;
    var requestId = loadRecitalsRequestId;
    return get('/api/recitals').then(function (recitals) {
      if (requestId !== loadRecitalsRequestId || currentRegulation.id !== regId) {
        return recitalsDataCache && recitalsDataCache.length ? recitalsDataCache : [];
      }
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
    var regId = currentRegulation.id;
    var requestId = loadChaptersRequestId;
    return get('/api/articles').then(function (articles) {
      if (requestId !== loadChaptersRequestId || currentRegulation.id !== regId) {
        return docNavArticlesListCache && docNavArticlesListCache.length
          ? docNavArticlesListCache
          : [];
      }
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
          ? 'All ' + regulationShortLabel() + ' ' + provisionKindLabels().recitals
          : 'All ' + regulationShortLabel() + ' ' + provisionKindLabels().articles
        : 'Matching ' + regulationShortLabel() + ' documents'
    );
    docNavSuggestList.innerHTML = '';
    items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.id = 'doc-nav-suggest-opt-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('data-number', item.number);
      li.className = 'doc-nav-suggest__option';
      li.setAttribute('tabindex', '-1');
      var kinds = provisionKindLabels();
      var badge =
        kind === 'recital' ? kinds.recitalShort + ' ' + item.number : kinds.articleShort + ' ' + item.number;
      var title = '';
      var sub = '';
      if (kind === 'recital') {
        title = getRecitalDisplayTitle(item) || getRegProfile().recitalHeading(item.number);
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
        /* navigateDocument respects Page | Full (scroll in Full, open one page in Page). */
        navigateDocument(kind, n);
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

  function getReaderViewMode() {
    return readerViewMode === 'full' ? 'full' : 'page';
  }

  function updateReaderViewModeUI() {
    var mode = getReaderViewMode();
    var fullOn = mode === 'full';
    if (readerViewModeEl) {
      readerViewModeEl.setAttribute('data-mode', mode);
    }
    if (readerViewModePageBtn) {
      var pageOn = !fullOn;
      readerViewModePageBtn.classList.toggle('is-active', pageOn);
      readerViewModePageBtn.setAttribute('aria-checked', pageOn ? 'true' : 'false');
    }
    if (readerViewModeFullBtn) {
      readerViewModeFullBtn.classList.toggle('is-active', fullOn);
      readerViewModeFullBtn.setAttribute('aria-checked', fullOn ? 'true' : 'false');
    }
    if (browseDetail) {
      browseDetail.classList.toggle('reader-view--full', fullOn);
      browseDetail.classList.toggle('reader-view--page', !fullOn);
    }
    // Related panels are provision-scoped; hide in Full corpus view
    document.querySelectorAll('.citation-panel--articles, .citation-panel--recitals').forEach(function (panel) {
      if (fullOn) {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        panel.classList.remove('is-expanded');
        var btn = panel.querySelector('.citation-panel-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      } else {
        panel.removeAttribute('hidden');
        panel.removeAttribute('aria-hidden');
      }
    });
  }

  function setReaderViewModeControlVisible(visible) {
    if (!readerViewModeEl) return;
    if (visible) readerViewModeEl.classList.remove('hidden');
    else readerViewModeEl.classList.add('hidden');
  }

  function setReaderViewMode(mode, opts) {
    var next = mode === 'full' ? 'full' : 'page';
    var prev = getReaderViewMode();
    readerViewMode = next;
    try {
      localStorage.setItem(READER_VIEW_MODE_KEY, next);
    } catch (eSetMode) {}
    updateReaderViewModeUI();
    if (opts && opts.skipNavigate) return;
    if (!currentDoc || !currentDoc.type || currentDoc.number == null) return;
    if (next === prev && !(opts && opts.force)) return;
    navigateDocument(currentDoc.type, currentDoc.number, { replaceView: true });
  }

  function readerSectionId(kind, number) {
    return kind === 'recital' ? 'reader-rec-' + number : 'reader-art-' + number;
  }

  function scrollToReaderSection(kind, number) {
    if (!detailContent) return;
    detailContent.querySelectorAll('.reader-full-section.is-current').forEach(function (el) {
      el.classList.remove('is-current');
    });
    var el = document.getElementById(readerSectionId(kind, number));
    if (el) {
      el.classList.add('is-current');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function buildArticleBodyHtml(data) {
    var displayTitle = getArticleDisplayTitle(data);
    var rawText = (data.text || '').trim();
    var isPlaceholderOrEmpty = !rawText || rawText.indexOf('(Text not extracted') === 0;
    if (isPlaceholderOrEmpty) {
      return (
        '<div class="article-point point-plain"><span class="point-text article-unavailable">Full text for this article was not extracted from the source. Please refer to the official links below for the authoritative text.</span></div>'
      );
    }
    var textToParse = stripLeadingArticleHeadingFromBody(data.number, data.title, displayTitle, rawText);
    var manual = renderManualNumberedParagraphs(textToParse);
    if (manual) return manual;
    var auto = renderAutoArticleBody(data.number, textToParse);
    if (auto) return auto;
    return (
      '<div class="article-point point-plain"><span class="point-text">' +
      injectRegulationCitationLinks(
        stripEurLexClauseNumberMarkers(escapeHtml(stripParentheticalRecitalsFromArticlePlain(textToParse)))
      ) +
      '</span></div>'
    );
  }

  function buildArticleDocumentHtml(data, opts) {
    var options = opts || {};
    var displayTitle = getArticleDisplayTitle(data);
    var profile = getRegProfile();
    var wrapTag = options.section ? 'section' : 'div';
    var sectionAttrs = options.section
      ? ' class="reader-full-section article-doc" id="' +
        escapeHtml(readerSectionId('article', data.number)) +
        '" data-type="article" data-number="' +
        escapeHtml(String(data.number)) +
        '"'
      : ' class="article-doc"';
    return (
      '<' +
      wrapTag +
      sectionAttrs +
      '>' +
      '<div class="article-separator"></div>' +
      '<p class="art-num">' +
      escapeHtml(profile.articleHeading(data.number)) +
      '</p>' +
      '<h2 class="art-subject">' +
      escapeHtml(displayTitle) +
      '</h2>' +
      '<div class="article-separator"></div>' +
      '<div class="article-body">' +
      buildArticleBodyHtml(data) +
      '</div>' +
      '<div class="article-separator"></div>' +
      '</' +
      wrapTag +
      '>'
    );
  }

  function buildRecitalDocumentHtml(data, opts) {
    var options = opts || {};
    var recitalTitle = getRecitalDisplayTitle(data);
    var recitalHtml = renderRecitalDocumentHtml(data.text);
    var profile = getRegProfile();
    var wrapTag = options.section ? 'section' : 'div';
    var sectionAttrs = options.section
      ? ' class="reader-full-section article-doc recital-doc" id="' +
        escapeHtml(readerSectionId('recital', data.number)) +
        '" data-type="recital" data-number="' +
        escapeHtml(String(data.number)) +
        '"'
      : ' class="article-doc recital-doc"';
    return (
      '<' +
      wrapTag +
      sectionAttrs +
      '>' +
      '<div class="article-separator"></div>' +
      '<p class="art-num">' +
      escapeHtml(profile.recitalHeading(data.number)) +
      '</p>' +
      (recitalTitle ? '<h2 class="art-subject">' + escapeHtml(recitalTitle) + '</h2>' : '') +
      '<div class="article-separator"></div>' +
      '<div class="article-body"><div class="prose">' +
      recitalHtml +
      '</div></div>' +
      '<div class="article-separator"></div>' +
      '</' +
      wrapTag +
      '>'
    );
  }

  function briefTitleForDoc(kind, data) {
    if (kind === 'recital') {
      var recitalTitle = getRecitalDisplayTitle(data);
      var navBrief = parseRecitalTopicTitle(data.title, data.number);
      if (!navBrief && recitalTitle) {
        navBrief = recitalTitle.replace(/^Recital\s*\(\s*\d+\s*\)\s*[—–-]\s*/i, '').trim();
      }
      if (!navBrief && recitalTitle) {
        navBrief = recitalTitle.replace(/^Recital\s*\(\s*\d+\s*\)\s*/i, '').trim();
      }
      return navBrief || '';
    }
    var artBrief = (getArticleDisplayTitle(data) || '').trim();
    if (/^Article\s+\d+\s*$/i.test(artBrief)) artBrief = '';
    return artBrief;
  }

  function populateFullViewCitations(kind, items) {
    resetCitationSidebarPanels();
    if (relatedArticles) relatedArticles.innerHTML = '';
    if (relatedRecitals) relatedRecitals.innerHTML = '';
    if (typeof updateRelatedPanelsCountBadge === 'function') {
      try {
        updateRelatedPanelsCountBadge(0, 0);
      } catch (eRelBadge) {}
    }
    if (!citationLinks) return;
    var profile = getRegProfile();
    var first = items && items[0];
    var contentAsOfHtml = first && first.contentAsOf
      ? '<li class="content-as-of">Text as of ' + formatContentDate(first.contentAsOf) + ' (consolidated).</li>'
      : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest text.</li>';
    var label =
      kind === 'recital'
        ? 'All ' + regulationShortLabel() + ' recitals'
        : 'All ' + regulationShortLabel() + ' articles';
    citationLinks.innerHTML =
      contentAsOfHtml +
      '<li><a href="' +
      escapeHtml(profile.infoBaseUrl || profile.eurLexTxtUrl || '#') +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(profile.infoSiteName) +
      ' – ' +
      escapeHtml(label) +
      '</a></li>' +
      '<li><a href="' +
      escapeHtml(profile.eurLexTxtUrl || '#') +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(officialSiteName(profile)) +
      ' – ' +
      escapeHtml(profile.eurLexLabel) +
      '</a></li>';
    updateCitationOfficialSourcesCount();
  }

  function openFullCorpus(kind, focusNumber, opts) {
    var options = opts || {};
    var token = ++readerFullLoadToken;
    var focus = parseInt(String(focusNumber), 10);
    if (isNaN(focus) || focus < 1) focus = 1;

    var regIdForFull = currentRegulation && currentRegulation.id ? currentRegulation.id : 'gdpr';
    var existing =
      detailContent &&
      detailContent.querySelector(
        '.reader-full-doc[data-kind="' +
          kind +
          '"][data-regulation="' +
          regIdForFull +
          '"]'
      );
    if (existing && !options.forceReload) {
      var focusItem = null;
      if (kind === 'recital') {
        ensureRecitalsIndexForSuggest().then(function (recs) {
          if (token !== readerFullLoadToken) return;
          focusItem = (recs || []).find(function (r) {
            return r.number === focus;
          });
          currentDoc = {
            type: kind,
            number: focus,
            briefTitle: focusItem ? briefTitleForDoc(kind, focusItem) : ''
          };
          showSection(browseDetail);
          updateReaderViewModeUI();
          setReaderViewModeControlVisible(true);
          updateDocNav();
          scrollToReaderSection(kind, focus);
          focusDetailContentForReading();
        });
      } else {
        ensureArticlesIndexForSuggest().then(function (arts) {
          if (token !== readerFullLoadToken) return;
          focusItem = (arts || []).find(function (a) {
            return a.number === focus;
          });
          currentDoc = {
            type: kind,
            number: focus,
            briefTitle: focusItem ? briefTitleForDoc(kind, focusItem) : ''
          };
          showSection(browseDetail);
          updateReaderViewModeUI();
          setReaderViewModeControlVisible(true);
          updateDocNav();
          scrollToReaderSection(kind, focus);
          focusDetailContentForReading();
        });
      }
      return;
    }

    var loader =
      kind === 'recital' ? ensureRecitalsIndexForSuggest : ensureArticlesIndexForSuggest;
    if (detailContent) {
      detailContent.innerHTML =
        '<p class="docs-browser-loading" role="status"><span class="docs-browser-loading-pulse" aria-hidden="true"></span> Loading full ' +
        escapeHtml(kind === 'recital' ? 'recitals' : 'articles') +
        '…</p>';
    }
    showSection(browseDetail);
    setReaderViewModeControlVisible(true);
    updateReaderViewModeUI();

    loader()
      .then(function (items) {
        if (token !== readerFullLoadToken) return;
        var sorted = (items || []).slice().sort(function (a, b) {
          return a.number - b.number;
        });
        if (!sorted.length) {
          if (detailContent) {
            detailContent.innerHTML =
              '<p class="empty-state" role="status">No ' +
              escapeHtml(kind === 'recital' ? 'recitals' : 'articles') +
              ' available for this regulation.</p>';
          }
          return;
        }
        var maxNum = kind === 'recital' ? regulationMaxRecitals() : regulationMaxArticles();
        if (focus > maxNum) focus = sorted[sorted.length - 1].number;
        var html = sorted
          .map(function (item) {
            return kind === 'recital'
              ? buildRecitalDocumentHtml(item, { section: true })
              : buildArticleDocumentHtml(item, { section: true });
          })
          .join('');
        if (currentRegulation.id !== regIdForFull) return;
        detailContent.innerHTML =
          '<div class="reader-full-doc" data-kind="' +
          escapeHtml(kind) +
          '" data-regulation="' +
          escapeHtml(regIdForFull) +
          '">' +
          html +
          '</div>';
        var focusItem = sorted.find(function (it) {
          return it.number === focus;
        }) || sorted[0];
        focus = focusItem.number;
        currentDoc = {
          type: kind,
          number: focus,
          briefTitle: briefTitleForDoc(kind, focusItem)
        };
        populateFullViewCitations(kind, sorted.map(function (it) {
          return Object.assign({}, it, {
            contentAsOf: it.contentAsOf || null
          });
        }));
        // List endpoints omit contentAsOf — fetch meta from a single provision when needed
        var metaUrl = kind === 'recital' ? '/api/recitals/' + focus : '/api/articles/' + focus;
        get(metaUrl)
          .then(function (one) {
            if (token !== readerFullLoadToken || currentRegulation.id !== regIdForFull) return;
            if (one && one.contentAsOf && citationLinks) {
              populateFullViewCitations(kind, [one]);
            }
          })
          .catch(function () {});
        updateDocNav();
        updateReaderViewModeUI();
        setReaderViewModeControlVisible(true);
        requestAnimationFrame(function () {
          scrollToReaderSection(kind, focus);
          focusDetailContentForReading();
        });
      })
      .catch(function (err) {
        if (token !== readerFullLoadToken) return;
        console.error('Full corpus load failed', err);
        if (detailContent) {
          detailContent.innerHTML =
            '<p class="empty-state" role="alert">Could not load the full document. Try again or switch to Page view.</p>';
        }
      });
  }

  function navigateDocument(type, number, opts) {
    var kind = type === 'recital' ? 'recital' : 'article';
    var num = parseInt(String(number), 10);
    if (isNaN(num) || num < 1) return;
    if (opts && opts.fromCitation) applyCitationNavOpts(opts);
    else if (opts && opts.applyCitationOpts) applyCitationNavOpts(opts);
    if (getReaderViewMode() === 'full') {
      openFullCorpus(kind, num, { forceReload: !!(opts && opts.replaceView) });
      return;
    }
    if (kind === 'recital') openRecital(num, opts);
    else openArticle(num, opts);
  }

  /** Update prev/next document nav based on currentDoc. Show only when viewing a single article or recital. */
  function updateDocNav() {
    if (!docNav || !docNavPrev || !docNavNext || !docNavLabel) return;
    const doc = currentDoc;
    if (!doc || !doc.type || doc.number == null) {
      docNav.classList.add('hidden');
      closeDocNavSuggestions();
      setReaderViewModeControlVisible(false);
      return;
    }
    setReaderViewModeControlVisible(true);
    updateReaderViewModeUI();
    docNav.classList.remove('hidden');
    const isRecital = doc.type === 'recital';
    const num = doc.number;
    const minNum = isRecital ? 1 : 1;
    const maxNum = isRecital ? regulationMaxRecitals() : regulationMaxArticles();
    const prevNum = num - 1;
    const nextNum = num + 1;

    docNavPrev.disabled = prevNum < minNum;
    docNavNext.disabled = nextNum > maxNum;
    var sn = regulationShortLabel();
    var maxNumLabel = isRecital ? regulationMaxRecitals() : regulationMaxArticles();
    docNavPrev.setAttribute(
      'aria-label',
      isRecital
        ? 'Previous ' + sn + ' ' + provisionKindLabels().recital.toLowerCase() + ' (' + prevNum + ')'
        : 'Previous ' + sn + ' ' + provisionKindLabels().article.toLowerCase() + ' ' + prevNum
    );
    docNavNext.setAttribute(
      'aria-label',
      isRecital
        ? 'Next ' + sn + ' ' + provisionKindLabels().recital.toLowerCase() + ' (' + nextNum + ')'
        : 'Next ' + sn + ' ' + provisionKindLabels().article.toLowerCase() + ' ' + nextNum
    );
    var kindsNav = provisionKindLabels();
    if (prevNum < minNum) {
      docNavPrev.textContent = '←';
    } else {
      docNavPrev.textContent = isRecital
        ? '← ' + kindsNav.recitalShort + ' ' + prevNum
        : '← ' + kindsNav.articleShort + ' ' + prevNum;
    }
    if (nextNum > maxNum) {
      docNavNext.textContent = '→';
    } else {
      docNavNext.textContent = isRecital
        ? kindsNav.recitalShort + ' ' + nextNum + ' →'
        : kindsNav.articleShort + ' ' + nextNum + ' →';
    }
    docNavLabel.innerHTML = isRecital
      ? '<span class="doc-nav-label-kind">' +
        escapeHtml(sn) +
        ' ' +
        escapeHtml(kindsNav.recital) +
        '</span> <span class="doc-nav-label-pos"><strong>' +
        escapeHtml(String(num)) +
        '</strong><span class="doc-nav-label-of"> / ' +
        escapeHtml(String(maxNumLabel)) +
        '</span></span>'
      : '<span class="doc-nav-label-kind">' +
        escapeHtml(sn) +
        ' ' +
        escapeHtml(kindsNav.articleShort) +
        '</span> <span class="doc-nav-label-pos"><strong>' +
        escapeHtml(String(num)) +
        '</strong><span class="doc-nav-label-of"> / ' +
        escapeHtml(String(maxNumLabel)) +
        '</span></span>';
    closeDocNavSuggestions();
    if (docNavNumber) {
      docNavNumber.value = buildDocNavInputDisplay(doc);
      docNavNumber.placeholder = isRecital
        ? 'Recital 1–' + regulationMaxRecitals() + ' · Enter'
        : 'Article 1–' + regulationMaxArticles() + ' · Enter';
      docNavNumber.title = isRecital
        ? 'Jump to a ' + sn + ' recital — type a number or keywords, then press Enter'
        : 'Jump to a ' + sn + ' article — type a number or keywords, then press Enter';
      var ariaBrief = truncateBriefTitleForDocNav((doc.briefTitle || '').trim(), 72);
      if (!ariaBrief && detailContent) {
        var subj = detailContent.querySelector('.art-subject');
        if (subj) ariaBrief = truncateBriefTitleForDocNav(subj.textContent, 72);
      }
      docNavNumber.setAttribute(
        'aria-label',
        (isRecital ? 'Jump to ' + sn + ' recital' : 'Jump to ' + sn + ' article') +
          '. Current ' +
          (isRecital ? sn + ' recital (' + num + ')' : sn + ' article ' + num) +
          (ariaBrief ? ': ' + ariaBrief + '.' : '.') +
          ' Type a number or keywords, then press Enter, or open the list.'
      );
    }
    if (docNavListToggle) {
      docNavListToggle.setAttribute(
        'aria-label',
        isRecital
          ? 'Browse all ' + sn + ' recitals in a list'
          : 'Browse all ' + sn + ' articles in a list'
      );
      docNavListToggle.setAttribute(
        'title',
        isRecital
          ? 'Open full list of ' + sn + ' recitals (1–' + regulationMaxRecitals() + ')'
          : 'Open full list of ' + sn + ' articles (1–' + regulationMaxArticles() + ')'
      );
    }
  }

  function goToDocNumber() {
    if (!currentDoc || !docNavNumber) return;
    if (docNavSuggestActiveIndex >= 0 && docNavSuggestItems.length) {
      var pick = docNavSuggestItems[docNavSuggestActiveIndex];
      if (pick && pick.number != null) {
        closeDocNavSuggestions();
        navigateDocument(currentDoc.type, pick.number);
        return;
      }
    }
    const raw = docNavNumber.value.trim();
    if (!raw) return;
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const isRecital = currentDoc.type === 'recital';
    const minNum = 1;
    const maxNum = isRecital ? regulationMaxRecitals() : regulationMaxArticles();
    if (num < minNum || num > maxNum) return;
    closeDocNavSuggestions();
    navigateDocument(currentDoc.type, num);
  }

  if (docNavPrev) {
    docNavPrev.addEventListener('click', function () {
      if (!currentDoc || this.disabled) return;
      navigateDocument(currentDoc.type, currentDoc.number - 1);
    });
  }
  if (docNavNext) {
    docNavNext.addEventListener('click', function () {
      if (!currentDoc || this.disabled) return;
      navigateDocument(currentDoc.type, currentDoc.number + 1);
    });
  }
  if (readerViewModePageBtn) {
    readerViewModePageBtn.addEventListener('click', function () {
      setReaderViewMode('page');
    });
  }
  if (readerViewModeFullBtn) {
    readerViewModeFullBtn.addEventListener('click', function () {
      setReaderViewMode('full');
    });
  }
  updateReaderViewModeUI();
  if (docNavGoForm) {
    docNavGoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      goToDocNumber();
    });
  }
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
    syncAppRouteToUrl(true);
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
    if (!t) return '';
    var m = t.match(/^Recital\s*\(\s*(\d+)\s*\)\s*[—–-]\s*(.+)$/i);
    if (m && m[2]) return m[2].replace(/\s+/g, ' ').trim();
    m = t.match(/^Recital\s+(\d+)\s*[—–-]\s*(.+)$/i);
    if (m && m[2]) return m[2].replace(/\s+/g, ' ').trim();
    var onlyNum = t.match(/^Recital\s*(\(\s*\d+\s*\)|\d+)\s*$/i);
    if (onlyNum) return '';
    m = t.match(/^Recital\s+\d+\s+(.+)$/i);
    if (m && m[1]) return m[1].replace(/\s+/g, ' ').trim();
    return t
      .replace(/^Recital\s*\(\s*\d+\s*\)\s*[—–-]?\s*/i, '')
      .replace(/^Recital\s+\d+\s*[—–-]?\s*/i, '')
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
    if (/^\d{1,3}$/.test(query)) {
      var n = parseInt(query, 10);
      var maxA = regulationMaxArticles();
      if (n >= 1 && n <= maxA) return all.filter(function (a) { return a.number === n; });
    }
    var qStrip = query
      .replace(/^article\s*/i, '')
      .replace(/^art\.?\s*/i, '')
      .trim();
    if (/^\d{1,3}$/.test(qStrip)) {
      var n2 = parseInt(qStrip, 10);
      var maxA2 = regulationMaxArticles();
      if (n2 >= 1 && n2 <= maxA2) {
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
    else if (shown === total) recitalsCountEl.textContent = total + ' ' + regulationShortLabel() + ' recitals';
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
        'No ' + regulationShortLabel() + ' recitals match your search. Try a number between 1 and ' + regulationMaxRecitals() + ', or different keywords.';
      recitalsList.appendChild(empty);
      return;
    }
    recitals.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'recital-card';
      card.setAttribute('role', 'listitem');
      var topic = getRecitalDisplayTitle(r);
      var summary = getRecitalCardSummary(r);
      var titleHtml = topic ? '<h3 class="recital-card-title">' + escapeHtml(topic) + '</h3>' : '';
      var summaryHtml = summary
        ? '<p class="recital-card-summary">' + escapeHtml(summary) + '</p>'
        : '';
      if (!summary && !topic) {
        summaryHtml =
          '<p class="recital-card-summary recital-card-summary--placeholder">Full text opens in the reader.</p>';
      }
      var sn = regulationShortLabel();
      var ariaLabel =
        sn + ' Recital ' + r.number + (topic ? ': ' + topic : '') + ' — open full text';
      card.innerHTML =
        '<a href="' +
        buildDocRouteHash('recital', r.number) +
        '" class="recital-card-link" data-type="recital" data-number="' +
        r.number +
        '" aria-label="' +
        escapeHtml(ariaLabel) +
        '">' +
        '<div class="recital-card-body">' +
        '<div class="recital-card-top">' +
        '<span class="recital-card-badge"><span class="recital-card-badge-label">' + escapeHtml(sn) + ' ' + escapeHtml(provisionKindLabels().recital) + '</span> <span class="recital-card-badge-num">' +
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
    var regId = currentRegulation.id;
    var requestId = ++loadRecitalsRequestId;
    if (recitalsList) {
      recitalsList.removeAttribute('role');
      recitalsList.setAttribute('aria-busy', 'true');
      recitalsList.innerHTML =
        '<div class="docs-browser-loading" role="status"><span class="docs-browser-loading-pulse" aria-hidden="true"></span> Loading ' +
        escapeHtml(regulationShortLabel()) +
        ' recitals…</div>';
    }
    if (recitalsCountEl) recitalsCountEl.textContent = '';
    get('/api/recitals')
      .then(function (recitals) {
        if (requestId !== loadRecitalsRequestId || currentRegulation.id !== regId) return;
        recitalsDataCache = Array.isArray(recitals) ? recitals : [];
        if (recitalsSearch) recitalsSearch.value = '';
        applyRecitalsFilter('');
      })
      .catch(function () {
        if (requestId !== loadRecitalsRequestId || currentRegulation.id !== regId) return;
        recitalsDataCache = [];
        if (recitalsList) {
          recitalsList.setAttribute('aria-busy', 'false');
          recitalsList.innerHTML =
            '<p class="recitals-empty recitals-empty-error" role="alert">Could not load ' +
            escapeHtml(regulationShortLabel()) +
            ' recitals. Check your connection and try again.</p>';
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
    if (getReaderViewMode() === 'full') {
      openFullCorpus('recital', number);
      return;
    }
    var regId = currentRegulation.id;
    get('/api/recitals/' + number)
      .then(function (data) {
        if (currentRegulation.id !== regId) return null;
        return resolveSuitableArticlesForRecital(number, data.suitableArticles).then(function (suitableArticles) {
          return { data: data, suitableArticles: suitableArticles };
        });
      })
      .then(function (bundle) {
        if (!bundle || currentRegulation.id !== regId) return;
        resetCitationSidebarPanels();
        var data = bundle.data;
        var suitableArticles = bundle.suitableArticles;
        var profile = getRegProfile();
        detailContent.innerHTML = buildRecitalDocumentHtml(data);
        var contentAsOfHtml = data.contentAsOf
          ? '<li class="content-as-of">Text as of ' + formatContentDate(data.contentAsOf) + ' (consolidated).</li>'
          : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest text.</li>';
        var recNum = data.number != null ? parseInt(String(data.number), 10) : number;
        if (isNaN(recNum) || recNum < 1) recNum = number;
        var infoRecitalUrl = data.sourceUrl || profile.recitalUrl(recNum);
        var eurLexUrl = data.eurLexUrl || profile.eurLexTxtUrl;
        citationLinks.innerHTML =
          contentAsOfHtml +
          '<li><a href="' + escapeHtml(infoRecitalUrl) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(profile.infoSiteName) + ' – ' + escapeHtml(profile.recitalHeading(recNum)) + '</a></li>' +
          '<li><a href="' + escapeHtml(eurLexUrl) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(officialSiteName(profile)) + ' – ' + escapeHtml(profile.eurLexLabel) + '</a></li>';
        updateCitationOfficialSourcesCount();
        currentDoc = { type: 'recital', number: data.number, briefTitle: briefTitleForDoc('recital', data) };
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
    var sub = getChaptersFilterSubcategoryValue();
    var allowed = null;
    if (sub) {
      allowed = new Set();
      articles.forEach(function (a) {
        if (a.chapter == null) return;
        var t = articleTopics[a.number] || [];
        if (t.indexOf(sub) !== -1) allowed.add(normalizeChapterNumber(a.chapter));
      });
    }
    var preserve = chaptersFilterChapter.value;
    chaptersFilterChapter.innerHTML = '<option value="">All ' + regulationShortLabel() + ' chapters</option>';
    if (chaptersFilterCategory) {
      chaptersFilterCategory.innerHTML =
        '<option value="">' + escapeHtml(regulationFilterPlaceholder('categories')) + '</option>';
    }
    chapters.forEach(function (ch) {
      if (allowed && !allowed.has(normalizeChapterNumber(ch.number))) return;
      var o1 = document.createElement('option');
      o1.value = String(ch.number);
      o1.textContent = regulationChapterFilterLabel(ch);
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
    var kinds = provisionKindLabels();
    var profile = getRegProfile();
    var heading =
      profile && typeof profile.articleHeading === 'function'
        ? profile.articleHeading(art.number)
        : kinds.article + ' ' + art.number;
    var disp = getArticleDisplayTitle(art);
    var tail =
      disp && disp !== heading && disp !== 'Article ' + art.number
        ? ' – ' + (disp.length > 52 ? disp.slice(0, 52) + '…' : disp)
        : '';
    return regulationShortLabel() + ' ' + kinds.article + ' ' + art.number + tail;
  }

  function chaptersFilterRepopulateArticleSelect() {
    var data = window.__chaptersData;
    if (!data || !chaptersFilterArticle) return;
    var articles = data.articles;
    var articleTopics = data.articleTopics;
    var chNum = chaptersFilterGetChapterNumber();
    var sub = getChaptersFilterSubcategoryValue();
    var preserve = chaptersFilterArticle.value;
    chaptersFilterArticle.innerHTML =
      '<option value="">' + escapeHtml(regulationFilterPlaceholder('articles')) + '</option>';
    articles
      .slice()
      .sort(function (a, b) {
        return a.number - b.number;
      })
      .forEach(function (art) {
        if (chNum != null && normalizeChapterNumber(art.chapter) !== chNum) return;
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
    var out = [{ value: '', label: regulationFilterPlaceholder('chapters') }];
    data.chapters.forEach(function (ch) {
      var label = regulationChapterFilterLabel(ch);
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
    var out = [{ value: '', label: regulationFilterPlaceholder('categories') }];
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
    var out = [{ value: '', label: regulationFilterPlaceholder('articles') }];
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
    var out = [{ value: '', label: regulationFilterPlaceholder('subcategories') }];
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
      regulationFilterPlaceholder('categories')
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterSubcategory,
      document.getElementById('chaptersFilterSubcategoryInput'),
      regulationFilterPlaceholder('subcategories')
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterChapter,
      document.getElementById('chaptersFilterChapterInput'),
      regulationFilterPlaceholder('chapters')
    );
    chaptersFilterComboboxSyncInputFromSelect(
      chaptersFilterArticle,
      document.getElementById('chaptersFilterArticleInput'),
      regulationFilterPlaceholder('articles')
    );
  }

  function normalizeIndustrySectorsResponse(data) {
    if (Array.isArray(data) && data.length) return { sectors: data, tree: null };
    if (data && typeof data === 'object' && Array.isArray(data.sectors) && data.sectors.length) {
      var tr = data.tree;
      if (tr && Array.isArray(tr.industries) && tr.sectorGroups && typeof tr.sectorGroups === 'object') {
        return { sectors: data.sectors, tree: tr };
      }
      return { sectors: data.sectors, tree: null };
    }
    return null;
  }

  function attachIndustrySectorTreeJson(pack) {
    if (!pack || pack.tree) return Promise.resolve(pack);
    return fetch(API + '/industry-sector-tree.json', { credentials: 'same-origin' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (tree) {
        if (tree && tree.industries && tree.sectorGroups) return { sectors: pack.sectors, tree: tree };
        return pack;
      });
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
        isicDivision: null,
        searchTerms: '',
        framework: 'Default: balanced GDPR Q&A without industry emphasis.'
      }
    ];
    rows.forEach(function (r) {
      builtInIsicSectorsCache.push({
        id: r[0],
        label: r[1],
        isicSection: r[0],
        isicDivision: null,
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
      .then(normalizeIndustrySectorsResponse)
      .then(function (pack) {
        if (!pack || !pack.sectors.length) throw new Error('empty industry sectors from API');
        return attachIndustrySectorTreeJson(pack);
      })
      .catch(function () {
        return fetch(API + '/industry-sectors.json', { credentials: 'same-origin' })
          .then(function (r) {
            if (!r.ok) throw new Error('industry-sectors.json not available');
            return r.json();
          })
          .then(normalizeIndustrySectorsResponse)
          .then(function (pack) {
            if (!pack || !pack.sectors.length) throw new Error('empty industry-sectors.json');
            return attachIndustrySectorTreeJson(pack);
          });
      })
      .catch(function () {
        return { sectors: getBuiltInIsicSectorFallback(), tree: null };
      });
    return industrySectorsForAskPromise;
  }

  /** Breadcrumb separator for single-list ISIC picker (Unicode single right-pointing angle quotation mark). */
  var ASK_SECTOR_PATH_SEP = ' \u203a ';

  /**
   * Flat rows for Ask combobox: same ids as server (GENERAL, A–U, ISIC-xx), label = full path when tree exists.
   */
  function buildHierarchicalAskSectorRows(sectors, tree) {
    var byId = {};
    sectors.forEach(function (s) {
      byId[s.id] = s;
    });
    var sep = ASK_SECTOR_PATH_SEP;
    var rows = [];
    var gen = byId.GENERAL;
    rows.push({
      id: 'GENERAL',
      label: gen ? gen.label : 'General — no sector-specific framing',
      isicDivision: null,
      searchBlob:
        'general no sector ' +
        (gen && gen.label ? gen.label : '') +
        ' ' +
        (gen && gen.searchTerms ? gen.searchTerms : '')
    });
    (tree.industries || []).forEach(function (ind) {
      var indLabel = String(ind.label || '').trim();
      (ind.sections || []).forEach(function (letter) {
        var sectionRow = byId[letter];
        if (!sectionRow) return;
        var secLabel = String(sectionRow.label || '').trim();
        var wholeLabel = indLabel + sep + secLabel + sep + 'Whole ISIC section';
        rows.push({
          id: letter,
          label: wholeLabel,
          isicDivision: null,
          searchBlob: [
            wholeLabel,
            letter,
            secLabel,
            indLabel,
            sectionRow.searchTerms || '',
            sectionRow.framework || ''
          ].join(' ')
        });
        var groups = tree.sectorGroups[letter];
        if (!groups) return;
        groups.forEach(function (g) {
          var gLabel = String(g.label || '').trim();
          (g.divisionIds || []).forEach(function (did) {
            var divRow = byId[did];
            if (!divRow) return;
            var pathLabel = indLabel + sep + secLabel + sep + gLabel + sep + String(divRow.label || '').trim();
            rows.push({
              id: did,
              label: pathLabel,
              isicDivision: divRow.isicDivision,
              searchBlob: [
                pathLabel,
                did,
                gLabel,
                divRow.searchTerms || '',
                divRow.framework || '',
                indLabel,
                secLabel
              ].join(' ')
            });
          });
        });
      });
    });
    return rows;
  }

  function sectorRowsFromFlatSectors(sectors) {
    return sectors.map(function (s) {
      return {
        id: s.id,
        label: s.label,
        isicDivision: s.isicDivision,
        searchBlob: [
          s.label,
          s.id,
          s.isicDivision != null ? String(s.isicDivision) : '',
          s.searchTerms || '',
          s.framework || ''
        ].join(' ')
      };
    });
  }

  /**
   * Grouped expandable list + search-to-flat. Same sector ids as server.
   */
  function bindAskIndustrySectorGroupedCombobox(sectors, tree) {
    var select = document.getElementById('askIndustrySector');
    var input = document.getElementById('askIndustrySectorInput');
    var list = document.getElementById('askIndustrySectorList');
    var toggle = document.getElementById('askIndustrySectorToggle');
    if (!select || !input || !list || !toggle) return;
    if (list.dataset.askSectorComboReady === '1') return;
    if (!Array.isArray(sectors) || sectors.length === 0) sectors = getBuiltInIsicSectorFallback();
    var flatRows = buildHierarchicalAskSectorRows(sectors, tree);
    if (!flatRows.length) return;

    list.dataset.askSectorComboReady = '1';
    list.dataset.askSectorGrouped = '1';

    var byId = {};
    sectors.forEach(function (s) {
      byId[s.id] = s;
    });

    var expandedMacros = new Set();
    var expandedSections = new Set();
    var activeIndex = -1;
    var open = false;
    var debounceTimer = null;
    var optIdSeq = 0;

    select.innerHTML = '';
    flatRows.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.id;
      o.textContent = r.label;
      select.appendChild(o);
    });
    select.value = 'GENERAL';
    var genRow = flatRows.find(function (x) {
      return x.id === 'GENERAL';
    });
    input.value = genRow ? genRow.label : '';
    input.placeholder = 'Browse groups (arrow) or type to search…';

    function selectedRowLabel() {
      var r = flatRows.find(function (x) {
        return x.id === select.value;
      });
      return r ? r.label : '';
    }

    function isSearchMode() {
      var q = (input.value || '').trim();
      if (q === '') return false;
      return q !== selectedRowLabel();
    }

    function expandAncestorsForSelectedId(sid) {
      expandedMacros.clear();
      expandedSections.clear();
      if (!sid || sid === 'GENERAL') return;
      var letter = null;
      if (/^[A-U]$/.test(sid)) letter = sid;
      else {
        for (var L in tree.sectorGroups) {
          if (!Object.prototype.hasOwnProperty.call(tree.sectorGroups, L)) continue;
          var grps = tree.sectorGroups[L];
          for (var gi = 0; gi < grps.length; gi++) {
            if ((grps[gi].divisionIds || []).indexOf(sid) !== -1) {
              letter = L;
              break;
            }
          }
          if (letter) break;
        }
      }
      if (!letter) return;
      (tree.industries || []).forEach(function (ind) {
        if ((ind.sections || []).indexOf(letter) !== -1) {
          expandedMacros.add(ind.id);
          expandedSections.add(ind.id + ':' + letter);
        }
      });
    }

    function setOpen(on) {
      open = on;
      list.hidden = !on;
      input.setAttribute('aria-expanded', on ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    function filterFlat(q) {
      var t = (q || '').trim().toLowerCase();
      if (!t) return flatRows.slice();
      return flatRows.filter(function (r) {
        if ((r.label || '').toLowerCase().indexOf(t) !== -1) return true;
        if (String(r.id).toLowerCase().indexOf(t) !== -1) return true;
        if (r.isicDivision != null && String(r.isicDivision).toLowerCase().indexOf(t) !== -1) return true;
        if ((r.searchBlob || '').toLowerCase().indexOf(t) !== -1) return true;
        return false;
      });
    }

    function nextOptId() {
      optIdSeq += 1;
      return 'askIndustrySectorOpt-' + optIdSeq;
    }

    function makeOptionEl(fullLabel, shortLabel, value) {
      var el = document.createElement('div');
      el.setAttribute('role', 'option');
      el.id = nextOptId();
      el.className = 'filter-combobox-option ask-sector-leaf';
      el.setAttribute('data-value', value);
      el.setAttribute('data-full-label', fullLabel);
      el.textContent = shortLabel;
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        pick(value, fullLabel);
      });
      return el;
    }

    function makeMacroExpandRow(indId, indLabel) {
      var el = document.createElement('div');
      el.setAttribute('role', 'option');
      el.id = nextOptId();
      el.className =
        'filter-combobox-option ask-sector-expand-row ask-sector-expand-row--macro';
      el.setAttribute('aria-expanded', expandedMacros.has(indId) ? 'true' : 'false');
      el.setAttribute('data-expand-macro', indId);
      var iconM = document.createElement('span');
      iconM.className = 'ask-sector-expand-icon';
      iconM.setAttribute('aria-hidden', 'true');
      el.appendChild(iconM);
      el.appendChild(document.createTextNode(indLabel));
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        toggleMacro(indId);
      });
      return el;
    }

    function makeSectionExpandRow(secKey, secLabel) {
      var el = document.createElement('div');
      el.setAttribute('role', 'option');
      el.id = nextOptId();
      el.className =
        'filter-combobox-option ask-sector-expand-row ask-sector-expand-row--section';
      el.setAttribute('aria-expanded', expandedSections.has(secKey) ? 'true' : 'false');
      el.setAttribute('data-expand-section', secKey);
      var iconS = document.createElement('span');
      iconS.className = 'ask-sector-expand-icon';
      iconS.setAttribute('aria-hidden', 'true');
      el.appendChild(iconS);
      el.appendChild(document.createTextNode(secLabel));
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        toggleSection(secKey);
      });
      return el;
    }

    function toggleMacro(indId) {
      if (expandedMacros.has(indId)) expandedMacros.delete(indId);
      else expandedMacros.add(indId);
      renderGrouped();
      if (open) {
        var vis = visibleOptions();
        var idx = vis.findIndex(function (el) {
          return el.getAttribute('data-expand-macro') === indId;
        });
        highlight(idx >= 0 ? idx : 0);
      }
    }

    function toggleSection(secKey) {
      if (expandedSections.has(secKey)) expandedSections.delete(secKey);
      else expandedSections.add(secKey);
      renderGrouped();
      if (open) {
        var vis = visibleOptions();
        var idx = vis.findIndex(function (el) {
          return el.getAttribute('data-expand-section') === secKey;
        });
        highlight(idx >= 0 ? idx : 0);
      }
    }

    function visibleOptions() {
      return Array.from(list.querySelectorAll('[role="option"]')).filter(function (el) {
        if (el.classList.contains('filter-combobox-option--hint')) return false;
        var n = el.parentElement;
        while (n && n !== list) {
          if (n.classList && n.classList.contains('hidden')) return false;
          n = n.parentElement;
        }
        return true;
      });
    }

    function renderFlatFiltered() {
      list.classList.remove('filter-combobox-list--ask-sector-grouped');
      optIdSeq = 0;
      var opts = filterFlat(input.value);
      list.innerHTML = '';
      activeIndex = -1;
      if (!opts.length) {
        var h = document.createElement('div');
        h.className = 'filter-combobox-option filter-combobox-option--hint';
        h.setAttribute('role', 'presentation');
        h.textContent = 'No matches';
        list.appendChild(h);
        return;
      }
      opts.forEach(function (opt) {
        var el = makeOptionEl(opt.label, opt.label, opt.id);
        el.classList.add('filter-combobox-option--ask-sector-path');
        list.appendChild(el);
      });
    }

    function renderGrouped() {
      list.classList.add('filter-combobox-list--ask-sector-grouped');
      optIdSeq = 0;
      list.innerHTML = '';
      activeIndex = -1;
      var sep = ASK_SECTOR_PATH_SEP;

      var gRow = flatRows.find(function (x) {
        return x.id === 'GENERAL';
      });
      if (gRow) {
        var gEl = makeOptionEl(gRow.label, gRow.label, 'GENERAL');
        gEl.classList.add('ask-sector-leaf--general');
        list.appendChild(gEl);
      }

      (tree.industries || []).forEach(function (ind) {
        var indId = ind.id;
        var indLabel = String(ind.label || '').trim();
        var macroWrap = document.createElement('div');
        macroWrap.className = 'ask-sector-macro';
        macroWrap.setAttribute('role', 'presentation');

        var macroExpand = makeMacroExpandRow(indId, indLabel);

        var macroPanel = document.createElement('div');
        macroPanel.className = 'ask-sector-expand-panel';
        if (!expandedMacros.has(indId)) macroPanel.classList.add('hidden');

        (ind.sections || []).forEach(function (letter) {
          var sectionRow = byId[letter];
          if (!sectionRow) return;
          var secKey = indId + ':' + letter;
          var secLabel = String(sectionRow.label || '').trim();
          var secWrap = document.createElement('div');
          secWrap.className = 'ask-sector-section';
          secWrap.setAttribute('role', 'presentation');

          var secExpand = makeSectionExpandRow(secKey, secLabel);

          var secPanel = document.createElement('div');
          secPanel.className = 'ask-sector-expand-panel ask-sector-expand-panel--section';
          if (!expandedSections.has(secKey)) secPanel.classList.add('hidden');

          var wholeFull = indLabel + sep + secLabel + sep + 'Whole ISIC section';
          secPanel.appendChild(
            makeOptionEl(wholeFull, 'Whole ISIC section (broader framing)', letter)
          );

          var groups = tree.sectorGroups[letter];
          if (groups) {
            groups.forEach(function (g) {
              (g.divisionIds || []).forEach(function (did) {
                var divRow = byId[did];
                if (!divRow) return;
                var gLabel = String(g.label || '').trim();
                var divShort = String(divRow.label || '').trim();
                var full = indLabel + sep + secLabel + sep + gLabel + sep + divShort;
                secPanel.appendChild(makeOptionEl(full, divShort, did));
              });
            });
          }

          secWrap.appendChild(secExpand);
          secWrap.appendChild(secPanel);
          macroPanel.appendChild(secWrap);
        });

        macroWrap.appendChild(macroExpand);
        macroWrap.appendChild(macroPanel);
        list.appendChild(macroWrap);
      });
    }

    function renderList() {
      if (isSearchMode()) {
        renderFlatFiltered();
      } else {
        expandAncestorsForSelectedId(select.value);
        renderGrouped();
      }
    }

    function pick(value, fullLabel) {
      select.value = value;
      input.value = fullLabel;
      setOpen(false);
      activeIndex = -1;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function highlight(idx) {
      var items = visibleOptions();
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
      var items = visibleOptions();
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
      var r = flatRows.find(function (x) {
        return x.id === select.value;
      });
      input.value = r ? r.label : '';
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
      var items = visibleOptions();
      if (e.key === 'Escape') {
        setOpen(false);
        syncFromSelect();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) openList();
        else if (items.length) {
          highlight(Math.min(activeIndex + 1, items.length - 1));
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) openList();
        else if (items.length) {
          highlight(Math.max(activeIndex - 1, 0));
        }
        return;
      }
      if (e.key === 'Enter') {
        if (open && activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          var el = items[activeIndex];
          var exM = el.getAttribute('data-expand-macro');
          var exS = el.getAttribute('data-expand-section');
          if (exM) {
            toggleMacro(exM);
            return;
          }
          if (exS) {
            toggleSection(exS);
            return;
          }
          pick(el.getAttribute('data-value'), el.getAttribute('data-full-label') || el.textContent);
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
  }

  /**
   * One searchable combobox: rows are { id, label, isicDivision?, searchBlob }.
   */
  function bindAskIndustrySectorComboboxRows(rows, placeholder) {
    var select = document.getElementById('askIndustrySector');
    var input = document.getElementById('askIndustrySectorInput');
    var list = document.getElementById('askIndustrySectorList');
    var toggle = document.getElementById('askIndustrySectorToggle');
    if (!select || !input || !list || !toggle) return;
    if (list.dataset.askSectorComboReady === '1') return;
    if (!Array.isArray(rows) || rows.length === 0) return;
    list.dataset.askSectorComboReady = '1';

    select.innerHTML = '';
    rows.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.id;
      o.textContent = r.label;
      select.appendChild(o);
    });
    select.value = 'GENERAL';
    var g = rows.find(function (x) {
      return x.id === 'GENERAL';
    });
    input.value = g ? g.label : '';
    if (placeholder) input.placeholder = placeholder;

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
      if (!t) return rows.slice();
      return rows.filter(function (r) {
        if ((r.label || '').toLowerCase().indexOf(t) !== -1) return true;
        if (String(r.id).toLowerCase().indexOf(t) !== -1) return true;
        if (r.isicDivision != null && String(r.isicDivision).toLowerCase().indexOf(t) !== -1) return true;
        if ((r.searchBlob || '').toLowerCase().indexOf(t) !== -1) return true;
        return false;
      });
    }

    function renderList() {
      var opts = filterOpts(input.value);
      list.innerHTML = '';
      activeIndex = -1;
      if (!opts.length) {
        var hint = document.createElement('div');
        hint.className = 'filter-combobox-option filter-combobox-option--hint';
        hint.setAttribute('role', 'presentation');
        hint.textContent = 'No matches';
        list.appendChild(hint);
        return;
      }
      opts.forEach(function (opt, i) {
        var row = document.createElement('div');
        row.setAttribute('role', 'option');
        row.id = 'askIndustrySectorList-opt-' + i;
        row.className = 'filter-combobox-option filter-combobox-option--ask-sector-path';
        row.setAttribute('data-value', opt.id);
        row.setAttribute('data-full-label', opt.label);
        row.textContent = opt.label;
        row.addEventListener('mousedown', function (e) {
          e.preventDefault();
          pick(opt.id, opt.label);
        });
        list.appendChild(row);
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
      var s = rows.find(function (x) {
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
          pick(
            el.getAttribute('data-value'),
            el.getAttribute('data-full-label') || el.textContent
          );
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
  }

  function initAskIndustrySectorComboboxLegacy(sectors) {
    if (!Array.isArray(sectors) || sectors.length === 0) sectors = getBuiltInIsicSectorFallback();
    var rows = sectorRowsFromFlatSectors(sectors);
    bindAskIndustrySectorComboboxRows(
      rows,
      'Search ISIC sections A–U, divisions 01–99, or General…'
    );
  }

  function initAskIndustrySectorHierarchicalCombobox(sectors, tree) {
    if (!Array.isArray(sectors) || sectors.length === 0) sectors = getBuiltInIsicSectorFallback();
    bindAskIndustrySectorGroupedCombobox(sectors, tree);
  }

  function initAskIndustrySectorCombobox() {
    var select = document.getElementById('askIndustrySector');
    var list = document.getElementById('askIndustrySectorList');
    if (!select) return;
    if (list && list.dataset.askSectorComboReady === '1') return;

    loadIndustrySectorsForAsk().then(function (pack) {
      if (list && list.dataset.askSectorComboReady === '1') return;
      var sectors = pack && pack.sectors ? pack.sectors : [];
      var tree = pack && pack.tree ? pack.tree : null;
      if (!Array.isArray(sectors) || sectors.length === 0) sectors = getBuiltInIsicSectorFallback();

      if (tree && Array.isArray(tree.industries) && tree.sectorGroups && typeof tree.sectorGroups === 'object') {
        initAskIndustrySectorHierarchicalCombobox(sectors, tree);
      } else {
        initAskIndustrySectorComboboxLegacy(sectors);
      }
    });
  }

  function initChaptersFilterComboboxes() {
    var configs = [
      {
        select: chaptersFilterCategory,
        inputId: 'chaptersFilterCategoryInput',
        listId: 'chaptersFilterCategoryList',
        toggleId: 'chaptersFilterCategoryToggle',
        placeholder: regulationFilterPlaceholder('categories'),
        getOptions: function (q) {
          return chaptersFilterComboboxSearchCategories(q);
        }
      },
      {
        select: chaptersFilterSubcategory,
        inputId: 'chaptersFilterSubcategoryInput',
        listId: 'chaptersFilterSubcategoryList',
        toggleId: 'chaptersFilterSubcategoryToggle',
        placeholder: regulationFilterPlaceholder('subcategories'),
        getOptions: function (q) {
          return chaptersFilterComboboxSearchSubcategories(q);
        }
      },
      {
        select: chaptersFilterChapter,
        inputId: 'chaptersFilterChapterInput',
        listId: 'chaptersFilterChapterList',
        toggleId: 'chaptersFilterChapterToggle',
        placeholder: regulationFilterPlaceholder('chapters'),
        getOptions: function (q) {
          return chaptersFilterComboboxSearchChapters(q);
        }
      },
      {
        select: chaptersFilterArticle,
        inputId: 'chaptersFilterArticleInput',
        listId: 'chaptersFilterArticleList',
        toggleId: 'chaptersFilterArticleToggle',
        placeholder: regulationFilterPlaceholder('articles'),
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
    var regId = currentRegulation.id;
    var requestId = ++loadChaptersRequestId;
    if (chaptersArticlesGrouped) {
      chaptersArticlesGrouped.setAttribute('aria-busy', 'true');
      chaptersArticlesGrouped.innerHTML =
        '<p class="docs-browser-loading" role="status"><span class="docs-browser-loading-pulse" aria-hidden="true"></span> Loading ' + escapeHtml(regulationShortLabel()) + ' chapters and articles…</p>';
    }
    Promise.all([
      get('/api/chapters'),
      get('/api/articles'),
      get('/api/chapter-summaries').catch(function () {
        return {};
      })
    ]).then(function (results) {
      if (requestId !== loadChaptersRequestId || currentRegulation.id !== regId) return;
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
    }).catch(function () {
      if (requestId !== loadChaptersRequestId || currentRegulation.id !== regId) return;
      if (chaptersArticlesGrouped) {
        chaptersArticlesGrouped.setAttribute('aria-busy', 'false');
        chaptersArticlesGrouped.innerHTML =
          '<p class="docs-browser-loading docs-browser-loading--error" role="alert">Could not load ' +
          escapeHtml(regulationShortLabel()) +
          ' chapters and articles. Check your connection and try again.</p>';
      }
    });
  }

  function fillChaptersSubcategoryDropdown(filterChapterNumber) {
    if (!chaptersFilterSubcategory) return;
    const data = window.__chaptersData;
    if (!data || !data.topicIdsByChapter) return;
    const selected = chaptersFilterSubcategory.value;
    chaptersFilterSubcategory.innerHTML = '<option value="">All ' + regulationShortLabel() + ' sub-categories</option>';
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
    const filterChapter =
      categoryVal !== ''
        ? normalizeChapterNumber(categoryVal)
        : chapterVal !== ''
          ? normalizeChapterNumber(chapterVal)
          : null;
    const filterArticle =
      chaptersFilterArticle && chaptersFilterArticle.value !== ''
        ? parseInt(chaptersFilterArticle.value, 10)
        : null;
    const filterSubcategoryAfter = getChaptersFilterSubcategoryValue();

    const byChapter = new Map();
    chapters.forEach(function (ch) {
      byChapter.set(normalizeChapterNumber(ch.number), { chapter: ch, articles: [] });
    });
    articles.forEach(function (art) {
      if (art.chapter == null) return;
      var artChapter = normalizeChapterNumber(art.chapter);
      if (filterChapter != null && artChapter !== filterChapter) return;
      if (filterArticle != null && art.number !== filterArticle) return;
      if (filterSubcategoryAfter && (!articleTopics[art.number] || articleTopics[art.number].indexOf(filterSubcategoryAfter) === -1)) return;
      var entry = byChapter.get(artChapter);
      if (entry) entry.articles.push(art);
    });

    const totalArticlesByChapter = new Map();
    chapters.forEach(function (ch) {
      var chN = normalizeChapterNumber(ch.number);
      var n = articles.filter(function (a) {
        return normalizeChapterNumber(a.chapter) === chN;
      }).length;
      totalArticlesByChapter.set(chN, n);
    });

    const chapterSumm = window.__chapterSummaries || normalizeChapterSummariesMap(null);

    var profile = getRegProfile();
    var sn = profile.shortName;
    var site = profile.infoSiteName;
    var kindsCh = provisionKindLabels();
    var articleNoun = kindsCh.articles;
    var articleNounOne = kindsCh.article.toLowerCase();
    let html = '';
    const sortedChapters = chapters.slice();
    sortedChapters.forEach(function (ch) {
      var chKey = normalizeChapterNumber(ch.number);
      const entry = byChapter.get(chKey);
      const list = entry ? entry.articles.sort((a, b) => a.number - b.number) : [];
      if (list.length === 0) return;
      var totalInCh = totalArticlesByChapter.get(chKey) || list.length;
      var countLabel =
        list.length === totalInCh
          ? list.length + ' ' + sn + ' ' + (list.length !== 1 ? articleNoun : articleNounOne) + ' in this section'
          : 'Showing ' + list.length + ' of ' + totalInCh + ' ' + sn + ' ' + articleNoun + ' (filters applied)';
      var chapterUrl =
        ch.sourceUrl ||
        ch.gdprInfoChapterUrl ||
        profile.infoBaseUrl + '/chapter/' + ch.number + '/';
      var summaryText = getChapterSummaryForSection(ch.number, chapterSumm);
      if (!summaryText) {
        summaryText =
          'This ' + sn + ' chapter covers ' + kindsCh.article + 's ' +
          ch.articleRange +
          ' (' +
          ch.title +
          '). Open a card below for full text, or use the ' + site + ' link for the official chapter page.';
      }
      html += '<section class="chapters-group-section chapters-group-section--panel" data-chapter="' + ch.number + '" role="region" aria-label="' + escapeHtml(sn) + ' Chapter ' + ch.roman + '">';
      html += '<header class="chapters-group-banner">';
      html += '<h3 class="chapters-group-heading"><span class="chapters-group-roman" aria-hidden="true">' + ch.roman + '</span> <span class="chapters-group-heading-text">' + escapeHtml(sn) + ' Chapter ' + ch.roman + ' – ' + escapeHtml(ch.title) + '</span></h3>';
      html += '<p class="chapters-group-meta">' + escapeHtml(sn) + ' ' + escapeHtml(kindsCh.article) + 's ' + escapeHtml(ch.articleRange) + '</p>';
      html += '<p class="chapters-group-summary" data-chapter-summary="' + ch.number + '">' + escapeHtml(summaryText) + '</p>';
      html += '<p class="chapters-group-count" role="status">' + escapeHtml(countLabel) + '</p>';
      html +=
        '<p class="chapters-group-source"><a class="chapters-group-source-link" href="' +
        escapeHtml(chapterUrl) +
        '" target="_blank" rel="noopener noreferrer">' + escapeHtml(sn) + ' Chapter ' +
        escapeHtml(ch.roman) +
        ' on ' + escapeHtml(site) + '</a> · <span class="chapters-group-source-hint">Authoritative chapter outline and navigation</span></p>';
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
          excerptHtml = escapeHtml('Open to read the full ' + articleNounOne + ' text.');
        }
        var ariaOpen = 'Open ' + sn + ' ' + kindsCh.article + ' ' + art.number + (disp ? ': ' + disp : '');
        html += '<li class="item-card" role="listitem">';
        html +=
          '<a href="' +
          buildDocRouteHash('article', art.number) +
          '" class="item-card-link" data-type="article" data-number="' +
          art.number +
          '" aria-label="' +
          escapeHtml(ariaOpen) +
          '">';
        html += '<div class="item-card-main">';
        html += '<span class="item-card-num"><span class="item-card-num-label">' + escapeHtml(kindsCh.articleShort) + '</span> <span class="item-card-num-value">' + art.number + '</span></span>';
        html += '<span class="item-card-title">' + titleText + '</span>';
        html += '<p class="item-card-excerpt">' + excerptHtml + '</p>';
        html += '</div><span class="item-card-arrow" aria-hidden="true"></span></a></li>';
      });
      html += '</ul></section>';
    });
    if (!html) {
      var filtersActive = chaptersFiltersAreActive();
      if (!articles.length) {
        html =
          '<div class="chapters-filter-empty chapters-filter-empty--no-data" role="status">' +
          '<p class="chapters-filter-empty-title">No ' +
          escapeHtml(sn) +
          ' articles loaded yet</p>' +
          '<p class="chapters-filter-empty-lead">The corpus may be missing on this deployment. Use <strong>Refresh sources</strong> in the header (with ' +
          escapeHtml(profile.infoSiteName) +
          ' / EUR-Lex reachable) to load consolidated text.</p></div>';
      } else if (filtersActive) {
        var filterDesc = describeChaptersActiveFilters().join(' · ');
        html =
          '<div class="chapters-filter-empty chapters-filter-empty--filters" role="status">' +
          '<p class="chapters-filter-empty-title">No ' +
          escapeHtml(sn) +
          ' ' +
          escapeHtml(articleNoun) +
          ' match your filters</p>' +
          '<p class="chapters-filter-empty-lead">Active: <strong>' +
          escapeHtml(filterDesc) +
          '</strong>. Open <strong>Filters</strong> to adjust, or clear below to show all ' +
          escapeHtml(articleNoun) +
          '.</p>' +
          '<button type="button" class="btn btn-primary btn-sm chapters-filter-empty-clear" id="chaptersEmptyClearFilters">Clear all filters</button></div>';
        var toggle = document.getElementById('chaptersFiltersToggle');
        var panel = document.getElementById('chaptersFiltersPanel');
        if (toggle && panel && window.matchMedia('(max-width: 899px)').matches) {
          panel.hidden = false;
          toggle.setAttribute('aria-expanded', 'true');
          toggle.setAttribute('data-user-expanded', 'true');
        }
      } else {
        html =
          '<div class="chapters-filter-empty" role="status">' +
          '<p class="chapters-filter-empty-title">No ' +
          escapeHtml(sn) +
          ' articles to display</p>' +
          '<p class="chapters-filter-empty-lead">Try <strong>Refresh sources</strong> or pick another regulation.</p></div>';
      }
    }
    chaptersArticlesGrouped.innerHTML = html;
    var emptyClear = document.getElementById('chaptersEmptyClearFilters');
    if (emptyClear) {
      emptyClear.addEventListener('click', function () {
        resetChaptersFilters();
        applyChaptersFilters();
      });
    }
    chaptersArticlesGrouped.querySelectorAll('a.item-card-link[data-type="article"]').forEach(a => {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openArticle(parseInt(this.dataset.number, 10));
      });
    });
    chaptersFilterComboboxesSyncInputsFromSelects();
    updateChaptersFiltersToggleMeta();
  }

  function openArticle(number, opts) {
    applyCitationNavOpts(opts);
    if (getReaderViewMode() === 'full') {
      openFullCorpus('article', number);
      return;
    }
    var regId = currentRegulation.id;
    get('/api/articles/' + number)
      .then(function (data) {
        if (currentRegulation.id !== regId) return null;
        return resolveSuitableRecitalsForArticle(number, data.suitableRecitals).then(function (suitableRecitals) {
          return { data: data, suitableRecitals: suitableRecitals };
        });
      })
      .then(function (bundle) {
        if (!bundle || currentRegulation.id !== regId) return;
        resetCitationSidebarPanels();
        var data = bundle.data;
        var suitableRecitals = bundle.suitableRecitals;
        var profile = getRegProfile();
        var rawText = (data.text || '').trim();
        detailContent.innerHTML = buildArticleDocumentHtml(data);
        var contentAsOfHtml = data.contentAsOf
          ? '<li class="content-as-of">Text as of ' + formatContentDate(data.contentAsOf) + ' (consolidated).</li>'
          : '<li class="content-as-of">Text not yet refreshed. Use Refresh sources to load the latest text.</li>';
        var infoArtUrl = data.sourceUrl || profile.articleUrl(data.number);
        var eurLexArt = data.eurLexUrl || profile.eurLexTxtUrl;
        citationLinks.innerHTML =
          contentAsOfHtml +
          '<li><a href="' + escapeHtml(infoArtUrl) + '" target="_blank" rel="noopener">' +
          escapeHtml(profile.infoSiteName) + ' – ' + escapeHtml(provisionKindLabels().article) + ' ' + data.number + '</a></li>' +
          '<li><a href="' + escapeHtml(eurLexArt) + '" target="_blank" rel="noopener">' +
          escapeHtml(officialSiteName(profile)) + ' – ' + escapeHtml(profile.eurLexLabel) + '</a></li>';
        updateCitationOfficialSourcesCount();
        currentDoc = {
          type: 'article',
          number: data.number,
          briefTitle: briefTitleForDoc('article', data)
        };
        populateRelatedDocsForCurrentDocument(currentDoc, rawText, {
          suitableRecitals: suitableRecitals
        });
        showSection(browseDetail);
        detailContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        focusDetailContentForReading();
      });
  }

  /** Official readable-site URLs for PDF export (per active regulation). */
  function resolveGdprInfoProvisionUrlForPdf(type, numStr) {
    var profile = getRegProfile();
    var n = parseInt(String(numStr), 10);
    if (isNaN(n) || n < 1) return '';
    if (type === 'recital') {
      if (n > regulationMaxRecitals()) return '';
      return profile.recitalUrl(n);
    }
    if (type === 'article') {
      if (n > regulationMaxArticles()) return '';
      return profile.articleUrl(n);
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
      /* In-app hashes (#/gdpr/article/1) and bare # must become absolute URLs in print. */
      if (
        href === '#' ||
        href === '' ||
        href.charAt(0) === '#' ||
        href.indexOf('javascript:') === 0
      ) {
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

  function appendPdfOfficialSourcesSection(wrap, opts) {
    var options = opts || {};
    var hasOfficial = citationLinks && citationLinks.children.length > 0;
    if (!hasOfficial) return;

    var refSection = document.createElement('section');
    refSection.className = 'pdf-export-references';

    var refPreface = document.createElement('div');
    refPreface.className = 'pdf-export-references-preface';

    var refH = document.createElement('h2');
    refH.className = 'pdf-export-references-title';
    refH.textContent = options.title || 'Official sources';

    var refLead = document.createElement('p');
    refLead.className = 'pdf-export-references-lead';
    refLead.textContent =
      options.lead ||
      ('Authoritative online sources for the consolidated text. Links open the corresponding pages on ' +
        getRegProfile().infoSiteName +
        ' where available.');
    refPreface.appendChild(refH);
    refPreface.appendChild(refLead);
    refSection.appendChild(refPreface);

    var hOff = document.createElement('h3');
    hOff.className = 'pdf-export-references-subtitle';
    hOff.textContent = 'Official sources and document freshness';
    refSection.appendChild(hOff);
    refSection.appendChild(
      cloneElementForPdfExport(citationLinks, 'pdf-export-ref-list pdf-export-ref-list--official')
    );
    wrap.appendChild(refSection);
  }

  /**
   * Build a print-oriented document matching the active reader mode:
   * - Page: current provision + official sources + related articles/recitals
   * - Full: entire articles or recitals corpus currently shown + official sources
   */
  function buildPdfExportElement() {
    if (!detailContent) return null;

    var wrap = document.createElement('div');
    wrap.className = 'pdf-export-root';

    var profile = getRegProfile();
    var isFullMode = getReaderViewMode() === 'full';
    var fullDoc = isFullMode ? detailContent.querySelector('.reader-full-doc') : null;

    var kicker = document.createElement('p');
    kicker.className = 'pdf-export-kicker';

    if (isFullMode) {
      if (!fullDoc) return null;
      wrap.classList.add('pdf-export-root--full');
      var fullKind =
        (fullDoc.getAttribute('data-kind') ||
          (currentDoc && currentDoc.type === 'recital' ? 'recital' : 'article'));
      kicker.textContent =
        profile.fullName +
        ' · Full ' +
        (fullKind === 'recital' ? 'recitals' : 'articles');
      wrap.appendChild(kicker);

      var fullClone = fullDoc.cloneNode(true);
      convertInAppLinksForPdfClone(fullClone);
      fullClone.classList.add('pdf-export-full-doc');
      fullClone.querySelectorAll('.is-current').forEach(function (el) {
        el.classList.remove('is-current');
      });
      fullClone.querySelectorAll('.reader-full-section').forEach(function (sec) {
        sec.classList.add('pdf-export-article');
      });

      var fullShell = document.createElement('div');
      fullShell.className = 'pdf-export-document pdf-export-document--full';
      fullShell.appendChild(fullClone);
      wrap.appendChild(fullShell);

      appendPdfOfficialSourcesSection(wrap, {
        title: 'Sources',
        lead:
          'Authoritative online sources for this consolidated ' +
          (fullKind === 'recital' ? 'recitals' : 'articles') +
          ' corpus. Related provision panels are omitted in Full export.'
      });
      return wrap;
    }

    kicker.textContent = profile.fullName;
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
      'Authoritative online sources for the consolidated text, plus related articles and recitals referenced from this provision. Links open the corresponding pages on ' +
      profile.infoSiteName +
      ' where available.';
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
      hA.textContent = 'Related ' + regulationShortLabel() + ' articles';
      refSection.appendChild(hA);
      refSection.appendChild(cloneElementForPdfExport(relatedArticles, 'pdf-export-ref-list pdf-export-ref-list--articles'));
    }

    if (hasRecs) {
      var hR = document.createElement('h3');
      hR.className = 'pdf-export-references-subtitle';
      hR.textContent = 'Related ' + regulationShortLabel() + ' recitals';
      refSection.appendChild(hR);
      refSection.appendChild(cloneElementForPdfExport(relatedRecitals, 'pdf-export-ref-list pdf-export-ref-list--recitals'));
    }

    wrap.appendChild(refSection);
    return wrap;
  }

  function setExportPdfButtonLabel(label) {
    if (!btnExportPdf) return;
    var full = btnExportPdf.querySelector('.btn-export-label');
    var short = btnExportPdf.querySelector('.btn-export-label-short');
    if (full) full.textContent = label;
    if (short) short.textContent = label === 'Export PDF' ? 'PDF' : label;
    if (!full && !short) btnExportPdf.textContent = label;
  }

  /**
   * Export as PDF via the browser print pipeline (vector / native pagination at line boundaries).
   * html2pdf+html2canvas rasterizes a tall bitmap and slices it into pages, which chops lines — avoided here.
   */
  function exportCurrentDocumentToPdf() {
    if (!currentDoc) return;
    var mount = document.getElementById('pdfPrintMount');
    if (!mount) return;

    var exportEl = buildPdfExportElement();
    if (!exportEl) {
      /* Full view still loading — avoid printing an empty/partial shell. */
      if (getReaderViewMode() === 'full') {
        setExportPdfButtonLabel('Still loading…');
        setTimeout(function () {
          setExportPdfButtonLabel('Export PDF');
        }, 1600);
      }
      return;
    }

    mount.innerHTML = '';
    mount.appendChild(exportEl);
    document.body.classList.add('is-pdf-export-print');

    var cleaned = false;
    function cleanupPdfExportPrint() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('is-pdf-export-print');
      mount.innerHTML = '';
      btnExportPdf.disabled = false;
      setExportPdfButtonLabel('Export PDF');
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
    setExportPdfButtonLabel('Preparing…');

    var runPrint = function () {
      setExportPdfButtonLabel('Print dialog…');
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
    /* Prefer activateMainViewOnly — clicking the Browse tab syncs #/browse first and
       races with the segment hash (intermittent bounce back to the home grid). */
    if (viewBrowse && !viewBrowse.classList.contains('active')) {
      activateMainViewOnly('browse');
    }
    if (seg === 'recitals') {
      showSection(browseRecitals);
      loadRecitals();
    } else if (seg === 'chapters') {
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

  initBrowseWelcomeGrid();
  var browseWelcomeGrid = document.getElementById('browseWelcomeGrid');
  if (browseWelcomeGrid) {
    function selectWelcomeCardRegulation(card) {
      if (!card) return;
      var cardRegId = card.getAttribute('data-regulation-id');
      var match = findRegulationInCatalog(cardRegId);
      if (match) setCurrentRegulation(match);
    }

    browseWelcomeGrid.addEventListener('click', function (e) {
      var quick = e.target.closest('[data-browse-quick]');
      if (quick) {
        var regId = quick.getAttribute('data-regulation-id');
        var seg = quick.getAttribute('data-browse-quick');
        if (regId) activateBrowseForRegulation(regId, seg);
        return;
      }
      var card = e.target.closest('.browse-welcome-card[data-regulation-id]');
      if (card && !e.target.closest('a, button')) {
        selectWelcomeCardRegulation(card);
      }
    });

    browseWelcomeGrid.addEventListener('keydown', function (e) {
      var card = e.target.closest('.browse-welcome-card[data-regulation-id]');
      if (!card || e.target !== card) return;
      var cards = Array.prototype.slice.call(
        browseWelcomeGrid.querySelectorAll('.browse-welcome-card[data-regulation-id]')
      ).filter(function (c) {
        var regionEl = c.closest('.browse-welcome-region');
        return !regionEl || !regionEl.hidden;
      });
      var index = cards.indexOf(card);
      var next = null;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectWelcomeCardRegulation(card);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = cards[index + 1];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = cards[index - 1];
      else if (e.key === 'Home') next = cards[0];
      else if (e.key === 'End') next = cards[cards.length - 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
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
    if (viewBrowse && !viewBrowse.classList.contains('active')) {
      activateMainViewOnly('browse');
    }
    const openOpts = citationReturn ? { citationReturn: citationReturn } : {};
    if (type === 'recital') openRecital(num, openOpts);
    else if (type === 'article') openArticle(num, openOpts);
  });

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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
    var maxArt = regulationMaxArticles();
    var maxRec = regulationMaxRecitals();

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
    text.replace(/\b(?:Articles?|Arts?\.)\s*(\d{1,3})\s*(?:to|[–-])\s*(\d{1,3})\b/gi, function (_, a, b) {
      addRange(articles, a, b, 1, maxArt);
      return _;
    });
    // Recital ranges
    text.replace(/\bRecitals?\s*(\d{1,3})\s*(?:to|[–-])\s*(\d{1,3})\b/gi, function (_, a, b) {
      addRange(recitals, a, b, 1, maxRec);
      return _;
    });

    // Article lists: "9, 10", "9, Article 10", "46 or 47", etc.
    var articleListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Articles?\\s+)?';
    var articleListTail = '(?:' + articleListSep + '\\d{1,3})+';
    text.replace(new RegExp('\\bArticles?\\s+((?:\\d{1,3})' + articleListTail + ')\\b', 'gi'), function (_, list) {
      addList(articles, list, 1, maxArt);
      return _;
    });
    text.replace(new RegExp('\\bArts?\\.\\s*((?:\\d{1,3})' + articleListTail + ')\\b', 'gi'), function (_, list) {
      addList(articles, list, 1, maxArt);
      return _;
    });
    // Recital lists (incl. "Recital 5, Recital 6")
    var recitalListSep = '(?:,\\s*|\\s+and\\s+|\\s+or\\s+|\\s*&\\s*)(?:Recitals?\\s+)?';
    var recitalListTail = '(?:' + recitalListSep + '\\d{1,3})+';
    text.replace(new RegExp('\\bRecitals?\\s+((?:\\d{1,3})' + recitalListTail + ')\\b', 'gi'), function (_, list) {
      addList(recitals, list, 1, maxRec);
      return _;
    });

    // Singles (incl. Article 9(2)(a), broken "Article 9(2")
    text.replace(
      new RegExp('\\b(?:Article|Articles)\\s+(\\d{1,3})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi'),
      function (_, n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= maxArt) articles.add(x);
        return _;
      }
    );
    text.replace(
      new RegExp('\\bArts?\\.\\s*(\\d{1,3})(?:' + ARTICLE_SUBREF_SUFFIX_SRC + ')?', 'gi'),
      function (_, n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= maxArt) articles.add(x);
        return _;
      }
    );
    text.replace(/\bRecital\s*\(?\s*(\d{1,3})\s*\)?\b/gi, function (_, n) {
      var y = parseInt(n, 10);
      if (!isNaN(y) && y >= 1 && y <= maxRec) recitals.add(y);
      return _;
    });

    return { articles: articles, recitals: recitals };
  }

  function renderRelatedDocsListItems(items, kind) {
    var kinds = provisionKindLabels();
    var emptyMsg =
      kind === 'article'
        ? 'No related ' + kinds.articles + ' (none cited here and no suggestions for this ' + kinds.recital.toLowerCase() + ').'
        : 'No related ' + kinds.recitals + ' (none cited here and no suggestions for this ' + kinds.article.toLowerCase() + ').';
    if (!items || !items.length) return '<li class="related-panel-empty">' + emptyMsg + '</li>';
    return items.map(function (it) {
      var numLabel =
        it.type === 'recital' ? kinds.recital + ' ' + it.number : kinds.articleShort + ' ' + it.number;
      var topicRaw =
        it.type === 'recital'
          ? parseRecitalTopicTitle(it.title, it.number) || ''
          : String(it.title || '').trim();
      var topicShort = shortenTitleForRelatedPanel(topicRaw, it.type === 'recital' ? 56 : 50);
      var desc = it.desc ? escapeHtml(it.desc) : '';
      var openTitle =
        'Open ' + (it.type === 'recital' ? kinds.recital : kinds.article) + ' ' + it.number + ' in this app';
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
        '<a href="' +
        buildDocRouteHash(it.type, it.number) +
        '" class="app-goto-doc regulation-citation citation-in-app related-doc-link" data-type="' +
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
      ba.setAttribute('aria-label', relatedPanelBadgeAriaLabel('article', articleCount));
    }
    if (br) {
      br.textContent = String(recitalCount);
      br.classList.toggle('is-empty', recitalCount === 0);
      br.setAttribute('aria-label', relatedPanelBadgeAriaLabel('recital', recitalCount));
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

    var maxRec = regulationMaxRecitals();
    var maxArt = regulationMaxArticles();
    if (crossRefOpts && doc.type === 'article' && Array.isArray(crossRefOpts.suitableRecitals)) {
      crossRefOpts.suitableRecitals.forEach(function (n) {
        var y = parseInt(n, 10);
        if (!isNaN(y) && y >= 1 && y <= maxRec) extracted.recitals.add(y);
      });
    }
    if (crossRefOpts && doc.type === 'recital' && Array.isArray(crossRefOpts.suitableArticles)) {
      crossRefOpts.suitableArticles.forEach(function (n) {
        var x = parseInt(n, 10);
        if (!isNaN(x) && x >= 1 && x <= maxArt) extracted.articles.add(x);
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
        ? '<li class="related-panel-loading" role="status">Loading ' +
          escapeHtml(getRegProfile().legalLabel) +
          ' articles…</li>'
        : renderRelatedDocsListItems([], 'article');
    relatedRecitals.innerHTML =
      recRefs.length
        ? '<li class="related-panel-loading" role="status">Loading ' +
          escapeHtml(getRegProfile().legalLabel) +
          ' recitals…</li>'
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
      '<a href="' +
      buildDocRouteHash(type, num) +
      '" class="app-goto-doc regulation-citation citation-in-app" data-type="' +
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
  function gdprArticleMax() {
    return regulationMaxArticles();
  }

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
        if (n >= 1 && n <= gdprArticleMax()) {
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
        if (n >= 1 && n <= gdprArticleMax()) {
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
    var maxArt = regulationMaxArticles();
    var maxRec = regulationMaxRecitals();
    text = normalizeSpaceEntitiesForCitationPlainText(text);
    /* EUR-Lex / ETL glues: "2Article 5", "Article4", "Art.6", "3Recital 12" — need separators for \b matchers. */
    text = text.replace(/\b(Articles?)(\d{1,3})\b/gi, '$1 $2');
    text = text.replace(/\b(Recitals?)(\d{1,3})\b/gi, '$1 $2');
    text = text.replace(/\b(Arts?\.)(\d{1,3})\b/gi, '$1 $2');
    text = text.replace(/(\d)(Articles?)\b/gi, '$1 $2');
    text = text.replace(/(\d)(Recitals?)\b/gi, '$1 $2');
    text = text.replace(/(\d)(Arts?\.)/gi, '$1 $2');
    var cand = [];
    function pushCandidate(start, end, type, num) {
      var n = parseInt(num, 10);
      if (type === 'recital') {
        if (n < 1 || n > maxRec) return;
      } else {
        if (n < 1 || n > maxArt) return;
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
      if (a < 1 || a > maxArt || b < 1 || b > maxArt) return;
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
      if (a < 1 || a > maxRec || b < 1 || b > maxRec) return;
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
        stripEurLexClauseNumberMarkers(escapeHtml(stripParentheticalRecitalsFromArticlePlain(txt)))
      );
      return '<li><span class="li-marker">(' + marker + ')</span><span class="li-text">' + safe + '</span></li>';
    }).join('');
    return '<ul class="letter-list">' + lis + '</ul>';
  }

  /** One escaped + footnoted line for article bodies (no “Recital N” chrome — see fmtRecitalLine). */
  function fmtArticleLine(raw) {
    var t = stripParentheticalRecitalsFromArticlePlain(String(raw || '').trim());
    t = stripCompoundEnumerationAtLineStarts(t);
    return injectRegulationCitationLinks(stripEurLexClauseNumberMarkers(escapeHtml(t)));
  }

  /** Recital documents: same as article line plus optional recital-ref line breaks for cross-refs. */
  function fmtRecitalLine(raw) {
    var t = stripCompoundEnumerationAtLineStarts(String(raw || '').trim());
    return injectRegulationCitationLinks(formatRecitalRefs(stripEurLexClauseNumberMarkers(escapeHtml(t))));
  }

  function fmtArticleMultiline(raw) {
    return String(raw || '')
      .split(/\n+/)
      .map(function (ln) { return ln.trim(); })
      .filter(Boolean)
      .map(fmtArticleLine)
      .join('<br>');
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
          stripEurLexClauseNumberMarkers(escapeHtml(stripParentheticalRecitalsFromArticlePlain(footnoteParts.join('\n'))))
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
    if (tail.length >= 2 && looksLikeExplicitParenLetterLines(tail)) {
      return (
        '<div class="para-text">' + fmtArticleLine(head) + '</div>' + renderExplicitParenLetterLines(tail)
      );
    }
    if (tail.length >= 1 && /^\(\d+\)\s/.test(String(tail[0] || '').trim())) {
      return '<div class="para-text">' + fmtArticleLine(head) + '</div>' + renderDocBulletList(tail);
    }

    return '<div class="para-text">' + fmtArticleMultiline(trimmed) + '</div>';
  }

  function renderManualNumberedParagraphs(textToParse) {
    var normalized = String(textToParse || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    normalized = normalized.replace(/(\d{1,2})\.([A-Za-zÀ-ŸÄÖÆØ])/g, '$1. $2');
  /* Split before numbered paragraphs (Data Act Law / AI Act Law / GDPR-Info "N. " blocks). */
    var segments = normalized.split(/(?=\n[ \t\u00a0\u202f]*\d+\.\s+)/).filter(Boolean);
    if (segments.length <= 1 && /^\s*\d+\.\s/.test(normalized.trim())) {
      segments = normalized
        .trim()
        .split(/(?=\d+\.\s)/)
        .filter(function (s) { return s.trim(); });
    }
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
        stripEurLexClauseNumberMarkers(escapeHtml(stripParentheticalRecitalsFromArticlePlain(introParts.join('\n\n'))))
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
        if (askAnswerStatus) {
          askAnswerStatus.textContent =
            'Retrieving ' + regulationShortLabel() + ' sources and synthesizing…';
        }
    }
    var sectorSel = document.getElementById('askIndustrySector');
    var sectorId = sectorSel && sectorSel.value ? sectorSel.value : 'GENERAL';
    post('/api/answer', withByokApiKeys({ query: q, includeWeb: true, industrySectorId: sectorId }))
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
              'Sector context for this answer: ' +
              String(is.label).trim() +
              (is.isicDivision ? ' (ISIC Rev.4 division ' + String(is.isicDivision).trim() + ')' : '') +
              '.';
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
        if (askAnswerStatus) {
          askAnswerStatus.textContent = hasEffectiveAskLlmKeys()
            ? 'Answer failed (check API keys or server logs)'
            : 'Answer failed — configure API keys in the header or server .env';
        }
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
    var escaped = formatRecitalRefs(stripEurLexClauseNumberMarkers(escapeHtml(raw)));
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
          '<a href="' +
          buildDocRouteHash(s.type, s.number) +
          '" class="app-goto-doc from-ask citation-link citation-chip" data-type="' +
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
    var regProf = getRegProfile();
    regs.forEach(function (s, idx) {
      var label =
        s.type === 'recital'
          ? getRecitalDisplayTitle({ number: s.number, title: s.title }) || regProf.recitalHeading(s.number)
          : getArticleDisplayTitle({ number: s.number, title: s.title }) +
            (s.chapterTitle ? ' · ' + s.chapterTitle : '');
      var li = document.createElement('li');
      li.className = 'ask-relevant-doc-card';
      li.setAttribute('role', 'listitem');
      li.style.setProperty('--stagger', String(idx));
      var badge =
        s.type === 'recital'
          ? '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--recital">' +
            escapeHtml(provisionKindLabels().recital) +
            '</span>'
          : '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--article">' +
            escapeHtml(provisionKindLabels().article) +
            '</span>';
      li.innerHTML =
        badge +
        '<div class="ask-relevant-doc-card-body">' +
        '<span class="ask-relevant-doc-label">' +
        escapeHtml(label) +
        '</span>' +
        '<div class="ask-relevant-doc-links">' +
        '<a href="' +
        buildDocRouteHash(s.type, s.number) +
        '" class="app-goto-doc from-ask link-in-app" data-type="' +
        escapeHtml(s.type) +
        '" data-number="' +
        s.number +
        '">View in app</a>' +
        (s.sourceUrl
          ? '<a href="' +
            escapeHtml(s.sourceUrl) +
            '" target="_blank" rel="noopener" class="ask-relevant-doc-link">' +
            escapeHtml(regProf.infoSiteName || 'Source') +
            '</a>'
          : '') +
        (s.eurLexUrl
          ? '<a href="' + escapeHtml(s.eurLexUrl) + '" target="_blank" rel="noopener" class="ask-relevant-doc-link">' +
            escapeHtml(officialSiteName(regProf)) +
            '</a>'
          : '') +
        '</div></div>';
      askRelevantDocsList.appendChild(li);
    });
    askRelevantDocs.classList.remove('hidden');

    var articlesOnly = regs.filter(function (s) {
      return s.type === 'article';
    });
    if (!articlesOnly.length || !regProf.hasSuitableRecitals) return;
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
      h.textContent = regProf.askUi && regProf.askUi.crossrefTitle ? regProf.askUi.crossrefTitle : 'Suitable recitals';
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
              '<a href="' +
              buildDocRouteHash('recital', r) +
              '" class="app-goto-doc from-ask link-in-app" data-type="recital" data-number="' +
              r +
              '">(' +
              r +
              ')</a>'
            );
          })
          .join(', ');
        li.innerHTML =
          '<span class="ask-relevant-doc-badge ask-relevant-doc-badge--article">' +
          escapeHtml(provisionKindLabels().article) +
          ' ' +
          p.num +
          '</span><div class="ask-relevant-doc-card-body"><span class="ask-relevant-doc-label">' +
          escapeHtml(
            (regProf.askUi && regProf.askUi.crossrefTitle) || provisionKindLabels().recitals
          ) +
          '</span>' +
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
        t = t.replace(new RegExp('^Purpose\\s+note\\s*\\(\\s*' + esc + '\\s*\\)\\s*(?:[—–-]\\s*)+', 'i'), '').trim();
        t = t.replace(new RegExp('^Considering\\s*\\(\\s*' + esc + '\\s*\\)\\s*(?:[—–-]\\s*)+', 'i'), '').trim();
      } else {
        t = t.replace(
          new RegExp('^(?:Article|Art\\.?|Section|Pasal|CCPA\\s*§|ADMT\\s*§|OPEN Data\\s*§)\\s*' + esc + '\\b(?:\\s*(?:GDPR|AI Act|Data Act|CCPA|CPRA|ADMT))?\\s*(?:[—–-]\\s*)+', 'i'),
          ''
        ).trim();
        t = t.replace(
          new RegExp('^(?:Article|Art\\.?|Section|Pasal|CCPA\\s*§|ADMT\\s*§|OPEN Data\\s*§)\\s*' + esc + '\\b(?:\\s*(?:GDPR|AI Act|Data Act|CCPA|CPRA|ADMT))?\\s+', 'i'),
          ''
        ).trim();
        t = t.replace(new RegExp('^(?:Article|Art\\.?|Section|Pasal|CCPA\\s*§|ADMT\\s*§|OPEN Data\\s*§)\\s*' + esc + '\\b\\s*$', 'i'), '').trim();
        t = t.replace(/^(?:GDPR|AI Act|Data Act|CCPA|CPRA|ADMT|OPEN Data)\s+/i, '').trim();
      }
    } while (t !== prev && t.length && i < 12);
    return t;
  }

  function formatAnswerCitationHeadline(type, number, rawTitle) {
    var reg = getRegProfile();
    var label = type === 'recital' ? reg.recitalHeading(number) : reg.articleHeading(number);
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
        var inApp =
          '<a href="' +
          buildDocRouteHash(s.type, s.number) +
          '" class="app-goto-doc from-ask" data-type="' +
          escapeHtml(s.type) +
          '" data-number="' +
          s.number +
          '">View in app</a>';
        var siteName = getRegProfile().infoSiteName || 'Source';
        var links =
          (s.sourceUrl
            ? ' · <a href="' + escapeHtml(s.sourceUrl) + '" target="_blank" rel="noopener">' + escapeHtml(siteName) + '</a>'
            : '') + (s.eurLexUrl ? (' · <a href="' + escapeHtml(s.eurLexUrl) + '" target="_blank" rel="noopener">' + escapeHtml(officialSiteName()) + '</a>') : '');
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
  initByokSettingsUi();
  syncHeaderToolbarStatus();
  updateAskLlmKeysStatus();
  initRegulationSelector().finally(function () {
    loadMeta();
    if (window.location.hash && window.location.hash.length > 1) {
      restoreAppRouteFromHash();
    }
    appRouteReady = true;
  });
  window.addEventListener('hashchange', function () {
    if (suppressAppRouteSync || !appRouteReady) return;
    restoreAppRouteFromHash();
  });
})();
