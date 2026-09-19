// Local sample data only. Keep this directory out of the published Function package.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\//, ''));
const { handleFeedback } = await import(pathToFileURL(resolve(root, 'functions/handler.mjs')).href);
const port = Number(process.argv[2] ?? 8010);
const rows = [];

function builder() {
  const st = { filters: [], op: 'select', insertRow: null };
  const apply = () => rows.filter((r) => st.filters.every((f) => f(r)));
  const api = {
    select() { return api; },
    order() { return api; },
    eq(col, val) { st.filters.push((r) => r[col] === val); return api; },
    gte(col, val) { st.filters.push((r) => r[col] >= val); return api; },
    limit(n) { st.op = 'read'; st.n = n; return Promise.resolve({ data: apply().slice(0, n), error: null }); },
    range(a, b) { st.op = 'read'; return Promise.resolve({ data: apply().slice(a, b + 1), error: null }); },
    insert(row) { st.op = 'insert'; st.insertRow = row; return api; },
    single() {
      if (st.op !== 'insert') return Promise.resolve({ data: null, error: { message: 'fixture misuse' } });
      const bad = ['id', 'nickname', 'content', 'created_at'].some((k) => typeof st.insertRow[k] !== 'string' || st.insertRow[k] === '');
      if (bad) return Promise.resolve({ data: null, error: { message: 'fixture not null violated' } });
      rows.push(st.insertRow);
      return Promise.resolve({ data: st.insertRow, error: null });
    },
  };
  return api;
}
const supabase = { from: () => builder() };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/functions/v1/app') {
      const chunks = [];
      for await (const c of incoming) chunks.push(c);
      const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
      const request = new Request(url, {
        method: incoming.method,
        headers: incoming.headers,
        body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : body,
      });
      const response = await handleFeedback({ request, supabase });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = resolve(root, 'public', '.' + rel);
    if (!file.startsWith(resolve(root, 'public'))) { outgoing.writeHead(403); outgoing.end(); return; }
    const data = await readFile(file);
    outgoing.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    outgoing.end(data);
  } catch {
    outgoing.writeHead(500, { 'content-type': 'application/json' });
    outgoing.end('{"error":"local_preview_failed"}');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local sample preview: http://127.0.0.1:${server.address().port}/`));
