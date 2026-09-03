import type { BrandMedia } from './BrandMediaService';

function clampQuery(input: string, maxLen = 80): string {
  const s = String(input ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function unsplashSourceUrl(w: number, h: number, query: string): string {
  const q = clampQuery(query);
  // Unsplash Source: miễn phí, không cần API key (dựa theo redirect).
  // Truyền query dạng URL-encoded để tránh lỗi ký tự đặc biệt.
  const encoded = encodeURIComponent(q);
  return `https://source.unsplash.com/${w}x${h}/?${encoded}`;
}

function parseFirstNumber(raw: string): number | null {
  const m = String(raw).match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function splitStatsLines(statsRaw: string): Array<{ label: string; value: number }> {
  const lines = String(statsRaw ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const out: Array<{ label: string; value: number }> = [];
  for (const line of lines) {
    const value = parseFirstNumber(line);
    if (value === null) continue;

    // Label: phần còn lại sau số đầu tiên (thô thôi, đủ cho chart).
    const label = line.replace(/-?\d+(?:\.\d+)?/, '').trim() || `#${out.length + 1}`;
    out.push({ label, value });
  }

  return out.slice(0, 6);
}

function quickChartUrlBar({
  width,
  height,
  labels,
  values,
  title,
}: {
  width: number;
  height: number;
  labels: string[];
  values: number[];
  title?: string;
}): string {
  // QuickChart config dùng JSON encode vào querystring `c=...`
  // (không cần API key cho cấu hình đơn giản).
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title ?? 'Data',
          data: values,
        },
      ],
    },
    options: {
      legend: { display: false },
      title: { display: false },
      plugins: {
        tooltip: { enabled: true },
      },
      scales: {
        xAxes: [{ ticks: { fontSize: 12 } }],
        yAxes: [{ ticks: { beginAtZero: true, fontSize: 12 } }],
      },
    },
  };

  const c = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${c}&width=${width}&height=${height}&backgroundColor=transparent`;
}

function fallbackChartData(seedRaw: string): { labels: string[]; values: number[] } {
  const seed = Math.abs(
    Array.from(seedRaw).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  );
  const labels = ['A', 'B', 'C', 'D', 'E'].slice(0, 4).map((l, i) => `${l}${i + 1}`);
  const values = labels.map((_, i) => ((seed + i * 17) % 90) + 10);
  return { labels, values };
}

export async function enrichBrandMediaFromPrompt(input: {
  brandMedia: BrandMedia | null;
  templateType?: string;
  prompt?: string;
  fieldValues?: Record<string, string>;
}): Promise<BrandMedia | null> {
  const current = input.brandMedia;
  const photos = current?.photos ?? [];
  const logo = current?.logo;

  // Nếu đã có ảnh thì không can thiệp thêm (tránh giật layout / đổi style bất ngờ).
  if (photos.length > 0) {
    return current;
  }

  const title =
    input.fieldValues?.title?.trim() ||
    (input.fieldValues?.['fullName']?.trim() ?? '');
  const promptSnippet =
    (input.prompt ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) || '';

  const query = `${input.templateType ?? 'design'} ${title ?? ''} ${promptSnippet}`.trim();
  if (!query) return current;

  // Chọn kích thước ảnh dựa trên template type (đơn giản nhưng đủ cho injectBrandMedia).
  const isPortrait =
    input.fieldValues?.aspect === '9:16' ||
    input.fieldValues?.aspect === '4:5' ||
    input.templateType === 'poster' ||
    input.templateType === 'landing' ||
    input.templateType === 'event' ||
    input.templateType === 'infographic' ||
    input.templateType === 'certificate';

  const baseW = isPortrait ? 1200 : 1600;
  const baseH = isPortrait ? 1600 : 900;

  // Ưu tiên biểu đồ cho infographic: render chart miễn phí (QuickChart) để slot `.figure/.cover` có nội dung rõ.
  if (input.templateType === 'infographic') {
    const statsRaw = input.fieldValues?.stats ?? '';
    const parsed = splitStatsLines(statsRaw);
    const chart = parsed.length
      ? quickChartUrlBar({
          width: baseW,
          height: baseH,
          labels: parsed.map((p) => p.label),
          values: parsed.map((p) => p.value),
          title: title || undefined,
        })
      : (() => {
          const fb = fallbackChartData(title || query);
          return quickChartUrlBar({
            width: baseW,
            height: baseH,
            labels: fb.labels,
            values: fb.values,
            title: title || undefined,
          });
        })();

    return {
      logo,
      photos: [
        chart,
        unsplashSourceUrl(baseW, baseH, `${query} chart`),
        unsplashSourceUrl(baseW, baseH, `${query} data visualization`),
      ],
    };
  }

  const nextPhotos = [
    unsplashSourceUrl(baseW, baseH, query),
    unsplashSourceUrl(baseW, baseH, `${query} modern`),
    unsplashSourceUrl(baseW, baseH, `${query} abstract`),
  ];

  return {
    logo,
    photos: nextPhotos,
  };
}

export const externalAssetService = {
  enrichBrandMediaFromPrompt,
};

export default externalAssetService;

