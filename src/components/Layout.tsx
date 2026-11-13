import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import { getMeta } from '../meta';

export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.title = getMeta(pathname).title;
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
