/** Rút chữ lên màn hình: ngắn, tiếng Việt, bỏ chỉ dẫn dựng phim. */
export function toScreenCopy(raw: string, fallback = 'OmniStudio'): string {
  let text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;

  const quoted = text.match(/[«“"]([^»”"]{4,72})[»”"]/);
  const quotedText = quoted?.[1]?.trim() ?? '';
  if (
    quotedText &&
    !/^(fade-in|slide-up|zoom-in|ken-burns|glitch|typewriter)$/i.test(
      quotedText
    )
  ) {
    return quotedText;
  }

  text = text
    .replace(/^(?:cảnh|scene|slide|khung hình)\s*\d+\s*[:.\-–)]*\s*/i, '')
    .replace(/chữ hiển thị[^:]*:\s*/gi, '')
    .replace(/(?:lời(?:\s*đọc)?|voiceover)\s*:\s*/gi, '')
    .replace(/text to animate[^:]*:\s*/gi, '')
    .replace(/kinetic(?:\s+effect)?[^:]*:\s*/gi, '')
    .trim();

  const looksLikeDirection =
    /kinetic|slam effect|sans-serif|text to animate|b-roll|footage/i.test(text);
  if (looksLikeDirection) {
    const viet = text.match(
      /[A-ZÀ-Ỵ][A-Za-zÀ-ỹà-ỹ0-9 /,]{6,70}[.!?…]?/
    );
    if (viet) return viet[0].trim();
  }

  const sentence = text.split(/(?<=[.!?…])\s+/)[0] ?? text;
  return (sentence || fallback).slice(0, 72).trim();
}

export const KINETIC_MOTIONS = [
  'fade-in',
  'slide-up',
  'zoom-in',
  'ken-burns',
] as const;
