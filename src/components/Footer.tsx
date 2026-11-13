import { site } from '../content';
import SmartLink from './SmartLink';

export default function Footer() {
  const f = site.footer;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img src={`${import.meta.env.BASE_URL}images/brand/logo.svg`} alt={site.name} className="footer-logo" width={180} height={50} />
          <p className="footer-group">{f.title}</p>
        </div>
        <address className="footer-address">
          {f.address.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </address>
        <div className="footer-actions">
          {f.button && (
            <SmartLink to={f.button.url} className="btn btn-green">
              {f.button.label}
            </SmartLink>
          )}
          {f.social?.length ? (
            <ul className="footer-social">
              {f.social.map((s) => (
                <li key={s.url}>
                  <SmartLink to={s.url}>{s.label}</SmartLink>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}, University of Toronto
        </span>
      </div>
    </footer>
  );
}
