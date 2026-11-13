import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import content from './content-plugin.ts';

/** Make `vite preview` serve /people -> dist/people/index.html like real static hosts do. */
function prerenderedPreview(): Plugin {
  return {
    name: 'prerendered-preview',
    configurePreviewServer(server) {
      const outDir = path.resolve(server.config.root, server.config.build.outDir);
      const base = server.config.base.replace(/\/$/, '');
      server.middlewares.use((req, _res, next) => {
        const [full, query = ''] = (req.url ?? '/').split('?');
        if (base && !full.startsWith(base)) return next();
        const pathname = full.slice(base.length) || '/';
        if (!path.extname(pathname)) {
          const file = path.join(outDir, decodeURIComponent(pathname), 'index.html');
          if (fs.existsSync(file)) req.url = base + path.posix.join(pathname, 'index.html') + (query ? `?${query}` : '');
          else if (pathname !== '/') req.url = base + '/404.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // Deploying under a sub-path (e.g. GitHub Pages without a custom domain): BASE_PATH=/repo-name/
  base: process.env.BASE_PATH || '/',
  plugins: [content(), react(), prerenderedPreview()],
});
