import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { contentTypeFor, safeFilePath, startServer } from '../../scripts/serve.mjs';

async function serveForTest(t, root) {
  const server = startServer(root, 0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function temporaryRoot(t, prefix) {
  const workspace = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(() => rm(workspace, { recursive: true, force: true }));

  const root = path.join(workspace, 'dist');
  await mkdir(root);
  return { root, workspace };
}

test('returns the expected content types', () => {
  assert.equal(contentTypeFor('catalog.json'), 'application/json; charset=utf-8');
  assert.equal(contentTypeFor('app.js'), 'text/javascript; charset=utf-8');
});

test('rejects paths that traverse outside the distribution directory', () => {
  assert.throws(
    () => safeFilePath('/tmp/dist', '/../README.md'),
    /Caminho inválido/,
  );
});

test('serves index.html for a directory request', async (t) => {
  const { root } = await temporaryRoot(t, 'serve-index-');
  await writeFile(path.join(root, 'index.html'), '<h1>Mapa visual</h1>');

  const origin = await serveForTest(t, root);
  const response = await fetch(`${origin}/`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(await response.text(), '<h1>Mapa visual</h1>');
});

test('returns 404 for a missing file', async (t) => {
  const { root } = await temporaryRoot(t, 'serve-missing-');
  const origin = await serveForTest(t, root);
  const response = await fetch(`${origin}/missing.html`);

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Não encontrado');
});

test('returns a generic 400 response for a malformed URI', async (t) => {
  const { root } = await temporaryRoot(t, 'serve-malformed-');
  const origin = await serveForTest(t, root);
  const response = await fetch(`${origin}/%E0%A4%A`);

  assert.equal(response.status, 400);
  assert.equal(await response.text(), 'Requisição inválida');
});

test('does not serve a file reached through a symlink outside the root', async (t) => {
  const { root, workspace } = await temporaryRoot(t, 'serve-symlink-');
  const outside = path.join(workspace, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'secret.txt'), 'conteúdo externo');
  await symlink(path.join(outside, 'secret.txt'), path.join(root, 'leak.txt'));

  const origin = await serveForTest(t, root);
  const response = await fetch(`${origin}/leak.txt`);

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Não encontrado');
});
