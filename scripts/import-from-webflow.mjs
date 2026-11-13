#!/usr/bin/env node
/**
 * One-off importer: scrapes the live Webflow site and writes everything into
 * `content/` (YAML + Markdown) and `public/images/` (all images downloaded).
 *
 * Usage:  npm run import:webflow            # fetch from the live site
 *         npm run import:webflow -- --force # overwrite existing content files
 *
 * Re-run it right before switching DNS if people edited Webflow in the meantime.
 * After the switch this script (and the cheerio/turndown dev deps) can be deleted.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import YAML from 'yaml';

const BASE = 'https://www.matter.toronto.edu';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CONTENT = path.join(ROOT, 'content');
const IMAGES = path.join(ROOT, 'public', 'images');
const FORCE = process.argv.includes('--force');

const AREA_BY_LABEL = {
  'quantum computing': 'quantum-computing',
  'energy & functional materials': 'energy-and-functional-materials',
  'electronic structure methods': 'electronic-structure-methods',
  'ai for discovery & self-driving labs': 'ai-for-discovery-and-self-driving-labs',
  'biophysics, molecular computers & other topics': 'biophysics-molecular-computers-and-other-topics',
};
const AREA_BY_COLOR = {
  '#02ceff': 'quantum-computing',
  '#ff3f3c': 'energy-and-functional-materials',
  '#12f98b': 'electronic-structure-methods',
  '#ffeb00': 'ai-for-discovery-and-self-driving-labs',
  '#ff4a96': 'biophysics-molecular-computers-and-other-topics',
};

// ---------- helpers ----------
const cache = new Map();
async function get(url) {
  if (cache.has(url)) return cache.get(url);
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { 'user-agent': 'matterlab-site-importer' } });
    if (res.ok) {
      const t = await res.text();
      cache.set(url, t);
      return t;
    }
    if (res.status === 404) return null;
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`Failed to fetch ${url}`);
}

/** Visible-only cheerio: drop Webflow's conditionally hidden / empty nodes. */
async function load(pathname, { raw = false } = {}) {
  const html = await get(BASE + pathname);
  if (!html) return null;
  const $ = cheerio.load(html);
  if (raw) return $;
  $('.w-condition-invisible, .w-dyn-bind-empty, script, style, noscript').remove();
  return $;
}

const clean = (s) => (s ?? '').replace(/‍/g, '').replace(/\s+/g, ' ').trim();

function bgUrl(style) {
  const m = /background-image:\s*url\((?:"([^"]+)"|'([^']+)'|([^)]+))\)/.exec(style || '');
  return m ? (m[1] || m[2] || m[3]).replace(/&quot;/g, '') : null;
}

