# Design guidelines  
## Regulation Q&A Platform

**Version:** 3.2 · **Last updated:** 2026-10-23 · Documentation standard **v3.2** · Product **1.3.0** · Audit date **2026-10-23** · Thirteen theme accents · News scoped for all instruments · Region thumb `165deg` tokens  
**Source of truth for tokens:** `public/styles.css` (`:root` + `[data-browse-theme]` / `[data-news-theme]` / `[data-sources-theme]`).

---

## 1. Design principles

| Principle | Application |
|-----------|-------------|
| **Clarity first** | Legal text is the hero; chrome stays quiet. |
| **Jurisdiction signal** | Region picker + regulation theme accents orient users without overwhelming content. |
| **One composition** | App shell is a single workspace (header → tabs → main), not a multi-widget dashboard. |
| **Light theme only** | Product ships a light professional theme; no dark-mode token set. |
| **Accessible contrast** | Teal accent on slate text; focus rings on interactive controls. |
| **Motion with purpose** | Transitions for region thumb, tab thumb, theme hover — not decorative noise. |

---

## 2. Color palette (light theme)

### 2.0 Global `:root` tokens

| Token | Hex / value | Role |
|-------|-------------|------|
| `--bg` | `#f1f5f9` | Page background |
| `--bg-elevated` / `--surface` | `#ffffff` | Cards, panels |
| `--surface-hover` | `#f8fafc` | Hover wash |
| `--border` | `#e2e8f0` | Default borders |
| `--border-light` | `#f1f5f9` | Subtle dividers |
| `--border-subtle` | `rgba(148, 163, 184, 0.4)` | Soft edges |
| `--border-focus` | `#64748b` | Neutral focus |
| `--text` | `#0f172a` | Primary text |
| `--text-secondary` | `#334155` | Secondary text |
| `--text-muted` | `#64748b` | Meta / hints |
| `--accent` | `#0f766e` | Brand / primary actions (teal) |
| `--accent-hover` | `#0d9488` | Accent hover |
| `--accent-light` | `#ccfbf1` | Soft accent fill |
| `--accent-dark` | `#0d5c56` | Accent text on light fills |
| `--link` / `--link-hover` | `#0f766e` / `#0d9488` | Links |
| `--success` | `#059669` | Success states |

**Radii:** `--radius` 14px · `--radius-sm` 10px · `--radius-md` 12px · `--radius-lg` 18px  

**Shadows:** `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-inset` (slate-tinted, low elevation).  

**Fonts:** `--font-sans` and `--font-serif` both resolve to **DM Sans** (unified app type). `--font-serif` remains a semantic alias for display/title roles (heavier weight / tighter tracking), not a second typeface.  

**Motion:** `--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)` · `--transition` / `--transition-fast`

### 2.1 Regulation theme accents (Browse welcome + News hero + Sources)

Themes set **local** tokens on `.browse-welcome[data-browse-theme]`, `.news-hero[data-news-theme]`, and `.sources-layout[data-sources-theme]`. They do **not** override global `--accent` (region chrome stays teal).

