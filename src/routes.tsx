import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import PeoplePage from './pages/People';
import Publications from './pages/Publications';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import ContentPage from './pages/ContentPage';
import SocialMedia from './pages/SocialMedia';
import NotFound from './pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="publications" element={<Publications />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<NewsDetail />} />
        <Route path="social-media" element={<SocialMedia />} />
        <Route path="basic-content-page/:slug" element={<ContentPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

