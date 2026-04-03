# Covrd Brand Guide

## Brand Overview

**Covrd** is a privacy-first, client-side-only staff scheduling application. The brand communicates quiet confidence, technical precision, and trustworthiness.

**Tagline:** Every shift. Covered.

**Positioning:** Covrd is not another clunky scheduling tool. It is a private, intelligent, and elegant utility that respects both the manager's time and their team's data.

---

## Name and Wordmark

### Spelling

The name is **Covrd** — always capitalized, with the "e" dropped. The missing letter signals efficiency: no bloat, no waste.

### Wordmark

The wordmark uses **Outfit** (ExtraBold, 800) with a slight negative letter-spacing (`-0.03em`). The final **d** is rendered in the accent color to create a subtle visual anchor.

```
Covr[d]
     ^ accent color (#6C5CE7)
```

**Usage rules:**

- Always use the full wordmark "Covrd" — never abbreviate further
- The accent "d" is required in all branding contexts
- Minimum clear space around the wordmark: equal to the height of the "d"

---

## Design Aesthetic: "Shift Console"

The visual language draws from air traffic control dashboards and premium SaaS command centers. It conveys:

- **Precision** — Every pixel is intentional
- **Trust** — Dark tones, muted interfaces, professional restraint
- **Clarity** — High contrast text, minimal decoration, clear hierarchy

The aesthetic is not playful, not corporate — it is **quietly authoritative**.

---

## Color Palette

### Dark Theme (Default)

| Token                 | Hex       | Usage                  |
| --------------------- | --------- | ---------------------- |
| `--color-bg-primary`  | `#0F1117` | Page background        |
| `--color-bg-surface`  | `#1A1D2E` | Cards, sidebar, panels |
| `--color-bg-elevated` | `#232738` | Inputs, dropdowns      |
| `--color-bg-hover`    | `#2A2E42` | Hover states           |
| `--color-bg-active`   | `#32364D` | Active/pressed states  |

### Accent

| Token                  | Hex                        | Usage                                     |
| ---------------------- | -------------------------- | ----------------------------------------- |
| `--color-accent`       | `#6C5CE7`                  | Primary actions, links, active indicators |
| `--color-accent-hover` | `#7C6EF0`                  | Hover states for accent elements          |
| `--color-accent-muted` | `rgba(108, 92, 231, 0.15)` | Subtle backgrounds, highlights            |
| `--color-accent-glow`  | `rgba(108, 92, 231, 0.4)`  | Focus rings, glow effects                 |

### Semantic

| Token             | Hex       | Usage                                        |
| ----------------- | --------- | -------------------------------------------- |
| `--color-success` | `#00B894` | Coverage met, privacy badge, positive states |
| `--color-warning` | `#FDCB6E` | Partial coverage, soft constraint violations |
| `--color-danger`  | `#E17055` | Unfilled shifts, hard constraint violations  |
| `--color-info`    | `#74B9FF` | Informational badges, tips                   |

### Text

| Token                    | Hex       | Usage               |
| ------------------------ | --------- | ------------------- |
| `--color-text-primary`   | `#F1F2F6` | Headings, body text |
| `--color-text-secondary` | `#C4C7D4` | Labels, nav items   |
| `--color-text-muted`     | `#8B8FA3` | Placeholders, hints |
| `--color-text-disabled`  | `#565970` | Disabled controls   |

### Light Theme

The light theme inverts the surface hierarchy while preserving the accent palette. Background surfaces become white/off-white; text becomes dark navy; accent colors shift slightly darker for contrast.

| Token                  | Hex       |
| ---------------------- | --------- |
| `--color-bg-primary`   | `#F4F5F9` |
| `--color-bg-surface`   | `#FFFFFF` |
| `--color-accent`       | `#5A4BD4` |
| `--color-text-primary` | `#1A1D2E` |

---

## Typography

### Font Stack

| Role        | Family         | Weight  | Usage                                               |
| ----------- | -------------- | ------- | --------------------------------------------------- |
| **Display** | Outfit         | 600-800 | Headings, wordmark, page titles                     |
| **Body**    | DM Sans        | 400-500 | Paragraph text, labels, nav items                   |
| **Mono**    | JetBrains Mono | 400-600 | Data values, keyboard shortcuts, badges, timestamps |

### Scale

| Token         | Size            | Usage                         |
| ------------- | --------------- | ----------------------------- |
| `--text-xs`   | 0.75rem (12px)  | Fine print, badge text        |
| `--text-sm`   | 0.875rem (14px) | Secondary UI text, nav labels |
| `--text-base` | 1rem (16px)     | Default body text             |
| `--text-lg`   | 1.125rem (18px) | Page titles in header         |
| `--text-xl`   | 1.25rem (20px)  | Section headings              |
| `--text-2xl`  | 1.5rem (24px)   | Panel headings                |
| `--text-3xl`  | 2rem (32px)     | Large headings                |
| `--text-4xl`  | 2.5rem (40px)   | Hero headings                 |
| `--text-5xl`  | 3.5rem (56px)   | Wordmark (splash screen)      |

### Rules

