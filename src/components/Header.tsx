import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { site } from '../content';
import SmartLink from './SmartLink';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}>
      <div className="header-inner">
        <Link to="/" className="brand" aria-label={`${site.name} home`}>
          <img src={`${import.meta.env.BASE_URL}images/brand/logo.svg`} alt={site.name} width={200} height={55} />
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
          <span className="sr-only">Menu</span>
          <span className="bars" aria-hidden />
        </button>
        <nav id="site-nav" className="site-nav" aria-label="Main">
          <ul>
            {site.nav.map((item) => (
              <li key={item.label} className={item.children?.length ? 'has-children' : undefined}>
                <SmartLink to={item.url} nav className="nav-link">
                  {item.label}
                  {item.children?.length ? (
                    <svg className="caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ) : null}
                </SmartLink>
                {item.children?.length ? (
                  <ul className="submenu">
                    {item.children.map((c) => (
                      <li key={c.url}>
                        <SmartLink to={c.url} nav className="submenu-link">
                          {c.label}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