| Theme id | Accent | Soft (12%) | Browse glow | News glow | Browse gradient A |
|----------|--------|------------|-------------|-----------|-------------------|
| `gdpr` (default) | `#0f766e` | `rgba(15,118,110,0.12)` | `0.22` | `0.28` | `rgba(204,251,241,0.42)` |
| `ai-act` | `#4f46e5` | `rgba(79,70,229,0.12)` | `0.26` | `0.32` | `rgba(199,210,254,0.45)` |
| `data-act` | `#0369a1` | `rgba(3,105,161,0.12)` | `0.24` | `0.30` | `rgba(186,230,253,0.50)` |
| `id-pdp` | `#c8102e` | `rgba(200,16,46,0.12)` | `0.24` | `0.30` | Browse `rgba(254,202,202,0.50)` · News `0.45` |
| `id-satu-data` | `#047857` | `rgba(4,120,87,0.12)` | `0.24` | `0.30` | Browse `rgba(167,243,208,0.50)` · News `0.45` |
| `id-ai-ethics` | `#b45309` | `rgba(180,83,9,0.12)` | `0.24` | `0.30` | Browse `rgba(253,230,138,0.50)` · News `0.45` |
| `us-ccpa` (US · California, blue) | `#1d4ed8` | `rgba(29,78,216,0.12)` | `0.24` | `0.30` | Browse `rgba(191,219,254,0.50)` · News/Sources `0.45` |
| `us-open-data` (US · federal, teal-cyan) | `#0f766e` | `rgba(15,118,110,0.12)` | `0.24` | `0.30` | Browse `rgba(153,246,228,0.50)` · News/Sources `0.45` |
| `us-admt` (US · Colorado, violet) | `#6d28d9` | `rgba(109,40,217,0.12)` | `0.24` | `0.30` | Browse `rgba(221,214,254,0.50)` · News/Sources `0.45` |
| `iso-27701` (INTL · PIMS, teal) | `#0f766e` | `rgba(15,118,110,0.12)` | `0.24` | `0.30` | Browse `rgba(204,251,241,0.50)` · News/Sources `0.45` |
| `iso-19941` (INTL · cloud, sky) | `#0369a1` | `rgba(3,105,161,0.12)` | `0.24` | `0.30` | Browse `rgba(186,230,253,0.50)` · News/Sources `0.45` |
| `iso-23894` (INTL · AI risk, violet) | `#5b21b6` | `rgba(91,33,182,0.12)` | `0.24` | `0.30` | Browse `rgba(221,214,254,0.50)` · News/Sources `0.45` |
| `soc2` (INTL · attestation, amber) | `#b45309` | `rgba(180,83,9,0.12)` | `0.24` | `0.30` | Browse `rgba(254,243,199,0.50)` · News/Sources `0.45` |

**United States theme notes**

- `us-open-data` deliberately shares the teal accent `#0f766e` with `gdpr` and the global `--accent`; it is distinguished by the cyan-leaning gradient wash, the **USA** region context, and the `OG` card monogram. Do not reuse `#0f766e` for any other US theme.
- `us-ccpa` blue (`#1d4ed8`) and `us-admt` violet (`#6d28d9`) must remain distinct from the EU indigo (`ai-act` `#4f46e5`) and sky (`data-act` `#0369a1`) so jurisdiction can be inferred at a glance; verify contrast on `#ffffff` surfaces (both exceed WCAG AA for large and normal text).
- Card monograms: `CA` (CCPA), `OG` (OPEN Data), `CO` (ADMT). Headings use **Section / Purpose note** nouns, never *Article / Recital*, in US surfaces.

**International theme notes**

- International instruments are **voluntary standards / attestation criteria, not laws**; theme accents must never imply statutory force. Browse / Ask / News copy carries the "not a law" signal; the accent only orients the user.
- `iso-27701` (teal `#0f766e`) shares its accent with `gdpr` and the global `--accent` (different gradient wash: `rgba(204,251,241,0.50)`); `iso-19941` (sky `#0369a1`) shares `data-act`'s accent; `soc2` (amber `#b45309`) shares `id-ai-ethics`'s accent; `iso-23894` (deep violet `#5b21b6`) is unique. Distinction relies on the **INTL** region context, the jurisdiction chip, and the card monograms.
- Card monograms: `PIMS` (ISO 27701), `CLOUD` (ISO 19941), `AI` (ISO 23894), `SOC` (SOC 2). Headings use **Clause / Criterion / Purpose note** nouns (`ISO 27701 clause N`, `SOC 2 criterion N`), never *Article / Recital*, in International surfaces.
- Verify contrast of all four accents on `#ffffff` surfaces (all exceed WCAG AA for normal text).

**CSS var names**

- Browse: `--browse-accent`, `--browse-accent-soft`, `--browse-accent-glow`, `--browse-gradient-a|b`  
- News: `--news-hero-accent`, `--news-hero-accent-soft`, `--news-hero-gradient-a|b`  
- Sources: `--sources-accent`, `--sources-accent-soft`, `--sources-gradient-a|b` (same accent hexes as table; applied on `#sourcesLayout`)

