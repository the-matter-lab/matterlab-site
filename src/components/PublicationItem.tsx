import { useState } from 'react';
import { areaById, type Publication } from '../content';
import AreaIcon from './AreaIcon';

export default function PublicationItem({ pub }: { pub: Publication }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const area = pub.area ? areaById[pub.area] : undefined;

  const copy = async () => {
    const text = (pub.citationHtml ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <li className="pub" style={area ? { ['--c' as string]: area.color } : undefined}>
      <div className="pub-media">{pub.image ? <img src={pub.image} alt="" loading="lazy" /> : area ? <AreaIcon area={area} size={72} /> : <span className="area-tile" />}</div>
      <div className="pub-body">
        <p className="pub-meta">
          <span className="pub-year">{pub.year}</span>
          {pub.venue && <span className="pub-venue">{pub.venue}</span>}
        </p>
        <h3 className="pub-title">
          {pub.url ? (
            <a href={pub.url} target="_blank" rel="noopener noreferrer">
              {pub.title}
            </a>
          ) : (
            pub.title
          )}
        </h3>
        {pub.authors && <p className="pub-authors">{pub.authors}</p>}
        <div className="pub-actions">
          {area && <span className="tag">{area.title}</span>}
          {pub.citationHtml && (
            <button className="link-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span className="plus" aria-hidden>
                {open ? '−' : '+'}
              </span>
              Citation
            </button>
          )}
          {pub.url && (
            <a className="link-btn" href={pub.url} target="_blank" rel="noopener noreferrer">
              Link to publication ↗
            </a>
          )}
          {pub.scholar && (
            <a className="link-btn" href={pub.scholar} target="_blank" rel="noopener noreferrer">
              Google Scholar ↗
            </a>
          )}
        </div>
        {open && pub.citationHtml && (
          <div className="pub-citation">
            <p dangerouslySetInnerHTML={{ __html: pub.citationHtml }} />
            <button className="btn btn-small btn-dark" onClick={copy}>
              {copied ? 'Copied!' : 'Copy citation'}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
