/**
 * Vòng nghiên cứu kiểu dzhng/deep-research:
 * ý tưởng → truy vấn SERP → học từ nguồn → đào sâu (depth) → brief cho AI viết kịch bản.
 * LLM = Settings Studio. Tìm web = Firecrawl (nếu có key) hoặc DuckDuckGo + Wikipedia.
 */
import { configManager } from '../config/ConfigManager';
import { canCallConfiguredLlm, completeJsonObject } from './LLMService';

export interface ResearchHit {
  title: string;
  url: string;
  snippet: string;
  markdown?: string;
}

export interface ResearchResult {
  learnings: string[];
  visitedUrls: string[];
  report: string;
  searchBackend: 'firecrawl' | 'open-web';
}

function researcherPrompt(): string {
  const now = new Date().toISOString().slice(0, 10);
  return [
    `Bạn là nhà nghiên cứu. Hôm nay là ${now}.`,
    'Chỉ tiếng Việt có dấu, trừ tên riêng / thuật ngữ.',
    'Ưu tiên số liệu, ngày, tên, nguồn. Không bịa. Nếu không chắc, ghi «chưa xác nhận».',
    'Trả lời đúng schema JSON được yêu cầu.',
  ].join(' ');
}

function firecrawlConfig(): { key: string; baseUrl: string } {
  const settings = configManager.getConfig();
  const research = settings.research ?? {
    firecrawlKey: '',
    firecrawlBaseUrl: '',
  };
  const key =
    research.firecrawlKey?.trim() || process.env.FIRECRAWL_KEY?.trim() || '';
  const baseUrl = (
    research.firecrawlBaseUrl?.trim() ||
    process.env.FIRECRAWL_BASE_URL?.trim() ||
    'https://api.firecrawl.dev'
  ).replace(/\/$/, '');
  return { key, baseUrl };
}

function decodeHref(raw: string): string {
  try {
    const href = raw.replace(/&amp;/g, '&');
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg?.[1]) return decodeURIComponent(uddg[1]);
    if (href.startsWith('http')) return href;
    return '';
  } catch {
    return '';
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'LYONStudio/1.0 (research; +https://localhost)',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function searchFirecrawl(query: string): Promise<ResearchHit[]> {
  const { key, baseUrl } = firecrawlConfig();
  if (!key) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18_000);
  try {
    const res = await fetch(`${baseUrl}/v1/search`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });
    if (!res.ok) {
      console.warn('[deep-research] Firecrawl', res.status);
      return [];
    }
    const json = (await res.json()) as {
      data?: Array<{
        url?: string;
        title?: string;
        description?: string;
        markdown?: string;
      }>;
    };
    return (json.data ?? [])
      .filter((row) => row.url)
      .map((row) => ({
        title: row.title || row.url || '',
        url: row.url || '',
        snippet: row.description || '',
        markdown: row.markdown?.slice(0, 8000),
      }));
  } catch (err) {
    console.warn('[deep-research] Firecrawl failed', err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function searchDuckDuckGo(query: string): Promise<ResearchHit[]> {
  const body = new URLSearchParams({ q: query, kl: 'vn-vi' }).toString();
  const posted = await (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const res = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'LYONStudio/1.0 (research)',
        },
        body,
      });
      if (!res.ok) return '';
      return await res.text();
    } catch {
      return '';
    } finally {
      clearTimeout(timer);
    }
  })();

  const hits: ResearchHit[] = [];
  const blockRe =
    /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(posted)) && hits.length < 5) {
    const url = decodeHref(match[1]);
    if (!url || url.includes('duckduckgo.com')) continue;
    hits.push({
      title: stripTags(match[2]).slice(0, 160),
      url,
      snippet: stripTags(match[3]).slice(0, 400),
    });
  }
  return hits;
}

