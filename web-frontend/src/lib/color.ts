/**
 * Derives a theme-safe tinted background from a single accent color, instead
 * of hand-picking a second hardcoded hex per accent (the pattern that made
 * ServiceTypeCard, ProductsStatsHero, and others illegible in dark mode —
 * pastels like `#DBEAFE` are light-only and wash out on a dark canvas).
 * `color-mix` blends toward transparent, so it reads correctly over both
 * `var(--surface)` and its dark counterpart without a separate dark value.
 */
export const tintBg = (accent: string, alphaPct = 16) => `color-mix(in srgb, ${accent} ${alphaPct}%, transparent)`;
