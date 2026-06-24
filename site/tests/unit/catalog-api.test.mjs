import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCatalog, loadLesson } from '../../src/js/catalog-api.js';

test('carrega o catálogo estático', async () => {
  const catalog = { counts: { modules: 28, lessons: 502 } };
  const fetcher = async (url) => ({
    ok: true,
    json: async () => catalog,
    requestedUrl: url,
  });

  assert.deepEqual(await loadCatalog(fetcher), catalog);
});

test('explica quando o catálogo está indisponível', async () => {
  const fetcher = async () => ({ ok: false, status: 503 });

  await assert.rejects(
    () => loadCatalog(fetcher),
    /Catálogo indisponível \(503\)/,
  );
});

test('carrega um fragmento de aula sob demanda', async () => {
  const fetcher = async (url) => ({
    ok: true,
    text: async () => `<p>${url}</p>`,
  });

  assert.equal(
    await loadLesson('content/01/aula.html', fetcher),
    '<p>content/01/aula.html</p>',
  );
});

test('explica quando uma aula está indisponível', async () => {
  const fetcher = async () => ({ ok: false, status: 404 });

  await assert.rejects(
    () => loadLesson('content/01/ausente.html', fetcher),
    /Aula indisponível \(404\)/,
  );
});