### 2.1a Region picker

Equal-width five-segment sliding radiogroup (`#regionFilter`) with short segment labels **All · EU · ID · US · INTL**, full names via `aria-label` / `title`, and a live readout `#regionFilterCurrent` beside the Region label. Thumb fill follows `data-region`:

| `data-region` | Thumb fill |
|---------------|------------|
| `all` | `linear-gradient(165deg, #0d9488, #0f766e)` |
| `eu` | `linear-gradient(165deg, #2dd4bf, #0f766e)` |
| `id` | `linear-gradient(165deg, #0f766e, #0d5c56)` |
| `us` | `linear-gradient(165deg, #3b82f6, #1e40af)` |
| `intl` | `linear-gradient(165deg, #64748b, #334155)` (slate) |

Track: inset soft fill, 12px radius, teal-tinted border. Segments use CSS grid `repeat(5, minmax(0, 1fr))` so spacing stays even; on narrow viewports the control spans full filter width with slightly tighter type. The global `--accent` is **not** overridden by region or regulation theme; only the thumb and themed surfaces change.

### 2.2 Responsive breakpoints and layout density

| Breakpoint | Behavior |
|------------|----------|
| ≤640px | Compact chrome; taller footer block; denser reading pad |
| ≤899px | Sticky `#appChrome`; Tools menu; collapsible Filters; solo Browse welcome |
| ≥900px | Desktop toolbar; Browse welcome multi-card grid |
| ≥640px | Sources grid 2 columns |
| ≥960px | News two-column + Quick filters dock |
| ≥1100px | Sources grid 3 columns |
| ≥1200 / ≥1600px | Wider content band; full-width browse grid (no artificial 72rem cap) |

Layout tokens: `--content-pad`, `--reading-toolbar-gap`, `--reader-to-document-gap`.

---

## 3. Typography

| Role | Font | Usage |
|------|------|-------|
| UI / body | DM Sans | Chrome, forms, answers, news cards, provision body |
| Document / display titles | DM Sans (via `--font-serif` alias), weight 650–700 | Reader headings (e.g. Definitions), browse/Ask heroes, card titles |
| Meta | DM Sans muted | Freshness, counts, captions |

Avoid Inter / Roboto / system-only stacks for primary UI (system is fallback only). Do not reintroduce a second display face.

---

## 4. Layout and spacing

- Content band is full-width with horizontal `--content-pad`.  
- Main and reader stacks scroll under sticky `#appChrome`; spacing uses `--reading-toolbar-gap` / `--reader-to-document-gap`.  
- Browse welcome cards: left accent bar + radial gradient wash; full-width action buttons.  
- Do not reintroduce nested “pill inside pill” chrome; prefer one control surface.

---

## 5. Elevation and shadow

Use `--shadow` for resting cards, `--shadow-md` for raised panels, `--shadow-lg` sparingly for modals. Prefer border + soft shadow over multi-layer glow. Theme glows appear only on themed welcome/news surfaces.

---

## 6. Motion

| Motion | Intent |
|--------|--------|
| Region sliding thumb | Jurisdiction change feedback |
| Tab active thumb | View change |
| Browse card hover lift | Afford clicking a regulation |
| Source card hover lift | Afford opening an official site |
| BYOK validation panel | Status appear/dismiss |
| Tools panel expand | Mobile disclosure |

Duration ~160–220ms with `--ease-smooth`. Prefer `transform` / `opacity`.

---

## 7. Core components (patterns)

