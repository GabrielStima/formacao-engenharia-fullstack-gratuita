import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
};

export function contentTypeFor(filePath) {
  return TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

export function safeFilePath(rootDirectory, requestPath) {
  const root = path.resolve(rootDirectory);
  const filePath = path.resolve(root, `.${decodeURIComponent(requestPath)}`);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error('Caminho inválido');
  }

  return filePath;
}

export function startServer(directory = 'dist', port = 4173) {
  const root = path.resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      let filePath = safeFilePath(root, pathname);

      if ((await stat(filePath)).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const content = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
      response.end(content);
    } catch (error) {
      if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Não encontrado');
        return;
      }

      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : 'Requisição inválida');
    }
  });

  return server.listen(Number(port));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer(process.argv[2], process.argv[3]);
}