- Never use browser-default fonts
- Body text minimum size: 14px
- Headings always use Outfit with negative letter-spacing
- Data and numerical values use JetBrains Mono
- Line height: 1.2 for headings, 1.5 for body text

---

## Spacing and Layout

### Spacing Scale

Based on a 4px base unit:

| Token        | Value |
| ------------ | ----- |
| `--space-1`  | 4px   |
| `--space-2`  | 8px   |
| `--space-3`  | 12px  |
| `--space-4`  | 16px  |
| `--space-6`  | 24px  |
| `--space-8`  | 32px  |
| `--space-12` | 48px  |
| `--space-16` | 64px  |

### Layout Dimensions

| Token                       | Value  | Usage                          |
| --------------------------- | ------ | ------------------------------ |
| `--sidebar-width`           | 260px  | Expanded sidebar               |
| `--sidebar-collapsed-width` | 64px   | Collapsed sidebar (icons only) |
| `--header-height`           | 56px   | Top header bar                 |
| `--content-max-width`       | 1400px | Main content area              |

### Rules

- Use design tokens for all spacing — never hardcode pixel values
- Padding inside cards/panels: `--space-4` to `--space-6`
- Gap between list items: `--space-1` to `--space-2`
- Section separation: `--space-8` minimum

---

## Component Style Guidelines

### Buttons

- Primary: accent background, inverse text, `--radius-lg`
- Secondary: transparent background, accent border, accent text
- Ghost: transparent background, no border, muted text
- All buttons use `--transition-fast` for hover effects
- Focus state: `--shadow-focus` (3px accent ring)

### Cards

- Background: `--color-bg-surface`
- Border: 1px solid `--color-border`
- Border radius: `--radius-xl`
- Shadow: `--shadow-md`
- Padding: `--space-4` to `--space-6`

### Inputs

- Background: `--color-bg-elevated`
- Border: 1px solid `--color-border`
- Border radius: `--radius-lg`
- Focus: border color transitions to `--color-border-focus`
- Height: 40px (default), 36px (compact)

### Badges

- Background: semantic color muted variant
- Text: semantic color full variant
- Font: JetBrains Mono, `--text-xs`
- Border radius: `--radius-full`
- Padding: `--space-1` horizontal, `--space-2` vertical

### Navigation Items

- Inactive: `--color-text-secondary`, transparent background
- Hover: `--color-text-primary`, `--color-bg-hover` background
- Active: `--color-accent`, `--color-accent-muted` background
- Border radius: `--radius-lg`
- Transition: `--transition-fast`

---

## Tone of Voice

### Principles

1. **Clear over clever** — Use plain language. Avoid jargon unless addressing a technical audience.
2. **Confident, not boastful** — State capabilities directly. Let the product speak.
3. **Privacy-conscious** — Always reinforce the client-side-only promise. Never trivialize data ownership.
4. **Respectful of the user's time** — Be concise. Front-load important information.

### Examples

| Context     | Do                                                                  | Don't                                                            |
| ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Empty state | "No employees yet. Add your first team member to get started."      | "It looks like you haven't added anyone! Why not give it a try?" |
| Error       | "Could not generate schedule. 2 shifts have no eligible employees." | "Oops! Something went wrong with your schedule."                 |
| Privacy     | "Your data stays in your browser. Nothing is sent to any server."   | "We take your privacy very seriously."                           |
| Success     | "Schedule generated. Quality score: 94/100."                        | "Your amazing schedule is ready!"                                |

---

## Brand Assets

### File Structure

```
public/
  logo.svg           (wordmark, dark background)
  logo-light.svg     (wordmark, light background)
  logo-mono.svg      (monochrome wordmark)
  favicon.svg        (letter "C" with accent "d" dot)
```

### Logo Variations

| Variant    | Background       | Colors                        |
| ---------- | ---------------- | ----------------------------- |
| Default    | Dark (`#0F1117`) | White text + `#6C5CE7` accent |
| Light      | White/light      | Dark text + `#5A4BD4` accent  |
| Monochrome | Any              | Single color (white or black) |

---

## Usage Do's and Don'ts

### Do

- Use the design token system for all colors, spacing, and typography
- Maintain high contrast ratios (WCAG AA minimum)
- Use semantic colors consistently (green = good, amber = warning, red = error)
- Show the privacy badge in the sidebar at all times
- Use smooth, subtle transitions (`--transition-fast` for interactions)

### Don't

- Use emojis in the UI or documentation
- Use bright, saturated colors outside the defined palette
- Add decorative elements that don't serve a function
- Use rounded/bubbly design elements (keep edges clean with `--radius-lg` max)
- Introduce any external network requests, analytics, or tracking pixels
- Use placeholder images — generate or omit

---

## Accessibility

- All interactive elements must have visible focus indicators (`--shadow-focus`)
- Color alone must never convey meaning — pair with icons or text
- Minimum touch target: 44x44px on mobile
- All images require alt text; decorative elements use `aria-hidden="true"`
- Keyboard navigation must work for all core workflows
- Screen reader landmarks: `<nav>`, `<header>`, `<main>` with descriptive `aria-label`
