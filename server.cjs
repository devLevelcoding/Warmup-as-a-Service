// Cloud Run entry point: the Nest API under /api and the built React app on the same origin.
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
  const { AppModule } = require(find(path.join(__dirname, 'dist'), 'app.module.js'));
  const api = express();
  const nest = await NestFactory.create(AppModule, new ExpressAdapter(api), { logger: ['error', 'warn'] });
  nest.enableCors();
  await nest.init();

  const web = path.join(__dirname, 'frontend', 'dist');
  const app = express();
  app.use('/api', api);
  app.use(express.static(web));
  app.get('*', (_req, res) => res.sendFile(path.join(web, 'index.html')));
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`listening on :${port} (${process.env.TURSO_DATABASE_URL ? 'Turso' : 'local demo data'})`));
}
main().catch(e => { console.error(e); process.exit(1); });
