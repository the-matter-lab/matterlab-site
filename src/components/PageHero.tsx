import type { ReactNode } from 'react';
import type { Link as LinkT } from '../content';
import SmartLink from './SmartLink';

interface Props {
  title: string;
  subtitle?: string;
  image?: string;
  buttons?: LinkT[];
  accent?: string;
  light?: boolean;
  children?: ReactNode;
}

export default function PageHero({ title, subtitle, image, buttons, accent, light, children }: Props) {
  return (
    <section className={`page-hero${light ? ' light' : ' dots-bg'}${image ? ' has-image' : ''}`} style={accent ? { ['--c' as string]: accent } : undefined}>
      {image && <div className="page-hero-image" style={{ backgroundImage: `url("${image}")` }} aria-hidden />}
      <div className="container page-hero-inner">
        <div>
          <h1 className="display page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
          {children}
        </div>
        {buttons?.length ? (
          <div className="page-hero-buttons">
            {buttons.map((b) => (
              <SmartLink key={b.url} to={b.url} className="btn btn-green">
                {b.label}
              </SmartLink>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
