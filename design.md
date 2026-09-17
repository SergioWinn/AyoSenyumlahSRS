<!-- Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 -->

# Design — Ayo Senyumlah

A locked design system for this app. Every page redesign reads this file before emitting code. Extend this file when the system needs to grow; do not regenerate it per page.

## Genre

Modern-minimal, data-first, and premium without decorative excess.

## Macrostructure family

- Marketing pages: none in the current product. If introduced, use Marquee Hero with a restrained brand-led header.
- App pages: Workbench. The public schedule uses a filter rail plus grouped schedule ledger; admin uses a denser operational ledger.
- Content pages: Long Document, typography only.

## Theme

Coral is the only accent family. Light and dark themes share the same semantic roles.

- `--color-paper` oklch(97% 0.009 72)
- `--color-paper-2` oklch(94% 0.012 72)
- `--color-paper-3` oklch(90% 0.016 72)
- `--color-ink` oklch(20% 0.018 45)
- `--color-ink-2` oklch(30% 0.016 45)
- `--color-rule` oklch(83% 0.016 72)
- `--color-accent` oklch(48% 0.17 28)
- `--color-focus` oklch(44% 0.18 28)

## Typography

- Display: Bricolage Grotesque Variable, weight 620–680, normal style.
- Body: Aptos / Segoe UI, weight 400–650.
- Mono: Cascadia Mono, only for machine values and code.
- Display tracking: -0.035em.
- Type scale anchor: `--text-display: clamp(2.35rem, 6vw, 4.7rem)`.

## Spacing

Use the named four-point-derived scale in `tokens.css`. Pages use tokens, never one-off spacing values where a semantic token exists.

## Motion

- Easings: `--ease-out`, `--ease-in`, and `--ease-in-out` from `tokens.css`.
- Reveal pattern: short opacity plus translate only for dialogs.
- Reduced-motion fallback: effectively instant, opacity-only.

## Microinteractions stance

- Silent success; no celebratory effects.
- One hover signal per control. Cards do not lift or glow.
- Focus rings appear immediately.
- Destructive actions use an inline confirmation state, not browser dialogs.

## CTA voice

- Primary CTA: solid coral pill, direct verb-first copy.
- Secondary CTA: quiet outlined pill.
- Destructive CTA: outlined red treatment, confirmed inline.

## Per-page allowances

- Marketing pages may use Tier-A CSS art or Tier-B SVG.
- App pages must not use enrichment; function carries the page.
- Content pages use typography only.

## What pages MUST share

- SRS logo and Ayo Senyumlah wordmark.
- Coral accent placement, reserved for active state, primary action, focus, and status.
- Display and body font roles.
- Button shape and padding rhythm.
- Vertical heading rhythm with no hanging eyebrow labels.
- Light/dark semantic token mapping.

## What pages MAY differ on

- Density: public schedule is scan-friendly; admin is operational and compact.
- Workbench arrangement and component archetypes.
- Mobile stacking order.

## Exports

### tokens.css

