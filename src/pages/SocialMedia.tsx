import { createElement, useEffect } from 'react';
import { site } from '../content';
import PageHero from '../components/PageHero';
import SmartLink from '../components/SmartLink';

const BSKY_EMBED = 'https://cdn.jsdelivr.net/npm/bsky-embed@0.3.0/dist/bsky-embed.es.js';

export default function SocialMedia() {
  const handle = site.social.bluesky;

  useEffect(() => {
    if (!handle || document.querySelector(`script[src="${BSKY_EMBED}"]`)) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.async = true;
    s.src = BSKY_EMBED;
    document.head.appendChild(s);
  }, [handle]);

  return (
    <>
      <PageHero title={site.social.title} subtitle={site.social.intro}>
        <div className="btn-row">
          {site.footer.social?.map((s) => (
            <SmartLink key={s.url} to={s.url} className="btn btn-small btn-outline">
              {s.label} ↗
            </SmartLink>
          ))}
        </div>
      </PageHero>
      {handle && (
        <section className="section dots-bg">
          <div className="container narrow bsky">
            {createElement('bsky-embed', {
              username: handle,
              mode: 'dark',
              limit: '8',
              'link-target': '_blank',
              'link-image': 'true',
              'load-more': 'true',
              'custom-styles': '.border-slate-300 { border-color: #12f98b; }',
            })}
            <noscript>
              <a href={`https://bsky.app/profile/${handle}`}>See our posts on Bluesky</a>
            </noscript>
          </div>
        </section>
      )}
    </>
  );
}
