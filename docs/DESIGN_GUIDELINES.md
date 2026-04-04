# Design guidelines  
## GDPR Q&A Platform

This document describes the **visual language**, **CSS design tokens**, and **component patterns** for the web UI. The implementation source of truth is `public/styles.css` and markup in `public/index.html`.

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
| `--border-subtle` | `rgba(148, 163, 184, 0.4)` | Header/footer hairlines |
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
| **Default** | &lt; 640px | Tighter **`--main-vertical-pad`**, larger footer reserve, reading pane **`min(62dvh, …)`**. |
| **640px+** | Small tablet | Slightly larger **`--reading-toolbar-gap`**. |
| **900px+** | Desktop | **`--content-pad`** 2rem, **`--main-vertical-pad`** increased; reading pane **`min(70dvh, …)`**; chapter filter grid may use two columns (see **`.filter-bar`** in CSS). |
| **1600px+** | Wide | **`--content-pad`** 2.5rem. |

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
| `--header-height` | ~72px header band |
| `--tabs-bar-height` | Tab bar height for shell math |
| `--footer-block-min` | Footer reserve (larger on small screens) |
| `--main-vertical-pad` | Main content vertical padding (responsive) |
| `--app-shell-vertical` | Sum used to compute reading pane max height |
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
| **Header** | `.header`, `.logo-link`, `.btn-freshness-info`, `.btn-primary` | Logo returns to homepage; freshness info button opens tooltip panel. |
| **Tabs** | `.tabs`, `.tab`, `.tab--browse-main`, `.tab-browse-menu` | `role="tablist"` / `tab` / `tabpanel`; browse split menu. |
| **Buttons** | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm` | Primary = accent fill; secondary = outline / muted. |
| **Filter combobox** | `.filter-combobox`, `.filter-combobox-input`, `.filter-combobox-list` | Used for chapters filters and industry sector in Ask. |
| **Doc reader** | `.reader-chrome`, `.doc-nav`, `.doc-content` | Prev/Next/Go; article/recital typography inside `.article-doc` / `.recital-doc`. |
| **Citation panels** | `.citation-panel`, `.citation-panel-toggle`, `.citation-panel-badge` | Collapsible aside sections. |
| **Ask answer** | `.answer-box`, `.citation-chip`, `.ask-answer-prose` | `[Sn]` chips link in-app for regulation, external for web. |
| **News** | `.news-card`, `.news-sections`, `.filter-bar.news-filters` | Source/topic filters; main **`#newsControlsPanel`** is **not sticky**—it scrolls with content to avoid overlapping cards. |
| **Sources** | `.sources-grid`, `.source-card` | Grid of credible organizations. |

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