const downloaded = new Map();
async function image(url, folder) {
  if (!url || url === 'none') return undefined;
  if (url.startsWith('//')) url = 'https:' + url;
  if (downloaded.has(url)) return downloaded.get(url);
  const u = new URL(url);
  let name = decodeURIComponent(path.basename(u.pathname));
  // Webflow prefixes files with a 24-char hex id: strip it, keep a short hash for uniqueness
  name = name.replace(/^[0-9a-f]{24}_/, '');
  const ext = path.extname(name).toLowerCase() || '.jpg';
  const stem = path
    .basename(name, path.extname(name))
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 6);
  const file = `${stem || 'image'}-${hash}${ext}`;
  const dest = path.join(IMAGES, folder, file);
  const publicPath = `/images/${folder}/${file}`;
  downloaded.set(url, publicPath);
  try {
    await fs.access(dest);
  } catch {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! could not download ${url} (${res.status})`);
      downloaded.set(url, url);
      return url;
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  return publicPath;
}

/** Make links relative when they point at our own site. */
function localizeHref(href) {
  if (!href) return href;
  const m = /^(?:https?:)?\/\/(?:www\.)?(?:matter\.toronto\.edu|the-matter-lab\.webflow\.io)(\/[^#?]*)?(.*)$/.exec(href);
  if (m) return (m[1] || '/') + (m[2] || '');
  if (/^www\./.test(href)) return 'https://' + href;
  return href;
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
td.addRule('wf-figure', {
  filter: 'figure',
  replacement: (_c, node) => {
    const img = node.querySelector('img');
    const cap = node.querySelector('figcaption');
    if (!img) return '';
    const src = img.getAttribute('src');
    return `\n\n![${clean(cap?.textContent || img.getAttribute('alt') || '')}](${src})\n\n`;
  },
});
td.addRule('wf-embed', {
  filter: (node) => node.nodeName === 'DIV' && /w-embed|w-iframe/.test(node.getAttribute('class') || ''),
  replacement: (_c, node) => `\n\n${node.innerHTML.trim()}\n\n`,
});

async function richToMarkdown($, el, imgFolder) {
  if (!el || !el.length) return '';
  // download images and localize links before converting
  for (const img of el.find('img').toArray()) {
    const src = $(img).attr('src');
    $(img).attr('src', await image(src, imgFolder));
  }
  el.find('a').each((_, a) => $(a).attr('href', localizeHref($(a).attr('href'))));
  el.find('p').each((_, p) => {
    if (!clean($(p).text()) && !$(p).find('img').length) $(p).remove();
  });
  let md = td.turndown($.html(el.contents()) || '');
  md = md.replace(/‍/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

async function write(rel, data) {
  const dest = path.join(CONTENT, rel);
  if (!FORCE) {
    try {
      await fs.access(dest);
      console.log(`  = skip ${rel} (exists, use --force)`);
      return;
    } catch {}
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, data);
  console.log(`  + ${rel}`);
}

const yaml = (obj) => YAML.stringify(obj, { lineWidth: 0, defaultStringType: 'PLAIN' });
const frontmatter = (fm, body) => `---\n${yaml(fm)}---\n\n${body ? body + '\n' : ''}`;
const prune = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)));
const unobfuscate = (e) => clean(e).replace(/\s*\[at\]\s*/i, '@');

// ---------- people ----------
async function importPeople() {
  console.log('People');
  const $ = await load('/people');
  const intro = await richToMarkdown($, $('.page-title.people-page').parent().find('p, .w-richtext').first().parent().clone().find('.page-title, a.button-style').remove().end(), 'misc');
  const groups = [];
  let current = null;
  const titles = $('.section-titles').toArray();
  for (const t of titles) {
    const title = clean($(t).text());
    if (/alumni/i.test(title)) continue;
    current = { id: title.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), title, members: [] };
    groups.push(current);
    // cards between this title and the next title
    const section = $(t).closest('.w-container, .container, section, div').first();
    void section;
  }
  // Walk the document in order, assigning cards to the latest title seen.
  let gi = -1;
  const all = $('.section-titles, .person-image').toArray();
  for (const el of all) {
    const $el = $(el);
    if ($el.hasClass('section-titles')) {
      if (/alumni/i.test($el.text())) {
        gi = -2;
        continue;
      }
      gi++;
      continue;
    }
    if (gi < 0) continue;
    const card = $el.closest('.w-dyn-item');
    let name = clean(card.find('.name').first().text());
    let role;
    const m = /^(.*?)\s*\(([^)]*(?:assistant|coordinator|technician|manager|administrat)[^)]*)\)\s*$/i.exec(name);
    if (m) [, name, role] = m;
    const email = clean(card.find('.email-address').first().text());
    const addr = card.find('.address-title').first().nextAll().toArray();
    const addressLines = [];
    for (const a of addr) {
      if ($(a).hasClass('research-area-heading')) break;
      $(a).find('br').replaceWith('\n');
      $(a).find('p, div').each((_, p) => {
        $(p).append('\n');
      });
      $(a)
        .text()
        .split('\n')
        .map(clean)
        .filter(Boolean)
        .forEach((l) => addressLines.push(l.replace(/,$/, '')));
    }
    const areasEl = card.find('.research-area-heading').first().nextAll();
    const areas = [];
    areasEl.each((_, a) => {
      if ($(a).is('a') || $(a).find('a.button-style').length) return;
      const $a = $(a);
      $a.find('br').replaceWith('\n');
      $a.find('p, li, div').each((_, p) => $(p).append('\n'));
      $a.text()
        .split('\n')
        .map(clean)
        .filter(Boolean)
        .forEach((p) => areas.push(p));
    });
    const links = card
      .find('a.personal-website-button')
      .toArray()
      .map((a) => ({ label: clean($(a).text()), url: localizeHref($(a).attr('href')) }))
      .filter((l) => l.label && l.url && l.url !== '#');
    const photo = await image(bgUrl($el.attr('style')), 'people');
    groups[gi]?.members.push(
      prune({
        name,
        role,
        email: email ? unobfuscate(email) : undefined,
        photo,
        address: addressLines.length ? addressLines : undefined,
        areas,
        links,
      }),
    );
  }

  // alumni
  const alumni = [];
  $('.alumni-category-title').each((_, t) => {
    const title = clean($(t).text());
    const list = $(t).nextAll().find('.name').addBack('.name');
    const names = [];
    $(t)
      .nextAll('.people-collection')
      .first()
      .find('.name')
      .each((_, n) => {
        const a = $(n).closest('a');
        const href = a.attr('href');
        names.push(href && href !== '#' ? { name: clean($(n).text()), url: localizeHref(href) } : clean($(n).text()));
      });
    void list;
    alumni.push({ title, people: names });
  });

  const header = `# People page content.\n# - Add / remove / reorder people by editing the lists below; order here = order on the site.\n# - photo: put the image file in public/images/people/ and reference it as /images/people/<file>\n# - Emails are shown as name[at]domain on the site (light spam protection).\n`;
  await write(
    'people.yaml',
    header +
      yaml({
        title: 'People',
        intro: intro || undefined,
        groups,
        alumni: { title: 'Alumni', note: 'See our full constellation of alumni at [Matter.world](https://matterlab.world/)!', categories: alumni },
      }),
  );
}

