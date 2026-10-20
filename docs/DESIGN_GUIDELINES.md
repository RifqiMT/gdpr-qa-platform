# Design guidelines  
## Regulation Q&A Platform

**Version:** 2.0 · **Last updated:** 2026-10-20 · Documentation standard **v2.5** · Product **1.2.6**  
**Source of truth for tokens:** `public/styles.css` (`:root` + `[data-browse-theme]` / `[data-news-theme]`).

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

**Fonts:** `--font-sans`: DM Sans · `--font-serif`: DM Serif Text  

**Motion:** `--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)` · `--transition` / `--transition-fast`

### 2.1 Regulation theme accents (Browse welcome + News hero)

Themes set **local** tokens on `.browse-welcome[data-browse-theme]` and `.news-hero[data-news-theme]`. They do **not** override global `--accent` (region chrome stays teal).

| Theme id | Accent | Soft (12%) | Browse glow | News glow | Browse gradient A |
|----------|--------|------------|-------------|-----------|-------------------|
| `gdpr` (default) | `#0f766e` | `rgba(15,118,110,0.12)` | `0.22` | `0.28` | `rgba(204,251,241,0.42)` |
| `ai-act` | `#4f46e5` | `rgba(79,70,229,0.12)` | `0.26` | `0.32` | `rgba(199,210,254,0.45)` |
| `data-act` | `#0369a1` | `rgba(3,105,161,0.12)` | `0.24` | `0.30` | `rgba(186,230,253,0.50)` |
| `id-pdp` | `#c8102e` | `rgba(200,16,46,0.12)` | `0.24` | `0.30` | `rgba(254,202,202,0.50)` |
| `id-satu-data` | `#047857` | `rgba(4,120,87,0.12)` | `0.24` | `0.30` | `rgba(167,243,208,0.50)` |
| `id-ai-ethics` | `#b45309` | `rgba(180,83,9,0.12)` | `0.24` | `0.30` | `rgba(253,230,138,0.50)` |

**CSS var names**

- Browse: `--browse-accent`, `--browse-accent-soft`, `--browse-accent-glow`, `--browse-gradient-a|b`  
- News: `--news-hero-accent`, `--news-hero-accent-soft`, `--news-hero-accent-glow`, `--news-hero-gradient-a|b`

### 2.2 Responsive breakpoints and layout density

| Breakpoint | Behavior |
|------------|----------|
| ≤640px | Compact chrome; taller footer block; denser reading pad |
| ≤899px | Sticky `#appChrome`; Tools menu; collapsible Filters; solo Browse welcome |
| ≥900px | Desktop toolbar; Browse welcome multi-card grid |
| ≥1100px | News two-column + Quick filters dock |
| ≥1200 / ≥1600px | Wider content band; full-width browse grid (no artificial 72rem cap) |

Layout tokens: `--header-height`, `--app-chrome-height`, `--tabs-bar-height`, `--footer-block-min`, `--reading-pane-max-h`, `--content-pad`, `--reading-toolbar-gap`.

---

## 3. Typography

| Role | Font | Usage |
|------|------|-------|
| UI / body | DM Sans | Chrome, forms, answers, news cards |
| Document titles | DM Serif Text | Reader headings, selected marketing moments |
| Meta | DM Sans muted | Freshness, counts, captions |

Avoid Inter / Roboto / system-only stacks for primary UI (system is fallback only).

---

## 4. Layout and spacing

- Content band uses `--content-max: 100%` with horizontal `--content-pad`.  
- Reading pane height capped by `--reading-pane-max-h` so chrome never clips text.  
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
| BYOK validation panel | Status appear/dismiss |
| Tools panel expand | Mobile disclosure |

Duration ~160–220ms with `--ease-smooth`. Prefer `transform` / `opacity`.

---

## 7. Core components (patterns)

| Component | Notes |
|-----------|-------|
| Region + Regulation picker | Unified shell; teal region accents; custom select |
| Segmented tabs | Full-width track + sliding thumb |
| Tools menu | ≤899px disclosure for freshness / keys / refresh |
| Browse welcome cards | Themed; Chapters primary CTA |
| Filter bar | Desktop grid; mobile collapsible Filters |
| Reader | Centered header; numbered paragraphs; citation sidebar |
| Ask answer | `[S#]` chips; status chip for LLM/extractive |
| BYOK dialog | Modal; validation panel states valid/invalid/skipped |
| News hero | Themed bar + expandable details on mobile |
| News cards | Three-paragraph summary pattern; topic tags |
| Credits bar | Attribution icons; not a legal disclaimer |

### 7.0.1 BYOK validation panel

Light theme only: success uses `--success`; errors use clear red text/border (not purple glow). Animate in/out with opacity.

---

## 8. Print and PDF export

PDF export uses html2pdf.js on the current reader node. Prefer high-contrast text; hide chrome chrome (tabs/tools) from the export root. Print CSS hooks live in `styles.css`.

---

## 9. Icons and imagery

Inline SVG for Tools chevron, credits social icons, freshness. No emoji in core chrome. No hero photography — product is text-first.

---

## 10. Future theming (optional)

Dark mode and per-tenant branding are **out of scope**. If introduced later: extend token tables without breaking regulation accent contracts; keep soft-law / jurisdiction signals intact.

---

## References

- `public/styles.css`  
- `public/regulation-profiles.js` / `public/regulation-profiles-id.js`  
- [FEATURE_CATALOG.md](FEATURE_CATALOG.md)  
- [../PRODUCT_DOCUMENTATION_STANDARD.md](../PRODUCT_DOCUMENTATION_STANDARD.md)
