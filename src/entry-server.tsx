import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppRoutes } from './routes';
export { allPaths, getMeta } from './meta';
export { site } from './content';

export const base = import.meta.env.BASE_URL;

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
}