// ---------- publications ----------
async function importPublications() {
  console.log('Publications');
  const $ = await load('/publications');
  const items = $('.publication-section .w-dyn-item').toArray();
  const pubs = [];
  for (const it of items) {
    const $it = $(it);
    const title = clean($it.find('.publication-title').first().text());
    if (!title) continue;
    const year = Number(clean($it.find('.hp-feature-date.year').first().text())) || undefined;
    const venue = clean($it.find('.journal-name').first().text()) || undefined;
    const authors = clean($it.find('.authors').first().text()) || undefined;
    const areaLabel = clean($it.find('.research-area').first().text()).toLowerCase();
    let area = AREA_BY_LABEL[areaLabel];
    if (!area) {
      const color = /background-color:\s*(#[0-9a-f]{6})/i.exec($it.find('.publication-image-div').attr('style') || '')?.[1]?.toLowerCase();
      area = AREA_BY_COLOR[color];
    }
    const url = localizeHref($it.find('a.publication-link, a.request-pdf').first().attr('href')) || undefined;
    const scholar = localizeHref($it.find('a.google-scholar-button').first().attr('href')) || undefined;
    const imgStyle = $it.find('.publication-image').attr('style');
    const img = await image(bgUrl(imgStyle), 'publications');
    const citeEl = $it.find('.publication-citation-text').first();
    const citation = citeEl.length ? await richToMarkdown($, citeEl, 'publications') : undefined;
    pubs.push(prune({ title, year, venue, authors, area, url: url === '#' ? undefined : url, scholar: scholar === url ? undefined : scholar, image: img, citation }));
  }
  const header = `# All publications, newest first. The site shows them in this order.\n#\n# Fields (only title + year are required):\n#   title, year, venue, authors, url, scholar, image, citation (Markdown)\n#   area: one of the ids in content/research-areas.yaml\n#\n# To add a paper, copy an existing entry to the top of the list and edit it.\n\n`;
  await write('publications.yaml', header + yaml(pubs));
  console.log(`  ${pubs.length} publications`);
}

// ---------- news ----------
function isoDate(s) {
  const d = new Date(s + ' UTC');
  return isNaN(d) ? undefined : d.toISOString().slice(0, 10);
}
async function importNews() {
  console.log('News');
  const $ = await load('/news');
  const $raw = await load('/news', { raw: true });
  const slugs = $raw('.w-dyn-item')
    .toArray()
    .filter((it) => $raw(it).find('.news-article-title').length)
    .map((it) => $raw(it).find('a.internal-button').attr('href'));
  const items = $('.w-dyn-item').toArray().filter((it) => $(it).find('.news-article-title').length);
  let n = 0;
  for (const [idx, it] of items.entries()) {
    const $it = $(it);
    const title = clean($it.find('.news-article-title').first().text());
    const dates = $it.find('.hp-feature-date').toArray().map((d) => clean($(d).text())).filter((t) => t && t !== '|');
    const date = isoDate(dates[0]);
    const source = dates[1];
    const description = clean($it.find('.news-description').first().text()) || undefined;
    const external = $it.find('a.external-button').attr('href');
    const internal = $it.find('a.internal-button').attr('href');
    const img = await image(bgUrl($it.find('.news-image').attr('style')), 'news');
    const slugHref = internal || slugs[idx];
    let slug = slugHref ? slugHref.replace(/^\/news\//, '') : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let body = '';
    if (slug) {
      const $d = await load('/news/' + slug);
      if ($d) {
        const rich = $d('.w-richtext').first();
        body = await richToMarkdown($d, rich, 'news');
      }
    }
    const fm = prune({ title, date, source, description, image: img, link: external ? localizeHref(external) : undefined });
    await write(`news/${date ?? 'undated'}-${slug}.md`, frontmatter(fm, body));
    n++;
  }
  console.log(`  ${n} news items`);
}

// ---------- basic content pages ----------
const PAGES = [
  'about-alan',
  'contact-alan',
  'research',
  'quantum-computing',
  'energy-and-functional-materials',
  'ai-for-discovery-and-self-driving-labs',
  'electronic-structure-methods',
  'biophysics-molecular-computers-and-other-topics',
  'open-software-data',
  'open-positions',
  'biography',
  'self-driving-lab',
  'data-download',
];
async function importPages() {
  console.log('Pages');
  for (const slug of PAGES) {
    const $ = await load('/basic-content-page/' + slug);
    if (!$) {
      console.warn(`  ! missing page ${slug}`);
      continue;
    }
    const hero = $('.basic-content-hero');
    const title = clean(hero.find('.page-title').first().text());
    const subtitle = clean(hero.find('.short-optional-statement').first().text()) || undefined;
    const heroImage = await image(bgUrl(hero.find('.bc-image').attr('style')), 'pages');
    const buttons = hero
      .find('a.bc-button')
      .toArray()
      .map((a) => ({ label: clean($(a).text()), url: localizeHref($(a).attr('href')) }))
      .filter((b) => b.label && b.url && b.url !== '#');
    const seen = new Set();
    const uniqButtons = buttons.filter((b) => (seen.has(b.url) ? false : seen.add(b.url)));
    const rich = $('.bc-content-section .w-richtext').first();
    const body = await richToMarkdown($, rich, 'pages');
    await write(`pages/${slug}.md`, frontmatter(prune({ title, subtitle, image: heroImage, buttons: uniqButtons }), body));
  }
}

// ---------- home ----------
async function importHome() {
  console.log('Home');
  const $ = await load('/');
  const slides = [];
  for (const s of $('.hero-slide').toArray()) {
    const title = clean($(s).find('.slider-title').not('.phone').first().text());
    if (!title) continue;
    slides.push(
      prune({
        title,
        text: clean($(s).find('.slider-description').not('.phone').first().text()),
        image: await image(bgUrl($(s).find('.image-div').not('.phone').attr('style')), 'home'),
      }),
    );
  }
  const researchText = clean($('.research-paragraph').first().text());
  await write(
    'home.yaml',
    `# Home page content.\n` +
      yaml({
        hero: slides,
        research: {
          title: 'Our research',
          text: researchText,
          button: { label: 'More about our research', url: '/basic-content-page/research' },
        },
        latestPublications: 6,
        latestNews: 3,
      }),
  );
}

// ---------- static assets (logo, icons, font) ----------
async function importAssets() {
  console.log('Assets');
  const assets = {
    'brand/logo.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc49447371082fe1f5da_matter-lab-logo.svg',
    'brand/favicon-32.png': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc49447371b233e1f600_favicon-2_favicon-32%20copy.png',
    'brand/favicon-256.png': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc4944737163ace1f605_favicon-2-09.png',
    'areas/quantum.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e989309795d7d86b09eac97_quantum.svg',
    'areas/electronic.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e9892f0d50ebc355265618a_electronic.svg',
    'areas/energy.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5eb2cf1ada3d413d98b76e3a_Energy-research-area-icon.svg',
    'areas/biophysics.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5eb2cf1b11df0aa694b281f9_biophysics%20icon.svg',
    'areas/ai.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc494473719fbbe1f5f5_AI-research-area-icon.svg',
    'brand/dots-green.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc49447371609fe1f5f8_green-dot-graphic.svg',
    'brand/dots-blue.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc494473710d6be1f5fa_blue-dot-graphic.svg',
    'brand/graphic-green.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc494473711995e1f5e9_green-graphic.svg',
    'brand/graphic-blue.svg': 'https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc4944737183b0e1f5e3_blue-graphic.svg',
  };
  for (const [rel, url] of Object.entries(assets)) {
    const dest = path.join(IMAGES, rel);
    try {
      await fs.access(dest);
      continue;
    } catch {}
    const res = await fetch(url);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`  + public/images/${rel}`);
  }
  const font = path.join(ROOT, 'public', 'fonts', 'cubano.ttf');
  try {
    await fs.access(font);
  } catch {
    const res = await fetch('https://cdn.prod.website-files.com/5e84cc494473713ec1e1f5af/5e84cc49447371df04e1f5de_cubano-regular-webfont.ttf');
    await fs.mkdir(path.dirname(font), { recursive: true });
    await fs.writeFile(font, Buffer.from(await res.arrayBuffer()));
    console.log('  + public/fonts/cubano.ttf');
  }
}

await importAssets();
await importHome();
await importPeople();
await importPublications();
await importNews();
await importPages();
console.log('Done.');
