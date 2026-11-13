import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { areas, publications } from '../content';
import PublicationItem from '../components/PublicationItem';
import PageHero from '../components/PageHero';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const index = publications.map((p) => norm([p.title, p.authors, p.venue, p.year].filter(Boolean).join(' ')));
const years = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);

export default function Publications() {
  const [params, setParams] = useSearchParams();
  // Pre-rendered HTML has no query string: only read it after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const q = mounted ? (params.get('q') ?? '') : '';
  const area = mounted ? (params.get('area') ?? '') : '';
  const year = mounted ? (params.get('year') ?? '') : '';

  const update = (key: string, value: string) => {
    // Read the live URL (not the render-time copy) so fast successive changes don't clobber each other.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const filtered = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return publications.filter((p, i) => {
      if (area && p.area !== area) return false;
      if (year && String(p.year) !== year) return false;
      return terms.every((t) => index[i].includes(t));
    });
  }, [q, area, year]);

  const grouped = useMemo(() => {
    const m = new Map<number, typeof filtered>();
    for (const p of filtered) {
      if (!m.has(p.year)) m.set(p.year, []);
      m.get(p.year)!.push(p);
    }
    return [...m.entries()];
  }, [filtered]);

  const active = q || area || year;

  return (
    <>
      <PageHero title="Publications" light />
      <section className="section light pubs-section">
        <div className="container">
          <div className="pub-filters" role="search">
            <label className="search">
              <span className="sr-only">Search publications</span>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input type="search" placeholder="Search title, author, journal…" value={q} onChange={(e) => update('q', e.target.value)} />
            </label>
            <label className="select">
              <span className="sr-only">Year</span>
              <select value={year} onChange={(e) => update('year', e.target.value)}>
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="area-chips" role="group" aria-label="Filter by research area">
            {areas.map((a) => (
              <button key={a.id} className={`chip${area === a.id ? ' on' : ''}`} style={{ ['--c' as string]: a.color }} aria-pressed={area === a.id} onClick={() => update('area', area === a.id ? '' : a.id)}>
                <span className="chip-dot" aria-hidden />
                {a.title}
              </button>
            ))}
          </div>
          <p className="pub-count" aria-live="polite">
            {filtered.length} of {publications.length} publications
            {active && (
              <button className="link-btn" onClick={() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true })}>
                Clear filters
              </button>
            )}
          </p>
          {grouped.map(([y, list]) => (
            <div key={y} className="pub-year-group">
              <h2 className="pub-year-heading display">{y}</h2>
              <ul className="pub-list">
                {list.map((p) => (
                  <PublicationItem key={p.title + p.year} pub={p} />
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && <p className="empty">No publications match these filters.</p>}
        </div>
      </section>
    </>
  );
}
