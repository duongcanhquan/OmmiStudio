export interface BrandMedia {
  logo?: string;
  photos?: string[];
}

const SAFE_SRC =
  /^(data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+|https?:\/\/\S+)$/i;

const MAX_SRC = 1_800_000;

export function sanitizeMediaSrc(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const src = value.trim();
  if (!src || src.length > MAX_SRC) return undefined;
  if (!SAFE_SRC.test(src)) return undefined;
  return src;
}

export function parseBrandMedia(raw: unknown): BrandMedia | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const logo = sanitizeMediaSrc(rec.logo);
  const photos = Array.isArray(rec.photos)
    ? rec.photos
        .map((item) => sanitizeMediaSrc(item))
        .filter((item): item is string => Boolean(item))
        .slice(0, 3)
    : [];
  if (!logo && !photos.length) return null;
  return { logo, photos };
}

/**
 * Dán logo + ảnh vào slot skill (ô .logo, .figure, thẻ carousel)
 * hoặc góc trang nếu skill không có chỗ sẵn.
 */
export function injectBrandMedia(
  html: string,
  media?: BrandMedia | null
): string {
  if (!media) return html;
  const logo = media.logo && sanitizeMediaSrc(media.logo);
  const photos = (media.photos ?? [])
    .map((item) => sanitizeMediaSrc(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);
  if (!logo && !photos.length) return html;

  let next = html;
  let placedLogo = false;

  if (logo) {
    const img = `<img class="logo-svg lyon-logo" src="${logo}" alt="" />`;
    if (/<svg[^>]*class="[^"]*logo-svg/i.test(next)) {
      next = next.replace(
        /<svg[^>]*class="[^"]*logo-svg[^"]*"[\s\S]*?<\/svg>/i,
        img
      );
      placedLogo = true;
    } else if (/class="[^"]*\blogo-container\b/i.test(next)) {
      next = next.replace(
        /(<div[^>]*class="[^"]*\blogo-container\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i,
        `$1${img}$3`
      );
      placedLogo = true;
    } else if (/<(?:div|span|a)[^>]*class="[^"]*\blogo\b/i.test(next)) {
      next = next.replace(
        /(<(?:div|span|a)[^>]*class="[^"]*\blogo\b[^"]*"[^>]*>)/i,
        `$1${img}`
      );
      placedLogo = true;
    }
  }

  if (photos.length) {
    let index = 0;
    next = next.replace(
      /<(?:div|figure|section|span)[^>]*(?:data-brand-photo|class="[^"]*(?:figure|cover|hero-preview|hero-art|photo)[^"]*")[^>]*>[\s\S]*?<img\b([^>]*)>/gi,
      (full, attrs: string) => {
        if (/lyon-logo|logo-svg/i.test(attrs)) return full;
        if (index >= photos.length) return full;
        const src = photos[index];
        index += 1;
        return full.replace(/<img\b([^>]*)>/i, (img: string, imgAttrs: string) => {
          if (/src="/i.test(imgAttrs)) {
            return `<img${imgAttrs.replace(/src="[^"]*"/i, `src="${src}"`)}>`;
          }
          return `<img src="${src}"${imgAttrs}>`;
        });
      }
    );
  }

  const photoCss = photos
    .map(
      (src, i) => `
  .card.c${i + 1},
  .row > .card:nth-of-type(${i + 1}) {
    background-image: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.42)), url("${src}") !important;
    background-size: cover !important;
    background-position: center !important;
  }`
    )
    .join('\n');
  const firstPhoto = photos[0];
  const slotCss = firstPhoto
    ? `
  .figure, .cover, .hero-preview, .photo, .hero-art, .hero-visual, .hero .visual {
    background-image: url("${firstPhoto}") !important;
    background-size: cover !important;
    background-position: center !important;
  }`
    : '';

  const css = `
<style data-lyon-media>
  .lyon-logo, img.lyon-logo, .logo-svg.lyon-logo {
    max-height: 56px; width: auto; object-fit: contain; display: block;
  }
  .lyon-media-mark {
    position: fixed; top: 16px; left: 16px; z-index: 80;
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 12px;
    background: rgba(255,255,255,0.9);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .lyon-media-mark img { height: 36px; width: auto; object-fit: contain; }
  .lyon-film {
    position: fixed; right: 16px; bottom: 16px; z-index: 80;
    display: flex; gap: 8px; padding: 8px; border-radius: 14px;
    background: rgba(15,23,42,0.55);
  }
  .lyon-film img {
    width: 72px; height: 72px; object-fit: cover; border-radius: 10px;
  }
  ${photoCss}
  ${slotCss}
</style>`;

  if (/<\/head>/i.test(next)) {
    next = next.replace(/<\/head>/i, `${css}\n</head>`);
  } else {
    next = css + next;
  }

  if (logo && !placedLogo) {
    const mark = `<div class="lyon-media-mark"><img class="lyon-logo" src="${logo}" alt="" /></div>`;
    if (/<\/body>/i.test(next)) {
      next = next.replace(/<\/body>/i, `${mark}\n</body>`);
    } else {
      next += mark;
    }
  }

  return next;
}
