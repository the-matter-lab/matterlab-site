import { Link, useParams } from 'react-router';
import { newsBySlug, hasNewsPage, formatDate } from '../content';
import PageHero from '../components/PageHero';
import Markdown from '../components/Markdown';
import NotFound from './NotFound';

export default function NewsDetail() {
  const { slug = '' } = useParams();
  const item = newsBySlug[slug];
  if (!item || !hasNewsPage(item)) return <NotFound />;
  return (
    <>
      <PageHero title={item.title} subtitle={[formatDate(item.date), item.source].filter(Boolean).join(' · ')} />
      <section className="section light content-section">
        <div className="container narrow">
          {item.image && <img className="news-detail-image" src={item.image} alt="" />}
          <Markdown html={item.html} />
          <div className="btn-row">
            {item.link && (
              <a className="btn btn-green" href={item.link} target="_blank" rel="noopener noreferrer">
                Read the original ↗
              </a>
            )}
            <Link className="btn btn-dark" to="/news">
              ← All news
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
