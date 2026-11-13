import { useState } from 'react';
import { Link } from 'react-router';
import { home, areas, publications, news, site } from '../content';
import SmartLink from '../components/SmartLink';
import PublicationItem from '../components/PublicationItem';
import NewsCard from '../components/NewsCard';

export default function Home() {
  const [slide, setSlide] = useState(0);
  const hero = home.hero[slide] ?? home.hero[0];
  const latestPubs = publications.slice(0, home.latestPublications);
  const latestNews = news.slice(0, home.latestNews);

  return (
    <>
      <section className="hero dots-bg">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{site.group} · University of Toronto</p>
            <h1 className="display hero-title">{hero.title}</h1>
            <p className="hero-text">{hero.text}</p>
            <div className="btn-row">
              <Link to="/basic-content-page/research" className="btn btn-green">
                Our research
              </Link>
              <Link to="/basic-content-page/open-positions" className="btn btn-outline">
                Join us
              </Link>
            </div>
            {home.hero.length > 1 && (
              <div className="slide-dots" role="tablist" aria-label="Slides">
                {home.hero.map((h, i) => (
                  <button key={h.title} role="tab" aria-selected={i === slide} aria-label={h.title} onClick={() => setSlide(i)} className={i === slide ? 'on' : ''} />
                ))}
              </div>
            )}
          </div>
          {hero.image && (
            <figure className="hero-figure">
              <img src={hero.image} alt={`${site.name} group photo`} fetchPriority="high" />
              <img className="hero-dots" src={`${import.meta.env.BASE_URL}images/brand/dots-green.svg`} alt="" aria-hidden />
            </figure>
          )}
        </div>
      </section>

      <section className="section research-home">
        <div className="container research-home-grid">
          <div>
            <h2 className="display section-title">
              Research
              <br />
              areas
            </h2>
            <div className="bubbles">
              {areas.map((a, i) => (
                <Link key={a.id} to={`/basic-content-page/${a.page}`} className={`bubble bubble-${i}`} style={{ ['--c' as string]: a.color }}>
                  <span className="bubble-disc">
                    <img src={a.icon} alt="" />
                  </span>
                  <span className="bubble-label">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="research-home-copy">
            <h2 className="display section-title">{home.research.title}</h2>
            <p className="lead">{home.research.text}</p>
            {home.research.button && (
              <SmartLink to={home.research.button.url} className="btn btn-green">
                {home.research.button.label}
              </SmartLink>
            )}
          </div>
        </div>
      </section>

      <section className="section light">
        <div className="container">
          <div className="section-head">
            <h2 className="display section-title dark">Recent publications</h2>
            <Link to="/publications" className="btn btn-dark">
              All {publications.length} publications
            </Link>
          </div>
          <ul className="pub-list">
            {latestPubs.map((p) => (
              <PublicationItem key={p.title} pub={p} />
            ))}
          </ul>
        </div>
      </section>

      {latestNews.length > 0 && (
        <section className="section dots-bg">
          <div className="container">
            <div className="section-head">
              <h2 className="display section-title green">News</h2>
              <Link to="/news" className="btn btn-yellow">
                All news
              </Link>
            </div>
            <div className="news-grid">
              {latestNews.map((n, i) => (
                <NewsCard key={n.slug} item={n} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
