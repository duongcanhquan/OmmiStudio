/**
 * Vietnamese-optimized brand typography for OmniStudio OS.
 *
 * These Google Fonts all ship solid Vietnamese (Latin Extended) coverage
 * so diacritics (ă â ê ô ơ ư ạ …) render cleanly in html-anything output.
 */

export interface BrandFont {
  /** CSS font-family name */
  family: string;
  /** Google Fonts family query segment (spaces → +) */
  googleFamily: string;
  /** Weights to request */
  weights: number[];
  /** Role in the brand system */
  role: 'sans' | 'display' | 'ui';
}

export const vietnameseFonts: BrandFont[] = [
  {
    family: 'Be Vietnam Pro',
    googleFamily: 'Be+Vietnam+Pro',
    weights: [300, 400, 500, 600, 700],
    role: 'sans',
  },
  {
    family: 'Inter',
    googleFamily: 'Inter',
    weights: [400, 500, 600, 700],
    role: 'ui',
  },
  {
    family: 'Plus Jakarta Sans',
    googleFamily: 'Plus+Jakarta+Sans',
    weights: [400, 500, 600, 700],
    role: 'display',
  },
  {
    family: 'Montserrat',
    googleFamily: 'Montserrat',
    weights: [400, 500, 600, 700],
    role: 'display',
  },
];

/** Primary stack used when injecting global CSS */
export const brandTypography = {
  primaryFont: 'Be Vietnam Pro',
  fallbackStack: [
    'Be Vietnam Pro',
    'Inter',
    'Plus Jakarta Sans',
    'Montserrat',
    'system-ui',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  fonts: vietnameseFonts,
} as const;

/**
 * Build a Google Fonts CSS2 stylesheet URL for the configured families.
 * Includes `display=swap` so Vietnamese text remains visible while fonts load.
 */
export function buildGoogleFontsHref(
  fonts: BrandFont[] = vietnameseFonts
): string {
  const families = fonts
    .map((font) => {
      const weightList = font.weights.join(';');
      return `family=${font.googleFamily}:wght@${weightList}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function buildFontFaceCss(
  stack: readonly string[] = brandTypography.fallbackStack
): string {
  const family = stack.map((name) => `"${name}"`).join(', ');
  return `
/* OmniStudio OS — Vietnamese typography injection */
:root {
  --omni-font-sans: ${family};
}
html, body {
  font-family: var(--omni-font-sans);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`.trim();
}

/**
 * Inject a local font stack (no Google Fonts CDN) so preview/export
 * stays offline. macOS / Windows system fonts cover Vietnamese diacritics.
 *
 * Idempotent: skips injection if OmniStudio markers are already present.
 */
export function injectVietnameseFonts(htmlString: string): string {
  if (!htmlString || typeof htmlString !== 'string') {
    return htmlString;
  }

  if (
    htmlString.includes('data-omnistudio-fonts="vi"') ||
    htmlString.includes('/* OmniStudio OS — Vietnamese typography injection */')
  ) {
    return htmlString;
  }

  const localStack = [
    '.AppleSystemUIFont',
    'SF Pro Text',
    'SF Pro Display',
    'system-ui',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ];
  const fontCss = buildFontFaceCss(localStack);

  const headInjection = [
    `<style data-omnistudio-fonts="vi">\n${fontCss}\n</style>`,
  ].join('\n');

  // Prefer inserting before </head>
  if (/<\/head>/i.test(htmlString)) {
    return htmlString.replace(/<\/head>/i, `${headInjection}\n</head>`);
  }

  // Fallback: after <html …> or prepend a minimal document shell
  if (/<html[^>]*>/i.test(htmlString)) {
    return htmlString.replace(
      /<html[^>]*>/i,
      (match) => `${match}\n<head>\n${headInjection}\n</head>`
    );
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
${headInjection}
</head>
<body>
${htmlString}
</body>
</html>`;
}

export default brandTypography;
