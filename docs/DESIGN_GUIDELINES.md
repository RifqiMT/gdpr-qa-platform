# Design guidelines  
## EU Regulation Q&A Platform

**Version:** 1.8 · **Last updated:** 2026-07-06 · Documentation standard **v2.3** · Product **1.2.4**

Visual language, **CSS design tokens**, and **component patterns** for the web UI. Source of truth: `public/styles.css`, `public/index.html`, `public/regulation-profiles.js`.

---

## 1. Design principles

1. **Clarity over decoration** — The regulation text is the hero; chrome stays calm and legible.
2. **Accessible contrast** — Body text and interactive elements meet readable contrast on `--bg` and `--surface`.
3. **Responsive density** — Filters and reading panes adapt from single column (mobile) to multi-column layouts at 640px / 900px / 1600px.
4. **Motion restraint** — Transitions use `--ease-smooth`; `prefers-reduced-motion: reduce` minimizes animation and blur.
5. **Professional trust** — Teal accent (`--accent`) suggests authority without clinical coldness; serif used sparingly for emphasis (logo/tagline context).

---

## 2. Color palette (light theme)

The application ships a **single light theme** (no dark-mode token set in code as of this revision). Colors are defined on `:root`.

| Token | Hex / value | Usage |
|-------|----------------|-------|
| `--bg` | `#f1f5f9` | Page background |
| `--bg-elevated` / `--surface` | `#ffffff` | Cards, panels, header glass base |
| `--surface-hover` | `#f8fafc` | Hover states for list rows |
| `--border` | `#e2e8f0` | Default borders |
| `--border-light` | `#f1f5f9` | Subtle separators |
| `--border-subtle` | `rgba(148, 163, 184, 0.4)` | Header / app credits bar hairlines |
| `--border-focus` | `#64748b` | Focus rings (with outline patterns in components) |
| `--text` | `#0f172a` | Primary body |
| `--text-secondary` | `#334155` | Secondary labels |
| `--text-muted` | `#64748b` | Hints, meta |
| `--accent` | `#0f766e` | Primary buttons, links, selection tint |
| `--accent-hover` | `#0d9488` | Primary hover |
| `--accent-light` | `#ccfbf1` | Chips, soft highlights |
| `--accent-dark` | `#0d5c56` | Strong emphasis borders |
| `--link` / `--link-hover` | same as accent family | Inline links |
| `--success` | `#059669` | Positive states (where used) |

**Background atmosphere:** `body` uses layered radial gradients (teal and indigo at low opacity) plus a vertical linear gradient for depth (`public/styles.css` near `body {`).

**Semantic colors:** Success-oriented states use **`--success`** (`#059669`). Destructive or error **states** rely on component classes (e.g. **`.docs-browser-loading--error`**, **`.freshness-tooltip-error`**) rather than a global `--danger` token; keep new error UI consistent with those patterns.

---

## 2.1 Responsive breakpoints and layout density

| Breakpoint | Typical width | Effect (representative) |
|------------|---------------|-------------------------|
| **Default** | &lt; 640px | Tighter **`--content-pad`**; **`--app-chrome-height`** ~6rem (collapsed Tools); reading pane **`min(72dvh, …)`**. |
| **640px+** | Small tablet | Slightly larger **`--reading-toolbar-gap`**. |
| **≤899px** | Phone / tablet | **Sticky `#appChrome`**; **Tools** menu; full-width regulation select; **1-column** toolbar grid when open; pill tabs; News hero details collapsed by default. |
| **900px+** | Desktop | Tools toggle hidden; toolbar always horizontal; **`--content-pad`** 2rem; reading pane **`min(70dvh, …)`**. |
| **1100px+** | News desktop | Two-column news body (feeds aside + articles). |
| **1600px+** | Wide | **`--content-pad`** 2.5rem. |

### 2.2 News hero theme accents (regulation)

| `data-news-theme` | Accent (`--news-hero-accent`) | Gradient hint |
|-------------------|------------------------------|---------------|
| `gdpr` (default) | `#0f766e` (teal) | Mint wash |
| `ai-act` | `#4f46e5` (indigo) | Indigo wash |
| `data-act` | `#0369a1` (sky) | Sky wash |

