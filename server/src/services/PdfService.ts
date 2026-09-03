import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ScriptPart } from './scriptForm';
import { resolveDocumentLook } from './BrandDocumentService';

const FONT_CANDIDATES = [
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/Library/Fonts/Arial Unicode.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
];

function pageSizeFromPaper(paper?: string): [number, number] {
  const p = (paper ?? 'A4').toLowerCase();
  const landscape = /land|ngang|-2$/.test(p);
  let size: [number, number] = [595.28, 841.89];
  if (/letter/.test(p)) size = [612, 792];
  else if (/a3/.test(p)) size = [841.89, 1190.55];
  else if (/a5/.test(p)) size = [419.53, 595.28];
  return landscape ? [size[1], size[0]] : size;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

function wrap(text: string, max: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderBrandedPdf(input: {
  title: string;
  parts: ScriptPart[];
  outputPath: string;
  brandId?: string;
  prompt?: string;
  paper?: string;
  palette?: import('./brandLook').BrandPaletteInput | null;
}): Promise<string> {
  const look = resolveDocumentLook(input.brandId, input.prompt, input.palette);
  const primary = look.primary || look.accent;
  const fontPath = FONT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!fontPath) {
    throw new Error('Không tìm thấy font để in tiếng Việt (cần Arial Unicode hoặc DejaVu).');
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await fsPromises.readFile(fontPath);
  const font = await pdf.embedFont(fontBytes, { subset: true });

  const pageSize = pageSizeFromPaper(input.paper);
  const bg = hexToRgb(look.surface);
  const text = hexToRgb(look.ink);
  const accent = hexToRgb(look.accent);
  const brand = hexToRgb(primary);
  const secondary = hexToRgb(look.secondary);

  const parts = input.parts.length
    ? input.parts
    : [{ id: '1', role: 'section' as const, title: input.title, body: '', notes: '' }];

  let page = pdf.addPage(pageSize);
  let y = page.getHeight() - 56;

  const paintPage = () => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
      color: rgb(bg.r, bg.g, bg.b),
    });
    page.drawRectangle({
      x: 0,
      y: page.getHeight() - 8,
      width: page.getWidth(),
      height: 8,
      color: rgb(brand.r, brand.g, brand.b),
    });
  };
  paintPage();

  const ensure = (need: number) => {
    if (y - need < 48) {
      page = pdf.addPage(pageSize);
      paintPage();
      y = page.getHeight() - 56;
    }
  };

  const drawLines = (
    lines: string[],
    size: number,
    color: { r: number; g: number; b: number }
  ) => {
    for (const line of lines) {
      ensure(size + 8);
      page.drawText(line, {
        x: 48,
        y,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      y -= size + 8;
    }
  };

  drawLines([look.name], 11, secondary);
  y -= 6;
  drawLines(wrap(input.title || look.name, 42), 22, text);
  y -= 10;

  for (const [index, part] of parts.entries()) {
    ensure(80);
    page.drawRectangle({
      x: 48,
      y: y + 10,
      width: 36,
      height: 3,
      color: rgb(brand.r, brand.g, brand.b),
    });
    y -= 8;
    drawLines(wrap(part.title || `Phần ${index + 1}`, 48), 16, text);
    if (part.body) drawLines(wrap(part.body, 68), 12, text);
    if (part.notes) drawLines(wrap(part.notes, 68), 11, secondary);
    y -= 16;
  }

  const bytes = await pdf.save();
  const outputPath = path.resolve(input.outputPath);
  await fsPromises.mkdir(path.dirname(outputPath), { recursive: true });
  await fsPromises.writeFile(outputPath, bytes);
  return outputPath;
}