| Component | Notes |
|-----------|-------|
| Region + Regulation picker | Unified shell; equal-width five-segment region thumb (All · EU · ID · US · INTL) with live jurisdiction readout; thumb gradients at `165deg` — `all` `#0d9488→#0f766e`, `eu` `#2dd4bf→#0f766e`, `id` `#0f766e→#0d5c56`, `us` `#3b82f6→#1e40af`, `intl` `#64748b→#334155`; custom select grouped by jurisdiction under **All**; jurisdiction chip (European Union / Indonesia / United States / International; INTL chip text `#334155`, border tint `#475569`) |
| Segmented tabs | Full-width track + sliding thumb |
| Tools menu | ≤899px disclosure for freshness / keys / refresh |
| Browse welcome cards | Themed; Chapters primary CTA; thirteen cards in four region rows (EU, Indonesia, USA, International) |
| Browse docs (Chapters / Recitals) | Shared `.browse-docs` chrome; full-width summary panel (no 72ch cap) with `browseUi.policySummary` prose + theme chips in a side rail from ~880px; muted how-to hint underneath; flat teal toolbar/filter strip; dense chapter panels + provision cards |
| Filter bar | Desktop grid (chapters: 4-col ≥1100px); mobile collapsible Filters; News keeps richer card shell |
| Reader | Centered header; numbered paragraphs; citation sidebar |
| Reader chrome | Single flat strip: ghost Back · Prev · position · jump search (Enter / list pick, no separate Go) · Next · Page\|Full segment · primary Export; no nested nav box; quiet disabled edges; solid fill (no backdrop blur); jump field border on wrap (input borderless) so ellipsis overflow cannot clip the stroke |
| Reader view mode | **Page** = one article/recital (default); **Full** = continuous scroll of all articles or all recitals (same kind); teal segment control before Export; persists in localStorage; Full uses compact stacked sections (no per-card padding) and hides Related articles/recitals sidebar panels |
| Export PDF | Matches active reader mode: **Page** exports the open provision + sources/related; **Full** exports the entire on-screen articles or recitals corpus + official sources (no related panels) |
| Ask answer | `[S#]` chips; status chip for LLM/extractive |
| BYOK dialog | Themed header + privacy callout; accent switch; provider cards with reveal toggles; single-row **Check · Clear · Save** (Save primary, flex grow; ≤439px Save full-width on top); validation panel states valid/invalid/skipped |
| News hero | Compact themed bar; collapsible overview on all widths; always-visible scope badge (**Relevant to …** vs **Full corpus**); article/source counts reflect the scoped set |
| News relevance | Every regulation filters the shared corpus client-side. Sidebar = all credible feeds for that regulation’s region; headlines = regional pool + relevance (primary hubs in full; megasources via keyword/category) |
| News controls | Soft strip: search + Source/Topic + Clear + By source \| All; filter badges scoped to relevance set; aside dock from ≥960px |
| News source blocks | Flat details headers + count pill; hairline divider (no box-in-box) |
| News cards | Title-first; quiet meta/topic; soft teal rail + light hover; flat **All** feed |
| News empty | Soft teal panel + Refresh / Clear CTAs |
| Sources hero | Themed shell + regulation pill + live count + filter field |
| Source cards | Monogram, host chip, primary CTA, document action rows |
| Credits bar | Attribution icons; not a legal disclaimer |

### 7.0.1 BYOK validation panel

Light theme only: success uses `--success`; errors use clear red text/border (not purple glow). Animate in/out with opacity.

---

## 8. Print and PDF export

PDF export uses the browser print dialog on a cloned `#pdfPrintMount` tree (not a canvas/html2pdf raster). Prefer high-contrast text; hide app chrome from the export root. Print CSS hooks live in `styles.css`.

---

## 9. Icons and imagery

Inline SVG for Tools chevron, credits social icons, freshness. No emoji in core chrome. No hero photography — product is text-first.

---

## 10. Future theming (optional)

Dark mode and per-tenant branding are **out of scope**. If introduced later: extend token tables without breaking regulation accent contracts; keep soft-law (`id-ai-ethics`) and jurisdiction (EU / Indonesia / USA / INTL) and voluntary-standard (`iso-*`, `soc2`) signals intact.

---

## References

- `public/styles.css`  
- `public/regulation-profiles.js` / `public/regulation-profiles-id.js` / `public/regulation-profiles-us.js` / `public/regulation-profiles-iso.js`  
- [VARIABLES.md §7.3](VARIABLES.md#73-regulation-theme-accents) — token values by theme  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