Set by **`syncNewsHeroChrome()`** from **`newsUi.theme`** in `regulation-profiles.js`.

### 2.2.1 Browse welcome theme accents (regulation)

Shared token pattern with News hero — applied via **`data-browse-theme`** on `.browse-welcome` / `.browse-welcome-card`:

| `data-browse-theme` | Accent (`--browse-accent`) | Mark / tags background |
|---------------------|---------------------------|-------------------------|
| `gdpr` (default) | `#0f766e` (teal) | `--browse-accent-soft` mint |
| `ai-act` | `#4f46e5` (indigo) | Indigo soft wash |
| `data-act` | `#0369a1` (sky) | Sky soft wash |

**Layout**

| Viewport | Component | Behavior |
|----------|-----------|----------|
| **≥900px** | `#browseWelcomeGrid` | `grid-template-columns: repeat(3, 1fr)`; `.browse-welcome--solo` hidden |
| **&lt;900px** | `#browseWelcome` (solo) | Grid hidden; single card for header-selected regulation |
| **All** | Quick actions | **Chapters & articles** = `btn-primary`; **Recitals** = `btn-secondary`; stacked full-width in grid cards |

**Active card (desktop):** `.browse-welcome-card--active` — accent border, elevated shadow, **Active** badge.

**Active components:** `.answer-box--ask`, `.ask-answer-prose`, `.browse-welcome*`, `.news-hero*`, `.chapters-filters*`, `.citations-sidebar*`, `.item-card*`, `.doc-nav*`.

**Removed (2026-07-06):** Legacy `.chapter-view*`, `.chapter-card`, `.qa-*` / `.chat-*` / `.result-card` Ask blocks, and hidden `.news-filter-label` rules — superseded by current Ask answer box and `#newsSections` grouped news UI.

---

## 2.3 App chrome (header + tabs)

| Element | Classes / ids | Behavior |
|---------|---------------|----------|
| **Chrome wrapper** | `#appChrome`, `.app-chrome` | Sticky on ≤899px; **`ResizeObserver`** sets **`--app-chrome-height`**. |
| **Primary row** | `.header-primary`, `.logo`, `#headerActionsToggle` | Title + **Tools** button (mobile/tablet). |
| **Regulation** | `.header-regulation`, `#regulationSelect` | Full-width grid label + select on ≤899px. |
| **Tools panel** | `#headerActionsPanel`, `.header-toolbar` | Collapsible; **`display: grid; grid-template-columns: 1fr`** on small screens. |
| **Toolbar rows** | `.header-toolbar-btn`, `--freshness`, `--keys`, `--refresh` | Icon + label + **live hint** (`#headerFreshnessHint`, `#headerApiKeysHint`). |
| **Tabs** | `.tabs`, `.tab`, `.tab-label--short` | Horizontal scroll + pill active state on ≤899px. |

**Anti-pattern (removed):** Always-visible duplicate freshness/API-key **status cards** between regulation and Tools — use toolbar hints + existing tooltip / Ask status instead.

---

## 3. Typography

| Token / rule | Value | Usage |
|--------------|-------|--------|
| `--font-sans` | `'DM Sans', system-ui, …` | UI and article reading (primary) |
| `--font-serif` | `'DM Serif Text', Georgia, …` | Accent headings where specified |
| Google Fonts | `DM Sans` (400–700), `DM Serif Text` | Loaded in `index.html` |

**Guidelines**

- Body line-height ~1.6; avoid long measure: content uses responsive padding (`--content-pad`).
- Regulation excerpts in Ask use `.ask-answer-prose` with paragraph spacing distinct from browse reader.

---

## 4. Layout and spacing

| Token | Role |
|-------|------|
| `--header-height` | Legacy estimate (~72px); prefer **`--app-chrome-height`** |
| `--app-chrome-height` | Measured sticky chrome (header + tabs); set in JS |
| `--tabs-bar-height` | Tab bar height estimate for fallback math |
| `--footer-block-min` | App credits bar reserve (larger on small screens) |
| `--main-vertical-pad` | Main content vertical padding (responsive) |
| `--app-shell-vertical` | `app-chrome-height` + footer pad + main pad → reading cap |
| `--reading-pane-max-h` / `--doc-readable-max-h` | Cap scroll region for long articles |
| `--content-max` | `100%` full-width canvas |
| `--radius`, `--radius-sm`, `--radius-lg` | 14px / 10px / 18px corner radii |

