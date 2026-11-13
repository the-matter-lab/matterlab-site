import { Link, useParams } from 'react-router';
import { pages, areaByPage, publications } from '../content';
import PageHero from '../components/PageHero';
import Markdown from '../components/Markdown';
import PublicationItem from '../components/PublicationItem';
import NotFound from './NotFound';

export default function ContentPage() {
  const { slug = '' } = useParams();
  const page = pages[slug];
  if (!page) return <NotFound />;
  const area = areaByPage[slug];
  const areaPubs = area ? publications.filter((p) => p.area === area.id) : [];

  return (
    <>
      <PageHero title={page.title} subtitle={page.subtitle} image={page.image} buttons={page.buttons} accent={area?.color} />
      <section className="section light content-section">
        <div className="container narrow">
          <Markdown html={page.html} />
        </div>
      </section>
      {area && areaPubs.length > 0 && (
        <section className="section light area-pubs">
          <div className="container narrow">
            <div className="section-head">
              <h2 className="display section-title dark">Recent papers</h2>
              <Link to={`/publications?area=${area.id}`} className="btn btn-dark">
                All {areaPubs.length} in {area.title}
              </Link>
            </div>
            <ul className="pub-list">
              {areaPubs.slice(0, 5).map((p) => (
                <PublicationItem key={p.title} pub={p} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
