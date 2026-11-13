/**
 * After `vite build` (client) and `vite build --ssr` (server), render every
 * route to static HTML so the site works without JS and is indexable.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render, allPaths, getMeta, site, base } = await import(pathToFileURL(ssrEntry).href);
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function head(url) {
  const m = getMeta(url);
  const canonical = site.url.replace(/\/$/, '') + (url === '/' ? '/' : url);
  const image = m.image ? site.url.replace(/\/$/, '') + m.image : site.url.replace(/\/$/, '') + '/images/brand/favicon-256.png';
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}

async function write(url, file) {
  const html = template.replace('<!--head-->', head(url)).replace('<!--app-->', render(base.replace(/\/$/, '') + url));
  const dest = path.join(dist, file);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, html);
}

const paths = allPaths();
for (const url of paths) {
  await write(url, url === '/' ? 'index.html' : path.join(url, 'index.html'));
}
await write('/404', '404.html');

// sitemap.xml
const siteBase = site.url.replace(/\/$/, '');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${siteBase}${p === '/' ? '/' : p}</loc></url>`).join('\n')}
</urlset>
`;
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap);
await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteBase}/sitemap.xml\n`);
await fs.rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });

console.log(`Pre-rendered ${paths.length + 1} pages.`);