**Browse layout:** Content panel + reader chrome toolbar + scroll port (`#readerScrollPort`) + citations sidebar (collapsible panels).

**Ask layout:** Hero (`ask-hero`), composer card (`ask-composer-card`), results grid (`ask-results-grid`) with answer column + relevant provisions aside.

---

## 5. Elevation and shadow

| Token | Usage |
|-------|--------|
| `--shadow` | Cards, subtle lift |
| `--shadow-md` / `--shadow-lg` | Modals, menus, emphasis |
| `--shadow-inset` | Inset highlights on controls |
| Header | Glass: `backdrop-filter: blur(14px)` with white translucent fill |

---

## 6. Motion

| Token | Value |
|-------|--------|
| `--ease-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--transition` | `0.22s var(--ease-smooth)` |
| `--transition-fast` | `0.16s var(--ease-smooth)` |

**Reduced motion:** Duration collapsed to `0.01s`, backdrop-filter disabled on key shells, hover transforms disabled on cards.

---

## 7. Core components (patterns)

| Component | Class hooks (representative) | Notes |
|-----------|----------------------------|--------|
| **App chrome** | `#appChrome`, `.header-inner`, `.btn-header-menu`, `.header-toolbar` | Sticky shell; **Tools** toggle; 1-column toolbar on ≤899px. |
| **Header** | `.header`, `.logo-link`, `.regulation-select`, `.header-toolbar-btn--freshness` | Regulation dropdown; logo → homepage; freshness via toolbar row + tooltip. |
| **News hero** | `.news-hero`, `.news-hero-bar`, `.news-hero-details`, `.news-copy-panel` | Collapsible details on mobile; 1-column intro/scope panels. |
| **Regulation scope (News)** | `.news-scope-card`, `#newsScopeCard` | Filtered/full corpus callout inside hero details (not a separate banner). |
| **App credits bar** | `.app-credits`, `.app-credits-inner`, `.app-credits-text`, `.app-credits-links`, `.app-credits-link`, `.app-credits-icon` | Bottom attribution: “Developed, managed, and maintained by **Rifqi Tjahyono**”; LinkedIn (filled icon, hover `#0a66c2`) and website (globe stroke icon). Centered on mobile; text left / icons right from **640px**. |
| **Tabs** | `.tabs`, `.tab`, `.tab--browse-main`, `.tab-browse-menu` | `role="tablist"` / `tab` / `tabpanel`; browse split menu. |
| **Buttons** | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm` | Primary = accent fill; secondary = outline / muted. |
| **Filter combobox** | `.filter-combobox`, `.filter-combobox-input`, `.filter-combobox-list` | Used for chapters filters and industry sector in Ask. |
| **Doc reader** | `.reader-chrome`, `.doc-nav`, `.doc-content`, `.art-num`, `.art-subject` | Prev/Next/Go; **`.art-num`** = regulation label (e.g. “Art. 10 Data Act”); **`.art-subject`** = official short title (serif, centered); body in `.article-doc` / `.recital-doc` with `.art-para-list` for numbered blocks. |
| **Citation panels** | `.citation-panel`, `.citation-panel-toggle`, `.citation-panel-badge` | Collapsible aside on Browse detail; **regulation-specific** title/lead copy via `citationsUi` (not static HTML). Accent stripes: `.citation-panel--official` (teal), `--articles` (indigo), `--recitals` (violet). |
| **Article subject (reader H2)** | `.art-subject` | Centered serif heading; uses `hyphens: auto`, `text-wrap: balance`, `overflow-wrap: break-word` for long Data Act / AI Act titles. |
| **Ask answer** | `.answer-box`, `.citation-chip`, `.ask-answer-prose` | `[Sn]` chips link in-app for regulation, external for web. |
| **News** | `.news-card`, `.news-sections`, `.filter-bar.news-filters`, `.news-topic-tag`, `.news-view-toggle` | Source/topic filters; **topic** chip on cards (**`.news-topic-tag`**); main **`#newsControlsPanel`** is **not sticky**—it scrolls with content to avoid overlapping cards. A segmented view toggle (**By source** / **All**) uses `.news-view-toggle` and keeps layout consistent across modes. |
| **Sources** | `.sources-grid`, `.source-card` | Grid of credible organizations. |
| **API keys (BYOK)** | `.byok-settings-dialog`, `.byok-validation-panel`, `.byok-validation-card`, `.btn-byok-check` | Modal from header; validation panel with summary header + per-provider cards; success/warning/error panel variants. |
| **Ask LLM status** | `.ask-llm-keys-status`, `.ask-llm-keys-status--ok`, `.ask-llm-keys-status--warn` | Line under Ask hero describing server vs BYOK key state. |

