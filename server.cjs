// Cloud Run entry point, one origin per demo:
//   /        the product's sales page (landing/index.html, copied from sassdesk.com/project/<slug>/)
//   /admin/  the CRM app itself (frontend/dist)
//   /api/    the Nest API (and Socket.IO at /socket.io for apps with a gateway)
// One Express app and Nest's own listen(), so WebSocket gateways attach to the server that serves.
// (src/main.ts and api/index.ts stay as they are for local dev and the old Vercel/Render setup.)
require('reflect-metadata');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');

// tsc writes app.module.js to dist/ or dist/src/ depending on the tsconfig; find it either way.
function find(dir, name) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { const hit = find(p, name); if (hit) return hit; }
    else if (f.name === name) return p;
  }
  return null;
}

async function main() {
  const web = path.join(__dirname, 'frontend', 'dist');
  const landing = path.join(__dirname, 'landing', 'index.html');
  const app = express();
  // Pages first; everything else falls through to Nest under /api.
  app.get('/', (_req, res) => (fs.existsSync(landing) ? res.sendFile(landing) : res.redirect('/admin/')));
  app.get('/admin', (_req, res) => res.redirect(301, '/admin/'));
  app.use('/admin', express.static(web));
  app.get('/admin/*', (_req, res) => res.sendFile(path.join(web, 'index.html')));

  const { AppModule } = require(find(path.join(__dirname, 'dist'), 'app.module.js'));
  const nest = await NestFactory.create(AppModule, new ExpressAdapter(app), { logger: ['error', 'warn'] });
  nest.setGlobalPrefix('api');
  nest.enableCors();
  const port = process.env.PORT || 8080;
  await nest.listen(port);
  console.log(`listening on :${port} (${process.env.TURSO_DATABASE_URL ? 'Turso' : 'local demo data'})`);
}
main().catch(e => { console.error(e); process.exit(1); });
