import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const imglyDataBase = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);

    if (pathname.startsWith('/imgly-data/')) {
      await proxyImglyAsset(pathname, response);
      return;
    }

    const requestedPath = normalize(join(root, pathname));

    if (!requestedPath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const body = await readFile(requestedPath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(requestedPath).toLowerCase()] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

server.listen(port, () => {
  console.log(`HD Background Remover running at http://localhost:${port}/`);
});

async function proxyImglyAsset(pathname, response) {
  const assetName = pathname.replace(/^\/imgly-data\/?/, '');

  if (!assetName || assetName.includes('..')) {
    response.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('Bad asset path');
    return;
  }

  const upstreamUrl = new URL(assetName, imglyDataBase);
  const upstream = await fetch(upstreamUrl);

  if (!upstream.ok || !upstream.body) {
    response.writeHead(upstream.status || 502, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('Unable to load model asset');
    return;
  }

  const headers = {
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': assetName === 'resources.json' ? 'public, max-age=3600' : 'public, max-age=31536000, immutable'
  };
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    headers['Content-Length'] = contentLength;
  }

  response.writeHead(upstream.status, headers);

  Readable.fromWeb(upstream.body).pipe(response);
}
