import { site, pages, people, news, newsBySlug, hasNewsPage } from './content';

/** Every URL that gets a pre-rendered HTML file at build time. */
export function allPaths(): string[] {
  return [
    '/',
    '/people',
    '/publications',
    '/news',
    '/social-media',
    ...Object.keys(pages).map((s) => `/basic-content-page/${s}`),
    ...news.filter(hasNewsPage).map((n) => `/news/${n.slug}`),
  ];
}

export interface Meta {
  title: string;
  description: string;
  image?: string;
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

export function getMeta(pathname: string): Meta {
  const p = pathname.replace(/\/+$/, '') || '/';
  const t = (x: string) => `${x} | ${site.name}`;
  if (p === '/') return { title: `${site.name} | ${site.group}`, description: site.description };
  if (p === '/people') return { title: t('People'), description: clip(strip(people.introHtml ?? site.description)) };
  if (p === '/publications') return { title: t('Publications'), description: `Publications of ${site.name} at the University of Toronto.` };
  if (p === '/news') return { title: t('News'), description: `News from ${site.name}.` };
  if (p === '/social-media') return { title: t(site.social.title), description: site.social.intro ?? site.description };
  let m = /^\/basic-content-page\/([^/]+)$/.exec(p);
  if (m && pages[m[1]]) {
    const pg = pages[m[1]];
    return { title: t(pg.title), description: clip(pg.description ?? pg.subtitle ?? (strip(pg.html) || site.description)), image: pg.image };
  }
  m = /^\/news\/([^/]+)$/.exec(p);
  if (m && newsBySlug[m[1]]) {
    const n = newsBySlug[m[1]];
    return { title: t(n.title), description: clip(n.description ?? strip(n.html)), image: n.image };
  }
  return { title: t('Page not found'), description: site.description };
}
