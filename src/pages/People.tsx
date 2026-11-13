import { people, type Person } from '../content';
import PageHero from '../components/PageHero';
import SmartLink from '../components/SmartLink';
import Markdown from '../components/Markdown';

const ACCENTS = ['var(--blue)', 'var(--blue)', 'var(--green)', 'var(--blue)'];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

function PersonCard({ p }: { p: Person }) {
  return (
    <li className="person">
      <div className="person-photo">
        {p.photo ? <img src={p.photo} alt={p.name} loading="lazy" /> : <span className="person-initials">{initials(p.name)}</span>}
      </div>
      <h3 className="person-name">{p.name}</h3>
      {p.role && <p className="person-role">{p.role}</p>}
      {p.email && <p className="person-email">{p.email.replace('@', '[at]')}</p>}
      {p.address?.length ? (
        <div className="person-block">
          <h4>Address</h4>
          <p>
            {p.address.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
        </div>
      ) : null}
      {p.areas?.length ? (
        <div className="person-block">
          <h4>Research areas</h4>
          <ul className="person-areas">
            {p.areas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {p.links?.length ? (
        <div className="person-links">
          {p.links.map((l) => (
            <SmartLink key={l.url} to={l.url} className="pill">
              {l.label}
            </SmartLink>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function PeoplePage() {
  return (
    <>
      <PageHero title={people.title} light>
        {people.introHtml && <Markdown html={people.introHtml} className="page-intro" />}
        <nav className="jump-links" aria-label="Sections">
          {people.groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="btn btn-small btn-green">
              {g.title}
            </a>
          ))}
          <a href="#alumni" className="btn btn-small btn-green">
            {people.alumni.title}
          </a>
        </nav>
      </PageHero>

      {people.groups.map((g, i) => (
        <section key={g.id} id={g.id} className="section people-group" style={{ ['--accent' as string]: ACCENTS[i % ACCENTS.length] }}>
          <div className="container">
            <h2 className="display section-title">{g.title}</h2>
            <ul className={`people-grid${g.members.length <= 2 ? ' few' : ''}`}>
              {g.members.map((p) => (
                <PersonCard key={p.name} p={p} />
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section id="alumni" className="section light">
        <div className="container">
          <h2 className="display section-title dark">{people.alumni.title}</h2>
          <div className="alumni-grid">
            {people.alumni.categories.map((c) => (
              <div key={c.title}>
                <h3 className="alumni-title">{c.title}</h3>
                <ul className="alumni-list">
                  {c.people.map((a) => {
                    const name = typeof a === 'string' ? a : a.name;
                    return <li key={name}>{typeof a === 'string' ? a : <SmartLink to={a.url}>{a.name}</SmartLink>}</li>;
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
