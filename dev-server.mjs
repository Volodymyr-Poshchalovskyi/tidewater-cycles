// dev-server.mjs — local stand-in for Vercel: static files + /api/* functions.
// Usage: node dev-server.mjs <project-folder> [port]
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const folder = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 3000);
const types = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

function shimRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const file = path.join(folder, 'api', `${name}.js`);
    try {
      const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
      req.query = Object.fromEntries(url.searchParams);
      req.body = await readBody(req);
      return mod.default(req, shimRes(res));
    } catch (err) {
      console.error(err);
      res.statusCode = 404;
      return res.end('No such api route');
    }
  }
  const file = path.join(folder, url.pathname === '/' ? 'index.html' : url.pathname);
  try {
    const data = await fs.readFile(file);
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(port, () => console.log(`Serving ${folder} at http://localhost:${port}`));