async function searchWikipedia(query: string): Promise<ResearchHit[]> {
  const api =
    'https://vi.wikipedia.org/w/api.php?action=query&list=search&format=json&utf8=1&srlimit=3&srsearch=' +
    encodeURIComponent(query);
  const raw = await fetchText(api, 10_000);
  if (!raw) return [];
  try {
    const json = JSON.parse(raw) as {
      query?: { search?: Array<{ title: string; snippet: string }>; };
    };
    const rows = json.query?.search ?? [];
    const hits: ResearchHit[] = [];
    for (const row of rows.slice(0, 2)) {
      const title = row.title;
      const extractUrl =
        'https://vi.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&format=json&utf8=1&titles=' +
        encodeURIComponent(title);
      const extractRaw = await fetchText(extractUrl, 8_000);
      let markdown = stripTags(row.snippet);
      try {
        const ex = JSON.parse(extractRaw) as {
          query?: { pages?: Record<string, { extract?: string }> };
        };
        const page = Object.values(ex.query?.pages ?? {})[0];
        if (page?.extract) markdown = page.extract.slice(0, 2500);
      } catch {
        // keep snippet
      }
      hits.push({
        title,
        url: `https://vi.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        snippet: stripTags(row.snippet).slice(0, 400),
        markdown,
      });
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchWeb(query: string): Promise<{
  hits: ResearchHit[];
  backend: 'firecrawl' | 'open-web';
}> {
  const fire = await searchFirecrawl(query);
  if (fire.length) return { hits: fire, backend: 'firecrawl' };
  const [ddg, wiki] = await Promise.all([
    searchDuckDuckGo(query),
    searchWikipedia(query),
  ]);
  const seen = new Set<string>();
  const hits: ResearchHit[] = [];
  for (const hit of [...wiki, ...ddg]) {
    if (!hit.url || seen.has(hit.url)) continue;
    seen.add(hit.url);
    hits.push(hit);
  }
  return { hits: hits.slice(0, 6), backend: 'open-web' };
}

async function generateSerpQueries(input: {
  query: string;
  numQueries: number;
  learnings?: string[];
}): Promise<Array<{ query: string; researchGoal: string }>> {
  const data = await completeJsonObject<{
    queries?: Array<{ query?: string; researchGoal?: string }>;
  }>(
    researcherPrompt(),
    [
      `Tạo tối đa ${input.numQueries} truy vấn tìm kiếm (SERP) cho ý tưởng sau.`,
      'Mỗi truy vấn khác nhau, cụ thể, có thể tìm được trên web tiếng Việt hoặc tiếng Anh.',
      `Ý tưởng: ${input.query}`,
      input.learnings?.length
        ? `Đã biết (đào sâu hơn, đừng lặp):\n${input.learnings.join('\n')}`
        : '',
      'JSON: {"queries":[{"query":"...","researchGoal":"..."}]}',
    ]
      .filter(Boolean)
      .join('\n\n')
  );
  return (data.queries ?? [])
    .map((row) => ({
      query: (row.query || '').trim(),
      researchGoal: (row.researchGoal || '').trim(),
    }))
    .filter((row) => row.query)
    .slice(0, input.numQueries);
}

async function processHits(input: {
  query: string;
  hits: ResearchHit[];
  numLearnings: number;
}): Promise<{ learnings: string[]; followUpQuestions: string[] }> {
  const contents = input.hits
    .map((hit) => {
      const body = (hit.markdown || hit.snippet || '').slice(0, 4000);
      return `Nguồn: ${hit.title}\nURL: ${hit.url}\n${body}`;
    })
    .join('\n\n---\n\n');
  if (!contents.trim()) {
    return { learnings: [], followUpQuestions: [] };
  }
  const data = await completeJsonObject<{
    learnings?: string[];
    followUpQuestions?: string[];
  }>(
    researcherPrompt(),
    [
      `Từ kết quả tìm «${input.query}», rút tối đa ${input.numLearnings} học được (learnings).`,
      'Mỗi learning: đặc, có số/ngày/tên nếu có. Không trùng nhau.',
      'Thêm 2–3 câu hỏi follow-up để đào sâu.',
      contents,
      'JSON: {"learnings":["..."],"followUpQuestions":["..."]}',
    ].join('\n\n')
  );
  return {
    learnings: (data.learnings ?? []).map((row) => row.trim()).filter(Boolean),
    followUpQuestions: (data.followUpQuestions ?? [])
      .map((row) => row.trim())
      .filter(Boolean),
  };
}

async function writeScriptBrief(input: {
  idea: string;
  learnings: string[];
  urls: string[];
}): Promise<string> {
  const data = await completeJsonObject<{ report?: string }>(
    researcherPrompt(),
    [
      'Viết brief nghiên cứu NGẮN để AI viết kịch bản / chữ thiết kế — không phải luận văn.',
      '1 trang: móc mở hay, 5–8 facts có thể lên hình, 1 góc kể chuyện, CTA gợi ý, nguồn.',
      `Ý tưởng gốc:\n${input.idea}`,
      `Learnings:\n${input.learnings.map((row) => `- ${row}`).join('\n')}`,
      `Nguồn:\n${input.urls.map((url) => `- ${url}`).join('\n')}`,
      'JSON: {"report":"markdown tiếng Việt"}',
    ].join('\n\n')
  );
  const body = (data.report || '').trim();
  const sources =
    input.urls.length > 0
      ? `\n\n## Nguồn\n${input.urls.map((url) => `- ${url}`).join('\n')}`
      : '';
  return (body || input.learnings.map((row) => `- ${row}`).join('\n')) + sources;
}

async function researchLoop(input: {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
  backend?: 'firecrawl' | 'open-web';
}): Promise<ResearchResult> {
  const learnings = [...(input.learnings ?? [])];
  const visitedUrls = [...(input.visitedUrls ?? [])];
  let backend: 'firecrawl' | 'open-web' =
    input.backend ?? (firecrawlConfig().key ? 'firecrawl' : 'open-web');

  let serpQueries: Array<{ query: string; researchGoal: string }>;
  try {
    serpQueries = await generateSerpQueries({
      query: input.query,
      numQueries: Math.max(1, input.breadth),
      learnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `LLM không tạo được truy vấn nghiên cứu. Kiểm tra Cài đặt AI. ${message}`
    );
  }
  if (!serpQueries.length) {
    throw new Error('LLM không trả về truy vấn tìm kiếm. Thử viết ý tưởng rõ hơn.');
  }

  for (const serp of serpQueries) {
    const found = await searchWeb(serp.query);
    backend = found.backend;
    const urls = found.hits.map((hit) => hit.url).filter(Boolean);
    visitedUrls.push(...urls);
    const extracted = await processHits({
      query: serp.query,
      hits: found.hits,
      numLearnings: 3,
    });
    learnings.push(...extracted.learnings);

    if (input.depth > 1 && extracted.followUpQuestions.length) {
      const next = await researchLoop({
        query: [
          `Mục tiêu: ${serp.researchGoal}`,
          `Hướng tiếp: ${extracted.followUpQuestions.join('; ')}`,
        ].join('\n'),
        breadth: Math.max(1, Math.ceil(input.breadth / 2)),
        depth: input.depth - 1,
        learnings,
        visitedUrls,
        backend,
      });
      learnings.push(...next.learnings);
      visitedUrls.push(...next.visitedUrls);
      backend = next.searchBackend;
    }
  }

  return {
    learnings: [...new Set(learnings.map((row) => row.trim()).filter(Boolean))],
    visitedUrls: [...new Set(visitedUrls)],
    report: '',
    searchBackend: backend,
  };
}

export async function runDeepResearch(input: {
  idea: string;
  breadth?: number;
  depth?: number;
}): Promise<ResearchResult> {
  if (!canCallConfiguredLlm()) {
    throw new Error(
      'Cần LLM trong Cài đặt (Ollama hoặc API key) để nghiên cứu sâu.'
    );
  }
  const idea = input.idea.trim();
  if (!idea) {
    throw new Error('Viết ý tưởng trước khi nghiên cứu.');
  }
  const breadth = Math.min(4, Math.max(1, input.breadth ?? 2));
  const depth = Math.min(3, Math.max(1, input.depth ?? 1));
  const loop = await researchLoop({ query: idea, breadth, depth });
  if (!loop.learnings.length && !loop.visitedUrls.length) {
    throw new Error(
      'Không lấy được nguồn web. Thử ý tưởng cụ thể hơn, hoặc thêm Firecrawl trong Cài đặt → Hệ thống.'
    );
  }
  const report = await writeScriptBrief({
    idea,
    learnings: loop.learnings,
    urls: loop.visitedUrls,
  });
  return { ...loop, report };
}

export function formatResearchBrief(result: ResearchResult, idea: string): string {
  return [
    '=== NGHIÊN CỨU SÂU (deep-research) ===',
    `Ý tưởng: ${idea.trim()}`,
    `Nguồn tìm: ${result.searchBackend === 'firecrawl' ? 'Firecrawl' : 'web mở (DuckDuckGo / Wikipedia)'}`,
    result.report,
    result.learnings.length
      ? `Learnings:\n${result.learnings.map((row) => `- ${row}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
