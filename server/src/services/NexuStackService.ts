import fs from 'fs';
import path from 'path';
import { nexuTools } from '../config/nexu-tools';
import { countMotionRecipes } from './MotionRecipeService';
import { lookFromOpenDesign } from './brandLook';

const TOOLS = nexuTools.toolsRoot;

export interface NexuRepoStatus {
  id: string;
  name: string;
  url: string;
  present: boolean;
  role: string;
  usedFor: string;
  counts: Record<string, number>;
}

function countDirs(root: string, skip = new Set(['node_modules'])): number {
  if (!fs.existsSync(root)) return 0;
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          !skip.has(entry.name) &&
          !entry.name.startsWith('_')
      ).length;
  } catch {
    return 0;
  }
}

function present(rel: string): boolean {
  return fs.existsSync(path.join(TOOLS, rel));
}

export function probeNexuStack(): {
  toolsRoot: string;
  repos: NexuRepoStatus[];
  ready: boolean;
} {
  const htmlSkills = countDirs(
    path.join(TOOLS, 'html-anything/next/src/lib/templates/skills')
  );
  const videoTemplates = countDirs(path.join(TOOLS, 'html-video/templates'));
  const designSystems = countDirs(
    path.join(TOOLS, 'open-design/design-systems')
  );
  const designTemplates = countDirs(
    path.join(TOOLS, 'open-design/design-templates')
  );
  const nexuSkills =
    countDirs(path.join(TOOLS, 'nexu/nexu-skills')) +
    countDirs(path.join(TOOLS, 'nexu/skills'));
  const motions = countMotionRecipes();

  const repos: NexuRepoStatus[] = [
    {
      id: 'html-anything',
      name: 'html-anything',
      url: 'https://github.com/nexu-io/html-anything',
      present: htmlSkills > 0,
      role: 'Thiết kế HTML tĩnh',
      usedFor:
        '81 skill (example.html + SKILL.md) → preview / PNG / PDF / slide / poster',
      counts: { skills: htmlSkills },
    },
    {
      id: 'html-video',
      name: 'html-video',
      url: 'https://github.com/nexu-io/html-video',
      present: videoTemplates > 0,
      role: 'Khung hình video → MP4',
      usedFor:
        'Template Hyperframes: điền chữ + quay Chrome (CSS/JS chạy) ra MP4',
      counts: { templates: videoTemplates },
    },
    {
      id: 'motion-anything',
      name: 'motion-anything',
      url: 'https://github.com/nexu-io/motion-anything',
      present: motions > 0,
      role: 'Lớp chuyển động',
      usedFor:
        'Recipe CSS + JS (shiny, scramble, chữ chạy) nhúng vào preview và bản quay MP4',
      counts: { recipes: motions },
    },
    {
      id: 'open-design',
      name: 'open-design',
      url: 'https://github.com/nexu-io/open-design',
      present: designSystems > 0,
      role: 'Hệ thống nhận diện DESIGN.md',
      usedFor:
        '151 bộ tokens.css / DESIGN.md → màu thương hiệu khi chọn brand pack',
      counts: { designSystems, designTemplates },
    },
    {
      id: 'nexu',
      name: 'nexu',
      url: 'https://github.com/nexu-io/nexu',
      present: present('nexu/README.md') || nexuSkills > 0,
      role: 'Ứng dụng IM (OpenClaw)',
      usedFor:
        'WeChat / Feishu / Slack / Discord — không phải máy render file. Studio chỉ đọc skill catalog.',
      counts: { skills: nexuSkills },
    },
    {
      id: 'vox-director',
      name: 'vox-director',
      url: 'https://github.com/Alisa0808/vox-director',
      present:
        present('vox-director/SKILL.md') ||
        present('vox-director/references/prompt-guide.md'),
      role: 'Ngôn ngữ cắt giấy Vox',
      usedFor:
        '10 theme poster + 14 cung kể chuyện. Studio vẽ collage HTML local — không gọi Atlas.',
      counts: { themes: 10, arcs: 14 },
    },
    {
      id: 'deep-research',
      name: 'deep-research',
      url: 'https://github.com/dzhng/deep-research',
      present:
        present('deep-research/README.md') ||
        present('deep-research/src/deep-research.ts'),
      role: 'Nghiên cứu lặp (SERP → học → đào sâu)',
      usedFor:
        'Engine Studio chạy vòng nghiên cứu rồi đưa facts vào AI viết kịch bản. Firecrawl tuỳ chọn.',
      counts: { algorithm: 1 },
    },
  ];

  return {
    toolsRoot: TOOLS,
    repos,
    ready: repos
      .filter(
        (repo) =>
          repo.id !== 'nexu' &&
          repo.id !== 'vox-director' &&
          repo.id !== 'deep-research'
      )
      .every((repo) => repo.present),
  };
}

export function openDesignLookReady(brandId?: string): boolean {
  return Boolean(lookFromOpenDesign(brandId));
}
