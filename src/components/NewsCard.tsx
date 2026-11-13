import { areas, formatDate, hasNewsPage, type NewsItem } from '../content';
import AreaIcon from './AreaIcon';
import SmartLink from './SmartLink';

export default function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const area = areas[index % areas.length];
  const href = hasNewsPage(item) ? `/news/${item.slug}` : item.link;
  return (
    <article className="news-card" style={{ ['--c' as string]: area.color }}>
      <div className="news-media">{item.image ? <img src={item.image} alt="" loading="lazy" /> : <AreaIcon area={area} size={120} />}</div>
      <div className="news-body">
        <p className="news-meta">
          {formatDate(item.date)}
          {item.source && <span> · {item.source}</span>}
        </p>
        <h3 className="news-title">{href ? <SmartLink to={href}>{item.title}</SmartLink> : item.title}</h3>
        {item.description && <p className="news-desc">{item.description}</p>}
        {href && (
          <SmartLink to={href} className="btn btn-small btn-accent">
            Read more
          </SmartLink>
        )}
      </div>
    </article>
  );
}