### 7.0.1 BYOK validation panel (light theme)

| Element | Classes | Colors / motion |
|---------|---------|-----------------|
| **Panel shell** | `.byok-validation-panel`, `--success` / `--warning` / `--loading` | Border tint uses success green or amber; entry animation **`byokPanelIn`** (respects reduced motion). |
| **Summary row** | `.byok-validation-summary`, `.byok-validation-summary-icon` | Gradient header; circular icon badge. |
| **Provider card** | `.byok-validation-card--valid` / `--invalid` / `--pending` / `--skipped` | Valid: green-tinted gradient; invalid: amber; pending: spinner **`byok-validation-spinner`**. |
| **Badge** | `.byok-validation-card-badge` | Pill label: Valid, Invalid, Checking…, Skipped. |
| **Toast** | `.byok-settings-toast--ok`, `.byok-settings-toast--error` | Secondary feedback below actions when needed. |

**Responsive:** `.byok-settings-actions` uses a single column on narrow viewports; Save spans full width; Check validity and Clear share a row from **420px** up.

---

## 7.1 News layout (two-column desktop)

| Element | Class / id hooks (representative) | Notes |
|---------|-----------------------------------|--------|
| **Articles region** | `.news-articles-region`, `.news-sections` | Primary scroll column for grouped cards. |
| **Main filters** | `#newsControlsPanel`, `.news-controls-panel`, `.filter-bar.news-filters` | Search, Source, Topic, Clear; lives above the article list. |
| **Quick filters (sidebar dock)** | `#newsSidebarToolbar`, `.news-sidebar-toolbar`, `.news-sidebar-toolbar__toggle`, `.news-sidebar-toolbar__badge` | Shown when **`#newsControlsPanel`** leaves the **`.main`** viewport (**≥ ~1100px**); mirrors main controls; **expand/collapse** with **`sessionStorage`** key **`gdpr_news_sidebar_collapsed`**. |
| **Official site & RSS** | `#newsFeedsAsideTop`, `#newsFeedsSectionToggle`, `#newsFeedsSectionPanel`, `.news-feeds-aside-top--collapsed` | Expandable feed list; **`sessionStorage`** **`gdpr_news_feeds_section_collapsed`**. |

**Motion:** Chevron rotation and panel open/close use **`--transition`**; **`prefers-reduced-motion: reduce`** shortens motion per global rules.

---

## 8. Print and PDF export

- **Print stylesheet:** `@media print` in `styles.css` (~3753+) adjusts layout for clean printing.
- **PDF:** Client uses html2pdf.js with a clone mount `#pdfPrintMount` for vector-friendly output (see comment block near “PDF export layout” in CSS).

**Guidelines:** Exported documents should preserve headings and avoid clipping numbered paragraphs; test after ETL changes (see [DOCUMENT_FORMATTING_GUARDRAILS.md](DOCUMENT_FORMATTING_GUARDRAILS.md)).

---

## 9. Icons and imagery

- Inline **SVG** icons for search, freshness clock, ask field (stroke-based, `currentColor`).
- Emoji in placeholder (📋) is decorative; keep usage minimal for professional tone.

---

## 10. Future theming (optional)

If a dark theme is added:

- Introduce `[data-theme="dark"]` or `prefers-color-scheme: dark` with a parallel token set.
- Re-verify contrast for `--text` on dark surfaces and accent hover states.
- Update this document with a second palette table.

---

## References

- `public/styles.css`  
- `public/index.html`  
- [README.md §7 Tech stack](../README.md#7-tech-stack)
