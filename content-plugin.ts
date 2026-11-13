/**
 * Vite plugin that turns files in content/ into JS modules at build time:
 *   *.yaml -> parsed + validated data
 *   *.md   -> { slug, ...frontmatter, html }
 * Errors in content files fail the build with a readable message.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import YAML from 'yaml';
import { marked } from 'marked';

class ContentError extends Error {}

// External links in Markdown open in a new tab.
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      const t = title ? ` title="${title}"` : '';
      return `<a href="${href}"${t}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

function parseYaml(src: string, file: string) {
  const doc = YAML.parseDocument(src, { prettyErrors: true });
  if (doc.errors.length) {
    throw new ContentError(`\n\n✖ YAML error in ${file}:\n${doc.errors.map((e) => e.message).join('\n')}\n`);
  }
  return doc.toJS();
}

function splitFrontmatter(src: string, file: string) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (!m) return { data: {}, body: src };
  return { data: parseYaml(m[1], file) ?? {}, body: m[2] };
}

function fail(file: string, msg: string): never {
  throw new ContentError(`\n\n✖ Content error in ${file}:\n  ${msg}\n`);
}

const isStr = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

let areaIds: string[] | null = null;
function loadAreaIds(root: string) {
  if (areaIds) return areaIds;
  const src = fs.readFileSync(path.join(root, 'content/research-areas.yaml'), 'utf8');
  areaIds = (YAML.parse(src) as { id: string }[]).map((a) => a.id);
  return areaIds;
}

function validate(rel: string, data: any, root: string) {
  if (rel === 'content/publications.yaml') {
    if (!Array.isArray(data)) fail(rel, 'expected a list of publications');
    const ids = loadAreaIds(root);
    data.forEach((p: any, i: number) => {
      const where = `publication #${i + 1}${p?.title ? ` ("${String(p.title).slice(0, 50)}")` : ''}`;
      if (!isStr(p?.title)) fail(rel, `${where} is missing a title`);
      if (typeof p.year !== 'number') fail(rel, `${where} needs a numeric year (e.g. year: 2026)`);
      if (p.area && !ids.includes(p.area)) fail(rel, `${where} has unknown area "${p.area}". Use one of: ${ids.join(', ')}`);
      if (p.citation) p.citationHtml = baseHtml(marked.parseInline(String(p.citation)) as string);
    });
  }
  if (rel === 'content/people.yaml') {
    for (const g of data?.groups ?? []) {
      if (!isStr(g.title)) fail(rel, 'every group needs a title');
      (g.members ?? []).forEach((m: any, i: number) => {
        if (!isStr(m?.name)) fail(rel, `member #${i + 1} of "${g.title}" is missing a name`);
      });
    }
    if (data.intro) data.introHtml = baseHtml(marked.parse(String(data.intro)) as string);
  }
}

/** Prefix site-absolute asset paths / links with the deploy base (e.g. /matterlab-site/). */
let base = '/';
const withBase = (p: string) => (base === '/' ? p : base.replace(/\/$/, '') + p);
const ASSET = /^\/(images|fonts)\//;

/** In production builds, headshots in public/images/people/ are resized + converted to WebP (see writeBundle). */
export const PHOTO_DIR = 'images/people';
export const PHOTO_SIZE = 400; // px, square; shown at ~150 CSS px, so this covers 2-3x screens
const PHOTO_RE = /^\/images\/people\/(.+)\.(jpe?g|png)$/i;
let optimizePhotos = false;
const photoPath = (p: string) => (optimizePhotos ? p.replace(PHOTO_RE, '/images/people/$1.webp') : p);

function baseAssets(v: any): any {
  if (typeof v === 'string') return ASSET.test(v) ? withBase(photoPath(v)) : v;
  if (Array.isArray(v)) return v.map(baseAssets);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, baseAssets(x)]));
  return v;
}
const baseHtml = (html: string) => (base === '/' ? html : html.replace(/(\s(?:src|href))="\/(?!\/)/g, `$1="${base}`));

export default function content(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';
  let isClientBuild = false;
  return {
    name: 'matterlab-content',
    configResolved(c) {
      root = c.root;
      base = c.base;
      optimizePhotos = c.command === 'build';
      isClientBuild = c.command === 'build' && !c.build.ssr;
      outDir = path.resolve(c.root, c.build.outDir);
    },
    async writeBundle() {
      if (!isClientBuild) return;
      const dir = path.join(outDir, PHOTO_DIR);
      if (!fs.existsSync(dir)) return;
      const { default: sharp } = await import('sharp');
      const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));
      let before = 0;
      let after = 0;
      await Promise.all(
        files.map(async (f) => {
          const src = path.join(dir, f);
          const dest = src.replace(/\.(jpe?g|png)$/i, '.webp');
          before += fs.statSync(src).size;
          await sharp(src).rotate().resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
          after += fs.statSync(dest).size;
          fs.rmSync(src);
        }),
      );
      const kb = (n: number) => `${Math.round(n / 1024)} KB`;
      console.log(`Optimized ${files.length} people photos: ${kb(before)} -> ${kb(after)}`);
    },
    transform(src, id) {
      const file = id.split('?')[0];
      const rel = path.relative(root, file).split(path.sep).join('/');
      if (!rel.startsWith('content/')) return;
      if (rel === 'content/research-areas.yaml') areaIds = null;
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const data = parseYaml(src, rel);
        validate(rel, data, root);
        return { code: `export default ${JSON.stringify(baseAssets(data))};`, map: null };
      }
      if (file.endsWith('.md')) {
        const { data, body } = splitFrontmatter(src, rel);
        if (!isStr(data.title)) fail(rel, 'frontmatter needs a `title:`');
        const slug = path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
        if (data.date instanceof Date) data.date = data.date.toISOString().slice(0, 10);
        const html = baseHtml(marked.parse(body) as string);
        return { code: `export default ${JSON.stringify(baseAssets({ slug, ...data, html }))};`, map: null };
      }
    },
  };
}
