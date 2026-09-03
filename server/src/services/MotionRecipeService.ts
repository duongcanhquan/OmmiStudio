import fs from 'fs';
import path from 'path';

const RECIPES_DIR = path.resolve(
  __dirname,
  '../../tools/motion-anything/recipes'
);

function walkRecipes(dir: string, depth = 0): string[] {
  if (depth > 5 || !fs.existsSync(dir)) return [];
  const found: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const isRecipe = entries.some(
    (entry) =>
      entry.isFile() && /^(recipe\.motion\.ya?ml|SKILL\.md)$/i.test(entry.name)
  );
  if (isRecipe) {
    found.push(dir);
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    found.push(...walkRecipes(path.join(dir, entry.name), depth + 1));
  }
  return found;
}

function findRecipeDir(recipeId?: string): string | null {
  if (!recipeId?.trim() || !fs.existsSync(RECIPES_DIR)) return null;
  const want = recipeId.trim().toLowerCase();
  const dirs = walkRecipes(RECIPES_DIR);
  for (const dir of dirs) {
    if (path.basename(dir).toLowerCase() === want) return dir;
  }
  return dirs.find((dir) => path.basename(dir).toLowerCase().includes(want)) ?? null;
}

export function countMotionRecipes(): number {
  if (!fs.existsSync(RECIPES_DIR)) return 0;
  return walkRecipes(RECIPES_DIR).length;
}

function collectRecipeAssets(dir: string): { css: string; js: string } {
  let css = '';
  let js = '';
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return { css, js };
  }
  for (const name of files) {
    const full = path.join(dir, name);
    try {
      if (name.endsWith('.css')) {
        css += `\n/* motion-anything · ${name} */\n${fs.readFileSync(full, 'utf-8')}\n`;
      } else if (name.endsWith('.js') && !name.endsWith('.min.js.map')) {
        js += `\n/* motion-anything · ${name} */\n${fs.readFileSync(full, 'utf-8')}\n`;
      }
    } catch {
      // skip unreadable asset
    }
  }
  return { css, js };
}

function activatorScript(recipeId: string): string {
  const id = recipeId.toLowerCase();
  if (id.includes('shiny')) {
    return `<script data-lyon-motion-apply>
document.addEventListener('DOMContentLoaded', function () {
  var nodes = document.querySelectorAll('h1, h2.hero, .text-diff');
  for (var i = 0; i < nodes.length; i++) {
    if (!nodes[i].classList.contains('shiny')) nodes[i].classList.add('shiny');
  }
});
</script>`;
  }
  if (id.includes('scramble')) {
    return `<script data-lyon-motion-apply>
document.addEventListener('DOMContentLoaded', function () {
  var h = document.querySelector('h1, h2.hero');
  if (!h) return;
  var text = (h.getAttribute('data-text') || h.innerText || '').replace(/\\s+/g, ' ').trim();
  h.classList.add('scramble');
  h.setAttribute('data-text', text);
});
</script>`;
  }
  return '';
}

/**
 * Nhúng CSS + JS recipe motion-anything, rồi gắn class lên headline
 * để preview iframe và bản quay MP4 thật sự chạy (không chỉ một khung PNG).
 */
export function injectMotionRecipe(html: string, recipeId?: string): string {
  const dir = findRecipeDir(recipeId);
  if (!dir) return html;
  const { css, js } = collectRecipeAssets(dir);
  if (!css.trim() && !js.trim()) return html;
  const id = path.basename(dir);
  const style = css.trim()
    ? `<style data-lyon-motion="${id}">${css}</style>`
    : '';
  const script = js.trim()
    ? `<script data-lyon-motion-js="${id}">${js}</script>`
    : '';
  const apply = activatorScript(id);
  const block = `${style}\n${script}\n${apply}`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${block}\n</head>`);
  }
  return block + html;
}
