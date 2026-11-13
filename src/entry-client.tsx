import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AppRoutes } from './routes';
import './styles.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

// Pages are pre-rendered at build time; in dev the container is empty.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
