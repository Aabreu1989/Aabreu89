import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Populate process.env for local API routes
dotenv.config();

function apiServerlessMiddleware() {
  return {
    name: 'mira-api-serverless',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          dotenv.config();

          const urlParsed = new URL(req.url, 'http://localhost');
          const urlPath = urlParsed.pathname; // e.g. /api/admin
          const modulePath = `.${urlPath}.js`; // e.g. ./api/admin.js

          // Populate req.query from URL search params (mirrors Vercel behaviour)
          const queryObj: Record<string, string> = {};
          urlParsed.searchParams.forEach((value, key) => { queryObj[key] = value; });
          req.query = queryObj;

          
          let body = {};
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString('utf-8');
            if (rawBody) {
              try { body = JSON.parse(rawBody); } catch (e) {}
            }
          }
          req.body = body;

          // Mock Vercel response helper methods
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          const apiModule = await server.ssrLoadModule(modulePath);
          const handler = apiModule.default || apiModule;
          await handler(req, res);
        } catch (err) {
          console.error(`🚨 [MIRA API LOCALHOST] Erro em ${req.url}:`, err.message);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Erro interno na API local' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiServerlessMiddleware()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