```css
:root {
  --color-paper: oklch(97% 0.009 72);
  --color-paper-2: oklch(94% 0.012 72);
  --color-paper-3: oklch(90% 0.016 72);
  --color-ink: oklch(20% 0.018 45);
  --color-ink-2: oklch(30% 0.016 45);
  --color-rule: oklch(83% 0.016 72);
  --color-rule-2: oklch(74% 0.018 65);
  --color-muted: oklch(40% 0.012 45);
  --color-neutral: oklch(46% 0.014 45);
  --color-accent: oklch(48% 0.17 28);
  --color-accent-ink: oklch(98% 0.008 72);
  --color-focus: oklch(44% 0.18 28);
  --font-display: "Bricolage Grotesque Variable", "Arial Narrow", sans-serif;
  --font-body: "Aptos", "Segoe UI", Arial, sans-serif;
  --font-outlier: "Cascadia Mono", Consolas, monospace;
  --space-3xs: 0.125rem; --space-2xs: 0.25rem; --space-xs: 0.5rem;
  --space-sm: 0.75rem; --space-md: 1rem; --space-lg: 1.5rem;
  --space-xl: 2.5rem; --space-2xl: 4rem; --space-3xl: 6rem;
  --text-xs: 0.72rem; --text-sm: 0.84rem; --text-base: 1rem;
  --text-md: 1.25rem; --text-lg: 1.56rem; --text-xl: 1.95rem;
  --text-2xl: 2.44rem; --text-display: clamp(2.35rem, 6vw, 4.7rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 120ms; --dur-short: 220ms; --dur-long: 420ms;
  --rule-hair: 1px; --rule-fine: 2px;
  --radius-card: 0.75rem; --radius-pill: 999px; --radius-input: 0.75rem;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(97% 0.009 72);
  --color-paper-2: oklch(94% 0.012 72);
  --color-paper-3: oklch(90% 0.016 72);
  --color-ink: oklch(20% 0.018 45);
  --color-ink-2: oklch(30% 0.016 45);
  --color-rule: oklch(83% 0.016 72);
  --color-rule-2: oklch(74% 0.018 65);
  --color-muted: oklch(40% 0.012 45);
  --color-neutral: oklch(46% 0.014 45);
  --color-accent: oklch(48% 0.17 28);
  --color-focus: oklch(44% 0.18 28);
  --font-display: "Bricolage Grotesque Variable", sans-serif;
  --font-body: "Aptos", "Segoe UI", sans-serif;
  --font-outlier: "Cascadia Mono", monospace;
  --spacing-xs: 0.5rem; --spacing-sm: 0.75rem; --spacing-md: 1rem;
  --spacing-lg: 1.5rem; --spacing-xl: 2.5rem; --spacing-2xl: 4rem;
  --text-xs: 0.72rem; --text-sm: 0.84rem; --text-base: 1rem;
  --text-md: 1.25rem; --text-lg: 1.56rem; --text-xl: 1.95rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --radius-card: 0.75rem; --radius-pill: 999px; --radius-input: 0.75rem;
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(97% 0.009 72)", "$type": "color" },
    "paper-2": { "$value": "oklch(94% 0.012 72)", "$type": "color" },
    "paper-3": { "$value": "oklch(90% 0.016 72)", "$type": "color" },
    "ink": { "$value": "oklch(20% 0.018 45)", "$type": "color" },
    "ink-2": { "$value": "oklch(30% 0.016 45)", "$type": "color" },
    "rule": { "$value": "oklch(83% 0.016 72)", "$type": "color" },
    "accent": { "$value": "oklch(48% 0.17 28)", "$type": "color" },
    "focus": { "$value": "oklch(44% 0.18 28)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Bricolage Grotesque Variable, Arial Narrow, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "Aptos, Segoe UI, Arial, sans-serif", "$type": "fontFamily" },
    "outlier": { "$value": "Cascadia Mono, Consolas, monospace", "$type": "fontFamily" }
  },
  "space": {
    "xs": { "$value": "0.5rem", "$type": "dimension" },
    "sm": { "$value": "0.75rem", "$type": "dimension" },
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" },
    "xl": { "$value": "2.5rem", "$type": "dimension" }
  },
  "duration": {
    "micro": { "$value": "120ms", "$type": "duration" },
    "short": { "$value": "220ms", "$type": "duration" },
    "long": { "$value": "420ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 97% 0.009 72;
  --foreground: 20% 0.018 45;
  --card: 99% 0.006 72;
  --card-foreground: 20% 0.018 45;
  --popover: 99% 0.006 72;
  --popover-foreground: 20% 0.018 45;
  --primary: 48% 0.17 28;
  --primary-foreground: 98% 0.008 72;
  --secondary: 90% 0.016 72;
  --secondary-foreground: 30% 0.016 45;
  --muted: 83% 0.016 72;
  --muted-foreground: 40% 0.012 45;
  --accent: 48% 0.17 28;
  --accent-foreground: 98% 0.008 72;
  --destructive: 47% 0.18 25;
  --destructive-foreground: 98% 0.008 72;
  --border: 83% 0.016 72;
  --input: 83% 0.016 72;
  --ring: 44% 0.18 28;
  --radius: 0.75rem;
}
```
