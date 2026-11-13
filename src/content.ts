/**
 * Typed access to everything in /content. Edit the files in /content, not this.
 */
import siteData from '../content/site.yaml';
import homeData from '../content/home.yaml';
import peopleData from '../content/people.yaml';
import publicationsData from '../content/publications.yaml';
import areasData from '../content/research-areas.yaml';

export interface Link {
  label: string;
  url: string;
}
export interface NavItem extends Link {
  children?: Link[];
}
export interface Site {
  name: string;
  group: string;
  description: string;
  url: string;
  nav: NavItem[];
  footer: { title: string; address: string[]; button?: Link; social?: Link[] };
  social: { title: string; intro?: string; bluesky?: string };
}
export interface Home {
  hero: { title: string; text: string; image?: string }[];
  research: { title: string; text: string; button?: Link };
  latestPublications: number;
  latestNews: number;
}
export interface Person {
  name: string;
  role?: string;
  email?: string;
  photo?: string;
  address?: string[];
  areas?: string[];
  links?: Link[];
}
export interface PeopleGroup {
  id: string;
  title: string;
  members: Person[];
}
export interface People {
  title: string;
  intro?: string;
  introHtml?: string;
  groups: PeopleGroup[];
  alumni: { title: string; categories: { title: string; people: (string | { name: string; url: string })[] }[] };
}
export interface Publication {
  title: string;
  year: number;
  venue?: string;
  authors?: string;
  area?: string;
  url?: string;
  scholar?: string;
  image?: string;
  citation?: string;
  citationHtml?: string;
}
export interface ResearchArea {
  id: string;
  title: string;
  label: string;
  color: string;
  icon: string;
  page: string;
}
export interface MarkdownDoc {
  slug: string;
  title: string;
  html: string;
}
export interface Page extends MarkdownDoc {
  subtitle?: string;
  image?: string;
  buttons?: Link[];
  description?: string;
}
export interface NewsItem extends MarkdownDoc {
  date?: string;
  source?: string;
  description?: string;
  image?: string;
  link?: string;
}

export const site = siteData as Site;
export const home = homeData as Home;
export const people = peopleData as People;
export const publications = publicationsData as Publication[];
export const areas = areasData as ResearchArea[];
export const areaById = Object.fromEntries(areas.map((a) => [a.id, a])) as Record<string, ResearchArea>;
export const areaByPage = Object.fromEntries(areas.map((a) => [a.page, a])) as Record<string, ResearchArea>;

const pageModules = import.meta.glob<Page>('../content/pages/*.md', { eager: true, import: 'default' });
export const pages: Record<string, Page> = Object.fromEntries(Object.values(pageModules).map((p) => [p.slug, p]));

const newsModules = import.meta.glob<NewsItem>('../content/news/*.md', { eager: true, import: 'default' });
export const news: NewsItem[] = Object.values(newsModules).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
export const newsBySlug: Record<string, NewsItem> = Object.fromEntries(news.map((n) => [n.slug, n]));

/** A news item gets its own page only when it has a body. */
export const hasNewsPage = (n: NewsItem) => n.html.trim().length > 0;

export function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
