import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
dotenv.config()

function miraApiPlugin() {
  return {
    name: 'mira-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/register') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {};
              req.body = parsedBody;
              res.status = (code: number) => { res.statusCode = code; return res; };
              res.json = (payload: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload));
                return res;
              };
              const { default: registerHandler } = await import('./api/register.js');
              await registerHandler(req, res);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/recover') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {};
              req.body = parsedBody;
              res.status = (code: number) => { res.statusCode = code; return res; };
              res.json = (payload: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload));
                return res;
              };
              const { default: recoverHandler } = await import('./api/recover.js');
              await recoverHandler(req, res);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), miraApiPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
