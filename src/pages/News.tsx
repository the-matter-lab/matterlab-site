import { news } from '../content';
import PageHero from '../components/PageHero';
import NewsCard from '../components/NewsCard';

export default function News() {
  return (
    <>
      <PageHero title="News" />
      <section className="section dots-bg news-section">
        <div className="container">
          <div className="news-grid">
            {news.map((n, i) => (
              <NewsCard key={n.slug} item={n} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
