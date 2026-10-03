import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
      resolve();
    });
  });
}

async function handleApi(req, res, path) {
  try {
    await parseBody(req);
    res.status = function (code) { this.statusCode = code; return this; };
    res.json = function (data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
    };
    res.send = function (data) { this.end(data); return this; };
    req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
    const { default: handler } = await import(new URL(`./api${path}.mjs`, import.meta.url).href);
    await handler(req, res);
  } catch (err) {
    console.error(`API error [${path}]:`, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    build: {
      target: 'es2018',
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            ],
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (new URL(req.url, 'http://localhost').pathname === '/api/course-pdf') return handleApi(req, res, '/course-pdf');
            if (req.url.startsWith('/api/send-email')) return handleApi(req, res, '/send-email');
            if (req.url.startsWith('/api/create-student')) return handleApi(req, res, '/create-student');
            if (req.url.startsWith('/api/send-push')) return handleApi(req, res, '/send-push');
            if (req.url.startsWith('/api/save-subscription')) return handleApi(req, res, '/save-subscription');
            if (req.url.startsWith('/api/vapid-public-key')) return handleApi(req, res, '/_vapid-public-key');
            if (req.url.startsWith('/api/send-signup-otp')) return handleApi(req, res, '/send-signup-otp');
            if (req.url.startsWith('/api/verify-signup')) return handleApi(req, res, '/verify-signup');
            if (req.url.startsWith('/api/backup')) return handleApi(req, res, '/backup');
            if (req.url.startsWith('/api/create-order')) return handleApi(req, res, '/create-order');
            if (req.url.startsWith('/api/order-status')) return handleApi(req, res, '/order-status');
            if (req.url.startsWith('/api/sales-plans')) return handleApi(req, res, '/sales-plans');
            if (req.url.startsWith('/api/cashfree-webhook')) return handleApi(req, res, '/cashfree-webhook');
            next();
          });
        },
      },
    ],
  };
})
