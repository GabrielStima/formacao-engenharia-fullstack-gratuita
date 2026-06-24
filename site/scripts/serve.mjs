import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
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
    const error = new Error('Caminho inválido');
    error.code = 'INVALID_REQUEST_PATH';
    throw error;
  }

  return filePath;
}

export async function safeRealFilePath(rootDirectory, filePath) {
  const [root, target] = await Promise.all([
    realpath(rootDirectory),
    realpath(filePath),
  ]);

  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    const error = new Error('Caminho inválido');
    error.code = 'OUTSIDE_ROOT';
    throw error;
  }

  return target;
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

      filePath = await safeRealFilePath(root, filePath);
      const content = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
      response.end(content);
    } catch (error) {
      if (
        error?.code === 'ENOENT'
        || error?.code === 'ENOTDIR'
        || error?.code === 'OUTSIDE_ROOT'
      ) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Não encontrado');
        return;
      }

      if (error instanceof URIError || error?.code === 'INVALID_REQUEST_PATH') {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Requisição inválida');
        return;
      }

      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Erro interno');
    }
  });

  return server.listen(Number(port));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer(process.argv[2], process.argv[3]);
}
